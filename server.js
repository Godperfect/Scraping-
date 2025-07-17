const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const options = new chrome.Options();
options.setChromeBinaryPath('/usr/bin/chromium'); // or /opt/render/.cache/... if preinstalled differently
options.addArguments(
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--remote-debugging-port=9222'
);

(async () => {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("https://www.genspark.ai/news?channel=entertainment");

    for (let i = 0; i < 5; i++) {
      await driver.executeScript("window.scrollBy(0, 2000)");
      await driver.sleep(1000);
    }

    await driver.wait(until.elementsLocated(By.css('.flow_item_wrapper')), 15000);
    const items = await driver.findElements(By.css('.flow_item_wrapper'));

    const results = [];

    for (let i = 0; i < Math.min(20, items.length); i++) {
      const item = items[i];

      const getText = async (sel) => {
        try {
          return await item.findElement(By.css(sel)).getText();
        } catch {
          return '';
        }
      };

      const getAttr = async (sel, attr) => {
        try {
          return await item.findElement(By.css(sel)).getAttribute(attr);
        } catch {
          return '';
        }
      };

      const title = await getText('.title');
      const img = await getAttr('.image img', 'src');
      const summary = await getText('.summary');
      const source = await getText('.source-name');
      const time = await getText('.published-time');

      let audio = '';
      try {
        const playBtn = await item.findElement(By.css('.podcast-player .play-pause-btn'));
        await playBtn.click();
        await driver.sleep(1500);
        audio = await getAttr('.podcast-player audio', 'src');
      } catch {
        audio = '';
      }

      results.push({ title, img, summary, source, time, audio });
    }

    // ✅ Log JSON output instead of writing to file
    console.log('✅ Top 20 News Items:\n', JSON.stringify(results, null, 2));

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await driver.quit();
    process.exit(0);
  }
})();
