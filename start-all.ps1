# TrustTentacle Startup Script 🐙
# Octopus Hackathon 2025

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                ║" -ForegroundColor Cyan
Write-Host "║      🐙 TrustTentacle Startup Script 🐙       ║" -ForegroundColor Cyan
Write-Host "║           Octopus Hackathon 2025               ║" -ForegroundColor Cyan
Write-Host "║                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Limpiar procesos anteriores
Write-Host "🛑 Paso 1: Deteniendo procesos anteriores..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos`n" -ForegroundColor Green

# Paso 2: Iniciar Backend
Write-Host "🔌 Paso 2: Iniciando Backend API (puerto 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '🔌 BACKEND API - TrustTentacle' -ForegroundColor Cyan -BackgroundColor DarkBlue; cd D:\TrustTentacles\backend; node src/server.js"
)
Start-Sleep -Seconds 3

# Verificar Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend activo en http://localhost:3001`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend no responde (puede tardar más en iniciar)`n" -ForegroundColor Yellow
}

# Paso 3: Iniciar Frontend
Write-Host "🌐 Paso 3: Iniciando Frontend Web (puerto 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '🌐 FRONTEND WEB - TrustTentacle' -ForegroundColor Cyan -BackgroundColor DarkBlue; cd D:\TrustTentacles\web; pnpm dev"
)
Start-Sleep -Seconds 5

# Paso 4: Información final
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                ║" -ForegroundColor Green
Write-Host "║           ✅ SERVIDORES INICIADOS ✅            ║" -ForegroundColor Green
Write-Host "║                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📍 URLs Disponibles:" -ForegroundColor Cyan
Write-Host "   Backend API:  " -NoNewline
Write-Host "http://localhost:3001" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "   Frontend Web: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""

Write-Host "🔍 Verificación:" -ForegroundColor Yellow
Write-Host "   • Espera 5-10 segundos para que Vite compile" -ForegroundColor Gray
Write-Host "   • Si puerto 3000 no funciona, prueba: http://localhost:5173" -ForegroundColor Gray
Write-Host "   • Las ventanas de PowerShell mostrarán errores si hay" -ForegroundColor Gray
Write-Host ""

Write-Host "🐙 Features:" -ForegroundColor Magenta
Write-Host "   ✓ Logo profesional del pulpo (mismo que extensión)" -ForegroundColor White
Write-Host "   ✓ Chatbot educativo (esquina inferior derecha)" -ForegroundColor White
Write-Host "   ✓ 8 tentáculos de protección activos" -ForegroundColor White
Write-Host "   ✓ Tentáculo de IA detectando phishing" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tip: Presiona Ctrl+C en las ventanas para detener los servidores" -ForegroundColor Cyan
Write-Host ""

# Esperar y verificar Frontend
Write-Host "⏳ Esperando que Vite compile..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Frontend activo y listo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 ¡Abre tu navegador en http://localhost:3000!" -ForegroundColor Green -BackgroundColor DarkGreen
} catch {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3
        Write-Host "✅ Frontend activo en puerto alternativo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 ¡Abre tu navegador en http://localhost:5173!" -ForegroundColor Green -BackgroundColor DarkGreen
    } catch {
        Write-Host "⚠️  Frontend aún iniciando..." -ForegroundColor Yellow
        Write-Host "   Revisa la ventana de PowerShell del Frontend para ver el puerto" -ForegroundColor Gray
    }
}

Write-Host ""
Read-Host "Presiona Enter para cerrar esta ventana"
