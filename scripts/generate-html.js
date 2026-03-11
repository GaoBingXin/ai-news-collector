const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

// 获取所有可用的历史日期
async function getAvailableDates() {
  const dataDir = path.join(__dirname, '../data');
  const files = await fs.readdir(dataDir);
  const dates = files
    .filter(f => f.match(/^news-\d{4}-\d{2}-\d{2}\.json$/))
    .map(f => f.replace('news-', '').replace('.json', ''))
    .sort()
    .reverse(); // 最新的在前
  return dates;
}

// 读取指定日期的数据
async function getDataByDate(dateStr) {
  const dataPath = path.join(__dirname, `../data/news-${dateStr}.json`);
  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// 生成精美的HTML页面
async function generateHTML(targetDate = null) {
  console.log('开始生成HTML页面...');
  
  const today = targetDate || format(new Date(), 'yyyy-MM-dd');
  const dates = await getAvailableDates();
  
  // 如果没有指定日期但有历史数据，使用最新日期
  if (!dates.includes(today) && dates.length > 0) {
    today = dates[0];
  }
  
  // 读取数据
  let data = await getDataByDate(today);
  
  if (!data) {
    data = {
      date: today,
      count: 0,
      news: []
    };
  }

  const displayDate = format(new Date(today + 'T00:00:00'), 'yyyy年MM月dd日');
  
  // 按类别分组
  const newsByCategory = {};
  data.news.forEach(item => {
    const category = item.category || '其他';
    if (!newsByCategory[category]) {
      newsByCategory[category] = [];
    }
    newsByCategory[category].push(item);
  });

  // 生成日期选择器选项
  const dateOptions = dates.map(d => {
    const dateLabel = format(new Date(d + 'T00:00:00'), 'yyyy年MM月dd日');
    const selected = d === today ? 'selected' : '';
    return `<option value="${d}" ${selected}>${dateLabel}</option>`;
  }).join('');

  // 生成HTML
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI热点资讯日报 - ${displayDate}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }

        .title {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .date-selector {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .date-selector label {
            font-size: 1.2rem;
            color: white;
            font-weight: 500;
        }

        .date-selector select {
            padding: 12px 24px;
            font-size: 1rem;
            border: none;
            border-radius: 50px;
            background: white;
            color: #333;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }

        .date-selector select:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .date-selector select:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
        }

        .nav-buttons {
            display: flex;
            gap: 10px;
        }

        .nav-btn {
            padding: 10px 20px;
            font-size: 0.9rem;
            border: none;
            border-radius: 25px;
            background: rgba(255,255,255,0.2);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .nav-btn:hover:not(:disabled) {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }

        .nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }

        .stat-item {
            text-align: center;
            color: white;
        }

        .stat-value {
            font-size: 3rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 1rem;
            opacity: 0.9;
        }

        .content {
            display: grid;
            gap: 30px;
        }

        .category-section {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .category-section:hover {
            transform: translateY(-5px);
        }

        .category-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .category-综合 { border-color: #ff6b6b; }
        .category-大模型 { border-color: #4ecdc4; }
        .category-AI综合 { border-color: #45b7d1; }
        .category-OpenAI { border-color: #96ceb4; }
        .category-产品 { border-color: #ffeaa7; }
        .category-应用 { border-color: #dfe6e9; }

        .news-list {
            display: grid;
            gap: 20px;
        }

        .news-item {
            padding: 20px;
            border-radius: 15px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
        }

        .news-item:hover {
            transform: translateX(5px);
            border-left-color: #667eea;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .news-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #2d3436;
        }

        .news-title a {
            color: inherit;
            text-decoration: none;
        }

        .news-title a:hover {
            color: #667eea;
        }

        .news-meta {
            display: flex;
            gap: 15px;
            font-size: 0.85rem;
            color: #636e72;
            margin-bottom: 10px;
        }

        .news-source {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
        }

        .news-summary {
            color: #636e72;
            line-height: 1.7;
        }

        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: white;
        }

        .empty-state h2 {
            font-size: 2rem;
            margin-bottom: 15px;
        }

        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
            
            .stats {
                gap: 20px;
            }
            
            .stat-value {
                font-size: 2rem;
            }
            
            .container {
                padding: 20px 15px;
            }
            
            .date-selector {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1 class="title">🤖 AI热点资讯日报</h1>
            <div class="date-selector">
                <label>📅 选择日期：</label>
                <select id="dateSelect" onchange="changeDate(this.value)">
                    ${dateOptions}
                </select>
                <div class="nav-buttons">
                    <button class="nav-btn" id="prevBtn" onclick="navigateDate(-1)">← 前一天</button>
                    <button class="nav-btn" id="nextBtn" onclick="navigateDate(1)">后一天 →</button>
                </div>
            </div>
        </header>

        ${data.count > 0 ? `
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${data.count}</div>
                <div class="stat-label">📰 资讯总数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Object.keys(newsByCategory).length}</div>
                <div class="stat-label">🏷️ 分类数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${new Set(data.news.map(n => n.source)).size}</div>
                <div class="stat-label">📡 数据源</div>
            </div>
        </div>

        <div class="content">
            ${Object.entries(newsByCategory).map(([category, items]) => `
                <section class="category-section">
                    <h2 class="category-title">${getCategoryEmoji(category)} ${category}</h2>
                    <div class="news-list">
                        ${items.map(item => `
                            <article class="news-item">
                                <h3 class="news-title">
                                    <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
                                </h3>
                                <div class="news-meta">
                                    <span class="news-source">${item.source}</span>
                                    <span>📅 ${item.date ? new Date(item.date).toLocaleDateString('zh-CN') : ''}</span>
                                </div>
                                <p class="news-summary">${item.summary || ''}</p>
                            </article>
                        `).join('')}
                    </div>
                </section>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state">
            <h2>📭 该日期暂无资讯</h2>
            <p>请选择其他日期查看历史资讯</p>
        </div>
        `}

        <footer class="footer">
            <p>🤖 AI资讯采集系统 | 自动更新于每天 9:00</p>
            <p>数据来源：量子位、InfoQ、MIT News等</p>
        </footer>
    </div>

    <script>
        const dates = ${JSON.stringify(dates)};
        let currentIndex = dates.indexOf('${today}');

        function getCategoryEmoji(category) {
            const emojis = {
                '大模型': '🧠',
                'OpenAI': '🚀',
                'AI综合': '💡',
                '产品': '📦',
                '应用': '🎯',
                '其他': '📌'
            };
            return emojis[category] || '📌';
        }

        function changeDate(date) {
            window.location.href = '/' + date + '.html';
        }

        function navigateDate(direction) {
            const newIndex = currentIndex + direction;
            if (newIndex >= 0 && newIndex < dates.length) {
                window.location.href = '/' + dates[newIndex] + '.html';
            }
        }

        // 禁用按钮
        document.getElementById('prevBtn').disabled = currentIndex === 0;
        document.getElementById('nextBtn').disabled = currentIndex === dates.length - 1;
    </script>
</body>
</html>
  `;

  // 生成当天的HTML文件
  const publicDir = path.join(__dirname, '../public');
  await fs.mkdir(publicDir, { recursive: true });
  
  // 生成 index.html（当天或最新）
  await fs.writeFile(path.join(publicDir, 'index.html'), html);
  
  // 同时生成带日期的HTML文件，便于直接访问
  await fs.writeFile(path.join(publicDir, `${today}.html`), html);
  
  console.log('HTML生成完成！');
}

// 辅助函数：获取分类emoji
function getCategoryEmoji(category) {
  const emojis = {
    '大模型': '🧠',
    'OpenAI': '🚀',
    'AI综合': '💡',
    '产品': '📦',
    '应用': '🎯',
    '其他': '📌'
  };
  return emojis[category] || '📌';
}

// 运行
generateHTML().catch(console.error);
