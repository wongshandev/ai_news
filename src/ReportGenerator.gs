/**
 * GitHub Trending Tracker — Markdown 报告生成（易扫读版）
 */

function generateReport(repos, analysis) {
  var today = formatDateCN();
  var issueNum = getIssueNumber_();
  var timeLabel = CONFIG.timeRange === 'daily' ? '日报' : (CONFIG.timeRange === 'weekly' ? '周报' : '月报');
  var langs = (CONFIG.languages && CONFIG.languages.length) ? CONFIG.languages.join('、') : '全部';

  var lines = [];

  // ----- 标题 -----
  lines.push('# GitHub 热门项目 · ' + timeLabel);
  lines.push('');
  lines.push('**第 ' + issueNum + ' 期** · ' + today + ' · 共 **' + repos.length + '** 个仓库 · 追踪语言：' + langs);
  lines.push('');

  // ----- 元信息（一眼看完） -----
  lines.push('```');
  lines.push('周期: ' + CONFIG.timeRange + '  |  生成: ' + formatDate() + '  |  仓库: ' + CONFIG.githubRepo);
  lines.push('```');
  lines.push('');

  // ----- 本周一览表（核心：快速扫读） -----
  lines.push('## 本周一览');
  lines.push('');
  lines.push('| 排名 | 仓库 | 语言 | 本周 Star | 一句话 |');
  lines.push('|:---:|:---|:---:|:---:|:---|');
  for (var t = 0; t < repos.length; t++) {
    var r = repos[t];
    var oneLine = truncateForTable_(r.description || '—', 42);
    lines.push(
      '| ' + (t + 1) + ' | [' + cellSafe_(r.name) + '](' + r.url + ') | '
        + cellSafe_(r.language || '—') + ' | +' + formatNumber(r.periodStars) + ' | ' + oneLine + ' |'
    );
  }
  lines.push('');

  // ----- 导读（前三名） -----
  lines.push('## 导读 · Top 3');
  lines.push('');
  var top3 = repos.slice(0, Math.min(3, repos.length));
  for (var h = 0; h < top3.length; h++) {
    var hl = top3[h];
    lines.push('- **' + (h + 1) + '.** [`' + hl.name + '`](' + hl.url + ') · +' + formatNumber(hl.periodStars) + ' stars · ' + cellSafe_(hl.description || '暂无描述'));
  }
  lines.push('');

  // ----- 各项目详情（统一卡片格式） -----
  lines.push('## 项目详情');
  lines.push('');
  lines.push('> 下表为榜单数据与官方简介；文末为 **AI 解读**（基于 README 与元数据生成）。');
  lines.push('');

  for (var i = 0; i < repos.length; i++) {
    var repo = repos[i];
    var rank = i + 1;

    lines.push('### ' + rank + ' · `' + repo.name + '`');
    lines.push('');
    lines.push('**链接** → [' + repo.url + '](' + repo.url + ')');
    lines.push('');

    // 指标：单行键值，避免大表格占屏
    var metrics = [];
    metrics.push('总 Star **' + formatNumber(repo.stars) + '**');
    metrics.push('本周 **+' + formatNumber(repo.periodStars) + '**（' + repo.periodLabel + '）');
    metrics.push('Fork **' + formatNumber(repo.forks) + '**');
    metrics.push('语言 **' + (repo.language || '—') + '**');
    if (repo.fullData && repo.fullData.license) {
      metrics.push('协议 **' + repo.fullData.license + '**');
    }
    if (repo.fullData && repo.fullData.open_issues_count) {
      metrics.push('Issues **' + repo.fullData.open_issues_count + '**');
    }
    lines.push('- ' + metrics.join(' · '));
    lines.push('');

    if (repo.fullData && repo.fullData.topics && repo.fullData.topics.length > 0) {
      var tags = repo.fullData.topics.slice(0, 12).map(function(t) { return '`' + t + '`'; }).join(' ');
      lines.push('**Topics** ' + tags);
      lines.push('');
    }

    if (repo.description) {
      lines.push('**简介**');
      lines.push('');
      lines.push('> ' + repo.description.replace(/\n/g, ' '));
      lines.push('');
    }

    if (i < repos.length - 1) {
      lines.push('');
    }
  }

  // ----- AI 解读（独立大段，避免与数据混在一起） -----
  if (analysis && analysis.rawAnalysis) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## AI 智能解读');
    lines.push('');
    lines.push('> 由 **DeepSeek** 根据本周榜单与项目元数据生成，便于把握技术方向与选型参考。');
    lines.push('');
    lines.push(analysis.rawAnalysis);
    lines.push('');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*报告由 [GitHub Trending Tracker](https://github.com/' + CONFIG.githubRepo + ') 自动生成 · ' + formatDate() + '*');

  return lines.join('\n');
}

/** 表格单元格：去掉会破坏 pipe 表的字符 */
function cellSafe_(s) {
  if (!s) return '';
  return String(s).replace(/\|/g, '｜').replace(/\r?\n/g, ' ').trim();
}

/** 表格「一句话」列：截断并清理 */
function truncateForTable_(s, maxLen) {
  var t = cellSafe_(s);
  if (t.length <= maxLen) return t;
  return t.substring(0, maxLen - 1) + '…';
}

function getIssueNumber_() {
  var props = PropertiesService.getScriptProperties();
  var num = parseInt(props.getProperty('ISSUE_NUMBER') || '0', 10);
  num++;
  props.setProperty('ISSUE_NUMBER', String(num));
  return num;
}
