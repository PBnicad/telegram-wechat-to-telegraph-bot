# 项目总览（精简版）

## 项目简介

这是一个运行在 Cloudflare Workers 上的 Telegram 机器人，主要功能是将微信公众号文章转换为 Telegraph 页面。当前版本仅专注于文章解析与转换，不包含频道管理、数据库或管理员接口。

## 核心特性

- 智能文章转换：解析微信文章并创建 Telegraph 页面
- 简洁交互：发送链接即可使用
- 边缘部署：Cloudflare Workers 全球网络，响应迅速

## 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │ ◄─►│  Cloudflare     │ ◄─►│   Telegraph     │
│                 │    │   Workers       │    │     API         │
│  - 消息处理     │    │  - 入口路由     │    │  - 页面创建     │
│  - 用户交互     │    │  - 文章解析     │    │  - 内容托管     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈

- 运行环境：Cloudflare Workers
- 内容解析：自研 WeChat Parser
- API 集成：Telegram Bot API、Telegraph API

## 项目结构

```
telegram-wechat-bot/
├── package.json          # 项目依赖与脚本
├── wrangler.toml         # Workers 配置
├── README.md             # 主文档
├── QUICK_START.md        # 快速开始
├── DEPLOY.md             # 部署说明
└── src/
    ├── index.js              # 入口与路由
    ├── handlers/
    │   ├── message.js        # 文本消息处理
    │   └── callback.js       # 回调处理（转换与取消）
    ├── services/
    │   ├── telegram.js       # Telegram 服务
    │   ├── telegraph.js      # Telegraph 服务
    │   └── wechat-parser.js  # 微信文章解析器
    └── utils/
        ├── constants.js      # 常量
        ├── helpers.js        # 辅助函数
        └── wechat-utils.js   # 微信工具
```

## 文章转换流程

1. 用户发送微信文章链接（`https://mp.weixin.qq.com/s/...`）
2. 验证与抓取文章内容
3. 解析标题、作者与正文
4. 通过 Telegraph API 创建页面
5. 返回 Telegraph 链接给用户

## 使用指南

- 基本命令：`/start`、`/help`
- 直接发送文章链接完成转换

## 安全与稳定

- 输入校验：严格校验文章链接格式
- 错误处理：统一的异常捕获与用户提示
- 观测性：开启 Workers 日志，便于定位问题

## 说明与历史

- 已移除：频道管理、数据库（D1）、管理员 API
- 专注：文章解析与页面创建，降低维护复杂度

## 未来规划

- 更强的解析兼容性与清洗规则
- 转换结果的可视化摘要
- 多语言与国际化支持

现在可以参考 README 与 QUICK_START 开始使用。🚀