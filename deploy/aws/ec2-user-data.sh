#!/bin/bash
# EC2 user-data: installs Docker + Compose plugin on Amazon Linux 2023.
# Paste this into the "User data" box when launching the instance, or run it
# manually after SSH-ing in (as root / sudo).
set -euxo pipefail

dnf update -y
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user || true

# Docker Compose v2 plugin
mkdir -p /usr/local/lib/docker/cli-plugins
ARCH=$(uname -m)
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# --- deploy the app ---
# Option 1: clone the repo (replace with your repo URL / use a deploy key for private repos)
#   git clone https://github.com/Zhangao12190/wrd_iotweb.git /opt/wrd-iot
# Option 2: copy the project to /opt/wrd-iot via scp/rsync.
#
# Then:
#   cd /opt/wrd-iot
#   # set a strong secret first!
#   JWT_SECRET=$(openssl rand -hex 32)
#   sed -i "s/change-me-to-a-long-random-string/${JWT_SECRET}/" docker-compose.yml
#   docker compose up -d --build
#
# The app will be available on port 4000.
echo "Docker installed. Now deploy the project to /opt/wrd-iot and run: docker compose up -d --build"
