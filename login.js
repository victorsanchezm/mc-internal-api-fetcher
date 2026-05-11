const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // abre directamente el host del endpoint (importante que sea el MISMO dominio...)
  await page.goto("https://cloud-pages.s50.marketingcloudapps.com/", { waitUntil: "domcontentloaded" });

  // hacemos el login manual (MFA si toca, etc.)
  process.stdin.resume();
  process.stdout.write("Termina el login y deja la página cargada. Luego pulsa ENTER...\n");
  await new Promise((resolve) => process.stdin.once("data", resolve));

  // esto verifica que hay cookies para ese dominio antes de guardar
  const cookies = await context.cookies("https://cloud-pages.s50.marketingcloudapps.com/");
  console.log("Cookies en cloud-pages.s50:", cookies.length);

  await context.storageState({ path: "./storageState.json" });
  await browser.close();

  console.log("OK: sesión guardada en storageState.json");
  // después procederemos a ejecutar el resto de pasos:
  // -- fetch_states.js
  // -- fetch_states_stp2.js
})();
