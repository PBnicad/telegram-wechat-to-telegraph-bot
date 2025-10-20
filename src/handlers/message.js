/**
 * 消息处理器 - 基于ParseHub架构重构
 */
import { Messages, Commands } from '../utils/constants.js';
import { isValidUrl, isWechatArticle } from '../utils/helpers.js';
import { WeChatParser } from '../services/wechat-parser.js';
import { WeChatParseResult, WeChatParseError } from '../types/wechat.js';

export class MessageHandler {
    constructor(db, telegramService, crawlerService, telegraphService, options = {}) {
        this.db = db;
        this.telegram = telegramService;
        this.crawler = crawlerService;
        this.telegraph = telegraphService;

        // 初始化WeChat解析器
        this.wechatParser = new WeChatParser({
            timeout: options.parseTimeout || 30000,
            userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            proxy: options.proxy || null
        });
    }

    /**
     * 处理文本消息
     * @param {object} message Telegram消息对象
     * @returns {Promise<void>}
     */
    async handleTextMessage(message) {
        const { text, from, chat } = message;

        // 确保用户存在 - 临时注释掉以调试
        // await this.ensureUserExists(from);

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
        const { text } = message;
        const command = text.toLowerCase().split(' ')[0];

        switch (command) {
            case Commands.START:
                return await this.handleStart(message);
            case Commands.HELP:
                return await this.handleHelp(message);
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

    // 已移除: handleMyChannels（频道功能已删除）

    // 已移除: handleAddChannel（频道功能已删除）

    // 已移除: handleRemoveChannel（频道功能已删除）

    // 已移除: handleStats（统计功能已删除）

    // 已移除: handleSettings（设置功能已删除）

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
     * 处理微信公众号URL - 基于ParseHub架构重构
     * @param {object} message
     */
    async handleWechatUrl(message) {
        const { from, chat } = message;
        const url = message.text.trim();
        let processingMessage = null;

        try {
            // 发送处理中消息
            processingMessage = await this.telegram.sendMessage(
                chat.id,
                '🔄 正在解析文章，请稍候...'
            );

            // 验证URL格式
            console.log('Validating URL:', url);
            if (!WeChatParser.matchUrl(url)) {
                console.log('URL validation failed for:', url);
                throw new WeChatParseError('Invalid WeChat article URL format', 'URL_ERROR');
            }
            console.log('URL validation passed for:', url);

            // 检查是否已经转换过 - 临时注释掉以调试
            // console.log('Checking existing article for URL:', url);
            // const existingArticle = await this.db.getArticle(url);
            // console.log('Existing article check result:', existingArticle ? 'found' : 'not found');
            // if (existingArticle) {
            //     await this.telegram.editMessageText(
            //         chat.id,
            //         processingMessage.message_id,
            //         `✅ 文章已存在！

// 📄 标题：${existingArticle.title}

// 🔗 原文链接：
// ${url}

// 📖 Telegraph链接：
// ${existingArticle.telegraph_url}`
            //     );
            //     return;
            // }

            // 使用新的解析器解析文章
            const parseResult = await this.wechatParser.parse(url);
            const wechatResult = new WeChatParseResult(parseResult);

            // 验证解析结果
            if (!wechatResult.isValid()) {
                throw new WeChatParseError('Failed to extract valid content from article', 'PARSE_ERROR');
            }

            // 更新处理进度
            await this.telegram.editMessageText(
                chat.id,
                processingMessage.message_id,
                `📝 已解析完成，正在创建Telegraph页面...

📄 标题：${wechatResult.title}
✍️ 作者：${wechatResult.author}
📊 字数：${wechatResult.wordCount}`
            );

            // 创建Telegraph页面
            const telegraphPage = await this.telegraph.createPage(
                wechatResult.title,
                wechatResult.content,
                wechatResult.author
            );

            // 保存到数据库 - 临时注释掉以调试
            // await this.db.createArticle(
            //     url,
            //     telegraphPage.url,
            //     wechatResult.title,
            //     wechatResult.author,
            //     wechatResult.summary,
            //     wechatResult.wordCount,
            //     from.id
            // );

            // 构建详细响应消息
            const responseText = this.buildSuccessResponse(wechatResult, telegraphPage, url);

            // 获取用户频道 - 临时注释掉以调试
            // const channels = await this.db.getUserChannels(from.id);

            // if (channels.length > 0) {
            //     // 创建频道选择键盘
            //     const keyboard = this.buildChannelKeyboard(channels, telegraphPage.url);

            //     await this.telegram.editMessageText(
            //         chat.id,
            //         processingMessage.message_id,
            //         responseText,
            //         { replyMarkup: { inline_keyboard: keyboard } }
            //     );
            // } else {
            //     // 没有频道，直接显示结果
            //     await this.telegram.editMessageText(
            //         chat.id,
            //         processingMessage.message_id,
            //         responseText
            //     );
            // }

            // 直接显示结果（调试版本）
            await this.telegram.editMessageText(
                chat.id,
                processingMessage.message_id,
                responseText
            );

        } catch (error) {
            console.error('Error processing WeChat article:', error);

            let errorMessage = Messages.CONVERSION_FAILED;

            // 根据错误类型提供更具体的错误信息
            if (error instanceof WeChatParseError) {
                errorMessage = this.getErrorMessage(error);
            }

            if (processingMessage) {
                await this.telegram.editMessageText(
                    chat.id,
                    processingMessage.message_id,
                    errorMessage
                );
            } else {
                await this.telegram.sendMessage(
                    chat.id,
                    errorMessage
                );
            }
        }
    }

    /**
     * 构建成功响应消息
     * @param {WeChatParseResult} result
     * @param {Object} telegraphPage
     * @param {string} originalUrl
     * @returns {string}
     */
    buildSuccessResponse(result, telegraphPage, originalUrl) {
        // 仅返回两个超链接：原文与 Telegraph
        return `<a href="${originalUrl}">阅读原文</a> | <a href="${telegraphPage.url}">预览</a>`;
    }

    // 已移除: buildChannelKeyboard（频道功能已删除）

    /**
     * 根据错误类型获取错误消息
     * @param {WeChatParseError} error
     * @returns {string}
     */
    getErrorMessage(error) {
        const errorMessages = {
            'NETWORK_ERROR': '❌ 网络错误，请稍后重试',
            'PARSE_ERROR': '❌ 文章解析失败，可能是因为文章格式不支持或已被删除',
            'URL_ERROR': '❌ 链接格式错误，请发送有效的微信公众号文章链接',
            'TIMEOUT_ERROR': '❌ 请求超时，请稍后重试',
            'default': '❌ 处理过程中出现错误，请稍后重试'
        };

        return errorMessages[error.code] || errorMessages.default;
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

    // 已移除: ensureUserExists（数据库依赖已删除）
}