# 部署指南

本文档介绍如何部署 Telegram 微信公众号转 Telegraph Bot，支持AI总结功能。

## 🚀 快速部署（推荐）

### GitHub Actions 自动部署

1. **Fork 本仓库** 到您的 GitHub 账户

2. **设置 GitHub Secrets**：
   - 进入您的仓库 → Settings → Secrets and variables → Actions
   - 添加以下 Secrets：

   ```
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAPH_ACCESS_TOKEN=your_telegraph_token (可选)
   ```

3. **获取必要信息**：
   - **Cloudflare API Token**: 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) 创建 token
   - **Cloudflare Account ID**: 在 Cloudflare Dashboard 侧边栏找到
   - **Telegram Bot Token**: 与 [@BotFather](https://t.me/BotFather) 对话创建机器人获取

4. **触发部署**：
   - 推送代码到 main 分支，或
   - 在 Actions 页面手动触发 "Deploy to Cloudflare Workers"

5. **设置 Telegram Webhook**：
   ```bash
   curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://telegram-wechat-bot.nicad.workers.dev"}'
   ```

> **AI 总结功能**使用 Cloudflare Workers AI，通过 `wrangler.toml` 中的 `[ai]` binding 自动启用，无需额外配置 API Key。

## 🔧 手动部署

### 前置条件

- Node.js 18+
- Cloudflare 账户
- Wrangler CLI: `npm install -g wrangler`

### 部署步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/PBnicad/telegram-wechat-to-telegraph-bot.git
   cd telegram-wechat-to-telegraph-bot
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **登录 Cloudflare**
   ```bash
   npx wrangler login
   ```

4. **设置 Secrets**
   ```bash
   # 必需
   echo "your_telegram_bot_token" | npx wrangler secret put TELEGRAM_BOT_TOKEN

   # 可选（不设置则自动创建 Telegraph 账户）
   echo "your_telegraph_token" | npx wrangler secret put TELEGRAPH_ACCESS_TOKEN
   ```

5. **部署**
   ```bash
   npm run deploy
   ```

6. **设置 Webhook**
   ```bash
   curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://telegram-wechat-bot.nicad.workers.dev"}'
   ```

## 📱 功能特性

### ✅ 支持的功能

- **微信公众号文章转换**: 支持所有微信公众号文章链接
- **AI 智能总结**: 使用 Cloudflare Workers AI (Qwen3) 自动生成文章总结
- **Telegraph 页面创建**: 自动生成美观的 Telegraph 页面
- **Inline 模式**: 在任何聊天中使用 `@机器人 微信链接` 快速转换
- **错误处理**: 完善的错误提示和重试机制

### 🎯 使用方式

1. **直接发送链接**（推荐，包含AI总结）：
   ```
   发送: https://mp.weixin.qq.com/s/xxxxx
   收到: 阅读原文 | 预览

   🤖 AI总结：
   [文章智能总结内容]
   ```

2. **Inline 模式**（快速转换，无AI总结）：
   ```
   在任意聊天输入: @你的机器人 https://mp.weixin.qq.com/s/xxxxx
   选择结果发送: 阅读原文 | 预览
   ```

## 🔍 验证部署

### 基本测试

1. **检查 Worker 状态**：
   ```bash
   curl https://telegram-wechat-bot.nicad.workers.dev/
   ```

2. **测试 Bot**：
   - 在 Telegram 中发送 `/start`
   - 发送一个微信公众号文章链接
   - 确认收到 Telegraph 链接和 AI 总结

### 高级测试

- **Inline 模式测试**：在不同聊天中使用 `@机器人 微信链接`
- **错误处理测试**：发送无效链接查看错误提示
- **长文章测试**：发送长篇文章测试 AI 总结功能

## 🛠️ 故障排除

### 常见问题

1. **Webhook 设置失败**
   - 检查 Bot Token 是否正确
   - 确认 Worker URL 可访问
   - 查看 Cloudflare Workers 日志

2. **AI 总结不工作**
   - 确认 `wrangler.toml` 中有 `[ai]` binding 配置
   - 查看 Workers 日志中的错误信息
   - Cloudflare Workers AI 免费额度每天 10,000 次请求

3. **文章解析失败**
   - 确认链接格式正确：`https://mp.weixin.qq.com/s/xxxxx`
   - 检查文章是否已被删除
   - 尝试刷新页面后重新发送链接

4. **图片不显示**
   - 确认图片使用 `qpic.cn.in` 代理域名
   - 检查 WeChat 图片原始链接是否可访问

### 查看日志

```bash
# 实时查看 Workers 日志
npx wrangler tail

# 查看最近的日志
npx wrangler tail --since 1h
```

## 📝 配置说明

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot Token |
| `TELEGRAPH_ACCESS_TOKEN` | ❌ | Telegraph Token，不设置则自动创建 |

### 功能配置

在 `wrangler.toml` 中可以调整：
- 解析超时时间
- 代理设置
- 图片处理选项

## 🔄 更新部署

### 自动更新
- 推送代码到 main 分支自动触发部署

### 手动更新
```bash
git pull origin main
npm run deploy
```

## 📞 支持

如遇到问题：
1. 查看 [GitHub Issues](https://github.com/PBnicad/telegram-wechat-to-telegraph-bot/issues)
2. 检查 Cloudflare Workers 日志
3. 确认所有 secrets 正确设置

---

🎉 **部署完成！开始享受智能文章转换服务吧！**