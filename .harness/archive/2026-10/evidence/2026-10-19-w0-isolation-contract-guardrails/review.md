# Review — W0 契约条款与红用例

## 1. 条款是否可判定

§2.3.1 的三条都写成「可指认一个具体写法」的形式，而不是原则性表述：

| 条款 | 反例（可被直接指认） | 正例 |
|---|---|---|
| 1 读带谓词 | `db.Where("role_key = ?", key)` | `db.Where("tenant_id = ? AND role_key = ?", tid, key)` |
| 2 写由上下文赋值 + 冲突键含租户 | `OnConflict{Columns: {role_key}}`、`TenantID` 缺省 | `OnConflict{Columns: {tenant_id, role_key}}`、`TenantID: s.tenantOwnerID()` |
| 3 裸键校验也算读 | `db.Table("system_role").Where("role_key = ?", key).Count(&n)` | 同上加 `tenant_id = ?` |

reviewer 不需要理解整条链路，只要看到写法就能引用条款号驳回。这是 W0 的核心目标：**把「约定」变成「可引用的句子」**。

## 2. 为什么条款加在 §2.3 而不是 §3.3

§3.3「数据访问不变量」已经说了「所有带 `tenant_id` 的表，业务查询必须附加租户谓词」。它没起作用，原因是：

- 它位于**上下文**一章，读者查「这张表要不要租户列」时不会翻到 §3；
- 它只描述**读**（「业务查询」），写路径的「冲突键必须含租户」完全没有；
- 它没有说明「按裸键做归属校验」也属于读——而这正是 F8 与 F11 的形态。

§2.3 是「资源租户归属」，是读者判断「我这张表该怎么处理」的第一站。把义务放在归属定义旁边，
「列存在」与「路径使用」就变成同一件事的两面，而不是两章里互不相干的两句话。

## 3. 红用例的边界

**覆盖**：数据范围簇的 6 个缺陷、5 个代码点 + 1 个回显点（middleware 读、permission 读、permission 写、键校验、部门校验、role 回显）。

**不覆盖**：

1. **F1/F2/F3/F4/F5/F6** —— 它们的红用例属于 W2–W5，机制不同（成员关系落库、黑名单、菜单授权、控制台渲染），
   硬塞进 W0 只会让这一波变成「所有测试」而不是「一个可复用的判据」。
2. **新增的无谓词查询** —— 条款让它可以被驳回，测试只守住已知的 6 个点。真正的强制是静态检查，
   建议作为独立任务（lint 规则：`system_role*` / `system_user*` 上的 `role_key` / `username` 等自然键查询必须同现 `tenant_id`）。
3. **F13 的初版缺口（已补）** —— 第一轮只有 middleware 与 permission 的用例，`RoleService.loadRoleDataScopes`
   仅由验收层 L3 断言覆盖。补上后确认它只让租户 A 变红（B 的行恰好最后被扫到，看起来是对的），
   说明**只查一个租户的测试会漏掉这个缺陷**。这条留痕在 `red-run.log` 与 `commands.json` 的 knownGaps 里。

## 4. 红跑的做法是否诚实

工作树里混着前几轮未提交的租户改造（179 个文件），无法用「切到 W1 之前的 commit」来复现旧代码。
所以用**定点变异**：只还原 W1 引入的 5 个谓词，其余不动。

- 变异前对 3 个文件取 md5，变异后 `go build` 通过（证明变异是合法代码而不是把东西改坏）；
- 跑测试，7 项红；
- 从备份还原，`md5sum -c` 全部 OK，再跑一次全绿。

这条链路写在 `commands.json` 与 `red-run.log` 里，读者可以复核「红」不是靠把测试写错得到的。
风险点：变异脚本依赖精确字符串匹配，若 W1 的代码后续被改动，重跑脚本会因 `PATTERN NOT FOUND` 中止而不是静默错改——
这一点是刻意设计的。

## 5. 门禁缺陷（已修）

`-run Tenant` 会漏掉 3 条不含 `Tenant` 的用例。这条命令是 W0 计划时自己写的，属于**计划本身的缺陷**，
不是实现走偏。改为 `-run 'Tenant|DataScope'` 后选中 41 项。留痕在 manifest 的 `implementationNotes` 与
`red-run.log` 的说明段里，因为「门禁会假绿」这件事值得被下一个人看到。

## 6. 结论

W0 完成：条款可引用、红用例可复现、门禁不再假绿。它与 W1 形成「规则 + 回归」的闭环，
后续 W2–W5 可以复用同一套判据（§2.3.1 三条 + 双租户夹具写法）。

## Machine Readable

```json
{
  "taskId": "2026-10-19-w0-isolation-contract-guardrails",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w0-isolation-contract-guardrails/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w0-isolation-contract-guardrails/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w0-isolation-contract-guardrails/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
