import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/OJT-Timekeeper/');
  await page.waitForTimeout(1000);
  
  // Log localStorage
  const logs = await page.evaluate(() => localStorage.getItem('ojt_logs'));
  console.log('localStorage logs before:', logs);
  
  // Dispatch form submit directly
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  });
  
  await page.waitForTimeout(1000);
  
  const logsAfter = await page.evaluate(() => localStorage.getItem('ojt_logs'));
  console.log('localStorage logs after:', logsAfter);

  await browser.close();
})();
