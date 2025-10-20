/**
 * 数据库操作类
 */
export class Database {
    constructor(db) {
        this.db = db;
    }

    // 用户相关操作
    async getUser(telegramId) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
        return await stmt.first(telegramId);
    }

    async createUser(telegramId, username, firstName, lastName) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO users (telegram_id, username, first_name, last_name, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        return await stmt.bind(
            telegramId,
            username || null,
            firstName || null,
            lastName || null
        ).run();
    }

    // 频道相关操作
    async getChannel(channelId) {
        const stmt = this.db.prepare('SELECT * FROM channels WHERE channel_id = ?');
        return await stmt.first(channelId);
    }

    async createChannel(channelId, title, username, addedBy) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO channels (channel_id, title, username, added_by)
            VALUES (?, ?, ?, ?)
        `);
        return await stmt.bind(channelId, title, username, addedBy).run();
    }

    async getUserChannels(userId) {
        const stmt = this.db.prepare(`
            SELECT c.* FROM channels c
            JOIN user_channels uc ON c.id = uc.channel_id
            WHERE uc.user_id = ? AND c.is_active = TRUE
        `);
        return await stmt.all(userId);
    }

    async bindUserToChannel(userId, channelId) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO user_channels (user_id, channel_id)
            VALUES (?, ?)
        `);
        return await stmt.bind(userId, channelId).run();
    }

    async unbindUserFromChannel(userId, channelId) {
        const stmt = this.db.prepare(`
            DELETE FROM user_channels WHERE user_id = ? AND channel_id = ?
        `);
        return await stmt.bind(userId, channelId).run();
    }

    // 文章相关操作
    async getArticle(originalUrl) {
        const stmt = this.db.prepare('SELECT * FROM articles WHERE original_url = ?');
        return await stmt.first(originalUrl);
    }

    async getArticleByTelegraphUrl(telegraphUrl) {
        const stmt = this.db.prepare('SELECT * FROM articles WHERE telegraph_url = ?');
        return await stmt.first(telegraphUrl);
    }

    async createArticle(originalUrl, telegraphUrl, title, author, summary, wordCount, createdBy) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO articles
            (original_url, telegraph_url, title, author, summary, word_count, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return await stmt.bind(originalUrl, telegraphUrl, title, author, summary, wordCount, createdBy).run();
    }

    async getUserArticles(userId, limit = 10) {
        const stmt = this.db.prepare(`
            SELECT * FROM articles
            WHERE created_by = ?
            ORDER BY created_at DESC
            LIMIT ?
        `);
        return await stmt.all(userId, limit);
    }

    // 用户设置相关操作
    async getUserSettings(userId) {
        const stmt = this.db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
        return await stmt.first(userId);
    }

    async updateUserSettings(userId, settings) {
        const { defaultChannelId, autoSendToChannel, language } = settings;
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_settings
            (user_id, default_channel_id, auto_send_to_channel, language, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        return await stmt.bind(userId, defaultChannelId, autoSendToChannel, language).run();
    }

    // 统计相关操作
    async getStats() {
        const stats = await this.db.batch([
            this.db.prepare('SELECT COUNT(*) as total_users FROM users'),
            this.db.prepare('SELECT COUNT(*) as total_channels FROM channels'),
            this.db.prepare('SELECT COUNT(*) as total_articles FROM articles'),
            this.db.prepare('SELECT COUNT(*) as articles_today FROM articles WHERE created_at >= datetime("now", "start of day")')
        ]);

        return {
            totalUsers: stats[0].results[0].total_users,
            totalChannels: stats[1].results[0].total_channels,
            totalArticles: stats[2].results[0].total_articles,
            articlesToday: stats[3].results[0].articles_today
        };
    }
}