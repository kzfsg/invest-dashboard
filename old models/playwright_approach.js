const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Helper function to add random delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if we're being blocked
async function checkIfBlocked(page) {
  const content = await page.content();
  return content.includes('Verify you are human') || 
         content.includes('Cloudflare') || 
         content.includes('challenge') ||
         content.includes('security check');
}

// Helper function to perform human-like interactions
async function humanLikeInteraction(page) {
  // Random mouse movements
  await page.mouse.move(
    Math.floor(Math.random() * 800) + 100,
    Math.floor(Math.random() * 600) + 100
  );
  await delay(500 + Math.random() * 1000);
  
  // Random scrolling
  await page.evaluate(() => {
    window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
  });
  await delay(500 + Math.random() * 1000);
}

async function playwrightScreenshot() {
  console.log('Launching Playwright browser...');
  
  const browser = await chromium.launch({
    headless: false, // Keep visible for debugging
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--disable-dev-shm-usage',
      '--disable-infobars',
      '--window-size=1400,900',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  try {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1400, height: 900 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      geolocation: { longitude: -74.006, latitude: 40.7128 }, // New York
      colorScheme: 'light',
    });

    // Set up request interception to block unnecessary resources
    await context.route('**/*', route => {
      const resourceType = route.request().resourceType();
      // Block unnecessary resources
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const page = await context.newPage();

    // Add script to remove automation markers and make browser appear more human-like
    await page.addInitScript(() => {
      // Overwrite the `languages` property to use a fixed value
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Overwrite the `plugins` property to use a fixed value
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Overwrite the `webdriver` property to return undefined
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock chrome object
      window.chrome = {
        runtime: {},
        webstore: {},
        csi: () => {},
        loadTimes: () => {},
        app: {
          isInstalled: false,
          InstallState: 'not_installed',
          RunningState: 'stopped',
        },
      };

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters);
    });

    // Set extra HTTP headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
    });

    // Set referrer
    await page.setExtraHTTPHeaders({
      'Referer': 'https://www.google.com/'
    });

    // Navigate to the page with retry logic
    const maxRetries = 3;
    let retryCount = 0;
    let success = false;

    while (retryCount < maxRetries && !success) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries}...`);
        
        // First, go to a popular site to establish a browsing history
        await page.goto('https://www.google.com', {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await delay(2000 + Math.random() * 3000);

        // Then go to the target site
        console.log('Navigating to MacroMicro...');
        await page.goto('https://en.macromicro.me', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
          referer: 'https://www.google.com/'
        });

        // Random delays and interactions
        await delay(2000 + Math.random() * 3000);
        await humanLikeInteraction(page);

        // Check if we're being blocked
        const isBlocked = await checkIfBlocked(page);
        if (isBlocked) {
          console.log('❌ Detected bot protection. Retrying...');
          retryCount++;
          await delay(5000); // Wait before retry
          continue;
        }


        // Now try the chart page with the same careful approach
        console.log('Navigating to chart page...');
        await page.goto('https://en.macromicro.me/charts/45866/global-citi-surprise-index', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
          referer: 'https://en.macromicro.me/'
        });

        // More human-like behavior
        await delay(2000 + Math.random() * 3000);
        await humanLikeInteraction(page);

        // Final check if we're blocked
        const finalCheck = await checkIfBlocked(page);
        if (finalCheck) {
          console.log('❌ Still blocked after navigation. Retrying...');
          retryCount++;
          await delay(5000);
          continue;
        }

        console.log('✅ Successfully loaded the chart page!');
        success = true;

      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error.message);
        retryCount++;
        if (retryCount < maxRetries) {
          console.log('Retrying...');
          await delay(5000);
        }
      }
    }


    if (!success) {
      throw new Error('Failed to bypass bot protection after multiple attempts');
    }

    // Take screenshot
    const screenshotDir = './screenshots';
    try {
      await fs.access(screenshotDir);
    } catch {
      await fs.mkdir(screenshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `playwright-${timestamp}.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true
    });

    console.log(`Screenshot saved: ${filepath}`);
    
    // Keep browser open to inspect
    console.log('Browser staying open for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

playwrightScreenshot();