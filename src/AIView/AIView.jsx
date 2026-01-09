import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Send, Sparkles, Bot, User, Trash2, FileText, Loader, MessageSquare,
  Download, Copy, Check, ArrowLeft, Info, TrendingUp, BookOpen, 
  ChevronDown, ChevronUp, Filter, Zap, AlertCircle, X, Settings,
  Minimize2, Maximize2, Share2, Network, FileEdit, GitCompare,
  Search, Lightbulb, Target, Brain, Activity, BarChart3, Layers,
  MapPin, Clock, Users, Globe, Shield, Eye, Telescope, Beaker,
  BookMarked, LinkIcon, Hash, Percent, Award, FolderOpen, Plus, Save  // ✅ ADD Save HERE
} from 'lucide-react';

import { useAppState } from '../context/AppContext';





// ============================================================================
// TAB DEFINITIONS
// ============================================================================

const TABS = [
  { id: 'chat', label: 'Research Chat', icon: MessageSquare, color: 'purple' },
  { id: 'hypothesis', label: 'Hypothesis Testing', icon: Lightbulb, color: 'yellow' },
  // { id: 'compare', label: 'Edition Compare', icon: GitCompare, color: 'orange' },
  // { id: 'segment', label: 'Segment Analysis', icon: Search, color: 'indigo' },
  // { id: 'report', label: 'Report Generator', icon: FileText, color: 'red' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AIResearchAssistant = () => {
  const { 
    state, 
    exportResearchReport, 
    addNotification,
    enhanceDecodeWithAI,
    suggestLetterArrangements,
    proposeHypothesis,
    synthesizeNarrative,
    compareEditionsWithAI,
    buildEntityNetwork,
    analyzeSegmentWithAI,
    getAIModelStats,
    clearAICache,
    clearAIChatHistory,
    chatWithAI,
    updateSessionTabState,
    closeSession,
    createSession,
    loadSession,
    listSessions,
    deleteSession,
    loadAllEditions  // ✅ ADD THIS LINE
  } = useAppState();

  
  const [activeTab, setActiveTab] = useState(
    state.session?.current?.last_tab || 'chat'
  );
  const [isCompact, setIsCompact] = useState(false);

  // Auto-save when tab changes
  useEffect(() => {
    if (state.session?.isActive) {
      updateSessionTabState('last_tab', activeTab);
    }
  }, [activeTab, state.session?.isActive]);

  // Show session indicator
  const currentSession = state.session?.current;

  const TabComponent = TAB_COMPONENTS[activeTab] || ChatTab;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header with Session Indicator */}
        <Header 
          isCompact={isCompact}
          onToggleCompact={() => setIsCompact(!isCompact)}
          currentSession={currentSession}
          onCloseSession={closeSession}
        />

          {/* Tab Navigation */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {TABS.map(tab => (
              <TabButton
                key={tab.id}
                tab={tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* Tab Content */}
<div className="mt-6">
   <TabComponent 
    state={state}
    exportResearchReport={exportResearchReport}
    addNotification={addNotification}
    enhanceDecodeWithAI={enhanceDecodeWithAI}
    suggestLetterArrangements={suggestLetterArrangements}
    proposeHypothesis={proposeHypothesis}
    synthesizeNarrative={synthesizeNarrative}
    compareEditionsWithAI={compareEditionsWithAI}
    buildEntityNetwork={buildEntityNetwork}
    analyzeSegmentWithAI={analyzeSegmentWithAI}
    getAIModelStats={getAIModelStats}
    clearAICache={clearAICache}
    clearAIChatHistory={clearAIChatHistory}
    chatWithAI={chatWithAI}
    loadAllEditions={loadAllEditions}  // ✅ ADD THIS

    // Session management - already here ✅
    createSession={createSession}
    loadSession={loadSession}
    listSessions={listSessions}
    deleteSession={deleteSession}
  />
</div>

</div>
      </div>
  );
};
      

// ============================================================================
// HEADER COMPONENT
// ============================================================================

const Header = ({ isCompact, onToggleCompact }) => (
  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Research Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive cipher analysis and historical research tools
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleCompact}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          title={isCompact ? "Expand" : "Compact view"}
        >
          {isCompact ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  </div>
);



// ============================================================================
// TAB BUTTON COMPONENT
// ============================================================================

const TabButton = ({ tab, active, onClick }) => {
  const Icon = tab.icon;
  
  const colorClasses = {
    purple: 'from-purple-500 to-pink-600',
    yellow: 'from-yellow-500 to-orange-600',
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-green-500 to-emerald-600',
    orange: 'from-orange-500 to-red-600',
    indigo: 'from-indigo-500 to-purple-600',
    red: 'from-red-500 to-pink-600'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
        active
          ? `bg-gradient-to-r ${colorClasses[tab.color]} text-white shadow-lg scale-105`
          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{tab.label}</span>
    </button>
  );
};

// ============================================================================
// TAB 1: RESEARCH CHAT
// ============================================================================

// ============================================================================
// TAB 1: RESEARCH CHAT (with integrated Sessions & Results)
// ============================================================================

// ============================================================================
// TAB 1: RESEARCH CHAT (with integrated Sessions & Results)
// ============================================================================

const ChatTab = ({ state, chatWithAI, addNotification, createSession, loadSession, listSessions, deleteSession }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI research assistant. I can help you analyze cipher patterns, test hypotheses, explore entity relationships, and generate comprehensive reports. What would you like to explore?',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Session management
  const [sessions, setSessions] = useState([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  
  // Sidebar view
  const [sidebarView, setSidebarView] = useState('results'); // 'results' or 'sessions'
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadSessionList();
  }, []);

  const loadSessionList = async () => {
    try {
      const sessionList = await listSessions();
      setSessions(sessionList || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatWithAI(inputMessage, {
        command: inputMessage.startsWith('/') ? inputMessage.split(' ')[0] : null
      });

      const aiMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      addNotification('error', 'Chat failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

 const handleCreateSession = async (notes = '', sessionData = {}) => {
  if (!newSessionName.trim()) {
    addNotification('error', 'Please enter a session name');
    return;
  }

  try {
    await createSession(newSessionName, notes, sessionData);
    setNewSessionName('');
    setIsCreatingSession(false);
    loadSessionList();
  } catch (error) {
    console.error('Failed to create session:', error);
    addNotification('error', 'Failed to create session: ' + error.message);
  }
};

  const handleLoadSession = async (sessionId) => {
    try {
      await loadSession(sessionId);
      addNotification('success', 'Session loaded!');
    } catch (error) {
      console.error('Failed to load session:', error);
      addNotification('error', 'Failed to load session: ' + error.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this session?')) return;
    
    try {
      await deleteSession(sessionId);
      addNotification('success', 'Session deleted');
      loadSessionList();
    } catch (error) {
      console.error('Failed to delete session:', error);
      addNotification('error', 'Failed to delete session: ' + error.message);
    }
  };

  const quickCommands = [
    { cmd: '/hypothesis', label: 'Test Hypothesis', icon: Lightbulb },
    { cmd: '/entities', label: 'Show Entities', icon: Users },
    { cmd: '/compare', label: 'Compare Editions', icon: GitCompare },
    { cmd: '/summarize', label: 'Summarize Work', icon: FileText }
  ];

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-20rem)]">
      {/* Sidebar: Results & Sessions */}
      <div className="col-span-3 bg-white rounded-2xl border-2 border-gray-200 shadow-lg flex flex-col">
        {/* Sidebar Tabs */}
        <div className="flex border-b-2 border-gray-200 p-2 gap-2">
          <button
            onClick={() => setSidebarView('results')}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              sidebarView === 'results'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Results
          </button>
          <button
            onClick={() => setSidebarView('sessions')}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              sidebarView === 'sessions'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-1" />
            Sessions
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarView === 'results' ? (
            <ResultsSidebar state={state} />
          ) : (
            <SessionsSidebar
              sessions={sessions}
              isCreatingSession={isCreatingSession}
              newSessionName={newSessionName}
              setNewSessionName={setNewSessionName}
              onCreateSession={handleCreateSession}
              onLoadSession={handleLoadSession}
              onDeleteSession={handleDeleteSession}
              onStartCreating={() => setIsCreatingSession(true)}
              onCancelCreating={() => {
                setIsCreatingSession(false);
                setNewSessionName('');
              }}
              state={state}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="col-span-9 bg-white rounded-2xl border-2 border-gray-200 shadow-lg flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Commands */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {quickCommands.map(cmd => (
              <button
                key={cmd.cmd}
                onClick={() => setInputMessage(cmd.cmd + ' ')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all text-sm whitespace-nowrap"
              >
                <cmd.icon className="w-4 h-4 text-purple-600" />
                {cmd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-6 border-t-2 border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about patterns, entities, historical context..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SESSIONS SIDEBAR COMPONENT (COMPLETE WITH WORK PICKER)
// ============================================================================

// ============================================================================
// SESSIONS SIDEBAR COMPONENT (COMPLETE WITH WORK & RESULTS PICKER)
// Place this in AIView.jsx, replacing the existing SessionsSidebar
// ============================================================================

const SessionsSidebar = ({
  sessions,
  isCreatingSession,
  newSessionName,
  setNewSessionName,
  onCreateSession,
  onLoadSession,
  onDeleteSession,
  onStartCreating,
  onCancelCreating,
  state
}) => {
  const [sessionNotes, setSessionNotes] = useState('');
  const [showWorkPicker, setShowWorkPicker] = useState(false);
  const [showResultsPicker, setShowResultsPicker] = useState(false);
  const [selectedWorkForSession, setSelectedWorkForSession] = useState(null);
  const [selectedResultsForSession, setSelectedResultsForSession] = useState([]);
  const [availableResults, setAvailableResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  
  // Get current work info
  const currentWork = state.workspace?.currentSource;
  const hasWork = !!currentWork;
  const hasSegments = (state.workspace?.segments || []).length > 0;
  const hasResults = (state.results?.patterns || []).length > 0;
  
  // Get available works from library
  const availableWorks = state.library?.availableWorks || [];
  const authors = state.library?.authors || [];
  
  // Auto-show work picker if no current work is loaded
  useEffect(() => {
    if (isCreatingSession && !hasWork && !selectedWorkForSession && !showWorkPicker) {
      setShowWorkPicker(true);
    }
  }, [isCreatingSession, hasWork, selectedWorkForSession, showWorkPicker]);
  
  // Auto-select current work when opening session creator
  useEffect(() => {
    if (isCreatingSession && currentWork && !selectedWorkForSession) {
      setSelectedWorkForSession({
        id: currentWork.id,
        title: currentWork.title,
        author: currentWork.author,
        author_folder: currentWork.author_folder,
        segments: state.workspace?.segments || []
      });
      
      // Auto-load results for current work
      loadResultsForWork(currentWork.id, currentWork.title);
    }
  }, [isCreatingSession, currentWork, selectedWorkForSession]);
  
  // Load available results for a work
  const loadResultsForWork = async (workId, workTitle) => {
    setLoadingResults(true);
    try {
      const response = await fetch('/api/results/list');
      const data = await response.json();
      
      // Filter results for this work
      const workResults = data.results.filter(r => 
        r.work_title === workTitle || r.id.includes(workId)
      );
      
      setAvailableResults(workResults);
      
      // Auto-select current results if they match
      if (hasResults && state.results.lastJobId) {
        const currentResultMatch = workResults.find(r => 
          r.id === state.results.lastJobId || r.id.includes(state.results.lastJobId)
        );
        
        if (currentResultMatch) {
          setSelectedResultsForSession([currentResultMatch.id]);
        }
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoadingResults(false);
    }
  };
  
  // Handle work selection
  const handleWorkSelection = (work) => {
    setSelectedWorkForSession(work);
    setShowWorkPicker(false);
    
    // Load results for newly selected work
    loadResultsForWork(work.id, work.title);
  };
  
  // Handle result selection toggle
  const toggleResultSelection = (resultId) => {
    setSelectedResultsForSession(prev => {
      if (prev.includes(resultId)) {
        return prev.filter(id => id !== resultId);
      } else {
        return [...prev, resultId];
      }
    });
  };
  
  // Handle session creation with all selected data
  const handleCreateWithData = () => {
    if (!selectedWorkForSession || !newSessionName.trim()) {
      return;
    }
    
    onCreateSession(sessionNotes, {
      work: selectedWorkForSession,
      selectedResults: selectedResultsForSession,
      includeCurrentResults: hasResults && selectedResultsForSession.includes('current')
    });
  };
  
  if (isCreatingSession) {
    // Determine which work to use
    const workToUse = selectedWorkForSession || (hasWork ? {
      id: currentWork.id,
      title: currentWork.title,
      author: currentWork.author,
      author_folder: currentWork.author_folder,
      segments: state.workspace?.segments || []
    } : null);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900">New Session</h4>
          {workToUse && (
            <button
              onClick={() => setShowWorkPicker(!showWorkPicker)}
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              {showWorkPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showWorkPicker ? 'Hide' : 'Change'} Work
            </button>
          )}
        </div>
        
        {/* Work Picker */}
        {showWorkPicker && (
          <WorkPickerPanel
            authors={authors}
            availableWorks={availableWorks}
            currentSelection={workToUse}
            onSelectWork={handleWorkSelection}
            state={state}
          />
        )}
        
        {/* Selected Work Display */}
        {workToUse ? (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-600 font-semibold mb-1">WORK FOR SESSION</div>
                <div className="font-bold text-sm text-blue-900 truncate">{workToUse.title}</div>
                <div className="text-xs text-blue-700">by {workToUse.author}</div>
                {currentWork?.selected_edition && (
                  <div className="text-xs text-blue-600 mt-1">
                    Edition: {currentWork.selected_edition.date || currentWork.selected_edition.id}
                  </div>
                )}
              </div>
              {workToUse.id !== currentWork?.id && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                  Different
                </span>
              )}
            </div>
            
            <div className="flex gap-2 mt-2 text-xs flex-wrap">
              <span className={`px-2 py-0.5 rounded font-bold ${
                workToUse.segments?.length > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {workToUse.segments?.length || 0} segments
              </span>
            </div>
            
            {(!workToUse.segments || workToUse.segments.length === 0) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                ⚠️ This work has no segments. Create segments in Workspace first.
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">No work selected</span>
            </div>
            <button
              onClick={() => setShowWorkPicker(true)}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
            >
              Select a Work
            </button>
          </div>
        )}
        
        {/* Results Picker */}
        {workToUse && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-purple-600 font-semibold">ANALYSIS RESULTS</div>
              <button
                onClick={() => setShowResultsPicker(!showResultsPicker)}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
              >
                {showResultsPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showResultsPicker ? 'Hide' : 'Select'} Results
              </button>
            </div>
            
            {/* Current Results Quick Add */}
            {hasResults && state.results.lastJobId && (
              <label className="flex items-center gap-2 p-2 bg-white border border-purple-200 rounded hover:bg-purple-50 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={selectedResultsForSession.includes('current')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedResultsForSession(prev => [...prev, 'current']);
                    } else {
                      setSelectedResultsForSession(prev => prev.filter(id => id !== 'current'));
                    }
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-purple-900">Current Results</div>
                  <div className="text-xs text-purple-700">{state.results.patterns?.length || 0} patterns loaded</div>
                </div>
              </label>
            )}
            
            {/* Results Picker Expanded */}
            {showResultsPicker && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {loadingResults ? (
                  <div className="text-center py-4">
                    <Loader className="w-6 h-6 mx-auto mb-2 text-purple-600 animate-spin" />
                    <p className="text-xs text-purple-600">Loading results...</p>
                  </div>
                ) : availableResults.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-500">No saved results found</p>
                    <p className="text-xs text-gray-400 mt-1">Run analysis first</p>
                  </div>
                ) : (
                  availableResults.map(result => (
                    <label
                      key={result.id}
                      className="flex items-start gap-2 p-2 bg-white border border-purple-200 rounded hover:bg-purple-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResultsForSession.includes(result.id)}
                        onChange={() => toggleResultSelection(result.id)}
                        className="w-4 h-4 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-purple-900 truncate">
                          {result.is_multi_edition ? '📚 ' : '📄 '}
                          {result.filename}
                        </div>
                        <div className="text-xs text-purple-700">
                          {result.total_segments} segments
                          {result.is_multi_edition && ` • ${result.edition_count} editions`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
            
            <div className="mt-2 text-xs text-purple-700">
              {selectedResultsForSession.length === 0 ? (
                '⚠️ No results selected (optional)'
              ) : (
                `✓ ${selectedResultsForSession.length} result${selectedResultsForSession.length > 1 ? 's' : ''} selected`
              )}
            </div>
          </div>
        )}
        
        {/* Session Name */}
        <input
          type="text"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="Session name..."
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          autoFocus
          disabled={!workToUse}
        />
        
        {/* Notes */}
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Notes (optional)..."
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
          rows={3}
          disabled={!workToUse}
        />
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCreateWithData}
            disabled={!newSessionName.trim() || !workToUse}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Save Session
          </button>
          <button
            onClick={() => {
              onCancelCreating();
              setSessionNotes('');
              setSelectedWorkForSession(null);
              setSelectedResultsForSession([]);
              setShowWorkPicker(false);
              setShowResultsPicker(false);
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
        
        {/* Summary */}
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="font-semibold mb-1">Session will include:</div>
          <ul className="space-y-0.5 ml-3">
            <li>✓ Work: {workToUse?.title || 'None'}</li>
            <li>✓ Segments: {workToUse?.segments?.length || 0}</li>
            <li>✓ Results: {selectedResultsForSession.length}</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onStartCreating}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Save New Session
      </button>

      {!hasWork && (
        <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Info className="w-4 h-4" />
            <span className="text-sm font-semibold">How to create a session</span>
          </div>
          <ol className="text-xs text-blue-700 space-y-1 ml-1">
            <li>1. Click "Save New Session" above</li>
            <li>2. Select a work (or use current work)</li>
            <li>3. Choose analysis results (optional)</li>
            <li>4. Add notes and save</li>
          </ol>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No saved sessions</p>
          <p className="text-xs text-gray-400 mt-1">Create a session to save your work</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-700 uppercase">Saved Sessions</h4>
          {sessions.map(session => (
            <SessionCard
              key={session.session_id}
              session={session}
              onLoad={() => onLoadSession(session.session_id)}
              onDelete={() => onDeleteSession(session.session_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// WORK PICKER PANEL (UPDATED WITH AUTHOR LOADING)
// ============================================================================

const WorkPickerPanel = ({ authors, availableWorks, currentSelection, onSelectWork, state }) => {
  const { selectAuthor } = useAppState();
  const [selectedAuthor, setSelectedAuthor] = useState(currentSelection?.author_folder || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  
  // Load works when author is selected
  useEffect(() => {
    const loadWorksForAuthor = async () => {
      if (selectedAuthor && selectAuthor) {
        setIsLoadingWorks(true);
        try {
          await selectAuthor(selectedAuthor);
        } catch (error) {
          console.error('Failed to load works:', error);
        } finally {
          setIsLoadingWorks(false);
        }
      }
    };
    
    loadWorksForAuthor();
  }, [selectedAuthor, selectAuthor]);
  
  // Filter works by selected author and search term
  const filteredWorks = availableWorks.filter(work => {
    const matchesAuthor = !selectedAuthor || work.author_folder === selectedAuthor;
    const matchesSearch = !searchTerm || 
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAuthor && matchesSearch;
  });

  return (
    <div className="p-3 bg-white border-2 border-gray-300 rounded-lg max-h-96 overflow-y-auto">
      <h4 className="font-bold text-gray-900 mb-3">Select Work for Session</h4>
      
      {/* Author Filter */}
      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-700 mb-1">
          1. Select Author
        </label>
        <select
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Choose an author...</option>
          {authors.map(author => (
            <option key={author.folder_name} value={author.folder_name}>
              {author.name} ({author.work_count} works)
            </option>
          ))}
        </select>
      </div>
      
      {/* Search */}
      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-700 mb-1">
          2. Search Works {!selectedAuthor && <span className="text-gray-400">(select author first)</span>}
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search works..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
          disabled={!selectedAuthor}
        />
      </div>
      
      {/* Works List */}
      <div className="space-y-2">
        {!selectedAuthor ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            Select an author above to see works
          </div>
        ) : isLoadingWorks ? (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 mx-auto mb-2 text-purple-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading works...</p>
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No works found
          </div>
        ) : (
          filteredWorks.map(work => (
            <button
              key={work.id}
              onClick={() => onSelectWork({
                id: work.id,
                title: work.title,
                author: work.author,
                author_folder: work.author_folder,
                segments: [],
                results: []
              })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                currentSelection?.id === work.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-sm text-gray-900 truncate">
                {work.title}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                by {work.author}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                  {work.line_count} lines
                </span>
                {work.has_segmentation && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-bold">
                    ✓ Segmented
                  </span>
                )}
                {work.edition_count > 1 && (
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-bold">
                    {work.edition_count} editions
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RESULTS SIDEBAR COMPONENT
// ============================================================================

const ResultsSidebar = ({ state }) => {
  const patterns = state.results?.patterns || [];
  const currentWork = state.workspace?.currentSource;

  if (patterns.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">No results yet</p>
        <p className="text-xs text-gray-400 mt-1">Run an analysis to see results</p>
      </div>
    );
  }

  // Group patterns by confidence
  const highConfidence = patterns.filter(p => p.scores.composite >= 70);
  const mediumConfidence = patterns.filter(p => p.scores.composite >= 40 && p.scores.composite < 70);
  const lowConfidence = patterns.filter(p => p.scores.composite < 40);

  return (
    <div className="space-y-4">
      {/* Current Work Info */}
      {currentWork && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
          <div className="font-bold text-sm text-purple-900">{currentWork.title}</div>
          <div className="text-xs text-purple-700">by {currentWork.author}</div>
          <div className="text-xs text-purple-600 mt-1">{patterns.length} patterns found</div>
        </div>
      )}

      {/* Results Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-lg font-bold text-green-700">{highConfidence.length}</div>
          <div className="text-xs text-green-600">High</div>
        </div>
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <div className="text-lg font-bold text-yellow-700">{mediumConfidence.length}</div>
          <div className="text-xs text-yellow-600">Medium</div>
        </div>
        <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-700">{lowConfidence.length}</div>
          <div className="text-xs text-gray-600">Low</div>
        </div>
      </div>

      {/* Top Patterns */}
      <div>
        <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">Top Patterns</h4>
        <div className="space-y-2">
          {patterns.slice(0, 10).map(pattern => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </div>

      {/* Entity Summary */}
      {patterns.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">Top Entities</h4>
          <div className="space-y-1">
            {getTopEntities(patterns).slice(0, 8).map(([entity, count]) => (
              <div key={entity} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 truncate flex-1">{entity}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const PatternCard = ({ pattern }) => (
  <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 transition-all">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-bold text-gray-900 truncate flex-1">
        {pattern.section_name}
      </span>
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
        pattern.scores.composite >= 70 ? 'bg-green-100 text-green-700' :
        pattern.scores.composite >= 40 ? 'bg-yellow-100 text-yellow-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {Math.round(pattern.scores.composite)}
      </span>
    </div>
    <div className="text-xs text-gray-600 truncate">
      {pattern.best_candidate?.decoded_message || 'No decode'}
    </div>
  </div>
);

const SessionCard = ({ session, onLoad, onDelete }) => (
  <div className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-all">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-gray-900 truncate">{session.name}</div>
        <div className="text-xs text-gray-600 truncate">{session.work_title}</div>
      </div>
    </div>
    
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
      <span><Layers className="w-3 h-3 inline" /> {session.segment_count}</span>
      <span><FileText className="w-3 h-3 inline" /> {session.pattern_count}</span>
    </div>
    
    <div className="text-xs text-gray-400 mb-2">
      {new Date(session.updated_at).toLocaleDateString()}
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={onLoad}
        className="flex-1 px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-xs font-semibold"
      >
        <FolderOpen className="w-3 h-3 inline mr-1" />
        Load
      </button>
      <button
        onClick={onDelete}
        className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  </div>
);

// Helper function
const getTopEntities = (patterns) => {
  const entityCounts = {};
  patterns.forEach(p => {
    (p.entities_detected || []).forEach(entity => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });
  });
  return Object.entries(entityCounts).sort((a, b) => b[1] - a[1]);
};

// ============================================================================
// TAB 2: HYPOTHESIS TESTING
// ============================================================================

const HypothesisTab = ({ state, proposeHypothesis, addNotification }) => {
  const [hypothesis, setHypothesis] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const testHypothesis = async () => {
    if (!hypothesis.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      // ✅ Use real API
      const currentWork = state.workspace?.currentSource;
      const result = await proposeHypothesis(
        hypothesis,
        evidence,
        currentWork?.id,
        currentWork?.author
      );
      
      // Map API response to component format
      setResult({
        plausibility: result.plausibility_score || 0,
        confidence: result.confidence_level || 'MEDIUM',
        supporting: result.supporting_evidence || [],
        contradicting: result.contradicting_evidence || [],
        recommendations: result.next_steps || []
      });
    } catch (error) {
      addNotification('error', 'Hypothesis test failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hypothesis Testing</h2>
          <p className="text-gray-600">Test research hypotheses against decoded patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Research Hypothesis
            </label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="e.g., 'Marlowe encoded references to Marina's persecution by Whitgift throughout the 1604 Faustus edition'"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 resize-none"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Supporting Evidence (Optional)
            </label>
            <textarea
              value={evidence.join('\n')}
              onChange={(e) => setEvidence(e.target.value.split('\n').filter(Boolean))}
              placeholder="• Historical document reference
• Cipher pattern observation
• Contemporary correspondence"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 resize-none"
              rows={6}
            />
          </div>

          <button
            onClick={testHypothesis}
            disabled={!hypothesis.trim() || isAnalyzing}
            className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing Hypothesis...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Test Hypothesis
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div>
          {result ? (
            <div className="space-y-4">
              {/* Plausibility Score */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Plausibility Score</h3>
                  <span className={`px-3 py-1 rounded-lg font-bold ${
                    result.confidence === 'HIGH' ? 'bg-green-100 text-green-800' :
                    result.confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.confidence}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-green-700">
                    {result.plausibility}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                        style={{ width: `${result.plausibility}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Supporting Evidence
                </h3>
                <ul className="space-y-2">
                  {result.supporting.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-blue-800">
                      <span className="text-blue-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contradicting Evidence */}
              {result.contradicting.length > 0 && (
                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Potential Issues
                  </h3>
                  <ul className="space-y-2">
                    {result.contradicting.map((item, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-orange-800">
                        <span className="text-orange-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Next Steps
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-purple-800">
                      <span className="text-purple-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Telescope className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Enter a hypothesis to test</p>
                <p className="text-sm mt-2">AI will analyze plausibility against your corpus</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 3: ENTITY NETWORK
// ============================================================================

// ============================================================================
// TAB 4: NARRATIVE SYNTHESIS
// ============================================================================
// ============================================================================
// TAB 4: NARRATIVE SYNTHESIS (FIXED)
// ============================================================================

const NarrativeTab = ({ state, synthesizeNarrative, addNotification }) => {
  const [narrative, setNarrative] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState({
    includeTimeline: true,
    includeNetwork: true,
    includeProfiles: true,
    minConfidence: 70,
    wordCountTarget: 3000
  });
  const sessionNarrativeHistory = state.session?.current?.tabStates?.narrative?.history || [];


const generateNarrative = async () => {
  setIsGenerating(true);
  
  try {
    const currentWork = state.workspace?.currentSource;
    
    if (!currentWork) {
      throw new Error('No work loaded. Please load a work in the Workspace first.');
    }
    
    const result = await synthesizeNarrative(
      currentWork.id,
      currentWork.author,
      options.includeNetwork
    );
    
    const narrativeData = {
      title: result.title || result.narrative?.title || `Analysis of ${currentWork.title}`,
      sections: result.sections || result.narrative?.sections || [],
      timeline: result.timeline || [],
      wordCount: result.word_count || 0,
      generated_at: new Date().toISOString(),
      options: { ...options }
    };
    
    setNarrative(narrativeData);
    
    // ============================================================
    // CRITICAL: Save to session history
    // ============================================================
    if (state.session?.isActive) {
      const currentHistory = state.session.current?.tabStates?.narrative?.history || [];
      
      updateSessionTabState('narrative', {
        narrative: narrativeData,
        options: options,
        history: [...currentHistory, narrativeData]  // ← ADD TO HISTORY
      });
    }
    
    addNotification('success', 'Narrative generated successfully');
    
  } catch (error) {
    console.error('❌ Narrative generation error:', error);
    addNotification('error', 'Narrative generation failed: ' + error.message);
  } finally {
    setIsGenerating(false);
  }
};

  // Check if work is loaded
  const currentWork = state.workspace?.currentSource;
  const isWorkLoaded = !!currentWork?.id;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
      {sessionNarrativeHistory.length > 0 && (
  <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
    <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
      <Clock className="w-5 h-5" />
      Previous Narratives in This Session
    </h3>
    <div className="space-y-2">
      {sessionNarrativeHistory.map((item, idx) => (
        <button
          key={idx}
          onClick={() => setNarrative(item)}
          className="w-full text-left p-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50"
        >
          <div className="text-xs text-purple-600 mb-1">
            {new Date(item.generated_at).toLocaleString()}
          </div>
          <div className="font-semibold text-sm text-purple-900">
            {item.title}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            {item.word_count} words
          </div>
        </button>
      ))}
    </div>
  </div>
)}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
          <FileEdit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Narrative Synthesis</h2>
          <p className="text-gray-600">Generate comprehensive research narrative</p>
        </div>
      </div>

      {/* Show warning if no work loaded */}
      {!isWorkLoaded && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">No Work Loaded</span>
          </div>
          <p className="text-sm text-yellow-700">
            Please load a work in the Workspace before generating a narrative.
          </p>
        </div>
      )}

      {/* Show current work info */}
      {isWorkLoaded && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-semibold mb-1">CURRENT WORK</div>
              <div className="font-bold text-blue-900">{currentWork.title}</div>
              <div className="text-sm text-blue-700">by {currentWork.author}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-600">Results Available</div>
              <div className="text-2xl font-bold text-blue-900">
                {state.results?.patterns?.length || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {!narrative ? (
        <div className="space-y-6">
          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeTimeline}
                onChange={(e) => setOptions({...options, includeTimeline: e.target.checked})}
                className="w-5 h-5"
              />
              <div>
                <div className="font-bold text-sm">Include Timeline</div>
                <div className="text-xs text-gray-600">Chronological event sequence</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeNetwork}
                onChange={(e) => setOptions({...options, includeNetwork: e.target.checked})}
                className="w-5 h-5"
              />
              <div>
                <div className="font-bold text-sm">Entity Network</div>
                <div className="text-xs text-gray-600">Relationship visualization</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeProfiles}
                onChange={(e) => setOptions({...options, includeProfiles: e.target.checked})}
                className="w-5 h-5"
              />
              <div>
                <div className="font-bold text-sm">Character Profiles</div>
                <div className="text-xs text-gray-600">Historical figure details</div>
              </div>
            </label>

            <div className="p-4 border-2 border-gray-200 rounded-xl">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Min Confidence
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={options.minConfidence}
                onChange={(e) => setOptions({...options, minConfidence: Number(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-xs text-gray-600 mt-1">
                {options.minConfidence}%
              </div>
            </div>
          </div>

          <button
            onClick={generateNarrative}
            disabled={isGenerating || !isWorkLoaded}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating Narrative...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Comprehensive Narrative
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div>
              <h3 className="text-xl font-bold text-green-900">{narrative.title}</h3>
              <p className="text-sm text-green-700 mt-1">{narrative.wordCount} words</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(
                    narrative.sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n')
                  );
                  addNotification('success', 'Narrative copied to clipboard');
                }}
                className="px-4 py-2 bg-white border-2 border-green-200 rounded-lg hover:bg-green-50 transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob(
                    [narrative.sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n')],
                    { type: 'text/markdown' }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentWork.title}_narrative.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                  addNotification('success', 'Narrative downloaded');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {narrative.sections.map((section, idx) => (
              <div key={idx} className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <h4 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          {options.includeTimeline && narrative.timeline.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historical Timeline
              </h4>
              <div className="space-y-3">
                {narrative.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 text-right font-bold text-blue-700">{event.year}</div>
                    <div className="w-1 h-12 bg-blue-400 rounded" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{event.event}</div>
                      <div className="text-sm text-gray-600">Confidence: {event.confidence}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setNarrative(null)}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
          >
            Generate New Narrative
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB 5: EDITION COMPARISON (FULLY FIXED)
// ============================================================================
// ============================================================================
// TAB 5: EDITION COMPARISON (FULLY FIXED)
// ============================================================================

const EditionCompareTab = ({ state, compareEditionsWithAI, addNotification, loadAllEditions }) => {
  const [availableEditions, setAvailableEditions] = useState([]);
  const [edition1, setEdition1] = useState(null);
  const [edition2, setEdition2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [mode, setMode] = useState('detailed'); // 'quick' or 'detailed'
  
  // Load available editions for current work
  // Load available editions for current work
useEffect(() => {
  const loadEditions = async () => {
    const currentWork = state.workspace?.currentSource;
    
    if (!currentWork) {
      console.log('No current work loaded');
      return;
    }
    
    if (!currentWork.edition_count || currentWork.edition_count <= 1) {
      console.log('Work has no multiple editions:', currentWork.edition_count);
      return;
    }
    
    try {
      const authorFolder = currentWork.author_folder;
      const baseWorkId = currentWork.base_work_id || currentWork.id.split('_').slice(0, 3).join('_');
      
      console.log('Loading editions for:', { authorFolder, baseWorkId });
      
      // ✅ USE THE loadAllEditions FUNCTION FROM CONTEXT
      const response = await loadAllEditions(authorFolder, baseWorkId);
      
      console.log('Loaded editions:', response.editions);
      setAvailableEditions(response.editions || []);
      
    } catch (error) {
      console.error('Failed to load editions:', error);
      addNotification('error', 'Failed to load editions: ' + error.message);
    }
  };
  
  loadEditions();
}, [state.workspace?.currentSource, addNotification, loadAllEditions]);

  const compareEditions = async () => {
    if (!edition1 || !edition2) {
      addNotification('error', 'Please select both editions to compare');
      return;
    }
    
    setIsComparing(true);
    
    try {
      const currentWork = state.workspace?.currentSource;
      
      console.log('🔍 Edition Comparison Request:');
      console.log('  Edition 1:', edition1);
      console.log('  Edition 2:', edition2);
      console.log('  Mode:', mode);
      console.log('  Author Folder:', currentWork?.author_folder);
      
      const result = await compareEditionsWithAI(
        edition1,
        edition2,
        currentWork?.author_folder || 'Unknown',
        mode
      );
      
      console.log('✅ Comparison result:', result);
      setComparison(result);
      
      addNotification('success', 'Edition comparison complete');
      
    } catch (error) {
      console.error('❌ Comparison error:', error);
      addNotification('error', 'Edition comparison failed: ' + error.message);
    } finally {
      setIsComparing(false);
    }
  };

  // Check if current work supports edition comparison
  const currentWork = state.workspace?.currentSource;
  const canCompare = currentWork && currentWork.edition_count > 1;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
          <GitCompare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edition Comparison</h2>
          <p className="text-gray-600">AI-powered differential analysis</p>
        </div>
      </div>

      {/* Show warning if work doesn't support comparison */}
      {!canCompare && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Edition Comparison Not Available</span>
          </div>
          <p className="text-sm text-yellow-700">
            {!currentWork 
              ? 'Please load a work in the Workspace first.'
              : 'This work has only one edition. Select a work with multiple editions to compare.'}
          </p>
        </div>
      )}

      {/* Show current work info */}
      {currentWork && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-semibold mb-1">CURRENT WORK</div>
              <div className="font-bold text-blue-900">{currentWork.title}</div>
              <div className="text-sm text-blue-700">by {currentWork.author}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-600">Available Editions</div>
              <div className="text-2xl font-bold text-blue-900">
                {currentWork.edition_count || 1}
              </div>
            </div>
          </div>
        </div>
      )}

      {!comparison ? (
        <div className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Comparison Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('quick')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  mode === 'quick'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Zap className="w-5 h-5 inline mr-2" />
                Quick Scan
              </button>
              <button
                onClick={() => setMode('detailed')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  mode === 'detailed'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Search className="w-5 h-5 inline mr-2" />
                Deep Analysis
              </button>
            </div>
          </div>

          {/* Edition Selectors */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Edition
              </label>
              <select
                value={edition1 || ''}
                onChange={(e) => setEdition1(e.target.value)}
                disabled={!canCompare || availableEditions.length === 0}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {availableEditions.length === 0 
                    ? 'No editions available...' 
                    : 'Select first edition...'}
                </option>
                {availableEditions.map(ed => (
                  <option key={ed.id} value={ed.id}>
                    {ed.date || ed.id} {ed.publisher ? `(${ed.publisher})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Second Edition
              </label>
              <select
                value={edition2 || ''}
                onChange={(e) => setEdition2(e.target.value)}
                disabled={!canCompare || availableEditions.length === 0}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {availableEditions.length === 0 
                    ? 'No editions available...' 
                    : 'Select second edition...'}
                </option>
                {availableEditions.filter(e => e.id !== edition1).map(ed => (
                  <option key={ed.id} value={ed.id}>
                    {ed.date || ed.id} {ed.publisher ? `(${ed.publisher})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading state for editions */}
          {canCompare && availableEditions.length === 0 && (
            <div className="text-center py-4">
              <Loader className="w-8 h-8 mx-auto mb-2 text-orange-600 animate-spin" />
              <p className="text-sm text-gray-500">Loading editions...</p>
            </div>
          )}

          <button
            onClick={compareEditions}
            disabled={!edition1 || !edition2 || isComparing || !canCompare}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
          >
            {isComparing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Comparing Editions...
              </>
            ) : (
              <>
                <GitCompare className="w-5 h-5" />
                Compare Editions with AI
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard 
              label="Total Segments" 
              value={comparison.statistics?.totalSegments || comparison.total_segments || 0} 
              color="blue" 
            />
            <StatCard 
              label="Identical" 
              value={comparison.statistics?.identicalSegments || comparison.identical_count || 0} 
              color="green" 
            />
            <StatCard 
              label="Minor Changes" 
              value={comparison.statistics?.minorChanges || comparison.minor_changes || 0} 
              color="yellow" 
            />
            <StatCard 
              label="Major Changes" 
              value={comparison.statistics?.majorChanges || comparison.major_changes || 0} 
              color="red" 
            />
          </div>

          {/* AI Interpretation */}
          {(comparison.aiInterpretation || comparison.ai_summary) && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-purple-900">AI Interpretation</h3>
                {(comparison.aiInterpretation?.intentionality || comparison.intentionality_score) && (
                  <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold">
                    {comparison.aiInterpretation?.intentionality || comparison.intentionality_score}% Intentionality
                  </div>
                )}
              </div>
              <p className="text-purple-900">
                {comparison.aiInterpretation?.summary || comparison.ai_summary || 'No interpretation available'}
              </p>
            </div>
          )}

          {/* Differences - Check if we have any */}
          {(() => {
            const differences = comparison.differences || comparison.key_differences || [];
            const hasDifferences = differences.length > 0;
            
            return hasDifferences ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Key Differences</h3>
                {differences.map((diff, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-gray-900">
                        {diff.segment || diff.segment_name || `Segment ${idx + 1}`}
                      </span>
                      <span className={`px-3 py-1 rounded-lg font-bold text-xs ${
                        (diff.significance || diff.change_type) === 'high' || (diff.significance || diff.change_type) === 'major' 
                          ? 'bg-red-100 text-red-800' :
                        (diff.significance || diff.change_type) === 'medium' || (diff.significance || diff.change_type) === 'minor'
                          ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {(diff.significance || diff.change_type || 'unknown').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-blue-700 font-bold mb-1">Edition 1</div>
                        <div className="font-mono text-sm whitespace-pre-wrap">
                          {diff.edition1Text || diff.edition_1_text || 'No text'}
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-xs text-orange-700 font-bold mb-1">Edition 2</div>
                        <div className="font-mono text-sm whitespace-pre-wrap">
                          {diff.edition2Text || diff.edition_2_text || 'No text'}
                        </div>
                      </div>
                    </div>
                    
                    {(diff.interpretation || diff.ai_interpretation) && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="text-xs text-purple-700 font-bold mb-1">AI Interpretation</div>
                        <div className="text-sm text-purple-900">
                          {diff.interpretation || diff.ai_interpretation}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-semibold text-gray-700">No significant differences found</p>
                <p className="text-sm text-gray-500 mt-2">
                  The editions appear to be identical or have only minimal variations
                </p>
              </div>
            );
          })()}

          <button
            onClick={() => {
              setComparison(null);
              setEdition1(null);
              setEdition2(null);
            }}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
          >
            New Comparison
          </button>
        </div>
      )}
    </div>
  );
};
// ============================================================================
// TAB 6: SEGMENT ANALYSIS
// ============================================================================

const SegmentAnalysisTab = ({ state, analyzeSegmentWithAI, addNotification }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const segments = state.results.patterns.slice(0, 10);

    const analyzeSegment = async () => {
    setIsAnalyzing(true);
    
    try {
      // ✅ Use real API
      const result = await analyzeSegmentWithAI(
        selectedSegment.segment_id,
        selectedSegment.original_text,
        selectedSegment.decode_results,
        question.trim() || null
      );
      
      setAnalysis({
        summary: result.summary || '',
        entities: result.key_entities || [],
        historicalContext: result.historical_context || '',
        alternativeInterpretations: result.alternative_readings || []
      });
    } catch (error) {
      addNotification('error', 'Segment analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deep Segment Analysis</h2>
          <p className="text-gray-600">AI-powered segment interrogation</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Segment Selector */}
        <div className="col-span-1">
          <h3 className="font-bold text-gray-900 mb-3">Select Segment</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {segments.map(seg => (
              <button
                key={seg.id}
                onClick={() => setSelectedSegment(seg)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedSegment?.id === seg.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="font-bold text-sm mb-1">{seg.section_name}</div>
                <div className="text-xs text-gray-600">{seg.original_text.slice(0, 40)}...</div>
                <div className="text-xs text-indigo-600 font-bold mt-1">
                  Score: {seg.scores.composite}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="col-span-2">
          {selectedSegment ? (
            <div className="space-y-4">
              {/* Segment Info */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
                <h4 className="font-bold text-indigo-900 mb-2">{selectedSegment.section_name}</h4>
                <div className="font-mono text-sm bg-white p-3 rounded-lg border border-indigo-200">
                  {selectedSegment.original_text}
                </div>
                <div className="mt-2 text-sm text-indigo-700">
                  Best decode: <span className="font-bold">{selectedSegment.best_candidate?.decoded_message}</span>
                </div>
              </div>

              {/* Question Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ask a Question (Optional)
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., 'What historical events does this reference?' or leave blank for general analysis"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={analyzeSegment}
                disabled={isAnalyzing}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Analyze with AI
                  </>
                )}
              </button>

              {/* Analysis Results */}
              {analysis && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-white border-2 border-indigo-200 rounded-xl">
                    <h4 className="font-bold text-indigo-900 mb-2">Summary</h4>
                    <p className="text-gray-700">{analysis.summary}</p>
                  </div>

                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <h4 className="font-bold text-blue-900 mb-2">Historical Context</h4>
                    <p className="text-blue-900">{analysis.historicalContext}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                    <h4 className="font-bold text-purple-900 mb-2">Alternative Interpretations</h4>
                    <ul className="space-y-1">
                      {analysis.alternativeInterpretations.map((interp, idx) => (
                        <li key={idx} className="text-sm text-purple-900 flex gap-2">
                          <span className="text-purple-500">•</span>
                          {interp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Select a segment to analyze</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 7: REPORT GENERATOR
// ============================================================================

const ReportTab = ({ state, exportResearchReport, addNotification }) => {
  const [reportConfig, setReportConfig] = useState({
    includeNarrative: true,
    includeNetwork: true,
    includeRawData: false,
    includeStatistics: true,
    format: 'markdown'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Check if work is loaded
  const currentWork = state.workspace?.currentSource;
  const isWorkLoaded = !!currentWork?.id;
  
  if (!isWorkLoaded) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Work Loaded</h3>
          <p className="text-gray-600">
            Please load a work in the Workspace before generating a report.
          </p>
        </div>
      </div>
    );
  }
  
const generateReport = async () => {
  setIsGenerating(true);
  
  try {
    // Get current work context
    const currentWork = state.workspace?.currentSource;
    if (!currentWork) {
      throw new Error('No work loaded');
    }
    
    const workId = currentWork.id;
    const author = currentWork.author;
    
    console.log('📄 Generating research report...', {
      workId,
      author,
      options: reportConfig
    });
    
    // Call the actual API through context
    const result = await exportResearchReport(
      workId,
      author,
      {
        includeNarrative: reportConfig.includeNarrative,
        includeNetwork: reportConfig.includeNetwork,
        includeRawData: reportConfig.includeRawData,
        format: reportConfig.format
      }
    );
    
    console.log('✅ Report generated:', result);
    
    // The exportResearchReport function already handles the download
    // Just show success message
    addNotification('success', `Report downloaded: ${result.filename}`);
    
  } catch (error) {
    console.error('❌ Report generation error:', error);
    addNotification('error', 'Report generation failed: ' + error.message);
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Generator</h2>
          <p className="text-gray-600">Export publication-ready research report</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer">
            <input
              type="checkbox"
              checked={reportConfig.includeNarrative}
              onChange={(e) => setReportConfig({...reportConfig, includeNarrative: e.target.checked})}
              className="w-5 h-5"
            />
            <div>
              <div className="font-bold text-sm">Narrative Synthesis</div>
              <div className="text-xs text-gray-600">AI-generated prose</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer">
            <input
              type="checkbox"
              checked={reportConfig.includeNetwork}
              onChange={(e) => setReportConfig({...reportConfig, includeNetwork: e.target.checked})}
              className="w-5 h-5"
            />
            <div>
              <div className="text-xs text-gray-600">Relationship diagrams</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer">
            <input
              type="checkbox"
              checked={reportConfig.includeStatistics}
              onChange={(e) => setReportConfig({...reportConfig, includeStatistics: e.target.checked})}
              className="w-5 h-5"
            />
            <div>
              <div className="font-bold text-sm">Statistics Tables</div>
              <div className="text-xs text-gray-600">Quantitative analysis</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer">
            <input
              type="checkbox"
              checked={reportConfig.includeRawData}
              onChange={(e) => setReportConfig({...reportConfig, includeRawData: e.target.checked})}
              className="w-5 h-5"
            />
            <div>
              <div className="font-bold text-sm">Raw Data Appendix</div>
              <div className="text-xs text-gray-600">Complete segment data</div>
            </div>
          </label>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Export Format
          </label>
          <select
            value={reportConfig.format}
            onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
          >
            <option value="markdown">Markdown(.md)</option>
<option value="pdf">PDF (.pdf)</option>
<option value="docx">Word (.docx)</option>
<option value="html">HTML (.html)</option>
</select>
</div>
    <button
      onClick={generateReport}
      disabled={isGenerating}
      className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-2"
    >
      {isGenerating ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Generate & Download Report
        </>
      )}
    </button>
  </div>
</div>
);
};


// ============================================================================
// HELPER COMPONENTS
// ============================================================================
const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
    green: 'from-green-50 to-green-100 border-green-200 text-green-900',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900',
    red: 'from-red-50 to-red-100 border-red-200 text-red-900'
  };
  return (
    <div className={`p-4 rounded-xl border-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  );
};

const MessageBubble = ({ message }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
      message.role === 'user'
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
        : 'bg-white border-2 border-gray-200 text-gray-900'
    }`}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>
);

const TypingIndicator = () => (
  <div className="flex justify-start mb-4">
    <div className="bg-white border-2 border-gray-200 rounded-2xl px-5 py-3">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const WorkCard = ({ work, selected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
      selected
        ? 'border-purple-500 bg-purple-50'
        : 'border-gray-200 hover:border-purple-300'
    }`}
  >
    <div className="font-bold text-sm mb-1">{work.title}</div>
    <div className="text-xs text-gray-600">{work.author}</div>
    <div className="mt-2 flex items-center gap-2">
      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
        {work.segmentCount} segments
      </span>
      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">
        Avg: {Math.round(work.avgScore)}
      </span>
    </div>
  </button>
);




// ============================================================================
// TAB COMPONENT MAPPING
// ============================================================================
const TAB_COMPONENTS = {
chat: ChatTab,
hypothesis: HypothesisTab,
narrative: NarrativeTab,
compare: EditionCompareTab,
segment: SegmentAnalysisTab,
report: ReportTab
};
export default AIResearchAssistant;