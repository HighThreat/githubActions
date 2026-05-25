# Análisis de Seguridad: Riesgos en Self-hosted Runners

El uso de infraestructura propia (self-hosted runners) para ejecutar workflows de GitHub Actions introduce una serie de riesgos de seguridad que no existen (o están mitigados por defecto) en los hosted runners de GitHub. A continuación, se detallan los tres principales riesgos solicitados y las mejores prácticas para mitigarlos.

---

## 1. Riesgos de Runners Persistentes

A diferencia de los runners de GitHub (que son máquinas virtuales efímeras creadas y destruidas para cada job), un self-hosted runner suele ser un servidor o máquina persistente que sobrevive a lo largo de múltiples ejecuciones de diferentes workflows.

### Riesgos específicos:
*   **Contaminación Cruzada (Cross-job contamination):** Los archivos creados, modificaciones en variables de entorno o cambios de configuración realizados por un job anterior pueden afectar al comportamiento de jobs siguientes.
*   **Persistencia de Compromiso (Persistent compromise):** Si un workflow ejecuta código malicioso (por ejemplo, a través de una dependencia comprometida o un Pull Request no verificado), un atacante puede instalar un backdoor, un malware de minado o un script espía persistente en la máquina host.
*   **Fuga de Secretos en Caché:** Datos temporales, tokens de acceso o contraseñas generadas durante una ejecución pueden quedar guardados en carpetas de caché local, directorios `/tmp` o en el historial de comandos, quedando accesibles a usuarios de otros proyectos que utilicen el mismo runner.

### Mitigaciones recomendadas:
*   Utilizar la opción **ephemeral runners** provista por GitHub (ejecutar `.\config.cmd --ephemeral`). Esto hace que el runner se desregistre y se apague automáticamente después de ejecutar un solo job, permitiendo que un script o contenedor lo limpie antes de levantarlo nuevamente.
*   Implementar tareas de limpieza rigurosas al final de cada job para vaciar los directorios de trabajo y temporales (`git clean -xffd`).

---

## 2. Riesgos de Acceso a Red

Los runners de GitHub se ejecutan en nubes aisladas propiedad de Microsoft/GitHub. Los self-hosted runners, en cambio, suelen colocarse dentro de la red corporativa o local (intranet) para facilitar despliegues a bases de datos internas, servidores de aplicaciones o APIs privadas.

### Riesgos específicos:
*   **Acceso Lateral a la Intranet:** Si un atacante logra ejecutar código arbitrario en el runner a través de una inyección de comandos en un workflow, la máquina del runner servirá como un "caballo de Troya" dentro de tu red local. El atacante podrá realizar escaneos de puertos, atacar bases de datos internas, acceder a repositorios locales de credenciales y comprometer otros servidores de la organización.
*   **Filtros de Firewall Inefectivos:** Debido a que el runner realiza conexiones salientes HTTPS hacia GitHub para recibir trabajos, suele permitirse que tenga conexiones activas hacia Internet. Un atacante puede explotar esto para exfiltrar información privada hacia servidores externos.

### Mitigaciones recomendadas:
*   Colocar los runners en una **zona desmilitarizada (DMZ)** o en una subred aislada (VPC) con reglas de firewall muy estrictas (Security Groups).
*   Restringir el tráfico de red de salida del runner únicamente a los dominios oficiales de GitHub requeridos para su funcionamiento y a los destinos indispensables para el despliegue.
*   Evitar el uso de self-hosted runners en repositorios públicos. Cualquiera que abra un Pull Request en un repositorio público podría ejecutar código dañino en tu red local si los PRs no están restringidos.

---

## 3. Riesgos de Aislamiento Insuficiente

Este riesgo ocurre cuando las tareas y scripts del runner se ejecutan directamente sobre el sistema operativo host (bare-metal o VM) sin capas intermedias de aislamiento, y especialmente si el servicio del runner se ejecuta con privilegios elevados (como Administrador o `root`).

### Riesgos específicos:
*   **Acceso Completo al Sistema Operativo Host:** Un script malicioso puede leer, escribir o borrar cualquier archivo del sistema. También puede acceder a los hashes de contraseñas locales o procesos en ejecución.
*   **Secuestro del Agente:** El atacante puede manipular los propios archivos binarios y de configuración del agente de GitHub Actions para interceptar todos los tokens de autenticación (`GITHUB_TOKEN`) y secretos del repositorio enviados para futuros jobs.
*   **Denegación de Servicio (DoS):** Procesos descontrolados o bucles infinitos en un workflow pueden consumir la totalidad del CPU, memoria y almacenamiento de la máquina host, dejando inoperables otros servicios que convivan en el mismo servidor.

### Mitigaciones recomendadas:
*   **Principio de Privilegio Mínimo:** No ejecutar nunca el runner con la cuenta de Administrador del sistema. Crear un usuario dedicado con permisos limitados exclusivamente al directorio de trabajo del runner.
*   **Uso de Contenedores y VMs:** Ejecutar el runner dentro de un contenedor Docker aislado o en una máquina virtual dedicada que se destruya después de cada uso, evitando ejecutar comandos directamente sobre el sistema operativo principal de producción.
*   **Desactivar Ejecución en Bifurcaciones (Forks):** En la configuración del repositorio, asegúrate de requerir aprobación manual para la ejecución de workflows procedentes de Pull Requests de forks externos.
