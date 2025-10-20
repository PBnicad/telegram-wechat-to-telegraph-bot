# Telegram 微信公众号转 Telegraph Bot

[![Deploy to Cloudflare Workers](https://github.com/PBnicad/telegram-wechat-to-telegraph-bot/workflows/Deploy%20to%20Cloudflare%20Workers/badge.svg)](https://github.com/PBnicad/telegram-wechat-to-telegraph-bot/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/PBnicad/telegram-wechat-to-telegraph-bot)
🤖 智能的 Telegram 机器人，将微信公众号文章转换为 Telegraph 页面，并支持 AI 智能总结功能。

## ✨ 功能特性

- 📄 **文章转换**: 支持所有微信公众号文章链接转换
- 🤖 **AI 智能总结**: 使用 DeepSeek API 自动生成文章总结
- ⚡ **快速转换**: Inline 模式支持在任何聊天中快速转换
- 🎨 **美观页面**: 自动生成排版优美的 Telegraph 页面
- 🛡️ **错误处理**: 完善的错误提示和重试机制
- 🔒 **安全可靠**: 基于 Cloudflare Workers，稳定可靠

## 🚀 快速开始

### 方式一：GitHub Actions 自动部署（推荐）

1. **Fork 本仓库**
2. **设置 GitHub Secrets**：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `TELEGRAM_BOT_TOKEN`
   - `DEEPSEEK_API_KEY` = 您的DeepSeek API密钥
   - `TELEGRAPH_ACCESS_TOKEN` (可选)
3. **推送代码**到 main 分支触发自动部署

### 方式二：手动部署

```bash
# 克隆仓库
git clone https://github.com/PBnicad/telegram-wechat-to-telegraph-bot.git
cd telegram-wechat-to-telegraph-bot

# 安装依赖
npm install

# 运行设置脚本
npm run setup

# 手动部署
npm run deploy
```

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📱 使用方法

### 1. 直接发送链接（推荐，包含AI总结）

```
发送: https://mp.weixin.qq.com/s/xxxxx

收到: 阅读原文 | 预览

🤖 AI总结：
[文章智能总结内容]
```

### 2. Inline 模式（快速转换）

在任何聊天中输入：`@你的机器人 微信文章链接`

```
@wechat2telegraphbot https://mp.weixin.qq.com/s/xxxxx

选择结果发送: 阅读原文 | 预览
```

## 🛠️ 技术架构

- **运行平台**: Cloudflare Workers
- **AI 服务**: DeepSeek API
- **转换服务**: Telegraph API
- **开发语言**: JavaScript (ES Modules)

## 📋 环境要求

- Node.js 18+
- Cloudflare 账户
- Telegram Bot Token
- DeepSeek API Key

## 📝 配置说明

### 必需的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 与 [@BotFather](https://t.me/BotFather) 对话 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 使用预设密钥 |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `TELEGRAPH_ACCESS_TOKEN` | Telegraph Token | 自动创建 |

## 🔄 更新日志

### v1.2.0
- ✨ 新增 AI 智能总结功能
- ⚡ 优化 Inline 模式性能
- 🔧 改进错误处理机制

### v1.1.0
- 📄 支持微信公众号文章转换
- 🎨 生成 Telegraph 页面
- 🤖 支持 Inline 模式

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 验证代码
npm run validate

# 查看日志
npm run logs
```

## 📞 支持

- 📖 [部署文档](./DEPLOYMENT.md)
- 🐛 [报告问题](https://github.com/PBnicad/telegram-wechat-to-telegraph-bot/issues)
- 💬 [讨论区](https://github.com/PBnicad/telegram-wechat-to-telegraph-bot/discussions)

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE).

---

⭐ 如果这个项目对您有帮助，请给它一个 Star！
