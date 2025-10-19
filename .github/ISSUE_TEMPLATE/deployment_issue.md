---
name: GitHub Actions 部署问题
about: GitHub Actions 自动部署遇到问题
title: '[Deployment] '
labels: 'deployment'
assignees: ''

---

## 🚀 部署问题描述

请详细描述您在 GitHub Actions 部署过程中遇到的问题：

### 基本信息

- **部署方式**: GitHub Actions 自动部署
- **目标环境**: production / development / preview
- **仓库地址**: [您的 fork 仓库链接]
- **部署时间**:

### 问题详情

#### 1. 问题类型
- [ ] Secrets 设置问题
- [ ] Cloudflare API Token 问题
- [ ] Telegram Bot Token 问题
- [ ] 数据库创建/迁移问题
- [ ] 部署失败
- [ ] Webhook 设置失败
- [ ] 其他问题（请说明）

#### 2. 错误信息
请提供完整的错误信息（可以从 GitHub Actions 日志中复制）：

```
粘贴完整的错误日志
```

#### 3. 配置信息
**GitHub Secrets 设置情况**：
- `CLOUDFLARE_API_TOKEN`: ✅ 已设置 / ❌ 未设置
- `TELEGRAM_BOT_TOKEN`: ✅ 已设置 / ❌ 未设置
- `SUPER_ADMIN_ID`: ✅ 已设置 / ❌ 未设置
- `ADMIN_API_KEY`: ✅ 已设置 / ❌ 未设置（可选）
- `TELEGRAPH_ACCESS_TOKEN`: ✅ 已设置 / ❌ 未设置（可选）

**Cloudflare API Token 权限**：
- Account: Account Settings: Read ✅ / ❌
- Zone: Zone: Read ✅ / ❌
- Zone: Zone Settings: Edit ✅ / ❌
- Zone: Page Rules: Edit ✅ / ❌

#### 4. 尝试过的解决方法
请列出您已经尝试过的解决方法：

## 📋 环境信息

- **操作系统**:
- **GitHub 账户**:
- **Cloudflare 账户状态**: Workers ✅ / ❌, D1 ✅ / ❌
- **机器人状态**: 已创建 ✅ / ❌, Bot Token 有效 ✅ / ❌

## 🔍 调试信息

请提供以下信息（如果可获取）：

1. **GitHub Actions 运行链接**:
2. **部署日志摘要**:
3. **Workers URL**（如果部署成功）:
4. **机器人用户名**:

## 💡 预期结果

请描述您期望的正常部署结果：

## 📸 截图（可选）

如果有相关的截图，请上传：

## 🆘 额外信息

任何其他可能有助于解决问题的信息：

---

### 提交前检查

- [ ] 我已经检查了现有的 Issues，确认这不是重复问题
- [ ] 我已经阅读了 [GitHub Actions 部署指南](../GITHUB_DEPLOYMENT.md)
- [ ] 我已经尝试了文档中的故障排除步骤
- [ ] 我提供了足够的详细信息以便复现问题

感谢您的反馈！我们会尽快帮助您解决问题。