# Install & first run

OpenTask ships as a single Docker image that listens on port **7968** and writes
everything to one `/data` volume. Docker is the supported path; you can also run
it from source with Node.

- [Requirements](#requirements)
- [Quick start (Docker)](#quick-start-docker)
- [First run](#first-run)
- [Data & volume layout](#data--volume-layout)
- [Running behind a reverse proxy](#running-behind-a-reverse-proxy)
- [Updating](#updating)
- [Off-host replication](#off-host-replication)
- [Running from source](#running-from-source)
- [Uninstall](#uninstall)

## Requirements

- **Docker** (with Compose v2), or
- **Node.js ≥ 22** and [pnpm](https://pnpm.io) if you run from source.

A single-core box with 512 MB of RAM is plenty. There is no external database —
OpenTask uses embedded SQLite inside the `/data` volume.

## Quick start (Docker)

The canonical one-liner:

```sh
docker run -d --name opentask -p 7968:7968 -v ./data:/data ghcr.io/pranav-karra-3301/opentask
```

Or, with Docker Compose — save this as `docker-compose.yml`:

```yaml
services:
  opentask:
    image: ghcr.io/pranav-karra-3301/opentask:latest
    container_name: opentask
    ports: ["7968:7968"]
    volumes: ["./data:/data"]
```

(Both name the container `opentask`, which the `docker exec … opentask …`
examples in the [CLI docs](cli.md) rely on.)

then start it:

```sh
docker compose up -d
```

Either way, open <http://localhost:7968> once the container is healthy. The image
declares a `HEALTHCHECK` against `/api/health`, so `docker ps` will show
`healthy` when it is ready to serve.

## First run

1. Open <http://localhost:7968>.
2. Create the first account (email + password). This is your single user.
3. **Registration auto-locks after the first account is created.** The sign-up
   form disappears and the instance becomes single-user.

If you ever need to create another account (for example, to migrate to a new
email), reopen sign-up by setting `OPENTASK_ALLOW_REGISTRATION=true` and
restarting the container. Turn it back off afterward. See
[Configuration](configuration.md#core) for the full variable list.

## Data & volume layout

Everything lives under the mounted `/data` volume:

```
/data
├── opentask.db        # SQLite database (with -wal / -shm sidecars while running)
├── attachments/        # uploaded files and Ramble audio
├── backups/            # nightly snapshot zips
└── secrets.json        # session secret, Web-Push VAPID keys, encryption key (mode 600)
```

`secrets.json` is **auto-generated on first boot** and is never supplied as an
environment variable. Keep it: it is included in backups, and losing it
invalidates existing sessions and push subscriptions and makes encrypted
provider keys unrecoverable. Back up the whole `/data` directory (or use the
built-in [Backups](backups.md)) to preserve all of it.

## Running behind a reverse proxy

Put OpenTask behind Caddy, nginx, or Traefik when you expose it beyond
localhost. Two settings matter:

- **`OPENTASK_PUBLIC_URL`** — set this to the external origin, e.g.
  `https://tasks.example.com`. It is what makes Web-Push, the iCal feed URL, and
  OIDC redirect URLs correct. Without it those absolute URLs fall back to guesses.
- **`OPENTASK_TRUST_PROXY=true`** — set this when your proxy adds
  `X-Forwarded-*` headers, so the client protocol and IP are honored.

**HTTPS is required** for Web Push and for installing the PWA ("Add to Home
Screen") — browsers gate both on a secure context. Terminate TLS at your proxy.
`http://localhost` is the one exempt origin, which is why local testing works
without a certificate.

A minimal Caddy example:

```
tasks.example.com {
  reverse_proxy localhost:7968
}
```

with `OPENTASK_PUBLIC_URL=https://tasks.example.com` and
`OPENTASK_TRUST_PROXY=true` on the container.

## Updating

Pull the newer image and recreate the container:

```sh
docker compose pull && docker compose up -d
```

Pending database migrations run automatically on boot, so an older `/data`
volume is upgraded in place. (Take a [backup](backups.md) first if you like a
safety net.)

Available image tags on `ghcr.io/pranav-karra-3301/opentask`:

| Tag | Points at |
|---|---|
| `latest` | The newest stable release. |
| `X.Y.Z` | An exact release, e.g. `0.1.0`. Pin this for reproducible deploys. |
| `X.Y` | The latest patch of a minor line, e.g. `0.1`. |
| `nightly` | The latest build from `main`. Unstable; for testing only. |

## Run a disposable demo

A **public sandbox**: an instance pre-loaded with sample data that wipes and re-seeds itself on a
timer, with every abusable surface refused by the server. This is exactly how
[tryopentask.pranavkarra.me](https://tryopentask.pranavkarra.me) runs.

```sh
docker compose -f deploy/demo/docker-compose.yml up -d
```

Or directly, mounting the supervisor script into the released image (no custom build):

```sh
docker run -d --name opentask-demo -p 7969:7969 \
  --memory=280m --cpus=0.5 \
  --tmpfs /data:uid=1000,gid=1000,mode=0700,size=256m \
  -v "$PWD/deploy/demo/entrypoint.sh:/demo-entrypoint.sh:ro" \
  -e OPENTASK_PORT=7969 \
  -e OPENTASK_DEMO_MODE=true \
  -e OPENTASK_DEMO_RESET_SECONDS=1800 \
  -e OPENTASK_PUBLIC_URL=https://demo.example.com \
  --entrypoint /bin/sh ghcr.io/pranav-karra-3301/opentask /demo-entrypoint.sh
```

Log in with **`demo@opentask.local` / `opentask-demo`**. The sign-in page offers a one-click
button, because demo mode publishes those credentials on `/api/v1/info` on purpose.

How it works ([`deploy/demo/entrypoint.sh`](../deploy/demo/entrypoint.sh)): each cycle wipes
`/data`, runs the seeder with the server **down** (so nothing else holds the SQLite WAL), then
serves under `timeout` until the interval elapses. It re-seeds rather than restoring a snapshot
because the sample dataset resolves *relative* dates at seed time, so a golden copy would show
yesterday's "today". Expect ~10 seconds of downtime per cycle; the in-app banner counts down to
it, and `resets_at` on `/api/v1/info` is the same clock.

Notes:

- `/data` is a **tmpfs** on purpose. The demo has nothing worth persisting, and a restart should
  always come up clean. The `uid=1000` option matters: the image runs as `node`, which has to be
  able to delete `/data/*` every cycle.
- The memory cap is not decoration. It guarantees a hammered demo is OOM-killed and restarted
  (which, for a demo, is just an early reset) instead of starving whatever else shares the host.
- See [Configuration → Demo mode](configuration.md#demo-mode) for exactly what gets refused.

## Off-host replication

For continuous off-host copies of the database (in addition to the nightly
snapshot zips), run [Litestream](https://litestream.io) as a sidecar streaming
to S3-compatible storage. The full recipe lives in the backups guide:
[Backups → off-host replication with Litestream](backups.md#optional-off-host-replication-with-litestream).

## Running from source

You need Node ≥ 22 and pnpm.

```sh
git clone https://github.com/junkdrawerlab/opentask.git
cd opentask
pnpm install
pnpm build   # builds @opentask/core and the web SPA (the server runs via tsx)
```

Then start the server, pointing it at the freshly built web assets and a data
directory of your choice:

```sh
OPENTASK_DATA_DIR=./data \
OPENTASK_WEB_DIST=apps/web/dist \
  pnpm --filter @opentask/server start
```

Open <http://localhost:7968>. `OPENTASK_WEB_DIST` tells the server where the
built SPA is; the Docker image sets it for you, so you only need it from source.
See [Configuration](configuration.md) for everything else you can tune.

## Uninstall

```sh
docker compose down          # or: docker rm -f <container>
rm -rf ./data                # deletes the database, attachments, backups, secrets
```

Deleting `./data` is **irreversible** — export or [back up](backups.md) first if
you might want your tasks later.

---

[Docs index](README.md) · [Configuration](configuration.md) · [FAQ](faq.md)
