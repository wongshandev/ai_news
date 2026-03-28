/**
 * GitHub Trending Tracker — 推送分发（Drive + 邮件）
 */

function saveToGoogleDrive(report) {
  var fileName = 'github-trending-' + formatDate() + '.md';

  try {
    var folder;
    if (CONFIG.driveFolderId && CONFIG.driveFolderId !== 'your-folder-id') {
      folder = DriveApp.getFolderById(CONFIG.driveFolderId);
    } else {
      folder = getOrCreateFolder_('GitHub-Trending-Reports');
    }

    var existing = folder.getFilesByName(fileName);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }

    var file = folder.createFile(fileName, report, MimeType.PLAIN_TEXT);
    Logger.log('报告已保存到 Google Drive: ' + file.getUrl());
    return file;
  } catch (e) {
    Logger.log('保存到 Drive 失败: ' + e.message);
    return null;
  }
}

function sendEmailNotification(report) {
  if (!CONFIG.notifyEmail || CONFIG.notifyEmail === 'your-email@example.com') {
    Logger.log('未配置邮箱地址，跳过邮件推送');
    return;
  }

  var today = formatDateCN();
  var timeLabel = CONFIG.timeRange === 'daily' ? '日报' : (CONFIG.timeRange === 'weekly' ? '周报' : '月报');
  var subject = 'GitHub 热门项目' + timeLabel + ' — ' + today;

  var htmlBody = markdownToSimpleHTML(report);

  try {
    GmailApp.sendEmail(CONFIG.notifyEmail, subject, report, {
      htmlBody: htmlBody,
      name: 'GitHub Trending Tracker',
    });
    Logger.log('邮件已发送至: ' + CONFIG.notifyEmail);
  } catch (e) {
    Logger.log('邮件发送失败: ' + e.message);
  }
}

function markdownToSimpleHTML(md) {
  var html = md;

  // 标题
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 引用
  html = html.replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid #ddd;padding-left:12px;color:#666;">$1</blockquote>');

  // 代码块
  html = html.replace(/```[\s\S]*?```/g, function(match) {
    var code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
    return '<pre style="background:#f6f8fa;padding:12px;border-radius:6px;overflow-x:auto;"><code>' + code + '</code></pre>';
  });
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;">$1</code>');

  // 表格
  html = html.replace(/^\|(.+)\|$/gm, function(match) {
    if (match.match(/^\|[\s\-:|]+\|$/)) return '';
    var cells = match.split('|').filter(function(c) { return c.trim() !== ''; });
    var row = cells.map(function(c) { return '<td style="border:1px solid #ddd;padding:6px 12px;">' + c.trim() + '</td>'; }).join('');
    return '<tr>' + row + '</tr>';
  });
  html = html.replace(/(<tr>[\s\S]*?<\/tr>\s*)+/g, '<table style="border-collapse:collapse;margin:8px 0;">$&</table>');

  // 有序列表
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');

  // 分割线
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e1e4e8;margin:16px 0;">');

  // 换行
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.6;color:#24292e;max-width:800px;margin:0 auto;padding:20px;"><p>' + html + '</p></div>';

  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function getOrCreateFolder_(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}
