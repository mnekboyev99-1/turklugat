const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:4174');
  await new Promise(r => setTimeout(r, 3000)); // wait 3s
  const content = await page.content();
  console.log('HTML length:', content.length);
  await browser.close();
})();
