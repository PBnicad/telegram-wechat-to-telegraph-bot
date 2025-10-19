#!/usr/bin/env node

/**
 * 自动设置和部署脚本
 * 从环境变量读取配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

console.log('🚀 开始设置 Telegram 微信公众号转 Telegraph Bot...\n');

async function setup() {
    try {
        // 1. 检查必要工具
        console.log('📋 检查必要工具...');
        try {
            execSync('node --version', { stdio: 'pipe' });
            execSync('npm --version', { stdio: 'pipe' });
            console.log('✅ Node.js 和 npm 已安装');
        } catch (error) {
            console.error('❌ 错误: 需要安装 Node.js 和 npm');
            console.log('请从 https://nodejs.org 下载安装');
            process.exit(1);
        }

        // 2. 安装依赖
        console.log('\n📦 安装项目依赖...');
        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ 依赖安装完成');
        } catch (error) {
            console.error('❌ 依赖安装失败');
            process.exit(1);
        }

        // 3. 检查并安装 Wrangler
        console.log('\n🔧 检查 Wrangler CLI...');
        try {
            execSync('wrangler --version', { stdio: 'pipe' });
            console.log('✅ Wrangler CLI 已安装');
        } catch (error) {
            console.log('📦 安装 Wrangler CLI...');
            try {
                execSync('npm install -g wrangler', { stdio: 'inherit' });
                console.log('✅ Wrangler CLI 安装完成');
            } catch (installError) {
                console.error('❌ Wrangler CLI 安装失败');
                process.exit(1);
            }
        }

        // 4. 检查 Cloudflare 登录状态
        console.log('\n🔐 检查 Cloudflare 账户...');
        try {
            const authInfo = execSync('wrangler whoami', { encoding: 'utf8' });
            console.log('✅ 已登录 Cloudflare 账户');
        } catch (error) {
            console.log('🔑 需要登录 Cloudflare...');
            console.log('请运行以下命令登录:');
            console.log('npx wrangler auth login');
            console.log('然后重新运行此脚本');
            process.exit(1);
        }

        // 5. 创建数据库
        console.log('\n🗄️ 配置数据库...');
        try {
            const dbList = execSync('wrangler d1 list', { encoding: 'utf8' });
            if (dbList.includes('wechat-bot-db')) {
                console.log('✅ 数据库已存在');
            } else {
                console.log('📋 创建新数据库...');
                const createResult = execSync('wrangler d1 create wechat-bot-db', { encoding: 'utf8' });
                console.log('✅ 数据库创建成功');

                // 提取 database_id
                const dbIdMatch = createResult.match(/database_id = "([^"]+)"/);
                if (dbIdMatch) {
                    const dbId = dbIdMatch[1];
                    console.log(`📝 数据库 ID: ${dbId}`);

                    // 更新 wrangler.toml
                    await updateWranglerConfig(dbId);
                }
            }
        } catch (error) {
            console.error('❌ 数据库配置失败');
            console.error(error.message);
            process.exit(1);
        }

        // 6. 执行数据库迁移
        console.log('\n🔄 执行数据库迁移...');
        try {
            execSync('wrangler d1 migrations apply wechat-bot-db --remote', { stdio: 'inherit' });
            console.log('✅ 数据库迁移完成');
        } catch (error) {
            console.error('❌ 数据库迁移失败');
            process.exit(1);
        }

        // 7. 设置环境变量 (secrets)
        console.log('\n🔐 设置环境变量...');
        try {
            // 设置 Telegram Bot Token
            console.log('🤖 设置 Telegram Bot Token...');
            execSync(`echo "${BOT_TOKEN}" | wrangler secret put TELEGRAM_BOT_TOKEN`, { stdio: 'pipe' });

            // 设置管理员 API Key
            console.log('🔑 设置管理员 API Key...');
            execSync(`echo "${ADMIN_API_KEY}" | wrangler secret put ADMIN_API_KEY`, { stdio: 'pipe' });

            console.log('✅ 环境变量设置完成');
        } catch (error) {
            console.error('❌ 环境变量设置失败');
            console.error(error.message);
            process.exit(1);
        }

        // 8. 部署到 Cloudflare Workers
        console.log('\n🚀 部署到 Cloudflare Workers...');
        try {
            const deployResult = execSync('wrangler deploy', { encoding: 'utf8' });
            console.log('✅ 部署成功!');

            // 提取 Workers URL
            const urlMatch = deployResult.match(/https:\/\/[^ \n]*\.workers\.dev/);
            if (urlMatch) {
                const workerUrl = urlMatch[0];
                console.log(`🌐 Workers URL: ${workerUrl}`);

                // 9. 设置 Webhook
                console.log('\n🔗 设置 Telegram Bot Webhook...');
                await setWebhook(workerUrl);

                // 10. 显示完成信息
                showCompletionInfo(workerUrl);
            }
        } catch (error) {
            console.error('❌ 部署失败');
            console.error(error.message);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ 设置过程中发生错误:', error.message);
        process.exit(1);
    }
}

async function updateWranglerConfig(dbId) {
    try {
        const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
        let content = fs.readFileSync(wranglerPath, 'utf8');

        // 替换 database_id
        content = content.replace(
            /database_id = "your-database-id-here"/,
            `database_id = "${dbId}"`
        );

        fs.writeFileSync(wranglerPath, content);
        console.log('✅ wrangler.toml 配置已更新');
    } catch (error) {
        console.error('❌ 更新配置文件失败:', error.message);
        throw error;
    }
}

async function setWebhook(workerUrl) {
    const https = require('https');
    const webhookUrl = `${workerUrl}`;

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ url: webhookUrl });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/setWebhook`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.ok) {
                        console.log('✅ Webhook 设置成功!');
                        resolve();
                    } else {
                        console.error('❌ Webhook 设置失败:', result.description);
                        reject(new Error(result.description));
                    }
                } catch (error) {
                    console.error('❌ 解析 Webhook 响应失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 设置 Webhook 时发生错误:', error.message);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

function showCompletionInfo(workerUrl) {
    console.log('\n🎉 部署完成!\n');
    console.log('📋 重要信息:');
    console.log(`🤖 Bot Token: ${BOT_TOKEN}`);
    console.log(`🌐 Workers URL: ${workerUrl}`);
    console.log(`🔑 管理员 API Key: ${ADMIN_API_KEY}`);
    console.log(`📊 管理面板: ${workerUrl}/admin/stats`);
    console.log('\n📖 使用说明:');
    console.log('1. 在 Telegram 中搜索您的机器人');
    console.log('2. 发送 /start 开始使用');
    console.log('3. 发送微信公众号文章链接进行转换');
    console.log('4. 使用 /addchannel 添加频道');
    console.log('\n🔧 管理命令:');
    console.log(`curl -H "X-API-Key: ${ADMIN_API_KEY}" ${workerUrl}/admin/stats`);
    console.log(`curl -H "X-API-Key: ${ADMIN_API_KEY}" ${workerUrl}/admin/health`);
    console.log('\n🎊 机器人已就绪，可以开始使用了!');
}

// 运行设置
setup().catch(console.error);