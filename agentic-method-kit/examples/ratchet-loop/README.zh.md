# Ratchet Loop 示例

这个示例展示最小的方法演进闭环：

1. 先观察到重复失败
2. 把失败记录进 failure registry
3. 通过 guide、sensor、gate 或 template 更新 harness
4. 下一个任务在更新后的 harness 下执行

可以把这个示例当成模板，用来把重复出现的 agent 失误转成持久的仓库控制项。
