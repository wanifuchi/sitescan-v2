#!/usr/bin/env node

// 超シンプルなヘルスチェック用サーバー
const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting simple health check server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);

// 利用可能な環境変数をデバッグ
console.log('📊 Environment Variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB')) {
    console.log(`  ${key}: ${process.env[key] ? '✅ exists' : '❌ not set'}`);
  }
});

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  const response = {
    success: true,
    message: 'SiteScan V2 Simple Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'unknown',
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /env-debug'
    ]
  };
  
  if (req.url === '/env-debug') {
    response.environmentVariables = {
      hasDatabase: !!(process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL),
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    };
  }
  
  res.end(JSON.stringify(response, null, 2));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Environment debug: http://localhost:${PORT}/env-debug`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});