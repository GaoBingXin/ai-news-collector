#!/bin/bash
set -e

echo "🚀 开始部署AI热点资讯日报..."

# 检查是否已安装vercel-cli
if ! command -v vercel &> /dev/null; then
  echo "正在安装vercel-cli..."
  npm install -g vercel
fi

# 设置环境变量
export VERCEL_TOKEN="vcp_02wC5OyXJgW05hHayuBQAR6GV8itxaZm6TSTNdbOYu0FblBBXV3XcGnl"

# 部署到Vercel
echo "正在部署..."
vercel --prod --token="vcp_02wC5OyXJgW05hHayuBQAR6GV8itxaZm6TSTNdbOYu0FblBBXV3XcGnl" --yes

echo "✅ 部署完成！"
