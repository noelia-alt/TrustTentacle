// Script para crear iconos PNG temporales
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

// Asegurar que existe la carpeta icons
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG del pulpo
const createSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.2}"/>
  <text x="${size/2}" y="${size * 0.7}" text-anchor="middle" fill="white" font-size="${size * 0.6}" font-family="Arial">🐙</text>
</svg>`;

// Crear un SVG para cada tamaño
sizes.forEach(size => {
  const svg = createSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Created icon-${size}.svg`);
});

console.log('\n🐙 Iconos SVG creados! Para producción, convierte a PNG con una herramienta online.');
console.log('📌 Puedes usar: https://cloudconvert.com/svg-to-png\n');
