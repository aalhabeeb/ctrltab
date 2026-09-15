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
> MIT licensed and that license is kept intact — see [`LICENSE`](LICENSE).
>
> Container images are published to GHCR, so there is no need to build from source:
> `ghcr.io/aalhabeeb/ctrltab-api` and `ghcr.io/aalhabeeb/ctrltab-web`.
>
> Changes relative to upstream: multi-stage Docker builds that carry a compiler for native
> modules, a committed `package-lock.json`, `better-sqlite3` 12 and `multer` 2, and a
> configurable API upstream in the nginx config (`API_HOST` / `API_PORT`) instead of a
> hard-coded compose service name.

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
- 🐳 **Docker-ready** — Runs as a two-container stack (API + Nginx)
- 🪶 **Lightweight** — SQLite database, no external dependencies
- 🔒 **Self-hosted** — Your data stays on your server
- 📱 **PWA** — Installable as an app, works offline for static assets

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Deploy

**1. Clone the repository**

```bash
git clone https://github.com/erymantho/ctrlTAB.git
cd ctrlTAB
```

**2. Generate a JWT secret**

```bash
openssl rand -hex 32
```

**3. Set your credentials**

```bash
export JWT_SECRET="your-generated-secret"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="your-secure-password"
```

**4. Start the stack**

```bash
docker compose up -d
```

ctrlTAB is now available at `http://localhost:8090`. Log in with your admin credentials.

> **Note:** The default port is `8090`. You can change it in `docker-compose.yml` under the `web` service.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `please-change-this-secret` | Secret key for JWT signing — **always change in production** |
| `ADMIN_USERNAME` | `admin` | Initial admin username |
| `ADMIN_PASSWORD` | `admin123` | Initial admin password |
| `DB_PATH` | `/app/data/ctrltab.db` | Path to SQLite database file |

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
- **Backend:** Node.js, Express, better-sqlite3
- **Database:** SQLite with WAL mode
- **Auth:** JWT tokens, bcrypt password hashing
- **Proxy:** Nginx (Alpine)
- **Containers:** Docker & Docker Compose

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
- [ ] Descriptions for collections, sections, and links
- [ ] Import from other services (Raindrop, Pocket)
- [ ] Tags and filtering
- [ ] Browser extension for quick saving
- [x] Focus-on-type search (type anywhere to instantly focus the search bar)
- [ ] More keyboard shortcuts

---

## License

MIT — do whatever you want with it.

---

*Built by Michael Smith, with Claude Code*
