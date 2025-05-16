const { useState, useEffect, useRef } = React;

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const App = () => {
  const [tools, setTools] = React.useState([]);
  const [selectedTool, setSelectedTool] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [conversations, setConversations] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  // Fetch available tools when component mounts
  React.useEffect(() => {
    fetchTools();
  }, []);

  // Scroll to bottom when messages change
  React.useEffect(() => {
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

    try {
      let response;
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
        response = await axios.post('/api/call-tool', {
          tool: selectedTool,
          arguments: {
            query: message,
            functionName: "extractMeeting",
            functionDescription: "Extract meeting details from text",
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

      // Add assistant message to conversation
      if (response.data.content && response.data.content.length > 0) {
        setConversations([...conversations, userMessage, {
          role: 'assistant',
          content: response.data.content[0].text
        }]);
      }
    } catch (error) {
      console.error('Error calling tool:', error);
      setConversations([...conversations, userMessage, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="app-container">
      <div className="header">
        <h1>MCP Web Interface</h1>
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
            disabled={!message.trim() || !selectedTool}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Render the React app
ReactDOM.render(<App />, document.getElementById('root'));