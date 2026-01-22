// Convert SVG to PNG for App Store icon
// Requires: npm install sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'assets', 'Suhw201.svg');
const pngPath = path.join(__dirname, 'assets', 'icon.png');

async function convertIcon() {
  try {
    console.log('Converting SVG to PNG...');
    console.log('Input:', svgPath);
    console.log('Output:', pngPath);
    
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Convert to PNG at 1024x1024
    await sharp(svgBuffer)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 215, b: 0, alpha: 1 } // Gold background #FFD700
      })
      .png()
      .toFile(pngPath);
    
    console.log('✅ Successfully converted icon to 1024x1024 PNG!');
    console.log('✅ Saved to:', pngPath);
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the icon looks correct');
    console.log('2. The icon is ready for App Store submission');
  } catch (error) {
    console.error('❌ Error converting icon:', error.message);
    console.error('');
    console.error('If you see "Cannot find module \'sharp\'", run:');
    console.error('  npm install sharp');
    process.exit(1);
  }
}

convertIcon();



