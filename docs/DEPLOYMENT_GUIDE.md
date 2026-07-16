# Pantheon Base 生产部署指南

**版本**: v0.8.3  
**最后更新**: 2026-06-22  
**适用环境**: Kubernetes / Docker Compose

---

## 📋 部署前准备

### 系统要求

**最低配置**:
- CPU: 2 核
- 内存: 4GB
- 磁盘: 20GB

**推荐配置**:
- CPU: 4 核
- 内存: 8GB
- 磁盘: 100GB (SSD)

### 依赖服务

| 服务 | 版本 | 必需 | 用途 |
|------|------|------|------|
| MySQL | 8.0+ | ✅ 是 | 主数据库 |
| Redis | 7.0+ | ⚠️ 推荐 | 会话管理、速率限制 |
| Prometheus | 2.x+ | ⚠️ 推荐 | 指标采集 |
| Grafana | 10.x+ | ⚠️ 推荐 | 监控可视化 |
| Jaeger/Tempo | latest | ⚠️ 推荐 | 分布式追踪 |
| Loki/ELK | latest | 可选 | 日志聚合 |

---

## 🐳 Docker Compose 部署

### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  # 主应用
  pantheon-base:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pantheon-base
    ports:
      - "8080:8080"
    environment:
      PANTHEON_ENV: production
      PANTHEON_DSN: "root:${MYSQL_ROOT_PASSWORD}@tcp(mysql:3306)/pantheon?charset=utf8mb4&parseTime=True&loc=UTC"
      PANTHEON_REDIS_ADDR: "redis:6379"
      PANTHEON_REDIS_PASSWORD: "${REDIS_PASSWORD}"
      OTEL_EXPORTER_OTLP_ENDPOINT: "jaeger:4318"
      TZ: Asia/Shanghai
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - pantheon-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: pantheon-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: pantheon
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password
    restart: unless-stopped
    networks:
      - pantheon-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: pantheon-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - pantheon-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: pantheon-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./grafana/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./grafana/prometheus-rules.yml:/etc/prometheus/rules/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: unless-stopped
    networks:
      - pantheon-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: pantheon-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/dashboards
    restart: unless-stopped
    networks:
      - pantheon-network
    depends_on:
      - prometheus

  # Jaeger (追踪)
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: pantheon-jaeger
    ports:
      - "4318:4318"  # OTLP HTTP
      - "16686:16686"  # Jaeger UI
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    restart: unless-stopped
    networks:
      - pantheon-network

networks:
  pantheon-network:
    driver: bridge

volumes:
  mysql-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

### 2. 创建 .env 文件

```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=your_strong_mysql_password_here

# Redis 配置
REDIS_PASSWORD=your_strong_redis_password_here

# Grafana 配置
GRAFANA_ADMIN_PASSWORD=your_strong_grafana_password_here
```

### 3. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f pantheon-base

# 检查服务状态
docker-compose ps

# 测试健康检查
curl http://localhost:8080/api/v1/health
```

---

## ☸️ Kubernetes 部署

### 1. 创建 Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pantheon
  labels:
    name: pantheon
```

### 2. 创建 ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pantheon-config
  namespace: pantheon
data:
  PANTHEON_ENV: "production"
  TZ: "Asia/Shanghai"
  OTEL_EXPORTER_OTLP_ENDPOINT: "jaeger-collector:4318"
```

### 3. 创建 Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: pantheon-secret
  namespace: pantheon
type: Opaque
stringData:
  PANTHEON_DSN: "root:YOUR_PASSWORD@tcp(mysql:3306)/pantheon?charset=utf8mb4&parseTime=True&loc=UTC"
  PANTHEON_REDIS_ADDR: "redis:6379"
  PANTHEON_REDIS_PASSWORD: "YOUR_REDIS_PASSWORD"
  MYSQL_ROOT_PASSWORD: "YOUR_MYSQL_PASSWORD"
```

**⚠️ 重要**: 使用以下命令创建 Secret（不要直接提交明文）:

```bash
kubectl create secret generic pantheon-secret \
  --from-literal=PANTHEON_DSN='root:YOUR_PASSWORD@tcp(mysql:3306)/pantheon?charset=utf8mb4&parseTime=True&loc=UTC' \
  --from-literal=PANTHEON_REDIS_ADDR='redis:6379' \
  --from-literal=PANTHEON_REDIS_PASSWORD='YOUR_REDIS_PASSWORD' \
  --from-literal=MYSQL_ROOT_PASSWORD='YOUR_MYSQL_PASSWORD' \
  -n pantheon
```

### 4. 创建 Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pantheon-base
  namespace: pantheon
  labels:
    app: pantheon-base
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pantheon-base
  template:
    metadata:
      labels:
        app: pantheon-base
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: pantheon-base
        image: pantheon-base:0.8.3
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        env:
        - name: PANTHEON_ENV
          valueFrom:
            configMapKeyRef:
              name: pantheon-config
              key: PANTHEON_ENV
        - name: PANTHEON_DSN
          valueFrom:
            secretKeyRef:
              name: pantheon-secret
              key: PANTHEON_DSN
        - name: PANTHEON_REDIS_ADDR
          valueFrom:
            secretKeyRef:
              name: pantheon-secret
              key: PANTHEON_REDIS_ADDR
        - name: PANTHEON_REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: pantheon-secret
              key: PANTHEON_REDIS_PASSWORD
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: pantheon-config
              key: OTEL_EXPORTER_OTLP_ENDPOINT
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

### 5. 创建 Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: pantheon-base
  namespace: pantheon
  labels:
    app: pantheon-base
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: pantheon-base
```

### 6. 创建 Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pantheon-base
  namespace: pantheon
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - pantheon.example.com
    secretName: pantheon-tls
  rules:
  - host: pantheon.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pantheon-base
            port:
              number: 80
```

### 7. 部署到 K8s

```bash
# 应用所有配置
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 查看部署状态
kubectl get pods -n pantheon
kubectl get svc -n pantheon
kubectl get ingress -n pantheon

# 查看日志
kubectl logs -f -l app=pantheon-base -n pantheon

# 扩容
kubectl scale deployment pantheon-base --replicas=5 -n pantheon
```

---

## 🔧 环境变量配置

### 必需配置

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `PANTHEON_DSN` | `root:pass@tcp(mysql:3306)/pantheon?...` | MySQL 连接字符串 |

### 推荐配置

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `PANTHEON_ENV` | `production` | 环境标识（影响日志格式和 CSP） |
| `PANTHEON_REDIS_ADDR` | `redis:6379` | Redis 地址（速率限制、会话） |
| `PANTHEON_REDIS_PASSWORD` | `your_password` | Redis 密码 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `jaeger:4318` | OpenTelemetry 端点 |

### 可选配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PANTHEON_PORT` | `8080` | 服务端口 |
| `CSP_REPORT_URI` | - | CSP 违规报告端点 |
| `PANTHEON_ALLOWED_ORIGINS` | - | CORS 允许的源（逗号分隔） |
| `PANTHEON_METRICS_ENABLED` | `true` | 是否注册 `/metrics` 端点；设为 `false` 可完全关闭 |
| `PANTHEON_METRICS_BEARER_TOKEN` | - | `/metrics` Bearer token；生产环境推荐配置 |
| `PANTHEON_METRICS_PUBLIC` | `false` | 生产环境是否允许无 token 暴露 `/metrics`；仅限内网或网关已保护场景 |
| `PANTHEON_OPERATION_LOG_QUEUE_SIZE` | `1024` | 操作日志异步写入队列大小；队列满时会短超时同步降级写入 |
| `PANTHEON_GENERATOR_DATASOURCE_ALLOW_PRIVATE` | `false` | 低代码生成器数据源是否允许私网地址（RFC1918）。默认拒绝以收窄 SSRF 面；数据库位于内网网段时需显式设为 `true` |

---

## 🔐 安全配置清单

### 生产环境必做

- [ ] 修改所有默认密码
- [ ] 启用 HTTPS (TLS/SSL)
- [ ] 配置防火墙规则
- [ ] 设置 `PANTHEON_ENV=production`
- [ ] 配置 `PANTHEON_ALLOWED_ORIGINS`（严格 CORS）
- [ ] 为 `/metrics` 配置 `PANTHEON_METRICS_BEARER_TOKEN`，或确认仅内网暴露后显式设置 `PANTHEON_METRICS_PUBLIC=true`
- [ ] 启用 Redis（速率限制）
- [ ] 定期备份数据库
- [ ] 配置日志轮转
- [ ] 监控告警规则
- [ ] 定期更新依赖

---

## 📊 监控配置

### Prometheus 采集

在 `prometheus.yml` 中添加：

```yaml
scrape_configs:
  - job_name: 'pantheon-base'
    static_configs:
      - targets: ['pantheon-base:8080']
    metrics_path: '/metrics'
    authorization:
      type: Bearer
      credentials: '${PANTHEON_METRICS_BEARER_TOKEN}'
```

### Grafana 仪表板导入

```bash
# 导入所有仪表板
cd grafana/dashboards
for file in *.json; do
  curl -X POST http://admin:${GRAFANA_PASSWORD}@grafana:3000/api/dashboards/db \
    -H "Content-Type: application/json" \
    -d @"$file"
done
```

---

## 🔄 备份与恢复

### 数据库备份

```bash
# 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mysql"
MYSQL_PASSWORD="your_password"

# 创建备份
mysqldump -u root -p${MYSQL_PASSWORD} pantheon > ${BACKUP_DIR}/pantheon_${DATE}.sql

# 压缩备份
gzip ${BACKUP_DIR}/pantheon_${DATE}.sql

# 保留最近 7 天的备份
find ${BACKUP_DIR} -name "pantheon_*.sql.gz" -mtime +7 -delete
```

### 恢复数据库

```bash
# 解压备份
gunzip pantheon_20260622_120000.sql.gz

# 恢复数据库
mysql -u root -p pantheon < pantheon_20260622_120000.sql
```

---

## 🐛 故障排查

### 常见问题

**1. 服务无法启动**
```bash
# 检查日志
docker-compose logs pantheon-base
kubectl logs -l app=pantheon-base -n pantheon

# 检查健康状态
curl http://localhost:8080/api/v1/health
```

**2. 数据库连接失败**
```bash
# 测试数据库连接
mysql -h mysql -u root -p

# 检查 DSN 配置
echo $PANTHEON_DSN
```

**3. Redis 连接失败**
```bash
# 测试 Redis 连接
redis-cli -h redis -a your_password ping

# 检查 Redis 配置
echo $PANTHEON_REDIS_ADDR
```

**4. 高内存使用**
```bash
# 查看内存使用
docker stats pantheon-base
kubectl top pods -n pantheon

# 调整资源限制
# 修改 deployment.yaml 中的 resources
```

---

## 📚 附录

### 端口清单

| 端口 | 服务 | 说明 |
|------|------|------|
| 8080 | 主应用 | HTTP API |
| 3306 | MySQL | 数据库 |
| 6379 | Redis | 缓存/会话 |
| 9090 | Prometheus | 指标采集 |
| 3000 | Grafana | 监控面板 |
| 16686 | Jaeger | 追踪 UI |
| 4318 | Jaeger | OTLP HTTP |

### 性能调优

**数据库连接池**:
```go
// backend/pkg/database/gorm.go
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
sqlDB.SetConnMaxLifetime(time.Hour)
```

**Gin 模式**:
```bash
# 生产环境使用 release 模式
export GIN_MODE=release
```

---

**文档版本**: 1.0  
**最后更新**: 2026-06-22  
**维护者**: DevOps Team
