# Task Packet: P1-3 K8s Production Manifests

## Goal

Create production-ready Kubernetes manifests (Deployment, Service, Ingress, HPA) to enable cloud deployment of Pantheon Base.

## Priority

**P1 - High** (Cloud deployment readiness)

## Source

Cross-Review Report: Enterprise deployment requirement
TASK_MASTER_PLAN.md: P1-3 task specification

## Dependencies

- **Blocked by**: None (can start immediately)
- **Enables**: Cloud/Kubernetes deployment

## Current State

**Finding**: No `k8s/` directory exists in repository.

```bash
$ find . -name "k8s" -o -name "kubernetes" -type d
# No results
```

**Deployment documentation**: Check `docs/DEPLOYMENT_GUIDE.md` for current deployment methods.

## Scope

### In

- Kubernetes manifests directory structure
- Backend Deployment (pantheon-backend)
- Frontend Deployment (pantheon-frontend, if needed)
- Backend Service (ClusterIP)
- Ingress (HTTPS with TLS)
- HorizontalPodAutoscaler (CPU/memory based)
- ConfigMap for environment variables
- Secret for sensitive config (DSN, Redis password)
- Resource limits and requests
- Liveness and readiness probes
- Documentation (README.md in k8s/)

### Out

- Helm charts (plain manifests for now)
- StatefulSet for databases (use external MySQL/Redis)
- Persistent volumes (stateless backend)
- Service mesh (Istio/Linkerd)
- GitOps (ArgoCD/Flux)
- Multi-cluster deployment

## Assumptions

- **External dependencies**: MySQL and Redis are managed services (not in-cluster)
- **Container registry**: Assumes images pushed to registry (e.g., ghcr.io, Docker Hub)
- **Ingress controller**: Cluster has NGINX Ingress Controller installed
- **TLS**: Let's Encrypt or managed certificate
- **Namespace**: Deploy to `pantheon` namespace

## Minimum Viable Approach

Create `k8s/` directory with:

1. **Namespace** (`namespace.yaml`)
2. **ConfigMap** (`configmap.yaml`) - Non-sensitive environment variables
3. **Secret** (`secret.yaml`) - Sensitive config (base64 encoded)
4. **Backend Deployment** (`backend-deployment.yaml`)
5. **Backend Service** (`backend-service.yaml`)
6. **Ingress** (`ingress.yaml`)
7. **HPA** (`hpa.yaml`)
8. **README.md** - Deployment instructions

## Implementation

### Directory Structure

```
k8s/
├── README.md
├── namespace.yaml
├── configmap.yaml
├── secret.yaml.example
├── backend/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
└── ingress.yaml
```

### 1. Namespace

**File**: `k8s/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pantheon
  labels:
    name: pantheon
    environment: production
```

### 2. ConfigMap

**File**: `k8s/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pantheon-config
  namespace: pantheon
data:
  PANTHEON_ENV: "production"
  PANTHEON_PORT: "8080"
  PANTHEON_AUTO_MIGRATE: "false"
  PANTHEON_METRICS_ENABLED: "true"
  PANTHEON_METRICS_PUBLIC: "false"
  PANTHEON_API_RATE_LIMIT_ENABLED: "true"
  PANTHEON_API_RATE_LIMIT_MAX: "6000"
  PANTHEON_API_RATE_LIMIT_WINDOW_SECONDS: "60"
  OTEL_EXPORTER_OTLP_ENDPOINT: ""  # Optional: telemetry endpoint
  CSP_REPORT_URI: ""  # Optional: CSP violation reporting
```

### 3. Secret (Example)

**File**: `k8s/secret.yaml.example`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pantheon-secret
  namespace: pantheon
type: Opaque
stringData:
  PANTHEON_DSN: "user:password@tcp(mysql-host:3306)/pantheon?charset=utf8mb4&parseTime=True&loc=Local"
  PANTHEON_REDIS_ADDR: "redis-host:6379"
  PANTHEON_REDIS_PASSWORD: "redis-password"
  PANTHEON_METRICS_BEARER_TOKEN: "your-metrics-token"
```

**Note**: Actual `secret.yaml` should be gitignored and managed via sealed secrets or external secrets operator.

### 4. Backend Deployment

**File**: `k8s/backend/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pantheon-backend
  namespace: pantheon
  labels:
    app: pantheon-backend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pantheon-backend
  template:
    metadata:
      labels:
        app: pantheon-backend
        version: v1
    spec:
      containers:
      - name: backend
        image: ghcr.io/duanxldragon/pantheon-base/backend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        envFrom:
        - configMapRef:
            name: pantheon-config
        - secretRef:
            name: pantheon-secret
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      restartPolicy: Always
```

### 5. Backend Service

**File**: `k8s/backend/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: pantheon-backend
  namespace: pantheon
  labels:
    app: pantheon-backend
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: pantheon-backend
```

### 6. Ingress

**File**: `k8s/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pantheon-ingress
  namespace: pantheon
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - pantheon.example.com
    secretName: pantheon-tls
  rules:
  - host: pantheon.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: pantheon-backend
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pantheon-backend
            port:
              number: 8080
```

### 7. HorizontalPodAutoscaler

**File**: `k8s/backend/hpa.yaml`

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pantheon-backend-hpa
  namespace: pantheon
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pantheon-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

### 8. README.md

**File**: `k8s/README.md`

```markdown
# Pantheon Base Kubernetes Deployment

Production-ready Kubernetes manifests for deploying Pantheon Base.

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- NGINX Ingress Controller installed
- cert-manager for TLS (optional but recommended)
- External MySQL and Redis instances

## Quick Start

### 1. Create Namespace

\`\`\`bash
kubectl apply -f namespace.yaml
\`\`\`

### 2. Configure Secrets

Copy and edit the secret example:

\`\`\`bash
cp secret.yaml.example secret.yaml
# Edit secret.yaml with your actual credentials
kubectl apply -f secret.yaml
\`\`\`

**Important**: Do not commit `secret.yaml` to version control.

### 3. Apply ConfigMap

\`\`\`bash
kubectl apply -f configmap.yaml
\`\`\`

### 4. Deploy Backend

\`\`\`bash
kubectl apply -f backend/
\`\`\`

### 5. Configure Ingress

Edit `ingress.yaml`:
- Replace `pantheon.example.com` with your domain
- Update TLS secret name if needed

\`\`\`bash
kubectl apply -f ingress.yaml
\`\`\`

## Verify Deployment

\`\`\`bash
# Check pods
kubectl get pods -n pantheon

# Check services
kubectl get svc -n pantheon

# Check ingress
kubectl get ingress -n pantheon

# View logs
kubectl logs -n pantheon -l app=pantheon-backend --tail=100

# Check health
curl https://pantheon.example.com/health
\`\`\`

## Scaling

### Manual Scaling

\`\`\`bash
kubectl scale deployment pantheon-backend -n pantheon --replicas=5
\`\`\`

### Autoscaling

HPA is configured to scale between 3-10 replicas based on CPU/memory:

\`\`\`bash
kubectl get hpa -n pantheon
kubectl describe hpa pantheon-backend-hpa -n pantheon
\`\`\`

## Updating

### Update Image

\`\`\`bash
kubectl set image deployment/pantheon-backend \
  backend=ghcr.io/duanxldragon/pantheon-base/backend:v0.11.2 \
  -n pantheon
\`\`\`

### Rollback

\`\`\`bash
kubectl rollout undo deployment/pantheon-backend -n pantheon
\`\`\`

## Monitoring

### Metrics Endpoint

Metrics are exposed at `/metrics` (protected by bearer token):

\`\`\`bash
kubectl port-forward -n pantheon svc/pantheon-backend 8080:8080
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/metrics
\`\`\`

### Resource Usage

\`\`\`bash
kubectl top pods -n pantheon
kubectl top nodes
\`\`\`

## Troubleshooting

### Pod Not Starting

\`\`\`bash
kubectl describe pod -n pantheon -l app=pantheon-backend
kubectl logs -n pantheon -l app=pantheon-backend --previous
\`\`\`

### Database Connection Issues

\`\`\`bash
# Check secret
kubectl get secret pantheon-secret -n pantheon -o yaml

# Test connection from pod
kubectl exec -it -n pantheon deployment/pantheon-backend -- sh
# Inside pod: nc -zv mysql-host 3306
\`\`\`

### Ingress Not Working

\`\`\`bash
kubectl describe ingress pantheon-ingress -n pantheon
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
\`\`\`

## Security Notes

- **Secret Management**: Use Sealed Secrets or External Secrets Operator for production
- **Network Policies**: Consider adding NetworkPolicy for pod-to-pod communication
- **RBAC**: Follow least-privilege principle for service accounts
- **Image Scanning**: Scan container images for vulnerabilities before deployment
- **TLS**: Ensure cert-manager is properly configured for automatic certificate renewal

## Resource Requirements

### Minimum (per pod)
- CPU: 250m
- Memory: 512Mi

### Recommended (per pod)
- CPU: 500m - 1 core
- Memory: 1Gi

### Cluster Sizing

For production with 3-10 replicas:
- **Small**: 3 nodes, 4 vCPU, 8GB RAM each
- **Medium**: 5 nodes, 8 vCPU, 16GB RAM each
- **Large**: 10+ nodes, autoscaling node groups

## External Dependencies

### MySQL

- Version: 8.0+
- Connection pooling: Handled by application
- Migrations: Run manually via `kubectl exec` before deployment

### Redis

- Version: 7.0+
- Used for: Session storage, rate limiting
- Persistence: Recommended (RDB snapshots)

## CI/CD Integration

### GitHub Actions Example

\`\`\`yaml
- name: Deploy to Kubernetes
  run: |
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/backend/
    kubectl rollout status deployment/pantheon-backend -n pantheon
\`\`\`

## Support

For issues, see:
- [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)
- [Architecture Documentation](../docs/designs/)
- [GitHub Issues](https://github.com/duanxldragon/pantheon-base/issues)
\`\`\`

## Success Criteria

- [ ] K8s manifests directory created
- [ ] Namespace manifest created
- [ ] ConfigMap created
- [ ] Secret example created
- [ ] Backend Deployment with resource limits
- [ ] Backend Service (ClusterIP)
- [ ] Ingress with TLS
- [ ] HPA configured
- [ ] Liveness/readiness probes defined
- [ ] README.md with deployment instructions
- [ ] Documentation tested (dry-run validation)

## Verification Plan

```bash
# Validate manifests (dry-run)
kubectl apply -f k8s/ --dry-run=client

# Validate YAML syntax
yamllint k8s/

# Check resource requirements
kubectl apply -f k8s/ --dry-run=server
```

## Estimated Effort

- Manifest creation: 4 hours
- Documentation: 2 hours
- Testing/validation: 2 hours
- **Total: 8 hours**

## Evidence Required

- K8s manifests (7-8 files)
- README.md with deployment guide
- Validation output (dry-run)
- Resource sizing calculations

## Completion Checklist

- [ ] Directory structure created
- [ ] All manifests written
- [ ] Secret example (not actual secrets)
- [ ] Resource limits defined
- [ ] Health probes configured
- [ ] HPA with scaling policies
- [ ] README.md complete
- [ ] Dry-run validation passed
- [ ] Documentation reviewed

## Linkage

- **Task ID**: 2026-09-08-p1-k8s-manifests
- **Depends on**: None
- **Blocks**: Cloud deployment
- **Related**: P1-5 (Performance Baseline - capacity planning)
- **Evidence Directory**: `.harness/evidence/2026-09-08-p1-k8s-manifests/`
- **Priority**: P1 (High - Cloud readiness)
