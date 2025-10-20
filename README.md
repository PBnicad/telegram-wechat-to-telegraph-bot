# Telegram 微信公众号转 Telegraph Bot

一个运行在 Cloudflare Workers 上的 Telegram 机器人，用于将微信公众号文章转换为 Telegraph 页面。当前版本专注于文章转换，不包含频道管理、数据库或管理员端点。

## 功能特性

- 文章转换：将微信文章链接转换为 Telegraph 页面
- 智能解析：提取标题、作者和正文内容
- 简洁交互：直接发送链接即可使用
- 边缘部署：基于 Cloudflare Workers，响应快速、稳定

## 技术架构

- 运行环境：Cloudflare Workers
- 解析/转换：自研 WeChat Parser + Telegraph API
- 交互：Telegram Bot API

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 设置 Secrets
```bash
# 必需：Telegram Bot Token（从 @BotFather 获取）
npx wrangler secret put TELEGRAM_BOT_TOKEN

# 可选：Telegraph Access Token（不设置则自动创建）
npx wrangler secret put TELEGRAPH_ACCESS_TOKEN
```

### 3. 部署到 Cloudflare Workers
```bash
npm run deploy
```

### 4. 设置 Webhook
部署成功后，使用以下命令设置 Webhook（替换 YOUR_BOT_TOKEN 和 YOUR_WORKER_URL）：
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR_WORKER_URL.workers.dev"}'
```

## 使用说明

- `/start`：显示欢迎信息
- `/help`：查看帮助
- 直接发送微信公众号文章链接进行转换

## 文章转换流程

1. 发送微信公众号文章链接（以 `https://mp.weixin.qq.com/s` 开头）
2. 机器人获取并解析文章内容
3. 创建 Telegraph 页面
4. 返回生成的 Telegraph 链接

## 开发指南

```bash
# 启动本地开发服务器
npm run dev
```

## 项目结构

```
src/
├── index.js              # Workers 入口
├── handlers/
│   ├── message.js        # 文本消息处理
│   └── callback.js       # 回调查询处理（仅保留转换与取消）
├── services/
│   ├── telegram.js       # Telegram API 服务
│   ├── telegraph.js      # Telegraph API 服务
│   └── wechat-parser.js  # 微信文章解析器
└── utils/
    ├── constants.js      # 常量定义
    ├── helpers.js        # 辅助函数
    └── wechat-utils.js   # 微信工具函数
```

## 常见问题

- 链接无效：确认链接以 `https://mp.weixin.qq.com/s` 开头
- 转换失败：稍后重试，或检查网络连接
- Webhook 未生效：检查 Worker URL 和 Bot Token 是否正确

## 许可证

MIT
