import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  headless: true,
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const theme of ["dark", "light"]) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/builds`);
      await page.evaluate((value) => localStorage.setItem("om-theme", value), theme);
      await page.reload();
      await page.locator("#owner-builds-heading").waitFor();
      assert.equal(await page.locator("#owner-builds-heading").innerText(), "See what we've built.");
      assert.equal(await page.locator(".owner-build-card").count(), 15); // 6 featured + 9 directory cards; no duplicate cards
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${theme} ${width}`);
      assert.equal(await page.locator("html").getAttribute("data-om-theme"), theme);
      const filter = page.getByRole("button", { name: "Books & media", exact: true });
      await filter.click();
      assert.equal(await page.locator("#all-builds .owner-build-card").count(), 1);
      assert.equal(await filter.getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: "All builds", exact: true }).click();
      for (const link of await page.locator("#all-builds .owner-visit").all()) {
        await link.focus();
        assert(await link.evaluate((element) => element === document.activeElement), "project link is keyboard focusable");
      }
      assert(await page.locator('a[href="/products/ready-to-build"]').count() >= 2);
      assert(await page.locator('a[href="/create"]').count() >= 2);
      console.log(`PASS ${theme} ${width}px: showroom, filters, theme, overflow, focus, CTAs`);
    }
  }
  assert.deepEqual(errors, [], "browser exceptions");
  console.log(`PASS ${base}/builds`);
} finally {
  await browser.close();
}
