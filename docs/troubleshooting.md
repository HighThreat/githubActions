# Documento de Troubleshooting: Self-hosted Runners y Diagnósticos

Este documento detalla los diagnósticos, causas y resoluciones para cinco de los errores más comunes al trabajar con self-hosted runners de GitHub Actions, además de cómo configurar y utilizar el logging detallado.

---

## 1. Errores Comunes e Identificación

### 1.1. Label Incorrecto (Etiqueta Inexistente)
*   **Síntoma:** El Job de GitHub Actions se queda indefinidamente en estado **"Queued"** (En cola) o **"Waiting for a runner to pick up this job"**.
*   **Causa:** El campo `runs-on` en el archivo YAML contiene una o más etiquetas (labels) que no coinciden con ningún runner activo registrado en el repositorio u organización.
*   **Diagnóstico:**
    *   En la pestaña de Actions del workflow, el indicador de tiempo del job sigue sumando sin iniciar la ejecución.
    *   Al hacer clic en el job en cola, GitHub muestra un mensaje de advertencia indicando que no hay runners con esas etiquetas.
*   **Resolución:**
    1.  Ir a **Settings** -> **Actions** -> **Runners** en el repositorio y verificar la lista de etiquetas asociadas al runner activo.
    2.  Corregir el archivo YAML para utilizar exactamente las etiquetas correctas.
    3.  *Ejemplo:* Cambiar `runs-on: [self-hosted, win-server]` por `runs-on: [self-hosted, windows, local-runner]`.

---

### 1.2. Runner Offline (Runner Desconectado)
*   **Síntoma:** El job se queda en cola (`Queued`) y, tras un periodo largo (por defecto hasta 24 horas), falla por timeout.
*   **Causa:** El runner fue configurado correctamente en el pasado, pero el proceso de fondo (`run.cmd`, `Listener` o el servicio de Windows) está apagado o detenido.
*   **Diagnóstico:**
    *   En **Settings** -> **Actions** -> **Runners**, el runner aparece marcado en color rojo con el estado **"Offline"**.
    *   Si se inspeccionan los servicios de Windows, el servicio `GitHub Actions Runner` está en estado "Detenido".
*   **Resolución:**
    1.  Iniciar sesión en la máquina local o servidor host del runner.
    2.  Navegar al directorio de instalación del runner (ej. `C:\actions-runner` o tu directorio configurado).
    3.  Iniciar manualmente el runner ejecutando `.\run.cmd` en PowerShell, o iniciar el servicio de Windows ejecutando:
        ```powershell
        Start-Service -Name "actions.runner.*"
        ```
    4.  Refrescar la interfaz de GitHub para verificar que cambie a color verde con estado **"Idle"**.

---

### 1.3. Dependencia Inexistente
*   **Síntoma:** El job se inicia en el self-hosted runner, pero falla casi de inmediato en un paso concreto con un error del tipo: `The term 'docker' is not recognized as the name of a cmdlet...` o `'npm' is not recognized as an internal or external command`.
*   **Causa:** El workflow asume que herramientas de compilación o utilidades (Node, Docker, Git, Python, etc.) están preinstaladas en la máquina. A diferencia de los runners de GitHub que vienen con abundante software, los self-hosted runners inician limpios.
*   **Diagnóstico:**
    *   El log de la consola de GitHub Actions muestra errores de comandos no encontrados (`CommandNotFoundException` o `Exit Code 1` / `127`).
*   **Resolución:**
    1.  Instalar la herramienta requerida directamente en el sistema operativo del runner.
    2.  Asegurarse de que la ruta del ejecutable se agregue a las variables de entorno del sistema (`PATH`).
    3.  **Importante:** Reiniciar el proceso/servicio del runner para que cargue la nueva variable `PATH` de la máquina.
    4.  Alternativamente, se pueden usar acciones de instalación en el workflow (ej. `actions/setup-node` si es compatible con el runner) o utilizar contenedores.

---

### 1.4. Path Inválido (Rutas Incompatibles)
*   **Síntoma:** Error de archivo o directorio no encontrado (`PathNotFoundException` o `No such file or directory`) al intentar leer, escribir o navegar a un directorio.
*   **Causa:**
    *   **Incompatibilidad de barra inclinada:** Usar rutas estilo Unix (`/home/runner/work/...`) en un runner de Windows (que requiere contrabarra `\` u operar de manera relativa).
    *   **Rutas absolutas estáticas:** Codificar rutas absolutas que existen en el hosted runner (ej. `/github/workspace/`) pero no en el host de Windows local, o viceversa.
*   **Diagnóstico:**
    *   Logs en consola que detallan la excepción de ruta inválida o denegada de Windows.
*   **Resolución:**
    1.  Utilizar las variables de entorno contextuales provistas por GitHub Actions en lugar de rutas absolutas fijas. Por ejemplo: `${{ github.workspace }}` o la variable `$env:GITHUB_WORKSPACE` en PowerShell.
    2.  Usar comandos de PowerShell nativos como `Join-Path` para construir rutas dinámicas adaptadas al sistema operativo del runner.
    3.  Asegurarse de que los scripts se escriban utilizando barras compatibles o delimitando de forma dinámica según el sistema operativo.

---

### 1.5. Error de Permisos (Acceso Denegado / ExecutionPolicy)
*   **Síntoma:** El runner falla al ejecutar un script de PowerShell con un mensaje sobre políticas de ejecución (`Execution_Policies`), o falla al escribir en un directorio del host con un error `UnauthorizedAccessException` (Acceso denegado).
*   **Causa:**
    *   PowerShell tiene configurada por defecto una directiva restrictiva (`Restricted`) para la ejecución de scripts no firmados.
    *   El runner se está ejecutando bajo un usuario estándar que carece de privilegios elevados para escribir en carpetas protegidas como `C:\Program Files` o interactuar con el registro.
*   **Diagnóstico:**
    *   Error en la consola: `...cannot be loaded because running scripts is disabled on this system.`
    *   Error de acceso: `Access to the path '...' is denied.`
*   **Resolución:**
    *   **Para políticas de PowerShell:** Forzar la política de ejecución en el comando del workflow usando la propiedad `shell: powershell` la cual automáticamente corre con el bypass `-ExecutionPolicy Bypass`, o configurar el sistema del runner con:
        ```powershell
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
        ```
    *   **Para accesos denegados:** Si las tareas requieren permisos administrativos, ejecutar el servicio del runner como una cuenta de Administrador Local o como un servicio del sistema (`SYSTEM`). Si no es necesario, redirigir las operaciones de escritura al directorio temporal del runner `$env:RUNNER_TEMP` o al directorio de trabajo del job.

---

## 2. Activación e Interpretación de Logging Detallado

Para realizar diagnósticos avanzados en workflows que fallan de forma errática o silenciosa, GitHub Actions permite habilitar registros de depuración detallados.

### 2.1. Habilitación de Logs Detallados
Se pueden activar a nivel de **variables de entorno del workflow** o a nivel de **Secretos/Variables de Entorno del Repositorio** (Recomendado):

*   **`ACTIONS_RUNNER_DEBUG` (true):** Activa el registro detallado sobre las acciones internas que toma el Runner (descarga de pasos, preparación de contenedores, comunicación de red).
*   **`ACTIONS_STEP_DEBUG` (true):** Activa el registro detallado paso por paso de los scripts ejecutados y outputs intermedios.

#### Configuración en el archivo de workflow:
```yaml
env:
  ACTIONS_RUNNER_DEBUG: 'true'
  ACTIONS_STEP_DEBUG: 'true'
```

### 2.2. Logs del Runner Local (Directorio `_diag`)
Cuando ejecutas un runner local, este guarda registros altamente detallados del sistema que no se suben a GitHub. Estos logs se encuentran en la carpeta del runner:

*   **Ruta de logs locales:** `C:\Users\alvarez\Desktop\proyectos\laboratorio-5\runner\_diag\`
*   **Archivos clave:**
    *   `Runner_*.log`: Registro general del proceso del runner. Muestra cuándo se conecta a GitHub, qué jobs reclama y la comunicación HTTP. Es ideal para diagnosticar problemas de red o runners que se quedan offline.
    *   `Worker_*.log`: Registro detallado de la ejecución de un job específico. Muestra cómo se descargan los pasos, la resolución de variables y la ejecución de procesos secundarios.
