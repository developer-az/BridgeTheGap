# Bridge The Gap - Stop Script
# This script stops all running Node.js processes

Write-Host "🛑 Stopping Bridge The Gap Application..." -ForegroundColor Red
Write-Host ""

try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "✅ All Node.js processes stopped!" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No Node.js processes were running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')



