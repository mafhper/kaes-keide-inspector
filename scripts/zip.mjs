import { execFileSync } from 'child_process';
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
    execFileSync('powershell', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      "& { param([string]$Source, [string]$Destination) Compress-Archive -Path (Join-Path $Source '*') -DestinationPath $Destination -Force }",
      distDir,
      zipFile,
    ]);
  } else {
    execFileSync('zip', ['-r', zipFile, ...fs.readdirSync(distDir)], { cwd: distDir });
  }
  console.log(`Successfully created kaes-keid-inspector.zip (${fs.statSync(zipFile).size} bytes)`);
} catch (error) {
  console.error('Failed to create zip:', error);
  process.exit(1);
}
