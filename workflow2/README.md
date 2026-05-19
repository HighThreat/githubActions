# Laboratorio 2 - Pipeline reutilizable con artifacts y cache

Este repositorio ahora documenta una solución completa para el laboratorio de GitHub Actions centrada en reutilización de pipelines para Node.js.

## Qué se hizo

- Se creó un workflow reutilizable en [.github/workflows/reusable-node-pipeline.yml](.github/workflows/reusable-node-pipeline.yml) usando `workflow_call`.
- El workflow reutilizable recibe parámetros para versión de Node, comandos de instalación, pruebas, build, ruta de trabajo y retención de artifacts.
- Se implementó cache de dependencias dependiente de:
  - el sistema operativo,
  - la versión de Node,
  - y el hash del lockfile.
- Se publican artifacts con nombres consistentes para:
  - build compilado,
  - reportes de pruebas,
  - y logs relevantes.
- Se creó un workflow consumidor en [.github/workflows/ejercicio2-consumer.yml](.github/workflows/ejercicio2-consumer.yml) que llama al reusable workflow con Node 18 y Node 20.
- El workflow consumidor consume los outputs del reusable workflow y añade lógica propia al final.
- Se añadió un ejemplo mínimo de proyecto Node en [package.json](package.json), [src/index.js](src/index.js) y [test/index.test.js](test/index.test.js) para que el laboratorio sea ejecutable.

## Estructura principal

- [package.json](package.json): scripts de `test` y `build`.
- [scripts/build.mjs](scripts/build.mjs): genera `dist/bundle.js`.
- [src/index.js](src/index.js): función de ejemplo `greet`.
- [test/index.test.js](test/index.test.js): prueba con `node:test`.
- [.github/workflows/reusable-node-pipeline.yml](.github/workflows/reusable-node-pipeline.yml): pipeline genérico reutilizable.
- [.github/workflows/ejercicio2-consumer.yml](.github/workflows/ejercicio2-consumer.yml): consumidor que reutiliza el pipeline.

## Cómo funciona

1. El workflow consumidor llama al reusable workflow dos veces, una con Node 18 y otra con Node 20.
2. El reusable workflow instala dependencias, ejecuta pruebas y build, y recoge logs y reportes.
3. Los artifacts se suben con nombres estables y retención personalizada.
4. El job final del consumidor lee los outputs de cada ejecución y agrega una validación propia.

## Validación local

Se verificó que el ejemplo Node funciona con:

```bash
npm ci
npm test
npm run build
```

## Notas de seguridad

- Se evita usar referencias flotantes sin justificación.
- Se usa `actions/*@v4` en los pasos externos.
- El reusable workflow no duplica la lógica del consumidor.