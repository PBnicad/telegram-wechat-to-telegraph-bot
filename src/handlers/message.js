/**
 * 消息处理器
 */
import { Messages, Commands } from '../utils/constants.js';
import { isValidUrl, isWechatArticle } from '../utils/helpers.js';

export class MessageHandler {
    constructor(db, telegramService, crawlerService, telegraphService) {
        this.db = db;
        this.telegram = telegramService;
        this.crawler = crawlerService;
        this.telegraph = telegraphService;
    }

    /**
     * 处理文本消息
     * @param {object} message Telegram消息对象
     * @returns {Promise<void>}
     */
    async handleTextMessage(message) {
        const { text, from, chat } = message;

        // 确保用户存在
        await this.ensureUserExists(from);

        // 处理命令
        if (text.startsWith('/')) {
            return await this.handleCommand(message);
        }

        // 处理URL
        if (isValidUrl(text)) {
            if (isWechatArticle(text)) {
                return await this.handleWechatUrl(message);
            } else {
                return await this.handleOtherUrl(message);
            }
        }

        // 默认消息处理
        return await this.handleDefaultMessage(message);
    }

    /**
     * 处理命令
     * @param {object} message Telegram消息对象
     * @returns {Promise<void>}
     */
    async handleCommand(message) {
        const { text, from, chat } = message;
        const command = text.toLowerCase().split(' ')[0];

        switch (command) {
            case Commands.START:
                return await this.handleStart(message);
            case Commands.HELP:
                return await this.handleHelp(message);
            case Commands.MYCHANNELS:
                return await this.handleMyChannels(message);
            case Commands.ADDCHANNEL:
                return await this.handleAddChannel(message);
            case Commands.REMOVECHANNEL:
                return await this.handleRemoveChannel(message);
            case Commands.STATS:
                return await this.handleStats(message);
            case Commands.SETTINGS:
                return await this.handleSettings(message);
            default:
                return await this.handleUnknownCommand(message);
        }
    }

    /**
     * 处理/start命令
     * @param {object} message
     */
    async handleStart(message) {
        const { chat } = message;
        await this.telegram.sendMessage(chat.id, Messages.WELCOME);
    }

    /**
     * 处理/help命令
     * @param {object} message
     */
    async handleHelp(message) {
        const { chat } = message;
        await this.telegram.sendMessage(chat.id, Messages.HELP);
    }

    /**
     * 处理/mychannels命令
     * @param {object} message
     */
    async handleMyChannels(message) {
        const { from, chat } = message;
        const channels = await this.db.getUserChannels(from.id);

        if (channels.length === 0) {
            await this.telegram.sendMessage(chat.id, Messages.NO_CHANNELS);
            return;
        }

        const channelList = channels.map((channel, index) => {
            return `${index + 1}. ${channel.title || '未命名频道'} (${channel.channel_id})`;
        }).join('\n');

        const responseText = `📋 您的频道列表：\n\n${channelList}`;
        await this.telegram.sendMessage(chat.id, responseText);
    }

    /**
     * 处理/addchannel命令
     * @param {object} message
     */
    async handleAddChannel(message) {
        const { chat, from } = message;

        // 检查是否在群组或频道中
        if (chat.type === 'private') {
            const instructions = `➕ 添加频道步骤：

1. 将我添加到要管理的频道中
2. 在频道中发送 /addchannel 命令
3. 我将自动注册该频道

注意：您需要在频道中具有管理员权限。`;

            await this.telegram.sendMessage(chat.id, instructions);
            return;
        }

        // 在频道中处理添加
        if (chat.type === 'channel' || chat.type === 'supergroup') {
            try {
                // 检查用户是否为管理员
                const isAdmin = await this.telegram.isChatAdmin(chat.id, from.id);
                if (!isAdmin) {
                    await this.telegram.sendMessage(chat.id, Messages.ADMIN_REQUIRED);
                    return;
                }

                // 创建或获取频道信息
                await this.db.createChannel(
                    chat.id,
                    chat.title || '未命名频道',
                    chat.username,
                    from.id
                );

                // 绑定用户到频道
                const channel = await this.db.getChannel(chat.id);
                if (channel) {
                    await this.db.bindUserToChannel(from.id, channel.id);
                    await this.telegram.sendMessage(chat.id, Messages.CHANNEL_ADDED);
                }

            } catch (error) {
                console.error('Error adding channel:', error);
                await this.telegram.sendMessage(chat.id, Messages.ERROR_OCCURRED);
            }
        }
    }

    /**
     * 处理/removechannel命令
     * @param {object} message
     */
    async handleRemoveChannel(message) {
        const { from, chat } = message;
        const channels = await this.db.getUserChannels(from.id);

        if (channels.length === 0) {
            await this.telegram.sendMessage(chat.id, Messages.NO_CHANNELS);
            return;
        }

        // 创建频道选择键盘
        const keyboard = channels.map(channel => [{
            text: channel.title || `Channel ${channel.channel_id}`,
            callback_data: `remove_channel:${channel.id}`
        }]);

        await this.telegram.sendMessageWithKeyboard(
            chat.id,
            '🗑️ 选择要移除的频道：',
            keyboard
        );
    }

    /**
     * 处理/stats命令
     * @param {object} message
     */
    async handleStats(message) {
        const { chat } = message;

        try {
            const stats = await this.db.getStats();
            const userStats = await this.db.getUserArticles(chat.id, 1);

            const statsText = `📊 机器人统计信息：

👥 总用户数：${stats.totalUsers}
📱 总频道数：${stats.totalChannels}
📄 总文章数：${stats.totalArticles}
📅 今日文章数：${stats.articlesToday}
📝 您的文章数：${userStats.results?.length || 0}`;

            await this.telegram.sendMessage(chat.id, statsText);
        } catch (error) {
            console.error('Error getting stats:', error);
            await this.telegram.sendMessage(chat.id, Messages.ERROR_OCCURRED);
        }
    }

    /**
     * 处理/settings命令
     * @param {object} message
     */
    async handleSettings(message) {
        const { from, chat } = message;

        try {
            const settings = await this.db.getUserSettings(from.id);
            const channels = await this.db.getUserChannels(from.id);

            const settingsText = `⚙️ 您的设置：

📱 默认频道：${settings?.default_channel_id ? '已设置' : '未设置'}
🔄 自动发送到频道：${settings?.auto_send_to_channel ? '开启' : '关闭'}
🌐 语言：${settings?.language || 'zh-CN'}

要修改设置，请使用以下命令：
/setdefaultchannel - 设置默认频道
/autosend - 切换自动发送设置`;

            await this.telegram.sendMessage(chat.id, settingsText);
        } catch (error) {
            console.error('Error getting settings:', error);
            await this.telegram.sendMessage(chat.id, Messages.ERROR_OCCURRED);
        }
    }

    /**
     * 处理未知命令
     * @param {object} message
     */
    async handleUnknownCommand(message) {
        const { chat, text } = message;
        await this.telegram.sendMessage(
            chat.id,
            `❌ 未知命令: ${text}\n\n使用 /help 查看可用命令。`
        );
    }

    /**
     * 处理微信公众号URL
     * @param {object} message
     */
    async handleWechatUrl(message) {
        const { from, chat } = message;
        const url = message.text.trim();

        try {
            // 发送处理中消息
            const processingMessage = await this.telegram.sendMessage(
                chat.id,
                Messages.PROCESSING
            );

            // 检查是否已经转换过
            const existingArticle = await this.db.getArticle(url);
            if (existingArticle) {
                await this.telegram.editMessageText(
                    chat.id,
                    processingMessage.message_id,
                    `✅ 文章已存在！

📄 标题：${existingArticle.title}

🔗 原文链接：
${url}

📖 Telegraph链接：
${existingArticle.telegraph_url}`
                );
                return;
            }

            // 获取文章内容
            const articleData = await this.crawler.fetchWechatArticle(url);

            // 创建Telegraph页面
            const telegraphPage = await this.telegraph.createPage(
                articleData.title,
                articleData.content,
                articleData.author
            );

            // 保存到数据库
            await this.db.createArticle(
                url,
                telegraphPage.url,
                articleData.title,
                articleData.author,
                articleData.summary,
                articleData.wordCount,
                from.id
            );

            // 构建响应消息
            const responseText = `✅ 转换成功！

📄 标题：${articleData.title}
✍️ 作者：${articleData.author}
📊 字数：${articleData.wordCount}
📝 摘要：${articleData.summary}

🔗 原文链接：
${url}

📖 Telegraph链接：
${telegraphPage.url}`;

            // 获取用户频道
            const channels = await this.db.getUserChannels(from.id);

            if (channels.length > 0) {
                // 创建频道选择键盘
                const keyboard = [
                    ...channels.map(channel => [{
                        text: `发送到 ${channel.title || '未命名频道'}`,
                        callback_data: `send_to_channel:${telegraphPage.url}:${channel.id}`
                    }]),
                    [{ text: '完成', callback_data: 'conversion_complete' }]
                ];

                await this.telegram.editMessageText(
                    chat.id,
                    processingMessage.message_id,
                    responseText,
                    { replyMarkup: { inline_keyboard: keyboard } }
                );
            } else {
                // 没有频道，直接显示结果
                await this.telegram.editMessageText(
                    chat.id,
                    processingMessage.message_id,
                    responseText
                );
            }

        } catch (error) {
            console.error('Error processing WeChat article:', error);
            await this.telegram.editMessageText(
                chat.id,
                processingMessage.message_id,
                Messages.CONVERSION_FAILED
            );
        }
    }

    /**
     * 处理其他URL
     * @param {object} message
     */
    async handleOtherUrl(message) {
        const { chat, text } = message;
        await this.telegram.sendMessage(
            chat.id,
            `🔗 收到链接：${text}\n\n目前只支持微信公众号文章链接。\n请发送以 mp.weixin.qq.com 开头的链接。`
        );
    }

    /**
     * 处理默认消息
     * @param {object} message
     */
    async handleDefaultMessage(message) {
        const { chat } = message;
        await this.telegram.sendMessage(
            chat.id,
            '👋 请发送微信公众号文章链接，或使用 /help 查看帮助信息。'
        );
    }

    /**
     * 确保用户存在于数据库中
     * @param {object} user Telegram用户对象
     */
    async ensureUserExists(user) {
        try {
            await this.db.createUser(
                user.id,
                user.username,
                user.first_name,
                user.last_name
            );
        } catch (error) {
            console.error('Error ensuring user exists:', error);
        }
    }
}