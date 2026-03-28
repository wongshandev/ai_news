/**
 * GitHub Trending Tracker — 工具函数
 */

function formatDate(date) {
  var d = date || new Date();
  var year = d.getFullYear();
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

function formatDateCN(date) {
  var d = date || new Date();
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
}

function fetchWithRetry(url, options, maxRetries) {
  maxRetries = maxRetries || 3;
  var lastError;
  for (var i = 0; i < maxRetries; i++) {
    try {
      var opts = Object.assign({}, options || {}, { muteHttpExceptions: true });
      var response = UrlFetchApp.fetch(url, opts);
      var code = response.getResponseCode();
      if (code >= 200 && code < 300) {
        return response;
      }
      if (code === 429) {
        Logger.log('Rate limited, waiting ' + (2 * (i + 1)) + 's before retry...');
        Utilities.sleep(2000 * (i + 1));
        continue;
      }
      if (code >= 500) {
        Logger.log('Server error ' + code + ', retry ' + (i + 1));
        Utilities.sleep(1000 * (i + 1));
        continue;
      }
      Logger.log('HTTP ' + code + ' for ' + url);
      return response;
    } catch (e) {
      lastError = e;
      Logger.log('Fetch error (attempt ' + (i + 1) + '): ' + e.message);
      Utilities.sleep(1000 * (i + 1));
    }
  }
  throw new Error('Failed after ' + maxRetries + ' retries: ' + (lastError ? lastError.message : 'unknown'));
}

function dedupeRepos(repos) {
  var seen = {};
  return repos.filter(function(repo) {
    if (seen[repo.name]) return false;
    seen[repo.name] = true;
    return true;
  });
}

function sendErrorEmail(error) {
  try {
    GmailApp.sendEmail(
      CONFIG.notifyEmail,
      '[GitHub Trending Tracker] 执行出错',
      '执行时间: ' + formatDateCN() + '\n\n错误信息:\n' + error.message + '\n\n' + (error.stack || '')
    );
  } catch (e) {
    Logger.log('Failed to send error email: ' + e.message);
  }
}
