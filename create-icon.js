// Simple script to create a 1024x1024 PNG icon
const fs = require('fs');
const { createCanvas } = require('canvas');

// Check if canvas is available, if not, create minimal PNG
try {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  
  // Fill with gold color (#FFD700)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Add text "NA" for Nigerian Apartments
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 200px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NA', 512, 512);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('assets/icon.png', buffer);
  console.log('Icon created successfully!');
} catch (error) {
  console.error('Canvas not available, creating minimal PNG...');
  // Create a minimal valid PNG (1x1 pixel, then we'll need to resize)
  // For now, let's create a simple base64-encoded minimal PNG
  const minimalPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync('assets/icon.png', minimalPNG);
  console.log('Minimal icon created. Please replace with a proper 1024x1024 icon.');
}

