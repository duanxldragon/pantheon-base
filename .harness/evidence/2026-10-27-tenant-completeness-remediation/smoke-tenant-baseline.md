# 租户冒烟基线（2026-10-27 12:40 实测）

只读验证：执行既有租户 smoke 套件，未修改任何源码。

## 环境

| 项 | 值 |
|---|---|
| 工作目录 | `pantheon-base/frontend` |
| 后端 | 已在 `127.0.0.1:8080` 运行（`GET /api/v1/health` → 200） |
| MySQL | `127.0.0.1:3306` 在监听 |
| Redis | `127.0.0.1:6379` 在监听 |
| Vite | 5173 已被占用，冒烟专用实例起在 **5178**（`run-smoke-suite.mjs --port`，playwright `baseURL` 由 `PANTHEON_WEB_BASE_URL` 决定，因此不改测试） |

## 命令与结果

```
node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5178 \
  --setup scripts/tenant-matrix-fixture-setup.mjs --config playwright.config.ts -- \
  tests/smoke-core/tenant-hostile-browser-matrix.spec.ts \
  tests/smoke-core/tenant-hostile-browser-matrix-phase2.spec.ts \
  tests/smoke-core/tenant-protected-resources.spec.ts --workers=1
→ 10 passed (49.9s)

node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5178 --config playwright.config.ts -- \
  tests/smoke-core/tenant-viewpoint-switcher.spec.ts --workers=1
→ 5 passed (45.0s)
```

合计 **15 passed / 0 failed**，4 个 spec 文件。

夹具租户由 `tenant-matrix-fixture-setup.mjs up` 预置（本次为 tenant 7 `smoke-matrix-a-*`、tenant 8
`smoke-matrix-b-*`），运行后已用 `tenant-matrix-fixture-setup.mjs down` 归档+删除，并用
`cleanup-smoke-fixtures.mjs` 清理 `smoke_tmatrix_` 用户（users 15 / roles 21 / permissions 74）。

## 覆盖到 / 没覆盖到

覆盖（既有）：

- 多模式登录必须先选租户、选择前不碰会话（`tenant-hostile-browser-matrix.spec.ts:104`）
- 错误密码不泄露租户候选（`:152`）
- 各租户 dashboard / refresh rotation / 上传命名空间隔离（`:164`、`:234`）
- 字典夹具隔离与列表只显示本租户行（`:313`）
- 登录日志、操作日志、设置、动态模块跨租户隔离（phase2）
- 受保护页面、导出、ID 篡改拒绝（`tenant-protected-resources.spec.ts:114`）
- 平台视角切换器 5 条（默认全局 / 钉住 / 视角内建用户并落 membership / 该用户能登录 / 退出视角）

**未覆盖（W6 的缺口，本次仍未改变）**：

- 租户控制台 CRUD、归档/删除、成员增删、运营总览、套餐编辑器——无自动化
- 登录选择器用例仍未断言"选中所属租户后控制台可用"；本次全绿不能证明 P1-1 的失败场景不发生，
  只能证明选择器本身正常
