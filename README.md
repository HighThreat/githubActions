# Secure Deployment Lab

Ejercicio de GitHub Actions para un pipeline seguro con build, tests, approvals y scopes mínimos.

## Lo que demuestra

- `vars.APP_NAME` es una variable no sensible y se usa como dato de configuración.
- `secrets.DEPLOY_TOKEN` y `secrets.API_TOKEN` son secretos y solo se consumen en los jobs de despliegue.
- El job de build y tests no recibe secretos.
- El despliegue a producción queda bloqueado por el entorno `production` y su aprobación manual.
- El flujo evita `@main` en actions externas y usa versiones fijas mayores como `@v4` y `@v7`.

## Secrets y variables

Configura estos valores en GitHub:

- Variable del repositorio: `APP_NAME`
- Secret del entorno `staging`: `DEPLOY_TOKEN`
- Secret del entorno `staging`: `API_TOKEN`
- Secret del entorno `production`: `DEPLOY_TOKEN`
- Secret del entorno `production`: `API_TOKEN`

No se imprimen los secretos en logs. El workflow solo comprueba que existan.

## Permissions

El workflow usa permisos mínimos a nivel global:

- `contents: read`

Y no concede permisos write salvo cuando sea estrictamente necesario. El job `permission_probe` se puede ejecutar manualmente para ver el fallo que provoca una operación de escritura con permisos de solo lectura.

## Environments

Crea estos entornos en Settings > Environments:

- `staging`
- `production`

En `production`, activa required reviewers para forzar aprobación manual antes del deploy.

## Validación

1. Ejecuta el workflow en `main`.
2. Verifica que `build` y `test` terminan bien.
3. Comprueba que `deploy_staging` y `deploy_production` solo se ejecutan desde `main`.
4. Confirma que `deploy_production` queda esperando aprobación si el entorno está protegido.
5. Ejecuta `permission_probe` con `demonstrate_permission_failure = true` para observar el fallo por permisos insuficientes.

## Riesgos analizados

- Exponer secretos en logs los hace recuperables por cualquiera con acceso al run.
- Actions externas con referencias flotantes como `@main` pueden cambiar sin aviso.
- Permisos excesivos amplían el impacto de cualquier paso comprometido.
