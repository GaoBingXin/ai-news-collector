const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

function getCategoryEmoji(category) {
    const emojis = { '大模型': '🧠', 'OpenAI': '🚀', 'AI综合': '💡', '产品': '📦', '应用': '🎯', '其他': '📌' };
    return emojis[category] || '📌';
}

function renderContent(newsByCategory) {
    if (!newsByCategory || Object.keys(newsByCategory).length === 0) {
        return '<div class="empty-state"><h2>📭 该日期暂无资讯</h2></div>';
    }
    
    let html = '';
    for (const [category, items] of Object.entries(newsByCategory)) {
        html += '<section class="category-section">';
        html += '<h2 class="category-title">' + getCategoryEmoji(category) + ' ' + category + '</h2>';
        html += '<div class="news-list">';
        
        for (const item of items) {
            const dateStr = item.date ? new Date(item.date).toLocaleDateString('zh-CN') : '';
            html += '<article class="news-item">';
            html += '<h3 class="news-title"><a href="' + item.link + '" target="_blank">' + item.title + '</a></h3>';
            html += '<div class="news-meta"><span class="news-source">' + item.source + '</span><span>📅 ' + dateStr + '</span></div>';
            html += '<p class="news-summary">' + (item.summary || '') + '</p>';
            html += '</article>';
        }
        
        html += '</div></section>';
    }
    return html;
}

async function getAvailableDates() {
    const dataDir = path.join(__dirname, '../data');
    const files = await fs.readdir(dataDir);
    const dates = files
        .filter(f => f.match(/^news-\d{4}-\d{2}-\d{2}\.json$/))
        .map(f => f.replace('news-', '').replace('.json', ''))
        .sort()
        
    return dates;
}

async function generateHTML() {
    console.log('开始生成HTML页面...');
    
    const dataDir = path.join(__dirname, '../data');
    const dates = await getAvailableDates();
    const today = dates.length > 0 ? dates[0] : format(new Date(), 'yyyy-MM-dd');
    
    // 读取所有日期的数据
    const allData = {};
    for (const date of dates) {
        const filePath = path.join(dataDir, 'news-' + date + '.json');
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            allData[date] = JSON.parse(content);
        } catch {
            allData[date] = { date: date, count: 0, news: [] };
        }
    }
    
    const data = allData[today] || { date: today, count: 0, news: [] };
    const displayDate = format(new Date(today + 'T00:00:00'), 'yyyy年MM月dd日');
    
    // 按类别分组
    const newsByCategory = {};
    for (const item of data.news) {
        const category = item.category || '其他';
        if (!newsByCategory[category]) newsByCategory[category] = [];
        newsByCategory[category].push(item);
    }

    // 生成日期选择器选项
    let dateOptions = '';
    for (const d of dates) {
        const dateLabel = format(new Date(d + 'T00:00:00'), 'yyyy年MM月dd日');
        dateOptions += '<option value="' + d + '">' + dateLabel + '</option>';
    }

    const contentHtml = renderContent(newsByCategory);

    // 生成HTML
    const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n' +
        '<meta charset="UTF-8">\n' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
        '<title>AI热点资讯日报 - ' + displayDate + '</title>\n' +
        '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">\n' +
        '<style>\n' +
        '* { margin: 0; padding: 0; box-sizing: border-box; }\n' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }\n' +
        '.container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }\n' +
        '.header { text-align: center; margin-bottom: 40px; color: white; }\n' +
        '.title { font-size: 3.5rem; font-weight: 800; margin-bottom: 10px; }\n' +
        '.date-selector { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; }\n' +
        '.date-selector label { font-size: 1.2rem; font-weight: 500; }\n' +
        '.date-selector select { padding: 12px 24px; font-size: 1rem; border: none; border-radius: 50px; background: white; color: #333; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }\n' +
        '.nav-buttons { display: flex; gap: 10px; }\n' +
        '.nav-btn { padding: 10px 20px; font-size: 0.9rem; border: none; border-radius: 25px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; }\n' +
        '.nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }\n' +
        '.stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 40px; flex-wrap: wrap; }\n' +
        '.stat-item { text-align: center; color: white; }\n' +
        '.stat-value { font-size: 3rem; font-weight: 700; }\n' +
        '.stat-label { font-size: 1rem; opacity: 0.9; }\n' +
        '.content { display: grid; gap: 30px; }\n' +
        '.category-section { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }\n' +
        '.category-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #667eea; }\n' +
        '.news-list { display: grid; gap: 20px; }\n' +
        '.news-item { padding: 20px; border-radius: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #667eea; }\n' +
        '.news-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 10px; }\n' +
        '.news-title a { color: #2d3436; text-decoration: none; }\n' +
        '.news-meta { display: flex; gap: 15px; font-size: 0.85rem; color: #636e72; margin-bottom: 10px; }\n' +
        '.news-source { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3px 10px; border-radius: 15px; font-size: 0.8rem; }\n' +
        '.news-summary { color: #636e72; }\n' +
        '.footer { text-align: center; margin-top: 50px; padding: 30px; color: rgba(255,255,255,0.7); font-size: 0.9rem; }\n' +
        '.empty-state { text-align: center; padding: 60px 20px; color: white; }\n' +
        '@media (max-width: 768px) { .title { font-size: 2rem; } .stat-value { font-size: 2rem; } }\n' +
        '</style>\n' +
        '</head>\n<body>\n' +
        '<div class="container">\n' +
        '<header class="header">\n' +
        '<h1 class="title">🤖 AI热点资讯日报</h1>\n' +
        '<div class="date-selector">\n' +
        '<label>📅 选择日期：</label>\n' +
        '<select id="dateSelect">' + dateOptions + '</select>\n' +
        '<div class="nav-buttons">\n' +
        '<button class="nav-btn" id="prevBtn">← 前一天</button>\n' +
        '<button class="nav-btn" id="nextBtn">后一天 →</button>\n' +
        '</div>\n' +
        '</div>\n' +
        '</header>\n' +
        '<div id="stats" class="stats">\n' +
        '<div class="stat-item"><div class="stat-value">' + data.count + '</div><div class="stat-label">📰 资讯总数</div></div>\n' +
        '<div class="stat-item"><div class="stat-value">' + Object.keys(newsByCategory).length + '</div><div class="stat-label">🏷️ 分类数量</div></div>\n' +
        '<div class="stat-item"><div class="stat-value">' + new Set(data.news.map(n => n.source)).size + '</div><div class="stat-label">📡 数据源</div></div>\n' +
        '</div>\n' +
        '<div id="content" class="content">' + contentHtml + '</div>\n' +
        '<footer class="footer"><p>🤖 AI资讯采集系统 | 自动更新于每天 9:00</p></footer>\n' +
        '</div>\n' +
        '<script>\n' +
        'const allData = ' + JSON.stringify(allData) + ';\n' +
        'const dates = ' + JSON.stringify(dates) + ';\n' +
        'function renderContent(newsByCategory) { ' +
        'if (!newsByCategory || Object.keys(newsByCategory).length === 0) return \'<div class="empty-state"><h2>📭 该日期暂无资讯</h2></div>\';' +
        'let html = "";' +
        'for (const [category, items] of Object.entries(newsByCategory)) {' +
        'html += \'<section class="category-section">\';' +
        'html += \'<h2 class="category-title">\' + ({"大模型":"🧠","OpenAI":"🚀","AI综合":"💡","产品":"📦","应用":"🎯","其他":"📌"}[category]||"📌") + " " + category + "</h2>";' +
        'html += \'<div class="news-list">\';' +
        'for (const item of items) {' +
        'const dateStr = item.date ? new Date(item.date).toLocaleDateString("zh-CN") : "";' +
        'html += \'<article class="news-item">\';' +
        'html += \'<h3 class="news-title"><a href="\' + item.link + \'" target="_blank">\' + item.title + "</a></h3>";' +
        'html += \'<div class="news-meta"><span class="news-source">\' + item.source + "</span><span>📅 " + dateStr + "</span></div>";' +
        'html += \'<p class="news-summary">\' + (item.summary || "") + "</p>";' +
        'html += "</article>";' +
        '}' +
        'html += "</div></section>";' +
        '}' +
        'return html;' +
        '}' +
        'function updateDisplay(dateStr) {' +
        'const data = allData[dateStr] || { date: dateStr, count: 0, news: [] };' +
        'const newsByCategory = {};' +
        'data.news.forEach(item => {' +
        'const category = item.category || "其他";' +
        'if (!newsByCategory[category]) newsByCategory[category] = [];' +
        'newsByCategory[category].push(item);' +
        '});' +
        'document.getElementById("content").innerHTML = renderContent(newsByCategory);' +
        'document.getElementById("dateSelect").value = dateStr;' +
        'document.getElementById("stats").innerHTML = ' +
        '"<div class=\\"stat-item\\"><div class=\\"stat-value\\">" + data.count + "</div><div class=\\"stat-label\\">📰 资讯总数</div></div>" + ' +
        '"<div class=\\"stat-item\\"><div class=\\"stat-value\\">" + Object.keys(newsByCategory).length + "</div><div class=\\"stat-label\\">🏷️ 分类数量</div></div>" + ' +
        '"<div class=\\"stat-item\\"><div class=\\"stat-value\\">" + new Set(data.news.map(n => n.source)).size + "</div><div class=\\"stat-label\\">📡 数据源</div></div>";' +
        'const currentIndex = dates.indexOf(dateStr);' +
        'document.getElementById("prevBtn").disabled = currentIndex === 0;' +
        'document.getElementById("nextBtn").disabled = currentIndex === dates.length - 1;' +
        'document.title = "AI热点资讯日报 - " + new Date(dateStr + "T00:00:00").toLocaleDateString("zh-CN", {year:"numeric", month:"long", day:"numeric"});' +
        '}' +
        'document.getElementById("dateSelect").addEventListener("change", function() { updateDisplay(this.value); });' +
        'document.getElementById("prevBtn").addEventListener("click", function() { const currentIndex = dates.indexOf(document.getElementById("dateSelect").value); if (currentIndex > 0) updateDisplay(dates[currentIndex - 1]); });' +
        'document.getElementById("nextBtn").addEventListener("click", function() { const currentIndex = dates.indexOf(document.getElementById("dateSelect").value); if (currentIndex < dates.length - 1) updateDisplay(dates[currentIndex + 1]); });' +
        'document.getElementById("dateSelect").value = "' + today + '";' +
        'updateDisplay("' + today + '");' +
        '</script>\n' +
        '</body>\n</html>';

    const publicDir = path.join(__dirname, '../public');
    await fs.mkdir(publicDir, { recursive: true });
    await fs.writeFile(path.join(publicDir, 'index.html'), html);
    
    console.log('HTML生成完成！');
}

generateHTML().catch(console.error);
