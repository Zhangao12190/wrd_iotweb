# WRD IoT Platform / WRD 物联网平台

多语言(中文 / 日本語 / English)工业设备物联网平台。支持四类设备的接入、实时遥测显示、
基础 IoT 平台能力,并面向 **平台 / 经销商 / 终端用户** 三类角色提供差异化功能,
经销商可按 **销往国家** 维度查看其设备运行情况。

A multilingual (Chinese / Japanese / English) IoT platform for industrial equipment. It
ingests and displays real-time telemetry from four device categories, offers core IoT
platform capabilities, and provides role-aware features for **platform admins / dealers /
end-users** — with a per-country breakdown for dealers.

---

## 支持的设备类型 / Device types

| key | 中文 | 日本語 | English |
| --- | --- | --- | --- |
| `plasma_cutter` | 等离子切割机 | プラズマ切断機 | Plasma Cutter |
| `welder` | 焊机 | 溶接機 | Welder |
| `water_tank` | 智能水箱 | スマート水タンク | Smart Water Tank |
| `gas_control_box` | 气控箱 | ガス制御ボックス | Gas Control Box |

每种设备有各自的遥测指标(电流、电压、温度、气压、水位、pH、流量、阀门开度、泄漏报警等),
后端会对越限数据评估出 `normal / warning / critical` 告警等级。

## 角色与权限 / Roles & access control

平台采用三级角色模型,数据可见范围在后端按角色统一过滤(REST 与 WebSocket 一致):

| 角色 Role | 可见数据 Scope | 主要功能 Capabilities |
| --- | --- | --- |
| **平台管理员 admin** | 全部设备 / 用户 / 经销商 | 管理经销商、用户、设备;查看全局总览与国家分布 |
| **经销商 dealer** | 自己售出的设备及名下终端用户 | 管理自己的设备与终端用户;**按销往国家查看数据** |
| **终端用户 user** | 仅自己拥有的设备 | 查看自己设备的实时数据与历史 |

- `admin` 创建经销商/用户并分配设备;
- `dealer` 在自己名下创建终端用户、登记设备,并按国家维度查看销售与运行情况;
- `user` 登录后只能看到属于自己的设备。

## 主要功能 / Features

- 🌐 **三语言**:中文 / 日本語 / English,可即时切换并随账号持久化。
- 📡 **实时遥测**:设备数据通过 WebSocket 实时推送(按角色过滤),设备详情页含实时曲线与指标卡。
- 🧭 **总览仪表盘**:设备总数、在线率、告警统计、按类型/状态/国家的图表。
- 🗺️ **经销商按国家统计**:国家 × 设备类型矩阵热力图、各国在线/告警概览。
- ⚙️ **设备管理**:筛选(类型/国家/状态/搜索)、新增、详情、历史与事件。
- 🚨 **告警引擎**:遥测越限自动判定 warning/critical 并生成事件。
- 🔌 **设备上报接口**:`POST /api/ingest` 模拟 MQTT/HTTP 网关上行(便于真实设备接入)。
- 🧪 **内置模拟器**:开箱即用地生成四类设备的实时数据。

## 技术栈 / Tech stack

- **后端 `server/`**:Node.js + Express + WebSocket(`ws`)+ SQLite(`better-sqlite3`)+ JWT 鉴权 + RBAC。
- **前端 `web/`**:Vite + React + TypeScript + react-i18next + React Router + Recharts。

## 目录结构 / Layout

```
server/   后端 API + WebSocket + 模拟器
  src/
    deviceTypes.js   四类设备的指标定义与告警评估
    db.js            SQLite schema
    auth.js / rbac.js  鉴权与角色数据范围
    wsHub.js         WebSocket 实时推送(按角色过滤)
    ingest.js        遥测写入(模拟器与上报接口共用)
    simulator.js     设备遥测模拟器
    seed.js          演示数据(管理员/经销商/用户/设备)
    routes/          auth / devices / telemetry / stats / users / ingest
web/      前端单页应用
  src/
    i18n/locales/    zh / ja / en 三语言文案
    pages/           Login / Dashboard / Devices / DeviceDetail / Countries / Users
    components/       Layout / 语言切换 / 表单弹窗 / 徽标
    hooks/useRealtime.ts  WebSocket 客户端
```

## 快速开始 / Getting started

```bash
# 1) 安装依赖
npm install --prefix server
npm install --prefix web

# 2A) 开发模式(两个终端)
npm --prefix server run dev   # http://localhost:4000  (API + WS + 模拟器)
npm --prefix web run dev      # http://localhost:5173  (Vite 开发服务器,已代理 /api 与 /ws)

# 2B) 生产模式(单服务部署:后端直接托管前端构建产物)
npm --prefix web run build
npm --prefix server run start # 打开 http://localhost:4000
```

> 首次启动会自动初始化 SQLite 并写入演示数据。

### Docker(单端口一键运行)/ One-command Docker

```bash
docker compose up -d --build      # 打开 http://localhost:4000
```

镜像为单端口生产部署:同一进程提供 API + WebSocket 并托管前端,SQLite 数据持久化在 `wrd-data` 卷。

### 部署 / Deploy

- **自托管服务器 + Docker** [`deploy/self-hosted/DEPLOY.md`](deploy/self-hosted/DEPLOY.md):在自有 Linux 服务器上一键部署(如 `http://<IP>:9111`)。**注意:TCP 端口最大 65535,不能使用 91111**。
- **腾讯云(推荐)** [`deploy/tencent/DEPLOY-TENCENT.md`](deploy/tencent/DEPLOY-TENCENT.md):
  - **CloudBase 云托管 + GitHub 自动部署** ⭐:用现成 Dockerfile 部署,自动分配公网 HTTPS 域名、原生支持 WebSocket、无访问缩容到 0;配好 3 个 GitHub Secrets 后,**每次推送自动重新部署,固定 URL 直接预览**。
  - 轻量应用服务器 Lighthouse + Docker:便宜的固定服务器方案。
- **AWS** [`deploy/aws/DEPLOY-AWS.md`](deploy/aws/DEPLOY-AWS.md):EC2+Docker / ECS Fargate+ALB+EFS / CloudFront 全球访问。

> 自动部署工作流见 [`.github/workflows/deploy-cloudbase.yml`](.github/workflows/deploy-cloudbase.yml)。

### 演示账号 / Demo accounts

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123` | 平台管理员 |
| `dealer_jp` / `dealer_eu` / `dealer_us` | `dealer123` | 经销商(分别面向 JP·KR·TW / DE·FR·IT / US·MX·CA 市场) |
| `user1` … `user9` | `user123` | 终端用户 |

## 设备数据上报 / Device data ingestion

真实设备(或网关)可通过以下接口上报遥测,平台会评估告警并实时广播给有权限的客户端:

```bash
curl -X POST http://localhost:4000/api/ingest \
  -H 'Content-Type: application/json' \
  -d '{"serial":"GCB-TW-1001","payload":{"gas_pressure":8.2,"temperature":42}}'
```

生产环境可将该接口替换/对接为 MQTT broker,统一调用 `ingestTelemetry()` 即可。

## 环境变量 / Environment

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `4000` | 后端端口 |
| `JWT_SECRET` | `wrd-iot-dev-secret-change-me` | 生产环境务必修改 |
| `SIMULATOR` | 开启 | 设为 `off` 关闭内置模拟器 |
| `SIM_INTERVAL_MS` | `4000` | 模拟器上报间隔(毫秒) |
| `DB_PATH` | `server/data.sqlite` | SQLite 文件路径 |
