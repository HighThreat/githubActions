# Script to demonstrate a permissions error
# Simulates what happens when the runner runs under a standard user account but attempts privileged operations.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Ejecutando verificación de permisos de administrador   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if script is running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host "Usuario actual: $env:USERNAME"
Write-Host "¿Tiene privilegios de administrador?: " -NoNewline
if ($isAdmin) {
    Write-Host "SÍ" -ForegroundColor Green
} else {
    Write-Host "NO" -ForegroundColor Yellow
}
Write-Host ""

# Attempting a write operation on a protected directory (simulating permission error)
$protectedPath = "C:\Windows\System32\drivers\etc\hosts"
Write-Host "Intentando abrir y escribir temporalmente en un archivo protegido del sistema: $protectedPath"

try {
    # Attempt to append a comment to hosts file (this requires local admin)
    # We will do a read/write test
    $testLine = "# GitHub Actions Runner Test Write"
    Add-Content -Path $protectedPath -Value $testLine -ErrorAction Stop
    
    # If it succeeds (e.g. running in an admin terminal), we clean it up and warn
    Write-Host "ATENCIÓN: El runner se está ejecutando como ADMINISTRADOR. Operación exitosa." -ForegroundColor Yellow
    
    # Cleanup
    $content = Get-Content -Path $protectedPath
    $content | Where-Object { $_ -ne $testLine } | Set-Content -Path $protectedPath
    Write-Host "Cambios temporales revertidos." -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "FALLO ESPERADO: Acceso denegado (Permission Denied)." -ForegroundColor Red
    Write-Host "Detalles del error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "CAUSA: El runner no tiene privilegios suficientes para modificar archivos del sistema o interactuar con ciertos servicios." -ForegroundColor Yellow
    Write-Host "SOLUCIÓN:" -ForegroundColor Yellow
    Write-Host "  1. Si la tarea requiere permisos de administrador, configura el servicio del runner para ejecutarse con una cuenta administrativa o como servicio de sistema con privilegios apropiados." -ForegroundColor Yellow
    Write-Host "  2. Si la tarea no debería necesitar estos privilegios, modifica el script del workflow para operar dentro de la carpeta de trabajo del runner (RUNNER_WORKSPACE) o usar rutas no protegidas." -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Red
    
    # Exit with code 1 to indicate failure
    exit 1
}
