# GitHub Actions 自动部署指南

本文档介绍如何使用 GitHub Actions 自动部署 Telegram 微信公众号转 Telegraph 机器人到 Cloudflare Workers。

## 🚀 快速开始

### 1. Fork 本仓库

1. 访问本仓库页面
2. 点击右上角的 **"Fork"** 按钮
3. 选择您的 GitHub 账户

### 2. 设置 GitHub Secrets

进入您 fork 的仓库，按以下步骤设置必要的环境变量：

1. 点击 **Settings** 标签页
2. 在左侧菜单中找到 **"Secrets and variables"** → **"Actions"**
3. 点击 **"New repository secret"** 添加以下 secrets：

#### 必需的 Secrets

| Secret 名称 | 描述 | 获取方式 |
|------------|------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 访问令牌 | [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot 令牌 | 与 [@BotFather](https://t.me/BotFather) 对话获取 |
| `SUPER_ADMIN_ID` | 超级管理员 Telegram 用户 ID | 与 [@userinfobot](https://t.me/userinfobot) 对话获取 |

#### 可选的 Secrets

| Secret 名称 | 描述 | 说明 |
|------------|------|------|
| `ADMIN_API_KEY` | 管理面板 API 密钥 | 如不设置，系统会自动生成 |
| `TELEGRAPH_ACCESS_TOKEN` | Telegraph 访问令牌 | Telegraph 账户获取 |

### 3. Cloudflare API Token 权限设置

创建 Cloudflare API Token 时，请确保具有以下权限：

```
Account: Account Settings: Read
Zone: Zone: Read
Zone: Zone Settings: Edit
Zone: Page Rules: Edit
```

Token 范围应设置为 **"All zones"** 或指定您的域名。

### 4. 启用 GitHub Actions

1. 在仓库的 **Settings** → **Actions** 中
2. 确保选择了 **"Allow all actions and reusable workflows"**
3. 或选择 **"Allow select actions"** 并添加必要权限

## 🔄 部署方式

### 方式一：自动部署（推荐）

推送代码到主分支会自动触发生产环境部署：

```bash
git push origin main
```

### 方式二：手动部署

1. 进入仓库的 **Actions** 标签页
2. 选择 **"Deploy to Cloudflare Workers"** workflow
3. 点击 **"Run workflow"** 按钮
4. 选择环境：
   - `production`: 生产环境
   - `development`: 开发环境
5. 点击 **"Run workflow"**

### 方式三：Pull Request 预览

创建 Pull Request 时会自动部署预览环境，用于测试。

## 📊 部署监控

### 查看部署状态

1. 进入 **Actions** 标签页查看部署进度
2. 部署完成后，查看部署摘要中的 URL 和相关信息
3. 检查是否有任何错误或警告

### 验证部署

部署完成后，可以通过以下 URL 验证：

- **健康检查**: `https://your-worker-url.workers.dev/health`
- **根端点**: `https://your-worker-url.workers.dev/`
- **管理面板**: `https://your-worker-url.workers.dev/admin/stats`

### 获取管理 API Key

如果未设置 `ADMIN_API_KEY` secret，部署日志中会显示自动生成的 API Key。

## 🔧 本地开发

### 环境变量设置

复制 `.env.local.example` 为 `.env.local` 并填入本地开发所需的环境变量：

```bash
cp .env.local.example .env.local
```

### 本地运行

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 本地部署测试
npm run deploy
```

## 🐛 故障排除

### 常见问题

#### 1. Cloudflare API Token 权限不足
**错误**: `Authentication error`

**解决**: 检查 API Token 权限设置，确保包含所需的所有权限。

#### 2. Telegram Webhook 设置失败
**错误**: `Bad Request: webhook URL is not recognized`

**解决**:
- 确保 Workers URL 可以正常访问
- 检查 Telegram Bot Token 是否正确
- 确保没有其他 webhook 冲突

#### 3. 数据库迁移失败
**错误**: `D1 migration failed`

**解决**:
- 检查 `schema.sql` 文件是否存在
- 确认 D1 数据库权限
- 查看 Actions 日志获取详细错误信息

#### 4. GitHub Actions 权限错误
**错误**: `Permission denied`

**解决**:
- 检查仓库 Actions 权限设置
- 确保允许第三方 actions
- 验证 GitHub 账户权限

### 调试技巧

1. **查看详细日志**: 在 Actions 页面点击具体的 workflow run 查看详细日志
2. **本地测试**: 使用 `npm run deploy:github` 在本地测试部署脚本
3. **分步调试**: 在 workflow 文件中添加调试步骤或增加日志输出

## 📋 工作流详解

### 部署工作流程

GitHub Actions 工作流包含以下步骤：

1. **预检查** (pre-check)
   - 代码格式检查
   - 配置文件验证
   - 依赖安装

2. **数据库迁移** (database-migration)
   - 创建 D1 数据库（如果不存在）
   - 执行数据库迁移

3. **部署** (deploy)
   - 环境变量验证
   - 部署到 Cloudflare Workers
   - 设置 Telegram Webhook
   - 健康检查验证

4. **安全扫描** (security-scan)
   - 使用 Trivy 扫描安全漏洞
   - 上传结果到 GitHub Security tab

### 环境支持

- **Production**: 生产环境，完整部署和 webhook 设置
- **Development**: 开发环境，部署但不设置 webhook
- **Preview**: PR 预览环境，用于测试

## 🔒 安全考虑

1. **Secrets 管理**: 永远不要在代码中硬编码敏感信息
2. **API 权限**: 遵循最小权限原则设置 API Token
3. **定期轮换**: 定期更新 API Token 和密钥
4. **日志安全**: 确保日志中不包含敏感信息

## 📚 更多资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Telegram Bot API 文档](https://core.telegram.org/bots/api)
- [项目主文档](README.md)
- [详细部署指南](DEPLOY.md)

## 🆘 获取帮助

如果遇到问题，可以：

1. 查看 [Issues](../../issues) 页面寻找解决方案
2. 创建新的 Issue 描述问题
3. 检查 [Actions](../../actions) 页面的错误日志
4. 参考项目文档和故障排除指南

---

🎉 **恭喜！** 设置完成后，每次推送代码到主分支都会自动部署您的机器人。