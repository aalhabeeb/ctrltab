# Changelog

All notable changes to ctrlTAB are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-15

First release of this continuation (see the fork notice in the README). Upstream stopped at
1.1.0; this picks up from there.

### Added
- **Single sign-on (OIDC)** — authorization code flow with PKCE against any OpenID Connect
  provider, built for Authentik. Validates `state`, `nonce`, and the id_token's signature,
  issuer, audience and expiry against the provider's JWKS, with no extra dependency. Off
  unless `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` and `OIDC_REDIRECT_URI` are all
  set. Local login always keeps working, so a provider outage does not lock you out.
- Accounts created through SSO get an unusable password hash, so they cannot double as a local
  login. `OIDC_ADMIN_GROUP` can sync the admin flag from a group claim.
- Container images on GHCR and Docker Hub, tagged by branch, commit SHA, semver and `latest`.
  Upstream published none.
- A committed `package-lock.json`, so builds are reproducible.

### Changed
- **One container instead of two.** Express now serves the static frontend itself, so the
  separate nginx container and its config are gone. Note that nginx's `client_max_body_size`
  went with it: upload size is bounded by the per-route multer limits and by whatever proxy
  sits in front.
- Multi-stage Docker build that carries a compiler, so a missing prebuilt binary for a native
  module costs build time instead of a container that fails to start.
- `better-sqlite3` 11 → 12 (prebuilt binaries up to Node 26) and `multer` 1 → 2, which fixes
  the known vulnerabilities in 1.x.
- Node 20 → 24.

### Fixed
- The build now starts the image and queries it before publishing. A forgotten `COPY` had
  produced an image that built cleanly and then died at startup with `MODULE_NOT_FOUND`.

## [1.1.0] - 2026-06-29

### Added
- **Export** — download all collections, sections, and links as a JSON backup
  (internal favicon URLs stripped).
- **Import** — a single import modal supporting ctrlTAB backups, Linkwarden
  exports, and Netscape HTML browser bookmarks.
- **Search as you type** — live search in the sidebar with `/` to focus the
  search bar, type-to-search from anywhere, and `Enter` to open the first result.
- **YouTube video backgrounds** — set a video as the page background
  (mutually exclusive with an image background).
- `.gitignore` covering macOS, editor, and Node artifacts.

### Changed
- Redesigned the import flow into one modal with ctrlTAB / Linkwarden / bookmarks
  options and a per-type file picker.
- Redrew the favicon as a self-contained vector mark (no web-font dependency),
  with light/dark variants via `prefers-color-scheme`.
- Denser link grid (smaller card min-width); the two-column section layout no
  longer applies to empty states.
- Bumped the service worker cache (`ctrltab-v4` → `ctrltab-v5`) so clients pick
  up the refreshed assets.

### Fixed
- Export failure on certain datasets.
- Assorted small search and UI bugfixes.

### Internal
- Stopped tracking committed macOS `.DS_Store` files.

## [1.0.0] - 2026-03-10

### Added
- Initial release: self-hosted link manager organizing URLs into
  Collections → Sections → Links.
- JWT authentication with an admin-managed multi-user setup.
- Drag-and-drop ordering of links and sections, including cross-collection moves.
- Per-user preferences: accent color, background image, and dim overlay.
- Themes: light, dark, OLED, cyberpunk, and batman.
- Internationalization (English, Dutch, Spanish).
- Progressive Web App support (installable, offline-capable service worker).

[1.2.0]: https://github.com/aalhabeeb/ctrltab/releases/tag/v1.2.0
[1.1.0]: https://github.com/erymantho/CtrlTab/releases/tag/v1.1.0
[1.0.0]: https://github.com/erymantho/CtrlTab/releases/tag/v1.0.0
