/**
 * Cloudflare Workers AI 总结服务
 * 使用 @cf/qwen/qwen3-30b-a3b 模型生成文章摘要
 */
export class WorkersAIService {
    constructor(env) {
        this.env = env;
    }

    /**
     * 总结文章内容
     * @param {string} title 文章标题
     * @param {string} content 文章内容（Markdown格式）
     * @param {string} author 文章作者
     * @returns {Promise<string>} 文章摘要
     */
    async summarizeArticle(title, content, author = '') {
        try {
            const prompt = this.buildSummaryPrompt(title, content, author);

            const response = await this.env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的文章内容总结助手。请用简洁明了的语言总结文章的核心内容，突出重点观点和关键信息。总结应该客观、准确，并保持原文的主要意图。请直接输出总结内容，不要输出思考过程。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1024,
                temperature: 0.3
            });

            if (!response) {
                throw new Error('No response from Workers AI');
            }

            // Workers AI 返回 OpenAI 兼容格式: { choices: [{ message: { content: "..." } }] }
            // 推理模型(如GLM)可能将内容放在 reasoning_content 或 reasoning 字段
            let summary = null;
            if (response.choices && response.choices.length > 0) {
                const choice = response.choices[0];
                const msg = choice.message;
                summary = msg?.content || msg?.reasoning_content || msg?.reasoning || null;
            } else if (response.response) {
                summary = response.response;
            } else if (typeof response === 'string') {
                summary = response;
            }

            if (!summary) {
                console.error('Workers AI unexpected format:', JSON.stringify(response).substring(0, 500));
                throw new Error('Unexpected Workers AI response format');
            }

            return summary.trim();

        } catch (error) {
            console.error('Error summarizing article with Workers AI:', error);
            throw new Error(`AI总结失败: ${error.message}`);
        }
    }

    /**
     * 构建总结提示词
     * @param {string} title 文章标题
     * @param {string} content 文章内容
     * @param {string} author 文章作者
     * @returns {string} 格式化的提示词
     */
    buildSummaryPrompt(title, content, author) {
        // 限制内容长度，避免超过 token 限制
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
     * 检查服务是否可用
     * Workers AI 通过 env.AI 绑定访问，无需额外配置 API Key
     * @returns {boolean}
     */
    isConfigured() {
        return !!(this.env && this.env.AI);
    }
}

export default WorkersAIService;