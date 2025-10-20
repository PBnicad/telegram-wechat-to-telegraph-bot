// Telegram Bot API URLs
export const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Telegraph API URLs
export const TELEGRAPH_API_URL = 'https://api.telegra.ph';

// Bot状态
export const BotStates = {
    IDLE: 'idle',
    WAITING_FOR_URL: 'waiting_for_url',
    SELECTING_CHANNEL: 'selecting_channel',
    ADDING_CHANNEL: 'adding_channel'
};

// 命令定义
export const Commands = {
    START: '/start',
    HELP: '/help',
    MYCHANNELS: '/mychannels',
    ADDCHANNEL: '/addchannel',
    REMOVECHANNEL: '/removechannel',
    STATS: '/stats',
    SETTINGS: '/settings'
};

// 消息模板
export const Messages = {
    WELCOME: '欢迎使用微信公众号转Telegraph机器人！🤖\n\n请发送一个微信公众号文章链接，我会为您转换为Telegraph格式。',
    HELP: `📖 使用帮助：

🔗 转换文章：直接发送微信公众号文章链接
📋 我的频道：/mychannels - 查看绑定的频道
➕ 添加频道：/addchannel - 添加新频道（需要管理员权限）
➖ 移除频道：/removechannel - 移除频道绑定
⚙️ 设置：/settings - 个性化设置
📊 统计：/stats - 查看使用统计

需要帮助请联系 @your_support_username`,

    INVALID_URL: '❌ 无效的链接格式，请发送有效的微信公众号文章链接。',
    PROCESSING: '🔄 正在处理您的文章，请稍候...',
    CONVERSION_SUCCESS: '✅ 转换成功！',
    CONVERSION_FAILED: '❌ 转换失败，请稍后重试。',

    NO_CHANNELS: '📭 您还没有绑定任何频道。使用 /addchannel 命令来添加频道。',
    CHANNEL_ADDED: '✅ 频道添加成功！',
    CHANNEL_REMOVED: '✅ 频道移除成功！',
    CHANNEL_NOT_FOUND: '❌ 未找到指定的频道。',

    ADMIN_REQUIRED: '🚫 此命令需要管理员权限。',
    ERROR_OCCURRED: '❌ 发生错误，请稍后重试。'
};

// 键盘按钮
export const KeyboardButtons = {
    SEND_TO_CHANNEL: '发送到频道',
    CANCEL: '取消',
    BACK: '返回',
    CONFIRM: '确认',
    YES: '是',
    NO: '否'
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