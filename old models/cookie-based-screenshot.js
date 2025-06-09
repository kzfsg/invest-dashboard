const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class CookieBasedScreenshot {
  constructor() {
    this.cookieFile = './cookies.json';
    this.screenshotDir = './screenshots';
  }

  async saveCookies(page) {
    const cookies = await page.cookies();
    await fs.writeFile(this.cookieFile, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved');
  }

  async loadCookies(page) {
    try {
      const cookieData = await fs.readFile(this.cookieFile, 'utf8');
      const cookies = JSON.parse(cookieData);
      await page.setCookie(...cookies);
      console.log('Cookies loaded');
      return true;
    } catch (error) {
      console.log('No saved cookies found');
      return false;
    }
  }

  async manualLoginAndSaveCookies() {
    console.log('🔧 Manual login mode - browser will stay open');
    console.log('Please login manually, then press Enter in terminal when done...');
    
    const browser = await puppeteer.launch({
      headless: false, // Keep browser visible
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    await page.goto('https://en.macromicro.me/login');

    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // Save cookies
    await this.saveCookies(page);
    await browser.close();
    console.log('✅ Cookies saved! You can now run automated screenshots.');
  }

  async takeScreenshotWithCookies(url) {
    try {
      await fs.access(this.screenshotDir);
    } catch {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 1280, height: 800 }
      });

      const page = await browser.newPage();
      
      // Load saved cookies
      const cookiesLoaded = await this.loadCookies(page);
      if (!cookiesLoaded) {
        throw new Error('No cookies found. Run manualLoginAndSaveCookies() first.');
      }

      // Navigate to chart
      console.log('Navigating to chart with saved session...');
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Check if we're still logged in
      const isLoggedIn = await page.evaluate(() => {
        // Look for login indicators - adjust these selectors based on the site
        return !document.querySelector('a[href*="login"], .login-btn') ||
               document.querySelector('.user-menu, .profile, .logout');
      });

      if (!isLoggedIn) {
        throw new Error('Session expired. Please run manualLoginAndSaveCookies() again.');
      }

      // Wait for chart
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Take screenshot
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `citi-surprise-${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });

      console.log(`✅ Screenshot saved: ${filepath}`);
      return filepath;

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

// Usage
const screenshotter = new CookieBasedScreenshot();

// First time setup - uncomment this line and run once
// screenshotter.manualLoginAndSaveCookies();

// Regular usage - comment out the above line and uncomment this after first setup
screenshotter.takeScreenshotWithCookies('https://en.macromicro.me/charts/45866/global-citi-surprise-index')
  .then(() => console.log('Done!'))
  .catch(console.error);