# 快速开始指南

本指南帮助你在 5 分钟内部署并运行 Telegram 微信公众号转 Telegraph Bot（精简版，仅支持文章转换）。

## 前置要求

- 已安装 `Node.js`（建议 18+）
- 已注册 `Cloudflare` 账户并安装 `Wrangler`
- 已在 Telegram 创建机器人（@BotFather）

## 部署步骤（手动）

### 1. 安装依赖
```bash
npm install
```

### 2. 设置 Secrets
```bash
# 必需：Telegram Bot Token
npx wrangler secret put TELEGRAM_BOT_TOKEN

# 可选：Telegraph Access Token（不设置则自动创建）
npx wrangler secret put TELEGRAPH_ACCESS_TOKEN
```

### 3. 部署到 Cloudflare Workers
```bash
npm run deploy
```

### 4. 设置 Telegram Webhook
```bash
# 替换 YOUR_BOT_TOKEN 与 YOUR_WORKER_URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR_WORKER_URL.workers.dev"}'
```

## 使用与测试

1. 在 Telegram 搜索你的机器人，发送 `/start`
2. 直接发送一个微信公众号文章链接（例如 `https://mp.weixin.qq.com/s/...`）
3. 收到返回的 Telegraph 链接即可

## 常见问题

- Webhook 未生效：检查 Worker URL 与 Bot Token 是否正确
- 链接无效：确保链接以 `https://mp.weixin.qq.com/s` 开头
- 转换失败：稍后重试或查看日志 `npx wrangler tail`

## 本地开发

```bash
npm run dev
```

## 说明

- 本版本已移除频道管理、数据库、管理员 API 等功能
- 项目专注于稳定的文章解析与 Telegraph 页面创建

享受使用吧！🚀