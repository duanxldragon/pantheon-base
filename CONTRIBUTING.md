# Contributing to Pantheon Base

[中文版本](#中文版本)

Thank you for your interest in contributing to Pantheon Base! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Go**: 1.21 or later
- **Node.js**: 18.x or later
- **MySQL**: 8.0 or later
- **Redis**: 7.0 or later
- **Git**: Latest version

### Setting Up Development Environment

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/pantheon-base.git
   cd pantheon-base
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/duanxldragon/pantheon-base.git
   ```

4. **Install dependencies**

   **Backend:**
   ```bash
   cd backend
   go mod download
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

5. **Set up database**

   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE pantheon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # Run migrations
   cd backend
   go run ./cmd/server --migrate
   ```

6. **Start development servers**

   **Backend:**
   ```bash
   cd backend
   go run ./cmd/server
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker
- Check if the bug has already been reported
- Use the bug report template
- Provide detailed reproduction steps
- Include environment information

### Suggesting Features

- Use the GitHub issue tracker
- Use the feature request template
- Explain the use case clearly
- Consider implementation complexity
- Be open to discussion

### Asking Questions

- Use GitHub Discussions for general questions
- Use the question issue template for specific questions
- Search existing issues first
- Provide context and environment details

## Development Workflow

### Branching Strategy

- **main**: Production-ready code
- **develop**: Development branch (if exists)
- **feature/xxx**: New features
- **fix/xxx**: Bug fixes
- **docs/xxx**: Documentation updates

### Creating a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-new-feature
```

### Making Changes

1. **Write code** following our coding standards
2. **Write tests** for new functionality
3. **Update documentation** if needed
4. **Run tests** to ensure nothing breaks
5. **Commit changes** with clear messages

### Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add SSO/OIDC support

Implement OIDC authentication flow with support for
Auth0, Okta, and Azure AD providers.

Closes #123
```

```
fix(api): resolve user list pagination issue

Fixed off-by-one error in pagination calculation
that caused last page to be empty.

Fixes #456
```

## Coding Standards

### Go Code

- Follow [Effective Go](https://golang.org/doc/effective_go.html)
- Use `gofmt` for formatting
- Use `golangci-lint` for linting
- Write meaningful variable names
- Add comments for exported functions
- Keep functions small and focused

**Example:**
```go
// GetUserByID retrieves a user by their ID.
// Returns ErrNotFound if the user doesn't exist.
func (s *UserService) GetUserByID(ctx context.Context, id uint64) (*User, error) {
    var user User
    if err := s.db.WithContext(ctx).First(&user, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("get user: %w", err)
    }
    return &user, nil
}
```

### TypeScript/React Code

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use `eslint` and `prettier`
- Use TypeScript for type safety
- Write functional components with hooks
- Keep components small and reusable

**Example:**
```typescript
interface UserListProps {
  department?: string;
  pageSize?: number;
}

export const UserList: React.FC<UserListProps> = ({ 
  department, 
  pageSize = 20 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [department]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list({ department, pageSize });
      setUsers(data);
    } catch (error) {
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  return <div>{/* ... */}</div>;
};
```

## Testing Guidelines

### Backend Tests

- Write unit tests for business logic
- Write integration tests for API endpoints
- Aim for 60%+ coverage for critical modules
- Use table-driven tests for multiple scenarios

**Running tests:**
```bash
cd backend

# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./modules/auth/login
```

### Frontend Tests

- Write unit tests for utilities and hooks
- Write component tests for UI components
- Use React Testing Library

**Running tests:**
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Documentation

### Code Documentation

- Add comments for exported functions/types
- Explain "why" not just "what"
- Keep comments up to date with code

### User Documentation

- Update relevant docs in `docs/` directory
- Use clear, concise language
- Include examples where helpful
- Support both English and Chinese (if possible)

### API Documentation

- Document new API endpoints
- Include request/response examples
- Document error codes
- Update OpenAPI/Swagger specs (if exists)

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**
   ```bash
   # Backend
   cd backend && go test ./...
   
   # Frontend
   cd frontend && npm test
   ```

3. **Run linters**
   ```bash
   # Backend
   golangci-lint run
   
   # Frontend
   npm run lint
   ```

4. **Update documentation** if needed

### Submitting PR

1. **Push to your fork**
   ```bash
   git push origin feature/my-feature
   ```

2. **Create Pull Request** on GitHub

3. **Fill in PR template**
   - Describe changes clearly
   - Link related issues
   - Add screenshots for UI changes
   - List breaking changes (if any)

4. **Wait for review**
   - Address review comments
   - Keep PR scope focused
   - Be patient and respectful

### PR Requirements

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New code has tests
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] PR description is clear

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Pull Requests**: Code contributions

### Getting Help

- Search existing issues/discussions
- Ask questions in GitHub Discussions
- Be respectful and patient
- Provide context and examples

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md (if exists)
- Mentioned in release notes
- Appreciated in the community!

---

## 中文版本

感谢你有兴趣为 Pantheon Base 做贡献！本文档提供了项目贡献指南。

## 目录

- [行为准则](#行为准则)
- [开始贡献](#开始贡献)
- [如何贡献](#如何贡献-1)
- [开发工作流](#开发工作流)
- [编码标准](#编码标准-1)
- [测试指南](#测试指南-1)
- [文档](#文档-1)
- [Pull Request 流程](#pull-request-流程)
- [社区](#社区-1)

## 行为准则

本项目遵守行为准则。参与项目即表示你同意遵守此准则。请向项目维护者报告不当行为。

## 开始贡献

### 前置条件

- **Go**: 1.21 或更高版本
- **Node.js**: 18.x 或更高版本
- **MySQL**: 8.0 或更高版本
- **Redis**: 7.0 或更高版本
- **Git**: 最新版本

### 搭建开发环境

1. **Fork 仓库**

   在 GitHub 上点击 "Fork" 按钮创建你自己的副本。

2. **克隆你的 fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/pantheon-base.git
   cd pantheon-base
   ```

3. **添加上游远程仓库**

   ```bash
   git remote add upstream https://github.com/duanxldragon/pantheon-base.git
   ```

4. **安装依赖**

   **后端:**
   ```bash
   cd backend
   go mod download
   ```

   **前端:**
   ```bash
   cd frontend
   npm install
   ```

5. **设置数据库**

   ```bash
   # 创建数据库
   mysql -u root -p -e "CREATE DATABASE pantheon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # 运行迁移
   cd backend
   go run ./cmd/server --migrate
   ```

6. **启动开发服务器**

   **后端:**
   ```bash
   cd backend
   go run ./cmd/server
   ```

   **前端:**
   ```bash
   cd frontend
   npm run dev
   ```

## 如何贡献

### 报告 Bug

- 使用 GitHub issue tracker
- 检查 bug 是否已被报告
- 使用 bug 报告模板
- 提供详细的复现步骤
- 包含环境信息

### 建议功能

- 使用 GitHub issue tracker
- 使用功能请求模板
- 清楚地解释使用场景
- 考虑实现复杂度
- 保持开放讨论

### 提问

- 使用 GitHub Discussions 提问一般性问题
- 使用问题 issue 模板提问具体问题
- 先搜索现有 issues
- 提供上下文和环境详情

## 开发工作流

### 分支策略

- **main**: 生产就绪代码
- **develop**: 开发分支（如果存在）
- **feature/xxx**: 新功能
- **fix/xxx**: Bug 修复
- **docs/xxx**: 文档更新

### 创建功能分支

```bash
# 更新你的 fork
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feature/my-new-feature
```

### 进行更改

1. **编写代码** 遵循编码标准
2. **编写测试** 为新功能编写测试
3. **更新文档** 如有需要
4. **运行测试** 确保没有破坏
5. **提交更改** 使用清晰的提交信息

### 提交信息指南

遵循 conventional commits 格式：

```
<类型>(<范围>): <主题>

<正文>

<页脚>
```

**类型:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更改
- `style`: 代码样式更改（格式等）
- `refactor`: 代码重构
- `test`: 添加或更新测试
- `chore`: 维护任务

**示例:**
```
feat(auth): 添加 SSO/OIDC 支持

实现 OIDC 认证流程，支持 Auth0、Okta 和 Azure AD。

Closes #123
```

## 编码标准

### Go 代码

- 遵循 [Effective Go](https://golang.org/doc/effective_go.html)
- 使用 `gofmt` 格式化
- 使用 `golangci-lint` 检查
- 使用有意义的变量名
- 为导出函数添加注释
- 保持函数小而专注

### TypeScript/React 代码

- 遵循 [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- 使用 `eslint` 和 `prettier`
- 使用 TypeScript 保证类型安全
- 使用 hooks 编写函数组件
- 保持组件小而可复用

## 测试指南

### 后端测试

- 为业务逻辑编写单元测试
- 为 API 端点编写集成测试
- 关键模块覆盖率达到 60%+
- 对多种场景使用表驱动测试

**运行测试:**
```bash
cd backend

# 运行所有测试
go test ./...

# 带覆盖率运行
go test -cover ./...

# 运行特定包
go test ./modules/auth/login
```

### 前端测试

- 为工具函数和 hooks 编写单元测试
- 为 UI 组件编写组件测试
- 使用 React Testing Library

**运行测试:**
```bash
cd frontend

# 运行所有测试
npm test

# 带覆盖率运行
npm test -- --coverage
```

## 文档

### 代码文档

- 为导出的函数/类型添加注释
- 解释"为什么"而不仅仅是"是什么"
- 保持注释与代码同步

### 用户文档

- 更新 `docs/` 目录中的相关文档
- 使用清晰简洁的语言
- 在有帮助的地方包含示例
- 支持英文和中文（如果可能）

## Pull Request 流程

### 提交前

1. **与上游同步**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **运行测试**
   ```bash
   # 后端
   cd backend && go test ./...
   
   # 前端
   cd frontend && npm test
   ```

3. **运行 linter**
   ```bash
   # 后端
   golangci-lint run
   
   # 前端
   npm run lint
   ```

4. **更新文档**（如需要）

### 提交 PR

1. **推送到你的 fork**
   ```bash
   git push origin feature/my-feature
   ```

2. **在 GitHub 创建 Pull Request**

3. **填写 PR 模板**
   - 清楚描述更改
   - 关联相关 issues
   - 为 UI 更改添加截图
   - 列出破坏性更改（如有）

4. **等待审查**
   - 处理审查意见
   - 保持 PR 范围聚焦
   - 保持耐心和尊重

### PR 要求

- [ ] 代码遵循项目风格指南
- [ ] 测试在本地通过
- [ ] 新代码有测试
- [ ] 文档已更新
- [ ] 提交信息遵循约定
- [ ] 没有合并冲突
- [ ] PR 描述清晰

## 社区

### 交流渠道

- **GitHub Issues**: Bug 报告、功能请求
- **GitHub Discussions**: 一般性问题、想法
- **Pull Requests**: 代码贡献

### 获取帮助

- 搜索现有 issues/discussions
- 在 GitHub Discussions 提问
- 保持尊重和耐心
- 提供上下文和示例

### 致谢

贡献者将会：
- 列在 CONTRIBUTORS.md（如果存在）
- 在发布说明中提及
- 在社区中受到感谢！

---

**Thank you for contributing to Pantheon Base! / 感谢你为 Pantheon Base 做贡献！**
