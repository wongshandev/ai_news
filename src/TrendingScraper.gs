/**
 * GitHub Trending Tracker — Trending 页面抓取
 */

function scrapeTrending(languages, timeRange, topN) {
  var sinceMap = { daily: 'daily', weekly: 'weekly', monthly: 'monthly' };
  var since = sinceMap[timeRange] || 'weekly';
  var allRepos = [];

  if (!languages || languages.length === 0) {
    languages = [''];
  }

  for (var i = 0; i < languages.length; i++) {
    var lang = languages[i];
    var url = 'https://github.com/trending' + (lang ? '/' + encodeURIComponent(lang) : '') + '?since=' + since;

    Logger.log('抓取: ' + url);
    try {
      var response = fetchWithRetry(url);
      var html = response.getContentText();
      var repos = parseTrendingHTML(html, since);
      allRepos = allRepos.concat(repos);
    } catch (e) {
      Logger.log('抓取 ' + lang + ' 失败: ' + e.message);
    }
  }

  allRepos = dedupeRepos(allRepos);
  allRepos.sort(function(a, b) { return b.periodStars - a.periodStars; });

  if (topN && allRepos.length > topN) {
    allRepos = allRepos.slice(0, topN);
  }

  return allRepos;
}

function parseTrendingHTML(html, since) {
  var repos = [];
  var articles = html.split('<article class="Box-row">');
  // first element is everything before the first article
  articles.shift();

  for (var i = 0; i < articles.length; i++) {
    var block = articles[i].split('</article>')[0];
    var repo = parseArticleBlock(block, since);
    if (repo) {
      repos.push(repo);
    }
  }

  return repos;
}

function parseArticleBlock(block, since) {
  var repo = {};

  // 仓库名: <a ... href="/owner/repo" ... class="Link">
  var nameMatch = block.match(/href="\/([^"]+)"[^>]*data-view-component="true"[^>]*class="[^"]*Link[^"]*"/);
  if (!nameMatch) {
    nameMatch = block.match(/<h2[^>]*>[\s\S]*?href="\/([^"\/]+\/[^"\/]+)"/);
  }
  if (!nameMatch) return null;
  repo.name = nameMatch[1].trim();

  // 描述
  var descMatch = block.match(/<p[^>]*class="[^"]*color-fg-muted[^"]*my-1[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  repo.description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // 编程语言
  var langMatch = block.match(/itemprop="programmingLanguage">(.*?)<\/span>/);
  repo.language = langMatch ? langMatch[1].trim() : '';

  // Star 总数
  var starsMatch = block.match(/\/stargazers"[^>]*>[\s\S]*?<\/svg>\s*([\d,]+)/);
  repo.stars = starsMatch ? parseInt(starsMatch[1].replace(/,/g, ''), 10) : 0;

  // Fork 总数
  var forksMatch = block.match(/\/forks"[^>]*>[\s\S]*?<\/svg>\s*([\d,]+)/);
  repo.forks = forksMatch ? parseInt(forksMatch[1].replace(/,/g, ''), 10) : 0;

  // 本周期 Star 增长
  var periodMatch = block.match(/([\d,]+)\s+stars?\s+(this\s+week|this\s+month|today)/i);
  repo.periodStars = periodMatch ? parseInt(periodMatch[1].replace(/,/g, ''), 10) : 0;
  repo.periodLabel = periodMatch ? periodMatch[2].trim() : (since === 'daily' ? 'today' : 'this ' + since.replace('ly', ''));

  repo.url = 'https://github.com/' + repo.name;

  return repo;
}
