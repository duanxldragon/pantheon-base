# Review — 2026-10-27-s2-pagination-sort-migration

## 审查姿态（packet reviewerPosture 对照）

| 姿态项 | 结论 | 证据 |
|---|---|---|
| 每模块默认 page size、cap、默认排序列不变 | ✓ | 9 个模块默认 1/10、cap 100 逐模块 pure test 断言；默认排序列 id/sort 与 before probe 一致（response-diff.md） |
| 列表响应结构与 total 计数不变 | ✓ | 本波 diff 仅触 normalizer 内部与 `Offset(...)` 实参；响应组装/Count 代码未触碰；DB 集成测试全量通过 |
| role_helper.go 只剩一个 normalizer | ✓（按实现口径） | 两份逐字节拷贝的 clamp 逻辑删除，均委托 `common.NormalizePagination`；保留的两个同名函数是 nil 安全字段提取适配器（RoleListQuery/RoleMemberQuery 类型各异，generics 无法读字段），无任何钳制逻辑 |
| 每个 helper 的边界测试齐全 | ✓ | pkg/common/pagination_test.go + sort_test.go（零/负/超 cap/未知列/空白/nil map/offset 推导）；模块 pure test 补 offset 断言 |

## 行为等价

- 逐用例 before（probe 实测，capture-before/normalizers.txt）→ after（pure test 断言）等价表见 response-diff.md。
- 三处模块独有语义显式保留：permission/audit 未知字段强制 id desc、user anything-but-asc
  方向语法与深翻页 400、dict ok 第三返回值。
- 两处未收敛例外（行为保留）：setting_audit oversize 回退 10（与共享钳制语义 genuinely
  disagree，packet 规定保留）；tenant member 域默认 20 + doNotTouch → W9。

## 风险

- 适配器签名变化（+offset 返回值）影响 9 个 pure test 文件，已同步更新并断言 offset。
- 无接口/路由/响应结构/数据库/i18n/权限触碰；前后端契约面为零变化。
- CodeQL / lint / duplication gate 随 CI 验证。

## Machine Readable

```json
{
  "taskId": "2026-10-27-s2-pagination-sort-migration",
  "verdict": "approved",
  "notes": "12 per-module commits pairing each normalizer with its Offset site; whitelist lookups and clamps now single-implementation in pkg/common; setting_audit semantics and the tenant member domain (W9) preserved as documented exceptions; boundary behaviour verified per-case before and after.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s2-pagination-sort-migration/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s2-pagination-sort-migration/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s2-pagination-sort-migration/review.md",
    "changeRef": "backend/modules/system/iam/role/role_helper.go",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  }
}
```
