#!/bin/bash
set -e

echo "🚀 开始部署AI热点资讯日报..."

# 检查是否已安装vercel-cli
if ! command -v vercel &> /dev/null; then
  echo "正在安装vercel-cli..."
  npm install -g vercel
fi

# 从环境变量获取 token
if [ -z "$VERCEL_TOKEN" ]; then
  echo "错误: 未设置 VERCEL_TOKEN 环境变量"
  exit 1
fi

# 部署到Vercel
echo "正在部署..."
vercel --prod --token="$VERCEL_TOKEN" --yes

echo "✅ 部署完成！"
