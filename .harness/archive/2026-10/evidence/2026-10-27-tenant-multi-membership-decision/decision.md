# Decision — W3 `2026-10-27-tenant-multi-membership-decision`（跨租户成员关系语义）

**签名日期**：2026-10-27
**签名方式**：维护者授权委派（delegated decision），对维护者审查开放
**完整论证**：[TENANT_MULTI_MEMBERSHIP_DECISION_2026-10-27.md](../../../docs/reviews/TENANT_MULTI_MEMBERSHIP_DECISION_2026-10-27.md)

## 选项表（浓缩）

| | A 收窄 membership 语义 | B 跨租户角色绑定 | C 移除多租户成员关系 |
|---|---|---|---|
| 内容 | AddMember 收窄到目标租户自有用户；三个登录读点加角色存在谓词；切换端点空角色集拒绝；移除 TenantSwitcher 与登录租户选择器（端点保留为过滤后兼容面） | AddMember 接受 role_ids 写目标租户绑定；ensureUsersExist 接受目标租户 live 成员；合同重定义归属/绑定 | 下线选择器与切换器；membership 单租户；修订合同 §2.2 不变量 1 |
| 合同改动 | 澄清（不改不变量） | 重写 §2.2 所有权模型 | 修订不变量 1 |
| schema/迁移 | 无 | 绑定语义迁移 | 存量行迁移 |
| 修复 TC-01 | 是 | 是 | 是 |
| 新增风险 | 兼容面行为变化（文档化）；「两租户工作」诉求留给 V2 | `replaceUserRoles` 无租户谓词的删除是硬前置；提权面与所有权歧义 | 能力回退；冻结合同修订 |
| 成本 | 一个 wave + 文档（W4+W5） | 多 wave，V2 | 中，且损失已交付能力 |

## 签名的选择

**A（收窄语义）为 V1；B（跨租户绑定）登记为 V2 工作流（立项时新建包，本波不创建）；C 否决。**

- 落地包：W4 `2026-10-27-tenant-multi-membership-authorization`（实现 A，其包内规则要求决策非 A 时先 abandoned 再重写）；W5 `2026-10-27-tenant-contract-docs-alignment`（合同 §2.2 澄清 + API 文档 + 前端错误映射）。
- 若维护者审查改选 B/C：W4 按其包规则关闭为 abandoned 并按新决策重写，W5 的澄清文案随之调整。
- 明确不授权：自动清理存量跨租户 membership 行（处置见决策文档 §4：保留行、由 W4 的谓词从登录入口隐藏、`/auth/current` 继续如实报告）；任何 membership 角色 → IAM 角色的隐式映射（合同 §2.2 禁止）。
