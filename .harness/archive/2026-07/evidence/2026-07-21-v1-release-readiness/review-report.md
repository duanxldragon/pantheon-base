# V1.0 代码审查 / 安全审查报告（2026-07-21）

范围：发布 diff `origin/main..HEAD`（19+3 提交，~200 文件，+6.5k/-2.6k）。
执行方式：code-review 由深度审查子代理执行（54 次工具调用，逐文件读 diff 与全文，i18n 键逐个比对）；security-review 因权限分类器故障由主会话按同一清单人工执行（端点授权、SQL、XSS、CSV、secrets、DoS 六面）。

## 代码审查：5 findings（Critical 0 / High 2 / Medium 0 / Low 3）

| # | 级别 | 缺陷 | 处置 |
| --- | --- | --- | --- |
| 1 | High | 登录日志 CSV 导出忽略时间范围过滤（listLoginLogsForExport 未套 time window，导出与所见不一致） | ✅ 已修（复用 scopedLoginLogQuery） |
| 2 | High | 安全事件保留设置只加进了 Go fallback 数组，真正生效的 seed_data.yaml 未更新 → 设置项永不落库，后端 i18n 也缺 5 语言条目 | ✅ 已修（yaml + builtin_locale_resources 5 locale） |
| 3 | Low | TimeRangeFilter 分钟格式截断 endOf('minute')，预设丢当前分钟内最新事件 | ✅ 已修（payload 秒精度） |
| 4 | Low | SecurityEventList 延迟 setQuery 可能覆写输入草稿 / 失败后分页用旧过滤 | ⏸ 已知问题（既有页面模式，改动风险>收益，登记待办） |
| 5 | Low | exportCurrentPageSelectionOnly 文案与"跨页选择则中止导出"的实际行为相反 | ✅ 已修（5 语言） |

审查确认干净面：批量确认/清理 SQL 全参数化 + LIKE 转义；清理仅删已确认事件；节流互斥无竞态；聚合查询独立构建无条件污染；新端点权限/菜单/i18n 三线对齐；菜单树过滤环安全。

## 安全审查：4 面（Critical 0 / High 0 / Medium 1 / Low 1）

| # | 级别 | 发现 | 处置 |
| --- | --- | --- | --- |
| S1 | Medium | 前端"导出所选"本地 CSV（downloadCsvFile）无公式注入防护；日志 username 可被未认证失败登录写入，`=HYPERLINK(...)` 用户名 → 管理员导出 → Excel 执行 | ✅ 已修（与后端 impexp.sanitizeCSVCell 同规则中和） |
| S2 | Low | 批量确认/删除 id 列表无显式条数上限（依赖全局 BodySizeLimit 兜底） | 📋 登记（非阻塞） |

验证干净面：
- 新端点（cleanup×4、batch-delete×2、batch-acknowledge）全部处于 TokenAuth + Casbin + SecureAction 三层之内；
- operation-log 排序列走白名单 map，无 ORDER BY 注入面；
- 详情弹窗 operParam/jsonResult/errorMsg 全部经 React 文本节点渲染（自动转义），敏感键脱敏（sanitizeAuditValue）在位；
- 发布 diff 内无凭据/DSN/token 泄漏（README 中的本地 dev 凭据为 main 既有内容，且安全提示章节已声明禁提生产凭据；`.tmp/` 在 .gitignore）。

修复提交：0e2a664f（含 S1 与 findings 1/2/3/5）。
