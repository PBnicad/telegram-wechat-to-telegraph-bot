#!/bin/bash

# Telegram 微信公众号转 Telegraph Bot 部署脚本

set -e

echo "🚀 开始部署 Telegram 微信公众号转 Telegraph Bot..."

# 检查必要的工具
if ! command -v npx &> /dev/null; then
    echo "❌ 错误: 需要安装 Node.js 和 npm"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 Wrangler CLI..."
    npm install -g wrangler
fi

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install

# 检查环境变量
echo "🔍 检查环境变量..."

read -p "请输入 Telegram Bot Token: " BOT_TOKEN
if [ -z "$BOT_TOKEN" ]; then
    echo "❌ 错误: Telegram Bot Token 不能为空"
    exit 1
fi

read -p "请输入管理员 API Key (留空自动生成): " ADMIN_API_KEY
if [ -z "$ADMIN_API_KEY" ]; then
    ADMIN_API_KEY=$(openssl rand -hex 16)
    echo "🔑 生成的管理员 API Key: $ADMIN_API_KEY"
fi

# 创建或更新数据库
echo "🗄️ 配置数据库..."

# 检查数据库是否已存在
if ! npx wrangler d1 list | grep -q "wechat-bot-db"; then
    echo "📋 创建新数据库..."
    npx wrangler d1 create wechat-bot-db
    echo "⚠️  请复制上面的 database_id 并更新 wrangler.toml 文件"
    read -p "按回车键继续..."
fi

# 执行数据库迁移
echo "🔄 执行数据库迁移..."
npx wrangler d1 migrations apply wechat-bot-db --local

# 设置 secrets
echo "🔐 设置环境变量..."
echo $BOT_TOKEN | npx wrangler secret put TELEGRAM_BOT_TOKEN

# 设置 Telegraph Access Token (可选)
read -p "请输入 Telegraph Access Token (可选，留空则自动创建): " TELEGRAPH_TOKEN
if [ ! -z "$TELEGRAPH_TOKEN" ]; then
    echo $TELEGRAPH_TOKEN | npx wrangler secret put TELEGRAPH_ACCESS_TOKEN
fi

echo $ADMIN_API_KEY | npx wrangler secret put ADMIN_API_KEY

# 部署到 Cloudflare Workers
echo "🚀 部署到 Cloudflare Workers..."
npx wrangler deploy

# 获取 Workers URL
WORKER_URL=$(npx wrangler whoami 2>/dev/null | grep -o 'https://[^ ]*\.workers\.dev' | head -1)
if [ -z "$WORKER_URL" ]; then
    echo "⚠️  无法自动获取 Workers URL，请手动查看部署结果"
    read -p "请输入您的 Workers URL: " WORKER_URL
fi

# 设置 Webhook
echo "🔗 设置 Telegram Bot Webhook..."
WEBHOOK_URL="${WORKER_URL}"

curl_response=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"${WEBHOOK_URL}\"}")

if echo "$curl_response" | grep -q '"ok":true'; then
    echo "✅ Webhook 设置成功!"
else
    echo "❌ Webhook 设置失败:"
    echo "$curl_response"
fi

# 测试部署
echo "🧪 测试部署..."
HEALTH_RESPONSE=$(curl -s "${WORKER_URL}/health" || echo "")

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ 健康检查通过!"
else
    echo "⚠️  健康检查失败，请检查配置"
fi

# 输出重要信息
echo ""
echo "🎉 部署完成!"
echo ""
echo "📋 重要信息:"
echo "🤖 机器人用户名: 请在 Telegram 中与 @BotFather 确认"
echo "🌐 Workers URL: ${WORKER_URL}"
echo "🔑 管理员 API Key: ${ADMIN_API_KEY}"
echo "📊 管理面板: ${WORKER_URL}/admin/stats (需要 API Key)"
echo ""
echo "📖 使用说明:"
echo "1. 在 Telegram 中搜索您的机器人"
echo "2. 发送 /start 开始使用"
echo "3. 发送微信公众号文章链接进行转换"
echo "4. 使用 /addchannel 添加频道"
echo ""
echo "🔧 管理命令:"
echo "curl -H \"X-API-Key: ${ADMIN_API_KEY}\" ${WORKER_URL}/admin/stats"
echo "curl -H \"X-API-Key: ${ADMIN_API_KEY}\" ${WORKER_URL}/admin/health"
echo ""

# 测试机器人
read -p "是否要测试机器人? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📱 请在 Telegram 中向您的机器人发送 /start 命令进行测试"
fi

echo "🎊 部署脚本执行完成!"