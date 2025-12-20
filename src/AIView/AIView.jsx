// src/AIView/AIView.jsx - AI Chat with Work Context

import React, { useState, useEffect, useRef } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Trash2, 
  FileText,
  CheckCircle,
  Loader,
  RefreshCw,
  MessageSquare,
  Brain,
  Download,
  Copy,
  Check
} from 'lucide-react';

const AIView = () => {
  const { state, dispatch } = useAppState();
  
  const [selectedWorkIds, setSelectedWorkIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get available works from results
  const availableWorks = React.useMemo(() => {
    const works = new Map();
    
    state.results.patterns.forEach(pattern => {
      const workId = pattern.metadata?.work_id;
      const workTitle = pattern.metadata?.work_title;
      const author = pattern.metadata?.author;
      
      if (workId && !works.has(workId)) {
        works.set(workId, {
          id: workId,
          title: workTitle || 'Unknown',
          author: author || 'Unknown',
          segmentCount: 0,
          highScoreCount: 0,
          patterns: []
        });
      }
      
      if (workId && works.has(workId)) {
        const work = works.get(workId);
        work.segmentCount++;
        if ((pattern.scores?.composite || 0) >= 70) {
          work.highScoreCount++;
        }
        work.patterns.push(pattern);
      }
    });
    
    return Array.from(works.values());
  }, [state.results.patterns]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (!conversationId) {
      setConversationId(`conv_${Date.now()}`);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI assistant specialized in analyzing decoded cipher patterns. 

Select one or more works from the sidebar to discuss their decoded patterns, anomalies, and historical significance.

I can help you:
- Identify historical entities and connections
- Analyze cipher patterns and methods
- Suggest interpretations of decoded text
- Compare patterns across different segments
- Provide historical context

What would you like to explore?`,
        timestamp: Date.now()
      }]);
    }
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    if (selectedWorkIds.length === 0) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'warning',
          message: 'Please select at least one work to analyze'
        }
      });
      return;
    }

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get context from selected works
      const context = buildWorkContext(selectedWorkIds, availableWorks);
      
      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        user: msg.role === 'user' ? msg.content : undefined,
        assistant: msg.role === 'assistant' ? msg.content : undefined
      })).filter(msg => msg.user || msg.assistant);

      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          conversation_history: conversationHistory,
          context: context
        })
      });

      const result = await response.json();

      const assistantMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: result.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: 'Failed to get AI response: ' + error.message
        }
      });

      const errorMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: Date.now(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Conversation cleared. What would you like to discuss?',
      timestamp: Date.now()
    }]);
    setConversationId(`conv_${Date.now()}`);
  };

  const handleToggleWork = (workId) => {
    setSelectedWorkIds(prev => 
      prev.includes(workId)
        ? prev.filter(id => id !== workId)
        : [...prev, workId]
    );
  };

  const handleSelectAll = () => {
    setSelectedWorkIds(availableWorks.map(w => w.id));
  };

  const handleDeselectAll = () => {
    setSelectedWorkIds([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar - Work Selection */}
      <div className="w-80 flex-shrink-0">
        <WorkSelector
          availableWorks={availableWorks}
          selectedWorkIds={selectedWorkIds}
          onToggleWork={handleToggleWork}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <ChatHeader
          selectedCount={selectedWorkIds.length}
          messageCount={messages.length - 1}
          onClear={handleClearConversation}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}
          
          {isLoading && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={selectedWorkIds.length === 0}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const WorkSelector = ({ 
  availableWorks, 
  selectedWorkIds, 
  onToggleWork, 
  onSelectAll, 
  onDeselectAll 
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-gray-900">Context Selection</h3>
        </div>
        <p className="text-xs text-gray-600">
          Select works to discuss with AI
        </p>
      </div>

      {/* Selection Actions */}
      {availableWorks.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
          <button
            onClick={onSelectAll}
            className="flex-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Works List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {availableWorks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No works available</p>
            <p className="text-xs text-gray-500">
              Run an analysis first to get results
            </p>
          </div>
        ) : (
          availableWorks.map(work => (
            <WorkCard
              key={work.id}
              work={work}
              isSelected={selectedWorkIds.includes(work.id)}
              onToggle={() => onToggleWork(work.id)}
            />
          ))
        )}
      </div>

      {/* Stats */}
      {selectedWorkIds.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">
              {selectedWorkIds.length}
            </span> work{selectedWorkIds.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}
    </div>
  );
};

const WorkCard = ({ work, isSelected, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-purple-400 bg-purple-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-25'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected
              ? 'bg-purple-600 border-purple-600'
              : 'bg-white border-gray-300'
          }`}>
            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 mb-1 truncate">
            {work.title}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            by {work.author}
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">
              {work.segmentCount} segments
            </span>
            {work.highScoreCount > 0 && (
              <span className="text-green-600 font-medium">
                {work.highScoreCount} high score
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const ChatHeader = ({ selectedCount, messageCount, onClear }) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-600">
              {selectedCount > 0 ? (
                <>Analyzing {selectedCount} work{selectedCount !== 1 ? 's' : ''}</>
              ) : (
                <>Select works to begin</>
              )}
            </p>
          </div>
        </div>

        {messageCount > 0 && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="flex items-start gap-3 flex-row-reverse">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-md ${
            message.isError
              ? 'bg-red-50 border-2 border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatInput = ({ value, onChange, onSend, isLoading, disabled, inputRef }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
      {disabled && (
        <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <MessageSquare className="w-4 h-4" />
          <span>Select at least one work from the sidebar to start chatting</span>
        </div>
      )}

      <div className="flex gap-3">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Select works to begin..." : "Ask about decoded patterns, entities, or historical context..."}
          disabled={disabled || isLoading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={3}
        />
        
        <button
          onClick={onSend}
          disabled={disabled || isLoading || !value.trim()}
          className="px-6 h-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send
            </>
          )}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

function buildWorkContext(selectedWorkIds, availableWorks) {
  const selectedWorks = availableWorks.filter(w => selectedWorkIds.includes(w.id));
  
  return {
    works: selectedWorks.map(work => ({
      id: work.id,
      title: work.title,
      author: work.author,
      segments: work.patterns.slice(0, 10).map(p => ({ // Limit to top 10 per work
        text: p.original_text,
        decoded: p.best_candidate?.decoded_text || '',
        score: p.scores?.composite || 0,
        entities: p.entities_detected || [],
        methods: p.best_candidate?.method || ''
      }))
    })),
    summary: {
      totalWorks: selectedWorks.length,
      totalSegments: selectedWorks.reduce((sum, w) => sum + w.segmentCount, 0),
      highScoreSegments: selectedWorks.reduce((sum, w) => sum + w.highScoreCount, 0)
    }
  };
}

export default AIView;