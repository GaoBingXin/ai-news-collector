const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

// 配置资讯来源
const sources = [
  {
    name: '机器之心',
    type: 'rss',
    url: 'https://www.jiqizhixin.com/rss',
  },
  {
    name: '量子位',
    type: 'rss',
    url: 'https://www.qbitai.com/feed',
  },
  {
    name: 'AI科技大本营',
    type: 'rss',
    url: 'https://www.techbang.com/rss',
  },
  {
    name: 'OpenAI Blog',
    type: 'rss',
    url: 'https://openai.com/blog/rss',
  },
  {
    name: 'Google AI Blog',
    type: 'rss',
    url: 'https://ai.googleblog.com/feeds/posts/default',
  },
  {
    name: 'Hugging Face Blog',
    type: 'rss',
    url: 'https://huggingface.co/blog/rss',
  },
];

// 关键词过滤（只保留AI相关）
const aiKeywords = [
  'ai', '人工智能', '机器学习', '深度学习', '大模型', 'llm', 'gpt', 
  'chatgpt', 'midjourney', 'stable diffusion', '神经网络', 'transformer',
  'openai', 'anthropic', 'claude', 'gemini', 'deepseek', '文心一言', '通义千问'
];

// 主采集函数
async function collectNews() {
  console.log('开始采集AI热点资讯...');
  const allNews = [];
  const parser = new Parser();

  for (const source of sources) {
    try {
      console.log(`正在采集: ${source.name}`);
      
      if (source.type === 'rss') {
        const feed = await parser.parseURL(source.url);
        
        for (const item of feed.items) {
          // 检查是否包含AI关键词
          const title = item.title || '';
          const content = item.content || item.contentSnippet || '';
          const text = (title + ' ' + content).toLowerCase();
          
          const isAI = aiKeywords.some(keyword => 
            text.includes(keyword.toLowerCase())
          );
          
          if (isAI && item.title && item.link) {
            const news = {
              title: item.title.trim(),
              link: item.link,
              source: source.name,
              date: item.pubDate || new Date().toISOString(),
              summary: (item.contentSnippet || '').substring(0, 200) + '...',
              category: detectCategory(title + ' ' + content),
            };
            
            allNews.push(news);
          }
        }
      }
    } catch (error) {
      console.error(`采集失败 ${source.name}:`, error.message);
    }
  }

  // 按时间排序，最新的在前面
  allNews.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 限制数量，每天最多50条
  const news = allNews.slice(0, 50);

  // 保存数据
  const dataDir = path.join(__dirname, '../data');
  await fs.mkdir(dataDir, { recursive: true });
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const filename = path.join(dataDir, `news-${today}.json`);
  
  // 保存当天完整数据
  await fs.writeFile(filename, JSON.stringify({
    date: today,
    count: news.length,
    news: news
  }, null, 2));

  // 更新latest.json，保留当天完整数据（不限制数量）
  await fs.writeFile(path.join(dataDir, 'latest.json'), JSON.stringify({
    date: today,
    count: news.length,
    news: news
  }, null, 2));

  console.log(`采集完成！共收集 ${news.length} 条AI资讯`);
  return news;
}

// 检测资讯类别
function detectCategory(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('gpt') || textLower.includes('chatgpt') || textLower.includes('openai')) {
    return 'OpenAI';
  }
  if (textLower.includes('gemini') || textLower.includes('google')) {
    return 'Google';
  }
  if (textLower.includes('claude') || textLower.includes('anthropic')) {
    return 'Anthropic';
  }
  if (textLower.includes('deepseek')) {
    return 'DeepSeek';
  }
  if (textLower.includes('midjourney') || textLower.includes('stable diffusion') || textLower.includes('dall-e')) {
    return '图像生成';
  }
  if (textLower.includes('语言模型') || textLower.includes('llm') || textLower.includes('大模型')) {
    return '大模型';
  }
  if (textLower.includes('研究') || textLower.includes('论文') || textLower.includes('学术')) {
    return '研究进展';
  }
  
  return 'AI综合';
}

// 执行采集
if (require.main === module) {
  collectNews()
    .then(() => {
      console.log('资讯采集脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('采集脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { collectNews };
