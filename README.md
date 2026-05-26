# Repositorio de Prácticas de GitHub Actions

Este repositorio contiene los laboratorios y ejercicios prácticos de GitHub Actions.

---

## 1. Laboratorio 5 — Self-hosted runners y troubleshooting (Actual)

Este laboratorio demuestra la configuración y resolución de problemas en runners self-hosted (locales).

### Estructura del Proyecto (Laboratorio 5)

*   **[`.github/workflows/workflow-hibrido.yml`](file:///.github/workflows/workflow-hibrido.yml):** Pipeline principal que combina hosted runners (Ubuntu) con self-hosted runners (Windows local).
*   **[`.github/workflows/debug-logging.yml`](file:///.github/workflows/debug-logging.yml):** Workflow diseñado para diagnósticos y depuración detallada (`ACTIONS_RUNNER_DEBUG` y `ACTIONS_STEP_DEBUG`).
*   **[`scripts/setup-runner.ps1`](file:///scripts/setup-runner.ps1):** Script interactivo en PowerShell que automatiza la descarga y extracción del agente oficial del runner en tu sistema local Windows, guiándote en su registro.
*   **[`scripts/test-dependencies.ps1`](file:///scripts/test-dependencies.ps1):** Script para simular errores de dependencias de software faltantes en el runner.
*   **[`scripts/test-permissions.ps1`](file:///scripts/test-permissions.ps1):** Script para simular errores de permisos de administración y políticas de ejecución en el host Windows.
*   **[`docs/troubleshooting.md`](file:///docs/troubleshooting.md):** Documento oficial de entrega sobre diagnósticos de los 5 errores comunes y el uso de logs detallados.
*   **[`docs/seguridad.md`](file:///docs/seguridad.md):** Explicación y análisis detallado de riesgos de seguridad sobre runners persistentes, acceso a red corporativa y aislamiento del host.

### Instrucciones de Uso y Configuración

#### Paso 1: Configurar el Self-hosted Runner en Windows
1. Abre una terminal de **PowerShell** y navega a la carpeta de scripts:
   ```powershell
   cd "scripts"
   ```
2. Ejecuta el script de descarga y preparación:
   ```powershell
   .\setup-runner.ps1
   ```
   *Este script creará la carpeta `runner/` adyacente y descargará la versión oficial de GitHub Actions Runner.*
3. Sigue las instrucciones impresas en pantalla para registrar el runner en tu repositorio de GitHub usando el token que te provee la interfaz web de GitHub en: **Settings -> Actions -> Runners -> New self-hosted runner**.

#### Paso 2: Ejecución del Pipeline Híbrido
Una vez que tu runner local esté en estado **Idle (Verde)** en GitHub:
1. Sube este repositorio a tu cuenta de GitHub (`git push`).
2. El trigger automático iniciará el workflow `Pipeline Híbrido`.
3. Verás que el primer job (`build-hosted`) se ejecuta en la nube de GitHub, y el segundo job (`deploy-local`) corre directamente en tu terminal de Windows local a través del agente.

#### Paso 3: Pruebas de Diagnóstico y Simulación de Errores
Puedes ejecutar los scripts locales en la carpeta `scripts/` para entender y comprobar el comportamiento de los errores descritos en [`docs/troubleshooting.md`](file:///docs/troubleshooting.md):
*   Ejecuta `.\test-dependencies.ps1` para ver cómo se comporta un fallo por herramientas no instaladas en el PATH.
*   Ejecuta `.\test-permissions.ps1` (sin privilegios de administrador) para experimentar cómo el sistema operativo bloquea las acciones de escritura y cómo capturar dicho fallo.

---

## 2. Secure Deployment Lab (Anterior)

Ejercicio de GitHub Actions para un pipeline seguro con build, tests, approvals y scopes mínimos.

### Lo que demuestra

- `vars.APP_NAME` es una variable no sensible y se usa como dato de configuración.
- `secrets.DEPLOY_TOKEN` y `secrets.API_TOKEN` son secretos y solo se consumen en los jobs de despliegue.
- El job de build y tests no recibe secretos.
- El despliegue a producción queda bloqueado por el entorno `production` y su aprobación manual.
- El flujo evita `@main` en actions externas y usa versiones fijas mayores como `@v4` y `@v7`.

### Secrets y variables

Configura estos valores en GitHub:

- Variable del repositorio: `APP_NAME`
- Secret del entorno `staging`: `DEPLOY_TOKEN`
- Secret del entorno `staging`: `API_TOKEN`
- Secret del entorno `production`: `DEPLOY_TOKEN`
- Secret del entorno `production`: `API_TOKEN`

No se imprimen los secretos en logs. El workflow solo comprueba que existan.

### Permissions

El workflow usa permisos mínimos a nivel global:

- `contents: read`

Y no concede permisos write salvo cuando sea estrictamente necesario. El job `permission_probe` se puede ejecutar manualmente para ver el fallo que provoca una operación de escritura con permisos de solo lectura.

### Environments

Crea estos entornos en Settings > Environments:

- `staging`
- `production`

En `production`, activa required reviewers para forzar aprobación manual antes del deploy.

### Validación

1. Ejecuta el workflow en `main`.
2. Verifica que `build` y `test` terminan bien.
3. Comprueba que `deploy_staging` y `deploy_production` solo se ejecutan desde `main`.
4. Confirma que `deploy_production` queda esperando aprobación si el entorno está protegido.
5. Ejecuta `permission_probe` con `demonstrate_permission_failure = true` para observar el fallo por permisos insuficientes.

### Riesgos analizados

- Exponer secretos en logs los hace recuperables por cualquiera con acceso al run.
- Actions externas con referencias flotantes como `@main` pueden cambiar sin aviso.
- Permisos excesivos amplían el impacto de cualquier paso comprometido.

---

## 3. Laboratorio 6 — Desarrollo de una custom action

Este laboratorio implementa una Custom Action de JavaScript nativa (Node.js 20) sin dependencias externas para validar y normalizar los nombres de las ramas de Git y generar tags compatibles con Docker y Git.

### Estructura del Proyecto (Laboratorio 6)

*   **[`lab6/action.yml`](file:///lab6/action.yml):** Metadatos, inputs y outputs de la custom action.
*   **[`lab6/index.js`](file:///lab6/index.js):** Lógica nativa de validación, categorización y normalización en Node.js 20 (cero dependencias).
*   **[`lab6/test-local.js`](file:///lab6/test-local.js):** Script para simular localmente múltiples escenarios de inputs, outputs y control de errores.
*   **[`.github/workflows/test-action.yml`](file:///.github/workflows/test-action.yml):** Workflow que consume la custom action localmente (`uses: ./lab6`) y verifica sus outputs de forma condicional.
*   **[`.github/workflows/publish-release.yml`](file:///.github/workflows/publish-release.yml):** Workflow que automatiza el versionado flotante (ej: actualizar `v1` al crear una tag `v1.x.x`).
*   **[`lab6/README.md`](file:///lab6/README.md):** Documentación completa sobre los parámetros de configuración, salidas y ejemplos prácticos.

