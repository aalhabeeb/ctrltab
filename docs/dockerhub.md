# ctrlTAB

**Your links. Your rules. Self-hosted.**

A lightweight, self-hosted bookmark and link manager: links grouped into collections and
sections, with favicons, custom icons, themes, backgrounds, import/export and search across
everything. Vanilla JavaScript frontend, Express + SQLite backend, no build step.

**One container.** Express serves both the API and the frontend, so there is no reverse proxy
or sidecar to run alongside it.

---

## Quick start

```bash
docker run -d --name ctrltab \
  -p 8090:3000 \
  -v ctrltab-data:/app/data \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD="choose-something-better" \
  --restart unless-stopped \
  alhabeeb/ctrltab:latest
```

Open `http://localhost:8090` and log in with those credentials.

### docker compose

```yaml
services:
  ctrltab:
    image: alhabeeb/ctrltab:latest
    container_name: ctrltab
    restart: unless-stopped
    ports:
      - "8090:3000"
    volumes:
      - ctrltab-data:/app/data
    environment:
      JWT_SECRET: change-me-to-32-random-bytes
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: choose-something-better

volumes:
  ctrltab-data:
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `dev-secret-change-in-production` | Signs session tokens. **Always set this.** Changing it later logs everyone out. |
| `ADMIN_USERNAME` | `admin` | Initial admin account — only used on an empty database |
| `ADMIN_PASSWORD` | `admin123` | Initial admin password — only used on an empty database |
| `DB_PATH` | `/app/data/ctrltab.db` | Path to the SQLite database file |
| `PUBLIC_DIR` | `/app/public` | Directory holding the static frontend |

The admin variables only do something when the database is empty. After the first login,
change the password inside the app; editing the variables afterwards has no effect.

## Storage

Mount **`/app/data`** and everything survives a restart: the SQLite database lives there, and
so does `uploads/` with the custom icons and background images. It is one directory because
the app derives the uploads path from `DB_PATH`.

Keep it on normal local or block storage. SQLite over NFS or SMB is prone to locking problems.

## Ports

The container listens on **3000**. Map it to whatever you like on the host.

## Upload limits

Icons up to 2 MB, backgrounds up to 5 MB, imports up to 10 MB. If you put a reverse proxy in
front, make sure its own body-size limit is not stricter, or uploads will fail there first.

---

## Tags

| Tag | Meaning |
|-----|---------|
| `latest` | Newest build of the default branch — moves |
| `main` | The same build, named after the branch — moves |
| `sha-<commit>` | One specific commit — never moves |
| `1.2.0`, `1.2` | Published when a version tag is pushed |

For anything you want to roll back predictably — a Kubernetes manifest, a pinned server — use
`sha-<commit>` or a version tag rather than `latest`.

---

## Source and license

Source, issues and the full README: **https://github.com/aalhabeeb/ctrltab**

MIT licensed. Originally built by Michael Smith as
[erymantho/ctrlTAB](https://github.com/erymantho/ctrlTAB); this is an independent continuation
with a single-container image, pinned and reproducible builds, and updated dependencies.
