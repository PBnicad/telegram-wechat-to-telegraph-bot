/**
 * Telegraph API 服务
 */
import { TELEGRAPH_API_URL, TELEGRAPH_CONFIG } from '../utils/constants.js';

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
     * @param {string} content 页面内容（HTML格式）
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
            author_url: authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL,
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
            author_url: authorUrl || TELEGRAPH_CONFIG.AUTHOR_URL,
            return_content
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
     * @param {string} content HTML内容
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

        // 将HTML转换为Telegraph格式
        const elements = [];

        // 处理段落
        const paragraphs = content.split(/<\/p>/i);
        for (const paragraph of paragraphs) {
            const cleanParagraph = paragraph.replace(/<p[^>]*>/i, '').trim();
            if (cleanParagraph) {
                elements.push(this.parseHtmlElement(cleanParagraph));
            }
        }

        return elements.length > 0 ? elements : [{ tag: 'p', children: ['内容解析失败'] }];
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
            children: text ? [text] : ['\u00A0'] // 非断行空格
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