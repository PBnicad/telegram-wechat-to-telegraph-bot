// Telegram Bot API URLs
export const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Telegraph API URLs
export const TELEGRAPH_API_URL = 'https://api.telegra.ph';

// Bot状态
export const BotStates = {
    IDLE: 'idle',
    WAITING_FOR_URL: 'waiting_for_url'
};

// 命令定义
export const Commands = {
    START: '/start',
    HELP: '/help'
};

// 消息模板
export const Messages = {
    WELCOME: '欢迎使用微信公众号转Telegraph机器人！🤖\n\n请发送一个微信公众号文章链接，我会为您转换为Telegraph格式并生成AI总结。',
    HELP: `📖 使用帮助：\n\n🔗 转换文章：直接发送微信公众号文章链接（包含AI总结功能）\n🆘 帮助：/help - 查看此帮助\n\n如遇问题，请稍后重试或联系维护者。`,

    INVALID_URL: '❌ 无效的链接格式，请发送有效的微信公众号文章链接。',
    PROCESSING: '🔄 正在处理您的文章，请稍候...',
    CONVERSION_SUCCESS: '✅ 转换成功！',
    CONVERSION_FAILED: '❌ 转换失败，请稍后重试。',
    SUMMARY_PROCESSING: '🤖 正在生成AI总结，请稍候...',
    SUMMARY_FAILED: '❌ AI总结生成失败，请稍后重试。',
    NO_DEEPSEEK_KEY: '❌ AI总结服务暂时不可用，请稍后重试。'
};

// 键盘按钮
export const KeyboardButtons = {
    CANCEL: '取消'
};

// URL验证正则表达式
export const URL_PATTERNS = {
    WECHAT: /^https?:\/\/mp\.weixin\.qq\.com\/s/,
    TELEGRAPH: /^https?:\/\/telegra\.ph\/[^\/]+\/[a-zA-Z0-9-]+$/,
    GENERIC: /^https?:\/\/.+/
};

// HTTP请求配置
export const HTTP_CONFIG = {
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Telegraph账户配置
export const TELEGRAPH_CONFIG = {
    AUTHOR_NAME: 'Telegram Bot',
    AUTHOR_URL: 'https://t.me/wechat2telegraphbot',
    DEFAULT_TITLE: '未命名文章'
};

// 微信公众号内容解析配置
export const WECHAT_PARSER_CONFIG = {
    SELECTORS: {
        TITLE: ['h1.rich_media_title', 'h1#activity-name', '.rich_media_title'],
        CONTENT: ['div.rich_media_content', '#js_content', '.rich_media_area_primary'],
        AUTHOR: ['span.rich_media_meta_nickname', '.rich_media_meta_list .rich_media_meta_nickname'],
        PUBLISH_TIME: ['em.rich_media_meta_text', '.rich_media_meta_list em']
    },
    CLEAN_SELECTORS: [
        'script', 'style', '.qr_code_pc', '.profile_container',
        '.reward_container', '.appmsg_banner', '.original_replace'
    ],
    IMAGE_PROCESSING: {
        MAX_WIDTH: 640,
        QUALITY: 80
    }
};