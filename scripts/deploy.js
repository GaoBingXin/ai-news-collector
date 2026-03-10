const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Vercel Token（从环境变量或参数获取）
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'vcp_02wC5OyXJgW05hHayuBQAR6GV8itxaZm6TSTNdbOYu0FblBBXV3XcGnl';

async function deployToVercel() {
  console.log('开始部署到Vercel...');
  
  try {
    // 确保public目录存在
    const publicDir = path.join(__dirname, '../public');
    try {
      await fs.access(publicDir);
    } catch {
      console.log('public目录不存在，创建...');
      await fs.mkdir(publicDir, { recursive: true });
      // 创建默认index.html
      await fs.writeFile(path.join(publicDir, 'index.html'), '<h1>AI热点资讯日报</h1><p>数据正在采集中...</p>');
    }

    // 创建vercel.json配置文件
    const vercelConfig = {
      "version": 2,
      "builds": [
        {
          "src": "public/**",
          "use": "@vercel/static"
        }
      ],
      "routes": [
        {
          "src": "/(.*)",
          "dest": "/public/$1"
        }
      ],
      "github": {
        "enabled": true,
        "silent": true
      },
      "env": {
        "NODE_ENV": "production"
      }
    };

    await fs.writeFile(
      path.join(__dirname, '../vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );

    // 创建部署脚本
    const deployScript = `#!/bin/bash
set -e

echo "🚀 开始部署AI热点资讯日报..."

# 检查是否已安装vercel-cli
if ! command -v vercel &> /dev/null; then
  echo "正在安装vercel-cli..."
  npm install -g vercel
fi

# 设置环境变量
export VERCEL_TOKEN="${VERCEL_TOKEN}"

# 部署到Vercel
echo "正在部署..."
vercel --prod --token="${VERCEL_TOKEN}" --yes

echo "✅ 部署完成！"
`;

    await fs.writeFile(
      path.join(__dirname, '../deploy.sh'),
      deployScript
    );

    // 设置执行权限
    await fs.chmod(path.join(__dirname, '../deploy.sh'), '755');

    console.log('部署配置已创建完成！');
    console.log('');
    console.log('📋 部署说明：');
    console.log('1. 将项目推送到GitHub');
    console.log('2. 在项目根目录运行: ./deploy.sh');
    console.log('3. 或使用Vercel网页界面导入GitHub仓库');
    console.log('');
    console.log('🔧 自动部署配置：');
    console.log('- 每天8点自动采集资讯');
    console.log('- 自动生成HTML页面');
    console.log('- 自动部署到Vercel');
    console.log('');
    console.log('📁 项目结构已准备就绪！');

  } catch (error) {
    console.error('部署配置创建失败:', error);
    process.exit(1);
  }
}

// 执行部署配置
if (require.main === module) {
  deployToVercel()
    .then(() => {
      console.log('部署脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('部署脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { deployToVercel };
