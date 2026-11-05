// Smoke test: loads index.html in Chromium, cleans the sample photo and checks that
// no EXIF remains while the image still decodes. Run: npm i playwright && node tests/run.js
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("file://" + path.resolve(__dirname, "../index.html"));
  await page.setInputFiles("#file", path.resolve(__dirname, "../samples/example-with-gps.jpg"));
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => {
    const b = new Uint8Array(await fetch(document.querySelector("#thumb").src).then(x => x.arrayBuffer()));
    const before = Revelateur.inspect(b);
    const { out } = Revelateur.clean(b, before);
    const after = Revelateur.inspect(out);
    const ok = await createImageBitmap(new Blob([out], { type: "image/jpeg" })).then(() => true, () => false);
    return { gpsBefore: before.exif.tags.some(t => t.ifd === "GPS"), tagsAfter: after.exif.tags.length, decodes: ok };
  });
  await browser.close();
  const pass = r.gpsBefore && r.tagsAfter === 0 && r.decodes && !errors.length;
  console.log(pass ? "PASS" : "FAIL", r, errors);
  process.exit(pass ? 0 : 1);
})();
