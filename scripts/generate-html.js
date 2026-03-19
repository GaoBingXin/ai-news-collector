const fs = require('fs').promises;
const path = require('path');

async function generateHTML() {
  console.log('开始生成HTML页面...');
  
  const dataDir = path.join(__dirname, '../data');
  const publicDir = path.join(__dirname, '../public');
  
  // 读取最新数据
  const latestPath = path.join(dataDir, 'latest.json');
  const latestData = JSON.parse(await fs.readFile(latestPath, 'utf-8'));
  
  // 读取历史数据
  const files = await fs.readdir(dataDir);
  const newsFiles = files.filter(f => f.startsWith('news-') && f.endsWith('.json'));
  const allDates = newsFiles
    .map(f => f.replace('news-', '').replace('.json', ''))
    .sort();
  
  // 过滤：只过滤纯英文（0个中文字符）
  const filterPureEnglish = (news) => {
    return news.filter(item => {
      const chineseChars = (item.title.match(/[\u4e00-\u9fa5]/g) || []).length;
      return chineseChars > 0;  // 只要有至少1个中文字符就保留
    });
  };
  
  // 按日期组织数据
  const allData = {};
  for (const date of allDates) {
    try {
      const data = JSON.parse(await fs.readFile(path.join(dataDir, `news-${date}.json`), 'utf-8'));
      const filtered = filterPureEnglish(data.news);
      allData[date] = {
        ...data,
        count: filtered.length,
        news: filtered
      };
    } catch (e) {
      console.log(`读取 ${date} 失败:`, e.message);
    }
  }
  
  // 生成HTML
  const html = generateHTMLContent(allData, allDates);
  
  await fs.writeFile(path.join(publicDir, 'index.html'), html);
  console.log('HTML生成完成！');
}

function generateHTMLContent(allData, dates) {
  const allDataJson = JSON.stringify(allData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI热点资讯日报</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100%100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
.container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
.header { text-align: center; margin-bottom: 40px; color: white; }
.title { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; }
.date-selector { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; }
.date-selector label { font-size: 1.2rem; font-weight: 500; }
.date-selector select { padding: 12px 24px; font-size: 1rem; border: none; border-radius: 50px; background: white; color: #333; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
.nav-buttons { display: flex; gap: 10px; }
.nav-btn { padding: 10px 20px; font-size: 0.9rem; border: none; border-radius: 25px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; }
.nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.stats { display: flex; justify-content: center; gap: 30px; margin-bottom: 40px; flex-wrap: wrap; }
.stat-item { text-align: center; color: white; }
.stat-value { font-size: 2.5rem; font-weight: 700; }
.stat-label { font-size: 0.9rem; opacity: 0.9; }
.content { display: grid; gap: 20px; }
.category-section { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
.category-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #667eea; }
.news-list { display: grid; gap: 16px; }
.news-item { padding: 16px; border-radius: 12px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #667eea; }
.news-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word; }
.news-title a { color: #2d3436; text-decoration: none; word-break: break-word; }
.news-title a:hover { color: #667eea; }
.news-meta { display: flex; gap: 12px; font-size: 0.8rem; color: #636e72; margin-bottom: 8px; flex-wrap: wrap; }
.news-source { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; }
.news-summary { color: #636e72; font-size: 0.9rem; line-height: 1.6; }
.footer { text-align: center; margin-top: 40px; padding: 20px; color: rgba(255,255,255,0.7); font-size: 0.85rem; }
.empty-state { text-align: center; padding: 60px 20px; color: white; }
@media (max-width: 768px) { .title { font-size: 1.8rem; } .stat-value { font-size: 1.8rem; } .container { padding: 20px 15px; } }
</style>
</head>
<body>
<div class="container">
<header class="header">
<h1 class="title">🤖 AI热点资讯日报</h1>
<div class="date-selector">
<label>📅 选择日期：</label>
<select id="dateSelect"></select>
<div class="nav-buttons">
<button class="nav-btn" id="prevBtn">← 前一天</button>
<button class="nav-btn" id="nextBtn">后一天 →</button>
</div>
</div>
</header>
<div id="stats" class="stats"></div>
<div id="content" class="content"></div>
<footer class="footer"><p>🤖 AI资讯采集系统 | 每日自动更新</p></footer>
</div>
<script>
const allData = ${allDataJson};
const dates = ${JSON.stringify(dates)};

function renderContent(newsByCategory) {
  if (!newsByCategory || Object.keys(newsByCategory).length === 0) {
    return '<div class="empty-state"><h2>📭 该日期暂无资讯</h2></div>';
  }
  let html = "";
  for (const [category, items] of Object.entries(newsByCategory)) {
    const icon = {"大模型":"🧠","OpenAI":"🚀","AI综合":"💡","国产大模型":"🇨🇳","AI Agent":"📌","AI图像":"🎨","AI视频":"🎬","研究":"🔬","Google":"🔍","Anthropic":"💬"}[category] || "📌";
    html += '<section class="category-section">';
    html += '<h2 class="category-title">' + icon + ' ' + category + '</h2>';
    html += '<div class="news-list">';
    for (const item of items) {
      const dateStr = item.date ? new Date(item.date).toLocaleDateString("zh-CN") : "";
      html += '<article class="news-item">';
      html += '<h3 class="news-title"><a href="' + item.link + '" target="_blank">' + item.title + '</a></h3>';
      html += '<div class="news-meta"><span class="news-source">' + item.source + '</span><span>📅 ' + dateStr + '</span></div>';
      if (item.summary) html += '<p class="news-summary">' + item.summary + '</p>';
      html += '</article>';
    }
    html += '</div></section>';
  }
  return html;
}

function updateDisplay(dateStr) {
  const data = allData[dateStr] || { date: dateStr, count: 0, news: [] };
  const newsByCategory = {};
  data.news.forEach(item => {
    const category = item.category || "其他";
    if (!newsByCategory[category]) newsByCategory[category] = [];
    newsByCategory[category].push(item);
  });
  
  document.getElementById("content").innerHTML = renderContent(newsByCategory);
  document.getElementById("dateSelect").value = dateStr;
  
  const sourceCount = new Set(data.news.map(n => n.source)).size;
  document.getElementById("stats").innerHTML = 
    '<div class="stat-item"><div class="stat-value">' + data.count + '</div><div class="stat-label">📰 资讯总数</div></div>' +
    '<div class="stat-item"><div class="stat-value">' + Object.keys(newsByCategory).length + '</div><div class="stat-label">🏷️ 分类数量</div></div>' +
    '<div class="stat-item"><div class="stat-value">' + sourceCount + '</div><div class="stat-label">📡 数据源</div></div>';
  
  const currentIndex = dates.indexOf(dateStr);
  document.getElementById("prevBtn").disabled = currentIndex === 0;
  document.getElementById("nextBtn").disabled = currentIndex === dates.length - 1;
  document.title = "AI热点资讯日报 - " + new Date(dateStr + "T00:00:00").toLocaleDateString("zh-CN", {year:"numeric", month:"long", day:"numeric"});
}

const dateSelect = document.getElementById("dateSelect");
dates.forEach(d => {
  const opt = document.createElement("option");
  opt.value = d;
  const date = new Date(d + "T00:00:00");
  opt.textContent = date.toLocaleDateString("zh-CN", {year:"numeric", month:"long", day:"numeric"});
  dateSelect.appendChild(opt);
});

dateSelect.addEventListener("change", function() { updateDisplay(this.value); });
document.getElementById("prevBtn").addEventListener("click", function() { 
  const currentIndex = dates.indexOf(document.getElementById("dateSelect").value); 
  if (currentIndex > 0) updateDisplay(dates[currentIndex - 1]); 
});
document.getElementById("nextBtn").addEventListener("click", function() { 
  const currentIndex = dates.indexOf(document.getElementById("dateSelect").value); 
  if (currentIndex < dates.length - 1) updateDisplay(dates[currentIndex + 1]); 
});

dateSelect.value = dates[0];
updateDisplay(dates[0]);
</script>
</body>
</html>`;
}

if (require.main === module) {
  generateHTML()
    .then(() => { console.log('完成'); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { generateHTML };
