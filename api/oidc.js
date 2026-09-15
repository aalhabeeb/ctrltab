// OIDC-login (Authorization Code Flow + PKCE) tegen een externe provider,
// in dit geval Authentik.
//
// WAAROM GEEN FORWARD-AUTH MET EEN VERTROUWDE HEADER
//   De goedkope variant is een proxy die `X-authentik-username` zet en een app die
//   die header gelooft. Dat werkt alleen zolang de app NOOIT buiten die proxy om
//   bereikbaar is: binnen een cluster is de Service dat wel degelijk, en dan is
//   inloggen als willekeurige gebruiker een kwestie van één header meesturen.
//   Deze route praat rechtstreeks met de provider en vertrouwt geen enkele header.
//
// WAAROM GEEN openid-client
//   De hele flow is hieronder zo'n 150 regels met alleen de standaardbibliotheek:
//   `fetch` zit in Node, `crypto.createPublicKey` leest een JWK rechtstreeks, en
//   `jsonwebtoken` zat er al in voor de eigen sessietokens. Eén dependency minder
//   in een app die verder nauwelijks dependencies heeft.
//
// WAT ER GECONTROLEERD WORDT
//   - `state`  — bindt de callback aan de browser die de flow startte (CSRF)
//   - `nonce`  — bindt het id_token aan díe ene autorisatie (replay)
//   - PKCE S256 — een onderschepte `code` is zonder de verifier waardeloos
//   - handtekening, `iss`, `aud` en `exp` van het id_token, tegen de JWKS van de
//     provider
//
// De lokale login blijft gewoon bestaan. Dat is bewust: valt de provider uit, dan
// wil je er nog in kunnen met het admin-account.

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ISSUER = (process.env.OIDC_ISSUER || '').replace(/\/+$/, '');
const CLIENT_ID = process.env.OIDC_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.OIDC_REDIRECT_URI || '';
const SCOPES = process.env.OIDC_SCOPES || 'openid profile email';
const BUTTON_LABEL = process.env.OIDC_BUTTON_LABEL || 'Log in with Authentik';
const USERNAME_CLAIM = process.env.OIDC_USERNAME_CLAIM || 'preferred_username';
const ADMIN_GROUP = process.env.OIDC_ADMIN_GROUP || '';
// Standaard aan: zonder automatisch aanmaken kan niemand naar binnen die nog geen
// lokaal account heeft, en dat is precies wat je met SSO wilde vermijden.
const ALLOW_SIGNUP = (process.env.OIDC_ALLOW_SIGNUP || 'true').toLowerCase() !== 'false';

const enabled = Boolean(ISSUER && CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);

const STATE_COOKIE = 'ctrltab-oidc';
const STATE_TTL_SECONDS = 600;

let discoveryCache = null;
let jwksCache = null;

async function discover() {
  if (discoveryCache) return discoveryCache;
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`Discovery failed: HTTP ${res.status}`);
  discoveryCache = await res.json();
  return discoveryCache;
}

// De JWKS wordt gecachet, maar bij een onbekende `kid` één keer opnieuw opgehaald:
// providers rouleren hun sleutels, en dan moet je niet wachten op een herstart.
async function getKey(kid) {
  const meta = await discover();
  if (!jwksCache) {
    const res = await fetch(meta.jwks_uri);
    if (!res.ok) throw new Error(`JWKS fetch failed: HTTP ${res.status}`);
    jwksCache = await res.json();
  }
  let jwk = jwksCache.keys.find(k => k.kid === kid);
  if (!jwk) {
    const res = await fetch(meta.jwks_uri);
    if (!res.ok) throw new Error(`JWKS refresh failed: HTTP ${res.status}`);
    jwksCache = await res.json();
    jwk = jwksCache.keys.find(k => k.kid === kid);
  }
  if (!jwk) throw new Error(`No JWKS key for kid ${kid}`);
  return crypto.createPublicKey({ key: jwk, format: 'jwk' });
}

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

// De flow-state (state, nonce, code_verifier) gaat als kortlevend, met JWT_SECRET
// ondertekend cookie mee. Geen serverside sessieopslag nodig, en de client kan er
// niets aan veranderen zonder de handtekening te breken.
function setStateCookie(res, value, secure) {
  const attrs = [
    `${STATE_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/api/auth/oidc',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${STATE_TTL_SECONDS}`
  ];
  if (secure) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearStateCookie(res, secure) {
  const attrs = [`${STATE_COOKIE}=`, 'Path=/api/auth/oidc', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function isSecureRequest(req) {
  return req.secure || (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

function claimToUsername(claims) {
  const raw = claims[USERNAME_CLAIM] || claims.email || claims.sub;
  if (!raw) return null;
  return String(raw).includes('@') && USERNAME_CLAIM === 'email'
    ? String(raw).split('@')[0]
    : String(raw);
}

function isAdminFromClaims(claims) {
  if (!ADMIN_GROUP) return null; // geen groepskoppeling geconfigureerd: niets afdwingen
  const groups = claims.groups || claims.roles || [];
  return Array.isArray(groups) && groups.includes(ADMIN_GROUP);
}

/**
 * Mount de OIDC-routes.
 *
 * @param {import('express').Express} app
 * @param {object} deps
 * @param {import('better-sqlite3').Database} deps.db
 * @param {string} deps.jwtSecret
 * @param {typeof import('bcrypt')} deps.bcrypt
 */
function register(app, { db, jwtSecret, bcrypt }) {
  // De loginpagina vraagt dit op om te bepalen of de knop getoond wordt. Bewust
  // zonder authenticatie: het lekt alleen of SSO aanstaat en hoe de knop heet.
  app.get('/api/auth/oidc/config', (req, res) => {
    res.json({ enabled, label: BUTTON_LABEL });
  });

  if (!enabled) {
    if (ISSUER || CLIENT_ID || CLIENT_SECRET || REDIRECT_URI) {
      console.warn(
        'OIDC is niet compleet geconfigureerd en blijft uit. Vereist: ' +
        'OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET en OIDC_REDIRECT_URI.'
      );
    }
    return;
  }

  console.log(`OIDC ingeschakeld: issuer ${ISSUER}, redirect ${REDIRECT_URI}`);

  app.get('/api/auth/oidc/login', async (req, res) => {
    try {
      const meta = await discover();

      const state = base64url(crypto.randomBytes(24));
      const nonce = base64url(crypto.randomBytes(24));
      const codeVerifier = base64url(crypto.randomBytes(48));
      const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());

      const flow = jwt.sign({ state, nonce, codeVerifier }, jwtSecret, { expiresIn: STATE_TTL_SECONDS });
      setStateCookie(res, flow, isSecureRequest(req));

      const url = new URL(meta.authorization_endpoint);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', CLIENT_ID);
      url.searchParams.set('redirect_uri', REDIRECT_URI);
      url.searchParams.set('scope', SCOPES);
      url.searchParams.set('state', state);
      url.searchParams.set('nonce', nonce);
      url.searchParams.set('code_challenge', codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');

      res.redirect(url.toString());
    } catch (err) {
      console.error('OIDC login error:', err.message);
      res.status(502).send('SSO is momenteel niet beschikbaar.');
    }
  });

  app.get('/api/auth/oidc/callback', async (req, res) => {
    const secure = isSecureRequest(req);
    try {
      if (req.query.error) {
        console.warn('OIDC provider error:', req.query.error, req.query.error_description || '');
        return res.status(401).send('Inloggen bij de provider is afgebroken.');
      }

      const cookie = readCookie(req, STATE_COOKIE);
      if (!cookie) return res.status(400).send('Sessie verlopen. Probeer opnieuw in te loggen.');

      let flow;
      try {
        flow = jwt.verify(cookie, jwtSecret);
      } catch {
        return res.status(400).send('Sessie ongeldig. Probeer opnieuw in te loggen.');
      }

      // Vergelijking in constante tijd; `state` is een geheim voor deze flow.
      const given = Buffer.from(String(req.query.state || ''));
      const expected = Buffer.from(String(flow.state));
      if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
        return res.status(400).send('Ongeldige state. Probeer opnieuw in te loggen.');
      }

      const meta = await discover();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(req.query.code || ''),
        redirect_uri: REDIRECT_URI,
        code_verifier: flow.codeVerifier
      });

      const tokenRes = await fetch(meta.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
        },
        body
      });

      if (!tokenRes.ok) {
        console.error('OIDC token endpoint:', tokenRes.status, await tokenRes.text().catch(() => ''));
        return res.status(502).send('SSO-uitwisseling mislukt.');
      }

      const tokens = await tokenRes.json();
      if (!tokens.id_token) return res.status(502).send('Provider gaf geen id_token terug.');

      const header = JSON.parse(Buffer.from(tokens.id_token.split('.')[0], 'base64').toString());
      const key = await getKey(header.kid);
      const claims = jwt.verify(tokens.id_token, key, {
        algorithms: ['RS256', 'ES256'],
        issuer: meta.issuer,
        audience: CLIENT_ID
      });

      if (claims.nonce !== flow.nonce) {
        return res.status(400).send('Ongeldige nonce. Probeer opnieuw in te loggen.');
      }

      const username = claimToUsername(claims);
      if (!username) return res.status(400).send('Provider leverde geen bruikbare gebruikersnaam.');

      let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      const admin = isAdminFromClaims(claims);

      if (!user) {
        if (!ALLOW_SIGNUP) {
          console.warn(`OIDC: geen lokaal account voor ${username} en OIDC_ALLOW_SIGNUP staat uit`);
          return res.status(403).send('Geen account voor deze gebruiker.');
        }
        // Een onbruikbaar wachtwoord: dit account kan alleen via de provider naar
        // binnen. Een lege of vaste hash zou een lokale inlogroute openzetten.
        const unusable = await bcrypt.hash(base64url(crypto.randomBytes(32)), 10);
        const info = db
          .prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)')
          .run(username, unusable, admin === true ? 1 : 0);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
        console.log(`OIDC: nieuw account aangemaakt voor ${username}`);
      } else if (admin !== null && Boolean(user.is_admin) !== admin) {
        db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(admin ? 1 : 0, user.id);
        user.is_admin = admin ? 1 : 0;
      }

      const sessionToken = jwt.sign(
        { id: user.id, username: user.username, is_admin: Boolean(user.is_admin) },
        jwtSecret,
        { expiresIn: '7d' }
      );
      const profile = { id: user.id, username: user.username, is_admin: Boolean(user.is_admin) };

      clearStateCookie(res, secure);

      // De frontend bewaart het token in localStorage; daar kan een redirect niet
      // bij. Vandaar dit minimale tussenpaginaatje. Het token staat in de body en
      // niet in de URL, zodat het niet in proxylogs of browserhistorie belandt.
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Signing in…</title></head>
<body><script>
try {
  localStorage.setItem('ctrltab-token', ${JSON.stringify(sessionToken)});
  localStorage.setItem('ctrltab-user', ${JSON.stringify(JSON.stringify(profile))});
} catch (e) {}
location.replace('/');
</script><noscript>Signing in requires JavaScript. <a href="/">Continue</a></noscript></body></html>`);
    } catch (err) {
      console.error('OIDC callback error:', err.message);
      clearStateCookie(res, secure);
      res.status(500).send('SSO-login mislukt.');
    }
  });
}

module.exports = { register, enabled };
