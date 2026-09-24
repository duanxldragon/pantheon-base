# 任务：UI 交叉审查 P1/P2 修复（ui-cross-review-20260726 后续）

背景：`.harness/evidence/ui-cross-review-20260726/report.md` 完成了双镜头 UI 审查。
S4666 重锚（index.css filter-panel/app-table/app-drawer 同名块合并 + check-shell-visual-contract.mjs 锚点更新）**已由 Claude 完成，在当前工作树中，不要回退这些改动**。
你负责其余修复项。只改 pantheon-base，**不要碰 pantheon-ops**（已决策等 base-sync）。

## 修复项

### 1. P1 移动端壳层头部换行（frontend/src/core/layout/index.css）
390px 宽下 header 变三行：第1行面包屑、第2行搜索框+铃铛+齿轮、第3行只剩孤立头像。
根因在 ≤768px 媒体查询里 actions 区 flex 换行策略。目标：header 最多两行，
搜索触发器允许收缩（min-width:0 / flex-shrink），让铃铛+齿轮+头像与搜索框同行。
验证视口 390×844，不得引入横向溢出。

### 2. P1 表格列宽/省略策略（三处）
- 菜单列表页（modules/system/menu/）：「排序」列在 1440 宽被挤到只显示一个字，
  给该列 TSX columns 定义加合理 width/minWidth。
- 用户列表页（modules/system/iam/user/ 或对应路径）：「角色」列内容
  `系统管理员`→`系统管理` 硬截断无省略号；改为 ellipsis + Tooltip（Arco Table 列
  `ellipsis` 或自定义 render）。
- 角色成员抽屉（role member drawer）：昵称 `Administrator` 在列内断词换行；
  该列加 ellipsis，不允许 break-word 断词。

### 3. P1 会话管理页信息设计（会话列表组件）
- 「当前账号」标签目前**每一行都渲染**（管理员看自己的 21 条会话全是同一账号，纯噪音）。
  改为仅在**当前会话**（当前登录的 sessionId 对应行，即状态=活跃且为本会话）显示
  「当前会话」标签；其余行不显示。若 API 无法判定当前会话，则退化为仅活跃行显示。
  注意 i18n key 文案从「当前账号」改为「当前会话」（zh/en 同步）。
- hero 描述承诺「设备画像」但表格无设备列：若 API 返回 UA/浏览器/OS 字段
  （登录日志有 Chrome·Windows，会话大概率也有），加一列「设备」展示 浏览器·OS；
  若接口确实没有该字段，**只改 hero 文案**去掉设备承诺，不改后端。

### 4. §7.8 文档重锚（DESIGN.md，中英双语文件都要）
DESIGN.md §7.8 圆角/间距表与实现错位，实现是长期验收现状 → 改文档对齐实现：
- 圆角实际值：xs=4 sm=4 md=6 lg=8 xl=12 overlay=8 control=var(md) action=var(sm) pill=999。
- 间距 token 实际存在 --space-2xs 2 / xs 4 / sm 8 / md 12 / lg 16 / xl 24 / 2xl 32 / 3xl 48
  （index.css L119-127），把 §7.8 的 4px 基准表替换为与 token 一致的表述。
- 把未记载的 radius token（xl/overlay/control/action）补进表格。
DESIGN.en.md 对应小节同步。

### 5. 死 token 清理（frontend/src/index.css）
`--brand-gradient` 与 `--shell-brand-shadow` 在 4 主题 + 暗色覆盖里定义但全库零消费
（先 grep 确认无引用再删）。删定义，不要误删相邻变量。

### 6. P2 文案修正（i18n zh-CN 与 en-US 同步；若 key 源头在 DB seed 则改 seed + i18n 资源）
- 权限页 hero 标题含技术名词 "Casbin"（「把角色授权盘面与 Casbin 接口策略收口到…」）：
  去掉 Casbin，改为面向用户的说法（如「把角色授权盘面与接口访问策略收口到同一条权限治理主链路」）。
- 安全中心第 4 张 KPI 卡标题「成功」语义不明 → 改为「近 7 天成功登录」或等价明确表述。
- 登录日志「清理日志」危险确认弹窗主按钮「确定」→「清理」（动作动词贯穿原则）；
  检查会话/操作日志/安全事件三个同构清理弹窗一并统一。

## 约束与验收
- 视觉反模式清单（DESIGN.md §7.9）不得违反；颜色一律用 Pantheon token。
- 完成后必须全绿：`npm run check:ui-contract && npm run check:shell-visual-contract &&
  npm run check:search-toolbar-contract && npm run check:i18n-hardcode && npm run type-check`
  （在 frontend/ 下）。若改了 i18n 资源，跑 `npm run check:i18n-missing-keys`（如存在该脚本）。
- 不要提交（不要 git commit）；留在工作树由审查方验收。
- 把改动文件清单和每项修复的一句话说明写到 `.harness/tasks/ui-fix-20260727/changes.md`。
