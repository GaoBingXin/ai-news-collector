const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

// 生成精美的HTML页面
async function generateHTML() {
  console.log('开始生成HTML页面...');
  
  // 读取最新数据
  const dataPath = path.join(__dirname, '../data/latest.json');
  let data;
  
  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    data = JSON.parse(content);
  } catch (error) {
    console.error('读取数据失败:', error.message);
    // 创建示例数据
    data = {
      date: format(new Date(), 'yyyy-MM-dd'),
      count: 0,
      news: []
    };
  }

  const today = format(new Date(), 'yyyy年MM月dd日');
  
  // 按类别分组
  const newsByCategory = {};
  data.news.forEach(item => {
    if (!newsByCategory[item.category]) {
      newsByCategory[item.category] = [];
    }
    newsByCategory[item.category].push(item);
  });

  // 生成HTML
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI热点资讯日报 - ${today}</title>
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
            margin-bottom: 50px;
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

        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }

        .date-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 1rem;
            border: 1px solid rgba(255,255,255,0.3);
        }

        .stats {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 40px;
            border: 1px solid rgba(255,255,255,0.2);
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
        }

        .stat-item {
            text-align: center;
            color: white;
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 50px;
        }

        .category-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .category-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.15);
        }

        .category-header {
            padding: 25px 30px;
            color: white;
            position: relative;
            overflow: hidden;
        }

        .category-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 5px;
            position: relative;
            z-index: 2;
        }

        .category-count {
            font-size: 0.9rem;
            opacity: 0.9;
            position: relative;
            z-index: 2;
        }

        .category-bg {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.1;
            z-index: 1;
        }

        .news-list {
            padding: 0;
        }

        .news-item {
            padding: 20px 30px;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s ease;
        }

        .news-item:hover {
            background-color: #f8f9fa;
        }

        .news-item:last-child {
            border-bottom: none;
        }

        .news-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 8px;
            line-height: 1.4;
        }

        .news-title a {
            color: #333;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .news-title a:hover {
            color: #667eea;
        }

        .news-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: #666;
            margin-top: 10px;
        }

        .news-source {
            background: #f0f0f0;
            padding: 4px 12px;
            border-radius: 15px;
            font-weight: 500;
        }

        .news-date {
            opacity: 0.7;
        }

        .news-summary {
            color: #555;
            font-size: 0.95rem;
            line-height: 1.5;
            margin-top: 8px;
        }

        .footer {
            text-align: center;
            color: white;
            padding: 40px 0;
            opacity: 0.8;
            font-size: 0.9rem;
        }

        .footer a {
            color: white;
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .title {
                font-size: 2.5rem;
            }
            
            .categories {
                grid-template-columns: 1fr;
            }
            
            .container {
                padding: 20px 15px;
            }
        }

        /* 类别颜色配置 */
        .category-openai .category-header { background: linear-gradient(135deg, #10a37f 0%, #0d7a5f 100%); }
        .category-google .category-header { background: linear-gradient(135deg, #4285f4 0%, #2d5aa0 100%); }
        .category-anthropic .category-header { background: linear-gradient(135deg, #9d50bb 0%, #6e48aa 100%); }
        .category-deepseek .category-header { background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); }
        .category-图像生成 .category-header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); }
        .category-语言模型 .category-header { background: linear-gradient(135deg, #48cae4 0%, #0096c7 100%); }
        .category-研究进展 .category-header { background: linear-gradient(135deg, #06d6a0 0%, #04a777 100%); }
        .category-ai综合 .category-header { background: linear-gradient(135deg, #7209b7 0%, #560bad 100%); }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1 class="title">AI热点资讯日报</h1>
            <p class="subtitle">全网最新人工智能热点资讯，每日更新</p>
            <div class="date-badge">${today}</div>
        </header>

        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">${data.count}</div>
                <div class="stat-label">今日资讯</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${Object.keys(newsByCategory).length}</div>
                <div class="stat-label">资讯分类</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.news.length > 0 ? data.news[0].source : 'N/A'}</div>
                <div class="stat-label">主要来源</div>
            </div>
        </div>

        <div class="categories">
            ${Object.entries(newsByCategory).map(([category, items]) => `
            <div class="category-card category-${category.toLowerCase().replace(/[^a-z\u4e00-\u9fa5]/g, '')}">
                <div class="category-header">
                    <div class="category-bg"></div>
                    <h2 class="category-title">${category}</h2>
                    <div class="category-count">${items.length} 条资讯</div>
                </div>
                <div class="news-list">
                    ${items.map(item => `
                    <div class="news-item">
                        <h3 class="news-title">
                            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                                ${item.title}
                            </a>
                        </h3>
                        <div class="news-summary">${item.summary}</div>
                        <div class="news-meta">
                            <span class="news-source">${item.source}</span>
                            <span class="news-date">${formatDate(item.date)}</span>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            `).join('')}
        </div>
    </div>

    <footer class="footer">
        <p>🤖 本页面由AI自动生成，数据来源于各大AI资讯网站</p>
        <p>📅 更新时间：${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
        <p>🔗 项目开源地址：<a href="https://github.com/GaoBingXin/ai-news-collector" target="_blank">GitHub</a></p>
    </footer>

    <script>
        // 简单的页面交互
        document.addEventListener('DOMContentLoaded', function() {
            // 添加点击统计
            const newsLinks = document.querySelectorAll('.news-title a');
            newsLinks.forEach(link => {
                link.addEventListener('click', function() {
                    console.log('资讯点击:', this.textContent);
                });
            });

            // 自动刷新页面（每天一次）
            const refreshTime = 24 * 60 * 60 * 1000; // 24小时
            setTimeout(() => {
                location.reload();
            }, refreshTime);

            // 添加滚动动画
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            // 观察所有卡片
            document.querySelectorAll('.category-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(card);
            });
        });

        // 格式化日期
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60 * 60 * 1000) { // 1小时内
                return '刚刚';
            } else if (diff < 24 * 60 * 60 * 1000) { // 24小时内
                const hours = Math.floor(diff / (60 * 60 * 1000));
                return \`\${hours}小时前\`;
            } else {
                return date.toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric'
                });
            }
        }
    </script>
</body>
</html>
  `;

  // 保存HTML文件
  const publicDir = path.join(__dirname, '../public');
  await fs.mkdir(publicDir, { recursive: true });
  
  await fs.writeFile(path.join(publicDir, 'index.html'), html);
  console.log('HTML页面生成完成！');
  
  return html;
}

// 格式化日期显示
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 60 * 1000) { // 1小时内
      return '刚刚';
    } else if (diff < 24 * 60 * 60 * 1000) { // 24小时内
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    return '未知时间';
  }
}

// 执行生成
if (require.main === module) {
  generateHTML()
    .then(() => {
      console.log('HTML生成脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('HTML生成脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { generateHTML };
