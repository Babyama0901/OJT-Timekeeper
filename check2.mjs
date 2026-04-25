import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000/OJT-Timekeeper/');
  await page.waitForTimeout(1000);
  
  // Fill the form and submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  
  // Check if there are any tr elements in the table body
  const rowCount = await page.evaluate(() => {
    return document.querySelectorAll('tbody tr').length;
  });
  console.log('Row count in table bodies:', rowCount);
  
  const innerText = await page.evaluate(() => {
    return document.querySelector('tbody')?.innerText;
  });
  console.log('tbody text:', innerText);

  await browser.close();
})();
