#!/usr/bin/env bash
# Deploy from code already on disk (uploaded via scp / zip). No git required.
# Usage:
#   sudo SKIP_CLONE=1 HOST_PORT=9111 ./install-from-upload.sh
# Or with a zip:
#   sudo ./install-from-upload.sh /tmp/wrd_iotweb.zip
set -euo pipefail

HOST_PORT="${HOST_PORT:-9111}"
APP_DIR="${APP_DIR:-/opt/wrd-iot}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ZIP_PATH="${1:-}"

if [ -n "$ZIP_PATH" ]; then
  echo "从 zip 解压: $ZIP_PATH"
  command -v unzip >/dev/null || { apt-get update && apt-get install -y unzip; }
  rm -rf "$APP_DIR"
  unzip -q "$ZIP_PATH" -d /tmp
  EXTRACTED=$(find /tmp -maxdepth 1 -type d \( -name 'wrd_iotweb*' -o -name 'Zhangao12190-wrd_iotweb*' \) 2>/dev/null | head -1)
  if [ -z "$EXTRACTED" ] || [ ! -f "$EXTRACTED/Dockerfile" ]; then
    echo "错误: zip 内未找到有效项目（需含 Dockerfile）"
    exit 1
  fi
  mv "$EXTRACTED" "$APP_DIR"
fi

if [ ! -f "$APP_DIR/Dockerfile" ]; then
  echo "错误: $APP_DIR 不存在或缺少 Dockerfile"
  echo ""
  echo "请先把代码上传到服务器，任选一种："
  echo "  scp -r wrd_iotweb root@122.51.242.230:/opt/wrd-iot"
  echo "  或上传 zip: scp wrd.zip root@122.51.242.230:/tmp/ && $0 /tmp/wrd.zip"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker 2>/dev/null || true
fi

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
export HOST_PORT
export SKIP_CLONE=1

cd "$APP_DIR"
chmod +x deploy/self-hosted/deploy.sh 2>/dev/null || true
exec ./deploy/self-hosted/deploy.sh
