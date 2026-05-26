# Branch & Tag Normalizer — Custom Action de GitHub

Esta es una Custom Action de JavaScript diseñada para estandarizar el flujo de Integración Continua (CI) mediante la **validación del nombre de las ramas de Git** y la **generación de tags limpios y seguros** compatibles con Docker y Git.

Desarrollada de forma nativa en Node.js 20, esta acción no requiere instalar dependencias adicionales en ejecución (cero `node_modules` requeridos), garantizando velocidad, ligereza y robustez.

---

## Características Principales

1. **Validación Flexible**: Compara el nombre de la rama con prefijos permitidos (como `feature/`, `bugfix/`) o nombres exactos de ramas base (`main`, `develop`).
2. **Normalización Estética (Aesthetic Normalization)**: Convierte el nombre de la rama en minúsculas y reemplaza caracteres no admitidos (como barras `/`, espacios o caracteres especiales) por guiones `-`.
3. **Control de Longitud y Bordes**: Recorta automáticamente el tag generado a un límite máximo configurable (`max-length`) y limpia caracteres huérfanos (`-` o `.`) en los extremos tras el recorte.
4. **Modo Tolerante u Enérgico**: Controlado por el flag `fail-on-invalid`, puede detener inmediatamente el pipeline si se viola la convención, o continuar permitiendo que pasos posteriores decidan qué hacer con los outputs generados.

---

## Interfaz de la Acción: Entradas y Salidas

### Inputs (Parámetros de Entrada)

| Input | Descripción | Requerido | Valor por Defecto |
| :--- | :--- | :---: | :--- |
| `branch-name` | El nombre de la rama o referencia Git completa a validar y normalizar. Soporta formatos como `refs/heads/feature/login`. | **Sí** | - |
| `allowed-prefixes` | Lista separada por comas de prefijos válidos (terminados en `/`) o nombres de ramas exactos. Si se deja vacío, se omitirá la validación y todo se aceptará. | No | `feature/,bugfix/,hotfix/,release/,main,master,develop` |
| `max-length` | Longitud máxima permitida para el tag normalizado de salida. | No | `50` |
| `fail-on-invalid` | Si es `true`, la acción fallará el workflow si el nombre de la rama no cumple las reglas de nomenclatura. | No | `true` |

### Outputs (Valores de Salida)

| Output | Tipo | Descripción |
| :--- | :---: | :--- |
| `is-valid` | `string` | `"true"` si el nombre de la rama cumple con las reglas, `"false"` si no. |
| `normalized-tag` | `string` | Tag de salida estandarizado y seguro (limpio de caracteres especiales, en minúsculas y truncado). |
| `branch-type` | `string` | Categoría identificada de la rama (ej: `feature`, `bugfix`, `hotfix`, `release`, `main` o `unknown`). |
| `validation-message`| `string` | Descripción detallada del resultado del proceso de validación. |

---

## Estrategia de Versionado y Publicación

Para asegurar que los equipos puedan reutilizar esta acción en múltiples repositorios de forma confiable, se implementa una estrategia basada en **Semantic Versioning (SemVer)**:

### 1. Versionado del Repositorio (Publicación)
* **Releases Estables**: Cada versión lista para producción se publicará a través de un GitHub Release (ej. `v1.0.0`, `v1.1.0`).
* **Tags Principales Flotantes**: Se mantendrán tags mayores flotantes como `v1` o `v2` apuntando al último commit seguro de dicha versión mayor. Esto permite a los consumidores obtener parches de seguridad de forma transparente.
* **Tagging Automatizado**: Se recomienda usar workflows de Git para actualizar el tag flotante `v1` cada vez que se sube un tag de parche (`v1.0.1` -> actualizar `v1` a ese commit).

### 2. Consumo desde otros Repositorios
Los otros proyectos de la organización pueden consumir la acción referenciando el repositorio de la siguiente manera:

* **Opción A (Recomendada - Estabilidad con parches automáticos)**:
  ```yaml
  uses: tu-organizacion/branch-tag-normalizer-action@v1
  ```
* **Opción B (Seguridad Máxima - Versión Inmutable)**:
  ```yaml
  uses: tu-organizacion/branch-tag-normalizer-action@v1.0.0
  ```
* **Opción C (Desarrollo y Pruebas - Último estado)**:
  ```yaml
  uses: tu-organizacion/branch-tag-normalizer-action@main
  ```

---

## Ejemplo Práctico de Workflow Consumidor

A continuación se muestra un ejemplo de un pipeline en un repositorio consumidor. Este lee la rama actual, genera un tag normalizado, y lo utiliza para compilar y empujar una imagen Docker de manera condicional:

```yaml
name: Continuous Integration

on:
  push:
    branches: [ '**' ]
  pull_request:
    branches: [ '**' ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # Ejecutar la custom action
      - name: Validate & Normalize Branch Name
        id: branch_rules
        uses: tu-organizacion/branch-tag-normalizer-action@v1
        with:
          branch-name: ${{ github.head_ref || github.ref_name }}
          allowed-prefixes: 'feature/,bugfix/,hotfix/,release/,main,develop'
          max-length: '30'
          fail-on-invalid: 'false' # Continuamos para mostrar feedback en consola

      # Diagnóstico de Outputs
      - name: Print Action Diagnostics
        run: |
          echo "La rama es válida?: ${{ steps.branch_rules.outputs.is-valid }}"
          echo "Tipo de rama: ${{ steps.branch_rules.outputs.branch-type }}"
          echo "Tag Docker Generado: ${{ steps.branch_rules.outputs.normalized-tag }}"
          echo "Mensaje: ${{ steps.branch_rules.outputs.validation-message }}"

      # Compilar Docker solo si la rama cumple con las políticas de nombre
      - name: Build & Push Docker Image
        if: steps.branch_rules.outputs.is-valid == 'true'
        run: |
          docker build -t mi-registro.com/mi-app:${{ steps.branch_rules.outputs.normalized-tag }} .
          # docker push mi-registro.com/mi-app:${{ steps.branch_rules.outputs.normalized-tag }}

      # Bloquear el merge si no es válida la rama
      - name: Enforce Naming Compliance
        if: steps.branch_rules.outputs.is-valid == 'false'
        run: |
          echo "::error::Naming policy compliance check failed. Merge blocked."
          exit 1
```

---

## Robustez y Gestión de Errores

1. **Valores Vacíos**: Si el input `branch-name` es nulo o vacío, la acción arroja un error controlado e interrumpe la ejecución inmediatamente con un mensaje explicativo, en lugar de generar salidas indefinidas.
2. **Eliminación de Prefijos Internos de Git**: Remueve automáticamente partes no deseadas de las referencias proporcionadas por GitHub Actions, convirtiendo p. ej. `refs/heads/feature/login` a `feature/login` antes de proceder.
3. **Manejo de Truncado Estético**: Si se limita la longitud a 20 caracteres y la rama normalizada resulta en algo como `feature-jira-12345-` (con un guion colgando al final), la acción limpia el extremo resultando en `feature-jira-12345`.
4. **Cero Dependencias**: Al estar escrita en Node.js puro, es imposible que ocurran fallos por descarga fallida de dependencias de `npm` o problemas de vulnerabilidades en librerías externas.
