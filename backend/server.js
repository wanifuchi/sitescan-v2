#!/usr/bin/env node

// SiteScan V2 Backend - Production Server Entry Point
require('dotenv').config();
require('tsx/cjs').register();

// TypeScript source をロード
require('./src/index.ts');