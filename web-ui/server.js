
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
const mcpProcess = spawn('node', ['../perplexity-ask/dist/index.js'], {
  env: {
    ...process.env,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.log(`MCP stderr: ${data}`);
});

// Handle MCP server process exit
mcpProcess.on('exit', (code, signal) => {
  console.log(`MCP process exited with code ${code} and signal ${signal}`);
});

// Queue for MCP requests and responses
let requestQueue = [];
let currentRequest = null;
let responseCallback = null;

// Process request from queue
function processNextRequest() {
  if (requestQueue.length > 0 && !currentRequest) {
    currentRequest = requestQueue.shift();
    
    // Send request to MCP server
    const requestStr = JSON.stringify(currentRequest.request) + '\n';
    mcpProcess.stdin.write(requestStr);
    
    // Set callback for response
    responseCallback = currentRequest.callback;
    
    // Listen for response from MCP server
    const responseHandler = (data) => {
      try {
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
