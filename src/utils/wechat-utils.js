/**
 * 微信解析相关工具函数
 */

/**
 * URL处理工具
 */
export class WeChatUrlUtils {
    /**
     * 清理微信文章URL
     * @param {string} url 原始URL
     * @returns {string}
     */
    static cleanUrl(url) {
        try {
            const urlObj = new URL(url.replace(/^https?:\/\//, 'https://'));
            const params = new URLSearchParams(urlObj.search);

            // 保留必要参数
            const essentialParams = ['__biz', 'mid', 'idx', 'sn', 'chksm', 'scene'];
            const newParams = new URLSearchParams();

            essentialParams.forEach(param => {
                if (params.has(param)) {
                    newParams.set(param, params.get(param));
                }
            });

            // 确保有基本参数
            if (newParams.has('__biz') && newParams.has('mid')) {
                urlObj.search = newParams.toString();
                return urlObj.toString();
            }

            return url;
        } catch (error) {
            console.warn('Failed to clean WeChat URL:', error);
            return url;
        }
    }

    /**
     * 验证是否为微信文章链接
     * @param {string} url
     * @returns {boolean}
     */
    static isValidWeChatUrl(url) {
        const patterns = [
            /^https?:\/\/mp\.weixin\.qq\.com\/s\?.+/,
            /^https?:\/\/mp\.weixin\.qq\.com\/s\/[^?]+/,
            /^mp\.weixin\.qq\.com\/s\?.+/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * 从URL中提取文章ID
     * @param {string} url
     * @returns {string|null}
     */
    static extractArticleId(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);

            // 尝试多种可能的参数名
            const idParams = ['sn', 'mid', 'idx'];
            for (const param of idParams) {
                if (params.has(param)) {
                    return params.get(param);
                }
            }

            // 从路径中提取
            const pathMatch = urlObj.pathname.match(/\/s\/([^?]+)/);
            if (pathMatch) {
                return pathMatch[1];
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 从URL中提取公众号信息
     * @param {string} url
     * @returns {Object|null}
     */
    static extractAccountInfo(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);

            const biz = params.get('__biz');
            if (biz) {
                return {
                    bizId: biz,
                    encoded: true
                };
            }

            return null;
        } catch (error) {
            return null;
        }
    }
}

/**
 * 内容处理工具
 */
export class WeChatContentUtils {
    /**
     * 清理文本内容
     * @param {string} text
     * @returns {string}
     */
    static cleanText(text) {
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/[\r\n\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 生成内容摘要
     * @param {string} content
     * @param {number} maxLength
     * @returns {string}
     */
    static generateSummary(content, maxLength = 200) {
        if (!content) return '';

        // 移除Markdown格式
        let plainText = content
            .replace(/[#*`\[\]()>_~-]/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '[图片]')
            .replace(/\[.*?\]\(.*?\)/g, '$1')
            .replace(/\n+/g, ' ')
            .trim();

        // 移除多余空格
        plainText = plainText.replace(/\s+/g, ' ');

        if (plainText.length <= maxLength) {
            return plainText;
        }

        // 尝试在句子边界截断
        const sentenceEndings = /[。！？.!?]/;
        let truncated = plainText.substring(0, maxLength);

        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('。'),
            truncated.lastIndexOf('！'),
            truncated.lastIndexOf('？'),
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
        );

        if (lastSentenceEnd > maxLength * 0.6) {
            truncated = truncated.substring(0, lastSentenceEnd + 1);
        } else {
            truncated = truncated.substring(0, maxLength - 3) + '...';
        }

        return truncated;
    }

    /**
     * 计算阅读时间（分钟）
     * @param {number} wordCount
     * @returns {number}
     */
    static calculateReadingTime(wordCount) {
        // 假设中文阅读速度为每分钟300字
        const wordsPerMinute = 300;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    /**
     * 提取关键词
     * @param {string} content
     * @param {number} count
     * @returns {Array<string>}
     */
    static extractKeywords(content, count = 5) {
        if (!content) return [];

        // 简单的关键词提取（可以后续优化为更复杂的算法）
        const words = content
            .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1)
            .filter(word => !this.isStopWord(word));

        // 统计词频
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // 按频率排序并返回前N个
        return Object.entries(wordFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, count)
            .map(([word]) => word);
    }

    /**
     * 判断是否为停用词
     * @param {string} word
     * @returns {boolean}
     */
    static isStopWord(word) {
        const stopWords = [
            // 中文停用词
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
            // 英文停用词
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
        ];

        return stopWords.includes(word.toLowerCase());
    }

    /**
     * 检测内容语言
     * @param {string} content
     * @returns {string}
     */
    static detectLanguage(content) {
        if (!content) return 'unknown';

        const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        const totalChars = content.length;

        const chineseRatio = chineseChars / totalChars;
        const englishRatio = englishWords / (totalChars / 6); // 假设平均英文单词长度为6

        if (chineseRatio > 0.3) return 'zh';
        if (englishRatio > 0.3) return 'en';
        return 'mixed';
    }
}

/**
 * 图片处理工具
 */
export class WeChatImageUtils {
    /**
     * 转换微信图片URL为直接访问链接
     * @param {string} imageUrl
     * @returns {string}
     */
    static convertImageUrl(imageUrl) {
        if (!imageUrl) return '';

        // 转换微信图片域名，添加 .in 后缀
        if (imageUrl.includes('wx.qlogo.cn')) {
            imageUrl = imageUrl.replace('wx.qlogo.cn', 'wx.qlogo.cn.in');
        } else if (imageUrl.includes('mmbiz.qpic.cn')) {
            imageUrl = imageUrl.replace('mmbiz.qpic.cn', 'mmbiz.qpic.cn.in');
        }

        // 微信图片URL通常需要添加特定参数才能直接访问
        if (imageUrl.includes('wx.qlogo.cn.in') || imageUrl.includes('mmbiz.qpic.cn.in')) {
            const separator = imageUrl.includes('?') ? '&' : '?';
            return `${imageUrl}${separator}wxtype=jpeg&wxfrom=0`;
        }

        return imageUrl;
    }

    /**
     * 过滤有效图片
     * @param {Array<string>} images
     * @returns {Array<string>}
     */
    static filterValidImages(images) {
        if (!Array.isArray(images)) return [];

        return images
            .filter(img => img && typeof img === 'string')
            .filter(img => this.isValidImageUrl(img))
            .map(img => this.convertImageUrl(img))
            .filter((img, index, arr) => arr.indexOf(img) === index); // 去重
    }

    /**
     * 验证图片URL
     * @param {string} imageUrl
     * @returns {boolean}
     */
    static isValidImageUrl(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') return false;

        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const hasValidExtension = imageExtensions.some(ext =>
            imageUrl.toLowerCase().includes(ext)
        );

        const isWechatImage = imageUrl.includes('mmbiz.qpic.cn') ||
                            imageUrl.includes('wx.qlogo.cn');

        return hasValidExtension || isWechatImage;
    }

    /**
     * 获取图片类型
     * @param {string} imageUrl
     * @returns {string}
     */
    static getImageType(imageUrl) {
        if (!imageUrl) return 'unknown';

        if (imageUrl.includes('mmbiz.qpic.cn')) return 'wechat';
        if (imageUrl.includes('wx.qlogo.cn')) return 'avatar';
        if (imageUrl.includes('gif')) return 'gif';
        if (imageUrl.includes('png')) return 'png';
        if (imageUrl.includes('jpg') || imageUrl.includes('jpeg')) return 'jpeg';
        if (imageUrl.includes('webp')) return 'webp';

        return 'unknown';
    }
}

/**
 * 性能监控工具
 */
export class WeChatPerformanceUtils {
    /**
     * 创建性能计时器
     * @param {string} name
     * @returns {Object}
     */
    static createTimer(name) {
        const startTime = Date.now();

        return {
            name,
            startTime,
            end() {
                const endTime = Date.now();
                return {
                    name: this.name,
                    duration: endTime - this.startTime,
                    startTime: this.startTime,
                    endTime
                };
            }
        };
    }

    /**
     * 记录解析性能
     * @param {Object} metrics 性能指标
     */
    static logPerformance(metrics) {
        console.log(`[WeChat Parser Performance] ${metrics.name}: ${metrics.duration}ms`);
    }
}

export default {
    WeChatUrlUtils,
    WeChatContentUtils,
    WeChatImageUtils,
    WeChatPerformanceUtils
};