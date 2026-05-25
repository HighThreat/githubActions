# Laboratorio 5 — Self-hosted runners y troubleshooting

Este repositorio contiene los entregables y recursos prácticos correspondientes al **Laboratorio 5: Self-hosted runners y troubleshooting**.

---

## Estructura del Proyecto

*   **[`.github/workflows/workflow-hibrido.yml`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/.github/workflows/workflow-hibrido.yml):** Pipeline principal que combina hosted runners (Ubuntu) con self-hosted runners (Windows local).
*   **[`.github/workflows/debug-logging.yml`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/.github/workflows/debug-logging.yml):** Workflow diseñado para diagnósticos y depuración detallada (`ACTIONS_RUNNER_DEBUG` y `ACTIONS_STEP_DEBUG`).
*   **[`scripts/setup-runner.ps1`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/scripts/setup-runner.ps1):** Script interactivo en PowerShell que automatiza la descarga y extracción del agente oficial del runner en tu sistema local Windows, guiándote en su registro.
*   **[`scripts/test-dependencies.ps1`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/scripts/test-dependencies.ps1):** Script para simular errores de dependencias de software faltantes en el runner.
*   **[`scripts/test-permissions.ps1`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/scripts/test-permissions.ps1):** Script para simular errores de permisos de administración y políticas de ejecución en el host Windows.
*   **[`docs/troubleshooting.md`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/docs/troubleshooting.md):** Documento oficial de entrega sobre diagnósticos de los 5 errores comunes y el uso de logs detallados.
*   **[`docs/seguridad.md`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/docs/seguridad.md):** Explicación y análisis detallado de riesgos de seguridad sobre runners persistentes, acceso a red corporativa y aislamiento del host.

---

## Instrucciones de Uso y Configuración

### Paso 1: Configurar el Self-hosted Runner en Windows
1. Abre una terminal de **PowerShell** y navega a la carpeta de scripts:
   ```powershell
   cd "c:\Users\alvarez\Desktop\proyectos\laboratorio-5\scripts"
   ```
2. Ejecuta el script de descarga y preparación:
   ```powershell
   .\setup-runner.ps1
   ```
   *Este script creará la carpeta `runner/` adyacente y descargará la versión oficial de GitHub Actions Runner.*
3. Sigue las instrucciones impresas en pantalla para registrar el runner en tu repositorio de GitHub usando el token que te provee la interfaz web de GitHub en: **Settings -> Actions -> Runners -> New self-hosted runner**.

### Paso 2: Ejecución del Pipeline Híbrido
Una vez que tu runner local esté en estado **Idle (Verde)** en GitHub:
1. Sube este repositorio a tu cuenta de GitHub (`git push`).
2. El trigger automático iniciará el workflow `Pipeline Híbrido`.
3. Verás que el primer job (`build-hosted`) se ejecuta en la nube de GitHub, y el segundo job (`deploy-local`) corre directamente en tu terminal de Windows local a través del agente.

### Paso 3: Pruebas de Diagnóstico y Simulación de Errores
Puedes ejecutar los scripts locales en la carpeta `scripts/` para entender y comprobar el comportamiento de los errores descritos en [`docs/troubleshooting.md`](file:///c:/Users/alvarez/Desktop/proyectos/laboratorio-5/docs/troubleshooting.md):
*   Ejecuta `.\test-dependencies.ps1` para ver cómo se comporta un fallo por herramientas no instaladas en el PATH.
*   Ejecuta `.\test-permissions.ps1` (sin privilegios de administrador) para experimentar cómo el sistema operativo bloquea las acciones de escritura y cómo capturar dicho fallo.
