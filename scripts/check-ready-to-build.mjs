// Run against a local production server or BASE_URL. Requires Playwright;
// PLAYWRIGHT_MODULE can point to an existing installation's index.mjs.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:3001";
const screenshots = process.env.SCREENSHOTS_DIR || "/tmp/sitr-ready-to-build";
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const check = page.locator("#computer-check");
  async function layout() {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow");
    for (const button of await check.locator("button").all()) {
      const box = await button.boundingBox();
      assert(box && box.height >= 44, "Buttons need a 44px touch target");
    }
  }
  async function anchor(name, id) {
    await page.getByRole("link", { name, exact: false }).first().click();
    await page.waitForTimeout(200);
    const top = await page.locator(id).evaluate(el => el.getBoundingClientRect().top);
    assert(top >= 55 && top < 150, `Anchor ${id} hidden under header or off screen: ${top}`);
  }
  async function contrast() {
    const failures = await page.locator("main").evaluate(main => {
      const rgb = color => (color.match(/[\d.]+/g) || []).map(Number);
      const luminance = c => c.slice(0, 3).map(v => {
        v /= 255;
        return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
      }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
      return [...main.querySelectorAll("*")].filter(el => el.getClientRects().length &&
        [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).flatMap(el => {
        const style = getComputedStyle(el);
        let bg = el;
        while (bg.parentElement && rgb(getComputedStyle(bg).backgroundColor)[3] === 0) bg = bg.parentElement;
        const c = rgb(style.color), b = rgb(getComputedStyle(bg).backgroundColor);
        if (c.length < 3 || b.length < 3 || b[3] === 0) return [];
        const l = [luminance(c), luminance(b)].sort((a, b) => b - a);
        const ratio = (l[0] + .05) / (l[1] + .05);
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
        return ratio < (large ? 3 : 4.5) ? [{ text: el.textContent.slice(0, 60), ratio }] : [];
      });
    });
    assert.deepEqual(failures, [], "Text contrast");
  }
  for (const theme of ["dark", "light"]) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/products/ready-to-build");
      await page.evaluate(t => localStorage.setItem("om-theme", t), theme);
      await page.reload();
      assert.equal(await page.locator("html").getAttribute("data-om-theme"), theme);
      assert.equal(await page.locator("h1").innerText(), "Before you buy a new one, find out what yours can become.");
      await layout();
      await contrast();
      await page.screenshot({ path: `${screenshots}/${theme}-${width}.png`, fullPage: true });
      const evidence = page.locator("#real-projects");
      assert.equal(await evidence.locator("article").count(), 4);
      assert.deepEqual(await evidence.locator("article h3").allTextContents(), ["CrossHeartPray", "TheDJCares", "iDontCry", "WatchedNotWatched"]);
      await evidence.screenshot({ path: `${screenshots}/real-projects-${theme}-${width}.png` });
      for (const link of await evidence.locator("article a").all()) {
        await link.focus();
        assert(await link.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== "none"), "Visible keyboard focus on project links");
      }

      await anchor("See the whole process", "#process");
      await anchor("Check my computer", "#computer-check");
      const options = check.getByRole("group").getByRole("button");
      assert.equal(await options.count(), 4);
      await options.first().focus();
      // Native Tab order, Space activation, state focus, and Enter activation.
      for (const name of ["Mac", "Linux computer", "I’m not sure"]) {
        await page.keyboard.press("Tab");
        assert((await page.evaluate(() => document.activeElement.textContent)).includes(name));
      }
      await page.keyboard.press("Space");
      assert.equal(await page.evaluate(() => document.activeElement.textContent), "Let’s find out together.");
      assert((await check.innerText()).includes("We’ll show you where to find that information"));
      await layout();
      await contrast();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      assert((await page.evaluate(() => document.activeElement.textContent)).includes("I’m not sure"));
      for (const [name, instruction] of [["Windows PC or laptop", "About your PC"], ["Mac", "About This Mac"], ["Linux computer", "System Information"]]) {
        await check.getByRole("button", { name, exact: false }).click();
        assert((await check.innerText()).includes(instruction));
        assert.equal(await page.evaluate(() => document.activeElement.textContent), "First, find your computer’s details.");
        await layout();
        await contrast();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.textContent), "Next: protect your files.");
        assert((await check.innerText()).includes("Your computer is not confirmed ready yet"));
        await layout();
        await contrast();
        await anchor("See what the kit will help with", "#included");
        await check.getByRole("button", { name: "Change computer type" }).click();
        assert((await page.evaluate(() => document.activeElement.textContent)).includes(name));
      }
      const faq = page.locator("details").first();
      await faq.locator("summary").focus();
      await page.keyboard.press("Enter");
      assert(await faq.evaluate(el => el.open));
      assert.equal(await page.locator("main img").evaluateAll(imgs => imgs.filter(i => !i.complete || !i.naturalWidth).length), 0);
      console.log(`PASS ${theme} ${width}px: layout, theme, contrast, anchors, all computer paths, keyboard focus and FAQ`);
    }
  }
  for (const route of ["/", "/library", "/everything"]) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200);
    assert(await page.locator('a[href="/products/ready-to-build"]').count() > 0);
  }
  for (const url of ["https://crossheartpray.com", "https://thedjcares.com", "https://idontcry.com/sports", "https://watchednotwatched.com"]) {
    const response = await page.request.get(url, { timeout: 30000 });
    assert(response.ok(), `Project link failed: ${url} (${response.status()})`);
    console.log(`PASS project link: ${url} (${response.status()})`);
  }
  assert.deepEqual(errors, [], "Browser exceptions");
  console.log(`PASS discovery links and browser errors: ${base}`);
} finally {
  await browser.close();
}
