/**
 * 内联查询处理器
 */
import { extractWeChatUrl } from '../utils/helpers.js';
import { WeChatParser } from '../services/wechat-parser.js';
import { WeChatParseResult, WeChatParseError } from '../types/wechat.js';

export class InlineHandler {
    constructor(telegramService, telegraphService, options = {}) {
        this.telegram = telegramService;
        this.telegraph = telegraphService;

        this.wechatParser = new WeChatParser({
            timeout: options.parseTimeout || 30000,
            userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            proxy: options.proxy || null
        });
    }

    /**
     * 处理 inline_query
     * @param {object} inlineQuery Telegram内联查询对象
     * @returns {Promise<void>}
     */
    async handleInlineQuery(inlineQuery) {
        const { id, query } = inlineQuery;
        const trimmed = (query || '').trim();
        const url = extractWeChatUrl(trimmed);

        // 无效或未包含微信链接，返回帮助提示
        if (!url) {
            const helpResult = {
                type: 'article',
                id: 'help_1',
                title: '请输入微信文章链接',
                description: '例如: https://mp.weixin.qq.com/s/xxxxx',
                input_message_content: {
                    message_text: '👋 请发送微信公众号文章链接，或使用 /help 查看帮助信息。',
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }
            };
            await this.telegram.answerInlineQuery(id, [helpResult], { cache_time: 1, is_personal: true });
            return;
        }

        try {
            // 验证URL格式
            if (!WeChatParser.matchUrl(url)) {
                throw new WeChatParseError('Invalid WeChat article URL format', 'URL_ERROR');
            }

            // 解析文章
            const parseResult = await this.wechatParser.parse(url);
            const wechatResult = new WeChatParseResult(parseResult);

            if (!wechatResult.isValid()) {
                throw new WeChatParseError('Failed to extract valid content from article', 'PARSE_ERROR');
            }

            // 创建Telegraph页面
            const telegraphPage = await this.telegraph.createPage(
                wechatResult.title,
                wechatResult.content,
                wechatResult.author
            );

            const messageText = `<a href=\"${url}\">阅读原文</a> | <a href=\"${telegraphPage.url}\">预览</a>`;

            const result = {
                type: 'article',
                id: `wx_${Math.random().toString(36).slice(2, 10)}`,
                title: wechatResult.title || '转换为 Telegraph',
                description: wechatResult.author ? `作者：${wechatResult.author}` : '生成 Telegraph 预览链接',
                input_message_content: {
                    message_text: messageText,
                    parse_mode: 'HTML',
                    disable_web_page_preview: false
                }
            };

            await this.telegram.answerInlineQuery(id, [result], { cache_time: 2 });
        } catch (error) {
            console.error('Inline query processing failed:', error);

            let description = '解析失败，请稍后重试';
            if (error instanceof WeChatParseError) {
                switch (error.code) {
                    case 'NETWORK_ERROR':
                        description = '网络错误，请重试';
                        break;
                    case 'PARSE_ERROR':
                        description = '文章解析失败，可能不支持或已删除';
                        break;
                    case 'URL_ERROR':
                        description = '链接格式错误，请使用有效的微信公众号链接';
                        break;
                    case 'TIMEOUT_ERROR':
                        description = '请求超时，请稍后重试';
                        break;
                    default:
                        description = '处理过程中出现错误';
                }
            }

            const errorResult = {
                type: 'article',
                id: 'error_1',
                title: '解析失败',
                description,
                input_message_content: {
                    message_text: `❌ ${description}`,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }
            };

            await this.telegram.answerInlineQuery(id, [errorResult], { cache_time: 1, is_personal: true });
        }
    }
}