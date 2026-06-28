# 自托管服务器部署 / Self-hosted deployment

将 WRD IoT 平台部署到你自己的 Linux 服务器（如腾讯云轻量 `122.51.242.230`），通过 **Docker Compose** 单端口运行（API + WebSocket + 前端）。

## 关于端口 91111

**TCP 端口最大值为 65535，`91111` 不是合法端口，无法绑定。**

若你原本想使用 `91111`，请改用以下合法端口之一：

| 推荐端口 | 访问示例 |
| --- | --- |
| **9111**（默认） | `http://122.51.242.230:9111` |
| 11111 | `http://122.51.242.230:11111` |
| 19111 | `http://122.51.242.230:19111` |

下文以 **9111** 为例；其他端口只需修改 `HOST_PORT` 环境变量。

---

## 方式一：一键脚本（推荐）

SSH 登录服务器后执行：

```bash
# 安装 git（如未安装）
sudo apt-get update && sudo apt-get install -y git curl

# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/Zhangao12190/wrd_iotweb/main/deploy/self-hosted/deploy.sh -o /tmp/deploy-wrd.sh
chmod +x /tmp/deploy-wrd.sh

# 默认端口 9111
sudo HOST_PORT=9111 /tmp/deploy-wrd.sh

# 或指定其他合法端口
sudo HOST_PORT=11111 /tmp/deploy-wrd.sh
```

脚本会：安装 Docker（如缺失）→ 克隆/更新代码到 `/opt/wrd-iot` → 生成 `JWT_SECRET` → `docker compose` 构建并启动。

---

## 方式二：手动 Docker Compose

```bash
sudo apt-get update && sudo apt-get install -y git docker.io docker-compose-v2
sudo systemctl enable --now docker

sudo git clone https://github.com/Zhangao12190/wrd_iotweb.git /opt/wrd-iot
cd /opt/wrd-iot

export HOST_PORT=9111
export JWT_SECRET=$(openssl rand -hex 32)
sudo -E docker compose -f docker-compose.prod.yml up -d --build
```

---

## 云厂商安全组 / 防火墙

除服务器本机防火墙外，还须在**云控制台安全组**放通对应端口，例如：

- 腾讯云轻量：控制台 → 实例 → 防火墙 → 添加规则 **TCP 9111**（或你选的端口）
- 本机 ufw：`sudo ufw allow 9111/tcp`

验证：

```bash
curl http://127.0.0.1:9111/api/health
# 应返回 {"ok":true,...}
```

浏览器打开：`http://122.51.242.230:9111`

---

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `HOST_PORT` | `9111` | 宿主机对外端口（须 ≤ 65535） |
| `JWT_SECRET` | 脚本自动生成 | 生产环境务必使用长随机串 |
| `SIMULATOR` | 开启 | 真实设备接入后设为 `off` |
| `SIM_INTERVAL_MS` | `4000` | 模拟器间隔（毫秒） |

在 `docker-compose.prod.yml` 的 `environment` 段可追加 `SIMULATOR: "off"`。

---

## GitHub Actions 自动部署（可选）

在仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret | 说明 |
| --- | --- |
| `SSH_HOST` | `122.51.242.230` |
| `SSH_USER` | SSH 用户名（如 `root` 或 `ubuntu`） |
| `SSH_PRIVATE_KEY` | 对应用户的私钥全文 |

可选 **Variable**：`DEPLOY_HOST_PORT`（默认 `9111`）。

在 GitHub **Actions → Deploy to Self-Hosted Server → Run workflow** 手动触发，或推送到 `main` 后自动部署。

---

## 常用运维命令

```bash
cd /opt/wrd-iot
docker compose -f docker-compose.prod.yml logs -f    # 日志
docker compose -f docker-compose.prod.yml restart    # 重启
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --build  # 更新
```

数据持久化在 Docker 卷 `wrd-data`（SQLite 路径 `/data/data.sqlite`）。

---

## 演示账号

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123` | 平台管理员 |
| `dealer_jp` | `dealer123` | 经销商 |
