/**
 * DeepSeek API service for AI summarization
 */
export class DeepSeekService {
    constructor(apiKey, model = 'deepseek-chat') {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = 'https://api.deepseek.com/v1';
    }

    /**
     * Summarize article content using DeepSeek API
     * @param {string} title - Article title
     * @param {string} content - Article content
     * @param {string} author - Article author
     * @returns {Promise<string>} - Article summary
     */
    async summarizeArticle(title, content, author = '') {
        try {
            // Prepare the prompt for summarization
            const prompt = this.buildSummaryPrompt(title, content, author);

            // Make API request
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的文章内容总结助手。请用简洁明了的语言总结文章的核心内容，突出重点观点和关键信息。总结应该客观、准确，并保持原文的主要意图。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from DeepSeek API');
            }

            return data.choices[0].message.content.trim();

        } catch (error) {
            console.error('Error summarizing article with DeepSeek:', error);
            throw new Error(`AI总结失败: ${error.message}`);
        }
    }

    /**
     * Build summary prompt for DeepSeek API
     * @param {string} title - Article title
     * @param {string} content - Article content
     * @param {string} author - Article author
     * @returns {string} - Formatted prompt
     */
    buildSummaryPrompt(title, content, author) {
        // Limit content length to avoid token limits
        const maxContentLength = 3000;
        const truncatedContent = content.length > maxContentLength
            ? content.substring(0, maxContentLength) + '...'
            : content;

        return `请总结以下微信公众号文章：

标题：${title}
作者：${author || '未知'}

文章内容：
${truncatedContent}

请提供一个简洁但全面的总结，包括：
1. 文章的主要观点和核心内容
2. 关键信息或重要细节
3. 文章的整体结论或建议

总结应该：
- 简洁明了，控制在200字以内
- 客观准确，不添加个人观点
- 保持逻辑清晰，重点突出

请直接用中文回复总结内容，不需要其他格式。`;
    }

    /**
     * Check if the service is properly configured
     * @returns {boolean} - True if API key is available
     */
    isConfigured() {
        return !!this.apiKey;
    }
}