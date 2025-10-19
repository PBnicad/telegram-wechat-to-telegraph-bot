#!/usr/bin/env node

/**
 * GitHub Actions 部署检查脚本
 * 检查是否已正确设置 GitHub Actions 部署所需的所有配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 GitHub Actions 部署检查工具\n');

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

function checkRequiredFiles() {
    console.log('📁 检查必需文件...');

    const requiredFiles = [
        '.github/workflows/deploy.yml',
        'scripts/deploy-github.js',
        'scripts/set-github-secrets.js',
        'package.json',
        'wrangler.toml',
        'src/index.js',
        'schema.sql',
        'GITHUB_DEPLOYMENT.md'
    ];

    let allFilesExist = true;

    requiredFiles.forEach(file => {
        if (checkFileExists(file)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} (缺失)`);
            allFilesExist = false;
        }
    });

    if (allFilesExist) {
        console.log('\n✅ 所有必需文件都存在');
    } else {
        console.log('\n❌ 缺少必需文件，请检查项目完整性');
    }

    return allFilesExist;
}

function checkWorkflowConfiguration() {
    console.log('\n🔧 检查 GitHub Actions 工作流配置...');

    try {
        const workflowPath = '.github/workflows/deploy.yml';
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');

        const requiredElements = [
            'name: Deploy to Cloudflare Workers',
            'on:', 'push:', 'branches: [ main, master ]',
            'jobs:', 'pre-check:', 'database-migration:', 'deploy:',
            'uses: cloudflare/wrangler-action@v3',
            'CLOUDFLARE_API_TOKEN', 'TELEGRAM_BOT_TOKEN', 'SUPER_ADMIN_ID'
        ];

        let allElementsFound = true;

        requiredElements.forEach(element => {
            if (workflowContent.includes(element)) {
                console.log(`✅ 工作流包含: ${element}`);
            } else {
                console.log(`❌ 工作流缺少: ${element}`);
                allElementsFound = false;
            }
        });

        if (allElementsFound) {
            console.log('\n✅ GitHub Actions 工作流配置正确');
        } else {
            console.log('\n❌ 工作流配置不完整');
        }

        return allElementsFound;
    } catch (error) {
        console.error('❌ 无法读取工作流文件:', error.message);
        return false;
    }
}

function checkPackageJson() {
    console.log('\n📦 检查 package.json 配置...');

    try {
        const packagePath = 'package.json';
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        const requiredScripts = [
            'deploy:github',
            'secrets:github',
            'lint:check'
        ];

        let scriptsFound = true;

        requiredScripts.forEach(script => {
            if (packageContent.scripts && packageContent.scripts[script]) {
                console.log(`✅ npm script: ${script}`);
            } else {
                console.log(`❌ npm script 缺失: ${script}`);
                scriptsFound = false;
            }
        });

        if (scriptsFound) {
            console.log('\n✅ package.json 配置正确');
        } else {
            console.log('\n❌ package.json 配置不完整');
        }

        return scriptsFound;
    } catch (error) {
        console.error('❌ 无法读取 package.json:', error.message);
        return false;
    }
}

function printSetupInstructions() {
    console.log('\n📋 GitHub Actions 部署设置步骤:\n');

    console.log('步骤 1: Fork 本仓库');
    console.log('   1. 访问本仓库页面');
    console.log('   2. 点击右上角的 "Fork" 按钮');
    console.log('   3. 选择您的 GitHub 账户');
    console.log('');

    console.log('步骤 2: 设置 GitHub Secrets');
    console.log('   1. 进入您 fork 的仓库');
    console.log('   2. 点击 Settings → Secrets and variables → Actions');
    console.log('   3. 添加以下必需的 Secrets:');
    console.log('');
    console.log('   📋 必需的 Secrets:');
    console.log('   - CLOUDFLARE_API_TOKEN');
    console.log('     获取方式: https://dash.cloudflare.com/profile/api-tokens');
    console.log('     权限: Zone:Read, Zone Settings:Edit, Account Settings:Read');
    console.log('');
    console.log('   - TELEGRAM_BOT_TOKEN');
    console.log('     获取方式: 与 @BotFather 对话');
    console.log('     格式: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz');
    console.log('');
    console.log('   - SUPER_ADMIN_ID');
    console.log('     获取方式: 与 @userinfobot 对话');
    console.log('     格式: 数字ID (如: 123456789)');
    console.log('');

    console.log('步骤 3: 可选的 Secrets');
    console.log('   - ADMIN_API_KEY: 管理面板 API 密钥');
    console.log('   - TELEGRAPH_ACCESS_TOKEN: Telegraph 访问令牌');
    console.log('');

    console.log('步骤 4: 触发部署');
    console.log('   方法 1: 推送代码到主分支');
    console.log('     git push origin main');
    console.log('');
    console.log('   方法 2: 手动触发');
    console.log('     1. 进入 Actions 页面');
    console.log('     2. 选择 "Deploy to Cloudflare Workers"');
    console.log('     3. 点击 "Run workflow"');
    console.log('     4. 选择环境并运行');
    console.log('');

    console.log('步骤 5: 监控部署');
    console.log('   1. 在 Actions 页面查看部署进度');
    console.log('   2. 检查部署摘要中的 URL 和信息');
    console.log('   3. 测试机器人功能');
    console.log('');
}

function printNextSteps() {
    console.log('🎯 部署成功后的下一步:\n');

    console.log('1. 🤖 测试机器人');
    console.log('   - 在 Telegram 中搜索您的机器人');
    console.log('   - 发送 /start 开始使用');
    console.log('   - 发送微信公众号文章链接测试转换功能');
    console.log('');

    console.log('2. 📊 查看统计信息');
    console.log('   - 管理面板: https://your-worker-url.workers.dev/admin/stats');
    console.log('   - 健康检查: https://your-worker-url.workers.dev/health');
    console.log('');

    console.log('3. 🔧 配置频道');
    console.log('   - 使用 /addchannel 添加频道');
    console.log('   - 将机器人添加到频道中');
    console.log('   - 测试文章发送功能');
    console.log('');

    console.log('4. 📚 了解更多');
    console.log('   - 阅读完整文档: README.md');
    console.log('   - 查看部署指南: GITHUB_DEPLOYMENT.md');
    console.log('   - 检查故障排除: DEPLOY.md');
    console.log('');
}

function runLocalCheck() {
    console.log('🔧 运行本地配置检查...\n');

    try {
        // 检查是否有 GitHub CLI
        execSync('gh --version', { stdio: 'pipe' });
        console.log('✅ GitHub CLI 已安装');

        // 检查是否已登录
        try {
            const authStatus = execSync('gh auth status', { encoding: 'utf8' });
            console.log('✅ GitHub CLI 已登录');
        } catch (error) {
            console.log('⚠️ GitHub CLI 未登录');
            console.log('   运行: gh auth login');
        }
    } catch (error) {
        console.log('⚠️ GitHub CLI 未安装');
        console.log('   安装: https://cli.github.com/manual/installation');
    }

    console.log('');
}

function main() {
    console.log('🚀 开始 GitHub Actions 部署检查...\n');

    const filesOk = checkRequiredFiles();
    const workflowOk = checkWorkflowConfiguration();
    const packageOk = checkPackageJson();

    runLocalCheck();

    console.log('\n' + '='.repeat(50));

    if (filesOk && workflowOk && packageOk) {
        console.log('✅ 项目已准备好进行 GitHub Actions 部署!');
        printSetupInstructions();
        printNextSteps();
    } else {
        console.log('❌ 项目配置不完整，请修复上述问题后再进行部署');
        console.log('\n💡 建议:');
        console.log('1. 确保所有必需文件存在');
        console.log('2. 检查工作流配置是否正确');
        console.log('3. 更新 package.json 脚本');
        console.log('4. 重新运行此检查脚本');
    }

    console.log('\n📖 详细文档: GITHUB_DEPLOYMENT.md');
    console.log('🆘 遇到问题? 请查看 Issues 或创建新的 Issue');
}

// 运行检查
main();