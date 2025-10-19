/**
 * 工具函数
 */

/**
 * 验证URL格式
 * @param {string} url 要验证的URL
 * @param {RegExp} pattern 匹配模式
 * @returns {boolean}
 */
export function isValidUrl(url, pattern = null) {
    if (!url || typeof url !== 'string') return false;

    try {
        new URL(url);
        if (pattern) {
            return pattern.test(url);
        }
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 检查是否为微信公众号文章链接
 * @param {string} url
 * @returns {boolean}
 */
export function isWechatArticle(url) {
    const wechatPattern = /^https?:\/\/mp\.weixin\.qq\.com\/s/;
    return isValidUrl(url, wechatPattern);
}

/**
 * 清理HTML内容
 * @param {string} html 原始HTML
 * @param {string[]} selectorsToRemove 要移除的选择器
 * @returns {string} 清理后的HTML
 */
export function cleanHtml(html, selectorsToRemove = []) {
    if (!html) return '';

    let cleaned = html;

    // 移除不需要的标签和内容
    const patterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /<style[^>]*>[\s\S]*?<\/style>/gi,
        /<!--[\s\S]*?-->/g,
        /\r?\n/g,
        /\s+/g
    ];

    patterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    return cleaned.trim();
}

/**
 * 提取文章标题
 * @param {string} html HTML内容
 * @param {string[]} selectors 标题选择器列表
 * @returns {string} 标题
 */
export function extractTitle(html, selectors = ['h1', 'title']) {
    if (!html) return '';

    for (const selector of selectors) {
        const regex = new RegExp(`<${selector}[^>]*>([^<]+)</${selector}>`, 'i');
        const match = html.match(regex);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return '';
}

/**
 * 提取文章内容
 * @param {string} html HTML内容
 * @param {string[]} selectors 内容选择器列表
 * @returns {string} 内容
 */
export function extractContent(html, selectors = ['div.content', 'article', 'main']) {
    if (!html) return '';

    for (const selector of selectors) {
        // 简单的内容提取，实际项目中可能需要更复杂的解析
        const startTag = `<${selector}`;
        const endTag = `</${selector}>`;

        const startIndex = html.indexOf(startTag);
        if (startIndex !== -1) {
            const contentStart = html.indexOf('>', startIndex) + 1;
            const endIndex = html.indexOf(endTag, contentStart);

            if (endIndex !== -1) {
                return html.substring(contentStart, endIndex);
            }
        }
    }

    return '';
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string}
 */
export function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 格式化日期
 * @param {Date|string|number} date 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * 截断文本
 * @param {string} text 原始文本
 * @param {number} maxLength 最大长度
 * @param {string} suffix 后缀
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 创建内联键盘
 * @param {Array<Array<{text: string, callback_data?: string, url?: string}>>} rows 按钮行
 * @returns {object} 键盘对象
 */
export function createInlineKeyboard(rows) {
    return {
        inline_keyboard: rows.map(row =>
            row.map(button => ({
                text: button.text,
                ...(button.callback_data && { callback_data: button.callback_data }),
                ...(button.url && { url: button.url })
            }))
        )
    };
}

/**
 * 创建回复键盘
 * @param {Array<Array<string>>} rows 按钮行
 * @param {object} options 选项
 * @returns {object} 键盘对象
 */
export function createReplyKeyboard(rows, options = {}) {
    return {
        keyboard: rows,
        resize_keyboard: true,
        one_time_keyboard: options.oneTime || false,
        selective: options.selective || false
    };
}

/**
 * 错误处理包装器
 * @param {Function} fn 要包装的函数
 * @param {string} errorMessage 错误消息
 * @returns {Function} 包装后的函数
 */
export function withErrorHandling(fn, errorMessage = '操作失败') {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(errorMessage, error);
            throw new Error(errorMessage + ': ' + error.message);
        }
    };
}

/**
 * 延迟执行
 * @param {number} ms 延迟时间（毫秒）
 * @returns {Promise}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试机制
 * @param {Function} fn 要重试的函数
 * @param {number} maxRetries 最大重试次数
 * @param {number} delayMs 重试间隔
 * @returns {Promise}
 */
export async function retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries) {
                await delay(delayMs);
            }
        }
    }

    throw lastError;
}