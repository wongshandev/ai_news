/**
 * GitHub Trending Tracker — DeepSeek API 智能解读
 */

function analyzeWithDeepSeek(repos) {
  var apiKey = getApiKey('DEEPSEEK_API_KEY');
  if (!apiKey) {
    Logger.log('未配置 DEEPSEEK_API_KEY，跳过智能解读');
    return { perProject: {}, trendSummary: '（未配置 DeepSeek API Key，无法生成解读）' };
  }

  var projectList = repos.map(function(repo, idx) {
    var info = {
      rank: idx + 1,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stars,
      periodStars: repo.periodStars,
      periodLabel: repo.periodLabel,
      forks: repo.forks,
      topics: (repo.fullData && repo.fullData.topics) ? repo.fullData.topics.join(', ') : '',
      license: (repo.fullData && repo.fullData.license) ? repo.fullData.license : '',
      readmeExcerpt: repo.readmeExcerpt || '',
    };
    return info;
  });

  var prompt = buildAnalysisPrompt(projectList);
  var result = callDeepSeek(apiKey, prompt);

  return {
    rawAnalysis: result,
    perProject: {},
    trendSummary: '',
  };
}

function buildAnalysisPrompt(projectList) {
  var projectsJSON = JSON.stringify(projectList, null, 2);
  return '你是一位资深开源技术分析师，擅长洞察技术趋势。请对以下 GitHub 本周热门项目逐一进行深度解读分析。\n\n'
    + '对每个项目，请输出以下内容（使用 Markdown 格式）：\n'
    + '1. **一句话概要**：用一句话说明项目是做什么的\n'
    + '2. **技术亮点**：核心技术栈、架构特点、与同类项目的差异化优势\n'
    + '3. **适用场景**：这个项目适合谁用、解决什么痛点\n'
    + '4. **上手难度**：评估 1-5 星（1=非常简单，5=非常困难），并简要说明原因\n'
    + '5. **值得关注的原因**：为什么这个项目最近热度飙升\n\n'
    + '每个项目用 `### 项目名` 作为标题分隔。\n\n'
    + '最后，请额外输出一个章节 `## 本周趋势洞察`，总结本周 GitHub 热门项目整体呈现的技术趋势和方向。\n\n'
    + '请用中文回答。\n\n'
    + '---\n\n'
    + '以下是本周热门项目数据：\n\n'
    + '```json\n' + projectsJSON + '\n```';
}

function callDeepSeek(apiKey, prompt) {
  var url = CONFIG.deepseekBaseUrl + '/chat/completions';

  var payload = {
    model: CONFIG.deepseekModel,
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: CONFIG.maxLLMTokens,
    temperature: CONFIG.llmTemperature,
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = fetchWithRetry(url, options, 2);
    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('DeepSeek API 返回 HTTP ' + code + ': ' + response.getContentText().substring(0, 500));
      return '（DeepSeek API 调用失败，HTTP ' + code + '）';
    }

    var body = JSON.parse(response.getContentText());
    if (body.choices && body.choices.length > 0 && body.choices[0].message) {
      return body.choices[0].message.content;
    }
    return '（DeepSeek 返回数据格式异常）';
  } catch (e) {
    Logger.log('DeepSeek API 调用出错: ' + e.message);
    return '（DeepSeek API 调用出错: ' + e.message + '）';
  }
}
