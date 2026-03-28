/**
 * GitHub Trending Tracker — 主入口
 */

function run() {
  Logger.log('=== GitHub Trending Tracker 开始执行 ===');
  Logger.log('时间: ' + formatDateCN());

  try {
    var trendingRepos = scrapeTrending(CONFIG.languages, CONFIG.timeRange, CONFIG.topN);
    Logger.log('抓取到 ' + trendingRepos.length + ' 个趋势项目');

    var enrichedRepos = enrichWithGitHubAPI(trendingRepos);
    Logger.log('API 数据补充完成，共 ' + enrichedRepos.length + ' 个项目');

    var analysis = analyzeWithDeepSeek(enrichedRepos);
    Logger.log('DeepSeek 智能解读完成');

    var report = generateReport(enrichedRepos, analysis);
    Logger.log('Markdown 报告生成完成，长度: ' + report.length);

    pushReportToGitHub(report);
    saveToGoogleDrive(report);
    sendEmailNotification(report);

    Logger.log('=== 执行完成 ===');
  } catch (e) {
    Logger.log('执行出错: ' + e.message);
    Logger.log(e.stack);
    sendErrorEmail(e);
  }
}

function setupWeeklyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'run') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('run')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  Logger.log('已设置每周一 9:00 自动执行');
}

function setupDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'run') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('run')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log('已设置每天 9:00 自动执行');
}
