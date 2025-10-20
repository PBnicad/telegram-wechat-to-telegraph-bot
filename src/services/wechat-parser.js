/**
 * 微信公众号解析器 - 基于ParseHub架构
 */
// 在Cloudflare Workers环境中使用全局fetch
import { WeChatImageUtils } from '../utils/wechat-utils.js';

export class WeChatParser {
    constructor(options = {}) {
        this.options = {
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            proxy: null,
            ...options
        };
    }

    /**
     * 匹配微信公众号文章URL
     * @param {string} url
     * @returns {boolean}
     */
    static matchUrl(url) {
        const wechatPattern = /^https?:\/\/mp\.weixin\.qq\.com\/s/;
        return wechatPattern.test(url);
    }

    /**
     * 解析微信公众号文章
     * @param {string} url 文章URL
     * @returns {Promise<Object>}
     */
    async parse(url) {
        if (!WeChatParser.matchUrl(url)) {
            throw new Error('Invalid WeChat article URL');
        }

        const cleanUrl = this.cleanUrl(url);

        try {
            const response = await this.fetchWithRetry(cleanUrl);
            const html = await response.text();
            return this.parseHtml(html, cleanUrl);
        } catch (error) {
            throw new Error(`Failed to parse WeChat article: ${error.message}`);
        }
    }

    /**
     * 清理URL，移除不必要的参数
     * @param {string} url
     * @returns {string}
     */
    cleanUrl(url) {
        try {
            // 确保URL有协议
            let fullUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                fullUrl = `https://${url}`;
            }

            const urlObj = new URL(fullUrl);
            const params = new URLSearchParams(urlObj.search);

            // 保留必要参数
            const keepParams = ['__biz', 'mid', 'idx', 'sn', 'chksm'];
            const newParams = new URLSearchParams();

            keepParams.forEach(param => {
                if (params.has(param)) {
                    newParams.set(param, params.get(param));
                }
            });

            urlObj.search = newParams.toString();
            return urlObj.toString();
        } catch (error) {
            // 如果URL解析失败，返回原始URL
            console.warn('Failed to clean URL, returning original:', error);
            return url;
        }
    }

    /**
     * 带重试的fetch请求
     * @param {string} url
     * @param {number} retries
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, retries = 3) {
        const headers = {
            'User-Agent': this.options.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers,
                    signal: AbortSignal.timeout(this.options.timeout),
                    ...(this.options.proxy && { agent: this.options.proxy })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (i === retries - 1) throw error;

                // 指数退避
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    /**
     * 解析HTML内容
     * @param {string} html
     * @param {string} url
     * @returns {Object}
     */
    parseHtml(html, url) {
        try {
            // 使用正则表达式解析（避免依赖DOM解析库）
            const title = this.extractTitle(html);
            const author = this.extractAuthor(html);
            const content = this.extractContent(html);
            const images = WeChatImageUtils.filterValidImages(this.extractImages(html));
            const publishTime = this.extractPublishTime(html);

            // 生成摘要
            const summary = this.generateSummary(content);

            // 计算字数
            const wordCount = this.countWords(content);

            return {
                title,
                author,
                content,
                images,
                summary,
                wordCount,
                publishTime,
                url,
                originalHtml: html
            };
        } catch (error) {
            throw new Error(`Failed to parse HTML: ${error.message}`);
        }
    }

    /**
     * 提取文章标题
     * @param {string} html
     * @returns {string}
     */
    extractTitle(html) {
        // 尝试多种标题提取方式
        const patterns = [
            /<h1[^>]*class="[^"]*rich_media_title[^"]*"[^>]*>(.*?)<\/h1>/is,
            /<title[^>]*>(.*?)<\/title>/is,
            /<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }

        return '未知标题';
    }

    /**
     * 提取作者信息
     * @param {string} html
     * @returns {string}
     */
    extractAuthor(html) {
        const patterns = [
            /<span[^>]*class="[^"]*rich_media_meta[^"]*"[^>]*>(.*?)<\/span>/is,
            /<a[^>]*class="[^"]*rich_media_meta_link[^"]*"[^>]*>(.*?)<\/a>/is,
            /<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }

        return '未知作者';
    }

    /**
     * 提取文章内容
     * @param {string} html
     * @returns {string}
     */
    extractContent(html) {
        // 提取富媒体内容区域
        const contentPatterns = [
            /<div[^>]*class="[^"]*rich_media_content[^"]*"[^>]*>(.*?)<\/div>/is,
            /<div[^>]*id="js_content"[^>]*>(.*?)<\/div>/is
        ];

        let content = '';
        for (const pattern of contentPatterns) {
            const match = html.match(pattern);
            if (match) {
                content = match[1];
                break;
            }
        }

        if (!content) {
            return '无法提取文章内容';
        }

        // 清理内容
        content = this.cleanContent(content);

        // 转换为Markdown格式
        return this.convertToMarkdown(content);
    }

    /**
     * 提取图片链接
     * @param {string} html
     * @returns {Array<string>}
     */
    extractImages(html) {
        const images = [];

        // 匹配data-src属性（微信公众号图片通常使用这个属性）
        const imgPatterns = [
            /<img[^>]*data-src="([^"]*)"[^>]*>/gi,
            /<img[^>]*src="([^"]*)"[^>]*>/gi
        ];

        for (const pattern of imgPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const imgSrc = match[1];
                if (imgSrc && !images.includes(imgSrc)) {
                    images.push(imgSrc);
                }
            }
        }

        return images;
    }

    /**
     * 提取发布时间
     * @param {string} html
     * @returns {Date|null}
     */
    extractPublishTime(html) {
        const patterns = [
            /<em[^>]*class="[^"]*rich_media_meta[^"]*"[^>]*>(.*?)<\/em>/is,
            /<span[^>]*class="[^"]*rich_media_meta[^"]*"[^>]*>(.*?)<\/span>/is,
            /<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                const timeText = this.cleanText(match[1]);
                const date = this.parseDate(timeText);
                if (date) return date;
            }
        }

        return null;
    }

    /**
     * 清理文本内容
     * @param {string} text
     * @returns {string}
     */
    cleanText(text) {
        return text
            .replace(/<[^>]*>/g, '') // 移除HTML标签
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    /**
     * 清理内容
     * @param {string} content
     * @returns {string}
     */
    cleanContent(content) {
        return content
            .replace(/<script[^>]*>.*?<\/script>/gis, '') // 移除脚本
            .replace(/<style[^>]*>.*?<\/style>/gis, '') // 移除样式
            .replace(/<!--.*?-->/gis, '') // 移除注释
            .replace(/\s+/g, ' ') // 压缩空白字符
            .trim();
    }

    /**
     * 转换为Markdown格式
     * @param {string} html
     * @returns {string}
     */
    convertToMarkdown(html) {
        let markdown = html;

        // 处理标题
        markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
        markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
        markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
        markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

        // 处理段落
        markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

        // 处理加粗
        markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

        // 处理斜体
        markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

        // 处理链接
        markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

        // 处理图片
        markdown = markdown.replace(/<img[^>]*data-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
        markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
        markdown = markdown.replace(/<img[^>]*data-src="([^"]*)"[^>]*>/gi, '![]($1)');
        markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

        // 处理换行
        markdown = markdown.replace(/<br[^>]*>/gi, '\n');

        // 处理列表
        markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        });

        markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
            let index = 1;
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
        });

        // 处理代码块
        markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
        markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

        // 处理引用
        markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');

        // 清理剩余的HTML标签
        markdown = markdown.replace(/<[^>]*>/g, '');

        // 清理多余的空行
        markdown = markdown.replace(/\n{3,}/g, '\n\n');

        return markdown.trim();
    }

    /**
     * 生成摘要
     * @param {string} content
     * @returns {string}
     */
    generateSummary(content) {
        // 移除Markdown格式
        const plainText = content
            .replace(/[#*`\[\]()>_~-]/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '[图片]')
            .replace(/\[.*?\]\(.*?\)/g, '$1')
            .replace(/\n+/g, ' ')
            .trim();

        // 限制摘要长度
        const maxLength = 200;
        if (plainText.length <= maxLength) {
            return plainText;
        }

        return plainText.substring(0, maxLength) + '...';
    }

    /**
     * 计算字数
     * @param {string} content
     * @returns {number}
     */
    countWords(content) {
        // 移除Markdown格式，只计算实际内容
        const plainText = content
            .replace(/[#*`\[\]()>_~-]/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '$1')
            .trim();

        // 中文按字符计算，英文按单词计算
        const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length;

        return chineseChars + englishWords;
    }

    /**
     * 解析日期
     * @param {string} dateText
     * @returns {Date|null}
     */
    parseDate(dateText) {
        // 常见的日期格式
        const patterns = [
            /(\d{4})-(\d{1,2})-(\d{1,2})/,
            /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
            /(\d{1,2})-(\d{1,2})-(\d{4})/,
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/
        ];

        for (const pattern of patterns) {
            const match = dateText.match(pattern);
            if (match) {
                let year, month, day;
                if (match[1].length === 4) {
                    [_, year, month, day] = match;
                } else {
                    [_, day, month, year] = match;
                }

                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        return null;
    }
}

export default WeChatParser;