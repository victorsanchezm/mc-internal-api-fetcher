# mc-internal-api-fetcher
README — Extracción de información de Cloud Pages (Playwright)
Resumen
Estos tres scripts usan Playwright para automatizar la extracción de información desde endpoints internos de Cloud Pages. Flujo general:

Iniciar sesión manualmente en el dominio objetivo y guardar el estado de sesión (storageState.json).
A partir de una lista de siteAssetIds, obtener los siteId asociados y guardarlos en siteIds_by_siteAssetId.json.
Por cada siteId obtenido, recuperar los estados (states) de las landing pages y generar site_states_min.json con los datos relevantes.
Requisitos
Node.js (v14+ recomendado)
npm o yarn
Paquetes npm: playwright
Instalación rápida

# Inicializa proyecto (si aún no lo está)
npm init -y

# Instala Playwright
npm install playwright

# (Opcional: para navegadores completos y utilidades, sigue la guía oficial de Playwright.)
Archivos y propósito
1) guardar_storageState.js (script 1)
Propósito: Abrir el navegador apuntando al dominio de Cloud Pages para que el usuario haga login manual (incluye MFA si aplica). Tras completar el login y pulsar ENTER, guarda el storageState en storageState.json.
Uso:
node guardar_storageState.js

# Comportamiento clave:
Lanza Chromium en modo no headless para permitir login manual.
Navega a https://cloud-pages.s50.marketingcloudapps.com/.
Pausa hasta que el usuario confirme que el login ha finalizado.
Guarda cookies / storageState en storageState.json.
2) fetch_states.js (script 2)
Propósito: A partir de una lista de siteAssetIds (puede colocarse en el array siteAssetIds o leerse desde un fichero si adaptas el código), consulta el endpoint interno para obtener el siteId correspondiente y genera siteIds_by_siteAssetId.json con pares { siteAssetId, siteId }.
Uso:
node fetch_states.js

# Requisitos previos:
storageState.json (generado por el paso 1) en el mismo directorio.
Comportamiento clave:
Lanza Chromium en modo headless.
Crea un contexto con storageState para reusar la sesión autenticada.
Para cada siteAssetId realiza GET a: https://cloud-pages.s50.marketingcloudapps.com/fuelapi/internal/v2/cloudpages/sites?siteAssetId=<siteAssetId>
Acumula resultados exitosos y los escribe en siteIds_by_siteAssetId.json.
Muestra progreso en línea con tiempos estimados y contadores de ok/fail.
3) fetch_states_stp2.js (script 3)
Propósito: Lee siteIds_by_siteAssetId.json y para cada par (siteAssetId, siteId) consulta los "states" de landing pages y genera site_states_min.json con filas que contienen siteAssetId, siteId, name y thumbnailAssetId (u objeto de error en caso de fallo).
Uso:
node fetch_states_stp2.js

# Requisitos previos:
storageState.json en el mismo directorio.
siteIds_by_siteAssetId.json generado por el script 2.
Comportamiento clave:
Lanza Chromium en modo headless y crea contexto con storageState.
Para cada siteId realiza GET a: https://cloud-pages.s50.marketingcloudapps.com/fuelapi/internal/v2/cloudpages/landing-pages/<siteId>/states
Si la respuesta es 200, extrae entities y añade filas con campos relevantes a site_states_min.json.
Registra errores HTTP o excepciones en la salida.
Ejemplo de flujo de trabajo
Ejecuta guardar_storageState.js:
node guardar_storageState.js

# Completa login en el navegador cuando se abra.
Pulsa ENTER en la terminal cuando la página ya esté autenticada.
Se generará storageState.json.
Edita fetch_states.js para añadir los siteAssetIds que quieras consultar (o modifica el script para leer desde un fichero):
node fetch_states.js
En pantalla veremos información del progreso:
[1680/1680] 100.0% | elapsed 00:03:58 | ETA 00:00:00 | ok=1680 fail=0 | last=xxxxx
Terminado. Generado: siteIds_by_siteAssetId.json

# Se generará siteIds_by_siteAssetId.json.
Ejecuta fetch_states_stp2.js:
node fetch_states_stp2.js

# Se generará site_states_min.json con la información de estados.
Formato de archivos generados
storageState.json: estado completo de almacenamiento (cookies, localStorage, etc.) usado por Playwright.
siteIds_by_siteAssetId.json: array de objetos { siteAssetId, siteId }.
site_states_min.json: array con objetos que pueden tener:
siteAssetId: number | null
siteId: number | null
name: string | null
thumbnailAssetId: number | null
error: string (si ocurrió algún problema con ese registro)
# Notas de seguridad y buenas prácticas
Nunca compartas storageState.json fuera de entornos controlados: contiene credenciales de sesión y cookies.
Usa un control de acceso al repositorio para evitar filtración de información sensible.
Ajusta los timeouts y límites de concurrencia si vas a procesar muchos IDs para evitar sobrecargar el endpoint.
Maneja excepciones y backoff si el servicio aplica rate limiting.
# Sugerencias de mejora
Leer siteAssetIds desde un fichero CSV/JSON en lugar de codificarlos en el script.
Añadir reintentos con backoff exponencial para peticiones fallidas.
Paralelizar peticiones con un pool de concurrencia controlada para mejorar velocidad sin exceder límites.
Añadir logs detallados a fichero además del progreso en consola.
Añadir validación y sanitización de entradas.
Parametrizar URLs, rutas de salida y nombres de archivos vía argumentos CLI (por ejemplo usando minimist o yargs).
# Problemas conocidos / límites actuales
El primer script requiere intervención manual para el login; no maneja login automatizado.
No hay manejo avanzado de rate limits ni reintentos automáticos (puedes implementarlo según convenga).
La extracción depende de que la API interna mantenga la estructura actual (entities, siteId, etc.).
Parametrizar URLs, rutas de salida y nombres de archivos via argumentos CLI (por ejemplo usando minimist o yargs). Problemas conocidos / límites actuales
El primer script requiere intervención manual para el login; no maneja login automatizado.
No hay manejo avanzado de rate limits ni reintentos automáticos (puedes implementarlo según convenga).
La extracción depende de que la API interna mantenga la estructura actual (entities, siteId, etc.). Contacto Para dudas sobre el uso de estos scripts o para solicitar integración/automatización adicional, responde en este hilo indicando los requisitos concretos (por ejemplo: lectura de IDs desde CSV, ejecución programada, salida adicional que necesites).
