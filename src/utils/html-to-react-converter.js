import { promises as fs } from 'fs';
import path from 'path';

export class HTMLToReactConverter {
  constructor(outputDir = './src/components/extracted') {
    this.outputDir = outputDir;
    this.extractionData = null;
  }

  async loadExtractionData(jsonPath) {
    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      this.extractionData = JSON.parse(jsonContent);
      console.log('Extraction data loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load extraction data: ${error}`);
    }
  }

  sanitizeHTML(html) {
    // Escape backticks and handle JSX issues
    return html
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${')
      .replace(/class=/g, 'className=')
      .replace(/for=/g, 'htmlFor=');
  }

  generateHighchartsComponent(chart) {
    const componentName = this.generateComponentName(chart.id, 'Chart');
    
    if (!chart.config) {
      throw new Error(`Chart ${chart.id} has no configuration data`);
    }

    return `import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const ${componentName} = ({ 
  className = '', 
  style = {} 
}) => {
  const chartOptions = React.useMemo(() => ({
    ${this.formatChartConfig(chart.config)}
  }), []);

  const containerStyle = {
    width: '${chart.dimensions.width}px',
    height: '${chart.dimensions.height}px',
    ...style
  };

  return (
    <div 
      id="${chart.id}"
      className={\`${chart.className} \${className}\`}
      style={containerStyle}
    >
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        containerProps={{ 
          id: '${chart.id}-container',
          style: { width: '100%', height: '100%' }
        }}
      />
    </div>
  );
};

export default ${componentName};`;
  }

  generateTableComponent(table) {
    const componentName = this.generateComponentName(table.id, 'Table');
    
    return `import React from 'react';

const ${componentName} = ({ 
  className = '', 
  style = {} 
}) => {
  const tableData = {
    headers: ${JSON.stringify(table.headers, null, 4)},
    rows: ${JSON.stringify(table.rows, null, 4)}
  };

  return (
    <div 
      id="${table.id}"
      className={\`${table.className} \${className}\`}
      style={style}
    >
      <table className="nfci-data-table">
        {tableData.headers.length > 0 && (
          <thead>
            <tr>
              {tableData.headers.map((header, index) => (
                <th 
                  key={index}
                  className={header.className}
                  {...header.attributes}
                >
                  {header.text}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={row.className}>
              {row.cells.map((cell, cellIndex) => (
                <td 
                  key={cellIndex}
                  className={cell.className}
                  {...cell.attributes}
                  dangerouslySetInnerHTML={{ __html: cell.html }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ${componentName};`;
  }

  generateFallbackComponent(element, type) {
    const componentName = this.generateComponentName(element.id, type);
    const html = element.chartHTML || element.innerHTML;
    
    return `import React from 'react';

const ${componentName} = ({ 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      id="${element.id}"
      className={\`${element.className} \${className}\`}
      style={style}
      dangerouslySetInnerHTML={{ 
        __html: \`${this.sanitizeHTML(html)}\` 
      }}
    />
  );
};

export default ${componentName};`;
  }

  formatChartConfig(config) {
    // Format the chart configuration for readable React code
    const configStr = JSON.stringify(config, null, 6);
    return configStr
      .slice(1, -1) // Remove outer braces
      .replace(/^      /gm, '    ') // Adjust indentation
      .replace(/"/g, "'"); // Use single quotes for consistency
  }

  generateComponentName(id, prefix) {
    // Convert ID to PascalCase component name
    const cleanId = id
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const parts = cleanId.split('_');
    const pascalCase = parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
    
    return `${prefix}${pascalCase}`;
  }

  async generateComponents() {
    if (!this.extractionData) {
      throw new Error('No extraction data loaded. Call loadExtractionData() first.');
    }

    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });

    const components = [];

    // Generate chart components
    for (const chart of this.extractionData.charts) {
      try {
        const componentName = this.generateComponentName(chart.id, 'Chart');
        let componentContent;

        if (chart.config && chart.type === 'highcharts') {
          componentContent = this.generateHighchartsComponent(chart);
        } else {
          componentContent = this.generateFallbackComponent(chart, 'Chart');
        }

        const filePath = path.join(this.outputDir, `${componentName}.jsx`);
        await fs.writeFile(filePath, componentContent);
        
        components.push({ name: componentName, path: filePath });
        console.log(`Generated chart component: ${componentName}`);
      } catch (error) {
        console.error(`Failed to generate chart component for ${chart.id}:`, error);
      }
    }

    // Generate table components
    for (const table of this.extractionData.tables) {
      try {
        const componentName = this.generateComponentName(table.id, 'Table');
        let componentContent;

        if (table.headers && table.rows) {
          componentContent = this.generateTableComponent(table);
        } else {
          componentContent = this.generateFallbackComponent(table, 'Table');
        }

        const filePath = path.join(this.outputDir, `${componentName}.jsx`);
        await fs.writeFile(filePath, componentContent);
        
        components.push({ name: componentName, path: filePath });
        console.log(`Generated table component: ${componentName}`);
      } catch (error) {
        console.error(`Failed to generate table component for ${table.id}:`, error);
      }
    }

    // Generate index file for easy imports
    await this.generateIndexFile(components);

    // Generate CSS file
    await this.generateCSSFile();

    console.log(`\nGenerated ${components.length} React components in ${this.outputDir}`);
  }

  async generateIndexFile(components) {
    const indexContent = `// Auto-generated index file for extracted NFCI components
// Generated on: ${new Date().toISOString()}

${components.map(comp => `export { default as ${comp.name} } from './${comp.name}';`).join('\n')}

// Component registry for dynamic loading
export const ComponentRegistry = {
${components.map(comp => `  ${comp.name}: () => import('./${comp.name}'),`).join('\n')}
};

// Component metadata
export const ComponentMetadata = {
${components.map(comp => {
  const isChart = comp.name.startsWith('Chart');
  return `  ${comp.name}: { type: '${isChart ? 'chart' : 'table'}', component: '${comp.name}' },`;
}).join('\n')}
};`;

    await fs.writeFile(path.join(this.outputDir, 'index.js'), indexContent);
  }

  async generateCSSFile() {
    if (!this.extractionData?.styles) return;

    const cssContent = `/* Auto-generated CSS from NFCI extraction */
/* Generated on: ${new Date().toISOString()} */

${this.extractionData.styles.map(style => style.cssText).join('\n\n')}

/* Additional styling for extracted components */
.nfci-data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: inherit;
}

.nfci-data-table th,
.nfci-data-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #ddd;
}

.nfci-data-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.nfci-data-table tr:hover {
  background-color: #f9f9f9;
}`;

    await fs.writeFile(path.join(this.outputDir, 'extracted-styles.css'), cssContent);
  }

  async generateAppIntegration() {
    if (!this.extractionData) {
      throw new Error('No extraction data loaded');
    }

    const chartComponents = this.extractionData.charts.map(chart => 
      this.generateComponentName(chart.id, 'Chart')
    );
    
    const tableComponents = this.extractionData.tables.map(table => 
      this.generateComponentName(table.id, 'Table')
    );

    return `// Integration code for App.jsx
import React from 'react';
${chartComponents.map(name => `import ${name} from './components/extracted/${name}';`).join('\n')}
${tableComponents.map(name => `import ${name} from './components/extracted/${name}';`).join('\n')}
import './components/extracted/extracted-styles.css';

// Add this to your App component:
const NFCIDataSection = () => {
  return (
    <div className="nfci-data-section">
      <h2>NFCI Interactive Charts</h2>
      <div className="charts-container">
        ${chartComponents.map(name => `<${name} className="chart-wrapper" />`).join('\n        ')}
      </div>
      
      <h2>NFCI Data Tables</h2>
      <div className="tables-container">
        ${tableComponents.map(name => `<${name} className="table-wrapper" />`).join('\n        ')}
      </div>
    </div>
  );
};

export default NFCIDataSection;`;
  }
}

// Utility function to run the converter
export async function convertExtractedData(jsonPath, outputDir) {
  const converter = new HTMLToReactConverter(outputDir);
  await converter.loadExtractionData(jsonPath);
  await converter.generateComponents();
  
  const integrationCode = await converter.generateAppIntegration();
  await fs.writeFile(
    path.join(outputDir || './src/components/extracted', 'integration-example.jsx'),
    integrationCode
  );
  
  console.log('Conversion completed! Check the integration-example.jsx file for usage instructions.');
}