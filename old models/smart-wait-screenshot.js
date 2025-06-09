const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function takeSmartScreenshot(url) {
  let browser;
  
  try {
    console.log(`Taking screenshot of: ${url}`);
    
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 800
      }
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Try to wait for chart content to load
    try {
      // Wait for common chart elements (adjust selectors as needed)
      await page.waitForSelector('canvas, svg, .chart, [class*="chart"]', { 
        timeout: 10000 
      });
      console.log('Chart elements detected, waiting a bit more...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.log('No specific chart elements found, using general wait...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Create screenshots directory
    const screenshotDir = './screenshots';
    try {
      await fs.access(screenshotDir);
    } catch {
      await fs.mkdir(screenshotDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `citi-surprise-${timestamp}.png`;
    const filepath = path.join(screenshotDir, filename);

    // Take screenshot
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png'
    });

    console.log(`✅ Screenshot saved: ${filepath}`);
    return filepath;

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run it
takeSmartScreenshot('https://en.macromicro.me/charts/45866/global-citi-surprise-index')
  .then(() => console.log('Done!'))
  .catch(console.error);