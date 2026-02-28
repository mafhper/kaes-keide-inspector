import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const zipFile = path.resolve('kaes-keid-inspector.zip');

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

try {
  console.log('Zipping dist/ folder...');
  if (process.platform === 'win32') {
    execSync(`powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path dist\\* -DestinationPath ${zipFile} -Force"`);
  } else {
    execSync(`cd dist && zip -r ../kaes-keid-inspector.zip *`);
  }
  console.log(`Successfully created kaes-keid-inspector.zip (${fs.statSync(zipFile).size} bytes)`);
} catch (error) {
  console.error('Failed to create zip:', error);
  process.exit(1);
}
