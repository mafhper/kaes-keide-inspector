// scripts/generate-icons.ts
// Generates PNG icons from the SVG logo for use in the Chrome extension manifest
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const SVG_PATH = resolve('./public/icon.svg');
const OUT_DIR = resolve('./public/icons');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const sizes = [16, 32, 48, 128];
const svgBuffer = readFileSync(SVG_PATH);

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(OUT_DIR, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

console.log('Done!');
