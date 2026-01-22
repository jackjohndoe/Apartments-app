// Convert SVG to PNG using sharp
// Run: npm install sharp
// Then: node convert-icon-sharp.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'assets', 'Suhw201.svg');
const outputPath = path.join(__dirname, 'assets', 'icon.png');

async function convertIcon() {
  try {
    console.log('🔄 Converting Suhw201.svg to icon.png...');
    
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error('❌ Error: Suhw201.svg not found at:', svgPath);
      process.exit(1);
    }

    // Convert SVG to PNG
    await sharp(svgPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .png()
      .toFile(outputPath);

    console.log('✅ Success! Icon converted to:', outputPath);
    console.log('📐 Size: 1024x1024px');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test icon: npx expo start');
    console.log('2. Build app: eas build --platform ios');
    
  } catch (error) {
    console.error('❌ Error converting icon:', error.message);
    console.log('');
    console.log('💡 Alternative: Use online converter:');
    console.log('   https://cloudconvert.com/svg-to-png');
    process.exit(1);
  }
}

convertIcon();



