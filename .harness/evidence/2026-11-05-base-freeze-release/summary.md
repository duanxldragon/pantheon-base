# Base 功能收尾与发行执行证据

状态：in-progress。任务拆解完成；本地候选通过的结果如下，正式 PR/CI/合并、发行和 Ops 消费尚未完成。VERSION 0.18.3 为未发布候选，最后正式 foundation 仍为 v0.18.2。

- 分支：feat/base-freeze-2026-11-05；保留原 Nov3/4 未提交整改；旧 chore/audit-remediation-2026-11-03 与 main 的树相同，无需重复合入。
- 完整隔离 MySQL/Redis Go race：1876 通过测试节点、0 失败、1 个真实 S3 集成 skip；47 个有测试包通过，5 个无测试包。
- 前端 lint/type-check/build 通过，33 文件 / 218 单测通过；根脚本、foundation-release、frontmatter 回归通过；治理14检查已通过，最终文档更改后复检单独留证。
- 租户 V1 全保留，租户16 + 视角5 = 21通过；core27通过/3无激活生成模块skip。
- 系统域11模块组合119通过/0失败。原 system-smoke 链失败保留；角色选项就绪后再选值，500错误测试确认实际发出被拦截请求；forms完整4、IAM-authz4、governance18、API11补齐通过。
- 生成器1 dashboard +14 quality contract 与 basic/enterprise/many-to-many shapes通过。平台完整套件 platform-smoke 97 passed（另一次 77 passed 重跑，exit 0）；业务五套 generated/database-import/master-detail/many-to-many/auto-recycle 各 1 passed（exit 0，需 --proxy-target）；真实生成模块浏览器 CRUD（必填校验/创建/编辑失败恢复/删除/390px）1 passed。
- Impeccable实际图像检查：桌面1440×900的login/user/dept/permission，以及390宽mobile login/user，无可见重叠；移动用户表为明确提示的内部横向滚动。platform-rendered保存测试产生PNG；暗色与平台剩余状态须以独立后续证据为准。
- 实际状态/错误测试包含受控mock，不能把所有UI负向测试描述成外部真实故障；原表单失败的trace.zip损坏，error-context.md保留。
- 源码保护：生成验收前780个backend/frontend-src/schema文件SHA256与原快照一致；生成后再比较，保留其他贡献者工作。
- Gitleaks阶段性staged扫描通过；最终staged扫描待提交前完成。依赖树whole-tree扫描被中止，不算通过。

## 未关闭项

- 独立 code-reviewer / architect 重试后仍 HTTP 503，未产生批准
- 真实 S3 provider 未配置：1 个集成用例跳过
- npm audit 报 15 个 moderate（eslint/nyc/vite-plugin-istanbul/typescript-eslint 开发链，0 high/0 critical）；升级属依赖变更，未在本次候选处理；govulncheck 恢复后实测 0 影响代码（3 个模块级未被调用）
- GitHub 远程 PR/CI/合并/正式 release 与 Ops 消费未完成
- core 中 3 个生成模块用例在未激活模块的运行环境保持 skip；改由真实生成模块的浏览器 CRUD 与重启后 API CRUD 覆盖，不把 skip 当通过
- smoke 套件自启 vite 默认代理 8080，后端非 8080 时必须显式 --proxy-target，否则整页 API 502（属运行环境配置，不是产品缺陷）

上述缺口未获豁免，没有自审批准、solo-override或伪造hosted CI。只允许在同一正式候选满足审查/CI后merge并发布，再通过Ops官方overlay/lock消费；Base000031与隔离Ops修复000031冲突须在消费重建时按归属对齐。

原始日志与PNG位于workspace audit-artifacts/base-freeze-2026-11-05（不提交认证日志/trace/运行数据库）；精确结果见local-validation.json、commands.json、functionality-matrix.md。
