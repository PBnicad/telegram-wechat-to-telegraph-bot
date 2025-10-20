# 部署说明（精简版）

本文档介绍如何将 Telegram 微信公众号转 Telegraph Bot 部署到 Cloudflare Workers。当前版本仅支持文章转换，不包含频道管理、数据库或管理员端点。

## 前置条件

- `Node.js` 与 `npm`
- `Cloudflare` 账户与 `Wrangler` 工具
- 一个 Telegram Bot（来自 `@BotFather`）

## 环境配置

### 必需 Secrets
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

### 可选 Secrets
```bash
# 不设置则由程序自动创建 Telegraph 账户
npx wrangler secret put TELEGRAPH_ACCESS_TOKEN
```

## 部署步骤

1. 安装依赖：
```bash
npm install
```

2. 部署到 Cloudflare：
```bash
npm run deploy
```

3. 设置 Telegram Webhook：
```bash
# 替换 YOUR_BOT_TOKEN 与 YOUR_WORKER_URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR_WORKER_URL.workers.dev"}'
```

## 验证部署

- 检查机器人信息：
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe"
```

- 在 Telegram 与机器人对话：
  - 发送 `/start`
  - 发送一个 `https://mp.weixin.qq.com/s/...` 链接，收到 Telegraph 链接即成功

## 常见问题

- Webhook 设置失败：确认 Worker URL 正确且可访问；检查 Bot Token 是否有效
- 转换失败：稍后重试或查看日志
```bash
npx wrangler tail
```

## 说明

- 已移除：频道管理、数据库、管理员 API
- 专注：稳定的微信文章解析与 Telegraph 页面创建

部署完成，开始使用吧！🚀