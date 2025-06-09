const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ManualCloudflareBypass {
  constructor() {
    this.cookieFile = './cookies.json';
    this.screenshotDir = './screenshots';
  }

  async loadCookies(page) {
    try {
      const cookieData = await fs.readFile(this.cookieFile, 'utf8');
      const cookies = JSON.parse(cookieData);
      await page.setCookie(...cookies);
      console.log('✅ Existing cookies loaded');
      return true;
    } catch (error) {
      console.log('ℹ️  No existing cookies found');
      return false;
    }
  }

  async saveCookies(page) {
    const cookies = await page.cookies();
    await fs.writeFile(this.cookieFile, JSON.stringify(cookies, null, 2));
    console.log('✅ Cookies saved for future use');
  }

  async setupLoginAndBypass() {
    console.log('🚀 Starting manual Cloudflare bypass with login...');
    console.log('📋 Instructions:');
    console.log('1. Browser will open with any existing cookies');
    console.log('2. If you see Cloudflare challenge, solve it manually');
    console.log('3. If you need to login, do it manually');
    console.log('4. Navigate to the chart page');
    console.log('5. Come back to terminal and press Enter when chart is visible');
    
    const browser = await puppeteer.launch({
      headless: false, // Must be visible for manual interaction
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Load existing cookies if available
      await this.loadCookies(page);
      
      // Start at homepage to handle Cloudflare first
      console.log('🌐 Opening MacroMicro homepage...');
      await page.goto('https://en.macromicro.me', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait a bit for potential Cloudflare
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Then navigate to chart
      console.log('📊 Navigating to chart page...');
      await page.goto('https://en.macromicro.me/charts/45866/global-citi-surprise-index', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      console.log('\n⏳ Manual intervention time!');
      console.log('✅ Solve any Cloudflare challenges');
      console.log('🔐 Login if prompted');
      console.log('📈 Make sure the chart is visible');
      console.log('Press Enter when everything looks good...');
      
      // Wait for user confirmation
      await new Promise(resolve => {
        rl.question('Press Enter when ready for screenshot: ', () => {
          resolve();
        });
      });

      // Save cookies after successful manual intervention
      await this.saveCookies(page);

      // Take screenshot
      await fs.mkdir(this.screenshotDir, { recursive: true }).catch(() => {});

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `manual-with-cookies-${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      console.log('📸 Taking screenshot...');
      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });

      console.log(`✅ Screenshot saved: ${filepath}`);
      console.log('🍪 Cookies updated for future automated runs');

    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      rl.close();
      await browser.close();
    }
  }

  async automatedScreenshotWithCookies() {
    console.log('🤖 Attempting automated screenshot with saved cookies...');
    
    const browser = await puppeteer.launch({
      headless: true, // Try headless first
      defaultViewport: { width: 1366, height: 768 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Load saved cookies
      const cookiesLoaded = await this.loadCookies(page);
      if (!cookiesLoaded) {
        throw new Error('No cookies found. Run setupLoginAndBypass() first.');
      }

      // Navigate with cookies
      await page.goto('https://en.macromicro.me/charts/45866/global-citi-surprise-index', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Check if successful
      const content = await page.content();
      const isBlocked = content.includes('Verify you are human') || content.includes('Cloudflare');
      const needsLogin = content.includes('login') || content.includes('sign in');
      
      if (isBlocked) {
        throw new Error('Cloudflare blocking detected. Run setupLoginAndBypass() again.');
      }
      
      if (needsLogin) {
        throw new Error('Login required. Run setupLoginAndBypass() again.');
      }

      // Take screenshot
      await fs.mkdir(this.screenshotDir, { recursive: true }).catch(() => {});

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `automated-with-cookies-${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });

      console.log(`✅ Screenshot saved: ${filepath}`);

    } catch (error) {
      console.error('❌ Automated screenshot failed:', error.message);
      console.log('💡 Try running setupLoginAndBypass() to refresh cookies');
    } finally {
      await browser.close();
    }
  }
}

// Usage
const bypasser = new ManualCloudflareBypass();

// For first-time setup or when cookies expire:
bypasser.setupLoginAndBypass();

// For daily automated screenshots (uncomment after first setup):
// bypasser.automatedScreenshotWithCookies();