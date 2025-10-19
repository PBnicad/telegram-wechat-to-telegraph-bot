# 🚀 GitHub Actions 快速部署指南

## 📋 部署清单

在开始之前，请确保您已准备好：

- [ ] GitHub 账户
- [ ] Cloudflare 账户（已激活 Workers 和 D1 服务）
- [ ] Telegram Bot Token
- [ ] 您的 Telegram 用户 ID

## ⚡ 5分钟快速部署

### 步骤 1: Fork 仓库 (30秒)

1. 访问本仓库页面
2. 点击右上角 **"Fork"** 按钮
3. 选择您的 GitHub 账户

### 步骤 2: 获取必要凭证 (2-3分钟)

#### A. Telegram Bot Token
1. 在 Telegram 中搜索 **@BotFather**
2. 发送 `/newbot` 创建新机器人
3. 按提示设置机器人名称和用户名
4. 复制获得的 Bot Token（格式：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`）

#### B. Telegram User ID
1. 在 Telegram 中搜索 **@userinfobot**
2. 发送任意消息
3. 复制返回的数字 ID

#### C. Cloudflare API Token
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Profile → API Tokens**
3. 点击 **Create Token**
4. 选择 **Custom token**
5. 设置权限：
   - Account: Account Settings: Read
   - Zone: Zone: Read
   - Zone: Zone Settings: Edit
   - Zone: Page Rules: Edit
6. Zone Resources: All zones
7. 创建并复制 Token

### 步骤 3: 设置 GitHub Secrets (2分钟)

1. 进入您 fork 的仓库
2. 点击 **Settings** 标签页
3. 左侧菜单：**Secrets and variables** → **Actions**
4. 点击 **New repository secret**，添加以下 3 个 secrets：

| Secret 名称 | 值 |
|------------|-----|
| `CLOUDFLARE_API_TOKEN` | 步骤2C中获得的Cloudflare Token |
| `TELEGRAM_BOT_TOKEN` | 步骤2A中获得的Bot Token |
| `SUPER_ADMIN_ID` | 步骤2B中获得的用户ID |

### 步骤 4: 触发自动部署 (30秒)

推送代码到主分支：

```bash
git clone https://github.com/YOUR_USERNAME/telegram-wechat-bot.git
cd telegram-wechat-bot
git push origin main
```

或者直接在 GitHub 页面上：
1. 进入 **Actions** 标签页
2. 选择 **"Deploy to Cloudflare Workers"** workflow
3. 点击 **"Run workflow"**
4. 选择 **production** 环境
5. 点击 **"Run workflow"**

### 步骤 5: 等待部署完成 (1-2分钟)

1. 在 Actions 页面查看部署进度
2. 部署成功后，复制 Workers URL
3. 测试机器人功能

## 🎉 部署成功！

### 测试您的机器人

1. 在 Telegram 中搜索您的机器人（使用创建时设置的用户名）
2. 发送 `/start` 开始使用
3. 发送任意微信公众号文章链接测试转换功能

### 管理您的机器人

- **健康检查**: `https://your-url.workers.dev/health`
- **统计信息**: `https://your-url.workers.dev/admin/stats`
- **查看日志**: GitHub Actions → 部署记录 → 查看详细日志

## 🔧 可选配置

### 设置管理 API Key

如果您需要访问管理面板：

1. 在 GitHub Secrets 中添加 `ADMIN_API_KEY`
2. 值可以是任意字符串（建议使用强密码）
3. 使用此密钥访问 `/admin/stats` 端点

### 设置 Telegraph Token

如果您有自己的 Telegraph 账户：

1. 在 GitHub Secrets 中添加 `TELEGRAPH_ACCESS_TOKEN`
2. 获取方式：创建 Telegraph 账户后获得

## ❓ 常见问题

### Q: 部署失败怎么办？
A: 查看 Actions 页面的详细错误日志，常见问题：
- Cloudflare API Token 权限不足
- Telegram Bot Token 格式错误
- 网络连接问题

### Q: 如何设置多个环境？
A: 手动触发部署时选择 `development` 环境，或创建 PR 自动部署预览环境

### Q: 如何更新机器人？
A: 直接推送代码到主分支，会自动触发重新部署

### Q: 可以本地开发吗？
A: 可以！克隆仓库后按照传统方式部署，详见 [DEPLOY.md](../DEPLOY.md)

## 📚 更多资源

- [完整文档](../README.md)
- [详细部署指南](../GITHUB_DEPLOYMENT.md)
- [故障排除](../DEPLOY.md#故障排除)
- [项目 Issues](../../issues)

## 🆘 需要帮助？

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 检查 Secrets 设置是否正确
3. 搜索现有的 Issues
4. 创建新的 Issue 并提供详细信息

---

🎊 **恭喜！** 您的 Telegram 微信公众号转 Telegraph 机器人已成功部署！