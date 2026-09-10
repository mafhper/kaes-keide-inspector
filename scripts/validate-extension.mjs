#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { exit } from 'node:process';

const zipPath = process.argv[2];

if (!zipPath) {
  console.error('Usage: node scripts/validate-extension.mjs <path-to-zip>');
  exit(1);
}

let failed = false;

function run(label, cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  PASS  ${label}`);
  } catch {
    console.error(`  FAIL  ${label}`);
    failed = true;
  }
}

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    console.error(`  FAIL  ${label}`);
    failed = true;
  }
}

console.log(`\nValidating extension ZIP: ${zipPath}\n`);

// 1. ZIP integrity
run('ZIP integrity (unzip -t)', `unzip -t "${zipPath}"`);

// 2. manifest.json exists at root
run('manifest.json exists at root', `unzip -l "${zipPath}" | grep -qx 'manifest.json'`);

// 3. No node_modules/ in ZIP
run('No node_modules/ in ZIP', `! unzip -l "${zipPath}" | grep -q 'node_modules/'`);

// 4. No .git/ in ZIP
run('No .git/ in ZIP', `! unzip -l "${zipPath}" | grep -q '\\.git/'`);

// 5. No source maps in ZIP
run('No .map files in ZIP', `! unzip -l "${zipPath}" | grep -q '\\.map$'`);

// 6. Extract manifest.json and validate JSON structure
let manifest;
try {
  const raw = execSync(`unzip -p "${zipPath}" manifest.json`, { stdio: 'pipe' }).toString();
  manifest = JSON.parse(raw);
  console.log(`  PASS  manifest.json is valid JSON`);
} catch {
  console.error(`  FAIL  manifest.json is valid JSON`);
  failed = true;
}

if (manifest) {
  // 7. manifest_version === 3
  check('manifest_version === 3', manifest.manifest_version === 3);

  // 8. version field exists
  check('version field exists', typeof manifest.version === 'string' && manifest.version.length > 0);

  // 9. name field exists
  check('name field exists', typeof manifest.name === 'string' && manifest.name.length > 0);

  // 10. icons exist
  check('icons object exists', manifest.icons && typeof manifest.icons === 'object');

  // 11. background/service_worker exists
  const hasBackground = manifest.background && (
    manifest.background.service_worker || manifest.background.scripts
  );
  check('background/service_worker exists', !!hasBackground);

  // 12. side_panel.default_path exists (if side_panel is declared)
  if (manifest.side_panel) {
    check('side_panel.default_path exists', !!manifest.side_panel.default_path);
  }

  // 13. Verify referenced files exist in ZIP
  if (manifest.icons) {
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      run(`Icon ${size} (${iconPath}) exists`, `unzip -l "${zipPath}" | grep -qx '${iconPath}'`);
    }
  }

  if (manifest.background?.service_worker) {
    const sw = manifest.background.service_worker;
    run(`Service worker (${sw}) exists`, `unzip -l "${zipPath}" | grep -qx '${sw}'`);
  }
}

console.log('');

if (failed) {
  console.error('Extension validation FAILED.');
  exit(1);
} else {
  console.log('Extension validation PASSED.');
}
