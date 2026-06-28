# 部署到 AWS / Deploying to AWS

本应用是**单端口 Node 服务**:同一个进程提供 REST API、WebSocket 实时推送,并托管前端构建产物(`web/dist`),数据存于本地 **SQLite** 文件。

> ⚠️ **SQLite 注意**:SQLite 是单文件数据库,**只能由一个实例写入**。因此下面的方案都是"单实例 + 持久卷"。如果将来需要水平扩展(多实例)或高可用,请把数据层迁移到 **Amazon RDS (PostgreSQL/MySQL)** 或 DynamoDB,再用多实例 + ALB。当前规模下单实例完全够用。

已为你准备好:根目录的 `Dockerfile`、`docker-compose.yml`,以及本目录的 `ec2-user-data.sh`。

---

## 方案 A:EC2 + Docker(最简单、最省钱,推荐先用这个上线)

适合:快速上线、演示、中小规模。原生支持 WebSocket,本地磁盘存 SQLite。

1. **启动实例**
   - AMI:Amazon Linux 2023;类型:`t3.small`(够用);存储:20 GB gp3。
   - 安全组入站:`80`(HTTP)、`443`(HTTPS,可选)、`22`(SSH,限你的 IP)。
   - 「User data」粘贴 `deploy/aws/ec2-user-data.sh` 的内容(自动装 Docker)。

2. **部署代码并启动**
   ```bash
   ssh ec2-user@<EC2公网IP>
   git clone https://github.com/Zhangao12190/wrd_iotweb.git /opt/wrd-iot   # 私有库请用 deploy key
   cd /opt/wrd-iot
   # 设置强密钥
   JWT_SECRET=$(openssl rand -hex 32)
   sed -i "s/change-me-to-a-long-random-string/${JWT_SECRET}/" docker-compose.yml
   docker compose up -d --build
   ```
   应用监听 `4000`。

3. **对外暴露 80/443**
   - 简单做法:把 `docker-compose.yml` 的端口改成 `"80:4000"`。
   - 推荐做法:前面加一个 Nginx/Caddy 反代并用 Let's Encrypt 配 HTTPS(WebSocket 需要透传 `Upgrade` 头)。

4. 浏览器打开 `http://<EC2公网IP>` 即可,用演示账号登录。

---

## 方案 B:ECS Fargate + ALB + EFS(托管、免运维服务器)

适合:不想管服务器、需要更稳的托管运行。ALB 原生支持 WebSocket,EFS 持久化 SQLite。

1. **构建并推送镜像到 ECR**
   ```bash
   AWS_REGION=ap-northeast-1            # 例:东京;按需更换
   ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
   REPO=$ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/wrd-iot

   aws ecr create-repository --repository-name wrd-iot --region $AWS_REGION || true
   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com
   docker build -t wrd-iot .
   docker tag wrd-iot:latest $REPO:latest
   docker push $REPO:latest
   ```

2. **创建基础设施**(控制台或 IaC)
   - **EFS** 文件系统(同 VPC),作为任务卷挂载到容器 `/data`(SQLite 持久化)。
   - **ECS 集群**(Fargate)。
   - **任务定义**:镜像 `$REPO:latest`;容器端口 `4000`;环境变量 `JWT_SECRET`(用 Secrets Manager 注入)、`PORT=4000`;`DB_PATH=/data/data.sqlite`;挂载 EFS 卷到 `/data`。
   - **服务**:`desiredCount=1`(SQLite 单写者,**不要 >1**);关联 **ALB**:
     - 目标组协议 HTTP、端口 4000,健康检查路径 `/api/health`。
     - 监听器 443(ACM 证书)→ 目标组;ALB 默认支持 WebSocket。
   - 安全组放通 ALB→任务的 4000。

3. 用 ALB 的 DNS(或绑自定义域名)访问。

> 提示:ECS 也有 "Express Mode" 之类的快速部署体验,可进一步简化向导。**不要使用 App Runner**:它正在被淘汰,且对持久卷/长连接支持有限。

---

## "让全世界都能访问" + 全球低延迟 / Global access

你的两层含义都覆盖到了:

1. **功能层面**:平台本身已支持**按销往国家**查看数据 —— 经销商登录后在「国家分布」页可看到各国(JP/KR/US/DE…)的设备数量、在线率、告警,以及"国家 × 设备类型"热力矩阵;管理员可见全部国家。

2. **访问层面(让各国用户都能打开网站,且更快)**:在方案 A/B 前面加一层 **Amazon CloudFront**(全球 CDN 边缘节点):
   - 源站(Origin)设为 EC2 公网域名 或 ALB 的 DNS。
   - 开启 **WebSocket**(CloudFront 默认支持长连接)。
   - 静态资源(`/assets/*`、`index.html`)走边缘缓存;`/api/*` 与 `/ws` 设为不缓存、直回源。
   - 用 **ACM** 证书 + Route 53 绑定你自己的域名,全球用户访问同一个域名即可,延迟由就近边缘节点优化。

> 数据合规提示:若设备数据涉及不同国家的数据驻留要求,可在对应区域(如东京、法兰克福、弗吉尼亚)各部署一套,再用 Route 53 **地理路由 / 延迟路由** 分流。

---

## 我能直接帮你部署吗? / Can the agent deploy for me?

可以,但需要你先提供 **AWS 凭证**。当前这个云端运行环境里没有安装 AWS CLI、也没有任何 AWS 凭证,所以我无法直接登录你的账号去创建资源。

请在 **Cursor 控制台 → Cloud Agents → Secrets** 添加以下密钥(团队/仓库级均可),它们会作为环境变量注入到新的云端 agent:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION        # 例如 ap-northeast-1
```

添加后再触发我,我就能:构建镜像、推送 ECR、创建 ECS/ALB/EFS(或 EC2),并把站点跑起来给你一个可访问的地址。出于安全考虑,密钥值在工具输出里会被打码为 `[REDACTED]`。
