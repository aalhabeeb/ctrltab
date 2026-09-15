const API_BASE = '/api';
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// i18n init
_lang = detectLang();
document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
document.documentElement.lang = _lang;

function showError(msg) {
    loginError.textContent = msg;
    loginError.classList.add('visible');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('visible');

    const formData = new FormData(loginForm);

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || t('error.login_failed'));
        }

        const data = await response.json();
        localStorage.setItem('ctrltab-token', data.token);
        localStorage.setItem('ctrltab-user', JSON.stringify(data.user));
        window.location.href = '/';
    } catch (err) {
        showError(err.message);
    }
});

// If already logged in, redirect to app
(async function() {
    const token = localStorage.getItem('ctrltab-token');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) window.location.href = '/';
    } catch {
        // Token invalid, stay on login page
    }
})();

// Toon de SSO-knop alleen als de server zegt dat OIDC geconfigureerd is. De knop
// staat in de HTML op `hidden`, dus zonder deze aanroep blijft hij weg - en bij een
// server zonder deze route (oudere image) valt hij stilletjes terug op niets.
(async function() {
    try {
        const res = await fetch(`${API_BASE}/auth/oidc/config`);
        if (!res.ok) return;
        const cfg = await res.json();
        if (!cfg.enabled) return;
        const btn = document.getElementById('ssoButton');
        if (cfg.label) btn.textContent = cfg.label;
        document.getElementById('ssoBlock').hidden = false;
    } catch {
        // Geen SSO beschikbaar; de lokale login blijft gewoon staan.
    }
})();
