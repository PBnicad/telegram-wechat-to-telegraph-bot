/**
 * Telegram微信公众号转Telegraph机器人
 * Cloudflare Workers主入口文件
 */

import { TelegramService } from './services/telegram.js';
import { TelegraphService } from './services/telegraph.js';
import { MessageHandler } from './handlers/message.js';
import { CallbackHandler } from './handlers/callback.js';
import { InlineHandler } from './handlers/inline.js';
import { wechatConfigManager } from './config/wechat-config.js';

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const path = url.pathname;



            // Telegram Webhook 处理 (只接受 POST)
            if (request.method !== 'POST') {
                // 处理根路径 (仅GET请求)
                if (path === '/' && request.method === 'GET') {
                    return new Response(JSON.stringify({
                        status: 'running',
                        service: 'Telegram WeChat to Telegraph Bot',
                        version: '1.0.0',
                        endpoints: {
                            webhook: '/ (Telegram webhook endpoint)'
                        }
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({
                    error: 'Method not allowed',
                    message: 'This endpoint only accepts POST requests for Telegram webhooks',
                    allowed_methods: ['POST'],
                    endpoints: {
                        info: 'GET /',
                        webhook: 'POST /'
                    }
                }), {
                    status: 405,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 记录请求信息
            console.log('Received request:', {
                method: request.method,
                path: path,
                userAgent: request.headers.get('user-agent'),
                contentType: request.headers.get('content-type'),
                contentLength: request.headers.get('content-length')
            });

            // 初始化服务（移除数据库与爬虫依赖）
            const telegramService = new TelegramService(env.TELEGRAM_BOT_TOKEN);
            const telegraphService = new TelegraphService(env.TELEGRAPH_ACCESS_TOKEN);

            // 获取解析器配置
            const wechatConfig = wechatConfigManager.getConfig(env.WECHAT_PARSER_QUALITY || 'default');

            // 初始化处理器（仅保留必要服务）
            const messageHandler = new MessageHandler(
                null,
                telegramService,
                null,
                telegraphService,
                {
                    parseTimeout: wechatConfig.timeout,
                    userAgent: wechatConfig.userAgent,
                    proxy: env.PROXY_URL || wechatConfig.proxy,
                    deepseekApiKey: env.DEEPSEEK_API_KEY,
                    deepseekModel: 'deepseek-chat'
                }
            );
            const callbackHandler = new CallbackHandler(null, telegramService, null, telegraphService);
            const inlineHandler = new InlineHandler(telegramService, telegraphService, {
                parseTimeout: wechatConfig.timeout,
                userAgent: wechatConfig.userAgent,
                proxy: env.PROXY_URL || wechatConfig.proxy
            });

            let update;
            try {
                update = await request.json();
                console.log('Received update:', JSON.stringify({
                    update_id: update.update_id,
                    message: update.message ? {
                        from: update.message.from?.id,
                        chat: update.message.chat?.id,
                        text: update.message.text?.substring(0, 50)
                    } : null,
                    callback_query: update.callback_query ? {
                        from: update.callback_query.from?.id,
                        data: update.callback_query.data?.substring(0, 50)
                    } : null,
                    inline_query: update.inline_query ? {
                        from: update.inline_query.from?.id,
                        query: update.inline_query.query?.substring(0, 50)
                    } : null
                }, null, 2));
            } catch (error) {
                console.error('Failed to parse update JSON:', error);
                return new Response('Invalid JSON', { status: 400 });
            }

            // 处理不同类型的更新
            try {
                if (update.message) {
                    console.log('Processing message from chat:', update.message.chat.id, 'text:', update.message.text?.substring(0, 50));
                    await messageHandler.handleTextMessage(update.message);
                    console.log('Message processed successfully');
                } else if (update.callback_query) {
                    console.log('Processing callback query from user:', update.callback_query.from.id);
                    await callbackHandler.handleCallbackQuery(update.callback_query);
                    console.log('Callback query processed successfully');
                } else if (update.inline_query) {
                    console.log('Processing inline query from user:', update.inline_query.from.id, 'query:', update.inline_query.query?.substring(0, 80));
                    await inlineHandler.handleInlineQuery(update.inline_query);
                    console.log('Inline query processed successfully');
                } else if (update.channel_post) {
                    console.log('Processing channel post from chat:', update.channel_post.chat.id);
                    // 暂时不处理频道消息
                    console.log('Channel post ignored (not implemented)');
                } else {
                    console.log('Received unknown update type:', Object.keys(update));
                }
            } catch (processingError) {
                console.error('Error processing update:', processingError);
                console.error('Stack trace:', processingError.stack);

                // 尝试发送错误消息给用户
                try {
                    if (update.message && update.message.chat) {
                        await telegramService.sendMessage(
                            update.message.chat.id,
                            '抱歉，处理您的消息时发生了错误。请稍后重试。'
                        );
                        console.log('Error message sent to user');
                    }
                } catch (msgError) {
                    console.error('Failed to send error message:', msgError);
                }
            }

            return new Response('OK', { status: 200 });

        } catch (error) {
            console.error('Unhandled error in fetch handler:', error);
            console.error('Stack trace:', error.stack);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};