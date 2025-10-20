/**
 * 微信解析器配置管理
 */
import { WeChatParseConfig } from '../types/wechat.js';

export class WeChatConfigManager {
    constructor() {
        this.defaultConfigs = {
            // 默认配置
            default: WeChatParseConfig.createDefault(),

            // 快速配置 - 用于快速预览
            fast: WeChatParseConfig.createFast(),

            // 高质量配置 - 用于完整解析
            highQuality: WeChatParseConfig.createHighQuality(),

            // 调试配置 - 包含详细日志
            debug: new WeChatParseConfig({
                timeout: 60000,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                enableImageExtraction: true,
                enableMarkdownConversion: true,
                maxRetries: 5,
                retryDelay: 3000
            })
        };
    }

    /**
     * 获取配置
     * @param {string} configName 配置名称
     * @returns {WeChatParseConfig}
     */
    getConfig(configName = 'default') {
        return this.defaultConfigs[configName] || this.defaultConfigs.default;
    }

    /**
     * 创建自定义配置
     * @param {Object} options
     * @returns {WeChatParseConfig}
     */
    createCustomConfig(options) {
        return new WeChatParseConfig(options);
    }

    /**
     * 根据用户设置获取配置
     * @param {Object} userSettings 用户设置
     * @returns {WeChatParseConfig}
     */
    getConfigByUserSettings(userSettings = {}) {
        const baseConfig = this.defaultConfigs[userSettings.quality || 'default'];

        // 合并用户自定义设置
        return new WeChatParseConfig({
            ...baseConfig,
            timeout: userSettings.timeout || baseConfig.timeout,
            userAgent: userSettings.customUserAgent || baseConfig.userAgent,
            proxy: userSettings.proxy || baseConfig.proxy,
            enableImageExtraction: userSettings.enableImages ?? baseConfig.enableImageExtraction,
            enableMarkdownConversion: userSettings.enableMarkdown ?? baseConfig.enableMarkdownConversion,
            maxRetries: userSettings.maxRetries || baseConfig.maxRetries,
            retryDelay: userSettings.retryDelay || baseConfig.retryDelay
        });
    }

    /**
     * 获取所有可用的配置名称
     * @returns {Array<string>}
     */
    getAvailableConfigs() {
        return Object.keys(this.defaultConfigs);
    }

    /**
     * 验证配置
     * @param {WeChatParseConfig} config
     * @returns {boolean}
     */
    validateConfig(config) {
        if (!config) return false;

        // 检查必要字段
        const requiredFields = ['timeout', 'userAgent', 'maxRetries', 'retryDelay'];
        return requiredFields.every(field => config[field] !== undefined);
    }
}

// 创建全局配置管理器实例
export const wechatConfigManager = new WeChatConfigManager();

export default wechatConfigManager;