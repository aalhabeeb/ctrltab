# ⌨️ ctrlTAB

**Your links. Your rules. Self-hosted.**

A lightweight, self-hosted bookmark and link manager to organize your links into collections and sections. Built for nerds who want full control over their bookmarks without relying on browser extensions or third-party services.

![Version](https://img.shields.io/badge/version-1.1.0-brightgreen)
![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![Node.js](https://img.shields.io/badge/Node.js-24-green?logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-database-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)

> **Fork notice** — This is an independent continuation of
> [erymantho/ctrlTAB](https://github.com/erymantho/ctrlTAB), maintained by
> [@aalhabeeb](https://github.com/aalhabeeb) for a personal k3s homelab. The original work is
> MIT licensed and that license is kept intact — see [`LICENSE`](LICENSE) and
> [Credits](#credits). Upstream has been quiet since June 2026, so fixes and dependency
> updates happen here.

---

## Features

- 📁 **Collections** — Group your links by project, client, or topic
- 📑 **Sections** — Organize links within collections under named headings
- 🔗 **Links** — Store URLs with auto-fetched favicons (including local/private network apps)
- 🖼️ **Custom Icons** — Upload your own PNG, SVG, or ICO as a link icon
- 🎨 **Themes** — Light, Dark, OLED, Cyberpunk, and Batman
- 🎨 **Accent Color** — Per-user accent color with preset palette and custom color picker
- 🖼️ **Custom Background** — Upload a personal background image (JPG/PNG/GIF) or set a YouTube video as background, works across all themes
- 🔍 **Search** — Global search across all links and collections; type anywhere to instantly focus the search bar
- ⬜ **Two-column layout** — Optional two-column section layout per user preference
- ↕️ **Drag & Drop** — Reorder links and sections by dragging; reset to A-Z with one click
- 👤 **User Accounts** — Multi-user with admin panel and JWT authentication
- 🐳 **Docker-ready** — A single container; no reverse proxy or sidecar needed
- 🪶 **Lightweight** — SQLite database, no external dependencies
- 🔒 **Self-hosted** — Your data stays on your server
- 📱 **PWA** — Installable as an app, works offline for static assets

---

## Quick Start

A ready-made image is published on every push, so there is nothing to build.

```bash
docker run -d --name ctrltab \
  -p 8090:3000 \
  -v ctrltab-data:/app/data \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD="choose-something-better" \
  --restart unless-stopped \
  ghcr.io/aalhabeeb/ctrltab:latest
```

ctrlTAB is now available at `http://localhost:8090`. Log in with the admin credentials above.

`ADMIN_USERNAME` and `ADMIN_PASSWORD` are only used to create the account on an **empty**
database. After the first login, change the password in the app — editing those variables
later has no effect. Changing `JWT_SECRET` invalidates every session and logs everyone out.

### With Docker Compose

```bash
git clone https://github.com/aalhabeeb/ctrltab.git
cd ctrltab
export JWT_SECRET="$(openssl rand -hex 32)"
docker compose up -d
```

The compose file builds from source and is aimed at development; for a plain install, prefer
the image above. The published port is set under the `ctrltab` service.

---

## Images and tags

| Registry | Image |
|----------|-------|
| GitHub Container Registry | `ghcr.io/aalhabeeb/ctrltab` |
| Docker Hub | `alhabeeb/ctrltab` |

| Tag | Meaning |
|-----|---------|
| `latest` | Newest build of the default branch — moves |
| `main` | The same build, named after the branch — moves |
| `sha-<commit>` | One specific commit — never moves |
| `1.2.0`, `1.2` | Published when a `v*` git tag is pushed |

For anything you want to roll back predictably — a Kubernetes manifest, a pinned server — use
`sha-<commit>` or a version tag rather than `latest`.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `dev-secret-change-in-production` | Secret key for JWT signing — **always change in production** |
| `ADMIN_USERNAME` | `admin` | Initial admin username, used only on an empty database |
| `ADMIN_PASSWORD` | `admin123` | Initial admin password, used only on an empty database |
| `DB_PATH` | `/app/data/ctrltab.db` | Path to the SQLite database file |
| `PUBLIC_DIR` | `/app/public` | Directory holding the static frontend |

Everything that must survive a restart sits together: `DB_PATH` points at the SQLite file, and
its directory also holds `uploads/` with custom icons and backgrounds. Mounting `/app/data` is
therefore enough to persist all state.

---

## Single sign-on (OIDC)

ctrlTAB can log users in against an OIDC provider — Authentik, Keycloak, Zitadel, Authelia and
anything else that speaks OpenID Connect. It uses the authorization code flow with PKCE and
talks to the provider directly, so there is no trusted-header proxy setup to get wrong.

SSO stays off until all four of `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` and
`OIDC_REDIRECT_URI` are set. **Local login keeps working either way** — if the provider is
down, you can still get in with a local account.

| Variable | Default | Description |
|----------|---------|-------------|
| `OIDC_ISSUER` | — | Issuer URL, e.g. `https://auth.example.com/application/o/ctrltab/` |
| `OIDC_CLIENT_ID` | — | Client ID from the provider |
| `OIDC_CLIENT_SECRET` | — | Client secret from the provider |
| `OIDC_REDIRECT_URI` | — | Must match exactly: `https://<your-host>/api/auth/oidc/callback` |
| `OIDC_SCOPES` | `openid profile email` | Scopes to request |
| `OIDC_BUTTON_LABEL` | `Log in with Authentik` | Text on the login button |
| `OIDC_USERNAME_CLAIM` | `preferred_username` | Claim used as the local username |
| `OIDC_ALLOW_SIGNUP` | `true` | Create a local account on first SSO login |
| `OIDC_ADMIN_GROUP` | — | Users in this group get admin; leave empty to manage admin locally |

Accounts created through SSO get an unusable password hash, so they cannot be used to log in
locally — they exist only to own collections and links.

### Provider setup

Create a confidential client with:

- **Redirect URI**: `https://<your-host>/api/auth/oidc/callback`
- **Grant type**: authorization code, with PKCE (S256)
- **Client authentication**: client secret (basic)
- **Scopes**: `openid`, `profile`, `email` — plus a groups claim if you use `OIDC_ADMIN_GROUP`

The server must be able to reach the issuer over the network: discovery, the token exchange
and the JWKS fetch all happen server-side.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
- **Backend:** Node.js 24, Express, better-sqlite3
- **Database:** SQLite with WAL mode
- **Auth:** JWT tokens, bcrypt password hashing
- **Container:** One image, one process — Express serves both the API and the frontend

---

## Differences from upstream

- **One container instead of two.** Upstream ran a Node container for the API plus an nginx
  container that served the frontend and proxied `/api/`. Express now serves the static files
  itself, so there is no reverse proxy, no second image and no nginx config to template. Note
  that nginx's `client_max_body_size` went with it: upload size is bounded by the per-route
  multer limits (2–10 MB) and by whatever proxy you put in front.
- **Multi-stage build with a compiler on board.** `better-sqlite3` and `bcrypt` ship prebuilt
  binaries for common Node ABIs; when one is missing the build compiles it, instead of the
  container failing at startup. The build also runs a smoke test that loads both native
  modules and writes a row to SQLite, because npm can skip install scripts without failing.
- **A committed `package-lock.json`** and `npm ci` in the build, so an image is reproducible.
- **`better-sqlite3` 12 and `multer` 2** — the latter fixes the known vulnerabilities in 1.x.

---

## Roadmap

- [x] Full CRUD for collections, sections, and links
- [x] Auto-fetched favicons (including local/private network apps)
- [x] Custom icon upload (PNG, SVG, ICO)
- [x] Theme switcher (Light / Dark / Cyberpunk / Batman)
- [x] Per-user accent color with preset palette and custom picker
- [x] PWA with offline support
- [x] User accounts and authentication
- [x] Drag & drop reordering of links and sections
- [x] Drag links across sections and collections
- [x] Custom background image per user (JPG/PNG/GIF)
- [x] YouTube video as background
- [x] Show/hide URL in link cards (user preference)
- [x] Two-column section layout (user preference)
- [x] Global search across all links and collections
- [x] Dutch language support (EN/NL, browser-language detection, user override in Settings)
- [x] Spanish (Latin American) language support (EN/NL/ES)
- [x] JSON export (full backup of your collections, sections and links)
- [x] Import from Linkwarden (JSON export)
- [x] Import ctrlTAB backup (JSON restore)
- [x] Import browser bookmarks (Netscape HTML format — Chrome, Firefox, etc.)
- [x] Copy link URL to clipboard (button on each link card)
- [x] Focus-on-type search (type anywhere to instantly focus the search bar)
- [ ] Descriptions for collections, sections, and links
- [ ] Import from other services (Raindrop, Pocket)
- [ ] Tags and filtering
- [ ] Browser extension for quick saving
- [ ] More keyboard shortcuts

---

## License

MIT — do whatever you want with it. See [`LICENSE`](LICENSE).

---

## Credits

Originally built by **Michael Smith** ([erymantho/ctrlTAB](https://github.com/erymantho/ctrlTAB)), with Claude Code.
Continued here by [@aalhabeeb](https://github.com/aalhabeeb).
