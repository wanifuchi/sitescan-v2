#!/usr/bin/env node

// SiteScan V2 Backend - Production Server Entry Point
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 SiteScan V2 Backend starting...');

// tsx を使用してTypeScript ファイルを実行
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');
const indexPath = path.join(__dirname, 'src', 'index.ts');

const child = spawn('node', [tsxPath, indexPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('error', (error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`🔚 Server process exited with code ${code}`);
  process.exit(code);
});