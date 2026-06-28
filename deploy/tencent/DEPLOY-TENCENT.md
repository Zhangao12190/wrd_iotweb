# 部署到腾讯云 / Deploying to Tencent Cloud

本应用是**单端口 Node 服务**(同一进程提供 REST API + WebSocket 实时推送 + 托管前端 `web/dist`),数据默认存于本地 **SQLite**。下面给两种腾讯云方案,**首选「云托管 CloudBase Run」**,因为它能自动给你一个公网 URL、原生支持 WebSocket、无访问时缩容到 0(几乎不花钱),非常适合"每次预览改动"。

---

## 方案一(推荐):CloudBase 云托管 + GitHub 自动部署 ⭐

> 效果:**每次我把改动推送到分支,GitHub Actions 自动重新部署,你用同一个固定的公网 HTTPS 域名就能看到最新版。**

云托管特性(已核实):容器模式可直接用我们根目录的 `Dockerfile`;系统自动分配公网域名 `https://{服务名}-{随机串}.{地域}.app.tcloudbase.com`;**原生支持 WebSocket / SSE**;无请求时缩容到 0、按量计费。

### 步骤

1. **开通云开发并创建环境**
   - 打开 [腾讯云开发 CloudBase 控制台](https://console.cloud.tencent.com/tcb) → 创建一个环境(按量计费即可)。
   - 记下 **环境 ID(ENV_ID)**,形如 `xxx-1g2h3j4k5l`。

2. **获取 API 密钥**
   - 打开 [访问管理 → API 密钥管理](https://console.cloud.tencent.com/cam/capi) → 创建,记下 **SecretId** 与 **SecretKey**。

3. **在 GitHub 仓库添加 Secrets**(Settings → Secrets and variables → Actions → New repository secret):
   | 名称 | 值 |
   | --- | --- |
   | `TCB_SECRET_ID` | 你的 SecretId |
   | `TCB_SECRET_KEY` | 你的 SecretKey |
   | `TCB_ENV_ID` | 你的云开发环境 ID |

   (可选)再加一个 **Variable** `TCB_SERVICE` 指定服务名,默认 `wrd-iot`。

4. **触发部署**
   - 工作流 `.github/workflows/deploy-cloudbase.yml` 已就绪:推送到 `main` 或本功能分支会自动跑;也可在 GitHub 的 **Actions** 页点 *Run workflow* 手动触发。
   - 部署完成后,在 **CloudBase 控制台 → 云托管 → `wrd-iot` → 服务设置 → 网络访问** 查看分配的**默认公网域名**,直接在浏览器打开即可。

5. **(建议)设置环境变量**:在该服务的「服务配置」里加 `JWT_SECRET`(一长串随机值)。不设也能跑(代码内有开发默认值),但生产请务必设置。

### 手动用 CLI 部署(可选,等价于 CI 所做)
```bash
npm i -g @cloudbase/cli
tcb login --key                       # 按提示输入 SecretId / SecretKey
tcb cloudrun deploy -e <ENV_ID> -s wrd-iot --port 4000 --force
```

### ⚠️ 数据持久化提醒
云托管实例是**无状态、可缩容到 0** 的,容器本地磁盘**不持久**。因此 SQLite 数据会在新版本/冷启动时重置(每次启动自动重新写入演示数据)——**用于预览/演示完全 OK**。若要持久保存真实设备数据,请二选一:
- 给服务挂载 **文件存储 CFS/NAS**(把 `DB_PATH` 指到挂载目录);或
- 把数据层迁移到 **云数据库 MySQL / 云开发数据库**(推荐用于生产)。

---

## 方案二(最省心的固定服务器):轻量应用服务器 Lighthouse + Docker

适合想要一台便宜、固定的服务器(约几十元/月,常有套餐),数据存本地磁盘即可持久。

1. 在 [Lighthouse 控制台](https://console.cloud.tencent.com/lighthouse) 购买一台轻量服务器:选 **Docker 应用镜像**(或纯系统后自己装 Docker),地域就近选择。
2. 防火墙放通 `80`/`443`(以及临时调试用的 `4000`)。
3. SSH 登录后:
   ```bash
   git clone https://github.com/Zhangao12190/wrd_iotweb.git /opt/wrd-iot
   cd /opt/wrd-iot
   JWT_SECRET=$(openssl rand -hex 32)
   sed -i "s/change-me-to-a-long-random-string/${JWT_SECRET}/" docker-compose.yml
   # 让它直接占用 80 端口
   sed -i 's/"4000:4000"/"80:4000"/' docker-compose.yml
   docker compose up -d --build
   ```
4. 浏览器打开 `http://<服务器公网IP>` 即可。生产建议前置 Nginx/Caddy 配 HTTPS(注意透传 WebSocket 的 `Upgrade` 头)。

---

## 让全世界都能访问 / 全球加速

- **功能层面**:平台已支持**按销往国家**查看数据(经销商「国家分布」页:各国设备数、在线率、告警 + 国家×设备类型矩阵)。
- **访问层面**:云托管/Lighthouse 上线后,可前置腾讯云 **CDN / EdgeOne** 做全球加速,并用 **DNSPod** 绑定你自己的域名。注意:腾讯云默认域名 / 国内 CDN 通常要求域名**完成备案**;若主要面向海外,可用 **EdgeOne 国际站**或海外地域,免备案。

---

## 我能直接帮你部署吗?

可以,但**这个云端运行环境里没有腾讯云凭证,也没装 `tcb` CLI 和 Docker**,所以我无法直接登录你的账号创建资源。两种让我接手的方式:

1. **最推荐**:你按上面方案一在 GitHub 加好 3 个 Secrets(`TCB_SECRET_ID/TCB_SECRET_KEY/TCB_ENV_ID`)。之后我每次推送代码,CI 就自动部署,你用固定 URL 预览——无需我持有凭证。
2. 或在 **Cursor 控制台 → Cloud Agents → Secrets** 添加 `TENCENTCLOUD_SECRET_ID`、`TENCENTCLOUD_SECRET_KEY`、`TCB_ENV_ID`,并告知我需要安装 `tcb` CLI,我就能在云端 agent 里直接执行 `tcb cloudrun deploy`。(密钥值在工具输出里会被打码为 `[REDACTED]`。)
