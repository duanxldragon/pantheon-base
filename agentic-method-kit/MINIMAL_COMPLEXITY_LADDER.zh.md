# 最小复杂度阶梯

English version: [MINIMAL_COMPLEXITY_LADDER.md](./MINIMAL_COMPLEXITY_LADDER.md)

本指南提炼自 [Ponytail](https://github.com/DietrichGebert/ponytail) 的工具无关简化控制。这里采用的是方法，不是插件 runtime：仓库可以按需安装某个 adapter，但 Harness Engineering 只把这条阶梯当作可移植 guide 和 review sensor。

## 原则

先理解真实调用链，再写最小正确改动。小不等于草率：校验、安全、数据损失保护、可访问性和明确需求仍然必须保留。

## 阶梯

新增代码前，按顺序停在第一个能满足任务的层级：

1. 这件事真的需要存在吗？不需要就跳过，并记录原因。
2. 代码库里已有 helper、pattern、contract、component 或 script 吗？优先复用。
3. 语言标准库已经提供了吗？用标准库。
4. 平台原生能力已经覆盖了吗？用浏览器、数据库、OS、框架或 runtime 特性。
5. 已安装依赖已经解决了吗？复用现有依赖。
6. 能否是一条清晰表达式或一个很小的局部改动？优先这样做。
7. 只有到这里，才写最小可工作的新增代码。

这条阶梯必须在 context resolved 之后运行。不能用它逃避阅读受影响代码、追踪调用者或理解边界规则。

## Bug 修复规则

Bug 报告通常只指出症状。修改共享函数前，先检查调用者；如果在共享边界一次修根因更小、更安全，就不要在每条调用路径上打补丁。

## Review Sensor

实现评审时，只标记可以具体删除的复杂度：

- `delete`：死代码、未使用弹性、猜测性功能。
- `stdlib`：手写了标准库已有能力。
- `native`：代码或依赖可以被平台原生能力替代。
- `reuse`：仓库已有 helper、component、script、query 或 contract 被重复实现。
- `yagni`：抽象、配置、扩展点或层级当前没有第二个真实用例。
- `shrink`：同等行为可以用更小的局部表达完成。

每条 finding 应写清位置、删什么、用什么替代。不能用这项 sensor 掩盖正确性、安全、可访问性或证据缺口。

## 有意捷径债务

如果简化方案有已知上限，在代码附近用短注释标记：

```text
minimal-complexity: <上限>; upgrade when <触发条件>
```

示例：

- `minimal-complexity: 1 万行以内线性扫描足够; upgrade when 查询耗时超过 100ms`
- `minimal-complexity: 进程内缓存; upgrade when 多实例需要一致性`

没有触发条件的捷径会变成隐藏债务。仓库可以扫描这些注释生成 debt ledger。

## 什么时候不能简化

不要简化掉：

- 信任边界校验
- 鉴权和权限检查
- 审计和数据损失保护
- 可访问性基础
- 仓库要求的 i18n 覆盖
- runtime-sensitive 改动的运行态证据
- 用户明确要求

非 trivial 逻辑应留下最小可运行检查，确保行为退化时会失败。

## 接入方式

把这条阶梯作为：

- 实现前 guide
- task packet 里的所选 rung 字段
- 评审 over-engineering 的 sensor
- 重复 over-build 进入 review 后的 ratchet 目标

如果仓库安装 Ponytail 或其他简化工具，把它记录为 `agent-adapter`。可移植方法仍然是这条阶梯及其 evidence/review 规则。
