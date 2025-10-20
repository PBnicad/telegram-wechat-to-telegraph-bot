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

    // 已移除: handleSendToChannel（频道功能已删除）

    // 已移除: handleRemoveChannel（频道功能已删除）

    // 已移除: handleSelectChannel（频道功能已删除）

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

    // 已移除: getChannelById（数据库依赖已删除）

    // 已移除: handleChannelSettings（频道功能已删除）

    // 已移除: setDefaultChannel（频道功能已删除）

    // 已移除: toggleAutoSend（频道功能已删除）

    // 已移除: viewChannelStats（频道功能已删除）
}