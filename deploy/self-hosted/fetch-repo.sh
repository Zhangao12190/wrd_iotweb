#!/usr/bin/env bash
# Fetch project source when git clone over HTTPS fails (common on CN servers: GnuTLS -110).
# Tries, in order: existing dir, SSH:443, HTTPS token, GitHub zipball API.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/wrd-iot}"
REPO_SLUG="${REPO_SLUG:-Zhangao12190/wrd_iotweb}"
BRANCH="${BRANCH:-main}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/github_deploy}"

if [ -f "$APP_DIR/Dockerfile" ] && [ -f "$APP_DIR/docker-compose.prod.yml" ]; then
  echo "代码目录已存在: $APP_DIR"
  exit 0
fi

mkdir -p "$(dirname "$APP_DIR")"

setup_ssh_443() {
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  if ! grep -q 'Host github.com' "$HOME/.ssh/config" 2>/dev/null; then
    cat >>"$HOME/.ssh/config" <<'EOF'
Host github.com
  Hostname ssh.github.com
  Port 443
  User git
EOF
    chmod 600 "$HOME/.ssh/config"
  fi
  ssh-keyscan -p 443 ssh.github.com >>"$HOME/.ssh/known_hosts" 2>/dev/null || true
}

try_ssh_clone() {
  setup_ssh_443
  if [ ! -f "$SSH_KEY" ]; then
    echo "生成 GitHub 部署密钥: $SSH_KEY"
    ssh-keygen -t ed25519 -N "" -f "$SSH_KEY" -q
    echo ""
    echo "请把下面公钥添加到 GitHub 仓库 → Settings → Deploy keys → Add（勾选 Read）："
    echo "----------"
    cat "${SSH_KEY}.pub"
    echo "----------"
    echo "添加完成后按回车继续..."
    read -r _
  fi
  echo "尝试 SSH:443 克隆..."
  GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new" \
    git clone --depth 1 --branch "$BRANCH" "git@github.com:${REPO_SLUG}.git" "$APP_DIR"
}

try_https_clone() {
  local url="https://github.com/${REPO_SLUG}.git"
  if [ -n "$GITHUB_TOKEN" ]; then
    url="https://${GITHUB_TOKEN}@github.com/${REPO_SLUG}.git"
  fi
  echo "尝试 HTTPS 浅克隆..."
  git -c http.postBuffer=524288000 -c http.version=HTTP/1.1 clone --depth 1 --branch "$BRANCH" "$url" "$APP_DIR"
}

try_zipball() {
  if [ -z "$GITHUB_TOKEN" ]; then
    return 1
  fi
  echo "尝试 GitHub API 下载 zip 包..."
  local zip="/tmp/wrd-iot-${BRANCH}.zip"
  curl -fSL --retry 5 --retry-delay 3 --http1.1 \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -o "$zip" \
    "https://api.github.com/repos/${REPO_SLUG}/zipball/${BRANCH}"
  rm -rf "$APP_DIR"
  unzip -q "$zip" -d /tmp
  local extracted
  extracted=$(find /tmp -maxdepth 1 -type d -name 'wrd_iotweb-*' -o -name 'Zhangao12190-wrd_iotweb-*' 2>/dev/null | head -1)
  if [ -z "$extracted" ]; then
    extracted=$(find /tmp -maxdepth 1 -type d -newer "$zip" ! -path /tmp 2>/dev/null | head -1)
  fi
  if [ -z "$extracted" ] || [ ! -f "$extracted/Dockerfile" ]; then
    echo "zip 解压后未找到 Dockerfile"
    return 1
  fi
  mv "$extracted" "$APP_DIR"
  rm -f "$zip"
}

echo "获取代码到 $APP_DIR ..."

if try_ssh_clone 2>/dev/null; then exit 0; fi
rm -rf "$APP_DIR" 2>/dev/null || true

if try_https_clone 2>/dev/null; then exit 0; fi
rm -rf "$APP_DIR" 2>/dev/null || true

if try_zipball 2>/dev/null; then exit 0; fi
rm -rf "$APP_DIR" 2>/dev/null || true

echo ""
echo "所有自动拉取方式均失败。请任选一种手动方案："
echo "  1) SSH:443 — 运行: bash deploy/self-hosted/fetch-repo.sh（按提示添加 Deploy key）"
echo "  2) 本地上传 — 在你电脑上: scp -r wrd_iotweb root@122.51.242.230:/opt/wrd-iot"
echo "  3) 临时公开仓库后用镜像: git clone https://gitclone.com/github.com/${REPO_SLUG}.git $APP_DIR"
echo "  4) 导入到 Gitee 后从 gitee.com 克隆"
exit 1
