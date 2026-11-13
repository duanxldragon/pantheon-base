# Core Smoke 菜单标题省略定位修复

PR513已合并并同步到main。合并后run43447261398的Core Smoke真实失败，workflow因既有report-only策略仍success；不将其记为烟测通过。两次error-context与1280x720截图显示已创建菜单、完整关键字过滤后仅一行，标题为system.menu.smoke_cor...，缺少旧定位要求的smoke_core。根因是测试依赖被省略的标题尾部，不是本次文档归档改变了产品功能。

仅把测试可见文本定位改为system.menu.smo，仍按完整唯一titleKey服务端搜索；创建/编辑/删除动作、成功提示、回查断言与原有策略保持。旧日志/截图保留；本地浏览器回放证明旧选择器0匹配、当前修复1匹配，并维持完整搜索值。前端lint/type-check/build及所有prebuild合同通过。真实CI分支Core Smoke与PRrequired checks仍为交付条件。无新增业务源码、依赖、版本或UI变化。
