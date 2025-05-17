
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Start MCP server as a child process
let mcpProcess;
let isServerHealthy = false;

function startMCPServer() {
  console.log('Starting MCP server...');
  
  mcpProcess = spawn('node', ['../perplexity-ask/dist/index.js'], {
    env: {
      ...process.env,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.log(`MCP stderr: ${data}`);
    // Look for server startup message
    if (data.toString().includes('MCP Server running')) {
      isServerHealthy = true;
      console.log('MCP server is healthy');
    }
  });
  
  mcpProcess.stdout.on('data', (data) => {
    console.log(`MCP stdout: ${data}`);
    // Also check stdout for server startup message
    if (data.toString().includes('MCP Server running')) {
      isServerHealthy = true;
      console.log('MCP server is healthy');
    }
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: isServerHealthy ? 'healthy' : 'unhealthy',
    message: isServerHealthy ? 'MCP server is running' : 'MCP server is not running or starting up',
    timestamp: new Date().toISOString(),
    tools: isServerHealthy ? 'available' : 'unavailable',
    version: '1.2.0'
  });
});

// Diagnostics endpoint for detailed system info
app.get('/api/diagnostics', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    
    res.json({
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
        }
      },
      mcp: {
        status: isServerHealthy ? 'running' : 'not running',
        pid: mcpProcess ? mcpProcess.pid : null
      },
      environment: {
        perplexityApiConfigured: !!process.env.PERPLEXITY_API_KEY,
        geminiApiConfigured: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (error) {
    console.error('Error in diagnostics endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Add a general error handler
app.use((err, req, res, next) => {
  console.error('Express error handler:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});


  // Handle MCP server process exit
  mcpProcess.on('exit', (code, signal) => {
    console.log(`MCP process exited with code ${code} and signal ${signal}`);
    isServerHealthy = false;
    // Restart server after a delay
    setTimeout(() => {
      startMCPServer();
    }, 5000);
  });
}

// Start the server initially
startMCPServer();

// Health check timeout handler
function setupRequestTimeout(callback, timeoutMs = 30000) {
  let timeoutId = setTimeout(() => {
    callback(new Error('Request timed out'));
  }, timeoutMs);
  
  return {
    clear: () => clearTimeout(timeoutId)
  };
}

// Queue for MCP requests and responses
let requestQueue = [];
let currentRequest = null;
let responseCallback = null;

// Process request from queue
function processNextRequest() {
  if (requestQueue.length > 0 && !currentRequest) {
    currentRequest = requestQueue.shift();
    
    // Check if server is healthy
    if (!isServerHealthy) {
      currentRequest.callback({
        error: {
          code: -32000,
          message: "MCP server is not available"
        }
      });
      currentRequest = null;
      // Try next request after delay
      setTimeout(processNextRequest, 1000);
      return;
    }
    
    // Send request to MCP server
    const requestStr = JSON.stringify(currentRequest.request) + '\n';
    mcpProcess.stdin.write(requestStr);
    
    // Set callback for response
    responseCallback = currentRequest.callback;
    
    // Setup timeout
    const timeout = setupRequestTimeout((error) => {
      console.error('Request timed out:', error);
      if (responseCallback) {
        responseCallback({
          error: {
            code: -32000,
            message: "Request timed out"
          }
        });
        
        // Clean up
        mcpProcess.stdout.removeListener('data', responseHandler);
        currentRequest = null;
        responseCallback = null;
        
        // Process next request
        processNextRequest();
      }
    });
    
    // Listen for response from MCP server
    const responseHandler = (data) => {
      try {
        timeout.clear();
        const response = JSON.parse(data.toString());
        responseCallback(response);
        currentRequest = null;
        responseCallback = null;
        mcpProcess.stdout.removeListener('data', responseHandler);
        
        // Process next request
        processNextRequest();
      } catch (error) {
        console.error('Error parsing MCP response:', error);
      }
    };
    
    mcpProcess.stdout.once('data', responseHandler);
  }
}

// API route to list available tools
app.get('/api/tools', (req, res) => {
  const listToolsRequest = {
    jsonrpc: "2.0",
    method: "listTools",
    params: {},
    id: Date.now().toString()
  };
  
  requestQueue.push({
    request: listToolsRequest,
    callback: (response) => {
      res.json(response.result);
    }
  });
  
  processNextRequest();
});

// API route to call a tool
app.post('/api/call-tool', (req, res) => {
  const { tool, arguments } = req.body;
  
  const callToolRequest = {
    jsonrpc: "2.0",
    method: "callTool",
    params: {
      name: tool,
      arguments: arguments
    },
    id: Date.now().toString()
  };
  
  requestQueue.push({
    request: callToolRequest,
    callback: (response) => {
      res.json(response.result);
    }
  });
  
  processNextRequest();
});

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Web UI server running on port ${PORT}`);
});

// Handle cleanup on server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MCP process...');
  mcpProcess.kill();
  process.exit();
});
