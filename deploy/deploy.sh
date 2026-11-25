#!/usr/bin/env bash
# Cada vez que haya cambios en GitHub, desde la raíz del repo en la EC2:
#   bash deploy/deploy.sh
# Baja los cambios, compila backend y frontend, y reinicia todo.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

echo ">> Bajando cambios de GitHub"
git pull --ff-only

echo ">> Backend: compilando (Java 25)"
cd "$REPO/backend/NACIONAL-PROYECTO"
chmod +x mvnw
./mvnw -q package -DskipTests
sudo install -o sos -g sos target/demo-0.0.1-SNAPSHOT.jar /opt/sos/sos.jar
sudo systemctl restart sos-backend

echo ">> Frontend (web): la app llama a la API por /api (Nginx la reenvía al backend)"
cd "$REPO/frontend"
NODE_MAYOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
if [ "$NODE_MAYOR" -ge 20 ]; then
  npm ci --no-audit --no-fund
  npm run build:servidor
else
  echo "   Node 20+ no está instalado: se usa la carpeta dist/ que subiste compilada desde tu laptop"
  echo "   (en tu laptop: cd frontend && npm run build:servidor, y súbela con scp)"
  [ -f dist/index.html ] || { echo "   FALTA frontend/dist"; exit 1; }
fi
sudo rm -rf /var/www/sos/*
sudo cp -r dist/* /var/www/sos/
sudo nginx -t && sudo systemctl reload nginx

echo ">> Esperando a que arranque el backend"
for i in $(seq 1 60); do
  if curl -fs http://127.0.0.1:8080/actuator/health >/dev/null; then
    # Tras el primer arranque las tablas ya existen: desde ahora NO se vuelven a crear (ni a borrar)
    if sudo grep -q '^SPRING_SQL_INIT_MODE=always' /opt/sos/backend.env; then
      sudo sed -i 's/^SPRING_SQL_INIT_MODE=always/SPRING_SQL_INIT_MODE=never/' /opt/sos/backend.env
      echo "   Tablas creadas; los próximos reinicios conservan los datos"
    fi
    echo "Deploy listo ✔  (logs: sudo journalctl -u sos-backend -f)"; exit 0
  fi
  sleep 3
done
echo "El backend no respondió. Revisa: sudo journalctl -u sos-backend -n 80"; exit 1
