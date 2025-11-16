#!/bin/bash
# Script để push code lên GitHub
# Sử dụng: ./push-to-github.sh "commit message"

MESSAGE=${1:-"Update: Remove Stripe, add credit code system"}

echo "🔄 Đang kiểm tra git status..."
git status

echo ""
echo "📦 Đang add các file..."
git add .

echo ""
echo "💾 Đang commit với message: $MESSAGE"
git commit -m "$MESSAGE"

echo ""
echo "🚀 Đang push lên GitHub..."
git push origin main

echo ""
echo "✅ Hoàn thành! Code đã được push lên GitHub."
echo ""
echo "📝 Bước tiếp theo:"
echo "   1. Kiểm tra repository trên GitHub"
echo "   2. Xem file DEPLOY.md để deploy lên Cloud Run"

