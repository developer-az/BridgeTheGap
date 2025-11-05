# Setup Environment Variables for Bridge The Gap
# TEMPLATE VERSION - Replace YOUR_OPENROUTER_KEY_HERE with your actual key

Write-Host "🔧 Setting up environment files..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Replace YOUR_OPENROUTER_KEY_HERE with your actual OpenRouter API key!" -ForegroundColor Yellow
Write-Host "    Get your key from: https://openrouter.ai/keys" -ForegroundColor Yellow
Write-Host ""

# Prompt for OpenRouter API key
$openRouterKey = Read-Host "Enter your OpenRouter API key (or press Enter to skip)"
if ([string]::IsNullOrWhiteSpace($openRouterKey)) {
    $openRouterKey = "YOUR_OPENROUTER_KEY_HERE"
    Write-Host "⚠️  Skipped - you'll need to add the key manually later" -ForegroundColor Yellow
}

# Frontend .env.local
$frontendEnv = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter AI API
OPENROUTER_API_KEY=$openRouterKey

# Amadeus API (for flights) - Optional
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

# Google Maps API (for trains/buses) - Optional
GOOGLE_MAPS_API_KEY=your_google_api_key
"@

# Backend .env
$backendEnv = @"
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter AI API
OPENROUTER_API_KEY=$openRouterKey

# Amadeus API (for flights) - Optional
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

# Google Maps API (for trains/buses) - Optional
GOOGLE_MAPS_API_KEY=your_google_api_key

# Server Configuration
PORT=3001
"@

# Create frontend .env.local
$frontendPath = Join-Path $PSScriptRoot "frontend-web\.env.local"
if (Test-Path $frontendPath) {
    Write-Host "⚠️  frontend-web\.env.local already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -eq 'y') {
        $frontendEnv | Out-File -FilePath $frontendPath -Encoding UTF8
        Write-Host "✅ Updated frontend-web\.env.local" -ForegroundColor Green
    }
} else {
    $frontendEnv | Out-File -FilePath $frontendPath -Encoding UTF8
    Write-Host "✅ Created frontend-web\.env.local" -ForegroundColor Green
}

# Create backend .env
$backendPath = Join-Path $PSScriptRoot "backend\.env"
if (Test-Path $backendPath) {
    Write-Host "⚠️  backend\.env already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -eq 'y') {
        $backendEnv | Out-File -FilePath $backendPath -Encoding UTF8
        Write-Host "✅ Updated backend\.env" -ForegroundColor Green
    }
} else {
    $backendEnv | Out-File -FilePath $backendPath -Encoding UTF8
    Write-Host "✅ Created backend\.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Environment files setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your Supabase credentials to both .env files"
Write-Host "2. (Optional) Add Amadeus and Google Maps API keys"
if ($openRouterKey -eq "YOUR_OPENROUTER_KEY_HERE") {
    Write-Host "3. Add your OpenRouter API key (get it from https://openrouter.ai/keys)" -ForegroundColor Yellow
} else {
    Write-Host "3. Your OpenRouter API key is already configured! ✅"
}
Write-Host ""
Write-Host "🚀 Then run: .\start-app.ps1" -ForegroundColor Green

