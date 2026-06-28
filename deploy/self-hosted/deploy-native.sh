#!/usr/bin/env bash
# Native Node.js deploy (no Docker). For servers where Docker Hub / build is slow.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/wrd-iot}"
HOST_PORT="${HOST_PORT:-9111}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
DB_PATH="${DB_PATH:-$APP_DIR/data/data.sqlite}"
SERVICE_NAME="${SERVICE_NAME:-wrd-iot}"

if [ "$HOST_PORT" -lt 1 ] || [ "$HOST_PORT" -gt 65535 ]; then
  echo "无效端口 HOST_PORT=$HOST_PORT"
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "安装 Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential python3
fi

echo "Node $(node -v) / npm $(npm -v)"
cd "$APP_DIR"
mkdir -p "$(dirname "$DB_PATH")"

echo "安装依赖并构建前端..."
npm ci --prefix server
npm ci --prefix web
npm --prefix web run build

echo "写入 systemd 服务..."
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=WRD IoT Platform
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/server
Environment=NODE_ENV=production
Environment=PORT=${HOST_PORT}
Environment=JWT_SECRET=${JWT_SECRET}
Environment=DB_PATH=${DB_PATH}
ExecStart=$(command -v node) src/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"

sleep 2
if curl -fsS "http://127.0.0.1:${HOST_PORT}/api/health" >/dev/null; then
  echo "部署成功: http://$(curl -fsS --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):${HOST_PORT}"
else
  echo "服务未响应，查看日志: sudo journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
  exit 1
fi
