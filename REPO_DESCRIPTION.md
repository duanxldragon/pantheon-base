# Pantheon Base 仓库描述

English version: [REPO_DESCRIPTION.en.md](./REPO_DESCRIPTION.en.md)

本文用于给 GitHub 仓库的 `Description`、`About`、README 首段和对外简介复用。

## 一句话描述

Pantheon Base 是一个面向企业后台的模块化单体底座，提供 IAM、认证安全、动态菜单、审计、多语言，以及受控低代码生成与模块治理能力。

## GitHub Description 短句

可直接放到 GitHub Repository `Description`：

```text
Enterprise admin foundation with modular monolith, IAM, audit, i18n, dynamic menus, and controlled low-code module generation.
```

更强调低代码工作域的版本：

```text
Enterprise admin foundation with IAM, audit, dynamic menus, and a controlled low-code generation + module governance workflow.
```

## 中文简介

Pantheon Base 是一个面向企业后台场景的基础平台仓库，采用模块化单体架构，沉淀认证安全、IAM、组织、配置、审计、多语言、动态菜单和模块接入治理等底座能力。当前低代码主线已经形成一套可交付的“受控生成链路”：`system/generator` 负责模块生成，`system/dynamicmodule` 负责模块接入治理，并统一挂接到 `platform.lowcode` 工作域。

它当前的正式定位不是“真热插拔运行时低代码平台”，而是：

- 受控模块生成器
- 业务模块接入加速器
- 产品级内部治理工具

它适合：

- 企业后台基础平台
- 内部研发提效
- 交付团队受控生成业务模块
- 具备治理、审计和权限边界要求的管理系统

## English Blurb

Pantheon Base is an enterprise admin foundation built as a modular monolith. It provides authentication and security, IAM, organization management, configuration governance, audit, internationalization, dynamic menus, and controlled low-code module onboarding. Its current low-code line is intentionally positioned as a controlled generation and governance workflow rather than a fully runtime hot-pluggable low-code platform.

## 推荐 Topics

```text
go, gin, gorm, react, typescript, vite, arco-design, casbin, iam, audit, i18n, admin-dashboard, modular-monolith, low-code, enterprise-platform
```

## 当前定位说明

对外表达建议优先使用：

- `Enterprise admin foundation`
- `Modular monolith backoffice platform`
- `Controlled low-code generation workflow`

不建议当前直接使用：

- `runtime low-code platform`
- `hot-pluggable low-code PaaS`
- `visual builder for non-engineers`

原因很简单：

- 当前版本已经达到受控生成链路和模块治理的交付标准
- 但生成后的模块仍需要后端重启和前端重建才能完成激活
- 未来真热插拔路线已保留设计约束，但本仓库当前不宣称已经实现

## 推荐 README 首段

```text
Pantheon Base is an enterprise admin foundation built as a modular monolith. It provides IAM, authentication and security, audit, i18n, dynamic menus, and a controlled low-code generation + module governance workflow for backoffice systems.
```
