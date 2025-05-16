
const { useState, useEffect, useRef } = React;

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const App = () => {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState('');
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Fetch available tools on component mount
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await axios.get('/api/tools');
        setTools(response.data.tools);
        if (response.data.tools.length > 0) {
          setSelectedTool(response.data.tools[0].name);
        }
      } catch (error) {
        console.error('Error fetching tools:', error);
      }
    };
    
    fetchTools();
  }, []);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [conversations]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleToolChange = (e) => {
    setSelectedTool(e.target.value);
  };
  
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTool) return;
    
    // Add user message to conversation
    const newMessage = message.trim();
    setConversations([...conversations, { role: 'user', content: newMessage }]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Prepare tool-specific arguments
      let toolArguments = {};
      
      if (selectedTool === 'perplexity_ask' || 
          selectedTool === 'perplexity_research' || 
          selectedTool === 'perplexity_reason') {
        // Extract existing messages for context
        const contextMessages = conversations
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));
        
        // Add the new message
        toolArguments = {
          messages: [...contextMessages, { role: 'user', content: newMessage }]
        };
      } else if (selectedTool === 'gemini_function') {
        // For gemini_function, we need more structured data
        toolArguments = {
          query: newMessage,
          functionName: "extract_information",
          functionDescription: "Extracts structured information from user query",
          parameters: {
            type: "object",
            properties: {
              main_topic: {
                type: "string",
                description: "The main topic or subject"
              },
              key_details: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Key details or points"
              }
            }
          }
        };
      } else if (selectedTool === 'gemini_code_execution') {
        // For code execution
        toolArguments = {
          prompt: newMessage
        };
      }
      
      // Call the selected tool
      const response = await axios.post('/api/call-tool', {
        tool: selectedTool,
        arguments: toolArguments
      });
      
      // Add assistant response to conversation
      let responseText = '';
      if (response.data.content && Array.isArray(response.data.content)) {
        responseText = response.data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');
      }
      
      setConversations([
        ...conversations, 
        { role: 'user', content: newMessage },
        { role: 'assistant', content: responseText }
      ]);
    } catch (error) {
      console.error('Error calling tool:', error);
      setConversations([
        ...conversations,
        { role: 'user', content: newMessage },
        { 
          role: 'assistant', 
          content: `Error: ${error.response?.data?.message || error.message}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format message content with basic markdown-like rendering
  const formatContent = (content) => {
    // Replace code blocks
    let formattedContent = content.replace(
      /```(\w+)?\n([\s\S]*?)\n```/g, 
      '<pre><code>$2</code></pre>'
    );
    
    // Replace inline code
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
            onKeyPress={handleKeyPress}
            placeholder={`Ask something using ${selectedTool}...`}
            disabled={isLoading}
          />
          <button 
            className="send-button" 
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
