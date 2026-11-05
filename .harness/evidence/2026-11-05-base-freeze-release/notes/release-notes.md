# Release Notes

## pantheon-base-v0.18.3

Patch release on `release/0.18`, retaining the existing tenant V1 contract.

- Bind SSRF-protected outbound connections to the DNS addresses already validated by the security helper, preserving HTTP Host, TLS SNI, deadlines and redirect validation.
- Consume each refresh token once and condition session lifecycle updates on the previous refresh JTI, tenant, active status and expiry. Refresh retries and stale concurrent requests cannot restore revoked sessions or overwrite a tenant switch.
- Correct system route protection, role data-scope storage checks, tenant-scoped department bootstrap and complete multi-page candidates in system selectors.
- Repair generated Go/TypeScript formatting and construction, keeping generator quality contracts and real generated-module CRUD coverage.
- Preserve dependency-scan failures under the existing strict/report-only policy. Repair the pagination helper's foundation ownership, Sonar findings and draft PR comment permissions without weakening gates.
- Update tenant initialization, API and upgrade guidance to reflect delivered V1 behavior. V2 business isolation, billing and enforced quotas remain outside this release.

Validation for the code candidate includes 1880 successful isolated MySQL/Redis race test nodes (one explicitly unconfigured real-S3 integration skip), 218 frontend unit tests, frontend lint/type-check/build, generator contracts and system/platform/tenant/browser runtime smoke. Exact immutable commit, independent-review and hosted-check evidence is kept with task `2026-11-05-base-freeze-release`; publication additionally requires the existing Release Gate.

The release contains migration `000031_drop_permission_role_data_scope_policy`; read the upgrade notes before deployment. Production migration and backup/restore acceptance are separate from publishing the artifact.

## 独立评审修复

- 角色、岗位分页追加主键排序，保证同排序值静态数据集跨页完整。
- 生成必填布尔创建 DTO 区分缺失与 false，并同步模型映射。
- SSRF 已验证地址按剩余时间分配拨号期限，保留 Host/SNI 和整体超时。
- 运行态证据声明冲突保留任一 true 的要求；token-storage 扫描恢复正常报告。
