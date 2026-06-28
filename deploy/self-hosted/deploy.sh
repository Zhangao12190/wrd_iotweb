#!/usr/bin/env bash
# One-shot deploy for a Linux server with Docker + Compose v2.
# Default: http://<server-ip>:9111
#
# Override:
#   HOST_PORT=9111 JWT_SECRET=... ./deploy.sh
#   APP_DIR=/opt/wrd-iot REPO_URL=https://github.com/Zhangao12190/wrd_iotweb.git ./deploy.sh
set -euo pipefail

HOST_PORT="${HOST_PORT:-9111}"
APP_DIR="${APP_DIR:-/opt/wrd-iot}"
REPO_URL="${REPO_URL:-https://github.com/Zhangao12190/wrd_iotweb.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ "$HOST_PORT" -lt 1 ] || [ "$HOST_PORT" -gt 65535 ]; then
  echo "错误: HOST_PORT=$HOST_PORT 无效。TCP 端口范围是 1–65535（91111 超出上限）。"
  echo "建议使用 9111 或 11111。"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker，正在安装..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker 2>/dev/null || service docker start 2>/dev/null || true
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未检测到 Docker Compose 插件，请安装后重试。"
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "已自动生成 JWT_SECRET（已写入 $APP_DIR/.env.prod）"
fi

mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  echo "更新代码: $APP_DIR ($BRANCH)"
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull origin "$BRANCH"
else
  echo "克隆仓库到 $APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cat >"$APP_DIR/.env.prod" <<EOF
HOST_PORT=$HOST_PORT
JWT_SECRET=$JWT_SECRET
SIM_INTERVAL_MS=${SIM_INTERVAL_MS:-4000}
EOF

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
source .env.prod
set +a

echo "构建并启动容器（宿主机端口 $HOST_PORT -> 容器 4000）..."
docker compose -f "$COMPOSE_FILE" up -d --build

# Best-effort firewall (ignore failures on distros without ufw/firewalld)
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow "${HOST_PORT}/tcp" || true
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port="${HOST_PORT}/tcp" 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
fi

PUBLIC_IP="${PUBLIC_IP:-$(curl -fsS --max-time 3 ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')}"
echo ""
echo "部署完成。"
echo "  访问地址: http://${PUBLIC_IP}:${HOST_PORT}"
echo "  健康检查: curl http://127.0.0.1:${HOST_PORT}/api/health"
echo "  查看日志: docker compose -f $COMPOSE_FILE logs -f"
echo "  演示账号: admin / admin123"
