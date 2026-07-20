#!/usr/bin/env bash
# ============================================================
# WANOSC-Toolbox — one-shot deploy helper for Ubuntu 20.04+/22.04
# Run as a sudo-capable user. Review and edit the CONFIG block first.
# Usage:  sudo bash deploy/deploy.sh
# ============================================================
set -euo pipefail

# ---------------- CONFIG (edit these) ----------------
APP_DIR="/opt/wanosc"                 # where the repo will live
REPO_URL="https://github.com/YOUR_ORG/WANOSC-Toolbox.git"
DOMAIN="your-domain.com"
DB_NAME="wanosc_db"
DB_USER="wanosc_user"
DB_PASS="CHANGE_ME"                   # database password
# -----------------------------------------------------

echo ">> Installing system packages..."
apt update
apt install -y python3 python3-venv python3-pip nodejs npm nginx postgresql postgresql-contrib git

echo ">> Creating PostgreSQL database and user (idempotent)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"

echo ">> Cloning / updating repo..."
if [ -d "${APP_DIR}/.git" ]; then
    git -C "${APP_DIR}" pull
else
    git clone "${REPO_URL}" "${APP_DIR}"
fi

echo ">> Setting up backend (venv + deps + gunicorn)..."
cd "${APP_DIR}/backend"
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
./venv/bin/pip install "gunicorn>=21" "uvicorn>=0.25"

if [ ! -f .env ]; then
    cp "${APP_DIR}/deploy/env.backend.example" .env
    JWT=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s#postgresql+psycopg2://wanosc_user:CHANGE_ME@localhost:5432/wanosc_db#postgresql+psycopg2://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}#" .env
    sed -i "s#CHANGE_ME_TO_A_LONG_RANDOM_STRING#${JWT}#" .env
    sed -i "s#CORS_ORIGINS=\"https://your-domain.com\"#CORS_ORIGINS=\"https://${DOMAIN}\"#" .env
    echo "   -> Wrote ${APP_DIR}/backend/.env  (review ADMIN_PASSWORD!)"
fi

echo ">> Building frontend..."
cd "${APP_DIR}/frontend"
echo "REACT_APP_BACKEND_URL=https://${DOMAIN}" > .env
npm install
npm run build

echo ">> Installing systemd service..."
cp "${APP_DIR}/deploy/wanosc-api.service" /etc/systemd/system/wanosc-api.service
chown -R www-data:www-data "${APP_DIR}"
systemctl daemon-reload
systemctl enable --now wanosc-api

echo ">> Configuring Nginx..."
sed "s#your-domain.com#${DOMAIN}#; s#/opt/wanosc#${APP_DIR}#" \
    "${APP_DIR}/deploy/nginx-wanosc.conf" > /etc/nginx/sites-available/wanosc
ln -sf /etc/nginx/sites-available/wanosc /etc/nginx/sites-enabled/wanosc
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "============================================================"
echo " Done. Visit http://${DOMAIN}"
echo " Next: enable HTTPS ->  sudo certbot --nginx -d ${DOMAIN}"
echo " Backend logs      ->  journalctl -u wanosc-api -f"
echo "============================================================"
