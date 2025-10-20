/**
 * 微信公众号相关数据类型定义
 */

/**
 * 微信文章解析结果
 */
export class WeChatParseResult {
    /**
     * @param {Object} options
     * @param {string} options.title 文章标题
     * @param {string} options.author 作者
     * @param {string} options.content 文章内容（Markdown格式）
     * @param {Array<string>} options.images 图片链接列表
     * @param {string} options.summary 文章摘要
     * @param {number} options.wordCount 字数统计
     * @param {Date|null} options.publishTime 发布时间
     * @param {string} options.url 原始URL
     * @param {string} options.originalHtml 原始HTML内容
     * @param {string|null} options.aiSummary AI生成总结
     */
    constructor({
        title,
        author,
        content,
        images,
        summary,
        wordCount,
        publishTime,
        url,
        originalHtml,
        aiSummary
    }) {
        this.title = title || '';
        this.author = author || '';
        this.content = content || '';
        this.images = images || [];
        this.summary = summary || '';
        this.wordCount = wordCount || 0;
        this.publishTime = publishTime || null;
        this.url = url || '';
        this.originalHtml = originalHtml || '';
        this.aiSummary = aiSummary || null;
        this.parseTime = new Date();
    }

    /**
     * 获取格式化的发布时间
     * @returns {string}
     */
    getFormattedPublishTime() {
        if (!this.publishTime) return '未知时间';

        return this.publishTime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 获取文章预览
     * @param {number} maxLength 最大长度
     * @returns {string}
     */
    getPreview(maxLength = 100) {
        const preview = this.summary || this.content;
        if (preview.length <= maxLength) {
            return preview;
        }
        return preview.substring(0, maxLength) + '...';
    }

    /**
     * 转换为JSON格式
     * @returns {Object}
     */
    toJSON() {
        return {
            title: this.title,
            author: this.author,
            content: this.content,
            images: this.images,
            summary: this.summary,
            wordCount: this.wordCount,
            publishTime: this.publishTime?.toISOString() || null,
            url: this.url,
            parseTime: this.parseTime.toISOString()
        };
    }

    /**
     * 验证解析结果的有效性
     * @returns {boolean}
     */
    isValid() {
        return !!(this.title && this.content && this.url);
    }

    /**
     * 获取文章主要信息
     * @returns {Object}
     */
    getMetadata() {
        return {
            title: this.title,
            author: this.author,
            wordCount: this.wordCount,
            imageCount: this.images.length,
            publishTime: this.getFormattedPublishTime(),
            hasContent: !!this.content,
            hasImages: this.images.length > 0
        };
    }
}

/**
 * Telegraph转换结果
 */
export class TelegraphResult {
    /**
     * @param {Object} options
     * @param {string} options.url Telegraph链接
     * @param {string} options.title 页面标题
     * @param {string} options.author 作者名称
     * @param {number} options.views 浏览次数
     * @param {Date} options.createTime 创建时间
     */
    constructor({
        url,
        title,
        author,
        views = 0,
        createTime = new Date()
    }) {
        this.url = url || '';
        this.title = title || '';
        this.author = author || '';
        this.views = views;
        this.createTime = createTime;
    }

    /**
     * 获取短链接（可选实现）
     * @returns {string}
     */
    getShortUrl() {
        // 这里可以实现短链接生成逻辑
        return this.url;
    }

    /**
     * 转换为JSON格式
     * @returns {Object}
     */
    toJSON() {
        return {
            url: this.url,
            title: this.title,
            author: this.author,
            views: this.views,
            createTime: this.createTime.toISOString()
        };
    }
}

/**
 * 解析错误类型
 */
export class WeChatParseError extends Error {
    /**
     * @param {string} message 错误消息
     * @param {string} code 错误代码
     * @param {Object} details 错误详情
     */
    constructor(message, code = 'PARSE_ERROR', details = {}) {
        super(message);
        this.name = 'WeChatParseError';
        this.code = code;
        this.details = details;
    }

    /**
     * 创建网络错误
     * @param {string} message
     * @param {Object} details
     * @returns {WeChatParseError}
     */
    static networkError(message = 'Network error occurred', details = {}) {
        return new WeChatParseError(message, 'NETWORK_ERROR', details);
    }

    /**
     * 创建解析错误
     * @param {string} message
     * @param {Object} details
     * @returns {WeChatParseError}
     */
    static parseError(message = 'Failed to parse content', details = {}) {
        return new WeChatParseError(message, 'PARSE_ERROR', details);
    }

    /**
     * 创建URL错误
     * @param {string} message
     * @param {Object} details
     * @returns {WeChatParseError}
     */
    static urlError(message = 'Invalid URL format', details = {}) {
        return new WeChatParseError(message, 'URL_ERROR', details);
    }

    /**
     * 创建超时错误
     * @param {string} message
     * @param {Object} details
     * @returns {WeChatParseError}
     */
    static timeoutError(message = 'Request timeout', details = {}) {
        return new WeChatParseError(message, 'TIMEOUT_ERROR', details);
    }
}

/**
 * 解析配置类
 */
export class WeChatParseConfig {
    /**
     * @param {Object} options
     * @param {number} options.timeout 请求超时时间（毫秒）
     * @param {string} options.userAgent User-Agent字符串
     * @param {string} options.proxy 代理设置
     * @param {boolean} options.enableImageExtraction 是否启用图片提取
     * @param {boolean} options.enableMarkdownConversion 是否启用Markdown转换
     * @param {number} options.maxRetries 最大重试次数
     * @param {number} options.retryDelay 重试延迟（毫秒）
     */
    constructor({
        timeout = 30000,
        userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        proxy = null,
        enableImageExtraction = true,
        enableMarkdownConversion = true,
        maxRetries = 3,
        retryDelay = 1000
    } = {}) {
        this.timeout = timeout;
        this.userAgent = userAgent;
        this.proxy = proxy;
        this.enableImageExtraction = enableImageExtraction;
        this.enableMarkdownConversion = enableMarkdownConversion;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
    }

    /**
     * 创建默认配置
     * @returns {WeChatParseConfig}
     */
    static createDefault() {
        return new WeChatParseConfig();
    }

    /**
     * 创建快速配置（较低质量，更快速度）
     * @returns {WeChatParseConfig}
     */
    static createFast() {
        return new WeChatParseConfig({
            timeout: 10000,
            enableImageExtraction: false,
            maxRetries: 1
        });
    }

    /**
     * 创建高质量配置（更高质量，较慢速度）
     * @returns {WeChatParseConfig}
     */
    static createHighQuality() {
        return new WeChatParseConfig({
            timeout: 60000,
            maxRetries: 5,
            retryDelay: 2000
        });
    }
}

export default {
    WeChatParseResult,
    TelegraphResult,
    WeChatParseError,
    WeChatParseConfig
};