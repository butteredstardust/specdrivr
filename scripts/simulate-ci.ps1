# Specdrivr Local CI Simulator (PowerShell)
# Mirrors GitHub Actions environment exactly

Write-Host "🚀 Starting Local CI Simulation..." -ForegroundColor Cyan

# Build and start services
Write-Host "📦 Building and starting Docker services..." -ForegroundColor Yellow
docker-compose -f docker-compose.ci.yml up -d --build runner

# Wait for services to be ready
Write-Host "⏳ Waiting for runner to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Helper to run commands in the runner
function Run-InRunner {
    param([string]$Command)
    Write-Host "🏃 Executing: $Command" -ForegroundColor Gray
    docker-compose -f docker-compose.ci.yml exec -T runner bash -c $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Command failed: $Command" -ForegroundColor Red
        exit 1
    }
}

try {
    # 1. Install dependencies
    Run-InRunner "pnpm install"

    # 2. Lint
    Write-Host "🔍 Running Lint..." -ForegroundColor Cyan
    Run-InRunner "pnpm lint --max-warnings 0"

    # 3. Type Check
    Write-Host "🏷️ Running Type Check..." -ForegroundColor Cyan
    Run-InRunner "pnpm tsc --noEmit"

    # 4. Database Setup
    Write-Host "🗄️ Setting up database..." -ForegroundColor Cyan
    Run-InRunner "pnpm db:migrate"

    # 5. Run Tests
    Write-Host "🧪 Running Unit Tests..." -ForegroundColor Cyan
    Run-InRunner "pnpm vitest run"

    Write-Host "✅ Local CI Simulation passed!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Local CI Simulation failed!" -ForegroundColor Red
    exit 1
}
finally {
    # Optionally stop services
    # docker-compose -f docker-compose.ci.yml down
}
