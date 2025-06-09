const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

// Add stealth plugin
puppeteer.use(StealthPlugin());

class StealthCookieScreenshot {
  constructor() {
    this.cookieFile = './cookies.json';
    this.screenshotDir = './screenshots';
  }

  async loadCookies(page) {
    try {
      const cookieData = await fs.readFile(this.cookieFile, 'utf8');
      const cookies = JSON.parse(cookieData);
      await page.setCookie(...cookies);
      console.log('✅ Login cookies loaded');
      return true;
    } catch (error) {
      console.log('❌ No saved cookies found - you may need to login first');
      return false;
    }
  }

  async saveCookies(page) {
    const cookies = await page.cookies();
    await fs.writeFile(this.cookieFile, JSON.stringify(cookies, null, 2));
    console.log('✅ Cookies saved');
  }

  async stealthScreenshotWithLogin() {
    console.log('Launching stealth browser with login...');
    
    const browser = await puppeteer.launch({
      headless: false, // Keep visible to see Cloudflare
      defaultViewport: { width: 1366, height: 768 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Load existing cookies first
      const cookiesLoaded = await this.loadCookies(page);
      
      // Add random delays to seem more human
      const randomDelay = () => Math.floor(Math.random() * 2000) + 1000;
      
      console.log('Navigating to site with cookies...');
      await page.goto('https://en.macromicro.me', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait and check for Cloudflare
      await new Promise(resolve => setTimeout(resolve, randomDelay()));
      
      // Check if we're past Cloudflare on homepage
      let content = await page.content();
      if (content.includes('Verify you are human')) {
        console.log('⚠️  Cloudflare detected on homepage, waiting...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
      
      // Navigate to the specific chart
      console.log('Going to chart page...');
      await page.goto('https://en.macromicro.me/charts/45866/global-citi-surprise-index', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for potential Cloudflare resolution
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check what we got
      content = await page.content();
      const isCloudflareBlocked = content.includes('Verify you are human') || content.includes('Cloudflare');
      const needsLogin = content.includes('login') || content.includes('sign in');
      
      if (isCloudflareBlocked) {
        console.log('❌ Still blocked by Cloudflare');
        console.log('💡 Browser will stay open - manually solve Cloudflare, then press Enter');
        
        // Wait for manual intervention
        await new Promise(resolve => {
          process.stdin.once('data', () => resolve());
        });
      } else if (needsLogin) {
        console.log('⚠️  Seems to need login - cookies may have expired');
      } else {
        console.log('✅ Seems to have bypassed protection and logged in!');
      }
      
      // Save current cookies (in case we bypassed Cloudflare)
      await this.saveCookies(page);
      
      // Take screenshot regardless
      await fs.mkdir(this.screenshotDir, { recursive: true }).catch(() => {});

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `stealth-with-cookies-${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });

      console.log(`📸 Screenshot saved: ${filepath}`);
      
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
    }
  }
}

const screenshotter = new StealthCookieScreenshot();
screenshotter.stealthScreenshotWithLogin();