/**
 * Telegram Bot API 服务
 */
import { TELEGRAM_API_URL } from '../utils/constants.js';
import { createInlineKeyboard } from '../utils/helpers.js';

export class TelegramService {
    constructor(token) {
        this.token = token;
        this.apiUrl = `${TELEGRAM_API_URL}${token}`;
    }

    /**
     * 发送消息
     * @param {number|string} chatId 聊天ID
     * @param {string} text 消息文本
     * @param {object} options 选项
     * @returns {Promise}
     */
    async sendMessage(chatId, text, options = {}) {
        const payload = {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            ...options
        };

        if (options.replyMarkup) {
            payload.reply_markup = options.replyMarkup;
        }

        return await this.request('sendMessage', payload);
    }

    /**
     * 编辑消息
     * @param {number|string} chatId 聊天ID
     * @param {number} messageId 消息ID
     * @param {string} text 新文本
     * @param {object} options 选项
     * @returns {Promise}
     */
    async editMessageText(chatId, messageId, text, options = {}) {
        const payload = {
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: 'HTML',
            ...options
        };

        if (options.replyMarkup) {
            payload.reply_markup = options.replyMarkup;
        }

        return await this.request('editMessageText', payload);
    }

    /**
     * 发送带有内联键盘的消息
     * @param {number|string} chatId 聊天ID
     * @param {string} text 消息文本
     * @param {Array<Array<object>>} keyboard 键盘按钮
     * @param {object} options 选项
     * @returns {Promise}
     */
    async sendMessageWithKeyboard(chatId, text, keyboard, options = {}) {
        return await this.sendMessage(chatId, text, {
            replyMarkup: createInlineKeyboard(keyboard),
            ...options
        });
    }

    /**
     * 回答回调查询
     * @param {string} callbackQueryId 回调查询ID
     * @param {string} text 回答文本
     * @param {boolean} showAlert 是否显示弹窗
     * @param {object} options 选项
     * @returns {Promise}
     */
    async answerCallbackQuery(callbackQueryId, text = '', showAlert = false, options = {}) {
        const payload = {
            callback_query_id: callbackQueryId,
            text,
            show_alert: showAlert,
            ...options
        };

        return await this.request('answerCallbackQuery', payload);
    }

    /**
     * 发送文件
     * @param {number|string} chatId 聊天ID
     * @param {string} type 文件类型 (photo, document, etc.)
     * @param {string|Buffer} file 文件内容或URL
     * @param {object} options 选项
     * @returns {Promise}
     */
    async sendFile(chatId, type, file, options = {}) {
        const payload = {
            chat_id: chatId,
            [type]: file,
            ...options
        };

        return await this.request(`send${type.charAt(0).toUpperCase() + type.slice(1)}`, payload);
    }

    /**
     * 获取聊天信息
     * @param {number|string} chatId 聊天ID
     * @returns {Promise}
     */
    async getChat(chatId) {
        return await this.request('getChat', { chat_id: chatId });
    }

    /**
     * 获取聊天管理员
     * @param {number|string} chatId 聊天ID
     * @returns {Promise}
     */
    async getChatAdministrators(chatId) {
        return await this.request('getChatAdministrators', { chat_id: chatId });
    }

    /**
     * 检查用户是否为管理员
     * @param {number|string} chatId 聊天ID
     * @param {number} userId 用户ID
     * @returns {Promise<boolean>}
     */
    async isChatAdmin(chatId, userId) {
        try {
            const admins = await this.getChatAdministrators(chatId);
            return admins.some(admin => admin.user.id === userId);
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * 删除消息
     * @param {number|string} chatId 聊天ID
     * @param {number} messageId 消息ID
     * @returns {Promise}
     */
    async deleteMessage(chatId, messageId) {
        return await this.request('deleteMessage', {
            chat_id: chatId,
            message_id: messageId
        });
    }

    /**
     * 发送聊天动作
     * @param {number|string} chatId 聊天ID
     * @param {string} action 动作类型
     * @returns {Promise}
     */
    async sendChatAction(chatId, action = 'typing') {
        return await this.request('sendChatAction', {
            chat_id: chatId,
            action
        });
    }

    /**
     * 获取用户信息
     * @param {number} userId 用户ID
     * @returns {Promise}
     */
    async getUserProfilePhotos(userId, options = {}) {
        const payload = {
            user_id: userId,
            limit: options.limit || 1,
            offset: options.offset || 0
        };

        return await this.request('getUserProfilePhotos', payload);
    }

    /**
     * 获取Webhook信息
     * @returns {Promise}
     */
    async getWebhookInfo() {
        return await this.request('getWebhookInfo');
    }

    /**
     * 设置Webhook
     * @param {string} url Webhook URL
     * @param {object} options 选项
     * @returns {Promise}
     */
    async setWebhook(url, options = {}) {
        const payload = {
            url,
            ...options
        };

        return await this.request('setWebhook', payload);
    }

    /**
     * 删除Webhook
     * @param {object} options 选项
     * @returns {Promise}
     */
    async deleteWebhook(options = {}) {
        return await this.request('deleteWebhook', options);
    }

    /**
     * 发送API请求
     * @param {string} method API方法名
     * @param {object} payload 请求数据
     * @returns {Promise}
     */
    async request(method, payload = {}) {
        const url = `${this.apiUrl}/${method}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
            }

            return data.result;
        } catch (error) {
            console.error(`Telegram API request failed: ${method}`, error);
            throw error;
        }
    }

    /**
     * 格式化用户显示名称
     * @param {object} user 用户对象
     * @returns {string}
     */
    formatUserName(user) {
        const parts = [];
        if (user.first_name) parts.push(user.first_name);
        if (user.last_name) parts.push(user.last_name);
        if (user.username) parts.push(`(@${user.username})`);
        return parts.join(' ');
    }

    /**
     * 创建频道选择键盘
     * @param {Array} channels 频道列表
     * @param {string} prefix 回调数据前缀
     * @returns {Array}
     */
    createChannelSelectionKeyboard(channels, prefix = 'select_channel') {
        return channels.map(channel => [{
            text: channel.title || `Channel ${channel.channel_id}`,
            callback_data: `${prefix}:${channel.id}`
        }]);
    }

    /**
     * 创建确认键盘
     * @param {string} confirmCallback 确认回调
     * @param {string} cancelCallback 取消回调
     * @returns {Array}
     */
    createConfirmationKeyboard(confirmCallback, cancelCallback) {
        return [
            [{ text: '✅ 确认', callback_data: confirmCallback }],
            [{ text: '❌ 取消', callback_data: cancelCallback }]
        ];
    }
    async answerInlineQuery(inlineQueryId, results, options = {}) {
        const payload = {
            inline_query_id: inlineQueryId,
            results,
            ...options
        };

        return await this.request('answerInlineQuery', payload);
    }
}