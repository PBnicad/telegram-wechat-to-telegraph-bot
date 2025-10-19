# 部署说明

## 🚀 部署方式

### 方式一：GitHub Actions 自动部署（推荐 ⭐）

最简单、最可靠的部署方式，特别适合新手：

**只需 3 步：**
1. **Fork 本仓库**
2. **设置 3 个 GitHub Secrets**：
   - `CLOUDFLARE_API_TOKEN`
   - `TELEGRAM_BOT_TOKEN`
   - `SUPER_ADMIN_ID`
3. **推送代码触发自动部署**

📖 **详细指南**: [GitHub Actions 部署指南](GITHUB_DEPLOYMENT.md)

**优势：**
- ✅ 无需本地安装 Node.js 或 Wrangler
- ✅ 自动处理数据库创建和迁移
- ✅ 自动设置 Webhook
- ✅ 包含安全扫描和健康检查
- ✅ 支持多环境部署（生产/开发/预览）

### 方式二：手动部署

适合需要完全控制部署过程的用户：

## 🎯 快速部署 (手动方式)

```bash
# 1. 安装依赖
npm install

# 2. 登录 Cloudflare (首次部署需要)
npx wrangler auth login

# 3. 一键自动部署
npm run setup
```

## 📋 配置信息

- **数据库名称**: `wechat-bot-db`
- **Bot Token**: 需要从 @BotFather 获取
- **管理员 API Key**: 需要自行设置

## 🔧 手动部署步骤

如果自动脚本失败，可以手动执行：

### 1. 测试 Bot 连接
```bash
npm run test
```

### 2. 设置 Secrets
```bash
npm run secrets:set
```

### 3. 创建数据库
```bash
npm run d1:create
# 复制返回的 database_id 到 wrangler.toml
```

### 4. 执行数据库迁移
```bash
npm run d1:migrations
```

### 5. 部署
```bash
npm run deploy
```

### 6. 设置 Webhook
```bash
# 替换 YOUR_WORKER_URL 和 YOUR_BOT_TOKEN 为实际值
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR_WORKER_URL.workers.dev"}'
```

## 🎯 部署后测试

1. 在 Telegram 中找到您的机器人
2. 发送 `/start` 测试连接
3. 发送微信公众号文章链接测试功能

**测试链接示例:**
```
https://mp.weixin.qq.com/s/EXAMPLE
```

## 📞 管理功能

部署后可以访问管理端点：

- **健康检查**: `https://YOUR_WORKER_URL.workers.dev/health`
- **统计信息**: `https://YOUR_WORKER_URL.workers.dev/admin/stats`
- **API Key**: 需要设置管理员 API 密钥

使用方式:
```bash
curl -H "X-API-Key: YOUR_ADMIN_API_KEY" \
     https://YOUR_WORKER_URL.workers.dev/admin/stats
```

## ⚠️ 注意事项

1. 确保 Cloudflare 账户已激活 Workers 和 D1 服务
2. 部署过程中可能需要验证 Cloudflare 账户
3. 首次部署可能需要几分钟时间
4. 如果遇到网络问题，可以尝试使用代理或稍后重试

## 🔧 故障排除

### 常见问题

1. **Bot Token 无效**
   - 检查 Token 格式是否正确
   - 确认机器人没有被禁用

2. **Webhook 设置失败**
   - 确保 Workers URL 正确
   - 检查网络连接
   - 尝试手动设置 Webhook

3. **数据库问题**
   - 确认 D1 服务已启用
   - 检查 database_id 配置
   - 重新执行迁移

4. **部署失败**
   - 检查 Cloudflare 账户状态
   - 确认有足够的配额
   - 查看详细错误信息

### 获取帮助

如果遇到问题：

1. 查看部署日志: `npx wrangler tail`
2. 检查配置文件是否正确
3. 确认网络连接正常
4. 联系技术支持

## 🎉 部署成功后

您的机器人将具备以下功能：

✅ 自动转换微信公众号文章为 Telegraph 页面
✅ 支持多频道管理和消息发送
✅ 用户友好的按钮界面
✅ 完整的数据统计功能
✅ 管理员 API 接口

开始使用吧！🚀