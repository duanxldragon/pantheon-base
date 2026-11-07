## 变更摘要

- 改动层级：platform / shared lowcode test fixture
- 改动模块：dynamicmodule测试、VERSION/CHANGELOG、v0.18.5发行说明和父任务证据
- 目标问题：正式消费的共享purge测试没有隔离i18n scanner root，完整race失败；测试overlay不能满足原F8要求
- 预期影响：通过正式foundation同步已经修复的测试夹具，保留四行断言和新增外部引用保护回归；原12任务继续开放直到正式消费原树全量验证成功

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：auth-security
- Ratchet Decision：registry-only
- GitHub Signal：not-applicable

## Harness adoption markers

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Base shared lowcode test-only correction and version metadata; Ops consumer graph and official update separate
- backend response contract: unchanged; test fixture only
- backend DTO contract: unchanged; test fixture only
- permission contract: unchanged
- audit coverage: original production code unchanged; shared test root and external-reference lifecycle regression reviewed
- visual evidence: no UI source change or visual claim
- inheritance contract: ../docs/WORKSPACE_INHERITANCE.md; correction must ship as official foundation artifact
- Base/ops inheritance: Shared test correction and exact common seed helper are Base-owned; ship official verified assets and update Ops root lock, no manual file copy
- base drift: no manual Base main copy into Ops; v0.18.4 remains immutable

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

此PR只修共享测试夹具并准备官方v0.18.5；生产逻辑/数据库/权限/菜单/i18n产品代码不变。原12任务没有通过本PR提前关闭；真实S3与冻结仍独立未验收。

## 验证记录

- [x] 当前候选直接完整CGO readonly race：1890通过/0失败/1真实S3 skip；required MySQL/Redis，源哈希执行前后不变，resume7-base-full-race.json及gzip日志
- [x] 2项定向DB/Redis回归：原四行行为、外部仍引用key保持active
- [x] 初始修复及Sonar共享夹具helper均有两路独立批准；resume8-sonar-approval.json绑定当前源快照
- [ ] 本PR与合并后不可变commit required checks/Release Gate（真实通过后才能发行）

## 审核留痕

- Copilot review：not-yet-requested
- CodeQL 结果：本PR待实际Security Gates，不提前宣称通过
- GitHub checks 结果：pending current PR；前一官方v0.18.4结果不是本PR结果
- Auto-merge：not-enabled
- Duplication Gate 结果：前次Sonar新增重复55.4%失败；已等价提取共享seed，当前head同指标复测必须<=3%，不改阈值/排除
- 是否高风险改动：共享动态模块/i18n测试边界，需两路独立评审
- Residual risk / follow-up：原stock消费race失败和模块图问题仍待官方消费补验；S3未验证无waiver、维护冻结未签、OpsQA/策略/生产事项独立保留

## 检查清单

- [x] Base-first共享修复；不手抄Base源码到Ops
- [x] 不改变原验收标准或放宽门禁
- [x] 无新增凭证/生产操作/UI功能
- [x] Bounded patch双路批准已取得
- [ ] 真实当前分支CI、合并提交Release Gate通过后才能发行
