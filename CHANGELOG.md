# 更新日志

本文档记录了项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 支持批量转换文章
- 添加文章分类和标签功能
- 支持自定义Telegraph模板
- 添加使用统计图表
- 支持多语言界面

## [1.0.0] - 2024-01-01

### 新增
- 🎉 初始版本发布
- ✅ 基本文章转换功能
  - 支持微信公众号文章链接解析
  - 自动提取标题、作者、内容和摘要
  - 转换为Telegraph格式
- 🤖 Telegram Bot 基础功能
  - `/start` - 开始使用
  - `/help` - 查看帮助信息
  - `/stats` - 查看使用统计
  - `/settings` - 个人设置
- 📱 频道管理功能
  - `/mychannels` - 查看绑定频道
  - `/addchannel` - 添加新频道
  - `/removechannel` - 移除频道绑定
- 🎨 用户界面和交互
  - 内联按钮支持
  - 频道选择界面
  - 确认对话框
- 🗄️ 数据持久化
  - Cloudflare D1 数据库支持
  - 用户、频道、文章数据存储
- 🔧 管理功能
  - 健康检查 API
  - 统计信息 API
  - Webhook 管理 API
- 📚 完整文档
  - README 使用说明
  - 部署脚本（Linux/macOS/Windows）
  - API 文档
- 🚀 部署工具
  - 自动化部署脚本
  - 环境配置
  - 数据库迁移

### 技术特性
- 🌐 基于 Cloudflare Workers 边缘计算
- 🔍 自定义爬虫（替代Crawlee）
- 📊 完整的错误处理和日志记录
- 🔒 API Key 认证保护
- 📱 响应式用户界面
- ⚡ 高性能全球部署

### 支持的功能
- 微信公众号文章解析
- Telegraph 页面创建
- 多频道管理和消息发送
- 用户数据持久化
- 实时统计信息
- 管理员 API 端点

---

## 版本说明

### 主版本 (Major)
当进行不兼容的 API 修改时

### 次版本 (Minor)
当添加功能时，且保持向后兼容

### 修订版本 (Patch)
当进行向下兼容的问题修复时

---

## 贡献指南

欢迎贡献代码和建议！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。