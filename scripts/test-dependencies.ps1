# Script to demonstrate a missing dependency error
# Simulates what happens when a workflow expects a tool (e.g. 'docker', 'kubectl', or 'custom-tool') that is not installed on the self-hosted runner.

$RequiredTools = @("docker", "kubectl", "custom-cli-tool")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Verificando dependencias del sistema en el Runner       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$MissingTools = @()

foreach ($tool in $RequiredTools) {
    Write-Host "Buscando comando '$tool'..." -NoNewline
    $path = Get-Command $tool -ErrorAction SilentlyContinue
    if ($path) {
        Write-Host " [ENCONTRADO] en $($path.Source)" -ForegroundColor Green
    } else {
        Write-Host " [NO ENCONTRADO]" -ForegroundColor Red
        $MissingTools += $tool
    }
}

if ($MissingTools.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Faltan dependencias críticas necesarias para continuar con el despliegue:" -ForegroundColor Red
    foreach ($tool in $MissingTools) {
        Write-Host "  - $tool" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Para solucionar este error, debes instalar estas herramientas en la máquina del runner" -ForegroundColor Yellow
    Write-Host "y asegurarte de agregarlas a la variable de entorno PATH del sistema." -ForegroundColor Yellow
    Write-Host "Después, reinicia el servicio del runner (run.cmd)." -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Red
    
    # Exit with code 1 to fail the GitHub Actions job
    exit 1
} else {
    Write-Host ""
    Write-Host "¡Todas las dependencias están resueltas!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    exit 0
}
