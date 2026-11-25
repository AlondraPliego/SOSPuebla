#!/usr/bin/env bash
# PRIMERA VEZ en la EC2 (Amazon Linux 2023). Se corre UNA sola vez desde la raíz del repo:
#   bash deploy/setup-servidor.sh
# Antes: copia deploy/sos.env (hecho a partir de deploy/sos.env.example) al servidor con scp.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"
DOMINIO=100-53-188-210.sslip.io     # la IP pública como dominio (sslip.io), para tener HTTPS gratis

[ -f deploy/sos.env ] || { echo "FALTA deploy/sos.env: cópialo de deploy/sos.env.example, llénalo y súbelo con scp"; exit 1; }
set -a; . deploy/sos.env; set +a

echo ">> Memoria de intercambio (swap) de 2 GB: compilar con Maven en una instancia chica se queda sin RAM"
if ! swapon --show | grep -q /swapfile; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile && sudo mkswap /swapfile >/dev/null && sudo swapon /swapfile
  grep -q /swapfile /etc/fstab || echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab >/dev/null
fi

echo ">> Java 25, Nginx, Certbot, Git y MariaDB (compatible con MySQL)"
sudo dnf install -y nginx certbot python3-certbot-nginx git mariadb105-server
if ! sudo dnf install -y java-25-amazon-corretto-devel; then
  echo "   Corretto 25 no está en el repositorio: se instala desde corretto.aws"
  ARQ=$(uname -m | sed 's/x86_64/x64/; s/aarch64/aarch64/')
  curl -fsSL "https://corretto.aws/downloads/latest/amazon-corretto-25-${ARQ}-linux-jdk.tar.gz" -o /tmp/corretto25.tgz
  sudo mkdir -p /opt/java && sudo tar -xzf /tmp/corretto25.tgz -C /opt/java
  sudo ln -sfn "$(ls -d /opt/java/amazon-corretto-25* | head -1)" /opt/java/corretto-25
  sudo alternatives --install /usr/bin/java java /opt/java/corretto-25/bin/java 2500
  sudo alternatives --set java /opt/java/corretto-25/bin/java
fi
java -version

echo ">> Node 22 para compilar el frontend en el servidor (si no se puede, deploy.sh usa el dist/ subido)"
if sudo dnf install -y nodejs22 nodejs22-npm; then
  sudo alternatives --set node /usr/bin/node-22 2>/dev/null || true
  sudo alternatives --set npm /usr/bin/npm-22 2>/dev/null || true
fi
node -v || true

echo ">> Base de datos 'emergencias' y su usuario"
sudo systemctl enable --now mariadb
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS emergencias CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USUARIO}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USUARIO}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON emergencias.* TO '${DB_USUARIO}'@'localhost';
FLUSH PRIVILEGES;
SQL

echo ">> Usuario sin privilegios para el backend y carpetas"
id sos &>/dev/null || sudo useradd -r -s /usr/sbin/nologin sos
sudo install -d -o sos -g sos /opt/sos
sudo mkdir -p /var/www/sos

echo ">> Variables del backend (contraseñas) -> /opt/sos/backend.env"
sudo tee /opt/sos/backend.env >/dev/null <<ENV
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/emergencias?useSSL=false&serverTimezone=America/Mexico_City&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=${DB_USUARIO}
SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
# La primera vez crea las tablas; después deploy.sh lo cambia a "never" para que NO se borren en cada reinicio
SPRING_SQL_INIT_MODE=always
SPRING_JPA_SHOW_SQL=false
LOGGING_LEVEL_ORG_HIBERNATE_SQL=warn
ENV
sudo chown sos:sos /opt/sos/backend.env && sudo chmod 600 /opt/sos/backend.env

echo ">> Servicio del backend y configuración de Nginx"
sudo cp deploy/sos-backend.service /etc/systemd/system/
sudo cp deploy/nginx-sos.conf /etc/nginx/conf.d/sos.conf
sudo systemctl daemon-reload
sudo systemctl enable sos-backend
sudo systemctl enable --now nginx

echo ">> Primer deploy"
bash "$REPO/deploy/deploy.sh"

echo ">> HTTPS (el teléfono sólo da la ubicación con https)"
sudo certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo "Listo:"
echo "  App:   https://$DOMINIO"
echo "  Panel: https://$DOMINIO/panel"
echo "  API:   https://$DOMINIO/api"
