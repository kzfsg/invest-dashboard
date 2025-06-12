import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

class NFCIScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://www.chicagofed.org/research/data/nfci/current-data';
    }

    async init() {
        console.log('Initializing browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for production
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid blocking
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Wait for network idle to ensure all content loads
        await this.page.goto(this.baseUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('Page loaded successfully');
    }

    async scrapeCharts() {
        console.log('Scraping charts...');
        
        try {
            // Wait for charts to load
            await this.page.waitForSelector('div[class*="chart"], div[id*="chart"], .highcharts-container', { timeout: 10000 });
            
            const charts = await this.page.evaluate(() => {
                const chartElements = [];
                
                // Look for various chart containers
                const selectors = [
                    'div[class*="chart"]',
                    'div[id*="chart"]',
                    '.highcharts-container',
                    'div[class*="graph"]',
                    'div[id*="graph"]',
                    'svg',
                    'canvas'
                ];
                
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((element, index) => {
                        if (element.offsetWidth > 100 && element.offsetHeight > 100) { // Filter out small elements
                            chartElements.push({
                                selector: selector,
                                index: index,
                                id: element.id || `chart-${index}`,
                                className: element.className,
                                innerHTML: element.innerHTML,
                                outerHTML: element.outerHTML,
                                boundingRect: element.getBoundingClientRect(),
                                tagName: element.tagName
                            });
                        }
                    });
                });
                
                return chartElements;
            });
            
            console.log(`Found ${charts.length} chart elements`);
            return charts;
            
        } catch (error) {
            console.log('No charts found with standard selectors, trying alternative approach...');
            return [];
        }
    }

    async scrapeTables() {
        console.log('Scraping tables...');
        
        const tables = await this.page.evaluate(() => {
            const tableElements = [];
            const tables = document.querySelectorAll('table, div[class*="table"], div[id*="table"]');
            
            tables.forEach((table, index) => {
                let tableData = {
                    index: index,
                    id: table.id || `table-${index}`,
                    className: table.className,
                    tagName: table.tagName
                };
                
                if (table.tagName === 'TABLE') {
                    // Extract table data
                    const headers = [];
                    const rows = [];
                    
                    // Get headers
                    const headerCells = table.querySelectorAll('th');
                    headerCells.forEach(cell => headers.push(cell.textContent.trim()));
                    
                    // Get rows
                    const tableRows = table.querySelectorAll('tr');
                    tableRows.forEach(row => {
                        const cells = [];
                        const rowCells = row.querySelectorAll('td, th');
                        rowCells.forEach(cell => cells.push(cell.textContent.trim()));
                        if (cells.length > 0) rows.push(cells);
                    });
                    
                    tableData.headers = headers;
                    tableData.rows = rows;
                } else {
                    // For div tables, get text content
                    tableData.textContent = table.textContent.trim();
                    tableData.innerHTML = table.innerHTML;
                }
                
                tableElements.push(tableData);
            });
            
            return tableElements;
        });
        
        console.log(`Found ${tables.length} table elements`);
        return tables;
    }

    async scrapeDataSections() {
        console.log('Scraping data sections...');
        
        const dataSections = await this.page.evaluate(() => {
            const sections = [];
            
            // Look for specific NFCI data sections
            const selectors = [
                'div[class*="data"]',
                'div[id*="data"]',
                'div[class*="nfci"]',
                'div[id*="nfci"]',
                'div[class*="contribution"]',
                'div[id*="contribution"]',
                '.download-center',
                'div[class*="index"]'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element, index) => {
                    if (element.textContent.trim().length > 50) { // Only include substantial content
                        sections.push({
                            selector: selector,
                            index: index,
                            id: element.id || `section-${index}`,
                            className: element.className,
                            textContent: element.textContent.trim(),
                            innerHTML: element.innerHTML
                        });
                    }
                });
            });
            
            return sections;
        });
        
        console.log(`Found ${dataSections.length} data sections`);
        return dataSections;
    }

    async scrapeCurrentValues() {
        console.log('Scraping current NFCI values...');
        
        const currentValues = await this.page.evaluate(() => {
            const text = document.body.textContent;
            const values = {};
            
            // Extract NFCI value
            const nfciMatch = text.match(/NFCI\s+(?:decreased|increased|was\s+unchanged)?\s*(?:to\s+)?([−-]?\d+\.?\d*)/i);
            if (nfciMatch) {
                values.nfci = nfciMatch[1].replace('−', '-');
            }
            
            // Extract ANFCI value
            const anfciMatch = text.match(/ANFCI\s+(?:decreased|increased|was\s+unchanged)?\s*(?:to\s+|at\s+)?([−-]?\d+\.?\d*)/i);
            if (anfciMatch) {
                values.anfci = anfciMatch[1].replace('−', '-');
            }
            
            // Extract date
            const dateMatch = text.match(/week\s+ending\s+([A-Za-z]+\s+\d{1,2})/i);
            if (dateMatch) {
                values.weekEnding = dateMatch[1];
            }
            
            // Extract contributions
            const riskMatch = text.match(/risk\s+indicators\s+contributed\s+([−-]?\d+\.?\d*)/i);
            if (riskMatch) {
                values.riskContribution = riskMatch[1].replace('−', '-');
            }
            
            const creditMatch = text.match(/credit\s+indicators\s+contributed\s+([−-]?\d+\.?\d*)/i);
            if (creditMatch) {
                values.creditContribution = creditMatch[1].replace('−', '-');
            }
            
            const leverageMatch = text.match(/leverage\s+indicators\s+contributed\s+([−-]?\d+\.?\d*)/i);
            if (leverageMatch) {
                values.leverageContribution = leverageMatch[1].replace('−', '-');
            }
            
            return values;
        });
        
        console.log('Current values:', currentValues);
        return currentValues;
    }

    async takeScreenshots() {
        console.log('Taking screenshots...');
        
        const screenshotDir = 'nfci_screenshots';
        
        try {
            await fs.mkdir(screenshotDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        // Full page screenshot
        await this.page.screenshot({
            path: path.join(screenshotDir, 'nfci_full_page.png'),
            fullPage: true
        });
        
        // Try to screenshot specific chart elements
        try {
            const chartElements = await this.page.$$('div[class*="chart"], .highcharts-container, svg');
            
            for (let i = 0; i < chartElements.length; i++) {
                try {
                    await chartElements[i].screenshot({
                        path: path.join(screenshotDir, `chart_${i}.png`)
                    });
                } catch (error) {
                    console.log(`Could not screenshot chart ${i}:`, error.message);
                }
            }
        } catch (error) {
            console.log('Could not take chart screenshots:', error.message);
        }
        
        console.log(`Screenshots saved to ${screenshotDir} directory`);
    }

    async downloadFiles() {
        console.log('Looking for downloadable files...');
        
        const downloadLinks = await this.page.evaluate(() => {
            const links = [];
            const anchors = document.querySelectorAll('a[href*=".xlsx"], a[href*=".pdf"], a[href*=".csv"]');
            
            anchors.forEach(anchor => {
                links.push({
                    text: anchor.textContent.trim(),
                    href: anchor.href,
                    fileName: anchor.href.split('/').pop()
                });
            });
            
            return links;
        });
        
        console.log(`Found ${downloadLinks.length} downloadable files:`, downloadLinks);
        return downloadLinks;
    }

    async scrapeAll() {
        const results = {
            timestamp: new Date().toISOString(),
            url: this.baseUrl,
            currentValues: {},
            charts: [],
            tables: [],
            dataSections: [],
            downloadLinks: []
        };
        
        try {
            await this.init();
            
            // Scrape different types of content
            results.currentValues = await this.scrapeCurrentValues();
            results.charts = await this.scrapeCharts();
            results.tables = await this.scrapeTables();
            results.dataSections = await this.scrapeDataSections();
            results.downloadLinks = await this.downloadFiles();
            
            // Take screenshots
            await this.takeScreenshots();
            
            return results;
            
        } catch (error) {
            console.error('Error during scraping:', error);
            throw error;
        }
    }

    async saveResults(results, filename = 'nfci_data.json') {
        try {
            await fs.writeFile(filename, JSON.stringify(results, null, 2));
            console.log(`Results saved to ${filename}`);
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }
}

// Usage example
async function main() {
    const scraper = new NFCIScraper();
    
    try {
        console.log('Starting NFCI data scraping...');
        const results = await scraper.scrapeAll();
        
        // Save results to JSON file
        await scraper.saveResults(results);
        
        // Print summary
        console.log('\n=== SCRAPING SUMMARY ===');
        console.log(`Current NFCI: ${results.currentValues.nfci || 'Not found'}`);
        console.log(`Current ANFCI: ${results.currentValues.anfci || 'Not found'}`);
        console.log(`Week Ending: ${results.currentValues.weekEnding || 'Not found'}`);
        console.log(`Charts found: ${results.charts.length}`);
        console.log(`Tables found: ${results.tables.length}`);
        console.log(`Data sections found: ${results.dataSections.length}`);
        console.log(`Download links found: ${results.downloadLinks.length}`);
        
    } catch (error) {
        console.error('Scraping failed:', error);
    } finally {
        await scraper.close();
    }
}

// Run the scraper
await main();

module.exports = NFCIScraper;