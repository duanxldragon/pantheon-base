# S3 探针 MinIO Service 接线片段（搁置待恢复）

> **状态**：SUSPENDED — 2026-09-18 由维护者决定搁置（"我后面自己准备好环境之后，再处理"）。
> 恢复时：把下面两个 YAML 块按注释位置贴回 `.github/workflows/ci.yml` 的
> `unit-tests` job（services 块紧跟 redis service 之后；env 追加到 job env；
> wait step 插在 "Run Go tests with coverage" 之前），删除本文件。
> **历史**：#321（dockerhub 镜像不存在，pull 拒绝）→ #322（quay 镜像可拉，但官方镜像默认
> CMD 无 `server` 子命令，service 无法传 command，容器打印 usage 退出 → Wait 超时）→ 本回退。
> **教训**：引入新 service container 前，tag 存在性与默认 entrypoint/CMD 都必须核实；
> `Unit Tests` 不在 required checks，带红合入无人拦截。

## 方案 A（推荐）：bitnamicharts/minio:17.0.21 —— 维护者指定镜像

bitnami 容器镜像自带 `entrypoint.sh`，无需传 command 即以 server 模式启动
（`MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` 环境变量与官方一致）。tag `17.0.21`
由维护者指定；恢复前用 registry API 核实该 tag 仍可拉取（本会话本机
hub.docker.com 不可达，未能在线核实）。

```yaml
      # S3 runtime probe (tenant verification gap #5): the env-gated
      # TestServiceStoreUsesRealS3WhenConfigured round-trip runs for real when
      # this service is up. bitnami image ships a server-mode entrypoint, so
      # no command override is needed (GH Actions services cannot pass one).
      minio:
        image: bitnamicharts/minio:17.0.21
        env:
          MINIO_ROOT_USER: pantheon-minio-ci
          MINIO_ROOT_PASSWORD: minio-ci-${{ github.run_id }}-${{ github.run_attempt }}
        ports:
          - 9000:9000
```

## 方案 B：官方 quay 镜像 + volume 引导脚本（备用）

若 bitnami tag 失效，可用官方镜像的 `/usr/bin/docker-entrypoint.sh` 作为
entrypoint 绕过 CMD 限制（GH service 的 `options` 直接落到 `docker create`，
`--entrypoint` 有效；volume 用于数据目录）：

```yaml
      minio:
        image: quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z
        env:
          MINIO_ROOT_USER: pantheon-minio-ci
          MINIO_ROOT_PASSWORD: minio-ci-${{ github.run_id }}-${{ github.run_attempt }}
        ports:
          - 9000:9000
        volumes:
          - ${{ github.workspace }}/.tmp-minio-data:/data
        options: >-
          --entrypoint /usr/bin/docker-entrypoint.sh
          --health-cmd="curl -sf http://localhost:9000/minio/health/live || exit 1"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=20
```

注意：方案 B 的 `--health-cmd` 依赖镜像内有 curl（部分新镜像没有），
不保证可用；优先方案 A，或去掉 health-cmd 保留 runner 侧 Wait step。

## env 块（两种方案通用）

```yaml
      PANTHEON_TEST_S3_ENDPOINT: http://127.0.0.1:9000
      PANTHEON_TEST_S3_ACCESS_KEY: pantheon-minio-ci
      PANTHEON_TEST_S3_SECRET_KEY: minio-ci-${{ github.run_id }}-${{ github.run_attempt }}
      PANTHEON_TEST_S3_REGION: us-east-1
```

## Wait step（方案 A 建议保留；方案 B 若 health-cmd 生效可省）

```yaml
      - name: Wait for MinIO
        run: |
          for i in $(seq 1 30); do
            if curl -sf http://127.0.0.1:9000/minio/health/live; then
              echo "MinIO is live"
              exit 0
            fi
            sleep 2
          done
          echo "MinIO failed to become healthy"
          exit 1
```

## 恢复后验证清单

1. CI 的 `Unit Tests` job 全绿，且 `Wait for MinIO` 步骤输出 "MinIO is live"。
2. 确认 `TestServiceStoreUsesRealS3WhenConfigured` **不再 skip**（run 日志中该测试
   出现 PASS 而非 SKIP）——这是探针真实执行的唯一证据。
3. 更新 `runtime-gap-ci-feasibility-20260918.md` 的 #5 行：从 "CI wiring suspended"
   改为 "CI-verified"，引用绿色 run id。
4. 更新本文件状态头为 RESTORED 并注明日期。

## 关联

- 可行性评估: `runtime-gap-ci-feasibility-20260918.md`
- 被回退的 PR: #321（引入）、#322（镜像源修复，不足以恢复）
- Env-gated 测试: `backend/pkg/upload/service_test.go:228`
