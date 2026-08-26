#!/usr/bin/env node
/**
 * Smart build script: skips TypeScript compilation if dist/ is already present
 * (e.g. on Hostinger where dist/ is committed to git).
 * Runs the full NestJS CLI build when dist/ is missing (local development).
 */
const fs = require('fs');
const { execSync } = require('child_process');

function createEntryBridges() {
  try {
    if (fs.existsSync('dist/src/main.js')) {
      fs.writeFileSync('dist/main.js', "require('./src/main.js');\n");
      fs.writeFileSync('dist/index.js', "require('./src/main.js');\n");
    }
    fs.writeFileSync('main.js', "require('./dist/src/main.js');\n");
    fs.writeFileSync('index.js', "require('./dist/src/main.js');\n");
    fs.writeFileSync('app.js', "require('./dist/src/main.js');\n");
  } catch (e) {
    // ignore
  }
}

if (fs.existsSync('dist/src/main.js')) {
  createEntryBridges();
  console.log('✓ Pre-built dist/ found — skipping TypeScript compilation');
  process.exit(0);
}

console.log('Building NestJS application...');
try {
  execSync('npx @nestjs/cli build', {
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=2048' },
    stdio: 'inherit',
  });
  createEntryBridges();
  console.log('✓ Build completed successfully');
  process.exit(0);
} catch (err) {
  console.error('✗ Build failed');
  process.exit(1);
}
