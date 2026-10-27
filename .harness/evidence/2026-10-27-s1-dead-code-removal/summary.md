# Summary — S1 `2026-10-27-s1-dead-code-removal`（删死码）

分支 `refactor/s1-dead-code-removal-2026-10-27`，基线 `main b13e6b77`。
实测改动：**19 个文件，+0 / −1923**（packet 估算 ~−250 是后端部分；capture 脚本实际 ~1550 行）。

## 删了什么（对应审计 RC 编号）

| RC | 对象 | 说明 |
|---|---|---|
| RC-001 | `backend/pkg/common/token.go`（整文件 129 行 / 34 导出） | 纯转发 `pkg/authtoken` 与 `pkg/common/http` 的第二套入口，全仓（含 `pantheon-ops` overlay）0 调用 |
| — | `backend/pkg/common/http/cookie.go` 的 `SetTokenTTL` | 唯一调用者是 token.go；私有 `accessTokenTTL`/`refreshTokenTTL` 默认值保留 |
| RC-002 | `backend/internal/middleware/logging_middleware.go`（整文件） | 定义了 `StructuredLoggingMiddleware` 但没有任何路由注册 |
| RC-003 | `common.ErrorResponse`（error.go:106-115） | 无人构造；活体信封是 `pkg/common/http/response.go` 的私有结构 |
| RC-005 | `database.SetEx`（redis.go:75-78） | 0 调用 |
| RC-009 | `frontend/src/api/request.ts` 的 `isForbiddenRequestError` | 无模块/桶文件消费 |
| RC-010 | 10 个 `frontend/scripts/capture-*.mjs` | 一次性截图脚本，见下方人工门说明 |
| RC-011 | `merge-coverage-to-lcov.mjs`、`migrate-spacing-tokens.mjs`、`run-request-error-utils-test.mjs` | 同样零引用；后者是 `run-api-unit-tests.mjs` 的前身（注释留了出处说明） |

## 五位置引用搜索

每个符号在实现时重新跑了五位置搜索（backend 源码+测试、frontend、scripts/CI、`pantheon-ops`），
全部 0 活引用；逐符号记录见 [reference-search.md](reference-search.md)。
编译器级验证：删除后 `go build ./...` 在 base 与 ops 两个 backend 都绿。

## 人工门（capture-*.mjs）

门的问题是「这 10 个脚本是否仍用于人工视觉走查」。按 auto-mode 的授权以证据代答
（可被维护者复核）：脚本头部自述它们是给**已注明日期的 2026-07/08 审计**写一次性证据的
（如 `--out ../.harness/evidence/2026-07-18-security-audit-ui-fixes`），v0.17.1 之后的浏览器
走查载体是 smoke 套件，五位置搜索 0 引用。删除可经 git 历史一键恢复；若维护者否决本决定，
`git revert` 删除提交即可整批还原，不影响本波其余删除。

## 验证

- `go build ./...` / `go vet ./...`（base backend）→ exit 0
- `go build ./...`（ops backend）→ exit 0
- `npx tsc -b` / `npm run build`（736ms）/ `npm run lint`（frontend）→ exit 0
- 全量后端套件（真库、串行、`PANTHEON_TEST_DSN_REQUIRED=true`）→ 见 commands.json 末条
- `git diff --stat`：19 文件 / −1923 行，0 新增——**本波是纯删除**，没有引入任何替代抽象
  （packet 明确禁止）。

## 边界

- `pkg/authtoken/**` 未动（doNotTouch）；其 `SetTokenTTL` 可能因 token.go 删除而失去最后一个
  调用者，已记入 commands.json knownGaps，不在本波处置。
- 未触碰 `frontend/src/index.ts` 导出集合（`isForbiddenRequestError` 本就不在桶文件里）。
- 无路由、响应形状、错误码、i18n key、权限码、菜单、seed、schema、迁移变化——纯死码删除。
