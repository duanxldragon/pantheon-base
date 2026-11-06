# Security release and GitHub-only consumer continuation

## 2026-11-06 当前状态（取代下文历史读数）

用户补充要求：纳入 GitHub 新合并 PR #485，修复 Dependabot #52（minimatch / GHSA-g3hv-75wg-m249，修复版本 11.0.1），发布 v0.18.4，再让 Ops 从 GitHub 最新稳定正式 release 消费。

Base 安全分支 `fix/v0184-minimatch-security` 已快进至 GitHub main `2a7061fa0e5bc943c6dc91166e16dc77d614ee70`。2026-11-06 网络恢复后完成安装验证：minimatch override 生效并落入 package-lock，所有实例统一至 11.0.1，GHSA-g3hv-75wg-m249 消除；`npm audit --audit-level=high`、前端 build、218 单测与 docs frontmatter 全部通过，VERSION 升至 0.18.4。详见 `2026-11-06-v0184-security-validation.json`。

此前 v0.18.3 发布器 session53536 返回 exit0，输出确认四个正式资产上传完成。再次独立查询 GitHub 时网络连接被禁止；未重切或覆盖 v0.18.3 资产。v0.18.4 尚未切包、发布或消费。

Ops 隔离分支已实现 GitHub 最新稳定版获取/四资产校验/不可变 tag 与 manifest 及 git-archive commit 校验/锁定重建；CLI 拒绝本地 Base 来源参数。漂移检查直接读取验证过的快照字节，覆盖父 Ops HEAD 不同、共享文件删除、篡改/过期缓存及业务迁移冲突。当前消费与迁移测试 54 pass / 0 fail / 0 skip，overlay、frontmatter 和 task-template 校验通过。真实 v0.18.4 暂存重建、全量 CGO race、业务 smoke、GitHub CI 与合并均未完成；Ops 主工作树及正式锁文件仍为 v0.18.2。

两路独立复审未产生新批准：原适配器 MCP 配置解析失败；临时禁用无关 MCP 后代码/架构服务均无法连接。原批准和指纹只作历史，不覆盖本轮变更。当前 source manifest 另存，不将旧 21/21 当作新批准。

恢复顺序执行中：2026-11-06 网络已恢复，依赖安装验证已完成并通过；后续按 Base PR CI/merge → main Release Gate → v0.18.4 官方发布 → Ops GitHub 下载消费/最终验证/review/CI/merge 顺序继续。

