const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple icon with gradient background and text
async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">A</text>
    </svg>
  `;

  const iconPath = path.join(__dirname, '..', 'public', `icon-${size}x${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(iconPath);

  console.log(`✅ Generated ${iconPath}`);
}

// Generate favicon.ico
async function generateFavicon() {
  const svg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#grad)"/>
      <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">A</text>
    </svg>
  `;

  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .toFile(faviconPath.replace('.ico', '.png'));

  console.log(`✅ Generated favicon`);
}

// Generate apple-touch-icon
async function generateAppleIcon() {
  const svg = `
    <svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="40" fill="url(#grad)"/>
      <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="75" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">A</text>
    </svg>
  `;

  const applePath = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(applePath);

  console.log(`✅ Generated apple-touch-icon`);
}

// Generate placeholder screenshots
async function generateScreenshots() {
  const screenshots = [
    { name: 'screenshot-1.png', title: 'Home Feed' },
    { name: 'screenshot-2.png', title: 'User Profile' }
  ];

  for (const screenshot of screenshots) {
    const svg = `
      <svg width="540" height="960" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="540" height="960" fill="url(#bg)"/>
        <rect x="20" y="20" width="500" height="80" rx="10" fill="#1e293b"/>
        <text x="270" y="70" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#0ea5e9" text-anchor="middle">Auth App</text>
        <rect x="20" y="120" width="500" height="200" rx="10" fill="#334155"/>
        <text x="270" y="230" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${screenshot.title}</text>
        <rect x="20" y="340" width="500" height="150" rx="10" fill="#334155"/>
        <rect x="20" y="510" width="500" height="150" rx="10" fill="#334155"/>
        <rect x="20" y="680" width="500" height="150" rx="10" fill="#334155"/>
      </svg>
    `;

    const screenshotPath = path.join(__dirname, '..', 'public', screenshot.name);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(screenshotPath);

    console.log(`✅ Generated ${screenshot.name}`);
  }
}

// Main function
async function main() {
  console.log('🎨 Generating PWA icons...\n');

  try {
    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    await fs.mkdir(publicDir, { recursive: true });

    // Generate all icons
    for (const size of sizes) {
      await generateIcon(size);
    }

    // Generate favicon
    await generateFavicon();

    // Generate apple-touch-icon
    await generateAppleIcon();

    // Generate screenshots
    await generateScreenshots();

    console.log('\n✨ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();
