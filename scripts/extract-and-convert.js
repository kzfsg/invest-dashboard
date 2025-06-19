#!/usr/bin/env node

import { NFCIInteractiveExtractor } from '../screenshotScripts/nfci_interactive_extractor.js';
import { convertExtractedData } from '../src/utils/html-to-react-converter.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('🚀 Starting NFCI extraction and conversion process...\n');
    
    try {
        // Step 1: Extract data from NFCI website
        console.log('📊 Step 1: Extracting data from NFCI website...');
        const extractor = new NFCIInteractiveExtractor();
        const results = await extractor.extractAll();
        await extractor.saveResults(results);
        await extractor.close();
        
        console.log('✅ Extraction completed!\n');
        
        // Step 2: Convert to React components
        console.log('⚛️  Step 2: Converting to React components...');
        const extractionJsonPath = path.join(__dirname, '../nfci_interactive_extracts/interactive_extraction.json');
        const outputDir = path.join(__dirname, '../src/components/extracted');
        
        await convertExtractedData(extractionJsonPath, outputDir);
        
        console.log('✅ Conversion completed!\n');
        
        // Step 3: Show integration instructions
        console.log('📋 Integration Instructions:');
        console.log('1. Install required dependencies:');
        console.log('   npm install highcharts highcharts-react-official');
        console.log('');
        console.log('2. Import the generated components in your App.tsx:');
        console.log('   import { ComponentRegistry } from "./components/extracted";');
        console.log('');
        console.log('3. Check the integration-example.tsx file for complete usage examples');
        console.log('');
        console.log('4. The extracted CSS is available at:');
        console.log('   src/components/extracted/extracted-styles.css');
        console.log('');
        console.log('🎉 Process completed successfully!');
        
    } catch (error) {
        console.error('❌ Process failed:', error);
        process.exit(1);
    }
}

if (process.argv[1] && process.argv[1].endsWith('extract-and-convert.js')) {
    main().catch(error => {
        console.error('Error in main execution:', error);
        process.exit(1);
    });
}