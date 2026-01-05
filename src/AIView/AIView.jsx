// src/AIView/AIView.jsx - AI Chat with Work Context

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Check,
  ArrowLeft,
  Settings,
  Info,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  Zap
} from 'lucide-react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AIView = () => {
  const { state, dispatch, addNotification } = useAppState();
  
  const [selectedWorkIds, setSelectedWorkIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [contextDepth, setContextDepth] = useState('medium'); // 'light', 'medium', 'deep'
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get available works from results
  const availableWorks = useMemo(() => {
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
          avgScore: 0,
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
    
    // Calculate average scores
    works.forEach(work => {
      if (work.patterns.length > 0) {
        work.avgScore = work.patterns.reduce((sum, p) => sum + (p.scores?.composite || 0), 0) / work.patterns.length;
      }
    });
    
    return Array.from(works.values()).sort((a, b) => b.avgScore - a.avgScore);
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
        content: `Hello! I'm your AI assistant specialized in analyzing Renaissance cipher patterns. 

Select one or more works from the sidebar to discuss their decoded patterns, anomalies, and historical significance.

I can help you:
- Identify historical entities and their connections
- Analyze cipher patterns and decoding methods
- Suggest interpretations of decoded text
- Compare patterns across different segments
- Provide historical context for Elizabethan figures
- Identify potential authorship signals

What would you like to explore?`,
        timestamp: Date.now()
      }]);
    }
  }, [conversationId]);

  // Suggested prompts based on selected works
  const suggestedPrompts = useMemo(() => {
    if (selectedWorkIds.length === 0) return [];
    
    const selectedWorks = availableWorks.filter(w => selectedWorkIds.includes(w.id));
    const hasHighScores = selectedWorks.some(w => w.highScoreCount > 0);
    
    const prompts = [
      `Summarize the key findings across ${selectedWorks.length > 1 ? 'these works' : 'this work'}`,
      'What historical entities appear most frequently?',
      'Are there any unusual or unexpected patterns?',
    ];
    
    if (hasHighScores) {
      prompts.push('Focus on the high-confidence results - what do they tell us?');
    }
    
    if (selectedWorks.length > 1) {
      prompts.push('Compare the decoded patterns between these works');
    }
    
    return prompts;
  }, [selectedWorkIds, availableWorks]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    if (selectedWorkIds.length === 0) {
      addNotification('warning', 'Please select at least one work to analyze');
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
      const context = buildWorkContext(selectedWorkIds, availableWorks, contextDepth);
      
      // Build conversation history
      const conversationHistory = messages
        .filter(msg => msg.id !== 'welcome') // Exclude welcome message
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // const response = await fetch('http://192.99.245.215:8000/api/ai/chat', {
      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          conversation_history: conversationHistory,
          context: context
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      const assistantMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: result.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add success notification
      addNotification('success', 'Response received', 1500);

    } catch (error) {
      console.error('AI Chat error:', error);
      
      addNotification('error', `Failed to get AI response: ${error.message}`);

      const errorMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error connecting to the AI service. Please check your connection and try again.',
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
    if (messages.length <= 1) return;
    
    if (window.confirm('Clear this conversation? This cannot be undone.')) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation cleared. What would you like to discuss?',
        timestamp: Date.now()
      }]);
      setConversationId(`conv_${Date.now()}`);
      
      addNotification('info', 'Conversation cleared');
    }
  };

  const handleExportConversation = () => {
    const exportData = {
      conversationId,
      timestamp: new Date().toISOString(),
      selectedWorks: availableWorks.filter(w => selectedWorkIds.includes(w.id)).map(w => ({
        id: w.id,
        title: w.title,
        author: w.author
      })),
      messages: messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${conversationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification('success', 'Conversation exported');
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
    addNotification('info', `Selected all ${availableWorks.length} works`);
  };

  const handleDeselectAll = () => {
    setSelectedWorkIds([]);
  };

  const handleSelectTopScoring = () => {
    const topWorks = availableWorks
      .filter(w => w.highScoreCount > 0)
      .slice(0, 5)
      .map(w => w.id);
    
    if (topWorks.length === 0) {
      addNotification('warning', 'No high-scoring works found');
      return;
    }
    
    setSelectedWorkIds(topWorks);
    addNotification('success', `Selected ${topWorks.length} top-scoring works`);
  };

  const handleUseSuggestedPrompt = (prompt) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <AIViewHeader 
            onBack={() => dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' })}
            messageCount={messages.length - 1}
            selectedCount={selectedWorkIds.length}
          />
        </div>

        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar - Work Selection */}
          <div className="w-96 flex-shrink-0">
            <WorkSelector
              availableWorks={availableWorks}
              selectedWorkIds={selectedWorkIds}
              onToggleWork={handleToggleWork}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onSelectTopScoring={handleSelectTopScoring}
              contextDepth={contextDepth}
              onContextDepthChange={setContextDepth}
            />
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            {/* Chat Header */}
            <ChatHeader
              selectedCount={selectedWorkIds.length}
              messageCount={messages.length - 1}
              onClear={handleClearConversation}
              onExport={handleExportConversation}
              onSettings={() => setShowSettings(!showSettings)}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                />
              ))}
              
              {isLoading && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {!isLoading && messages.length <= 2 && selectedWorkIds.length > 0 && suggestedPrompts.length > 0 && (
              <SuggestedPrompts 
                prompts={suggestedPrompts}
                onSelectPrompt={handleUseSuggestedPrompt}
              />
            )}

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
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const AIViewHeader = ({ onBack, messageCount, selectedCount }) => (
  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 hover:bg-gray-100 rounded-xl transition-all"
          title="Back to Workspace"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        
        <div className="h-12 w-px bg-gray-300" />
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze decoded patterns with AI-powered insights
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-lg text-purple-900">{messageCount}</span>
          <span className="text-sm text-purple-700 font-medium">messages</span>
        </div>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-lg text-blue-900">{selectedCount}</span>
            <span className="text-sm text-blue-700 font-medium">works</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const WorkSelector = ({ 
  availableWorks, 
  selectedWorkIds, 
  onToggleWork, 
  onSelectAll, 
  onDeselectAll,
  onSelectTopScoring,
  contextDepth,
  onContextDepthChange
}) => {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'high-score', 'medium-score'
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const filteredWorks = useMemo(() => {
    switch (filterMode) {
      case 'high-score':
        return availableWorks.filter(w => w.highScoreCount > 0);
      case 'medium-score':
        return availableWorks.filter(w => w.avgScore >= 50);
      default:
        return availableWorks;
    }
  }, [availableWorks, filterMode]);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg h-full flex flex-col">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900">Work Selection</h3>
              <p className="text-xs text-gray-600">
                Choose works for context
              </p>
            </div>
          </div>
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </div>
      </button>

      {!isCollapsed && (
        <>
          {/* Context Depth Selector */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Context Depth
            </label>
            <select
              value={contextDepth}
              onChange={(e) => onContextDepthChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="light">Light (5 segments/work)</option>
              <option value="medium">Medium (10 segments/work)</option>
              <option value="deep">Deep (20 segments/work)</option>
            </select>
          </div>

          {/* Filter Mode */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex gap-2">
              <FilterButton
                active={filterMode === 'all'}
                onClick={() => setFilterMode('all')}
                icon={<BookOpen className="w-3 h-3" />}
                label="All"
                count={availableWorks.length}
              />
              <FilterButton
                active={filterMode === 'high-score'}
                onClick={() => setFilterMode('high-score')}
                icon={<TrendingUp className="w-3 h-3" />}
                label="High Score"
                count={availableWorks.filter(w => w.highScoreCount > 0).length}
              />
            </div>
          </div>

          {/* Selection Actions */}
          {filteredWorks.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
              <button
                onClick={onSelectAll}
                className="flex-1 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" />
                All
              </button>
              <button
                onClick={onSelectTopScoring}
                className="flex-1 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Top 5
              </button>
              <button
                onClick={onDeselectAll}
                className="flex-1 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Works List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredWorks.length === 0 ? (
              <div className="text-center py-12">
                {availableWorks.length === 0 ? (
                  <>
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2 font-semibold">No Works Available</p>
                    <p className="text-xs text-gray-500">
                      Run an analysis first to get results
                    </p>
                  </>
                ) : (
                  <>
                    <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2 font-semibold">No Matching Works</p>
                    <p className="text-xs text-gray-500">
                      Try a different filter
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredWorks.map(work => (
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
            <div className="px-4 py-3 border-t-2 border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="text-sm font-bold text-purple-900">
                {selectedWorkIds.length} work{selectedWorkIds.length !== 1 ? 's' : ''} selected
              </div>
              <div className="text-xs text-purple-700 mt-1">
                {contextDepth === 'light' && `~${selectedWorkIds.length * 5} segments`}
                {contextDepth === 'medium' && `~${selectedWorkIds.length * 10} segments`}
                {contextDepth === 'deep' && `~${selectedWorkIds.length * 20} segments`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
      active
        ? 'bg-purple-100 text-purple-900 border-2 border-purple-300'
        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span>{label}</span>
    <span className={`ml-1 px-1.5 py-0.5 rounded ${
      active ? 'bg-purple-200' : 'bg-gray-200'
    }`}>
      {count}
    </span>
  </button>
);

const WorkCard = ({ work, isSelected, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-25 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected
              ? 'bg-purple-600 border-purple-600'
              : 'bg-white border-gray-300'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
            {work.title}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            by {work.author}
          </div>
          
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium border border-blue-200">
              {work.segmentCount} segments
            </span>
            {work.highScoreCount > 0 && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium border border-green-200">
                {work.highScoreCount} high
              </span>
            )}
            <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded font-medium border border-gray-200">
              Avg: {Math.round(work.avgScore)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const ChatHeader = ({ selectedCount, messageCount, onClear, onExport, onSettings }) => {
  return (
    <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cipher Analysis Assistant</h2>
            <p className="text-sm text-gray-600">
              {selectedCount > 0 ? (
                <>Analyzing {selectedCount} work{selectedCount !== 1 ? 's' : ''} • {messageCount} messages</>
              ) : (
                <>Select works from sidebar to begin</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messageCount > 0 && (
            <>
              <button
                onClick={onExport}
                className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 border border-blue-200"
                title="Export conversation"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={onClear}
                className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SuggestedPrompts = ({ prompts, onSelectPrompt }) => (
  <div className="px-6 py-3 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
    <div className="flex items-center gap-2 mb-2">
      <Sparkles className="w-4 h-4 text-purple-600" />
      <span className="text-xs font-bold text-purple-900">Suggested Questions:</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(prompt)}
          className="px-3 py-2 text-xs font-medium text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all"
        >
          {prompt}
        </button>
      ))}
    </div>
  </div>
);

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
        <div className="max-w-[75%]">
          <div className="flex items-start gap-3 flex-row-reverse">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className={`rounded-2xl rounded-tl-sm px-5 py-3 shadow-lg ${
            message.isError
              ? 'bg-red-50 border-2 border-red-200'
              : 'bg-white border border-gray-200'
          }`}>
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {!message.isError && (
            <button
              onClick={handleCopy}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
    <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
      {disabled && (
        <div className="mb-3 px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center gap-3 text-sm">
          <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="font-bold text-amber-900 mb-0.5">No Works Selected</div>
            <div className="text-amber-800 text-xs">
              Select at least one work from the sidebar to start chatting with the AI assistant
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Select works to begin..." : "Ask about decoded patterns, entities, historical context, or request interpretations..."}
          disabled={disabled || isLoading}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-sm"
          rows={3}
        />
        
        <button
          onClick={onSend}
          disabled={disabled || isLoading || !value.trim()}
          className="px-8 h-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 font-bold shadow-md"
        >
          {isLoading ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <span className="text-xs">Thinking...</span>
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              <span className="text-xs">Send</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">Shift+Enter</kbd> for new line</span>
        {value.length > 0 && (
          <span className="text-gray-400">{value.length} characters</span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

function buildWorkContext(selectedWorkIds, availableWorks, contextDepth) {
  const selectedWorks = availableWorks.filter(w => selectedWorkIds.includes(w.id));
  
  // Determine segment limit based on depth
  const segmentLimit = contextDepth === 'light' ? 5 : contextDepth === 'medium' ? 10 : 20;
  
  return {
    works: selectedWorks.map(work => ({
      id: work.id,
      title: work.title,
      author: work.author,
      segments: work.patterns
        .sort((a, b) => (b.scores?.composite || 0) - (a.scores?.composite || 0)) // Sort by score
        .slice(0, segmentLimit)
        .map(p => ({
          text: p.original_text,
          decoded: p.best_candidate?.decoded_text || '',
          score: p.scores?.composite || 0,
          entities: p.entities_detected || [],
          methods: p.best_candidate?.method || '',
          segment_id: p.segment_id
        }))
    })),
    summary: {
      totalWorks: selectedWorks.length,
      totalSegments: selectedWorks.reduce((sum, w) => sum + Math.min(w.segmentCount, segmentLimit), 0),
      highScoreSegments: selectedWorks.reduce((sum, w) => sum + w.highScoreCount, 0),
      contextDepth: contextDepth
    }
  };
}

export default AIView;