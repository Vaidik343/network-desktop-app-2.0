const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data paths
const MOCK_DATA_PATH = path.join(__dirname, 'testData');

// Login endpoint
app.post('/action/login', (req, res) => {
  const { username, password } = req.query;
  
  // Simple authentication mock
  if (username === 'admin' && password === 'admin') {
    res.json({
      wait: 1,
      code: 1,
      name: 'admin'
    });
  } else {
    res.status(401).json({
      error: 'Authentication failed',
      code: 0
    });
  }
});

// System info endpoint
app.get('/cgi-bin/infos.cgi', (req, res) => {
  const { oper, param } = req.query;
  
  if (oper === 'query') {
    switch (param) {
      case 'version':
        res.json({
          version: '2.0.1.12',
          build_date: '2023-10-15',
          hardware: 'Dasscom IP Phone v2'
        });
        break;
      case 'svn_version':
        res.json({
          svn_version: 'r12345',
          revision: 12345
        });
        break;
      case 'ipaddr':
        res.json({
          ip_address: '192.168.1.100',
          subnet_mask: '255.255.255.0',
          gateway: '192.168.1.1'
        });
        break;
      case 'account_infos':
        res.json({
          accounts: [
            {
              id: 1,
              username: 'admin',
              role: 'administrator',
              status: 'active'
            },
            {
              id: 2,
              username: 'user',
              role: 'user',
              status: 'active'
            }
          ]
        });
        break;
      default:
        res.status(404).json({ error: 'Parameter not found' });
    }
  } else {
    res.status(400).json({ error: 'Invalid operation' });
  }
});

// Extensions endpoint
app.get('/pbx/extension-digital/search-extension', (req, res) => {
  // Check authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  res.json({
    extensions: [
      {
        id: 1001,
        number: '1001',
        name: 'John Doe',
        status: 'registered',
        ip_address: '192.168.1.101'
      },
      {
        id: 1002,
        number: '1002',
        name: 'Jane Smith',
        status: 'registered',
        ip_address: '192.168.1.102'
      },
      {
        id: 1003,
        number: '1003',
        name: 'Bob Johnson',
        status: 'unregistered',
        ip_address: '192.168.1.103'
      }
    ],
    total: 3
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'mock-dasscom-server' });
});

// Error simulation endpoint for testing
app.get('/simulate-error/:type', (req, res) => {
  const { type } = req.params;
  
  switch (type) {
    case 'timeout':
      // Don't respond to simulate timeout
      break;
    case 'server-error':
      res.status(500).json({ error: 'Internal server error' });
      break;
    case 'not-found':
      res.status(404).json({ error: 'Not found' });
      break;
    default:
      res.status(400).json({ error: 'Unknown error type' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock Dasscom Server running on http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /action/login?username=admin&password=admin');
  console.log('  GET  /cgi-bin/infos.cgi?oper=query&param=version');
  console.log('  GET  /cgi-bin/infos.cgi?oper=query&param=svn_version');
  console.log('  GET  /cgi-bin/infos.cgi?oper=query&param=ipaddr');
  console.log('  GET  /cgi-bin/infos.cgi?oper=query&param=account_infos');
  console.log('  GET  /pbx/extension-digital/search-extension (requires auth)');
  console.log('  GET  /health');
  console.log('  GET  /simulate-error/:type (timeout|server-error|not-found)');
});

module.exports = app;
