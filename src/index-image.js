/**
 * 图片处理版本 - 支持Base64图片保存
 */

export default {
    async fetch(request, env, ctx) {
        console.log('=== IMAGE PROCESSING VERSION ===');

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            if (path === '/' && request.method === 'POST') {
                const body = await request.text();
                const update = JSON.parse(body);

                if (update.message) {
                    const chatId = update.message.chat.id;
                    const text = update.message.text || '';
                    const user = update.message.from;
                    const userId = user?.id;

                    // 确保用户信息被记录
                    if (env && env.DB && userId) {
                        await ensureUserExists(env.DB, userId, user);
                    }

                    // 权限验证
                    if (!await hasPermission(env, userId)) {
                        await sendMessage(chatId,
                            '❌ *权限不足*\n\n' +
                            '抱歉，您没有使用此机器人的权限。\n\n' +
                            '如需使用权限，请联系超级管理员。\n\n' +
                            '*🔒 此为私有机器人*',
                            env
                        );
                        return new Response('', { status: 200 });
                    }

                    if (text.startsWith('/')) {
                        await handleCommand(chatId, text, userId, env);
                    } else if (text.includes('mp.weixin.qq.com')) {
                        await handleWechatUrl(chatId, text, userId, env, user);
                    } else {
                        await sendMessage(chatId,
                            '*👋 收到您的消息！*\n\n' +
                            '*📖 使用帮助：*\n' +
                            '• 发送微信公众号文章链接进行转换\n' +
                            '• 发送 `/help` 查看所有命令',
                            env
                        );
                    }
                }

                return new Response('', { status: 200 });
            }

            if (path === '/health') {
                return new Response(JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (path === '/') {
                return new Response(JSON.stringify({
                    status: 'running',
                    version: 'image-processing',
                    features: ['wechat-crawler', 'telegraph-api', 'preserve-inline-styles', 'no-base64-images'],
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response('Not Found', { status: 404 });

        } catch (error) {
            console.error('Error:', error.message);
            return new Response('Error', { status: 200 });
        }

        // 处理命令
        async function handleCommand(chatId, command, userId, env) {
            try {
                const isSuperAdmin = await isSuperAdminUser(env, userId);
                const isAdmin = await isAdminUser(env, userId);

                switch (command) {
                    case '/start':
                        await sendMessage(chatId,
                            '*🎉 欢迎使用 @wechat2telegraphbot！*\n\n' +
                            '*📖 主要功能：*\n' +
                            '• 转换微信公众号文章为Telegraph页面\n' +
                            '• 保留更细粒度的内联样式（粗体/斜体/链接/代码）\n' +
                            '• 保留原始图片URL，避免Base64\n' +
                            '• 智能反爬策略\n\n' +
                            '*📝 使用方法：*\n' +
                            '• 发送微信公众号文章链接\n' +
                            '• 发送  /help  查看更多命令\n\n' +
                            '*🚀 开始使用吧！*',
                            env
                        );
                        break;

                    case '/help':
                        let helpMessage = '*📖 命令列表：*\n\n' +
                            '🏠  /start  - 开始使用\n' +
                            '❓  /help  - 查看帮助\n\n' +
                            '*📝 功能说明：*\n' +
                            '• 发送微信公众号文章链接进行转换\n' +
                            '• 内嵌到Telegraph页面\n' +
                            '• 避免图片链接失效\n';

                        if (isSuperAdmin) {
                            helpMessage += '\n*👑 超级管理员命令：*\n' +
                                '➕  /add_admin <user_id>` - 添加管理员\n' +
                                '➖  /remove_admin <user_id>  - 移除管理员\n' +
                                '📋  /list_admins  - 查看管理员列表\n' +
                                '👑  /add_super_admin <user_id>  - 添加超级管理员\n';
                        }

                        helpMessage += '\n*📞 需要帮助？请联系管理员*';

                        await sendMessage(chatId, helpMessage, env);
                        break;

                    // 超级管理员命令
                    case '/add_super_admin':
                        if (!isSuperAdmin) {
                            await sendMessage(chatId, '❌ *权限不足：* 只有超级管理员可以使用此命令');
                            return;
                        }
                        // 这个命令需要参数，在default分支处理
                        await handleAdminCommand(chatId, command, userId, env, 'super_admin');
                        break;

                    case '/add_admin':
                        if (!isSuperAdmin) {
                            await sendMessage(chatId, '❌ *权限不足：* 只有超级管理员可以使用此命令');
                            return;
                        }
                        await handleAdminCommand(chatId, command, userId, env, 'admin');
                        break;

                    case '/remove_admin':
                        if (!isSuperAdmin) {
                            await sendMessage(chatId, '❌ *权限不足：* 只有超级管理员可以使用此命令');
                            return;
                        }
                        await handleAdminCommand(chatId, command, userId, env, 'remove_admin');
                        break;

                    case '/list_admins':
                        if (!isSuperAdmin && !isAdmin) {
                            await sendMessage(chatId, '❌ *权限不足：* 只有管理员可以使用此命令');
                            return;
                        }
                        await listAdmins(chatId, env);
                        break;

                    default:
                        // 检查是否是管理员命令（带参数）
                        if (command.startsWith('/add_admin ') ||
                            command.startsWith('/remove_admin ') ||
                            command.startsWith('/add_super_admin ')) {
                            if (!isSuperAdmin) {
                                await sendMessage(chatId, '❌ *权限不足：* 只有超级管理员可以使用此命令');
                                return;
                            }

                            if (command.startsWith('/add_admin ')) {
                                await handleAdminCommand(chatId, command, userId, env, 'admin');
                            } else if (command.startsWith('/remove_admin ')) {
                                await handleAdminCommand(chatId, command, userId, env, 'remove_admin');
                            } else if (command.startsWith('/add_super_admin ')) {
                                await handleAdminCommand(chatId, command, userId, env, 'super_admin');
                            }
                        } else {
                            await sendMessage(chatId,
                                '*❓ 未知命令：* `' + command + '`\n\n' +
                                '*📖 发送* /help` *查看可用命令*'
                            );
                        }
                }
            } catch (error) {
                console.error('命令处理异常:', error.message);
                await sendMessage(chatId, '❌ 命令处理失败，请稍后重试', env);
            }
        }

        // 处理微信公众号链接 - 包含图片处理
        async function handleWechatUrl(chatId, url, userId, env, user = null) {
            console.log('=== Processing with Image Support ===');
            console.log('URL:', url);

            if (!isValidWechatUrl(url)) {
                await sendMessage(chatId, '❌ 请发送有效的微信公众号文章链接', env);
                return;
            }

            await sendMessage(chatId, '🔄 正在获取文章内容和图片，这可能需要一些时间...', env);

            try {
                let articleData = null;
                let strategyUsed = '';

                // 尝试获取文章内容
                console.log('\n=== 获取文章内容 ===');
                articleData = await fetchWechatArticleAdvanced(url);
                if (articleData) {
                    strategyUsed = '高级获取';
                    console.log('✅ 文章内容获取成功');
                }

                if (!articleData) {
                    articleData = await fetchWechatArticleViaAPI(url, env);
                    if (articleData) {
                        strategyUsed = '第三方API';
                        console.log('✅ API获取成功');
                    }
                }

                if (!articleData) {
                    articleData = await fetchWechatArticleBackup(url, env);
                    if (articleData) {
                        strategyUsed = '备用解析器';
                        console.log('✅ 备用解析器成功');
                    }
                }

                if (!articleData) {
                    throw new Error('无法获取文章内容');
                }

                // 处理图片
                console.log('\n=== 处理图片 ===');
                await sendMessage(chatId, '🖼️ 正在处理文章中的图片，请稍候...', env);

                const processedContent = await processImagesInContent(articleData.content, articleData.originalUrl);

                console.log('✅ 图片处理完成');

                // 创建Telegraph页面
                console.log('\n=== 创建Telegraph页面 ===');
                const telegraphPage = await createTelegraphPage({
                    ...articleData,
                    content: processedContent.content
                }, env);

                if (!telegraphPage) {
                    throw new Error('创建Telegraph页面失败');
                }

                // 保存到数据库
                if (env && env.DB) {
                    try {
                        await saveArticleRecord(env.DB, url, telegraphPage.url, articleData, userId, user);
                    } catch (dbError) {
                        console.log('Database save failed:', dbError.message);
                    }
                }

                // 发送成功结果 - 使用Markdown格式和超链接
                const responseText =
                    '✅ *文章转换成功！*\n\n' +
                    '📄 *标题：* ' + (articleData.title || '未知标题') + '\n' +
                    '✍️ *作者：* ' + (articleData.author || '未知作者') + '\n' +
                    '📊 *字数：* ' + (articleData.wordCount || 0) + '\n' +
                    '🖼️ *图片数量：* ' + processedContent.imageCount + '\n' +
                    '🔧 *使用策略：* ' + strategyUsed + '\n\n' +
                    '🔗 *原文链接：*\n' + `[查看原文](${url})` + '\n\n' +
                    '📖 *Telegraph链接：*\n' + `[阅读Telegraph版本](${telegraphPage.url})` + '\n\n' +
                    '📝 *摘要：*\n' + '```' + (articleData.summary || '无摘要') + '```' + '\n\n' +
                    '🎉 *享受阅读！*';

                await sendMessage(chatId, responseText, env);
                console.log('✅ 完整转换完成');

            } catch (error) {
                console.error('转换失败:', error.message);

                await sendMessage(chatId,
                    '❌ 文章转换失败：' + error.message + '\n\n' +
                    '💡 可能的原因：\n' +
                    '• 文章链接无效\n' +
                    '• 图片下载失败\n' +
                    '• 网络连接问题\n' +
                    '• 反爬机制限制\n\n' +
                    '请稍后重试或联系管理员。',
                    env
                );
            }
        }

        // 处理内容中的图片
        async function processImagesInContent(content, originalUrl) {
            console.log('开始处理图片...');

            let processedContent = content;
            let imageCount = 0;
            const processedImages = [];

            try {
                // 提取所有图片标签
                const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
                const imgMatches = [...content.matchAll(imgRegex)];

                console.log('发现图片数量:', imgMatches.length);

                // 仅解析并替换为完整URL，不做Base64
                processedContent = processedContent.replace(imgRegex, (fullTag, src) => {
                    const fullImageUrl = resolveImageUrl(src, originalUrl);
                    imageCount++;
                    processedImages.push({ original: src, full: fullImageUrl });
                    // 仅替换 src 属性，保留其他属性和样式
                    return fullTag.replace(/src=["'][^"']+["']/i, `src="${fullImageUrl}"`);
                });

                console.log('图片URL标准化完成:', {
                    totalFound: imgMatches.length,
                    standardized: imageCount,
                    samples: processedImages.slice(0, 3)
                });

            } catch (error) {
                console.error('图片处理过程中发生错误:', error.message);
            }

            return {
                content: processedContent,
                imageCount: imageCount,
                processedImages: processedImages
            };
        }

        // 解析图片URL
        function resolveImageUrl(src, baseUrl) {
            try {
                // 如果已经是完整URL，直接返回
                if (src.startsWith('http://') || src.startsWith('https://')) {
                    return src;
                }

                // 如果是相对路径，构造完整URL
                const url = new URL(baseUrl);
                const baseHost = url.protocol + '//' + url.host;

                // 处理不同格式的相对路径
                if (src.startsWith('/')) {
                    return baseHost + src;
                } else {
                    return baseHost + '/' + src;
                }
            } catch (error) {
                console.error('解析图片URL失败:', error.message);
                return src;
            }
        }

        // 下载图片并转换为Base64
        async function downloadAndConvertToBase64(imageUrl) {
            try {
                console.log('下载图片:', imageUrl);

                // 设置图片下载的超时时间
                const controller = new AbortController();
                const timeoutMs = env?.REQUEST_TIMEOUT || 30000;
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const response = await fetch(imageUrl, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/*',
                        'Cache-Control': 'no-cache',
                        'Referer': 'https://mp.weixin.qq.com/'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.log('图片下载失败:', response.status);
                    return null;
                }

                // 获取图片MIME类型
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                console.log('图片类型:', contentType);

                // 读取图片数据
                const arrayBuffer = await response.arrayBuffer();
                console.log('图片大小:', arrayBuffer.byteLength, 'bytes');

                // 转换为Base64
                const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                const dataUrl = `data:${contentType};base64,${base64}`;

                console.log('Base64转换成功，长度:', dataUrl.length);
                return dataUrl;

            } catch (error) {
                console.error('下载转换图片失败:', error.message);
                return null;
            }
        }

        // 高级直接获取 - 保持之前的逻辑
        async function fetchWechatArticleAdvanced(url) {
            try {
                console.log('尝试高级获取策略...');

                const userAgents = [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/119.0.0.0',
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
                ];

                for (let i = 0; i < userAgents.length; i++) {
                    const userAgent = userAgents[i];
                    console.log(`尝试 User-Agent ${i + 1}/${userAgents.length}`);

                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': userAgent,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'Upgrade-Insecure-Requests': '1'
                        }
                    });

                    if (!response.ok) {
                        console.log(`User-Agent ${i + 1} 失败:`, response.status);
                        continue;
                    }

                    const html = await response.text();
                    console.log(`User-Agent ${i + 1} HTML长度:`, html.length);

                    if (isEnvironmentVerificationRequired(html)) {
                        console.log(`User-Agent ${i + 1} 被环境验证阻挡`);
                        continue;
                    }

                    if (isBlockedByAntiCrawler(html)) {
                        console.log(`User-Agent ${i + 1} 被反爬阻挡`);
                        continue;
                    }

                    if (!hasValidContent(html)) {
                        console.log(`User-Agent ${i + 1} 内容无效`);
                        continue;
                    }

                    console.log(`✅ User-Agent ${i + 1} 成功！`);
                    return parseWechatArticle(html, url);
                }

                console.log('❌ 所有User-Agent都失败了');
                return null;

            } catch (error) {
                console.error('高级获取异常:', error.message);
                return null;
            }
        }

        // 第三方API
        async function fetchWechatArticleViaAPI(url, env) {
            try {
                console.log('尝试第三方API...');
                const jinaAiApiUrl = env?.JINA_AI_API_URL || 'https://r.jina.ai';
                const apiUrl = `${jinaAiApiUrl}/http/` + url.replace('https://', '');

                const response = await fetch(apiUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; Jina AI Reader)'
                    }
                });

                if (!response.ok) {
                    console.log('API失败:', response.status);
                    return null;
                }

                const text = await response.text();
                console.log('API内容长度:', text.length);

                if (text.length < 100) {
                    console.log('API内容过短');
                    return null;
                }

                return parseJinaAIResponse(text, url);

            } catch (error) {
                console.error('API获取异常:', error.message);
                return null;
            }
        }

        // 备用解析器
        async function fetchWechatArticleBackup(url, env) {
            try {
                console.log('尝试备用解析器...');
                const jinaAiApiUrl = env?.JINA_AI_API_URL || 'https://r.jina.ai';
                const textiseUrl = `${jinaAiApiUrl}/http/` + url.replace('https://', '');

                const response = await fetch(textiseUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; Text Extractor)'
                    }
                });

                if (!response.ok) {
                    console.log('备用解析器请求失败:', response.status);
                    return null;
                }

                const content = await response.text();
                console.log('备用解析器内容长度:', content.length);

                if (content.length < 50) {
                    console.log('备用解析器内容过短');
                    return null;
                }

                return {
                    title: extractTitleFromContent(content),
                    author: '未知作者',
                    content: content,
                    summary: generateSummary(content),
                    wordCount: countWords(content),
                    originalUrl: url
                };

            } catch (error) {
                console.error('备用解析器异常:', error.message);
                return null;
            }
        }

        // 检查是否需要环境验证
        function isEnvironmentVerificationRequired(html) {
            const verificationIndicators = [
                '环境异常',
                '完成验证后即可继续访问',
                '当前环境异常',
                'Weixin Official Accounts Platform',
                'Warning: This page maybe not yet fully loaded',
                'Warning: This page maybe requiring CAPTCHA',
                'please make sure you are authorized to access this page',
                '环境异常 ----',
                '去验证'
            ];

            const lowerHtml = html.toLowerCase();
            return verificationIndicators.some(indicator =>
                lowerHtml.includes(indicator.toLowerCase())
            );
        }

        // 检查是否被反爬阻挡
        function isBlockedByAntiCrawler(html) {
            const blockIndicators = [
                '访问过于频繁',
                '请在微信客户端打开',
                '请点击右上角',
                '验证码',
                'captcha',
                'anti-crawler',
                'robot check',
                '安全验证'
            ];

            const lowerHtml = html.toLowerCase();
            return blockIndicators.some(indicator =>
                lowerHtml.includes(indicator.toLowerCase())
            );
        }

        // 检查是否有有效内容
        function hasValidContent(html) {
            return html.includes('js_content') ||
                   html.includes('rich_media_content') ||
                   html.includes('rich_media_title');
        }

        // 验证微信链接格式
        function isValidWechatUrl(url) {
            const wechatPatterns = [
                /^https?:\/\/mp\.weixin\.qq\.com\/s/i,
                /^https?:\/\/mp\.weixin\.qq\.com\/s\?/i,
                /mp\.weixin\.qq\.com/i
            ];

            return wechatPatterns.some(pattern => pattern.test(url));
        }

        // 解析微信文章
        function parseWechatArticle(html, originalUrl) {
            try {
                let title = '';
                let author = '';
                let content = '';

                // 提取标题 - 多种匹配模式
                const titlePatterns = [
                    /<h1[^>]*class="[^"]*rich_media_title[^"]*"[^>]*>([^<]+)<\/h1>/i,
                    /<h1[^>]*>([^<]+)<\/h1>/i,
                    /<title[^>]*>([^<]+)<\/title>/i
                ];

                for (const pattern of titlePatterns) {
                    const titleMatch = html.match(pattern);
                    if (titleMatch) {
                        title = titleMatch[1].trim();
                        break;
                    }
                }

                // 提取作者 - 多种匹配模式
                const authorPatterns = [
                    /<span[^>]*class="[^"]*rich_media_meta_nickname[^"]*"[^>]*>([^<]+)<\/span>/i,
                    /<span[^>]*class="[^"]*profile_nickname[^"]*"[^>]*>([^<]+)<\/span>/i,
                    /<a[^>]*class="[^"]*rich_media_meta_link[^"]*"[^>]*>([^<]+)<\/a>/i,
                    /<div[^>]*class="[^"]*rich_media_meta[^"]*"[^>]*>([^<]+)<\/div>/i,
                    /<div[^>]*id="js_author_name"[^>]*>([^<]+)<\/div>/i
                ];

                for (const pattern of authorPatterns) {
                    const authorMatch = html.match(pattern);
                    if (authorMatch) {
                        author = authorMatch[1].trim();
                        if (author && author !== '未知作者') {
                            break;
                        }
                    }
                }

                // 如果没有找到作者，尝试从meta标签获取
                if (!author) {
                    const metaAuthorMatch = html.match(/<meta[^>]*name=["\']author["\'][^>]*content=["\']([^"\']+)["\']/i);
                    if (metaAuthorMatch) {
                        author = metaAuthorMatch[1].trim();
                    }
                }

                // 提取内容
                const contentMatch = html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>/i);
                if (contentMatch) {
                    content = contentMatch[1];
                }

                // 保留原始HTML，避免早期清理导致格式和图片丢失

                console.log('文章解析结果:', {
                    title: title || '未找到标题',
                    author: author || '未找到作者',
                    contentLength: content.length,
                    url: originalUrl
                });

                return {
                    title: title || '未命名文章',
                    author: author || 'wechat2telegraphbot', // 默认使用机器人名称
                    content: content,
                    summary: generateSummary(content),
                    wordCount: countWords(content),
                    originalUrl: originalUrl
                };

            } catch (error) {
                console.error('解析文章异常:', error.message);
                return null;
            }
        }

        // 解析Jina AI响应
        function parseJinaAIResponse(text, originalUrl) {
            try {
                const lines = text.split('\n');
                let title = lines[0] || '未命名文章';
                let author = 'wechat2telegraphbot'; // 默认作者
                let content = text;

                content = content.replace(/^.*?\n/, '');
                content = content.trim();

                // 尝试从内容中提取作者信息
                const authorPatterns = [
                    /作者[：:]\s*([^\n\r]+)/i,
                    /公众号[：:]\s*([^\n\r]+)/i,
                    /来源[：:]\s*([^\n\r]+)/i
                ];

                for (const pattern of authorPatterns) {
                    const authorMatch = content.match(pattern);
                    if (authorMatch && authorMatch[1]) {
                        const extractedAuthor = authorMatch[1].trim();
                        if (extractedAuthor && extractedAuthor.length < 50) {
                            author = extractedAuthor;
                            break;
                        }
                    }
                }

                console.log('Jina AI解析结果:', {
                    title: title,
                    author: author,
                    contentLength: content.length
                });

                return {
                    title: title,
                    author: author,
                    content: content,
                    summary: generateSummary(content),
                    wordCount: countWords(content),
                    originalUrl: originalUrl
                };

            } catch (error) {
                console.error('解析Jina AI响应异常:', error.message);
                return null;
            }
        }

        // 从内容中提取标题
        function extractTitleFromContent(content) {
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.length > 0 && trimmedLine.length < 100) {
                    return trimmedLine;
                }
            }
            return '未命名文章';
        }

        // 清理内容 - 只删除HTML标签，保留原始分段
        function cleanContent(content) {
            if (!content) return '';

            let cleaned = content;

            // 移除脚本和样式
            cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
            cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

            // 移除二维码和其他无关元素
            cleaned = cleaned.replace(/<div[^>]*class="[^"]*qr_code[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
            cleaned = cleaned.replace(/<div[^>]*class="[^"]*profile_container[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

            // 只删除HTML标签，保留文本内容和分段结构
            cleaned = removeHtmlTags(cleaned);

            // 清理多余的空白，但保留段落结构
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
            cleaned = cleaned.replace(/[ \t]+/g, ' ');
            cleaned = cleaned.trim();

            return cleaned;
        }

        // 只删除HTML标签，保留内容
        function removeHtmlTags(html) {
            let text = html;

            // 处理段落标签 - 保留段落分隔
            text = text.replace(/<p[^>]*>/gi, '');
            text = text.replace(/<\/p>/gi, '\n\n');

            // 处理标题标签 - 保留标题分隔
            text = text.replace(/<h[1-6][^>]*>/gi, '');
            text = text.replace(/<\/h[1-6]>/gi, '\n\n');

            // 处理div标签 - 保留换行
            text = text.replace(/<div[^>]*>/gi, '');
            text = text.replace(/<\/div>/gi, '\n');

            // 处理列表项 - 保留列表分隔
            text = text.replace(/<li[^>]*>/gi, '• ');
            text = text.replace(/<\/li>/gi, '\n');

            // 处理br标签 - 保留换行
            text = text.replace(/<br[^>]*>/gi, '\n');

            // 移除其他所有HTML标签
            text = text.replace(/<[^>]*>/g, '');

            // 解码HTML实体
            text = text.replace(/&nbsp;/g, ' ');
            text = text.replace(/&lt;/g, '<');
            text = text.replace(/&gt;/g, '>');
            text = text.replace(/&amp;/g, '&');
            text = text.replace(/&quot;/g, '"');
            text = text.replace(/&#39;/g, "'");
            text = text.replace(/&hellip;/g, '…');
            text = text.replace(/&mdash;/g, '—');
            text = text.replace(/&ndash;/g, '–');

            // 清理多余的空行
            text = text.replace(/\n{3,}/g, '\n\n');
            text = text.trim();

            return text;
        }

        // 生成摘要
        function generateSummary(content) {
            if (!content) return '';
            const textContent = content.replace(/<[^>]*>/g, '');
            if (textContent.length <= 200) return textContent;

            const truncated = textContent.substring(0, 200);
            const lastSentenceEnd = Math.max(
                truncated.lastIndexOf('。'),
                truncated.lastIndexOf('！'),
                truncated.lastIndexOf('？')
            );

            if (lastSentenceEnd > 150) {
                return truncated.substring(0, lastSentenceEnd + 1);
            }

            return truncated + '...';
        }

        // 计算字数
        function countWords(content) {
            const textContent = content.replace(/<[^>]*>/g, '');
            const chineseChars = (textContent.match(/[\u4e00-\u9fff]/g) || []).length;
            const englishWords = (textContent.match(/[a-zA-Z]+/g) || []).length;
            return chineseChars + englishWords;
        }

        // 创建Telegraph页面
        async function createTelegraphPage(articleData, env) {
            try {
                const accessToken = await getTelegraphAccessToken(env);

                if (!accessToken) {
                    throw new Error('无法获取Telegraph访问令牌');
                }

                const telegraphContent = convertToTelegraphFormat(articleData.content);

                // 确保作者名称不为空且格式正确
                const botAuthor = env?.BOT_AUTHOR || 'wechat2telegraphbot';
                const authorName = articleData.author && articleData.author.trim()
                    ? articleData.author.trim()
                    : botAuthor;

                console.log('Telegraph页面信息:', {
                    title: articleData.title,
                    author: authorName,
                    contentLength: telegraphContent.length
                });

                const telegraphApiUrl = env?.TELEGRAPH_API_URL || 'https://api.telegra.ph';
                const response = await fetch(`${telegraphApiUrl}/createPage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify((() => {
                        const payload = {
                            access_token: accessToken,
                            title: articleData.title || '未命名文章',
                            author_name: authorName,
                            content: telegraphContent,
                            return_content: false
                        };
                        // 仅在明确提供 BOT_AUTHOR_URL 时传入作者链接
                        const authorUrl = env?.BOT_AUTHOR_URL || '';
                        if (authorUrl) {
                            payload.author_url = authorUrl;
                        }
                        return payload;
                    })())
                });

                const result = await response.json();

                if (!result.ok) {
                    console.error('Telegraph API错误:', result.error);
                    throw new Error('Telegraph API error: ' + result.error);
                }

                console.log('Telegraph页面创建成功:', result.result.url);
                return {
                    url: result.result.url,
                    path: result.result.path
                };

            } catch (error) {
                console.error('创建Telegraph页面异常:', error.message);
                return null;
            }
        }

        // 获取Telegraph访问令牌
        async function getTelegraphAccessToken(env) {
            try {
                // 如果环境变量中有预设的访问令牌，直接使用
                if (env?.TELEGRAPH_ACCESS_TOKEN) {
                    return env.TELEGRAPH_ACCESS_TOKEN;
                }

                // 否则创建新的Telegraph账户
                const telegraphApiUrl = env?.TELEGRAPH_API_URL || 'https://api.telegra.ph';
                const botName = env?.BOT_NAME || 'wechat2telegraph';
                const botAuthor = env?.BOT_AUTHOR || 'wechat2telegraphbot';

                const response = await fetch(`${telegraphApiUrl}/createAccount`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify((() => {
                        const payload = {
                            short_name: botName,
                            author_name: botAuthor
                        };
                        // 仅在明确提供 BOT_AUTHOR_URL 时传入作者链接
                        const authorUrl = env?.BOT_AUTHOR_URL || '';
                        if (authorUrl) {
                            payload.author_url = authorUrl;
                        }
                        return payload;
                    })())
                });

                const result = await response.json();

                if (result.ok) {
                    return result.result.access_token;
                } else {
                    console.error('创建Telegraph账户失败:', result.error);
                    return null;
                }

            } catch (error) {
                console.error('获取Telegraph访问令牌异常:', error.message);
                return null;
            }
        }

        // 转换内容为Telegraph格式 - 基于HTML解析，保留加粗/斜体等内联样式，且不使用Base64
        function convertToTelegraphFormat(content) {
            if (!content) {
                return [{ tag: 'p', children: ['内容为空'] }];
            }

            // 移除脚本、样式与注释
            const html = content
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '');

            const nodes = [];

            // 顺序解析常见块级元素
            const blockRegex = /<(h[1-6]|p|blockquote|ul|ol|pre|figure)[^>]*>([\s\S]*?)<\/\1>/gi;
            let last = 0; let m;

            while ((m = blockRegex.exec(html)) !== null) {
                const before = html.slice(last, m.index);
                pushInlineFragments(before, nodes);

                const tag = m[1].toLowerCase();
                const inner = m[2];

                if (tag.startsWith('h')) {
                    const level = parseInt(tag.substring(1), 10);
                    const mapped = level <= 2 ? 'h3' : 'h4'; // Telegraph支持的标题有限，做兼容映射
                    nodes.push({ tag: mapped, children: parseInlineHtml(inner) });
                } else if (tag === 'p') {
                    pushParagraph(inner, nodes);
                } else if (tag === 'blockquote') {
                    const paras = inner.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
                    if (paras.length) {
                        nodes.push({ tag: 'blockquote', children: paras.map(p => ({ tag: 'p', children: parseInlineHtml(p.replace(/<\/?.*?p[^>]*>/gi, '')) })) });
                    } else {
                        nodes.push({ tag: 'blockquote', children: [{ tag: 'p', children: parseInlineHtml(inner) }] });
                    }
                } else if (tag === 'ul' || tag === 'ol') {
                    const lis = inner.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
                    const items = lis.map(li => {
                        const liInner = li.replace(/<\/?li[^>]*>/gi, '');
                        return { tag: 'li', children: parseInlineHtml(liInner) };
                    });
                    if (items.length) nodes.push({ tag, children: items });
                } else if (tag === 'pre') {
                    const codeMatch = inner.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
                    const codeText = decodeEntities((codeMatch ? codeMatch[1] : inner).replace(/<[^>]+>/g, ''));
                    nodes.push({ tag: 'pre', children: [codeText.trim()] });
                } else if (tag === 'figure') {
                    const imgMatch = inner.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
                    const src = imgMatch ? imgMatch[1] : null;
                    if (src && !/^data:/i.test(src)) nodes.push({ tag: 'img', attrs: { src } });
                    const cap = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
                    if (cap) nodes.push({ tag: 'figcaption', children: parseInlineHtml(cap[1]) });
                }

                last = blockRegex.lastIndex;
            }

            const tail = html.slice(last);
            pushInlineFragments(tail, nodes);

            return nodes.length ? nodes : [{ tag: 'p', children: ['内容解析失败'] }];

            // ==== 辅助函数区 ====

            // 处理散落片段中的图片和文本（文本按<p>包装；图片独立输出）。
            function pushInlineFragments(fragment, out) {
                if (!fragment) return;
                // 独立输出图片，且跳过Base64
                for (const im of fragment.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
                    const src = im[1];
                    if (src && !/^data:/i.test(src)) out.push({ tag: 'img', attrs: { src } });
                }
                // 其余文本用段落包装，并保留内联样式
                const children = parseInlineHtml(fragment.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, ''));
                const paragraphKids = children.filter(n => !(typeof n === 'object' && n.tag === 'img'));
                if (paragraphKids.some(n => typeof n === 'string' ? n.trim() : true)) {
                    out.push({ tag: 'p', children: paragraphKids.length ? paragraphKids : ['\u00A0'] });
                }
            }

            // 生成段落并提取其中图片（图片独立输出；段落保留内联样式）
            function pushParagraph(inner, out) {
                const children = parseInlineHtml(inner);
                const textChildren = children.filter(n => !(typeof n === 'object' && n.tag === 'img'));
                if (textChildren.length) out.push({ tag: 'p', children: textChildren });
                for (const n of children) {
                    if (typeof n === 'object' && n.tag === 'img') {
                        const src = n.attrs?.src;
                        if (src && !/^data:/i.test(src)) out.push(n);
                    }
                }
            }

            // 内联解析：保留<b>/<i>/<a>/<code>/<br>，并跳过Base64图片
            function parseInlineHtml(fragment) {
                const kids = [];
                let s = fragment
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

                while (s.length) {
                    const m = s.match(/<(br|img|a|b|strong|i|em|code)[^>]*>/i);
                    if (!m) {
                        const text = stripRemainingTags(s);
                        if (text) kids.push(text);
                        break;
                    }

                    const before = s.slice(0, m.index);
                    const beforeText = stripRemainingTags(before);
                    if (beforeText) kids.push(beforeText);

                    const tag = m[1].toLowerCase();
                    const open = m[0];
                    s = s.slice(m.index + m[0].length);

                    if (tag === 'br') {
                        kids.push({ tag: 'br' });
                        continue;
                    }

                    if (tag === 'img') {
                        const srcMatch = open.match(/src=["']([^"']+)["']/i);
                        const altMatch = open.match(/alt=["']([^"']+)["']/i);
                        const src = srcMatch ? srcMatch[1] : '';
                        if (src && !/^data:/i.test(src)) {
                            kids.push({ tag: 'img', attrs: altMatch ? { src, alt: altMatch[1] } : { src } });
                        }
                        continue;
                    }

                    const close = s.match(new RegExp(`</${tag}\\s*>`, 'i'));
                    const inner = close ? s.slice(0, close.index) : '';
                    s = close ? s.slice(close.index + close[0].length) : s;

                    const nested = parseInlineHtml(inner);

                    if (tag === 'a') {
                        const href = (open.match(/href=["']([^"']+)["']/i) || [null, ''])[1];
                        kids.push({ tag: 'a', attrs: { href }, children: nested.length ? nested : [stripRemainingTags(inner)] });
                    } else if (tag === 'b' || tag === 'strong') {
                        kids.push({ tag: 'b', children: nested.length ? nested : [stripRemainingTags(inner)] });
                    } else if (tag === 'i' || tag === 'em') {
                        kids.push({ tag: 'i', children: nested.length ? nested : [stripRemainingTags(inner)] });
                    } else if (tag === 'code') {
                        kids.push({ tag: 'code', children: [decodeEntities(inner.replace(/<[^>]+>/g, ''))] });
                    }
                }

                return kids.filter(n => !(typeof n === 'string' && !n.trim()));
            }

            // 去标签 + 解码实体
            function stripRemainingTags(s) {
                return decodeEntities(s
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' '));
            }

            function decodeEntities(s) {
                return s
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
            }
        }

        // 保存文章记录
        async function saveArticleRecord(db, originalUrl, telegraphUrl, articleData, userId, user = null) {
            try {
                await ensureUserExists(db, userId, user);

                await db.prepare(`
                    INSERT OR REPLACE INTO articles
                    (original_url, telegraph_url, title, author, summary, word_count, created_by)
                    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                `).bind(
                    originalUrl,
                    telegraphUrl,
                    articleData.title,
                    articleData.author,
                    articleData.summary,
                    articleData.wordCount,
                    userId
                ).run();

                console.log('✅ 文章保存到数据库成功');
            } catch (error) {
                console.error('❌ 数据库保存异常:', error.message);
                throw error;
            }
        }

        // 确保用户存在并保存完整信息
        async function ensureUserExists(db, userId, user = null) {
            try {
                const existingUser = await db.prepare('SELECT telegram_id, username, first_name, last_name FROM users WHERE telegram_id = ?1').bind(userId).first();

                const now = new Date().toISOString();

                if (!existingUser) {
                    // 创建新用户记录
                    const username = user?.username || null;
                    const firstName = user?.first_name || null;
                    const lastName = user?.last_name || null;

                    await db.prepare(`
                        INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name, created_at, updated_at)
                        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                    `).bind(userId, username, firstName, lastName, now, now).run();

                    console.log('✅ 创建新用户记录:', userId, {
                        username: username,
                        first_name: firstName,
                        last_name: lastName
                    });
                } else {
                    // 更新现有用户信息（如果有变化）
                    const username = user?.username || existingUser.username;
                    const firstName = user?.first_name || existingUser.first_name;
                    const lastName = user?.last_name || existingUser.last_name;

                    if (username !== existingUser.username ||
                        firstName !== existingUser.first_name ||
                        lastName !== existingUser.last_name) {

                        await db.prepare(`
                            UPDATE users SET username = ?1, first_name = ?2, last_name = ?3, updated_at = ?4
                            WHERE telegram_id = ?5
                        `).bind(username, firstName, lastName, now, userId).run();

                        console.log('✅ 更新用户信息:', userId);
                    }
                }
            } catch (error) {
                console.error('❌ 确保用户存在失败:', error.message);
                throw error;
            }
        }

        // 发送消息
        async function sendMessage(chatId, text, env) {
            try {
                const token = env?.TELEGRAM_BOT_TOKEN || '';
                if (!token) {
                    console.error('❌ Telegram Bot Token未配置');
                    return null;
                }
                const telegramApiUrl = env?.TELEGRAM_API_URL || 'https://api.telegram.org';
                const url = `${telegramApiUrl}/bot${token}/sendMessage`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: text,
                        parse_mode: 'Markdown',
                        disable_web_page_preview: false
                    })
                });

                const result = await response.json();

                if (!result.ok) {
                    console.error('❌ 发送消息失败:', result.description);
                    // 如果Markdown失败，尝试纯文本
                    if (result.description && result.description.includes('can\'t parse entities')) {
                        return await sendPlainMessage(chatId, text, env);
                    }
                }

                return result;
            } catch (error) {
                console.error('❌ 发送消息异常:', error.message);
                throw error;
            }
        }

        // 发送纯文本消息（备用）
        async function sendPlainMessage(chatId, text, env) {
            try {
                const token = env?.TELEGRAM_BOT_TOKEN || '';
                if (!token) {
                    console.error('❌ Telegram Bot Token未配置');
                    return null;
                }
                const telegramApiUrl = env?.TELEGRAM_API_URL || 'https://api.telegram.org';
                const url = `${telegramApiUrl}/bot${token}/sendMessage`;

                // 移除Markdown格式
                const plainText = text
                    .replace(/\*\*(.*?)\*\*/g, '$1')  // 粗体
                    .replace(/\*(.*?)\*/g, '$1')      // 斜体
                    .replace(/```(.*?)```/g, '$1')    // 代码块
                    .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // 链接

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: plainText
                    })
                });

                const result = await response.json();
                return result;
            } catch (error) {
                console.error('❌ 发送纯文本消息异常:', error.message);
                throw error;
            }
        }

        // ===== 权限管理函数 =====

        // 检查用户是否有权限
        async function hasPermission(env, userId) {
            try {
                if (!env || !env.DB) {
                    // 如果没有数据库，默认允许所有人（开发模式）
                    return true;
                }

                const user = await env.DB.prepare(
                    'SELECT is_admin, is_super_admin FROM users WHERE telegram_id = ?1'
                ).bind(userId).first();

                if (!user) {
                    return false; // 用户不存在，没有权限
                }

                return user.is_admin || user.is_super_admin;
            } catch (error) {
                console.error('权限检查失败:', error.message);
                return false;
            }
        }

        // 检查用户是否是管理员
        async function isAdminUser(env, userId) {
            try {
                if (!env || !env.DB) return true;

                const user = await env.DB.prepare(
                    'SELECT is_admin, is_super_admin FROM users WHERE telegram_id = ?1'
                ).bind(userId).first();

                if (!user) return false;
                return user.is_admin || user.is_super_admin;
            } catch (error) {
                console.error('管理员权限检查失败:', error.message);
                return false;
            }
        }

        // 检查用户是否是超级管理员
        async function isSuperAdminUser(env, userId) {
            try {
                if (!env || !env.DB) return true;

                const user = await env.DB.prepare(
                    'SELECT is_super_admin FROM users WHERE telegram_id = ?1'
                ).bind(userId).first();

                if (!user) return false;
                return user.is_super_admin;
            } catch (error) {
                console.error('超级管理员权限检查失败:', error.message);
                return false;
            }
        }

        // 处理管理员命令
        async function handleAdminCommand(chatId, command, userId, env, action) {
            try {
                if (!env || !env.DB) {
                    await sendMessage(chatId, '❌ 数据库连接失败');
                    return;
                }

                const parts = command.split(' ');
                const targetUserId = parseInt(parts[1]);

                if (!targetUserId || isNaN(targetUserId)) {
                    await sendMessage(chatId,
                        '❌ *无效的用户ID*\n\n' +
                        '用法：`/add_admin <user_id>`\n' +
                        '示例：`/add_admin 123456789`'
                    );
                    return;
                }

                // 检查目标用户是否存在
                let targetUser = await env.DB.prepare(
                    'SELECT * FROM users WHERE telegram_id = ?1'
                ).bind(targetUserId).first();

                if (!targetUser) {
                    // 创建新用户记录
                    await env.DB.prepare(`
                        INSERT INTO users (telegram_id, created_at, updated_at)
                        VALUES (?1, ?2, ?3)
                    `).bind(targetUserId, new Date().toISOString(), new Date().toISOString()).run();

                    targetUser = { telegram_id: targetUserId, is_admin: false, is_super_admin: false };
                }

                let successMessage = '';

                switch (action) {
                    case 'admin':
                        await env.DB.prepare(`
                            UPDATE users SET is_admin = TRUE, updated_at = ?1 WHERE telegram_id = ?2
                        `).bind(new Date().toISOString(), targetUserId).run();
                        successMessage = `✅ *管理员添加成功*\n\n用户 ${targetUserId} 已被设置为管理员`;
                        break;

                    case 'remove_admin':
                        await env.DB.prepare(`
                            UPDATE users SET is_admin = FALSE, is_super_admin = FALSE, updated_at = ?1 WHERE telegram_id = ?2
                        `).bind(new Date().toISOString(), targetUserId).run();
                        successMessage = `✅ *管理员权限已移除*\n\n用户 ${targetUserId} 的管理员权限已被移除`;
                        break;

                    case 'super_admin':
                        await env.DB.prepare(`
                            UPDATE users SET is_admin = TRUE, is_super_admin = TRUE, updated_at = ?1 WHERE telegram_id = ?2
                        `).bind(new Date().toISOString(), targetUserId).run();
                        successMessage = `✅ *超级管理员添加成功*\n\n用户 ${targetUserId} 已被设置为超级管理员`;
                        break;
                }

                console.log(`权限操作: ${action} on user ${targetUserId} by ${userId}`);
                await sendMessage(chatId, successMessage);

            } catch (error) {
                console.error('管理员命令处理失败:', error.message);
                await sendMessage(chatId, '❌ 操作失败，请稍后重试');
            }
        }

        // 列出所有管理员
        async function listAdmins(chatId, env) {
            try {
                if (!env || !env.DB) {
                    await sendMessage(chatId, '❌ 数据库连接失败');
                    return;
                }

                const admins = await env.DB.prepare(`
                    SELECT telegram_id, username, first_name, is_admin, is_super_admin, created_at
                    FROM users
                    WHERE is_admin = TRUE OR is_super_admin = TRUE
                    ORDER BY is_super_admin DESC, created_at ASC
                `).all();

                if (!admins.results || admins.results.length === 0) {
                    await sendMessage(chatId, '📋 *管理员列表：*\n\n暂无管理员');
                    return;
                }

                let message = '📋 *管理员列表：*\n\n';

                for (const admin of admins.results) {
                    const role = admin.is_super_admin ? '👑 超级管理员' : '🔧 管理员';
                    const name = admin.first_name || admin.username || `用户${admin.telegram_id}`;
                    const createdDate = new Date(admin.created_at).toLocaleDateString('zh-CN');

                    message += `${role}\n`;
                    message += `👤 ${name} (${admin.telegram_id})\n`;
                    message += `📅 加入时间：${createdDate}\n\n`;
                }

                await sendMessage(chatId, message);

            } catch (error) {
                console.error('获取管理员列表失败:', error.message);
                await sendMessage(chatId, '❌ 获取管理员列表失败');
            }
        }

        // 初始化超级管理员（在第一次部署时调用）
        async function initializeSuperAdmin(env) {
            try {
                if (!env || !env.DB) return;

                // 从环境变量获取超级管理员ID
                const SUPER_ADMIN_ID = parseInt(env?.SUPER_ADMIN_ID) || 0;
                if (SUPER_ADMIN_ID === 0) {
                    console.log('⚠️ 超级管理员ID未配置，跳过初始化');
                    return;
                }

                const existingSuperAdmin = await env.DB.prepare(
                    'SELECT telegram_id FROM users WHERE is_super_admin = TRUE'
                ).first();

                if (!existingSuperAdmin) {
                    await env.DB.prepare(`
                        INSERT OR REPLACE INTO users
                        (telegram_id, is_admin, is_super_admin, created_at, updated_at)
                        VALUES (?1, TRUE, TRUE, ?2, ?3)
                    `).bind(
                        SUPER_ADMIN_ID,
                        new Date().toISOString(),
                        new Date().toISOString()
                    ).run();

                    console.log(`超级管理员初始化完成: ${SUPER_ADMIN_ID}`);
                }
            } catch (error) {
                console.error('超级管理员初始化失败:', error.message);
            }
        }
    }
};