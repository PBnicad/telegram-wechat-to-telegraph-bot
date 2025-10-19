/**
 * 自定义爬虫服务 - 适用于Cloudflare Workers环境
 * 替代Crawlee，使用fetch API和HTML解析
 */
import { WECHAT_PARSER_CONFIG, HTTP_CONFIG } from '../utils/constants.js';
import { cleanHtml, extractTitle, extractContent, retry } from '../utils/helpers.js';

export class CrawlerService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.headers = {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
    }

    /**
     * 获取微信公众号文章内容
     * @param {string} url 微信文章URL
     * @returns {Promise<object>} 文章内容
     */
    async fetchWechatArticle(url) {
        return await retry(async () => {
            const response = await this.fetchWithRetry(url, {
                headers: this.headers,
                timeout: HTTP_CONFIG.TIMEOUT
            });

            const html = await response.text();
            return this.parseWechatArticle(html, url);
        }, HTTP_CONFIG.MAX_RETRIES, HTTP_CONFIG.RETRY_DELAY);
    }

    /**
     * 解析微信公众号文章内容
     * @param {string} html HTML内容
     * @param {string} originalUrl 原始URL
     * @returns {object} 解析后的文章内容
     */
    parseWechatArticle(html, originalUrl) {
        try {
            // 提取标题
            const title = this.extractTitle(html);

            // 提取作者
            const author = this.extractAuthor(html);

            // 提取发布时间
            const publishTime = this.extractPublishTime(html);

            // 提取内容
            const content = this.extractMainContent(html);

            // 生成摘要
            const summary = this.generateSummary(content);

            // 清理和转换内容为Telegraph格式
            const telegraphContent = this.convertToTelegraphFormat(content);

            return {
                title: title || '未命名文章',
                author: author || '未知作者',
                publishTime,
                content: telegraphContent,
                summary,
                originalUrl,
                wordCount: this.countWords(content)
            };
        } catch (error) {
            console.error('Error parsing WeChat article:', error);
            throw new Error('Failed to parse article content');
        }
    }

    /**
     * 提取文章标题
     * @param {string} html HTML内容
     * @returns {string}
     */
    extractTitle(html) {
        const titleSelectors = [
            'h1#activity-name',
            'h1.rich_media_title',
            '.rich_media_title',
            'h1',
            'title'
        ];

        for (const selector of titleSelectors) {
            const title = this.extractTextBySelector(html, selector);
            if (title && title.trim()) {
                return title.trim();
            }
        }

        return '';
    }

    /**
     * 提取作者信息
     * @param {string} html HTML内容
     * @returns {string}
     */
    extractAuthor(html) {
        const authorSelectors = [
            '.rich_media_meta_nickname',
            '#js_author_name',
            '.author_name',
            '[data-nickname]'
        ];

        for (const selector of authorSelectors) {
            const author = this.extractTextBySelector(html, selector);
            if (author && author.trim()) {
                return author.trim();
            }
        }

        return '';
    }

    /**
     * 提取发布时间
     * @param {string} html HTML内容
     * @returns {string|null}
     */
    extractPublishTime(html) {
        const timeSelectors = [
            '.rich_media_meta_text',
            '#publish_time',
            '.publish_time',
            'time'
        ];

        for (const selector of timeSelectors) {
            const timeText = this.extractTextBySelector(html, selector);
            if (timeText) {
                // 尝试解析时间格式
                const timeMatch = timeText.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
                if (timeMatch) {
                    return timeMatch[1];
                }
            }
        }

        return null;
    }

    /**
     * 提取主要内容
     * @param {string} html HTML内容
     * @returns {string}
     */
    extractMainContent(html) {
        const contentSelectors = [
            '#js_content',
            '.rich_media_content',
            '.rich_media_area_primary',
            'article',
            '.content'
        ];

        for (const selector of contentSelectors) {
            const content = this.extractHtmlBySelector(html, selector);
            if (content && content.trim()) {
                return this.cleanArticleContent(content);
            }
        }

        return '';
    }

    /**
     * 根据选择器提取文本
     * @param {string} html HTML内容
     * @param {string} selector CSS选择器
     * @returns {string}
     */
    extractTextBySelector(html, selector) {
        // 简单的CSS选择器解析，实际项目中可能需要更复杂的解析器
        const tagMatch = selector.match(/^([a-z1-6]+)(?:#([^\s]+))?(?:\.([^\s]+))?$/);
        if (!tagMatch) return '';

        const [, tagName, id, className] = tagMatch;

        let pattern = `<${tagName}`;
        if (id) pattern += `[^>]*id=["']${id}["']`;
        if (className) pattern += `[^>]*class=["'][^"']*\\b${className}\\b[^"']*["']`;
        pattern += `[^>]*>([^<]+)</${tagName}>`;

        const match = html.match(new RegExp(pattern, 'i'));
        return match ? match[1] : '';
    }

    /**
     * 根据选择器提取HTML
     * @param {string} html HTML内容
     * @param {string} selector CSS选择器
     * @returns {string}
     */
    extractHtmlBySelector(html, selector) {
        const tagMatch = selector.match(/^([a-z1-6]+)(?:#([^\s]+))?(?:\.([^\s]+))?$/);
        if (!tagMatch) return '';

        const [, tagName, id, className] = tagMatch;

        let startPattern = `<${tagName}`;
        if (id) startPattern += `[^>]*id=["']${id}["']`;
        if (className) startPattern += `[^>]*class=["'][^"']*\\b${className}\\b[^"']*["']`;
        startPattern += `[^>]*>`;

        const endTag = `</${tagName}>`;

        const startIndex = html.search(new RegExp(startPattern, 'i'));
        if (startIndex === -1) return '';

        const contentStart = html.indexOf('>', startIndex) + 1;
        let endIndex = contentStart;
        let depth = 1;

        // 简单的标签匹配，处理嵌套
        const openTagPattern = new RegExp(`<${tagName}[^>]*>`, 'gi');
        const closeTagPattern = new RegExp(`</${tagName}>`, 'gi');

        const searchContent = html.substring(contentStart);
        const openMatches = [...searchContent.matchAll(openTagPattern)];
        const closeMatches = [...searchContent.matchAll(closeTagPattern)];

        // 找到匹配的结束标签
        let currentPos = 0;
        for (const closeMatch of closeMatches) {
            depth--;
            if (depth === 0) {
                endIndex = contentStart + closeMatch.index + closeMatch[0].length;
                break;
            }
            currentPos = closeMatch.index + closeMatch[0].length;

            // 检查在这个位置之前是否有新的开标签
            const nextOpenMatch = openMatches.find(m => m.index > currentPos && m.index < closeMatch.index);
            if (nextOpenMatch) {
                depth++;
            }
        }

        return html.substring(contentStart, endIndex);
    }

    /**
     * 清理文章内容
     * @param {string} content 原始内容
     * @returns {string} 清理后的内容
     */
    cleanArticleContent(content) {
        // 移除不需要的元素
        const unwantedPatterns = [
            /<script[^>]*>[\s\S]*?<\/script>/gi,
            /<style[^>]*>[\s\S]*?<\/style>/gi,
            /<div[^>]*class="[^"]*qr_code[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<div[^>]*class="[^"]*reward[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<div[^>]*class="[^"]*profile[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<!--[\s\S]*?-->/g,
            /&nbsp;/g,
            /\r?\n\s+/g
        ];

        let cleaned = content;
        unwantedPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, ' ');
        });

        return cleaned.trim();
    }

    /**
     * 转换为Telegraph格式
     * @param {string} content 原始内容
     * @returns {string} Telegraph格式的内容
     */
    convertToTelegraphFormat(content) {
        // 将HTML转换为Telegraph支持的格式
        let telegraphContent = content;

        // 处理图片
        telegraphContent = telegraphContent.replace(
            /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
            '<img src="$1" alt="$2">'
        );

        // 处理链接
        telegraphContent = telegraphContent.replace(
            /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi,
            '<a href="$1">$2</a>'
        );

        // 处理段落
        telegraphContent = telegraphContent.replace(/<p[^>]*>/gi, '<p>');
        telegraphContent = telegraphContent.replace(/<div[^>]*>/gi, '<p>');
        telegraphContent = telegraphContent.replace(/<\/div>/gi, '</p>');

        // 处理标题
        telegraphContent = telegraphContent.replace(/<h([1-6])[^>]*>/gi, '<h$1>');
        telegraphContent = telegraphContent.replace(/<strong[^>]*>/gi, '<b>');
        telegraphContent = telegraphContent.replace(/<\/strong>/gi, '</b>');
        telegraphContent = telegraphContent.replace(/<em[^>]*>/gi, '<i>');
        telegraphContent = telegraphContent.replace(/<\/em>/gi, '</i>');

        // 清理多余的空标签
        telegraphContent = telegraphContent.replace(/<[^>]*><\/[^>]*>/g, '');
        telegraphContent = telegraphContent.replace(/\s+/g, ' ');

        return telegraphContent.trim();
    }

    /**
     * 生成文章摘要
     * @param {string} content 文章内容
     * @param {number} maxLength 最大长度
     * @returns {string}
     */
    generateSummary(content, maxLength = 200) {
        // 移除HTML标签
        const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

        if (textContent.length <= maxLength) {
            return textContent;
        }

        // 尝试在句号或感叹号处截断
        const truncated = textContent.substring(0, maxLength);
        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('。'),
            truncated.lastIndexOf('！'),
            truncated.lastIndexOf('？')
        );

        if (lastSentenceEnd > maxLength * 0.7) {
            return truncated.substring(0, lastSentenceEnd + 1);
        }

        return truncated + '...';
    }

    /**
     * 计算字数
     * @param {string} content 内容
     * @returns {number}
     */
    countWords(content) {
        const textContent = content.replace(/<[^>]*>/g, '');
        // 支持中文字数统计
        const chineseChars = (textContent.match(/[\u4e00-\u9fff]/g) || []).length;
        const englishWords = (textContent.match(/[a-zA-Z]+/g) || []).length;
        return chineseChars + englishWords;
    }

    /**
     * 带重试的fetch请求
     * @param {string} url 请求URL
     * @param {object} options 请求选项
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, options = {}) {
        const defaultOptions = {
            headers: this.headers,
            timeout: HTTP_CONFIG.TIMEOUT
        };

        const finalOptions = { ...defaultOptions, ...options };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

        try {
            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 验证URL是否为微信公众号文章
     * @param {string} url URL
     * @returns {boolean}
     */
    isValidWechatUrl(url) {
        const wechatPattern = /^https?:\/\/mp\.weixin\.qq\.com\/s/;
        return wechatPattern.test(url);
    }

    /**
     * 获取页面基本信息
     * @param {string} url 页面URL
     * @returns {Promise<object>}
     */
    async getPageInfo(url) {
        try {
            const response = await this.fetchWithRetry(url);
            const html = await response.text();

            const title = this.extractTitle(html);
            const description = this.extractMetaDescription(html);

            return {
                url,
                title: title || '未知标题',
                description,
                isValid: this.isValidWechatUrl(url)
            };
        } catch (error) {
            console.error('Error getting page info:', error);
            return {
                url,
                title: '获取失败',
                description: '',
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * 提取meta描述
     * @param {string} html HTML内容
     * @returns {string}
     */
    extractMetaDescription(html) {
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        return descMatch ? descMatch[1] : '';
    }
}