# Deploying WANOSC-Toolbox to your own cloud server

Full-stack app: **FastAPI** (backend) + **React** (frontend build) + **SQL** (PostgreSQL/MySQL/SQLite via SQLAlchemy).
No LibreOffice or other system tools required — the only heavy libraries are `python-docx` and `openpyxl` (pure Python).

---

## 0. Server requirements

| Item      | Minimum                     |
|-----------|-----------------------------|
| OS        | Ubuntu 20.04 / 22.04 (Linux)|
| CPU / RAM | 2 vCPU / 2–4 GB             |
| Storage   | 20 GB+                      |
| Python    | 3.9+                        |
| Node.js   | 16+ (build-time only)       |
| Database  | PostgreSQL (recommended), MySQL, or SQLite |
| Web server| Nginx (reverse proxy + static) |

The app must run **24/7**: the FastAPI backend and the SQL database stay running; Nginx serves the built React files and proxies `/api` to the backend.

---

## Option 0 — Docker (one command) ✅ easiest

Requires only **Docker** + **Docker Compose** on the server (`sudo apt install docker.io docker-compose-plugin -y`).
Everything (PostgreSQL + FastAPI backend + React/Nginx web) runs in containers.

```bash
# 1. Get the code
git clone <your-github-repo-url> wanosc && cd wanosc

# 2. Create your env file and edit the passwords/secret
cp .env.docker.example .env
nano .env          # set DB_PASS, JWT_SECRET, ADMIN_PASSWORD

# 3. Build & start everything
docker compose up -d --build
```

Open `http://<server-ip>` and log in with the admin credentials from `.env`.

What the stack does:
- `db` — PostgreSQL with a persistent named volume (`pgdata`); data survives restarts.
- `backend` — FastAPI (gunicorn+uvicorn) on internal port 8001; tables auto-create, admin auto-seeds.
- `web` — Nginx serving the built React app **and** proxying `/api` → `backend`. The frontend is built with an empty `REACT_APP_BACKEND_URL`, so it calls `/api` on the same origin (no CORS headaches).

Common commands:
```bash
docker compose logs -f backend     # view backend logs
docker compose ps                  # status
docker compose down                # stop (keeps the db volume)
docker compose down -v             # stop AND delete the database volume
docker compose up -d --build       # apply code changes after a git pull
```

HTTPS options: put this behind a reverse proxy (Caddy/Traefik/Nginx) or a cloud load balancer that terminates TLS and forwards to the `web` container's port. To change the host port, set `WEB_PORT` in `.env` (e.g. `WEB_PORT=8080`).

> Note: the backend image installs from `backend/requirements-deploy.txt` (a curated, prod-only
> list) — not the full `requirements.txt`, which contains Emergent-internal/dev packages.

---

## Option A — Automated script (no Docker)

1. Push this project to GitHub (use **Save to GitHub** in Emergent).
2. On the server, clone it, then edit the CONFIG block at the top of `deploy/deploy.sh`
   (repo URL, domain, DB password).
3. Run:
   ```bash
   sudo bash deploy/deploy.sh
   ```
   This installs packages, creates the PostgreSQL DB, sets up a Python venv + gunicorn
   systemd service, builds the frontend, and configures Nginx.
4. Review `backend/.env` (**change `ADMIN_PASSWORD`**), then:
   ```bash
   sudo systemctl restart wanosc-api
   sudo certbot --nginx -d your-domain.com   # optional: HTTPS
   ```

---

## Option B — Manual steps

### 1. Install packages
```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx postgresql postgresql-contrib git
```

### 2. Create the database (PostgreSQL example)
```bash
sudo -u postgres psql
CREATE DATABASE wanosc_db;
CREATE USER wanosc_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE wanosc_db TO wanosc_user;
ALTER DATABASE wanosc_db OWNER TO wanosc_user;
\q
```

### 3. Get the code
```bash
sudo git clone <your-github-repo-url> /opt/wanosc
cd /opt/wanosc
```

### 4. Backend
```bash
cd /opt/wanosc/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install "gunicorn>=21" "uvicorn>=0.25"

cp /opt/wanosc/deploy/env.backend.example .env
nano .env    # set DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, CORS_ORIGINS
```
`.env` essentials:
```
DATABASE_URL="postgresql+psycopg2://wanosc_user:your_password@localhost:5432/wanosc_db"
JWT_SECRET="<python3 -c 'import secrets;print(secrets.token_hex(32))'>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<change me>"
CORS_ORIGINS="https://your-domain.com"
```
> Tables are created automatically on first startup, and the admin account is seeded
> from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. No manual migrations needed.

Test it runs:
```bash
./venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
# Ctrl-C once you see "Application startup complete."
```

### 5. Frontend (build)
```bash
cd /opt/wanosc/frontend
echo "REACT_APP_BACKEND_URL=https://your-domain.com" > .env
npm install
npm run build          # outputs static files to ./build
```

### 6. Run the backend as a service
```bash
sudo cp /opt/wanosc/deploy/wanosc-api.service /etc/systemd/system/
sudo chown -R www-data:www-data /opt/wanosc
sudo systemctl daemon-reload
sudo systemctl enable --now wanosc-api
sudo journalctl -u wanosc-api -f      # view logs
```

### 7. Nginx
```bash
sudo cp /opt/wanosc/deploy/nginx-wanosc.conf /etc/nginx/sites-available/wanosc
sudo nano /etc/nginx/sites-available/wanosc   # set server_name + root path
sudo ln -s /etc/nginx/sites-available/wanosc /etc/nginx/sites-enabled/wanosc
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 8. HTTPS (recommended)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Updating after code changes
```bash
cd /opt/wanosc && git pull
# backend deps changed?
cd backend && ./venv/bin/pip install -r requirements.txt && sudo systemctl restart wanosc-api
# frontend changed?
cd ../frontend && npm install && npm run build   # Nginx serves the new build immediately
```

## Switching database engine
Only `DATABASE_URL` changes — no code edits:
- PostgreSQL: `postgresql+psycopg2://user:pass@host:5432/db`  (driver `psycopg2-binary`, already in requirements)
- MySQL:      `mysql+pymysql://user:pass@host:3306/db`         (driver `PyMySQL`, already in requirements)
- SQLite:     `sqlite:////opt/wanosc/backend/app.db`

## Troubleshooting
- **502 Bad Gateway** → backend not running: `sudo systemctl status wanosc-api`, check `journalctl -u wanosc-api`.
- **CORS / login errors** → `CORS_ORIGINS` in backend `.env` must equal your site's origin; rebuild frontend if `REACT_APP_BACKEND_URL` changed.
- **DB connection refused** → verify `DATABASE_URL` credentials and that PostgreSQL is running (`sudo systemctl status postgresql`).
- **Upload too large** → raise `client_max_body_size` in the Nginx config.
