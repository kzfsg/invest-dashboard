const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function interceptAPI() {
  console.log('Starting API interception...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });

  try {
    const page = await browser.newPage();
    
    const apiCalls = [];
    
    // Intercept network requests
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const url = request.url();
      console.log('Request:', url);
      
      // Look for API calls
      if (url.includes('api') || url.includes('data') || url.includes('chart')) {
        apiCalls.push({
          url: url,
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('🎯 Potential API call:', url);
      }
      
      request.continue();
    });

    page.on('response', async (response) => {
      const url = response.url();
      
      // Log API responses
      if (url.includes('api') || url.includes('data') || url.includes('chart')) {
        console.log('📡 API Response:', url, 'Status:', response.status());
        
        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('json')) {
            const data = await response.json();
            console.log('📊 API Data Preview:', JSON.stringify(data).substring(0, 200) + '...');
            
            // Save the API response
            const timestamp = Date.now();
            await fs.writeFile(`./api-response-${timestamp}.json`, JSON.stringify(data, null, 2));
            console.log(`💾 Saved API response to api-response-${timestamp}.json`);
          }
        } catch (error) {
          console.log('Could not parse response as JSON');
        }
      }
    });

    // Navigate to the chart
    console.log('Navigating to chart page...');
    await page.goto('https://en.macromicro.me/charts/45866/global-citi-surprise-index', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for API calls to complete
    console.log('Waiting for API calls...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Save all intercepted API calls
    await fs.writeFile('./api-calls.json', JSON.stringify(apiCalls, null, 2));
    console.log('💾 Saved all API calls to api-calls.json');

    console.log(`\n📈 Summary:`);
    console.log(`- Intercepted ${apiCalls.length} potential API calls`);
    console.log(`- Check api-calls.json for full details`);
    console.log(`- Check api-response-*.json files for data`);

    // Keep browser open for inspection
    console.log('\nBrowser staying open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

interceptAPI();