# Windows PowerShell script to guide through GitHub Actions Runner download, extraction, and configuration.
# Run this script to automatically prepare the runner files.

$ErrorActionPreference = "Stop"

# Configuration
$RunnerVersion = "2.317.0"
$RunnerDir = Join-Path -Path $PSScriptRoot -ChildPath "..\runner"
$RunnerZip = Join-Path -Path $PSScriptRoot -ChildPath "actions-runner.zip"
$DownloadUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/actions-runner-win-x64-$RunnerVersion.zip"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Configuración de GitHub Actions Self-Hosted Runner      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script descargará y extraerá el runner versión v$RunnerVersion en:"
Write-Host "  $RunnerDir" -ForegroundColor Yellow
Write-Host ""

# Create runner directory if it doesn't exist
if (-not (Test-Path -Path $RunnerDir)) {
    Write-Host "Creando directorio del runner..." -ForegroundColor Green
    New-Item -ItemType Directory -Force -Path $RunnerDir | Out-Null
}

# Download the runner zip file
if (-not (Test-Path -Path $RunnerZip)) {
    Write-Host "Descargando runner desde $DownloadUrl..." -ForegroundColor Green
    try {
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $RunnerZip -UseBasicParsing
        Write-Host "Descarga completada." -ForegroundColor Green
    }
    catch {
        Write-Host "Error descargando el runner: $_" -ForegroundColor Red
        Write-Host "Por favor, asegúrate de tener conexión a Internet y reintenta." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "El archivo ZIP del runner ya existe en $RunnerZip. Omitiendo descarga." -ForegroundColor Yellow
}

# Extract the runner
Write-Host "Extrayendo el runner..." -ForegroundColor Green
try {
    Expand-Archive -Path $RunnerZip -DestinationPath $RunnerDir -Force
    Write-Host "Extracción completada con éxito." -ForegroundColor Green
    
    # Remove ZIP file to clean up
    Remove-Item -Path $RunnerZip -Force
    Write-Host "Archivo temporal ZIP eliminado." -ForegroundColor Green
}
catch {
    Write-Host "Error al extraer el runner: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "¡Runner descargado y extraído correctamente!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pasos para registrar el runner en tu repositorio de GitHub:" -ForegroundColor Cyan
Write-Host "1. Ve a tu repositorio de GitHub: Settings -> Actions -> Runners -> New self-hosted runner."
Write-Host "2. Selecciona la pestaña 'Windows'."
Write-Host "3. Copia el token de registro que aparece en el comando de configuración."
Write-Host "4. Abre PowerShell como Administrador, navega a la carpeta del runner:"
Write-Host "   cd `"$RunnerDir`"" -ForegroundColor Yellow
Write-Host "5. Ejecuta el comando de configuración:"
Write-Host "   .\config.cmd --url https://github.com/TU_USUARIO/TU_REPOSITORIO --token TU_TOKEN --labels self-hosted,windows,local-runner" -ForegroundColor Yellow
Write-Host "6. Ejecuta el runner con:"
Write-Host "   .\run.cmd" -ForegroundColor Yellow
Write-Host ""
Write-Host "Nota: Puedes configurar múltiples etiquetas (labels) durante la ejecución de config.cmd"
Write-Host "==========================================================" -ForegroundColor Cyan
