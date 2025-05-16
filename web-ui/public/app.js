
// React and its hooks
const { useState, useEffect, useRef } = React;

// Icons for the UI
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3"></path>
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

const TestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

// Main App Component
const App = () => {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState('');
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [customFunctions, setCustomFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [savedHistory, setSavedHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch available tools when component mounts
  useEffect(() => {
    fetchTools();
    loadSavedHistory();
    
    // Setup modal event handlers
    const functionModal = document.getElementById('function-modal');
    const historyModal = document.getElementById('history-modal');
    const testModal = document.getElementById('tool-test-modal');
    const navigationModal = document.getElementById('navigation-modal');
    
    const functionClose = document.getElementsByClassName('close')[0];
    const historyClose = document.getElementsByClassName('history-close')[0];
    const testClose = document.getElementsByClassName('test-close')[0];
    const navClose = document.getElementsByClassName('nav-close')[0];
    
    const functionForm = document.getElementById('function-form');
    
    // Add menu button to the DOM
    const menuButton = document.createElement('button');
    menuButton.className = 'menu-button';
    menuButton.innerHTML = '☰';
    menuButton.onclick = () => {
      navigationModal.style.display = 'block';
    };
    document.body.appendChild(menuButton);
    
    // Setup navigation menu buttons
    document.getElementById('main-interface-btn')?.addEventListener('click', () => {
      navigationModal.style.display = 'none';
      functionModal.style.display = 'none';
      historyModal.style.display = 'none';
      testModal.style.display = 'none';
    });
    
    document.getElementById('function-editor-btn')?.addEventListener('click', () => {
      navigationModal.style.display = 'none';
      functionModal.style.display = 'block';
    });
    
    document.getElementById('history-btn')?.addEventListener('click', () => {
      navigationModal.style.display = 'none';
      openHistoryModal();
    });
    
    document.getElementById('tool-test-btn')?.addEventListener('click', () => {
      navigationModal.style.display = 'none';
      openToolTestModal();
    });
    
    // Setup close handlers for all modals
    document.querySelectorAll('.close, .nav-close, .history-close, .test-close').forEach(btn => {
      btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    });
    
    // Window click to close modals
    window.onclick = (event) => {
      if (event.target === functionModal) {
        functionModal.style.display = 'none';
      }
      if (event.target === historyModal) {
        historyModal.style.display = 'none';
      }
      if (event.target === testModal) {
        testModal.style.display = 'none';
      }
      if (event.target === navigationModal) {
        navigationModal.style.display = 'none';
      }
    };
    
    // For escape key to close modals
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
          modal.style.display = 'none';
        });
      }
    });
    
    // Form submission
    if (functionForm) {
      functionForm.onsubmit = (e) => {
        e.preventDefault();
        saveCustomFunction();
      };
    }
    
    // Load saved functions from localStorage
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) {
      setCustomFunctions(JSON.parse(savedFunctions));
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTools = async () => {
    try {
      const response = await axios.get('/api/tools');
      if (response.data.tools && response.data.tools.length > 0) {
        setTools(response.data.tools);
        setSelectedTool(response.data.tools[0].name);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  const loadSavedHistory = () => {
    const history = localStorage.getItem('savedConversations');
    if (history) {
      setSavedHistory(JSON.parse(history));
    }
  };

  const handleToolChange = (e) => {
    setSelectedTool(e.target.value);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedTool) return;

    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: message
    };
    setConversations([...conversations, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Retry logic
    let retries = 2;
    let success = false;
    let response;

    while (retries >= 0 && !success) {
      try {
        if (selectedTool.startsWith('perplexity_')) {
          // For Perplexity tools
          response = await axios.post('/api/call-tool', {
            tool: selectedTool,
            arguments: {
              messages: [userMessage]
            }
          });
        } else if (selectedTool === 'gemini_function') {
          // For Gemini function tool
          const functionData = selectedFunction || {
            // Default function if none selected
            name: "extractMeeting",
            description: "Extract meeting details from text",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                time: { type: "string" },
                participants: { 
                  type: "array",
                  items: { type: "string" }
                },
                agenda: { 
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          };
          
          response = await axios.post('/api/call-tool', {
            tool: selectedTool,
            arguments: {
              query: message,
              functionName: functionData.name,
              functionDescription: functionData.description,
              parameters: functionData.parameters
            }
          });
        } else if (selectedTool === 'gemini_code_execution') {
          // For Gemini code execution tool
          response = await axios.post('/api/call-tool', {
            tool: selectedTool,
            arguments: {
              prompt: message
            }
          });
        }
        
        success = true;
        
        // Add assistant message to conversation
        if (response.data.content && response.data.content.length > 0) {
          setConversations([...conversations, userMessage, {
            role: 'assistant',
            content: response.data.content[0].text
          }]);
        }
      } catch (error) {
        retries--;
        if (retries < 0) {
          console.error('Error calling tool after multiple attempts:', error);
          setConversations([...conversations, userMessage, {
            role: 'assistant',
            content: `Error: ${error.message || 'Unknown error occurred'}. Please try again later.`
          }]);
        } else {
          console.log(`Retrying... ${retries} attempts left`);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openFunctionModal = () => {
    document.getElementById('function-modal').style.display = 'block';
    
    // Clear form if creating new function
    if (!selectedFunction) {
      document.getElementById('function-name').value = '';
      document.getElementById('function-description').value = '';
      document.getElementById('function-params').value = '';
    } else {
      // Fill form with selected function data
      document.getElementById('function-name').value = selectedFunction.name;
      document.getElementById('function-description').value = selectedFunction.description;
      document.getElementById('function-params').value = JSON.stringify(selectedFunction.parameters, null, 2);
    }
  };
  
  const saveCustomFunction = () => {
    try {
      const name = document.getElementById('function-name').value;
      const description = document.getElementById('function-description').value;
      const paramsStr = document.getElementById('function-params').value;
      
      if (!name || !description || !paramsStr) {
        alert('All fields are required');
        return;
      }
      
      // Validate JSON
      const parameters = JSON.parse(paramsStr);
      
      const newFunction = { name, description, parameters };
      
      let updatedFunctions;
      if (selectedFunction) {
        // Update existing function
        updatedFunctions = customFunctions.map(f => 
          f.name === selectedFunction.name ? newFunction : f
        );
      } else {
        // Add new function
        updatedFunctions = [...customFunctions, newFunction];
      }
      
      setCustomFunctions(updatedFunctions);
      localStorage.setItem('customFunctions', JSON.stringify(updatedFunctions));
      setSelectedFunction(null);
      document.getElementById('function-modal').style.display = 'none';
    } catch (e) {
      alert('Invalid JSON schema: ' + e.message);
    }
  };
  
  const deleteCustomFunction = (name) => {
    if (window.confirm(`Are you sure you want to delete the function "${name}"?`)) {
      const updatedFunctions = customFunctions.filter(f => f.name !== name);
      setCustomFunctions(updatedFunctions);
      localStorage.setItem('customFunctions', JSON.stringify(updatedFunctions));
      setSelectedFunction(null);
    }
  };

  const saveConversation = () => {
    const timestamp = new Date().toISOString();
    const conversationData = {
      timestamp,
      tool: selectedTool,
      messages: conversations
    };
    
    // Save to localStorage
    const savedConversations = JSON.parse(localStorage.getItem('savedConversations') || '[]');
    savedConversations.push(conversationData);
    localStorage.setItem('savedConversations', JSON.stringify(savedConversations));
    setSavedHistory(savedConversations);
    
    // Download as JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversationData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `conversation-${timestamp.replace(/:/g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the current conversation?')) {
      setConversations([]);
    }
  };

  const openHistoryModal = () => {
    // Populate history list
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (savedHistory.length === 0) {
      historyList.innerHTML = '<p>No saved conversations found.</p>';
      document.getElementById('history-modal').style.display = 'block';
      return;
    }
    
    // Sort history by timestamp (newest first)
    const sortedHistory = [...savedHistory].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedHistory.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      // Format date
      const date = new Date(item.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      // Get the first user message as preview
      const preview = item.messages.find(m => m.role === 'user')?.content || 'No content';
      
      historyItem.innerHTML = `
        <div class="history-timestamp">${formattedDate}</div>
        <div class="history-tool">Tool: ${item.tool}</div>
        <div class="history-preview">${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}</div>
      `;
      
      historyItem.addEventListener('click', () => {
        loadConversation(item);
        document.getElementById('history-modal').style.display = 'none';
      });
      
      historyList.appendChild(historyItem);
    });
    
    document.getElementById('history-modal').style.display = 'block';
  };
  
  const loadConversation = (conversationData) => {
    setConversations(conversationData.messages);
    
    // Set the tool if it exists in available tools
    if (tools.some(tool => tool.name === conversationData.tool)) {
      setSelectedTool(conversationData.tool);
    }
  };

  const openToolTestModal = () => {
    const container = document.getElementById('tool-test-container');
    container.innerHTML = '';
    
    // Create a React root for the test container
    const testRoot = ReactDOM.createRoot(container);
    testRoot.render(<ToolTester toolName={selectedTool} />);
    
    document.getElementById('tool-test-modal').style.display = 'block';
  };

  const formatContent = (content) => {
    if (!content) return { __html: '' };

    let formattedContent = content;

    // Convert markdown code blocks
    formattedContent = formattedContent.replace(
      /```([^`]+)```/g, 
      '<pre><code>$1</code></pre>'
    );

    // Convert inline code
    formattedContent = formattedContent.replace(
      /`([^`]+)`/g, 
      '<code>$1</code>'
    );

    // Replace line breaks
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    return { __html: formattedContent };
  };

  // Tool Tester component
  const ToolTester = ({ toolName }) => {
    const [testInput, setTestInput] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);
    
    const testTool = async () => {
      if (!testInput.trim()) return;
      
      setTesting(true);
      setTestResult(null);
      
      try {
        let response;
        
        if (toolName.startsWith('perplexity_')) {
          response = await axios.post('/api/call-tool', {
            tool: toolName,
            arguments: {
              messages: [{ role: 'user', content: testInput }]
            }
          });
        } else if (toolName === 'gemini_function') {
          response = await axios.post('/api/call-tool', {
            tool: toolName,
            arguments: {
              query: testInput,
              functionName: "test",
              functionDescription: "Test function extraction",
              parameters: {
                type: "object",
                properties: {
                  result: { type: "string" }
                }
              }
            }
          });
        } else if (toolName === 'gemini_code_execution') {
          response = await axios.post('/api/call-tool', {
            tool: toolName,
            arguments: {
              prompt: testInput
            }
          });
        }
        
        setTestResult(response.data);
      } catch (error) {
        setTestResult({ error: error.message });
      } finally {
        setTesting(false);
      }
    };
    
    return (
      <div className="tool-tester">
        <h3>Test Tool: {toolName}</h3>
        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Enter test input..."
          rows="3"
        ></textarea>
        <button onClick={testTool} disabled={testing || !testInput.trim()}>
          {testing ? 'Testing...' : 'Run Test'}
        </button>
        
        {testResult && (
          <div className="test-result">
            <h4>Result:</h4>
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>MCP Web Interface</h1>
        <div className="tool-controls">
          <select 
            className="tool-selector" 
            value={selectedTool} 
            onChange={handleToolChange}
          >
            {tools.map(tool => (
              <option key={tool.name} value={tool.name}>
                {tool.name}
              </option>
            ))}
          </select>
          
          {selectedTool === 'gemini_function' && (
            <div className="function-controls">
              <button className="function-btn" onClick={() => { setSelectedFunction(null); openFunctionModal(); }}>
                New Function
              </button>
              
              {customFunctions.length > 0 && (
                <select className="function-selector" onChange={(e) => {
                  const selected = customFunctions.find(f => f.name === e.target.value);
                  setSelectedFunction(selected);
                }}>
                  <option value="">Default (Meeting Extractor)</option>
                  {customFunctions.map(func => (
                    <option key={func.name} value={func.name}>{func.name}</option>
                  ))}
                </select>
              )}
              
              {selectedFunction && (
                <div className="function-actions">
                  <button className="edit-btn" onClick={openFunctionModal}>Edit</button>
                  <button className="delete-btn" onClick={() => deleteCustomFunction(selectedFunction.name)}>Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="app-controls">
        <button className="control-button" onClick={openHistoryModal}>
          <HistoryIcon /> History
        </button>
        <button className="control-button" onClick={openToolTestModal}>
          <TestIcon /> Test Tool
        </button>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {conversations.map((msg, index) => (
            <div 
              key={index} 
              className={`message message-${msg.role}`}
            >
              <div dangerouslySetInnerHTML={formatContent(msg.content)} />
            </div>
          ))}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="conversation-controls">
          <button 
            className="control-btn save-btn" 
            onClick={saveConversation}
            disabled={conversations.length === 0}
          >
            Save Conversation
          </button>
          <button 
            className="control-btn clear-btn" 
            onClick={clearConversation}
            disabled={conversations.length === 0}
          >
            Clear Conversation
          </button>
        </div>

        <div className="input-container">
          <textarea
            className="message-input"
            value={message}
            onChange={handleMessageChange}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            className="send-button"
            onClick={handleSubmit}
            disabled={!message.trim() || !selectedTool || isLoading}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

// Render the React app
ReactDOM.render(<App />, document.getElementById('root'));
