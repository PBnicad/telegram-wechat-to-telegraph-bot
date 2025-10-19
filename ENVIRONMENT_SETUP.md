# 环境变量设置指南

本文档说明如何为 Telegram WeChat to Telegraph Bot 设置必要的环境变量。

## 🔧 必需的环境变量

### 1. Telegram Bot Token
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```
从 [@BotFather](https://t.me/botfather) 获取您的 Bot Token。

### 2. 超级管理员 ID
```bash
wrangler secret put SUPER_ADMIN_ID
```
设置您的 Telegram 用户 ID 作为默认超级管理员。

## 🛠️ 可选的环境变量

### 1. Telegraph Access Token
```bash
wrangler secret put TELEGRAPH_ACCESS_TOKEN
```
如果提供，将使用现有的 Telegraph 账户。如果不提供，机器人会自动创建新账户。

### 2. Admin API Key
```bash
wrangler secret put ADMIN_API_KEY
```
用于访问管理 API 端点的密钥。

## 📋 配置步骤

### 1. 设置必需的密钥
```bash
# 设置 Telegram Bot Token
wrangler secret put TELEGRAM_BOT_TOKEN
# 输入您的 Bot Token

# 设置超级管理员 ID
wrangler secret put SUPER_ADMIN_ID
# 输入您的 Telegram 用户 ID（数字）
```

### 2. 设置可选密钥
```bash
# 设置 Telegraph Access Token（可选）
wrangler secret put TELEGRAPH_ACCESS_TOKEN

# 设置 Admin API Key（可选）
wrangler secret put ADMIN_API_KEY
```

### 3. 验证配置
```bash
# 检查已设置的密钥
wrangler secret list

# 测试部署
wrangler deploy
```

## 🚨 安全注意事项

1. **永远不要将密钥提交到 Git 仓库**
2. **使用强密码和唯一的 Token**
3. **定期轮换密钥**
4. **限制访问权限**

## 🔍 获取用户 ID 的方法

1. 向 [@userinfobot](https://t.me/userinfobot) 发送消息
2. 或向您的 Bot 发送 `/start` 命令，然后查看日志

## 📝 环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot Token | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `SUPER_ADMIN_ID` | ✅ | 超级管理员用户 ID | `123456789` |
| `TELEGRAPH_ACCESS_TOKEN` | ❌ | Telegraph 访问令牌 | `abcd1234efgh5678` |
| `ADMIN_API_KEY` | ❌ | 管理 API 密钥 | `your-secret-key` |

## 🛠️ 本地开发

创建 `.env.local` 文件（不要提交到 Git）：
```bash
cp .env.example .env.local
# 编辑 .env.local 文件，填入您的配置
```

## ❓ 故障排除

### 问题：Bot 没有响应
1. 检查 `TELEGRAM_BOT_TOKEN` 是否正确设置
2. 确认 Bot Token 没有过期
3. 验证 Webhook URL 是否正确配置

### 问题：权限不足
1. 检查 `SUPER_ADMIN_ID` 是否正确设置
2. 确认您的用户 ID 与配置的 ID 一致
3. 查看日志获取详细错误信息

### 问题：Telegraph 创建失败
1. 检查网络连接
2. 确认 `TELEGRAPH_API_URL` 可访问
3. 考虑手动设置 `TELEGRAPH_ACCESS_TOKEN`

## 📞 获取帮助

如果遇到问题，请：
1. 查看项目日志
2. 检查 Cloudflare Workers 状态页面
3. 联系技术支持