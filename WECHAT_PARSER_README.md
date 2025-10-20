# 微信公众号解析器 - 基于ParseHub架构重构

## 概述

本项目已基于ParseHub架构对微信公众号处理模块进行了全面重构，提供了更好的模块化、错误处理和扩展性。

## 架构变更

### 核心组件

#### 1. WeChatParser (`src/services/wechat-parser.js`)
- **功能**: 负责解析微信公众号文章的核心解析器
- **特性**:
  - 智能URL清理和验证
  - 带重试机制的HTTP请求
  - 基于正则表达式的HTML解析（无DOM依赖）
  - 自动Markdown转换
  - 图片提取和处理
  - 发布时间解析

#### 2. 数据类型系统 (`src/types/wechat.js`)
- **WeChatParseResult**: 解析结果数据类
- **TelegraphResult**: Telegraph转换结果
- **WeChatParseError**: 错误类型系统
- **WeChatParseConfig**: 配置管理类

#### 3. 配置管理 (`src/config/wechat-config.js`)
- **预设配置**: 默认、快速、高质量、调试模式
- **动态配置**: 支持环境变量和用户设置
- **配置验证**: 自动验证配置有效性

#### 4. 工具函数 (`src/utils/wechat-utils.js`)
- **WeChatUrlUtils**: URL处理工具
- **WeChatContentUtils**: 内容处理工具
- **WeChatImageUtils**: 图片处理工具
- **WeChatPerformanceUtils**: 性能监控工具

### 主要改进

#### 1. 模块化设计
- 清晰的职责分离
- 可复用的组件
- 易于测试和维护

#### 2. 错误处理
- 详细的错误分类
- 用户友好的错误消息
- 完善的错误恢复机制

#### 3. 性能优化
- 智能重试机制
- 请求超时控制
- 资源使用优化

#### 4. 扩展性
- 插件化架构
- 配置驱动
- 易于添加新功能

## 使用方法

### 基本用法

```javascript
import { WeChatParser } from './services/wechat-parser.js';

// 创建解析器实例
const parser = new WeChatParser({
    timeout: 30000,
    userAgent: 'custom-user-agent',
    proxy: 'http://proxy-url'
});

// 解析文章
try {
    const result = await parser.parse('https://mp.weixin.qq.com/s?__biz=...');
    console.log('标题:', result.title);
    console.log('作者:', result.author);
    console.log('内容:', result.content);
} catch (error) {
    console.error('解析失败:', error.message);
}
```

### 配置管理

```javascript
import { wechatConfigManager } from './config/wechat-config.js';

// 获取预设配置
const fastConfig = wechatConfigManager.getConfig('fast');
const highQualityConfig = wechatConfigManager.getConfig('highQuality');

// 创建自定义配置
const customConfig = wechatConfigManager.createCustomConfig({
    timeout: 60000,
    enableImageExtraction: true,
    maxRetries: 5
});
```

### 工具函数使用

```javascript
import { WeChatUrlUtils, WeChatContentUtils } from './utils/wechat-utils.js';

// URL处理
const cleanUrl = WeChatUrlUtils.cleanUrl(originalUrl);
const isValid = WeChatUrlUtils.isValidWeChatUrl(url);
const articleId = WeChatUrlUtils.extractArticleId(url);

// 内容处理
const summary = WeChatContentUtils.generateSummary(content, 200);
const readingTime = WeChatContentUtils.calculateReadingTime(wordCount);
const keywords = WeChatContentUtils.extractKeywords(content);
```

## 环境变量配置

```bash
# 解析器质量设置 (default, fast, highQuality, debug)
WECHAT_PARSER_QUALITY=default

# 代理设置（可选）
PROXY_URL=http://proxy-url:port

# 自定义User-Agent（可选）
CUSTOM_USER_AGENT=Mozilla/5.0...
```

## 错误处理

新的错误系统提供了详细的错误分类：

- **NETWORK_ERROR**: 网络连接问题
- **PARSE_ERROR**: 内容解析失败
- **URL_ERROR**: URL格式错误
- **TIMEOUT_ERROR**: 请求超时

每个错误都包含详细的错误信息和可能的解决方案。

## 性能监控

内置性能监控工具：

```javascript
import { WeChatPerformanceUtils } from './utils/wechat-utils.js';

const timer = WeChatPerformanceUtils.createTimer('parse-article');
// ... 执行解析操作
const metrics = timer.end();
WeChatPerformanceUtils.logPerformance(metrics);
```

## 兼容性

- 完全向后兼容现有API
- 支持Cloudflare Workers环境
- 无外部依赖（仅使用Web API）

## 测试

解析器包含完整的测试覆盖：

```bash
# 运行测试
npm test

# 运行性能测试
npm run test:performance

# 运行集成测试
npm run test:integration
```

## 迁移指南

### 从旧版本迁移

1. **更新依赖**: 无需额外依赖，直接替换代码即可
2. **配置更新**: 可选地添加新的环境变量
3. **API兼容**: 现有API保持不变

### 新功能采用

1. **配置管理**: 使用新的配置系统管理解析器设置
2. **错误处理**: 利用新的错误类型系统
3. **工具函数**: 使用提供的工具函数简化开发

## 贡献指南

欢迎贡献代码！请遵循以下原则：

1. **模块化**: 保持代码的模块化设计
2. **测试**: 为新功能添加测试
3. **文档**: 更新相关文档
4. **兼容性**: 确保向后兼容性

## 许可证

本项目遵循原项目的许可证条款。