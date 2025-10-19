#!/usr/bin/env node

/**
 * GitHub Actions 部署脚本
 * 用于自动化CI/CD流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 GitHub Actions 部署脚本启动...\n');

async function deploy() {
    try {
        // 1. 检查必要的环境变量
        console.log('🔍 检查环境变量...');
        const requiredEnvVars = [
            'CLOUDFLARE_API_TOKEN',
            'TELEGRAM_BOT_TOKEN',
            'SUPER_ADMIN_ID'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            console.error('❌ 缺少必要的环境变量:', missingVars.join(', '));
            process.exit(1);
        }
        console.log('✅ 环境变量检查通过');

        // 2. 检查工作目录
        console.log('\n📁 检查项目文件...');
        const requiredFiles = [
            'package.json',
            'wrangler.toml',
            'src/index.js',
            'schema.sql'
        ];

        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        if (missingFiles.length > 0) {
            console.error('❌ 缺少必要文件:', missingFiles.join(', '));
            process.exit(1);
        }
        console.log('✅ 项目文件检查通过');

        // 3. 验证 Wrangler 配置
        console.log('\n🔧 验证 Wrangler 配置...');
        try {
            execSync('npx wrangler whoami', { stdio: 'pipe' });
            console.log('✅ Cloudflare 认证成功');
        } catch (error) {
            console.error('❌ Cloudflare 认证失败，请检查 CLOUDFLARE_API_TOKEN');
            process.exit(1);
        }

        // 4. 创建或更新数据库（如果需要）
        console.log('\n🗄️ 配置数据库...');
        try {
            const dbList = execSync('npx wrangler d1 list --format=json', { encoding: 'utf8' });
            const databases = JSON.parse(dbList);

            const targetDb = databases.find(db => db.name === 'wechat-bot-db');
            if (!targetDb) {
                console.log('📋 创建数据库...');
                execSync('npx wrangler d1 create wechat-bot-db', { stdio: 'inherit' });
                console.log('✅ 数据库创建成功');
            } else {
                console.log('✅ 数据库已存在');
            }
        } catch (error) {
            console.error('❌ 数据库配置失败:', error.message);
            // 不要退出，数据库可能已经存在
        }

        // 5. 执行数据库迁移
        console.log('\n🔄 执行数据库迁移...');
        try {
            execSync('npx wrangler d1 execute wechat-bot-db --file=schema.sql --remote', { stdio: 'inherit' });
            console.log('✅ 数据库迁移完成');
        } catch (error) {
            console.error('⚠️ 数据库迁移失败或已存在:', error.message);
            // 继续部署，因为迁移可能已经应用过
        }

        // 6. 设置 Wrangler secrets
        console.log('\n🔐 设置 Wrangler secrets...');
        const secrets = {
            'TELEGRAM_BOT_TOKEN': process.env.TELEGRAM_BOT_TOKEN,
            'SUPER_ADMIN_ID': process.env.SUPER_ADMIN_ID,
            'ADMIN_API_KEY': process.env.ADMIN_API_KEY || generateApiKey(),
            'TELEGRAPH_ACCESS_TOKEN': process.env.TELEGRAPH_ACCESS_TOKEN || ''
        };

        for (const [key, value] of Object.entries(secrets)) {
            if (value) {
                try {
                    console.log(`🔑 设置 ${key}...`);
                    execSync(`echo "${value}" | npx wrangler secret put ${key}`, { stdio: 'pipe' });
                    console.log(`✅ ${key} 设置成功`);
                } catch (error) {
                    console.error(`❌ ${key} 设置失败:`, error.message);
                    if (key === 'TELEGRAM_BOT_TOKEN' || key === 'SUPER_ADMIN_ID') {
                        process.exit(1); // 必需的secrets失败则退出
                    }
                }
            }
        }

        // 7. 部署到 Cloudflare Workers
        console.log('\n🚀 开始部署...');
        const environment = process.env.ENVIRONMENT || 'production';
        console.log(`📦 部署到环境: ${environment}`);

        try {
            const deployCommand = environment === 'development'
                ? 'npx wrangler deploy --env development'
                : 'npx wrangler deploy';

            const deployResult = execSync(deployCommand, { encoding: 'utf8' });
            console.log('✅ 部署成功!');

            // 提取 Workers URL
            const urlMatch = deployResult.match(/https:\/\/[^ \n]*\.workers\.dev/);
            if (urlMatch) {
                const workerUrl = urlMatch[0];
                console.log(`🌐 Workers URL: ${workerUrl}`);

                // 8. 设置 Webhook（仅在生产环境）
                if (environment === 'production') {
                    console.log('\n🔗 设置 Telegram Webhook...');
                    await setWebhook(workerUrl, process.env.TELEGRAM_BOT_TOKEN);
                }

                // 9. 输出部署信息
                showDeploymentInfo(workerUrl, environment);

                // 设置 GitHub Actions 输出
                if (process.env.GITHUB_OUTPUT) {
                    fs.appendFileSync(process.env.GITHUB_OUTPUT, `url=${workerUrl}\n`);
                    fs.appendFileSync(process.env.GITHUB_OUTPUT, `environment=${environment}\n`);
                }
            }
        } catch (error) {
            console.error('❌ 部署失败:', error.message);
            process.exit(1);
        }

        console.log('\n🎉 GitHub Actions 部署完成!');

    } catch (error) {
        console.error('❌ 部署过程中发生错误:', error.message);
        process.exit(1);
    }
}

function generateApiKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

async function setWebhook(workerUrl, botToken) {
    const https = require('https');
    const webhookUrl = `${workerUrl}`;

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            url: webhookUrl,
            drop_pending_updates: true
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${botToken}/setWebhook`,
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

function showDeploymentInfo(workerUrl, environment) {
    console.log('\n📊 部署信息:');
    console.log(`🌐 Workers URL: ${workerUrl}`);
    console.log(`🏷️ 环境: ${environment}`);
    console.log(`📊 健康检查: ${workerUrl}/health`);
    console.log(`🔧 管理面板: ${workerUrl}/admin/stats`);

    if (environment === 'production') {
        console.log('\n🎯 生产环境已就绪!');
        console.log('🤖 机器人可以接收消息了');
    } else {
        console.log('\n🔍 测试环境部署完成');
        console.log('💡 记得手动设置 Webhook 进行测试');
    }
}

// 运行部署
deploy().catch(console.error);