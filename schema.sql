-- 用户表
CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 频道表
CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER UNIQUE NOT NULL,
    title TEXT,
    username TEXT,
    added_by INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(telegram_id) ON DELETE CASCADE
);

-- 用户频道关联表
CREATE TABLE IF NOT EXISTS user_channels (
    user_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- 文章记录表
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT UNIQUE NOT NULL,
    telegraph_url TEXT NOT NULL,
    title TEXT,
    author TEXT,
    summary TEXT,
    word_count INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(telegram_id) ON DELETE SET NULL
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    default_channel_id INTEGER,
    auto_send_to_channel BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'zh-CN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
    FOREIGN KEY (default_channel_id) REFERENCES channels(id) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_channels_channel_id ON channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_added_by ON channels(added_by);
CREATE INDEX IF NOT EXISTS idx_articles_original_url ON articles(original_url);
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_channels_user_id ON user_channels(user_id);