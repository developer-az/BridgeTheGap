# Bridge The Gap - Startup Script
# This script stops any running instances and starts both servers cleanly

Write-Host "🌉 Bridge The Gap - Starting Application..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any existing Node.js processes
Write-Host "🔄 Stopping any existing Node.js processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Start-Sleep -Seconds 2
} catch {
    # No processes to kill
}

# Step 2: Clean up lock files
Write-Host "🧹 Cleaning up lock files..." -ForegroundColor Yellow
if (Test-Path "frontend-web\.next") {
    Remove-Item -Recurse -Force "frontend-web\.next" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Start Backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -PassThru
Start-Sleep -Seconds 3

# Step 4: Start Frontend
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Cyan
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend-web'; npm run dev" -PassThru
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✨ Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Two new PowerShell windows have opened." -ForegroundColor Yellow
Write-Host "   Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Visit http://localhost:3000 to use the app!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')



