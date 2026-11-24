# 工作机制改进验证记录

已保留三仓库所有权、Base-first、L0/L1/L2 和真实验收要求，并完成以下改进：

- AI 先读入口、当前任务和对应合同，按需读取设计与证据。
- 当前状态与历史检查点分离，manifest 生成任务索引，检查模式拒绝过期索引且不修改状态。
- CI 从 receipt 的完整方法 commit 获取固定快照，正常验证不更新 pin。
- 共享检查器排除注释、echo 和非入口参数；区分手动工具与 CI 配置引用。简单 folded YAML 正确折叠；复杂形式显式失败。
- Ops 工作流与命令只改仓库拥有的资产，真实锁定发行版重建后验证保留与共享漂移。

独立 code-reviewer 为 COMMENT（零剩余源码 finding；LSP/AST 不可用），architect 为 CLEAR。
Harness 行为测试 16/16；Base 最终行为/工作流测试 19/19；Ops 工作流/重建测试 29/29。
两仓库消费检查、索引检查、文档、编码、边界检查通过；正式 Base 快照暂存重建、overlay 和 shared drift 通过（866 个共享文件）。
44 个范围外文件和 25 个 backend 文件保持原 SHA256。Ops 开工备份与追加第八轮检查点后的快照分别保留。

记录真实失败和修复：缓存写权限/认证 sandbox、暂存资产重复下载网络失败、读取顺序 marker、task checklist 和 folded YAML。未把失败记 PASS。

产品功能开发、正式发行与 foundation lock 升级属于其他任务。用户随后授权本次方法改动的提交、PR、CI 和合并；最终 hosted 结果以对应 PR checks 为准。
没有产品 runtime/UI 改动，没有声称工作效率或 token/cost 的实测提升。

## 隔离提交与方法来源

Harness PR #13 已合并；PR 与 main CI 均通过。consumer 明确采用合并提交 `51fc783dc793b75ae91bdb936ba1418e2e95a354`，七份 policy 哈希不变。新的 helper/checker 修订仍未打正式发行 tag。

Base 已核对 v1.4→v1.5 的 shell 合同与现有落地资产，按 upgrade.md 更新 shell 本地采用 metadata（adoptedAt），method-health strict 零 finding 通过。产品 VERSION/发行与 Ops foundation lock 未改。OpenSpec skeleton 仍是既有 advisory warning。原状态 snapshot 使用路径级 Git -text 保留原始字节。
