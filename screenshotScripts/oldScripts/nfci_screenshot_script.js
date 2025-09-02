import { chromium } from 'playwright';
import path from 'path';
import { promises as fs } from 'fs';

class NFCIScreenshotter {
    constructor() {
        this.url = 'https://www.chicagofed.org/research/data/nfci/current-data';
        this.screenshotDir = './currentScreenshots/nfci-screenshots';
        this.browser = null;
        this.page = null;
    }

    async init() {
        // Create screenshots directory if it doesn't exist
        try {
            await fs.access(this.screenshotDir);
        } catch {
            await fs.mkdir(this.screenshotDir, { recursive: true });
        }

        // Launch browser
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport for consistent screenshots
        await this.page.setViewportSize({ width: 1920, height: 1080 });
        
        // Set user agent to avoid blocking
        await this.page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    }

    async takeScreenshot() {
        try {
            console.log('Navigating to NFCI page...');
            
            // Navigate to the page with extended timeout
            await this.page.goto(this.url, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });

            console.log('Page loaded, checking for content...');

            // Wait for page to be fully loaded - try multiple selectors
            const contentSelectors = [
                'main',
                'body',
                '.main-content',
                '#main',
                '#content',
                '.content',
                'article',
                '.page-content'
            ];

            let contentFound = false;
            for (const selector of contentSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    console.log(`✅ Found content using selector: ${selector}`);
                    contentFound = true;
                    break;
                } catch (e) {
                    console.log(`❌ Selector '${selector}' not found, trying next...`);
                }
            }

            if (!contentFound) {
                console.log('⚠️ No specific content selectors found, waiting for body...');
                await this.page.waitForSelector('body', { timeout: 5000 });
            }

            // Wait for network to be mostly idle
            try {
                await this.page.waitForLoadState('networkidle', { timeout: 10000 });
                console.log('✅ Network idle detected');
            } catch (e) {
                console.log('⚠️ Network idle timeout, proceeding anyway...');
            }
            
            // Wait for any charts/graphs to load (common selectors for data visualizations)
            console.log('Looking for data visualizations...');
            try {
                await Promise.race([
                    this.page.waitForSelector('svg', { timeout: 3000 }),
                    this.page.waitForSelector('canvas', { timeout: 3000 }),
                    this.page.waitForSelector('.chart', { timeout: 3000 }),
                    this.page.waitForSelector('[class*="chart"]', { timeout: 3000 }),
                    this.page.waitForSelector('img[src*="chart"]', { timeout: 3000 }),
                    this.page.waitForSelector('img[src*="graph"]', { timeout: 3000 }),
                    this.page.waitForTimeout(3000) // Fallback timeout
                ]);
                console.log('✅ Data visualization elements detected');
            } catch (e) {
                console.log('⚠️ No specific chart elements found, proceeding with screenshot...');
            }

            // Additional wait to ensure dynamic content is loaded
            console.log('Final wait for dynamic content...');
            await this.page.waitForTimeout(3000);

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const filename = `nfci-data-${timestamp}.png`;
            const filepath = path.join(this.screenshotDir, filename);

            // Take full page screenshot
            await this.page.screenshot({
                path: filepath,
                fullPage: true,
                type: 'png'
            });

            console.log(`✅ Screenshot saved: ${filepath}`);
            
            // Also take a screenshot of just the main content area
            try {
                // Try multiple selectors for main content
                const contentSelectors = ['main', '.main-content', '#main', '#content', '.content', 'article'];
                let mainContent = null;
                
                for (const selector of contentSelectors) {
                    try {
                        mainContent = await this.page.$(selector);
                        if (mainContent) {
                            console.log(`✅ Found main content using: ${selector}`);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                if (mainContent) {
                    const contentFilename = `nfci-content-${timestamp}.png`;
                    const contentFilepath = path.join(this.screenshotDir, contentFilename);
                    
                    await mainContent.screenshot({
                        path: contentFilepath,
                        type: 'png'
                    });
                    
                    console.log(`✅ Content screenshot saved: ${contentFilepath}`);
                } else {
                    console.log('⚠️ Could not find main content element for focused screenshot');
                }
            } catch (e) {
                console.log('⚠️ Could not capture main content screenshot:', e.message);
            }

            return filepath;

        } catch (error) {
            console.error('❌ Error taking screenshot:', error);
            throw error;
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();
            const filepath = await this.takeScreenshot();
            return filepath;
        } finally {
            await this.cleanup();
        }
    }
}

// Main execution function
async function main() {
    const screenshotter = new NFCIScreenshotter();
    
    try {
        console.log('🚀 Starting NFCI screenshot process...');
        const filepath = await screenshotter.run();
        console.log(`📸 Screenshot completed successfully: ${filepath}`);
        process.exit(0);
    } catch (error) {
        console.error('💥 Screenshot process failed:', error);
        process.exit(1);
    }
}

// Simple check to run main() directly
if (process.argv[1] && process.argv[1].endsWith('nfci_screenshot_script.js')) {
    console.log('🚀 Starting NFCI screenshot script...');
    main().catch(error => {
        console.error('❌ Error in main execution:', error);
        process.exit(1);
    });
}

export { NFCIScreenshotter, main };

// Schedule function for weekly execution
function scheduleWeeklyScreenshot() {
    const cron = import('node-cron');
    
    // Run every Monday at 9 AM (when fresh data is likely available)
    cron.schedule('0 9 * * 1', async () => {
        console.log('🕘 Weekly NFCI screenshot triggered...');
        await main();
    }, {
        scheduled: true,
        timezone: "America/Chicago" // Chicago Fed timezone
    });
    
    console.log('📅 Weekly screenshot scheduled for Mondays at 9 AM CT');
}