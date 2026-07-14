const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  let renderCount = 0;
  page.on('console', msg => {
    if (msg.text().includes('[PropertyCard] Rendered:')) {
      renderCount++;
    }
  });

  await page.goto('http://127.0.0.1:3001/search', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for initial render to settle
  await new Promise(r => setTimeout(r, 4000));
  
  const initialCount = renderCount;
  console.log(`Initial render count: ${initialCount}`);
  
  renderCount = 0;
  
  // Type in the city filter input
  // Select the first input that has placeholder containing "City"
  await page.waitForSelector('input[placeholder*="City"]');
  await page.type('input[placeholder*="City"]', 'Mumbai');
  
  // Wait to see if renders happen
  await new Promise(r => setTimeout(r, 1000));
  
  console.log(`Render count after typing 6 keystrokes ("Mumbai"): ${renderCount}`);

  await browser.close();
})();
