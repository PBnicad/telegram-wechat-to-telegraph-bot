# 项目结构说明

## 📁 项目目录结构

```
telegram-wechat-to-telegraph-bot/
├── .github/workflows/
│   └── deploy.yml                    # GitHub Actions 自动部署工作流
├── scripts/
│   └── setup-secrets.js             # 交互式设置脚本
├── src/
│   ├── config/
│   │   └── wechat-config.js          # 微信解析配置
│   ├── handlers/
│   │   ├── callback.js               # 回调查询处理器
│   │   ├── inline.js                 # Inline 查询处理器
│   │   └── message.js                # 消息处理器（包含AI总结）
│   ├── services/
│   │   ├── deepseek.js               # DeepSeek API 服务（AI总结）
│   │   ├── telegram.js               # Telegram API 服务
│   │   ├── telegraph.js              # Telegraph API 服务
│   │   └── wechat-parser.js          # 微信文章解析器
│   ├── types/
│   │   └── wechat.js                 # 微信相关类型定义
│   ├── utils/
│   │   ├── constants.js              # 常量定义
│   │   ├── helpers.js                # 辅助函数
│   │   └── wechat-utils.js           # 微信工具函数
│   └── index.js                      # Cloudflare Workers 入口文件
├── .wrangler/                        # Wrangler 临时文件
├── node_modules/                     # 依赖包
├── DEPLOYMENT.md                     # 详细部署文档
├── LICENSE                           # MIT 许可证
├── README.md                         # 项目说明
├── package.json                      # 项目配置
└── wrangler.toml                     # Cloudflare Workers 配置
```

## 🚀 核心功能模块

### 1. 消息处理流程 (`src/handlers/message.js`)
- **微信文章解析**: 调用 WeChatParser 解析文章内容
- **Telegraph 页面创建**: 生成美观的 Telegraph 页面
- **AI 总结生成**: 调用 DeepSeek API 生成智能总结
- **错误处理**: 完善的错误处理和用户提示

### 2. Inline 模式 (`src/handlers/inline.js`)
- **快速转换**: 支持在任何聊天中快速转换
- **简洁响应**: 只返回原文和预览链接
- **性能优化**: 不包含 AI 总结，响应更快

### 3. AI 总结服务 (`src/services/deepseek.js`)
- **DeepSeek API 集成**: 调用 DeepSeek Chat API
- **智能总结**: 生成简洁准确的文章总结
- **错误容错**: AI 总结失败不影响主要功能

### 4. 微信解析器 (`src/services/wechat-parser.js`)
- **文章内容提取**: 提取标题、作者、正文等内容
- **格式转换**: 将 HTML 内容转换为 Markdown
- **图片处理**: 处理和优化图片链接

## 🔧 部署方式

### GitHub Actions 自动部署（推荐）
- **工作流文件**: `.github/workflows/deploy.yml`
- **自动设置**: 自动配置 Cloudflare Workers secrets
- **CI/CD**: 推送代码自动触发部署

### 手动部署
- **设置脚本**: `scripts/setup-secrets.js`
- **交互式配置**: 引导用户设置必要的 secrets
- **一键部署**: `npm run setup && npm run deploy`

## 📱 功能特性对比

| 功能 | 直接发送链接 | Inline 模式 |
|------|-------------|-------------|
| 原文链接 | ✅ | ✅ |
| Telegraph 预览 | ✅ | ✅ |
| AI 智能总结 | ✅ | ❌ |
| 响应速度 | 较慢 | 快速 |
| 使用场景 | 深度阅读 | 快速分享 |

## 🔐 环境配置

### 必需的 Secrets
- `TELEGRAM_BOT_TOKEN`: Telegram Bot Token
- `DEEPSEEK_API_KEY`: DeepSeek API 密钥（已预设）

### 可选的 Secrets
- `TELEGRAPH_ACCESS_TOKEN`: Telegraph Token（自动创建）

## 🛠️ 开发工具

### NPM 脚本
- `npm run dev`: 本地开发
- `npm run deploy`: 部署到 Cloudflare
- `npm run setup`: 交互式设置
- `npm run logs`: 查看实时日志
- `npm run validate`: 验证代码语法

### 调试功能
- **详细日志**: 完整的处理流程日志
- **错误追踪**: 详细的错误信息和堆栈
- **性能监控**: 处理时间和成功率统计

---

**项目架构简洁高效，支持快速部署和智能文章处理！** 🚀