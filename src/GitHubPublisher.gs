/**
 * GitHub Trending Tracker — GitHub 仓库推送
 */

function pushReportToGitHub(report) {
  var token = getApiKey('GITHUB_TOKEN');
  if (!token) {
    Logger.log('未配置 GITHUB_TOKEN，跳过将 Markdown 推送到 GitHub');
    return null;
  }

  var date = formatDate();
  var path = 'reports/weekly/' + date + '.md';
  Logger.log('正在上传 Markdown 到 GitHub: ' + path + '（仓库 ' + CONFIG.githubRepo + '）');
  var repo = CONFIG.githubRepo;

  var content = Utilities.base64Encode(report, Utilities.Charset.UTF_8);
  var sha = getFileSHA_(token, repo, path);

  var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var payload = {
    message: '📊 GitHub 热门项目周报 — ' + date,
    content: content,
  };
  if (sha) {
    payload.sha = sha;
  }

  var options = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(apiUrl, options);
    var code = response.getResponseCode();

    if (code === 200 || code === 201) {
      var result = JSON.parse(response.getContentText());
      Logger.log('报告已推送到 GitHub: ' + result.content.html_url);
      updateRepoReadme_(token, repo, date, path);
      return result.content.html_url;
    } else {
      Logger.log('GitHub 推送失败: HTTP ' + code + ' - ' + response.getContentText().substring(0, 300));
      return null;
    }
  } catch (e) {
    Logger.log('GitHub 推送出错: ' + e.message);
    return null;
  }
}

function getFileSHA_(token, repo, path) {
  var url = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var options = {
    method: 'get',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
    },
    muteHttpExceptions: true,
  };
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return JSON.parse(response.getContentText()).sha;
  }
  return null;
}

function updateRepoReadme_(token, repo, date, reportPath) {
  var url = 'https://api.github.com/repos/' + repo + '/contents/README.md';
  var options = {
    method: 'get',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
    },
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log('获取 README 失败，跳过更新');
    return;
  }

  var readmeData = JSON.parse(response.getContentText());
  var readmeSha = readmeData.sha;
  var currentContent = Utilities.newBlob(
    Utilities.base64Decode(readmeData.content.replace(/\n/g, ''))
  ).getDataAsString();

  if (currentContent.indexOf(date) !== -1) {
    Logger.log('README 中已包含 ' + date + ' 的报告链接');
    return;
  }

  var issueNum = parseInt(
    PropertiesService.getScriptProperties().getProperty('ISSUE_NUMBER') || '1', 10
  );
  var newRow = '| 第 ' + issueNum + ' 期 | ' + date + ' | [查看报告](' + reportPath + ') |';

  var marker = '<!-- REPORT_LIST -->';
  var updatedContent;
  if (currentContent.indexOf(marker) !== -1) {
    updatedContent = currentContent.replace(marker, marker + '\n' + newRow);
  } else {
    updatedContent = currentContent + '\n' + newRow;
  }

  var putPayload = {
    message: '📝 更新报告索引 — 第 ' + issueNum + ' 期 (' + date + ')',
    content: Utilities.base64Encode(updatedContent, Utilities.Charset.UTF_8),
    sha: readmeSha,
  };

  var putOptions = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
    },
    payload: JSON.stringify(putPayload),
    muteHttpExceptions: true,
  };

  var putResponse = UrlFetchApp.fetch(url, putOptions);
  if (putResponse.getResponseCode() === 200) {
    Logger.log('README 索引已更新');
  } else {
    Logger.log('README 更新失败: HTTP ' + putResponse.getResponseCode());
  }
}
