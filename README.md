# Telegram 微信公众号转 Telegraph Bot

一个运行在 Cloudflare Workers 上的 Telegram 机器人，可以将微信公众号文章转换为 Telegraph 格式，并支持频道管理和消息发送功能。

## 功能特性

✅ **文章转换**: 自动将微信公众号文章转换为 Telegraph 页面
✅ **智能解析**: 提取文章标题、作者、内容和摘要
✅ **频道管理**: 支持绑定多个 Telegram 频道
✅ **一键发送**: 转换后可选择发送到指定频道
✅ **用户友好**: 直观的按钮界面和交互体验
✅ **数据持久化**: 使用 Cloudflare D1 数据库存储数据
✅ **边缘计算**: 基于 Cloudflare Workers 全球部署

## 技术架构

- **运行环境**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **爬虫方案**: 自定义爬虫（fetch API + HTML解析）
- **API集成**: Telegram Bot API, Telegraph API

## 快速开始

### 🚀 部署方式

#### 方式一：GitHub Actions 自动部署（推荐）

最简单的部署方式，适合新手和快速体验：

1. **Fork 本仓库**
2. **设置 GitHub Secrets**（3个必需的secrets）
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌
   - `TELEGRAM_BOT_TOKEN`: Telegram Bot 令牌
   - `SUPER_ADMIN_ID`: 您的 Telegram 用户 ID
3. **推送代码触发自动部署**

📖 **详细指南**: 查看 [GitHub Actions 部署指南](GITHUB_DEPLOYMENT.md)

#### 方式二：手动部署

适合需要自定义配置的用户：

<details>
<summary>点击展开手动部署步骤</summary>

### 1. 准备工作

1. **创建 Telegram Bot**
   - 与 @BotFather 对话
   - 使用 `/newbot` 命令创建新机器人
   - 获取 Bot Token

2. **获取 Telegraph Access Token** (可选)
   - 机器人会自动创建 Telegraph 账户
   - 也可以手动创建并配置 Access Token

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

编辑 `wrangler.toml` 文件，添加必要的环境变量：

```toml
[vars]
# 这些将在部署后通过 secrets 设置
# TELEGRAM_BOT_TOKEN = "your-bot-token"
# TELEGRAPH_ACCESS_TOKEN = "your-telegraph-access-token"
# ADMIN_API_KEY = "your-admin-api-key"
```

### 4. 创建和配置数据库

```bash
# 创建 D1 数据库
npx wrangler d1 create wechat-bot-db

# 记录返回的 database_id，更新 wrangler.toml

# 执行数据库迁移
npx wrangler d1 migrations apply wechat-bot-db --remote
```

### 5. 设置 Secrets

```bash
# 设置 Telegram Bot Token
npx wrangler secret put TELEGRAM_BOT_TOKEN

# 设置 Telegraph Access Token (可选)
npx wrangler secret put TELEGRAPH_ACCESS_TOKEN

# 设置管理员 API Key
npx wrangler secret put ADMIN_API_KEY
```

### 6. 部署到 Cloudflare Workers

```bash
npm run deploy
```

### 7. 设置 Webhook

部署成功后，获取 Workers URL，设置 Webhook：

```bash
# 使用 curl 设置 webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-worker-url.workers.dev"}'
```

</details>

## 使用说明

### 基本命令

- `/start` - 开始使用机器人
- `/help` - 查看帮助信息
- `/mychannels` - 查看绑定的频道
- `/addchannel` - 添加新频道
- `/removechannel` - 移除频道绑定
- `/stats` - 查看使用统计
- `/settings` - 查看个人设置

### 频道管理

1. **添加频道**
   - 将机器人添加到目标频道
   - 在频道中发送 `/addchannel` 命令
   - 机器人会自动注册频道

2. **发送文章到频道**
   - 转换文章后，选择目标频道
   - 点击对应按钮即可发送

### 文章转换

1. 发送微信公众号文章链接
2. 机器人自动获取并解析内容
3. 创建 Telegraph 页面
4. 返回原链接和 Telegraph 链接
5. 可选择发送到绑定频道

## API 管理

机器人提供了管理 API 端点（需要 API Key）：

### 健康检查
```bash
GET /admin/health
Headers: X-API-Key: your-admin-api-key
```

### 获取统计信息
```bash
GET /admin/stats
Headers: X-API-Key: your-admin-api-key
```

### 设置 Webhook
```bash
POST /admin/webhook
Headers: X-API-Key: your-admin-api-key
Content-Type: application/json

{
  "url": "https://your-webhook-url"
}
```

### 获取机器人信息
```bash
GET /admin/bot-info
Headers: X-API-Key: your-admin-api-key
```

## 开发指南

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 使用本地数据库
npx wrangler d1 migrations apply wechat-bot-db --local
```

### 项目结构

```
src/
├── index.js              # 主入口文件
├── handlers/             # 消息处理器
│   ├── message.js        # 文本消息处理
│   └── callback.js       # 回调查询处理
├── services/             # 服务层
│   ├── telegram.js       # Telegram API 服务
│   ├── crawler.js        # 爬虫服务
│   └── telegraph.js      # Telegraph API 服务
├── database/             # 数据库操作
│   └── db.js            # 数据库类
└── utils/               # 工具函数
    ├── constants.js     # 常量定义
    └── helpers.js       # 辅助函数
```

### 添加新功能

1. 在相应的服务类中添加新方法
2. 在处理器中实现业务逻辑
3. 更新数据库结构（如需要）
4. 添加相应的命令和用户界面

## 故障排除

### 常见问题

1. **Webhook 设置失败**
   - 确保 Workers URL 正确
   - 检查 Bot Token 是否有效
   - 确认网络连接正常

2. **文章转换失败**
   - 检查链接是否为有效的微信公众号文章
   - 确认网络连接正常
   - 查看日志了解具体错误

3. **频道发送失败**
   - 确认机器人在频道中有发送权限
   - 检查频道是否正确绑定
   - 确认用户有管理权限

### 日志查看

```bash
# 查看实时日志
npx wrangler tail

# 查看特定时间段的日志
npx wrangler tail --since=1h
```

## 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您遇到问题或有建议，请：

1. 查看本文档的故障排除部分
2. 搜索现有的 Issues
3. 创建新的 Issue 描述问题
4. 联系开发者

## 更新日志

### v1.0.0
- ✨ 初始版本发布
- ✅ 基本文章转换功能
- ✅ 频道管理功能
- ✅ 用户界面和交互
- ✅ 数据持久化

---

**注意**: 本项目仅供学习和个人使用，请遵守相关平台的使用条款和法律法规。