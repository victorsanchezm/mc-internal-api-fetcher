const { chromium } = require("playwright");
const fs = require("fs");

const startedAt = Date.now();

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function logProgress(i, total, lastSiteId, ok, fail) {
  const elapsed = Date.now() - startedAt;
  const done = i + 1;
  const pct = ((done / total) * 100).toFixed(1);
  const avg = elapsed / done;
  const remaining = (total - done) * avg;

  process.stdout.write(
    `\r[${done}/${total}] ${pct}% | elapsed ${fmt(elapsed)} | ETA ${fmt(
      remaining
    )} | ok=${ok} fail=${fail} | lastSiteId=${lastSiteId}   `
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: "./storageState.json" });

  // Input: [{ siteAssetId, siteId }, ...] es el fichero generado en step 1
  const sites = JSON.parse(fs.readFileSync("./siteIds_by_siteAssetId.json", "utf8"));

  const base =
    "https://cloud-pages.s50.marketingcloudapps.com/fuelapi/internal/v2/cloudpages/landing-pages/";

  const rows = [];
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < sites.length; i++) {
    const siteAssetId = sites[i]?.siteAssetId ?? null;
    const siteId = sites[i]?.siteId ?? null;

    try {
      if (!siteId) {
        rows.push({ siteAssetId, siteId, error: "Missing siteId" });
        fail++;
        logProgress(i, sites.length, siteId, ok, fail);
        continue;
      }

      const url = `${base}${siteId}/states`;
      const resp = await context.request.get(url);

      const status = resp.status();
      if (status !== 200) {
        rows.push({ siteAssetId, siteId, error: `HTTP ${status}`, url });
        fail++;
        logProgress(i, sites.length, siteId, ok, fail);
        continue;
      }

      const data = await resp.json();
      const entities = Array.isArray(data?.entities) ? data.entities : [];

      for (const e of entities) {
        rows.push({
          siteAssetId,
          siteId,
          name: e?.name ?? null,
          thumbnailAssetId: e?.thumbnailAssetId ?? null,
        });
      }

      ok++;
    } catch (e) {
      rows.push({ siteAssetId, siteId, error: String(e?.message ?? e) });
      fail++;
    }

    logProgress(i, sites.length, siteId, ok, fail);
  }

  await browser.close();

  fs.writeFileSync("./site_states_min.json", JSON.stringify(rows, null, 2));
  console.log(`\nOK: ${rows.length} filas en site_states_min.json`);
})();
