# Task Packet — 2026-09-22-upload-authorization-and-import-resources

## 目标

关闭上传授权不明确和 CSV 导入文件句柄泄漏两个风险，建立上传/导入的统一资源与权限契约。

## 范围

In：`system_modules.go`、upload setting handler、Casbin menu/permission seed、所有 system import handlers、对应测试。

Out：不扩展对象存储能力，不改变文件类型白名单和租户对象 key 设计。

## 验收标准

- 明确 `/system/upload` 是 authenticated capability 还是受 `system:setting:upload` 保护；实现与菜单/权限 seed 一致。
- local/S3 下载继续执行路径规范化和 tenant object scope 校验。
- 每个 `fileHeader.Open()` 都有确定性 `Close()`，包括 CSV 解析失败和 service 失败路径。
- 导入请求具备文件大小/行数上限，或明确复用已有全局 body limit 并有证据。
- 未授权、跨租户、超限和资源释放均有测试。

## 验证

```text
go test ./modules/system/config/setting ./modules/system/iam/... ./modules/system/org/... ./modules/system/i18n
go vet ./modules/system/config/setting ./modules/system/iam/... ./modules/system/org/... ./modules/system/i18n
```

## 依赖与证据

- blockedBy：tenant-public-settings-scope（若上传配置改为租户级）；否则 none
- evidenceDir：`.harness/evidence/2026-09-22-upload-authorization-and-import-resources`
- human gate：权限点语义需维护者确认。

