@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 开始部署 Telegram 微信公众号转 Telegraph Bot...
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 需要安装 Node.js
    echo 请从 https://nodejs.org 下载安装
    pause
    exit /b 1
)

REM 检查 Wrangler CLI
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo 📦 安装 Wrangler CLI...
    npm install -g wrangler
)

REM 安装项目依赖
echo 📦 安装项目依赖...
npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

REM 获取环境变量
echo 🔍 配置环境变量...
echo.

set /p BOT_TOKEN="请输入 Telegram Bot Token: "
if "!BOT_TOKEN!"=="" (
    echo ❌ 错误: Telegram Bot Token 不能为空
    pause
    exit /b 1
)

set /p ADMIN_API_KEY="请输入管理员 API Key (留空自动生成): "
if "!ADMIN_API_KEY!"=="" (
    REM 生成随机 API Key
    for /f "delims=" %%i in ('powershell -Command "Get-Random -Maximum 1000000000 | ForEach-Object { $_.ToString('x') }"') do set ADMIN_API_KEY=%%i
    echo 🔑 生成的管理员 API Key: !ADMIN_API_KEY!
)

REM 检查并创建数据库
echo 🗄️ 配置数据库...
npx wrangler d1 list | findstr "wechat-bot-db" >nul
if errorlevel 1 (
    echo 📋 创建新数据库...
    npx wrangler d1 create wechat-bot-db
    echo.
    echo ⚠️  请复制上面的 database_id 并更新 wrangler.toml 文件
    pause
)

REM 执行数据库迁移
echo 🔄 执行数据库迁移...
npx wrangler d1 migrations apply wechat-bot-db --local
if errorlevel 1 (
    echo ❌ 数据库迁移失败
    pause
    exit /b 1
)

REM 设置环境变量
echo 🔐 设置环境变量...
echo !BOT_TOKEN! | npx wrangler secret put TELEGRAM_BOT_TOKEN
if errorlevel 1 (
    echo ❌ 设置 Telegram Bot Token 失败
    pause
    exit /b 1
)

set /p TELEGRAPH_TOKEN="请输入 Telegraph Access Token (可选，留空则自动创建): "
if not "!TELEGRAPH_TOKEN!"=="" (
    echo !TELEGRAPH_TOKEN! | npx wrangler secret put TELEGRAPH_ACCESS_TOKEN
)

echo !ADMIN_API_KEY! | npx wrangler secret put ADMIN_API_KEY
if errorlevel 1 (
    echo ❌ 设置管理员 API Key 失败
    pause
    exit /b 1
)

REM 部署到 Cloudflare Workers
echo 🚀 部署到 Cloudflare Workers...
npx wrangler deploy
if errorlevel 1 (
    echo ❌ 部署失败
    pause
    exit /b 1
)

REM 获取 Workers URL (简化版本，实际使用中可能需要更复杂的解析)
echo 🔗 设置 Telegram Bot Webhook...
set /p WORKER_URL="请输入您的 Workers URL (例如: https://your-bot.your-subdomain.workers.dev): "
if "!WORKER_URL!"=="" (
    echo ❌ Workers URL 不能为空
    pause
    exit /b 1
)

REM 使用 PowerShell 设置 Webhook
powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://api.telegram.org/bot!BOT_TOKEN!/setWebhook' -Method Post -ContentType 'application/json' -Body ('{\"url\": \"!WORKER_URL!\"}' | ConvertTo-Json) -ErrorAction Stop; if ($response.ok) { Write-Host '✅ Webhook 设置成功!' } else { Write-Host '❌ Webhook 设置失败:'; $response } } catch { Write-Host '❌ Webhook 设置失败:'; $_.Exception.Message }"

REM 输出重要信息
echo.
echo 🎉 部署完成!
echo.
echo 📋 重要信息:
echo 🤖 机器人用户名: 请在 Telegram 中与 @BotFather 确认
echo 🌐 Workers URL: !WORKER_URL!
echo 🔑 管理员 API Key: !ADMIN_API_KEY!
echo 📊 管理面板: !WORKER_URL!/admin/stats (需要 API Key)
echo.
echo 📖 使用说明:
echo 1. 在 Telegram 中搜索您的机器人
echo 2. 发送 /start 开始使用
echo 3. 发送微信公众号文章链接进行转换
echo 4. 使用 /addchannel 添加频道
echo.
echo 🔧 管理命令:
echo curl -H "X-API-Key: !ADMIN_API_KEY!" !WORKER_URL!/admin/stats
echo curl -H "X-API-Key: !ADMIN_API_KEY!" !WORKER_URL!/admin/health
echo.

REM 测试机器人
set /p TEST_BOT="是否要测试机器人? (y/n): "
if /i "!TEST_BOT!"=="y" (
    echo 📱 请在 Telegram 中向您的机器人发送 /start 命令进行测试
)

echo.
echo 🎊 部署脚本执行完成!
echo.
pause