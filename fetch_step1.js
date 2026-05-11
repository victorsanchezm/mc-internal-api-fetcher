const fs = require("fs");
const { chromium } = require("playwright");

// esto muestra en progreso del proceso
const startedAt = Date.now();
function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function logProgress(i, total, last, ok, fail) {
  const elapsed = Date.now() - startedAt;
  const done = i + 1;
  const pct = ((done / total) * 100).toFixed(1);
  const avg = elapsed / done;
  const remaining = (total - done) * avg;
  process.stdout.write(
    `\r[${done}/${total}] ${pct}% | elapsed ${fmt(elapsed)} | ETA ${fmt(
      remaining
    )} | ok=${ok} fail=${fail} | last=${last}   `
  );
}

(async () => {
  // facilitamos los IDS a revisar, puede ser desde fichero o un array simple
  const siteAssetIds = [000000, 111111];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: "./storageState.json" });

  const rows = [];
  let ok = 0,
    fail = 0;

  for (let i = 0; i < siteAssetIds.length; i++) {
    const siteAssetId = siteAssetIds[i];

    try {
      const url = `https://cloud-pages.s50.marketingcloudapps.com/fuelapi/internal/v2/cloudpages/sites?siteAssetId=${encodeURIComponent(
        siteAssetId
      )}`;

      const resp = await context.request.get(url);

      if (!resp.ok()) {
        fail++;
        logProgress(i, siteAssetIds.length, siteAssetId, ok, fail);
        continue;
      }

      const data = await resp.json();
      const entity = data?.entities?.[0];

      if (entity?.siteId != null) {
        rows.push({ siteAssetId, siteId: entity.siteId });
        ok++;
      } else {
        fail++;
      }
    } catch (e) {
      fail++;
    }

    logProgress(i, siteAssetIds.length, siteAssetId, ok, fail);
  }

  await browser.close();

  fs.writeFileSync("./siteIds_by_siteAssetId.json", JSON.stringify(rows, null, 2));
  console.log("\nTerminado. Generado: siteIds_by_siteAssetId.json");
})();
