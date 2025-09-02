import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

class NFCIInteractiveExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://www.chicagofed.org/research/data/nfci/current-data';
        this.outputDir = 'nfci_interactive_extracts';
    }

    async init() {
        console.log('Initializing browser...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid blocking
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate and wait for complete loading
        await this.page.goto(this.baseUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for Highcharts to initialize
        await this.page.waitForFunction(() => {
            return window.Highcharts && window.Highcharts.charts.length > 0;
        }, { timeout: 15000 }).catch(() => {
            console.log('Highcharts detection timeout - proceeding anyway');
        });
        
        console.log('Page loaded successfully');
    }

    async extractInteractiveCharts() {
        console.log('Extracting specific interactive charts...');
        
        // First, let's see what chart IDs are actually available
        const availableCharts = await this.page.evaluate(() => {
            const allChartIds = [];
            
            // Check Highcharts instances
            if (window.Highcharts && window.Highcharts.charts) {
                window.Highcharts.charts.forEach((chart, index) => {
                    if (chart && chart.renderTo) {
                        allChartIds.push(chart.renderTo.id);
                    }
                });
            }
            
            // Check all chart containers
            const chartContainers = document.querySelectorAll('[id*="highcharts"], [class*="highcharts"], [id*="chart"], [class*="chart"]');
            chartContainers.forEach((container) => {
                if (container.id && container.offsetWidth > 100 && container.offsetHeight > 100) {
                    allChartIds.push(container.id);
                }
            });
            
            return [...new Set(allChartIds)]; // Remove duplicates
        });
        
        console.log('Available chart IDs:', availableCharts);
        
        // Define the target chart patterns (the middle part changes, but endings are consistent)
        const targetChartPatterns = [
            /-4$/,    // matches highcharts-*-4
            /-12$/,   // matches highcharts-*-12
            /-20$/,   // matches highcharts-*-20
            /-44$/,   // matches highcharts-*-44 (appears to be the new pattern)
            /-137$/   // matches highcharts-*-137
        ];
        
        const charts = await this.page.evaluate((targetPatterns) => {
            const chartData = [];
            
            // Find all Highcharts instances
            if (window.Highcharts && window.Highcharts.charts) {
                window.Highcharts.charts.forEach((chart, index) => {
                    if (chart && chart.renderTo) {
                        const container = chart.renderTo;
                        const containerId = container.id;
                        
                        // Only extract if this is one of our target charts
                        const isTargetChart = targetPatterns.some(pattern => 
                            new RegExp(pattern.source).test(containerId)
                        );
                        
                        if (isTargetChart) {
                            // Extract chart configuration
                            const chartConfig = {
                                options: chart.options,
                                series: chart.series.map(series => ({
                                    name: series.name,
                                    data: series.data.map(point => ({
                                        x: point.x,
                                        y: point.y,
                                        category: point.category,
                                        name: point.name
                                    })),
                                    type: series.type,
                                    color: series.color,
                                    visible: series.visible
                                })),
                                xAxis: chart.xAxis.map(axis => ({
                                    categories: axis.categories,
                                    type: axis.type,
                                    title: axis.options.title
                                })),
                                yAxis: chart.yAxis.map(axis => ({
                                    title: axis.options.title,
                                    min: axis.min,
                                    max: axis.max
                                }))
                            };
                            
                            chartData.push({
                                id: containerId,
                                index: index,
                                type: 'highcharts',
                                config: chartConfig,
                                containerHTML: container.outerHTML,
                                chartHTML: container.innerHTML,
                                className: container.className,
                                dimensions: {
                                    width: container.offsetWidth,
                                    height: container.offsetHeight
                                }
                            });
                        }
                    }
                });
            }
            
            // Also look for specific chart containers
            const chartContainers = document.querySelectorAll('[id*="highcharts"], [class*="highcharts"], [id*="chart"], [class*="chart"]');
            chartContainers.forEach((container, index) => {
                if (container.offsetWidth > 100 && container.offsetHeight > 100) {
                    const containerId = container.id || `chart-container-${index}`;
                    
                    // Only extract if this is one of our target charts
                    const isTargetChart = targetPatterns.some(pattern => 
                        new RegExp(pattern.source).test(containerId)
                    );
                    
                    // Check if already captured and is target chart
                    const alreadyCaptured = chartData.some(chart => chart.id === containerId);
                    if (!alreadyCaptured && isTargetChart) {
                        chartData.push({
                            id: containerId,
                            index: index,
                            type: 'container',
                            containerHTML: container.outerHTML,
                            chartHTML: container.innerHTML,
                            className: container.className,
                            dimensions: {
                                width: container.offsetWidth,
                                height: container.offsetHeight
                            }
                        });
                    }
                }
            });
            
            return chartData;
        }, targetChartPatterns);
        
        console.log(`Extracted ${charts.length} specific interactive charts`);
        return charts;
    }

    async extractTables() {
        console.log('Skipping table extraction - only extracting specified charts');
        return [];
    }

    async extractStyles() {
        console.log('Extracting relevant CSS styles...');
        
        const styles = await this.page.evaluate(() => {
            const relevantStyles = [];
            
            // Get all stylesheets
            const stylesheets = Array.from(document.styleSheets);
            
            stylesheets.forEach(stylesheet => {
                try {
                    const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
                    rules.forEach(rule => {
                        if (rule.selectorText && (
                            rule.selectorText.includes('highcharts') ||
                            rule.selectorText.includes('chart') ||
                            rule.selectorText.includes('table') ||
                            rule.selectorText.includes('nfci') ||
                            rule.selectorText.includes('anfci')
                        )) {
                            relevantStyles.push({
                                selector: rule.selectorText,
                                cssText: rule.cssText,
                                style: rule.style ? rule.style.cssText : ''
                            });
                        }
                    });
                } catch (e) {
                    // Skip stylesheets that can't be accessed (CORS)
                }
            });
            
            return relevantStyles;
        });
        
        console.log(`Extracted ${styles.length} relevant CSS rules`);
        return styles;
    }

    async extractScripts() {
        console.log('Extracting JavaScript dependencies...');
        
        const scripts = await this.page.evaluate(() => {
            const scriptData = [];
            
            // Get all script tags
            const scripts = document.querySelectorAll('script');
            scripts.forEach((script, index) => {
                if (script.src) {
                    scriptData.push({
                        type: 'external',
                        src: script.src,
                        async: script.async,
                        defer: script.defer
                    });
                } else if (script.textContent && (
                    script.textContent.includes('Highcharts') ||
                    script.textContent.includes('chart') ||
                    script.textContent.includes('NFCI') ||
                    script.textContent.includes('ANFCI')
                )) {
                    scriptData.push({
                        type: 'inline',
                        content: script.textContent,
                        id: script.id
                    });
                }
            });
            
            // Check for global variables
            const globalVars = {};
            if (window.Highcharts) {
                globalVars.Highcharts = {
                    version: window.Highcharts.version,
                    chartsCount: window.Highcharts.charts ? window.Highcharts.charts.length : 0
                };
            }
            
            return {
                scripts: scriptData,
                globalVars: globalVars
            };
        });
        
        console.log(`Extracted ${scripts.scripts.length} relevant scripts`);
        return scripts;
    }

    async extractAll() {
        const results = {
            timestamp: new Date().toISOString(),
            url: this.baseUrl,
            charts: [],
            tables: [],
            styles: [],
            scripts: {}
        };
        
        try {
            await this.init();
            
            // Extract all components
            results.charts = await this.extractInteractiveCharts();
            results.tables = await this.extractTables();
            results.styles = await this.extractStyles();
            results.scripts = await this.extractScripts();
            
            return results;
            
        } catch (error) {
            console.error('Error during extraction:', error);
            throw error;
        }
    }

    async saveResults(results) {
        console.log('Saving extracted data...');
        
        // Create output directory
        await fs.mkdir(this.outputDir, { recursive: true });
        
        // Save complete results as JSON
        await fs.writeFile(
            path.join(this.outputDir, 'interactive_extraction.json'),
            JSON.stringify(results, null, 2)
        );
        
        // Save individual chart configs
        for (let i = 0; i < results.charts.length; i++) {
            const chart = results.charts[i];
            if (chart.config) {
                await fs.writeFile(
                    path.join(this.outputDir, `chart_${i}_config.json`),
                    JSON.stringify(chart.config, null, 2)
                );
            }
        }
        
        // Save chart HTML components
        for (let i = 0; i < results.charts.length; i++) {
            const chart = results.charts[i];
            const componentContent = this.generateReactComponent(chart, 'Chart');
            await fs.writeFile(
                path.join(this.outputDir, `Chart${i}.tsx`),
                componentContent
            );
        }
        
        // Save table HTML components
        for (let i = 0; i < results.tables.length; i++) {
            const table = results.tables[i];
            const componentContent = this.generateReactComponent(table, 'Table');
            await fs.writeFile(
                path.join(this.outputDir, `Table${i}.tsx`),
                componentContent
            );
        }
        
        // Save CSS file
        const cssContent = results.styles.map(style => style.cssText).join('\n');
        await fs.writeFile(
            path.join(this.outputDir, 'extracted_styles.css'),
            cssContent
        );
        
        console.log(`All files saved to ${this.outputDir} directory`);
    }

    generateReactComponent(element, type) {
        const componentName = `${type}${element.index}`;
        
        if (type === 'Chart' && element.config) {
            return `import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chartConfig = ${JSON.stringify(element.config, null, 6)};
      
      Highcharts.chart(chartRef.current, chartConfig);
    }
  }, []);

  return (
    <div 
      ref={chartRef}
      id="${element.id}"
      className={\`${element.className} \${className || ''}\`}
      style={{ width: '${element.dimensions?.width}px', height: '${element.dimensions?.height}px' }}
    />
  );
};

export default ${componentName};`;
        } else {
            return `import React from 'react';

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
    <div 
      id="${element.id}"
      className={\`${element.className} \${className || ''}\`}
      dangerouslySetInnerHTML={{ __html: \`${element.innerHTML?.replace(/`/g, '\\`') || element.chartHTML?.replace(/`/g, '\\`') || ''}\` }}
    />
  );
};

export default ${componentName};`;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }
}

// Main execution function
async function main() {
    const extractor = new NFCIInteractiveExtractor();
    
    try {
        console.log('Starting NFCI interactive extraction...');
        const results = await extractor.extractAll();
        
        // Save all extracted data
        await extractor.saveResults(results);
        
        // Print summary
        console.log('\n=== EXTRACTION SUMMARY ===');
        console.log(`Interactive charts extracted: ${results.charts.length}`);
        console.log(`Tables extracted: ${results.tables.length}`);
        console.log(`CSS rules extracted: ${results.styles.length}`);
        console.log(`Scripts found: ${results.scripts.scripts.length}`);
        console.log('\nGenerated files:');
        console.log('- interactive_extraction.json (complete data)');
        console.log('- Chart*.tsx components (ready for React)');
        console.log('- Table*.tsx components (ready for React)');
        console.log('- extracted_styles.css (styling)');
        console.log('- chart_*_config.json (Highcharts configurations)');
        
    } catch (error) {
        console.error('Extraction failed:', error);
    } finally {
        await extractor.close();
    }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('nfci_interactive_extractor.js')) {
    main().catch(error => {
        console.error('Error in main execution:', error);
        process.exit(1);
    });
}

export { NFCIInteractiveExtractor, main };