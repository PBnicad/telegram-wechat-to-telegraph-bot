/**
 * Telegram微信公众号转Telegraph机器人
 * Cloudflare Workers主入口文件
 */

import { Database } from './database/db.js';
import { TelegramService } from './services/telegram.js';
import { CrawlerService } from './services/crawler.js';
import { TelegraphService } from './services/telegraph.js';
import { MessageHandler } from './handlers/message.js';
import { CallbackHandler } from './handlers/callback.js';

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // 处理健康检查
            if (path === '/health') {
                try {
                    const db = new Database(env.DB);
                    const stats = await db.getStats();
                    return new Response(JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        services: {
                            database: 'ok',
                            telegram: env.TELEGRAM_BOT_TOKEN ? 'ok' : 'not_configured',
                            telegraph: env.TELEGRAPH_ACCESS_TOKEN ? 'ok' : 'not_configured'
                        },
                        stats: stats
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    return new Response(JSON.stringify({
                        status: 'unhealthy',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // 处理管理 API 路由
            if (path.startsWith('/admin/')) {
                const apiKey = request.headers.get('X-API-Key');
                const adminApiKey = env?.ADMIN_API_KEY;
                if (!adminApiKey || apiKey !== adminApiKey) {
                    return new Response('Unauthorized', { status: 401 });
                }

                if (path === '/admin/stats') {
                    try {
                        const db = new Database(env.DB);
                        const stats = await db.getStats();
                        return new Response(JSON.stringify({
                            success: true,
                            data: stats,
                            timestamp: new Date().toISOString()
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        return new Response(JSON.stringify({
                            success: false,
                            error: error.message
                        }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }

                return new Response('Not Found', { status: 404 });
            }

            // 处理根路径
            if (path === '/') {
                return new Response(JSON.stringify({
                    status: 'running',
                    service: 'Telegram WeChat to Telegraph Bot',
                    version: '1.0.0',
                    endpoints: {
                        health: '/health',
                        admin: '/admin/stats (requires API key)',
                        webhook: '/ (Telegram webhook endpoint)'
                    }
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Telegram Webhook 处理 (只接受 POST)
            if (request.method !== 'POST') {
                return new Response(JSON.stringify({
                    error: 'Method not allowed',
                    message: 'This endpoint only accepts POST requests for Telegram webhooks',
                    allowed_methods: ['POST'],
                    endpoints: {
                        health: 'GET /health',
                        info: 'GET /',
                        admin: 'GET /admin/stats'
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

            // 初始化服务
            const db = new Database(env.DB);
            const telegramService = new TelegramService(env.TELEGRAM_BOT_TOKEN);
            const crawlerService = new CrawlerService();
            const telegraphService = new TelegraphService(env.TELEGRAPH_ACCESS_TOKEN);

            // 初始化处理器
            const messageHandler = new MessageHandler(db, telegramService, crawlerService, telegraphService);
            const callbackHandler = new CallbackHandler(db, telegramService, crawlerService, telegraphService);

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