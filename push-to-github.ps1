# Script để push code lên GitHub
# Sử dụng: .\push-to-github.ps1 "commit message"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Update: Remove Stripe, add credit code system"
)

Write-Host "🔄 Đang kiểm tra git status..." -ForegroundColor Cyan
git status

Write-Host "`n📦 Đang add các file..." -ForegroundColor Cyan
git add .

Write-Host "`n💾 Đang commit với message: $Message" -ForegroundColor Cyan
git commit -m $Message

Write-Host "`n🚀 Đang push lên GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "`n✅ Hoàn thành! Code đã được push lên GitHub." -ForegroundColor Green
Write-Host "`n📝 Bước tiếp theo:" -ForegroundColor Yellow
Write-Host "   1. Kiểm tra repository trên GitHub" -ForegroundColor White
Write-Host "   2. Xem file DEPLOY.md để deploy lên Cloud Run" -ForegroundColor White

