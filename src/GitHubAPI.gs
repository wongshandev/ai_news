/**
 * GitHub Trending Tracker — GitHub REST API 数据补充
 */

function enrichWithGitHubAPI(repos) {
  var token = getApiKey('GITHUB_TOKEN');
  var headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) {
    headers['Authorization'] = 'token ' + token;
  }

  var repoRequests = repos.map(function(repo) {
    return {
      url: 'https://api.github.com/repos/' + repo.name,
      method: 'get',
      headers: headers,
      muteHttpExceptions: true,
    };
  });

  var readmeRequests = repos.map(function(repo) {
    return {
      url: 'https://api.github.com/repos/' + repo.name + '/readme',
      method: 'get',
      headers: headers,
      muteHttpExceptions: true,
    };
  });

  var repoResponses = UrlFetchApp.fetchAll(repoRequests);
  var readmeResponses = UrlFetchApp.fetchAll(readmeRequests);

  for (var i = 0; i < repos.length; i++) {
    repos[i] = enrichSingleRepo(repos[i], repoResponses[i], readmeResponses[i]);
  }

  return repos;
}

function enrichSingleRepo(repo, repoResponse, readmeResponse) {
  if (repoResponse.getResponseCode() === 200) {
    try {
      var data = JSON.parse(repoResponse.getContentText());
      repo.fullData = {
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        pushed_at: data.pushed_at || '',
        open_issues_count: data.open_issues_count || 0,
        license: data.license ? data.license.spdx_id || data.license.name : '',
        topics: data.topics || [],
        homepage: data.homepage || '',
        watchers_count: data.watchers_count || 0,
        subscribers_count: data.subscribers_count || 0,
        default_branch: data.default_branch || 'main',
      };
    } catch (e) {
      Logger.log('解析仓库 API 数据失败 (' + repo.name + '): ' + e.message);
      repo.fullData = {};
    }
  } else {
    Logger.log('仓库 API 请求失败 (' + repo.name + '): HTTP ' + repoResponse.getResponseCode());
    repo.fullData = {};
  }

  if (readmeResponse.getResponseCode() === 200) {
    try {
      var readmeData = JSON.parse(readmeResponse.getContentText());
      if (readmeData.content) {
        var decoded = Utilities.newBlob(
          Utilities.base64Decode(readmeData.content.replace(/\n/g, ''))
        ).getDataAsString();
        repo.readmeExcerpt = decoded.substring(0, CONFIG.maxReadmeChars);
      } else {
        repo.readmeExcerpt = '';
      }
    } catch (e) {
      Logger.log('解析 README 失败 (' + repo.name + '): ' + e.message);
      repo.readmeExcerpt = '';
    }
  } else {
    repo.readmeExcerpt = '';
  }

  return repo;
}
