/**
 * GitHub Trending Tracker — 配置文件
 */

const CONFIG = {
  languages: ['python', 'typescript', 'rust', 'go', 'java'],
  timeRange: 'weekly',
  topN: 10,
  notifyEmail: 'wongshan07@gmail.com',
  driveFolderId: 'your-folder-id',
  githubRepo: 'wongshandev/ai_news',
  deepseekBaseUrl: 'https://api.deepseek.com',
  deepseekModel: 'deepseek-chat',
  maxReadmeChars: 500,
  maxLLMTokens: 4096,
  llmTemperature: 0.7,
};

function getApiKey(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}
