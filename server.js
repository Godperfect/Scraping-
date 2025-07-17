const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');

(async () => {
  const driver = await new Builder().forBrowser('chrome').build();

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
        // Check if podcast player exists
        const playBtn = await item.findElement(By.css('.podcast-player .play-pause-btn'));
        await playBtn.click();
        await driver.sleep(1500);
        audio = await getAttr('.podcast-player audio', 'src');
      } catch {
        audio = '';
      }

      results.push({ title, img, summary, source, time, audio });
    }

    fs.writeFileSync('news.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('✅ Saved top 20 news with audio URLs to news.json');

  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await driver.quit();
  }
})();
