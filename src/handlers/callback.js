/**
 * 回调查询处理器
 */
import { Messages } from '../utils/constants.js';

export class CallbackHandler {
    constructor(db, telegramService, crawlerService, telegraphService) {
        this.db = db;
        this.telegram = telegramService;
        this.crawler = crawlerService;
        this.telegraph = telegraphService;
    }

    /**
     * 处理回调查询
     * @param {object} callbackQuery Telegram回调查询对象
     * @returns {Promise<void>}
     */
    async handleCallbackQuery(callbackQuery) {
        const { id, from, message, data } = callbackQuery;

        try {
            // 分割回调数据
            const [action, ...params] = data.split(':');

            switch (action) {
                case 'send_to_channel':
                    await this.handleSendToChannel(callbackQuery);
                    break;
                case 'remove_channel':
                    await this.handleRemoveChannel(callbackQuery);
                    break;
                case 'select_channel':
                    await this.handleSelectChannel(callbackQuery);
                    break;
                case 'conversion_complete':
                    await this.handleConversionComplete(callbackQuery);
                    break;
                case 'cancel':
                    await this.handleCancel(callbackQuery);
                    break;
                default:
                    await this.handleUnknownCallback(callbackQuery);
            }

        } catch (error) {
            console.error('Error handling callback query:', error);
            await this.telegram.answerCallbackQuery(
                id,
                '操作失败，请稍后重试',
                true
            );
        }
    }

    /**
     * 处理发送到频道
     * @param {object} callbackQuery
     */
    async handleSendToChannel(callbackQuery) {
        const { id, from, message } = callbackQuery;
        const [_, telegraphUrl, channelId] = callbackQuery.data.split(':');

        try {
            // 获取频道信息
            const channel = await this.getChannelById(channelId);
            if (!channel) {
                await this.telegram.answerCallbackQuery(id, '频道不存在', true);
                return;
            }

            // 获取文章信息
            const article = await this.db.getArticleByTelegraphUrl(telegraphUrl);
            if (!article) {
                await this.telegram.answerCallbackQuery(id, '文章不存在', true);
                return;
            }

            // 构建频道消息
            const channelMessage = `📖 **${article.title}**

${article.summary ? `📝 ${article.summary}\n\n` : ''}🔗 [阅读原文](${article.original_url})
📖 [Telegraph版本](${article.telegraph_url})

✨ 由 @${from.username || 'Telegram Bot'} 转换`;

            // 发送到频道
            await this.telegram.sendMessage(channel.channel_id, channelMessage, {
                parse_mode: 'Markdown'
            });

            // 确认操作
            await this.telegram.answerCallbackQuery(
                id,
                `✅ 已发送到频道: ${channel.title}`,
                false
            );

            // 更新原消息
            await this.telegram.editMessageText(
                message.chat.id,
                message.message_id,
                `✅ 文章已成功发送到 **${channel.title}**！

📄 ${article.title}

🔗 原文链接：
${article.original_url}

📖 Telegraph链接：
${article.telegraph_url}`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            console.error('Error sending to channel:', error);
            await this.telegram.answerCallbackQuery(
                id,
                '发送失败，请检查机器人是否在频道中有发送权限',
                true
            );
        }
    }

    /**
     * 处理移除频道
     * @param {object} callbackQuery
     */
    async handleRemoveChannel(callbackQuery) {
        const { id, from, message } = callbackQuery;
        const [_, channelId] = callbackQuery.data.split(':');

        try {
            // 检查权限
            const channel = await this.getChannelById(channelId);
            if (!channel) {
                await this.telegram.answerCallbackQuery(id, '频道不存在', true);
                return;
            }

            // 只有频道添加者可以移除
            if (channel.added_by !== from.id) {
                await this.telegram.answerCallbackQuery(
                    id,
                    '只有频道添加者可以移除频道',
                    true
                );
                return;
            }

            // 移除绑定
            await this.db.unbindUserFromChannel(from.id, channelId);

            // 确认操作
            await this.telegram.answerCallbackQuery(id, '频道已移除', false);

            // 更新消息
            await this.telegram.editMessageText(
                message.chat.id,
                message.message_id,
                '✅ 频道移除成功！'
            );

        } catch (error) {
            console.error('Error removing channel:', error);
            await this.telegram.answerCallbackQuery(
                id,
                '移除失败，请稍后重试',
                true
            );
        }
    }

    /**
     * 处理选择频道
     * @param {object} callbackQuery
     */
    async handleSelectChannel(callbackQuery) {
        const { id, from, message } = callbackQuery;
        const [_, channelId] = callbackQuery.data.split(':');

        try {
            // 设置为默认频道
            await this.db.updateUserSettings(from.id, {
                defaultChannelId: parseInt(channelId)
            });

            const channel = await this.getChannelById(channelId);
            await this.telegram.answerCallbackQuery(
                id,
                `已设置 ${channel?.title || '频道'} 为默认频道`,
                false
            );

        } catch (error) {
            console.error('Error selecting channel:', error);
            await this.telegram.answerCallbackQuery(
                id,
                '设置失败，请稍后重试',
                true
            );
        }
    }

    /**
     * 处理转换完成
     * @param {object} callbackQuery
     */
    async handleConversionComplete(callbackQuery) {
        const { id, message } = callbackQuery;

        await this.telegram.answerCallbackQuery(id, '操作完成', false);

        // 可以选择删除或修改原消息
        await this.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            '✅ 文章转换完成！感谢使用 🎉'
        );
    }

    /**
     * 处理取消操作
     * @param {object} callbackQuery
     */
    async handleCancel(callbackQuery) {
        const { id, message } = callbackQuery;

        await this.telegram.answerCallbackQuery(id, '操作已取消', false);

        await this.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            '❌ 操作已取消'
        );
    }

    /**
     * 处理未知回调
     * @param {object} callbackQuery
     */
    async handleUnknownCallback(callbackQuery) {
        const { id } = callbackQuery;
        await this.telegram.answerCallbackQuery(
            id,
            '未知操作',
            true
        );
    }

    /**
     * 根据ID获取频道信息
     * @param {string} channelId 频道ID
     * @returns {Promise<object|null>}
     */
    async getChannelById(channelId) {
        try {
            // 这里需要在Database类中添加相应的方法
            const stmt = this.db.db.prepare('SELECT * FROM channels WHERE id = ?');
            return await stmt.first(parseInt(channelId));
        } catch (error) {
            console.error('Error getting channel by ID:', error);
            return null;
        }
    }

    /**
     * 处理频道设置相关回调
     * @param {object} callbackQuery
     */
    async handleChannelSettings(callbackQuery) {
        const { from, message } = callbackQuery;
        const [_, channelId, action] = callbackQuery.data.split(':');

        try {
            const channel = await this.getChannelById(channelId);
            if (!channel) {
                await this.telegram.answerCallbackQuery(
                    callbackQuery.id,
                    '频道不存在',
                    true
                );
                return;
            }

            switch (action) {
                case 'set_default':
                    await this.setDefaultChannel(from.id, channelId);
                    break;
                case 'toggle_auto':
                    await this.toggleAutoSend(from.id, channelId);
                    break;
                case 'view_stats':
                    await this.viewChannelStats(channelId);
                    break;
                default:
                    await this.telegram.answerCallbackQuery(
                        callbackQuery.id,
                        '未知操作',
                        true
                    );
            }

        } catch (error) {
            console.error('Error handling channel settings:', error);
            await this.telegram.answerCallbackQuery(
                callbackQuery.id,
                '操作失败',
                true
            );
        }
    }

    /**
     * 设置默认频道
     * @param {number} userId 用户ID
     * @param {string} channelId 频道ID
     */
    async setDefaultChannel(userId, channelId) {
        try {
            await this.db.updateUserSettings(userId, {
                defaultChannelId: parseInt(channelId)
            });

            const channel = await this.getChannelById(channelId);
            // 这里需要更新消息显示频道设置已更改
        } catch (error) {
            console.error('Error setting default channel:', error);
            throw error;
        }
    }

    /**
     * 切换自动发送设置
     * @param {number} userId 用户ID
     * @param {string} channelId 频道ID
     */
    async toggleAutoSend(userId, channelId) {
        try {
            const settings = await this.db.getUserSettings(userId);
            const newAutoSend = !(settings?.auto_send_to_channel || false);

            await this.db.updateUserSettings(userId, {
                autoSendToChannel: newAutoSend,
                defaultChannelId: parseInt(channelId)
            });

            // 更新消息显示自动发送设置已更改
        } catch (error) {
            console.error('Error toggling auto send:', error);
            throw error;
        }
    }

    /**
     * 查看频道统计
     * @param {string} channelId 频道ID
     */
    async viewChannelStats(channelId) {
        try {
            // 这里需要实现频道统计功能
            // 可以统计发送到该频道的文章数量等
        } catch (error) {
            console.error('Error viewing channel stats:', error);
            throw error;
        }
    }
}