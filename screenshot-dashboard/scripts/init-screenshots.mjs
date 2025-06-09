import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the screenshots directory if it doesn't exist
const screenshotsDir = join(__dirname, '..', 'public', 'currentScreenshots', 'default');
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

// Create some sample screenshot files
const sampleScreenshots = [
  { name: 'dashboard.png', size: 1024 * 512 },
  { name: 'analytics.png', size: 1024 * 768 },
  { name: 'settings.png', size: 800 * 600 },
  { name: 'profile.png', size: 1024 * 768 },
  { name: 'notifications.png', size: 800 * 600 },
  { name: 'reports.png', size: 1024 * 1024 },
];

sampleScreenshots.forEach((screenshot, index) => {
  const filePath = join(screenshotsDir, screenshot.name);
  
  // Create a simple SVG as a placeholder for the screenshot
  const svgContent = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <rect x="10%" y="10%" width="80%" height="20%" fill="#3b82f6" rx="5"/>
      <rect x="10%" y="40%" width="80%" height="40%" fill="#ffffff" rx="5" stroke="#d1d5db" stroke-width="1"/>
      <text x="50%" y="25%" font-family="Arial" font-size="24" text-anchor="middle" fill="#ffffff">${screenshot.name}</text>
      <text x="50%" y="65%" font-family="Arial" font-size="16" text-anchor="middle" fill="#6b7280">Sample Screenshot ${index + 1}</text>
      <text x="50%" y="75%" font-family="Arial" font-size="14" text-anchor="middle" fill="#9ca3af">${new Date().toLocaleString()}</text>
    </svg>
  `;
  
  writeFileSync(filePath, svgContent.trim());
  console.log(`Created sample screenshot: ${filePath}`);
});

console.log('Sample screenshots created successfully!');
