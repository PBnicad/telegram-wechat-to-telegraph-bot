/**
 * Telegraph API 服务
 */
import { TELEGRAPH_API_URL, TELEGRAPH_CONFIG } from '../utils/constants.js';
import { WeChatImageUtils } from '../utils/wechat-utils.js';
import { marked } from 'marked';

export class TelegraphService {
    constructor(accessToken = null) {
        this.apiUrl = TELEGRAPH_API_URL;
        this.accessToken = accessToken;
    }

    /**
     * 创建Telegraph账户
     * @param {string} shortName 短名称
     * @param {string} authorName 作者名称
     * @param {string} authorUrl 作者URL
     * @returns {Promise<object>}
     */
    async createAccount(shortName = 'Telegram Bot', authorName = null, authorUrl = null) {
        const payload = {
            short_name: shortName,
            author_name: authorName || TELEGRAPH_CONFIG.AUTHOR_NAME,
            author_url: authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL
        };

        try {
            const response = await this.request('createAccount', payload);
            this.accessToken = response.access_token;
            return response;
        } catch (error) {
            console.error('Error creating Telegraph account:', error);
            throw new Error('Failed to create Telegraph account');
        }
    }

    /**
     * 创建Telegraph页面
     * @param {string} title 页面标题
     * @param {string} content 页面内容（Markdown格式）
     * @param {string} authorName 作者名称
     * @param {string} authorUrl 作者URL
     * @param {boolean} returnContent 是否返回内容
     * @returns {Promise<object>}
     */
    async createPage(title, content, authorName = null, authorUrl = null, returnContent = false) {
        if (!this.accessToken) {
            await this.createAccount();
        }

        const payload = {
            access_token: this.accessToken,
            title: title || TELEGRAPH_CONFIG.DEFAULT_TITLE,
            content: this.formatContent(content),
            author_name: authorName || TELEGRAPH_CONFIG.AUTHOR_NAME,
            ...(authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL ? { author_url: authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL } : {}),
            return_content: returnContent
        };

        try {
            const response = await this.request('createPage', payload);
            return response;
        } catch (error) {
            console.error('Error creating Telegraph page:', error);
            throw new Error('Failed to create Telegraph page');
        }
    }

    /**
     * 编辑Telegraph页面
     * @param {string} path 页面路径
     * @param {string} title 页面标题
     * @param {string} content 页面内容
     * @param {string} authorName 作者名称
     * @param {string} authorUrl 作者URL
     * @param {boolean} returnContent 是否返回内容
     * @returns {Promise<object>}
     */
    async editPage(path, title, content, authorName = null, authorUrl = null, returnContent = false) {
        if (!this.accessToken) {
            throw new Error('Access token is required for editing pages');
        }

        const payload = {
            access_token: this.accessToken,
            path,
            title: title || TELEGRAPH_CONFIG.DEFAULT_TITLE,
            content: this.formatContent(content),
            author_name: authorName || TELEGRAPH_CONFIG.AUTHOR_NAME,
            ...(authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL ? { author_url: authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL } : {}),
            return_content: returnContent
        };

        try {
            const response = await this.request('editPage', payload);
            return response;
        } catch (error) {
            console.error('Error editing Telegraph page:', error);
            throw new Error('Failed to edit Telegraph page');
        }
    }

    /**
     * 获取Telegraph页面信息
     * @param {string} path 页面路径
     * @param {boolean} returnContent 是否返回内容
     * @returns {Promise<object>}
     */
    async getPage(path, returnContent = false) {
        const payload = {
            path,
            return_content: returnContent
        };

        try {
            const response = await this.request('getPage', payload);
            return response;
        } catch (error) {
            console.error('Error getting Telegraph page:', error);
            throw new Error('Failed to get Telegraph page');
        }
    }

    /**
     * 获取账户信息
     * @param {Array<string>} fields 要返回的字段
     * @returns {Promise<object>}
     */
    async getAccountInfo(fields = ['short_name', 'author_name', 'author_url']) {
        if (!this.accessToken) {
            throw new Error('Access token is required for getting account info');
        }

        const payload = {
            access_token: this.accessToken,
            fields: JSON.stringify(fields)
        };

        try {
            const response = await this.request('getAccountInfo', payload);
            return response;
        } catch (error) {
            console.error('Error getting account info:', error);
            throw new Error('Failed to get account info');
        }
    }

    /**
     * 获取页面列表
     * @param {number} offset 偏移量
     * @param {number} limit 限制数量
     * @returns {Promise<object>}
     */
    async getPageList(offset = 0, limit = 50) {
        if (!this.accessToken) {
            throw new Error('Access token is required for getting page list');
        }

        const payload = {
            access_token: this.accessToken,
            offset,
            limit
        };

        try {
            const response = await this.request('getPageList', payload);
            return response;
        } catch (error) {
            console.error('Error getting page list:', error);
            throw new Error('Failed to get page list');
        }
    }

    /**
     * 获取页面访问次数
     * @param {string} path 页面路径
     * @param {number} year 年份
     * @param {number} month 月份
     * @param {number} day 日期
     * @param {number} hour 小时
     * @returns {Promise<object>}
     */
    async getViews(path, year = null, month = null, day = null, hour = null) {
        const payload = {
            path,
            ...(year && { year }),
            ...(month && { month }),
            ...(day && { day }),
            ...(hour && { hour })
        };

        try {
            const response = await this.request('getViews', payload);
            return response;
        } catch (error) {
            console.error('Error getting page views:', error);
            throw new Error('Failed to get page views');
        }
    }

    /**
     * 格式化内容为Telegraph API要求的格式
     * 管线：Markdown → HTML(marked) → 清洗(cleanArticleHtml) → 解析为Telegraph节点
     * @param {string} content Markdown或HTML内容
     * @returns {Array} Telegraph内容数组
     */
    formatContent(content) {
        if (!content) {
            return [{ tag: 'p', children: ['内容为空'] }];
        }

        // 如果内容已经是数组格式，直接返回
        if (Array.isArray(content)) {
            return content;
        }

        // Step 1: Markdown → HTML（与 parsehub 的 markdown(md) 一致）
        let html;
        const looksLikeHtml = /<\s*\w+[^>]*>/i.test(content);
        if (looksLikeHtml) {
            html = content;
        } else {
            html = marked.parse(content);
        }

        // Step 2: 清洗HTML（与 parsehub 的 clean_article_html 一致）
        html = cleanArticleHtml(html);

        // Step 3: 清理脚本和样式
        html = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');

        const elements = [];

        // 解析常见块级元素并保留更细粒度的内联样式
        const blockRegex = /<(h[1-6]|p|blockquote|ul|ol|pre|figure|div)[^>]*>([\s\S]*?)<\/\1>/gi;
        let last = 0; let m;

        while ((m = blockRegex.exec(html)) !== null) {
            const before = html.slice(last, m.index);
            pushInlineFragments(before, elements);

            const tag = m[1].toLowerCase();
            const inner = m[2];

            if (tag.startsWith('h')) {
                const level = parseInt(tag.substring(1), 10);
                const mapped = level <= 2 ? 'h3' : 'h4';
                elements.push({ tag: mapped, children: parseInlineHtml(inner) });
            } else if (tag === 'p' || tag === 'div') {
                pushParagraph(inner, elements);
            } else if (tag === 'blockquote') {
                const paras = inner.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
                if (paras.length) {
                    elements.push({ tag: 'blockquote', children: paras.map(p => ({ tag: 'p', children: parseInlineHtml(p.replace(/<\/?p[^>]*>/gi, '')) })) });
                } else {
                    elements.push({ tag: 'blockquote', children: [{ tag: 'p', children: parseInlineHtml(inner) }] });
                }
            } else if (tag === 'ul' || tag === 'ol') {
                const lis = inner.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
                const items = lis.map(li => {
                    const liInner = li.replace(/<\/?li[^>]*>/gi, '');
                    return { tag: 'li', children: parseInlineHtml(liInner) };
                });
                if (items.length) elements.push({ tag, children: items });
            } else if (tag === 'pre') {
                const codeMatch = inner.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
                const codeText = decodeEntities((codeMatch ? codeMatch[1] : inner).replace(/<[^>]+>/g, ''));
                elements.push({ tag: 'pre', children: [codeText.trim()] });
            } else if (tag === 'figure') {
                const imgMatch = inner.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
                const src = imgMatch ? WeChatImageUtils.convertImageUrl(imgMatch[1]) : null;
                if (src && !/^data:/i.test(src)) elements.push({ tag: 'img', attrs: { src } });
                const cap = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
                if (cap) elements.push({ tag: 'figcaption', children: parseInlineHtml(cap[1]) });
            }

            last = blockRegex.lastIndex;
        }

        const tail = html.slice(last);
        pushInlineFragments(tail, elements);

        return elements.length > 0 ? elements : [{ tag: 'p', children: ['内容解析失败'] }];

        // ==== 辅助函数：内联解析与实体解码 ====
        function pushInlineFragments(fragment, out) {
            if (!fragment) return;
            // 独立输出图片，跳过Base64
            for (const im of fragment.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
                const src = WeChatImageUtils.convertImageUrl(im[1]);
                if (src && !/^data:/i.test(src)) out.push({ tag: 'img', attrs: { src } });
            }
            // 文本按段落包装
            const children = parseInlineHtml(fragment.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, ''));
            const paragraphKids = children.filter(n => !(typeof n === 'object' && n.tag === 'img'));
            if (paragraphKids.some(n => typeof n === 'string' ? n.trim() : true)) {
                out.push({ tag: 'p', children: paragraphKids.length ? paragraphKids : [' '] });
            }
        }

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
                    const src = srcMatch ? WeChatImageUtils.convertImageUrl(srcMatch[1]) : '';
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

    /**
     * 解析HTML元素为Telegraph格式
     * @param {string} html HTML字符串
     * @returns {object} Telegraph元素
     */
    parseHtmlElement(html) {
        // 处理标题
        if (html.match(/^<h[1-6]/i)) {
            const level = html.match(/<h([1-6])/i)[1];
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: `h${level}`,
                children: [text]
            };
        }

        // 处理图片
        if (html.match(/^<img/i)) {
            const srcMatch = html.match(/src="([^"]*)"/i);
            const altMatch = html.match(/alt="([^"]*)"/i);
            return {
                tag: 'img',
                attrs: {
                    src: srcMatch ? srcMatch[1] : '',
                    ...(altMatch && { alt: altMatch[1] })
                }
            };
        }

        // 处理链接
        if (html.match(/^<a/i)) {
            const hrefMatch = html.match(/href="([^"]*)"/i);
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: 'a',
                attrs: {
                    href: hrefMatch ? hrefMatch[1] : ''
                },
                children: [text]
            };
        }

        // 处理引用
        if (html.match(/^<blockquote/i)) {
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: 'blockquote',
                children: [text]
            };
        }

        // 处理列表
        if (html.match(/^<[ou]l/i)) {
            const listItems = html.split(/<li[^>]*>/i).filter(item => item.trim());
            const items = listItems.map(item => {
                const text = item.replace(/<\/?li[^>]*>/gi, '').trim();
                return {
                    tag: 'li',
                    children: [text]
                };
            });
            return {
                tag: html.match(/^<ol/i) ? 'ol' : 'ul',
                children: items
            };
        }

        // 处理代码块
        if (html.match(/^<pre/i)) {
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: 'pre',
                children: [text]
            };
        }

        // 处理行内代码
        if (html.match(/^<code/i)) {
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: 'code',
                children: [text]
            };
        }

        // 处理粗体
        if (html.match(/<(strong|b)/i)) {
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: 'b',
                children: [text]
            };
        }

        // 处理斜体
        if (html.match(/<(em|i)/i)) {
            const text = html.replace(/<[^>]*>/g, '').trim();
            return {
                tag: 'i',
                children: [text]
            };
        }

        // 默认处理为段落
        const text = html.replace(/<[^>]*>/g, '').trim();
        return {
            tag: 'p',
            children: text ? [text] : [' '] // 非断行空格
        };
    }

    /**
     * 生成Telegraph页面URL
     * @param {string} path 页面路径
     * @returns {string} 完整的URL
     */
    buildPageUrl(path) {
        return `https://telegra.ph/${path}`;
    }

    /**
     * 验证Telegraph URL
     * @param {string} url URL
     * @returns {boolean}
     */
    isValidTelegraphUrl(url) {
        const telegraphPattern = /^https?:\/\/telegra\.ph\/[^\/]+\/[a-zA-Z0-9-]+$/;
        return telegraphPattern.test(url);
    }

    /**
     * 从URL中提取页面路径
     * @param {string} url Telegraph URL
     * @returns {string|null} 页面路径
     */
    extractPathFromUrl(url) {
        const match = url.match(/telegra\.ph\/(.+)/);
        return match ? match[1] : null;
    }

    /**
     * 发送API请求
     * @param {string} method API方法名
     * @param {object} payload 请求数据
     * @returns {Promise<object>}
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

            if (!response.ok) {
                throw new Error(`Telegraph API error: ${data.error || 'Unknown error'}`);
            }

            if (data.ok === false) {
                throw new Error(`Telegraph API error: ${data.error || 'Unknown error'}`);
            }

            return data.result || data;
        } catch (error) {
            console.error(`Telegraph API request failed: ${method}`, error);
            throw error;
        }
    }

    /**
     * 设置访问令牌
     * @param {string} token 访问令牌
     */
    setAccessToken(token) {
        this.accessToken = token;
    }

    /**
     * 获取访问令牌
     * @returns {string}
     */
    getAccessToken() {
        return this.accessToken;
    }

    /**
     * 检查是否有有效的访问令牌
     * @returns {boolean}
     */
    hasValidAccessToken() {
        return !!this.accessToken;
    }
}

/**
 * 清洗HTML内容，与 parsehub 的 clean_article_html 逻辑完全一致：
 * 1. h1 → h3, b → strong, h2/h5/h6 → h4
 * 2. 移除 <head>
 * 3. 只保留 Telegraph 支持的标签和属性
 * 4. 规范化空白（保留 <pre> 内的换行）
 * @param {string} html 输入HTML
 * @returns {string} 清洗后的HTML
 */
function cleanArticleHtml(html) {
    if (!html) return '';

    let result = html;

    // 标题级别映射：h1 → h3, h2/h5/h6 → h4（Telegraph只支持h3和h4）
    result = result.replace(/<h1/gi, '<h3').replace(/<\/h1>/gi, '</h3>');
    result = result.replace(/<h2/gi, '<h4').replace(/<\/h2>/gi, '</h4>');
    result = result.replace(/<h5/gi, '<h4').replace(/<\/h5>/gi, '</h4>');
    result = result.replace(/<h6/gi, '<h4').replace(/<\/h6>/gi, '</h4>');

    // b → strong（Telegraph使用strong）
    result = result.replace(/<(\/?)b(\s|>)/gi, '<$1strong$2');

    // 移除 <head> 块
    result = result.replace(/<head[^a-z][\s\S]*<\/head>/gi, '');

    // 标签白名单（与 parsehub 的 allowed_tags 一致）
    const allowedTags = new Set([
        'a', 'aside', 'b', 'blockquote', 'br', 'code', 'em',
        'figcaption', 'figure', 'h3', 'h4', 'hr', 'i', 'img',
        'li', 'ol', 'p', 'pre', 's', 'strong', 'u', 'ul', 'video'
    ]);

    // 属性白名单（与 parsehub 的 safe_attrs 一致）
    const allowedAttrs = { img: ['src', 'alt'], a: ['href'] };

    // 用正则逐标签过滤
    result = result.replace(/<(\w+)([^>]*)>/gi, (match, tagName, attrs) => {
        const tag = tagName.toLowerCase();

        // 闭合标签
        if (!allowedTags.has(tag)) {
            return '';
        }

        // 解析属性
        const attrRegex = /(\w+)=["']([^"']*)["']/gi;
        const allowedForTag = allowedAttrs[tag] || [];
        let filteredAttrs = '';
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
            const attrName = attrMatch[1].toLowerCase();
            const attrValue = attrMatch[2];
            if (allowedForTag.includes(attrName)) {
                filteredAttrs += ` ${attrName}="${attrValue}"`;
            }
        }

        return `<${tag}${filteredAttrs}>`;
    });

    // 移除不在白名单中的闭合标签
    result = result.replace(/<\/(\w+)>/gi, (match, tagName) => {
        return allowedTags.has(tagName.toLowerCase()) ? match : '';
    });

    // 规范化空白（保留 <pre> 内的换行）
    result = normalizeWhitespace(result);

    return result.trim();
}

/**
 * 规范化HTML空白，保留 <pre> 和 <code> 内的换行
 * @param {string} html
 * @returns {string}
 */
function normalizeWhitespace(html) {
    // 将 &nbsp; 替换为普通空格
    html = html.replace(/ /g, ' ');

    // 将连续的 <br> 标签合并为一个换行
    html = html.replace(/(<br\s*\/?>\s*)+/gi, '\n');

    // 在 <pre>/<code> 外部压缩空白
    const parts = html.split(/(<pre[^>]*>[\s\S]*?<\/pre>|<code[^>]*>[\s\S]*?<\/code>)/gi);
    for (let i = 0; i < parts.length; i++) {
        // 奇数索引是 <pre>/<code> 块，不处理
        if (i % 2 === 0) {
            parts[i] = parts[i].replace(/\s+/g, ' ');
        }
    }

    return parts.join('');
}