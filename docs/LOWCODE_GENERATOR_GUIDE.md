# 轻量级低代码辅助生成器 - 集成与使用指南

## 📋 概述

该生成器是 Pantheon 标准后台底座上的**补充功能**，目标是辅助研发快速接入业务模块，而不是反向定义平台核心架构。

当前已经打通“**生成源码 + 写入工作区 + 重写 generated 注册表 + 注册待激活状态**”闭环，包含以下核心能力:

1. ✅ 模块描述规范与模板引擎
2. ✅ 前后端代码生成器
3. ✅ generated 路由 / 组件 / 后端模块注册表自动重写
4. ✅ 可视化配置界面
5. ✅ 待激活注册态与系统烟测
6. ✅ `i18n-first` 结构化 key 生成

## 🎯 定位边界

- Pantheon 的主目标仍然是标准企业级后台管理系统
- 该生成器归属 `platform / system/config` 补充能力
- 它用于研发辅助、脚手架生成、受控注册与治理
- 它不是运行时低代码平台，也不应驱动 `auth / iam / org / config` 核心边界重构

## 🔤 i18n First 约束

生成器当前默认按结构化 key 输出国际化资源，而不是直接把自然语言写死到生成代码里。核心约定如下：

- 模块标题：`business.order.title`
- 字段标签：`business.order.field.orderNo.label`
- 字段占位：`business.order.field.orderNo.placeholder`
- 字段帮助：`business.order.field.orderNo.helpText`
- 枚举选项：`business.order.field.status.option.active`
- 页面动作：`business.order.permission.create`
- 审计标题：`business.order.audit.create`

当前向导仍然允许录入自然语言标签作为初始翻译值，但生成后的前后端代码、菜单种子、权限标题和审计标题统一消费 key。这一层属于 `platform` 治理，目标是避免新增模块再次引入硬编码文案债务。

当前向导已支持以下独立英文录入项：

- 模块英文显示名
- 字段英文标签
- 英文占位提示
- 英文帮助文本
- 英文枚举选项

## 🚀 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install jszip
npm install --save-dev @types/jszip
```

### 2. 当前一键注册边界

- **系统域归属**：`system/generator` + `system/dynamicmodule`
- **服务对象**：仅支持 `business/*` 模块一键生成并注册
- **不支持**：直接一键生成 `system/*` 模块。系统域仍需先明确是 `auth / iam / org / config` 哪个子域，再做手工接入
- **激活方式**：生成成功后写入 `system_module_registration`，状态为“待激活”，随后需要**重启后端 + 重建前端**

### 3. 添加国际化翻译

在 `frontend/src/locales/zh.json` 中添加:

```json
{
  "system": {
    "menu": {
      "generator": "模块生成器",
      "modules": "模块管理"
    },
    "generator": {
      "title": "模块生成器",
      "wizard": {
        "title": "创建新模块",
        "step1": {
          "title": "基础信息",
          "desc": "配置模块基本信息"
        },
        "step2": {
          "title": "数据模型",
          "desc": "设计数据模型字段"
        },
        "step3": {
          "title": "菜单权限",
          "desc": "配置菜单和权限"
        },
        "step4": {
          "title": "预览下载",
          "desc": "预览和下载生成的代码"
        },
        "moduleName": "模块名称",
        "displayName": "显示名称",
        "scope": "作用域",
        "templateLevel": "模板级别",
        "generate": "生成代码",
        "download": "下载ZIP",
        "preview": "预览代码"
      },
      "fieldEditor": {
        "addField": "添加字段",
        "name": "字段名",
        "label": "显示标签",
        "type": "字段类型",
        "required": "必填",
        "searchable": "可搜索",
        "sortable": "可排序",
        "visibleInList": "列表可见",
        "visibleInForm": "表单可见"
      },
      "moduleManager": {
        "title": "模块管理",
        "description": "管理已注册的动态模块",
        "registerNew": "注册新模块",
        "unregisterSuccess": "模块卸载成功",
        "unregisterError": "模块卸载失败"
      }
    }
  }
}
```

### 4. 生成后的产品化反馈

当前 `system/generator` 在“一键生成并注册”完成后，会直接返回一份结构化结果摘要，前端结果面板会同步展示：

- **父菜单归属**：显示本次模块最终挂载到哪个父菜单路径，以及来源是“手动指定 / 自动推断 / 顶层模块”
- **重启 / 重建状态**：明确提示当前模块仍处于“待激活”，需要重启后端并重新构建前端
- **自动验证结果**：展示源码落盘、后端 generated registry、前端 generated registry、组件注册表、父菜单检查等验证项

推荐核对顺序：

1. 先确认 `父菜单归属` 是否符合预期
2. 再确认 `backend/modules/*`、`frontend/src/modules/*`、`schema/generated/*` 路径是否正确
3. 最后执行后端重启与前端构建，回到 `/system/modules` 检查状态是否从“待激活”切为“已接入”

## 📖 使用示例

### 示例1: 使用可视化界面生成订单模块

1. 访问 `/system/generator`
2. **步骤1**: 填写基本信息
   - 模块名称: `order`
   - 显示名称: `订单管理`
   - 作用域: `business`
   - 模板级别: `enterprise`

3. **步骤2**: 添加字段
   - `orderNo` (string, 必填, 可搜索) - 订单号
   - `customerName` (string, 必填, 可搜索) - 客户名称
   - `amount` (float, 必填) - 订单金额
   - `status` (enum, 必填) - 订单状态
   - `orderDate` (date, 必填, 可排序) - 订单日期
   - `remark` (text) - 备注

4. **步骤3**: 确认菜单权限(自动生成)

5. **步骤4**: 点击“**一键生成并注册**”
   - 后端写入 `backend/modules/business/order/*`
   - 前端写入 `frontend/src/modules/business/order/*`
   - 自动重写 generated 注册表
   - 模块状态进入“待激活”

6. 重启后端并重建前端

7. 打开 `/system/modules` 检查模块状态是否变为“已接入”

### 示例2: 使用代码生成器API

```typescript
import { 
  ModuleExporter, 
  generateDefaultMenus, 
  generateDefaultPermissions 
} from '@/modules/generator';

const schema = {
  name: 'product',
  displayName: '产品管理',
  scope: 'business' as const,
  templateLevel: 'enterprise' as const,
  model: {
    tableName: 'biz_product',
    fields: [
      { name: 'name', type: 'string' as const, label: '产品名称', required: true, searchable: true },
      { name: 'price', type: 'float' as const, label: '价格', required: true },
      { name: 'stock', type: 'int' as const, label: '库存', required: true, sortable: true },
      { name: 'description', type: 'text' as const, label: '描述' },
    ],
  },
  menus: generateDefaultMenus({
    name: 'product',
    displayName: '产品管理',
    scope: 'business',
    templateLevel: 'enterprise',
    model: { tableName: 'biz_product', fields: [] },
    menus: [],
    permissions: [],
    i18n: { namespace: '', translations: { zh: {}, en: {} } },
  }),
  permissions: generateDefaultPermissions({
    name: 'product',
    scope: 'business',
    enableExport: true,
    enableImport: true,
  } as any),
  i18n: {
    namespace: 'business.product',
    translations: {
      zh: { title: '产品管理', menu: '产品管理', name: '产品名称', price: '价格', stock: '库存' },
      en: { title: 'Product Management', menu: 'Products', name: 'Product Name', price: 'Price', stock: 'Stock' },
    },
  },
  enableExport: true,
  enableImport: true,
};

const exporter = new ModuleExporter(schema);
const files = exporter.generateAll();

console.log(`生成了 ${files.length} 个文件`);
files.forEach(file => {
  console.log(`- ${file.path}`);
});

// 下载ZIP
const blob = await exporter.exportAsZip();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'product-module.zip';
a.click();
```

### 示例3: 动态注册模块

访问 `/system/modules` 查看已注册的模块列表,支持:
- 查看模块状态
- 卸载模块(支持待激活/已接入的业务模块)
- 跳转到生成器注册新模块

## 🧪 测试清单

### 后端测试

```bash
# 编译检查
cd backend
go build ./...

# 运行测试
go test ./modules/system/dynamicmodule/...
```

### 前端测试

```bash
# 类型检查
cd frontend
npm run type-check

# 菜单契约检查
npm run check:menu-contract

# 启动开发服务器
npm run dev
```

### 端到端测试场景

1. ✅ 使用生成器创建"订单管理"模块
2. ✅ 验证生成的后端代码可编译
3. ✅ 验证生成的前端代码可通过类型检查
4. ✅ 校验 generated 路由 / 组件 / 后端模块注册表已自动改写
5. ✅ 重启后端,验证模块从“待激活”进入“已接入”
6. ✅ 重建前端,验证菜单自动显示
7. ✅ 测试CRUD功能是否正常
8. ✅ 访问模块管理页面,验证模块已注册
9. ✅ 测试卸载模块功能

## 📁 生成的代码结构

```
后端 (backend/modules/business/order/):
├── order_model.go          # GORM Model
├── order_dto.go            # DTO定义
├── order_service.go        # Service层
├── order_handler.go        # Handler层
└── module.go               # 模块注册入口

前端 (frontend/src/modules/business/order/):
├── index.ts                # 模块注册
├── api.ts                  # API接口
└── OrderList.tsx           # 列表页组件
```

## ⚠️ 注意事项

1. **包名规则**:
   - `system/*` 使用 `package system`
   - `business/*` 使用 `package {module}`

2. **当前已支持工作区内自动集成**:
   - 后端自动写入 `backend/modules/business/{module}/`
   - 前端自动写入 `frontend/src/modules/business/{module}/`
   - 自动重写:
     - `backend/modules/business/generated_registry.go`
     - `backend/modules/system/menu/generated_component_registry.go`
     - `frontend/src/modules/generated/business.ts`
     - `frontend/src/core/router/generatedComponentRegistry.ts`

3. **动态模块注册表**:
   - 生成器页面会自动调用 `/system/dynamic-modules/generate`
   - 注册成功后模块先进入“待激活”状态
   - 只有完成后端重启和前端重建后才会真正装配

4. **数据库迁移**:
   - 生成的模块代码包含 `Migrate()` 入口
   - 实际迁移发生在后端重启并装配模块之后

5. **权限控制**:
   - 生成的权限需要在Casbin策略中配置
   - 或使用种子数据自动导入
   
6. **业务域限制**:
   - 一键生成只面向 `business/*`
   - `system/*` 必须先明确子域边界，不允许作为“大一统 system 模块”被自动接入

## 🎯 下一步优化建议

1. **自动激活体验**:
   - 增加“生成后提示重启 / 构建”的更强引导
   - 增加待激活模块的激活检查与诊断信息

2. **代码质量**:
   - 集成 ESLint/GolangCI-Lint 检查
   - 自动生成单元测试
   - 支持代码格式化

3. **高级功能**:
   - 支持关联表生成(一对多/多对多)
   - 支持复杂查询(范围查询、多条件组合)
   - 支持自定义模板

4. **模块版本管理**:
   - 支持模块版本升级
   - 支持数据库迁移版本控制
   - 支持模块依赖管理

## 📚 相关文件

### 核心实现
- `frontend/src/modules/generator/schema.ts` - 模块描述Schema
- `frontend/src/modules/generator/type-mapping.ts` - 类型映射
- `frontend/src/modules/generator/backend-generator.ts` - 后端生成器
- `frontend/src/modules/generator/frontend-generator.ts` - 前端生成器
- `frontend/src/modules/generator/exporter.ts` - 代码导出器
- `frontend/src/modules/generator/pages/ModuleWizard.tsx` - 配置向导
- `frontend/src/modules/generator/components/FieldEditor.tsx` - 字段编辑器
- `frontend/src/modules/generator/components/CodePreview.tsx` - 代码预览

### 动态模块管理
- `backend/modules/system/dynamicmodule/dynamic_module_service.go` - 服务层
- `backend/modules/system/dynamicmodule/dynamic_module_handler.go` - Handler层
- `backend/modules/system/dynamicmodule/module.go` - 模块注册
- `frontend/src/modules/system/dynamicmodule/api.ts` - API接口
- `frontend/src/modules/system/dynamicmodule/ModuleManager.tsx` - 管理页面

## ✅ 验收标准

- [x] 可通过可视化界面配置模块并生成完整CRUD代码
- [x] 生成的后端代码可编译
- [x] 生成的前端代码可通过类型检查
- [x] generated 注册表自动改写
- [x] 动态菜单注入后侧边栏自动显示
- [x] 模块卸载后菜单/权限/路由完全清理
- [x] 支持至少3种不同业务模块的生成测试

## 🎉 总结

低代码模块生成器当前已经完成“**业务域一键生成并注册**”主链路，可以帮助你:

- ⚡ **快速开发**: 从几天缩短到几分钟
- 🎯 **代码规范**: 生成的代码100%符合项目规范
- 🔧 **灵活配置**: 支持基础和企业级两种模板
- 📦 **一键下载**: 生成完整的前后端代码包
- 🔄 **动态管理**: 支持待激活 / 已接入模块的注册状态管理与卸载

开始使用吧! 🚀
