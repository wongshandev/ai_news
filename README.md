# AI News — GitHub 热门项目追踪

> 自动追踪 GitHub Trending 热门项目，通过 AI 智能解读，生成结构化周报。

## 最新报告

| 期数 | 日期 | 报告链接 |
|------|------|----------|
<!-- REPORT_LIST -->

## 功能特点

- **自动抓取** — 定时抓取 GitHub Trending 多语言热门项目
- **数据补充** — 通过 GitHub API 获取项目详细信息（协议、标签、README）
- **AI 解读** — 调用 DeepSeek AI 对每个项目进行深度分析
- **报告推送** — 每次运行将**完整 Markdown 周报**提交到本仓库 [`reports/weekly/`](reports/weekly/)（文件名 `YYYY-MM-DD.md`），并更新下方「最新报告」索引表
- **邮件通知** — 同步发送邮件周报

## 追踪语言

`Python` · `TypeScript` · `Rust` · `Go` · `Java`

## 技术架构

```
GitHub Trending (HTML) ──→ 抓取解析 ──→ GitHub API 补充
                                              │
                                              ▼
                           邮件通知 ←── Markdown 报告 ←── DeepSeek AI 解读
                                              │
                                              ▼
                                     推送到本仓库 (reports/)
```

运行平台：[Google Apps Script](https://script.google.com)

## 项目结构

```
ai_news/
├── README.md              # 项目说明 + 报告索引
├── src/                   # GAS 源代码
│   ├── Config.gs          # 配置文件
│   ├── Utils.gs           # 工具函数
│   ├── TrendingScraper.gs # Trending 页面抓取
│   ├── GitHubAPI.gs       # GitHub API 数据补充
│   ├── DeepSeekAPI.gs     # DeepSeek 智能解读
│   ├── GitHubPublisher.gs # 报告推送到 GitHub
│   ├── ReportGenerator.gs # Markdown 报告生成
│   ├── Notifier.gs        # Drive 保存 + 邮件推送
│   └── Main.gs            # 主入口
└── reports/               # 自动生成的周报
    └── weekly/            # 按周归档
```

## License

MIT
