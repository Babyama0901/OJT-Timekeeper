import { chromium } from 'playwright';

(async () => {
  // Launch browser in non-headless mode so the user can interact (login) if needed
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log("Navigating to local Timekeeper instance...");
  await page.goto('http://localhost:3000/OJT-Timekeeper/');
  
  console.log("Please log in to the application within the browser window if prompted.");
  console.log("Waiting for authentication and app to load...");
  
  // Wait until the app wrapper is visible (which happens after successful Firebase auth)
  await page.waitForSelector('#app-wrapper:not(.hidden)', { timeout: 120000 });
  console.log("App loaded! Automating session entry...");
  
  // Wait for animation delays to finish so elements are fully interactive
  await page.waitForTimeout(1000);
  
  // Scroll to Log Session section to ensure it is in view
  await page.click('a[data-section="log-session"]');
  await page.waitForTimeout(500);

  // Fill in the Log Session form with the provided details
  console.log("Entering session data...");
  await page.fill('#log-date', '2026-04-20');
  
  // Times must be in 24-hour format for input type="time"
  await page.fill('#am-in', '07:14');
  await page.fill('#am-out', '11:30');
  await page.fill('#pm-in', '12:15');
  await page.fill('#pm-out', '17:16'); // 05:16 PM
  
  console.log("Submitting form...");
  await page.click('#log-form button[type="submit"]');
  
  console.log("Session logged successfully!");
  
  // Wait a moment for the dialog and cloud sync to process
  await page.waitForTimeout(3000);
  
  console.log("Closing browser...");
  await browser.close();
})();
