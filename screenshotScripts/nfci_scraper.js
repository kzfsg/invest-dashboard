import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NFCIHTMLScraper {
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
        
        // Wait a bit more for any dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async extractChartDivs() {
        console.log('Extracting specific chart divs...');
        
        const chartDivs = await this.page.evaluate(() => {
            const charts = [];
            
            // Specific chart IDs to extract (0, 2, 5, 7, 9 from the original list)
            const targetChartIds = [
                'nfci-decomposition-highcharts',  // Chart 0
                'anfci-decomposition-highcharts',  // Chart 2
                'nfci-contributions-highcharts',   // Chart 5
                'anfci-contributions-highcharts',  // Chart 7
                'highcharts-data-table-1'          // Chart 9 (data table)
            ];
            
            // Find and extract only the specific charts we want
            targetChartIds.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    charts.push({
                        type: 'chart',
                        id: id,
                        className: element.className,
                        selector: `#${id}`,
                        innerHTML: element.innerHTML,
                        outerHTML: element.outerHTML,
                        textContent: element.textContent.trim(),
                        attributes: Array.from(element.attributes).reduce((acc, attr) => {
                            acc[attr.name] = attr.value;
                            return acc;
                        }, {}),
                        dimensions: {
                            width: rect.width,
                            height: rect.height
                        },
                        tagName: element.tagName
                    });
                }
            });
            
            return charts;
        });
        
        console.log(`Extracted ${chartDivs.length} specific chart divs`);
        return chartDivs;
    }

    async extractTableDivs() {
        console.log('Extracting table divs...');
        
        const tableDivs = await this.page.evaluate(() => {
            const tables = [];
            
            // Look for table containers
            const tableSelectors = [
                'table',
                'div[class*="table"]',
                'div[id*="table"]',
                'div[class*="data-table"]',
                'div[id*="data-table"]',
                'div[class*="contribution"]',
                'div[id*="contribution"]',
                // Look for divs that contain tabular data
                'div:has(table)',
                '.table-responsive',
                '.data-grid'
            ];
            
            const foundElements = new Set();
            
            tableSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((element, index) => {
                        if (foundElements.has(element)) return;
                        
                        // Check if element contains tabular data
                        const hasTable = element.querySelector('table') !== null;
                        const hasTabularContent = element.textContent.includes('Risk') && 
                                                element.textContent.includes('Credit') && 
                                                element.textContent.includes('Leverage');
                        
                        if (hasTable || hasTabularContent || element.tagName === 'TABLE') {
                            foundElements.add(element);
                            
                            // Extract structured data if it's a table
                            let structuredData = null;
                            if (element.tagName === 'TABLE' || hasTable) {
                                const tableElement = element.tagName === 'TABLE' ? element : element.querySelector('table');
                                if (tableElement) {
                                    structuredData = {
                                        headers: Array.from(tableElement.querySelectorAll('th')).map(th => th.textContent.trim()),
                                        rows: Array.from(tableElement.querySelectorAll('tr')).map(tr => 
                                            Array.from(tr.querySelectorAll('td, th')).map(cell => cell.textContent.trim())
                                        ).filter(row => row.length > 0)
                                    };
                                }
                            }
                            
                            tables.push({
                                type: 'table',
                                id: element.id || `table-${tables.length}`,
                                className: element.className,
                                selector: selector,
                                innerHTML: element.innerHTML,
                                outerHTML: element.outerHTML,
                                textContent: element.textContent.trim(),
                                attributes: Array.from(element.attributes).reduce((acc, attr) => {
                                    acc[attr.name] = attr.value;
                                    return acc;
                                }, {}),
                                tagName: element.tagName,
                                structuredData: structuredData
                            });
                        }
                    });
                } catch (e) {
                    // Skip selectors that don't work
                }
            });
            
            return tables;
        });
        
        console.log(`Found ${tableDivs.length} table divs`);
        return tableDivs;
    }

    async extractDataSectionDivs() {
        console.log('Extracting data section divs...');
        
        const dataSectionDivs = await this.page.evaluate(() => {
            const sections = [];
            
            // Look for specific NFCI data sections
            const dataSelectors = [
                'div[class*="nfci"]',
                'div[id*="nfci"]',
                'div[class*="anfci"]',
                'div[id*="anfci"]',
                'div[class*="financial-conditions"]',
                'div[class*="index-data"]',
                'div[class*="current-data"]',
                'div[class*="download"]',
                '.download-center',
                // Look for divs containing specific NFCI text
                'div:contains("NFCI")',
                'div:contains("ANFCI")',
                'div:contains("Financial Conditions")'
            ];
            
            const foundElements = new Set();
            
            // Also look for divs containing key NFCI information
            const allDivs = document.querySelectorAll('div');
            allDivs.forEach(div => {
                const text = div.textContent.toLowerCase();
                const hasNFCIContent = text.includes('nfci') || 
                                     text.includes('anfci') || 
                                     text.includes('financial conditions index') ||
                                     text.includes('contributions to the') ||
                                     text.includes('risk indicators') ||
                                     text.includes('credit indicators') ||
                                     text.includes('leverage indicators');
                
                // Only include if it has substantial content and isn't too large (to avoid body/html)
                if (hasNFCIContent && 
                    div.textContent.trim().length > 100 && 
                    div.textContent.trim().length < 5000 &&
                    !foundElements.has(div)) {
                    
                    foundElements.add(div);
                    
                    sections.push({
                        type: 'data-section',
                        id: div.id || `data-section-${sections.length}`,
                        className: div.className,
                        innerHTML: div.innerHTML,
                        outerHTML: div.outerHTML,
                        textContent: div.textContent.trim(),
                        attributes: Array.from(div.attributes).reduce((acc, attr) => {
                            acc[attr.name] = attr.value;
                            return acc;
                        }, {}),
                        tagName: div.tagName
                    });
                }
            });
            
            return sections;
        });
        
        console.log(`Found ${dataSectionDivs.length} data section divs`);
        return dataSectionDivs;
    }

    async extractAllDivs() {
        const results = {
            timestamp: new Date().toISOString(),
            url: this.baseUrl,
            charts: [],
            tables: [],
            dataSections: []
        };
        
        try {
            await this.init();
            
            // Extract different types of divs
            results.charts = await this.extractChartDivs();
            results.tables = await this.extractTableDivs();
            results.dataSections = await this.extractDataSectionDivs();
            
            return results;
            
        } catch (error) {
            console.error('Error during extraction:', error);
            throw error;
        }
    }

    async saveToFiles(results) {
        console.log('Saving extracted HTML to files...');
        
        const outputDir = 'nfci_html_extracts';
        await fs.mkdir(outputDir, { recursive: true });
        
        // Save complete results as JSON
        await fs.writeFile(
            path.join(outputDir, 'complete_extraction.json'), 
            JSON.stringify(results, null, 2)
        );
        
        // Save individual chart HTML files
        for (let i = 0; i < results.charts.length; i++) {
            const chart = results.charts[i];
            await fs.writeFile(
                path.join(outputDir, `chart_${i}_${chart.id || 'unnamed'}.html`),
                this.createStandaloneHTML(chart.outerHTML, `Chart ${i}`)
            );
        }
        
        // Save individual table HTML files
        for (let i = 0; i < results.tables.length; i++) {
            const table = results.tables[i];
            await fs.writeFile(
                path.join(outputDir, `table_${i}_${table.id || 'unnamed'}.html`),
                this.createStandaloneHTML(table.outerHTML, `Table ${i}`)
            );
        }
        
        // Save individual data section HTML files
        for (let i = 0; i < results.dataSections.length; i++) {
            const section = results.dataSections[i];
            await fs.writeFile(
                path.join(outputDir, `section_${i}_${section.id || 'unnamed'}.html`),
                this.createStandaloneHTML(section.outerHTML, `Data Section ${i}`)
            );
        }
        
        // Create a summary HTML file
        await this.createSummaryHTML(results, outputDir);
        
        console.log(`All HTML files saved to ${outputDir} directory`);
    }

    createStandaloneHTML(content, title) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - NFCI Extract</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 100%; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
    }

    async createSummaryHTML(results, outputDir) {
        let summaryHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NFCI Extraction Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .section { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; }
        .element-preview { background: #f5f5f5; padding: 10px; margin: 10px 0; max-height: 200px; overflow-y: auto; }
        .metadata { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <h1>NFCI Data Extraction Summary</h1>
    <p>Extracted on: ${results.timestamp}</p>
    <p>Source: <a href="${results.url}">${results.url}</a></p>
    
    <h2>Charts Found: ${results.charts.length}</h2>`;
        
        results.charts.forEach((chart, i) => {
            summaryHTML += `
    <div class="section">
        <h3>Chart ${i} - ${chart.id}</h3>
        <div class="metadata">
            Class: ${chart.className}<br>
            Tag: ${chart.tagName}<br>
            Dimensions: ${chart.dimensions?.width}x${chart.dimensions?.height}
        </div>
        <div class="element-preview">${chart.innerHTML.substring(0, 500)}...</div>
    </div>`;
        });
        
        summaryHTML += `<h2>Tables Found: ${results.tables.length}</h2>`;
        
        results.tables.forEach((table, i) => {
            summaryHTML += `
    <div class="section">
        <h3>Table ${i} - ${table.id}</h3>
        <div class="metadata">
            Class: ${table.className}<br>
            Tag: ${table.tagName}
        </div>
        <div class="element-preview">${table.innerHTML.substring(0, 500)}...</div>
    </div>`;
        });
        
        summaryHTML += `<h2>Data Sections Found: ${results.dataSections.length}</h2>`;
        
        results.dataSections.forEach((section, i) => {
            summaryHTML += `
    <div class="section">
        <h3>Section ${i} - ${section.id}</h3>
        <div class="metadata">Class: ${section.className}</div>
        <div class="element-preview">${section.textContent.substring(0, 300)}...</div>
    </div>`;
        });
        
        summaryHTML += `</body></html>`;
        
        await fs.writeFile(path.join(outputDir, 'summary.html'), summaryHTML);
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
    const scraper = new NFCIHTMLScraper();
    
    try {
        console.log('Starting NFCI HTML extraction...');
        const results = await scraper.extractAllDivs();
        
        // Save all HTML content to files
        await scraper.saveToFiles(results);
        
        // Print summary
        console.log('\n=== EXTRACTION SUMMARY ===');
        console.log(`Charts extracted: ${results.charts.length}`);
        console.log(`Tables extracted: ${results.tables.length}`);
        console.log(`Data sections extracted: ${results.dataSections.length}`);
        console.log('\nFiles saved to nfci_html_extracts/ directory');
        console.log('- Individual HTML files for each chart/table/section');
        console.log('- complete_extraction.json with all data');
        console.log('- summary.html for quick overview');
        
    } catch (error) {
        console.error('Extraction failed:', error);
    } finally {
        await scraper.close();
    }
}

// Run the scraper
await main()

export default NFCIHTMLScraper;