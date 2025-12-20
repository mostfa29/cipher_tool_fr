// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from './context/AppContext';
import AIViewComponent from './AIView/AIView';

// AppShell Components
import Navigation from './AppShell/Navigation';
import SettingsModal from './AppShell/SettingsModal';
import HelpSystem from './AppShell/HelpSystem';

// WorkspaceView Components
import SourcePicker from './WorkspaceView/SourcePicker';
import VirtualizedTextDisplay from './WorkspaceView/VirtualizedTextDisplay';
import EnhancedSegmentationTool from './WorkspaceView/EnhancedSegmentationTool';
import AIEnhancementModal from './AppShell/AIEnhancementModal';

// AnalyzeView Components
import MethodSelector from './AnalyzeView/MethodSelector';
import ViewModeToggle from './AnalyzeView/ViewModeToggle';
import FilterPanel from './AnalyzeView/FilterPanel';
import ProgressTracker from './AnalyzeView/ProgressTracker';

// ResultsView Components
import FilterBar from './ResultsView/FilterBar';
import ResultCard from './ResultsView/ResultCard';
import ExportControls from './ResultsView/ExportControls';

// LibraryView Components
import SourceCard from './LibraryView/SourceCard';
import SessionCard from './LibraryView/SessionCard';
import SearchBar from './LibraryView/SearchBar';

// Icons
import { 
  FileText, Layers, AlertCircle, CheckCircle, Sparkles, TrendingUp,
  Edit2, Zap, BarChart3, BookOpen, Clock, Target, Award, ArrowRight,
  Save, RefreshCw, Plus, Trash2, X
} from 'lucide-react';
import ResultsView from './ResultsView/ResultsView';

// ============================================================================
// CONSTANTS
// ============================================================================
const WORKSPACE_LAYOUTS = {
  SPLIT: 'split',
  FULL_EDITOR: 'full-editor',
  PREVIEW: 'preview'
};

const VIEWS = {
  WORKSPACE: 'workspace',
  ANALYZE: 'analyze',
  RESULTS: 'results',
  LIBRARY: 'library',
  AI_CHAT: 'ai_chat'  // NEW

};

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function App() {
  const { state, dispatch, startAnalysis, exportResults, saveSegmentation } = useAppState();
  
  // Local UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState(WORKSPACE_LAYOUTS.SPLIT);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const currentSegments = useComputedSegments(state.workspace);
  const segmentStats = useSegmentStats(currentSegments);
  const highConfidenceResults = useHighConfidenceResults(state.results.patterns);
  const resultsByAuthor = useResultsByAuthor(state.results.patterns);
  const totalWorks = useTotalWorks(resultsByAuthor);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useSegmentSync(currentSegments, state.workspace.currentSource?.id, dispatch);
  useKeyboardShortcuts({
    showSettings,
    showHelp,
    activeView: state.ui.activeView,
    workspaceLayout,
    currentSourceId: state.workspace.currentSource?.id,
    setShowSettings,
    setShowHelp,
    setWorkspaceLayout,
    saveSegmentation,
    handleNavigate: useNavigateCallback(dispatch, state.ui.hasUnsavedChanges)
  });

  // ============================================================================
  // CALLBACKS
  // ============================================================================
  const handleNavigate = useNavigateCallback(dispatch, state.ui.hasUnsavedChanges);
  const handleBoundariesChange = useBoundariesChangeCallback(dispatch);
  const handleSegmentsChange = useSegmentsChangeCallback(dispatch);
  const createQuickSegmentation = useQuickSegmentationCallback(
    state.workspace.currentSource,
    dispatch
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <Navigation
        activeView={state.ui.activeView}
        onNavigate={handleNavigate}
        hasUnsavedChanges={state.ui.hasUnsavedChanges}
        isProcessing={state.analyze.currentJob?.status === 'processing'}
        processingProgress={state.analyze.currentJob?.progress || 0}
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
        resultCount={state.results.patterns.length}
        highConfidenceCount={highConfidenceResults.length}
      />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-screen-2xl">
        <ViewRouter
          activeView={state.ui.activeView}
          state={state}
          dispatch={dispatch}
          workspaceLayout={workspaceLayout}
          setWorkspaceLayout={setWorkspaceLayout}
          currentSegments={currentSegments}
          segmentStats={segmentStats}
          highConfidenceResults={highConfidenceResults}
          resultsByAuthor={resultsByAuthor}
          totalWorks={totalWorks}
          handleNavigate={handleNavigate}
          handleBoundariesChange={handleBoundariesChange}
          handleSegmentsChange={handleSegmentsChange}
          createQuickSegmentation={createQuickSegmentation}
          saveSegmentation={saveSegmentation}
          startAnalysis={startAnalysis}
          exportResults={exportResults}
        />
      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      <HelpSystem 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)}
        currentView={state.ui.activeView}
      />

      <NotificationContainer 
        notifications={state.ui.notifications}
        onDismiss={(id) => dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id })}
      />
    </div>
  );
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useComputedSegments(workspace) {
  return useMemo(() => {
    if (!workspace.currentSource?.lines || !workspace.boundaries) {
      return [];
    }

    const { lines } = workspace.currentSource;
    const { boundaries } = workspace;
    
    return boundaries.slice(0, -1).map((start, i) => {
      const end = boundaries[i + 1];
      const segmentLines = lines.slice(start, end);
      const text = segmentLines.join('\n');
      const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      
      const idealLength = 150;
      const distance = Math.abs(letterCount - idealLength);
      const quality = Math.max(0, 100 - (distance / idealLength) * 100);
      
      return {
        id: `segment_${start}_${end}`,
        name: `Lines ${start + 1}-${end}`,
        start_line: start,
        end_line: end - 1,
        startLine: start,
        endLine: end,
        lineCount: end - start,
        text,
        lines: segmentLines,
        letterCount,
        wordCount,
        quality: Math.round(quality),
        isValid: letterCount >= 50 && letterCount <= 1000,
        hasEndPunctuation: /[.!?]$/.test(text.trim()),
      };
    });
  }, [workspace.currentSource, workspace.boundaries]);
}

function useSegmentStats(segments) {
  return useMemo(() => {
    if (segments.length === 0) return null;
    
    const valid = segments.filter(s => s.isValid);
    const letterCounts = segments.map(s => s.letterCount);
    const qualities = segments.map(s => s.quality);
    
    return {
      total: segments.length,
      valid: valid.length,
      invalid: segments.length - valid.length,
      avgLetters: Math.round(letterCounts.reduce((a, b) => a + b, 0) / letterCounts.length),
      minLetters: Math.min(...letterCounts),
      maxLetters: Math.max(...letterCounts),
      avgQuality: Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length),
      totalWords: segments.reduce((sum, s) => sum + s.wordCount, 0),
      validityPercent: Math.round((valid.length / segments.length) * 100),
    };
  }, [segments]);
}

function useHighConfidenceResults(patterns) {
  return useMemo(
    () => patterns.filter(r => r.scores?.composite >= 70),
    [patterns]
  );
}

function useResultsByAuthor(patterns) {
  return useMemo(() => {
    const grouped = {};
    
    patterns.forEach(pattern => {
      const author = pattern.metadata?.author || 'Unknown Author';
      const workTitle = pattern.metadata?.work_title || 'Unknown Work';
      
      if (!grouped[author]) grouped[author] = {};
      if (!grouped[author][workTitle]) grouped[author][workTitle] = [];
      
      grouped[author][workTitle].push(pattern);
    });
    
    return grouped;
  }, [patterns]);
}

function useTotalWorks(resultsByAuthor) {
  return useMemo(() => {
    return Object.values(resultsByAuthor).reduce(
      (count, works) => count + Object.keys(works).length,
      0
    );
  }, [resultsByAuthor]);
}

function useSegmentSync(segments, currentSourceId, dispatch) {
  useEffect(() => {
    if (segments.length > 0 && currentSourceId) {
      dispatch({ type: ACTIONS.SET_SEGMENTS, payload: segments });
    }
  }, [segments, currentSourceId, dispatch]);
}

function useNavigateCallback(dispatch, hasUnsavedChanges) {
  return useCallback((viewName) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: viewName });
    if (hasUnsavedChanges) {
      dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    }
  }, [dispatch, hasUnsavedChanges]);
}

function useBoundariesChangeCallback(dispatch) {
  return useCallback((newBoundaries) => {
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: true });
  }, [dispatch]);
}

function useSegmentsChangeCallback(dispatch) {
  return useCallback((segments) => {
    dispatch({ type: ACTIONS.SET_SEGMENTS, payload: segments });
  }, [dispatch]);
}

function useQuickSegmentationCallback(activeSource, dispatch) {
  return useCallback((linesPerSegment = 3) => {
    if (!activeSource?.lines) return;
    
    const { lines } = activeSource;
    const newBoundaries = [0];
    
    for (let i = linesPerSegment; i < lines.length; i += linesPerSegment) {
      newBoundaries.push(i);
    }
    newBoundaries.push(lines.length);
    
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: NOTIFICATION_TYPES.SUCCESS,
        message: `Created ${newBoundaries.length - 1} segments (${linesPerSegment} lines each)`,
        duration: 2500
      }
    });
  }, [activeSource, dispatch]);
}

function useKeyboardShortcuts(options) {
  const {
    showSettings,
    showHelp,
    activeView,
    workspaceLayout,
    currentSourceId,
    setShowSettings,
    setShowHelp,
    setWorkspaceLayout,
    saveSegmentation,
    handleNavigate
  } = options;

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showSettings || showHelp) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleNavigate(VIEWS.WORKSPACE);
            break;
          case '2':
            e.preventDefault();
            handleNavigate(VIEWS.ANALYZE);
            break;
          case '3':
            e.preventDefault();
            handleNavigate(VIEWS.RESULTS);
            break;
          case '4':
            e.preventDefault();
            handleNavigate(VIEWS.LIBRARY);
            break;
          case 'l':
            if (activeView === VIEWS.WORKSPACE) {
              e.preventDefault();
              setWorkspaceLayout(prev => 
                prev === WORKSPACE_LAYOUTS.SPLIT ? WORKSPACE_LAYOUTS.FULL_EDITOR :
                prev === WORKSPACE_LAYOUTS.FULL_EDITOR ? WORKSPACE_LAYOUTS.PREVIEW :
                WORKSPACE_LAYOUTS.SPLIT
              );
            }
            break;
          case 's':
            if (activeView === VIEWS.WORKSPACE && currentSourceId) {
              e.preventDefault();
              saveSegmentation();
            }
            break;
          case ',':
            e.preventDefault();
            setShowSettings(true);
            break;
          case '/':
            e.preventDefault();
            setShowHelp(true);
            break;
        }
      }

      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else if (showHelp) setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    showSettings,
    showHelp,
    activeView,
    workspaceLayout,
    currentSourceId,
    setShowSettings,
    setShowHelp,
    setWorkspaceLayout,
    saveSegmentation,
    handleNavigate
  ]);
}

// ============================================================================
// VIEW ROUTER COMPONENT
// ============================================================================
function ViewRouter(props) {
  const { activeView } = props;

  switch (activeView) {
    case VIEWS.WORKSPACE:
      return <WorkspaceView {...props} />;
    case VIEWS.ANALYZE:
      return <AnalyzeView {...props} />;
    case VIEWS.RESULTS:
      return <ResultsView {...props} />;
    case VIEWS.LIBRARY:
      return <LibraryView {...props} />;
    case VIEWS.AI_CHAT:  // NEW
      return <AIViewComponent />;
    default:
      return <NotFoundView />;
  }
}

function WorkspaceView(props) {
  const {
    state,
    dispatch,
    currentSegments,
    segmentStats,
    handleNavigate,
    handleBoundariesChange,
    handleSegmentsChange,
    createQuickSegmentation,
    saveSegmentation
  } = props;

  const { activeSource } = state.workspace;

  if (!activeSource) {
    return (
      <div className="space-y-6">
        <WorkspaceHeader 
          activeSource={null}
          hasUnsavedChanges={false}
          onChangeText={() => dispatch({ type: ACTIONS.CLEAR_WORKSPACE })}
          hasSavedSegments={false}
          handleNavigate={handleNavigate}
        />
        <div className="max-w-5xl mx-auto">
          <SourcePicker 
            onSourceSelect={() => {}}
            selectedSourceId={null}
          />
        </div>
      </div>
    );
  }

  // Show enhanced segmentation tool directly
  return (
    <div className="space-y-6">
      <WorkspaceHeader 
        activeSource={activeSource}
        hasUnsavedChanges={state.ui.hasUnsavedChanges}
        onChangeText={() => dispatch({ type: ACTIONS.CLEAR_WORKSPACE })}
        hasSavedSegments={state.workspace.segments?.length > 0}
        handleNavigate={handleNavigate}
      />
      <EnhancedSegmentationTool
        source={activeSource}
        boundaries={state.workspace.boundaries || []}
        segments={state.workspace.segments || []}
        onBoundariesChange={handleBoundariesChange}
        onSegmentsChange={handleSegmentsChange}
        onBack={() => dispatch({ type: ACTIONS.CLEAR_WORKSPACE })}
        saveSegmentation={saveSegmentation}
        hasUnsavedChanges={state.ui.hasUnsavedChanges}
        onAnalyze={() => {
          if (state.workspace.segments?.length > 0) {
            handleNavigate('analyze');
          }
        }}
      />
    </div>
  );
}

function AnalyzeView(props) {
  const {
    state,
    dispatch,
    currentSegments,
    handleNavigate,
    startAnalysis
  } = props;

  return (
    <div className="space-y-6">
      <AnalyzeHeader currentSource={state.workspace.currentSource} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AnalyzeSidebar
            state={state}
            dispatch={dispatch}
            handleNavigate={handleNavigate}
          />
        </div>

        <div className="lg:col-span-2">
          <AnalyzeMainContent
            state={state}
            dispatch={dispatch}
            currentSegments={currentSegments}
            handleNavigate={handleNavigate}
            startAnalysis={startAnalysis}
          />
        </div>
      </div>
    </div>
  );
}


function LibraryView(props) {
  const { state, dispatch, handleNavigate } = props;

  return (
    <div className="space-y-6">
      <LibraryHeader />

      <SearchBar
        value={state.library.searchQuery || ''}
        onChange={(query) => dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: query })}
        placeholder="Search authors and works..."
        suggestions={[]}
        showSuggestions={false}
      />

      <LibraryTabs
        activeTab={state.library.activeTab}
        authorsCount={state.library.authors?.length || 0}
        sessionsCount={state.library.savedSessions?.length || 0}
        dispatch={dispatch}
      />

      {state.library.activeTab === 'sources' ? (
        <LibrarySourcesContent state={state} dispatch={dispatch} />
      ) : (
        <LibrarySessionsContent
          state={state}
          handleNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">View Not Found</h1>
      <p className="text-gray-600">The requested view does not exist.</p>
    </div>
  );
}

// ============================================================================
// WORKSPACE SUB-COMPONENTS
// ============================================================================
function WorkspaceHeader({ activeSource, hasUnsavedChanges, onChangeText, hasSavedSegments, handleNavigate }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Edit2 className="w-8 h-8 text-white" />
          </div>
          Workspace
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          {activeSource 
            ? `Editing: ${activeSource.title} by ${activeSource.author}`
            : 'Select and prepare your source text for analysis'
          }
        </p>
      </div>
      
      {activeSource && (
        <div className="flex items-center gap-3">
          <button
            onClick={onChangeText}
            className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 font-semibold text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Change Text
          </button>
          
          {hasSavedSegments && (
            <button
              onClick={() => handleNavigate('analyze')}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 font-semibold text-sm flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Proceed to Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LayoutButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-md'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
      }`}
      title={label}
    >
      <Icon className="w-4 h-4 inline mr-1.5" />
      {label}
    </button>
  );
}

function WorkspaceSidebar({
  activeSource,
  segmentStats,
  hasUnsavedChanges,
  setWorkspaceLayout,
  createQuickSegmentation,
  saveSegmentation,
  dispatch
}) {
  return (
    <div className="sticky top-6 space-y-4">
      <SourcePicker 
        onSourceSelect={() => {}}
        selectedSourceId={activeSource?.id}
        compact={true}
      />

      <QuickActionsPanel
        setWorkspaceLayout={setWorkspaceLayout}
        createQuickSegmentation={createQuickSegmentation}
        hasUnsavedChanges={hasUnsavedChanges}
        saveSegmentation={saveSegmentation}
        activeSource={activeSource}
        dispatch={dispatch}
      />

      {segmentStats && <StatisticsPanel stats={segmentStats} />}

      <TipsPanel />
    </div>
  );
}

function QuickActionsPanel({
  setWorkspaceLayout,
  createQuickSegmentation,
  hasUnsavedChanges,
  saveSegmentation,
  activeSource,
  dispatch
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-blue-600" />
        Quick Actions
      </h3>
      <div className="space-y-2">
        <QuickActionButton
          onClick={() => setWorkspaceLayout(WORKSPACE_LAYOUTS.FULL_EDITOR)}
          icon={Zap}
          iconColor="text-blue-600"
          gradient="from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200"
        >
          Open Full Editor
        </QuickActionButton>

        <QuickActionButton
          onClick={() => createQuickSegmentation(3)}
          icon={Sparkles}
          iconColor="text-blue-600"
          gradient="from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
        >
          Quick Segment (3 lines)
        </QuickActionButton>

        <QuickActionButton
          onClick={() => createQuickSegmentation(5)}
          icon={Sparkles}
          iconColor="text-purple-600"
          gradient="from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
        >
          Quick Segment (5 lines)
        </QuickActionButton>

        <QuickActionButton
          onClick={() => {
            const lines = activeSource.lines;
            dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: [0, lines.length] });
          }}
          icon={Trash2}
          iconColor="text-red-700"
          gradient="from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100"
        >
          Clear All Segments
        </QuickActionButton>

        {hasUnsavedChanges && (
          <QuickActionButton
            onClick={saveSegmentation}
            icon={Save}
            iconColor="text-white"
            gradient="from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            textColor="text-white"
            shadow="shadow-md hover:shadow-lg"
          >
            Save Changes
          </QuickActionButton>
        )}
      </div>
    </div>
  );
}

function QuickActionButton({ onClick, icon: Icon, iconColor, gradient, textColor = "text-gray-700", shadow = "shadow-sm hover:shadow", children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-sm font-semibold ${textColor} bg-gradient-to-r ${gradient} rounded-xl transition-all text-left flex items-center gap-2 ${shadow}`}
    >
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {children}
    </button>
  );
}

function StatisticsPanel({ stats }) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-md border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        Statistics
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total" value={stats.total} color="text-blue-600" />
          <StatCard label="Valid" value={stats.valid} color="text-green-600" />
        </div>
        
        <div className="space-y-2 text-sm">
          <StatRow label="Avg Letters:" value={stats.avgLetters} />
          <StatRow label="Avg Quality:" value={`${stats.avgQuality}%`} valueColor="text-blue-600" />
          <StatRow label="Range:" value={`${stats.minLetters} - ${stats.maxLetters}`} />
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Validity</span>
            <span className="font-bold text-gray-900">{stats.validityPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.validityPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function StatRow({ label, value, valueColor = "text-gray-900" }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

function TipsPanel() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-5">
      <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Quick Tips
      </h3>
      <ul className="text-xs text-indigo-800 space-y-2">
        <TipItem>Click between lines to add boundaries</TipItem>
        <TipItem>Valid segments: 50-1000 letters</TipItem>
        <TipItem>Use Full Editor for advanced tools</TipItem>
        <TipItem>
          <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono">Ctrl+L</kbd> to toggle layout
        </TipItem>
        <TipItem>
          <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono">Ctrl+S</kbd> to save work
        </TipItem>
      </ul>
    </div>
  );
}

function TipItem({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-indigo-400 mt-0.5">▸</span>
      <span>{children}</span>
    </li>
  );
}

function WorkspaceActionBar({ currentSegments, handleNavigate }) {
  const validCount = currentSegments.filter(s => s.isValid).length;
  const invalidCount = currentSegments.length - validCount;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <ActionBarStat icon={Layers} label="Segments" value={currentSegments.length} color="text-gray-900" />
          <ActionBarStat icon={CheckCircle} label="Valid" value={validCount} color="text-green-600" />
          {invalidCount > 0 && (
            <ActionBarStat icon={AlertCircle} label="Invalid" value={invalidCount} color="text-red-600" />
          )}
        </div>
        
        <button
          onClick={() => handleNavigate(VIEWS.ANALYZE)}
          disabled={validCount === 0}
          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${
            validCount > 0
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Proceed to Analysis
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ActionBarStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color === 'text-gray-900' ? 'text-blue-600' : color}`} />
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function SegmentList({ segments }) {
  if (segments.length === 0) {
    return (
      <div className="sticky top-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
            <Layers className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No segments yet</p>
          <p className="text-gray-400 text-sm">Create segments to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Segments
          </span>
          <span className="text-blue-600">{segments.length}</span>
        </h3>
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {segments.map((seg, idx) => (
            <SegmentCard key={seg.id} segment={seg} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentCard({ segment, index }) {
  return (
    <div
      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
        segment.isValid
          ? 'border-green-200 bg-green-50 hover:border-green-400'
          : 'border-red-200 bg-red-50 hover:border-red-400'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-gray-900">#{index + 1}</span>
        <div className="flex items-center gap-1.5">
          {segment.hasEndPunctuation && (
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          )}
          <span className={`text-xs font-bold ${
            segment.quality >= 80 ? 'text-green-600' :
            segment.quality >= 60 ? 'text-blue-600' :
            segment.quality >= 40 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {segment.quality}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="px-2 py-0.5 bg-white rounded">{segment.letterCount}L</span>
        <span className="px-2 py-0.5 bg-white rounded">{segment.wordCount}W</span>
        <span className="px-2 py-0.5 bg-white rounded">{segment.lineCount} lines</span>
      </div>
    </div>
  );
}

// ============================================================================
// ANALYZE SUB-COMPONENTS
// ============================================================================
function AnalyzeHeader({ currentSource }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          Analyze
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          {currentSource 
            ? `Analyzing: ${currentSource.title}`
            : 'Select a source and configure analysis'
          }
        </p>
      </div>
    </div>
  );
}

function AnalyzeSidebar({ state, dispatch, handleNavigate }) {
  return (
    <div className="space-y-6">
      <SourceSelectionPanel
        currentSource={state.workspace.currentSource}
        currentSegments={state.workspace.segments}
        handleNavigate={handleNavigate}
        dispatch={dispatch}
      />

      {state.workspace.currentSource && (
        <>
          <StrategySelectionPanel
            strategies={state.analyze.availableStrategies || []}
            selectedStrategy={state.analyze.selectedStrategy}
            dispatch={dispatch}
          />

          {state.analyze.selectedStrategy === 'custom' && (
            <MethodSelector
              selectedMethods={state.analyze.selectedMethods || []}
              onMethodsChange={(methods) => 
                dispatch({ type: ACTIONS.SET_SELECTED_METHODS, payload: methods })
              }
            />
          )}

          <ViewModeToggle />

          <FilterPanel
            filters={state.analyze.filters}
            onFiltersChange={(filters) =>
              dispatch({ type: ACTIONS.UPDATE_ANALYZE_FILTERS, payload: filters })
            }
            availableEntities={state.library.entities}
            isExpanded={false}
            onToggleExpand={() => {}}
          />
        </>
      )}
    </div>
  );
}

function SourceSelectionPanel({ currentSource, currentSegments, handleNavigate, dispatch }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-purple-600" />
        Source
      </h3>
      {currentSource ? (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="font-bold text-blue-900 text-sm mb-1">
              {currentSource.title}
            </div>
            <div className="text-xs text-blue-700 mb-2">
              {currentSource.author} • {currentSource.date}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-white text-blue-700 rounded-lg font-medium">
                {currentSource.line_count} lines
              </span>
              {currentSegments?.length > 0 && (
                <span className="px-2 py-1 bg-white text-green-700 rounded-lg font-medium">
                  {currentSegments.length} segments
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleNavigate(VIEWS.WORKSPACE)}
            className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Segmentation
          </button>
          <button
            onClick={() => dispatch({ type: ACTIONS.CLEAR_WORKSPACE })}
            className="w-full px-4 py-2.5 text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Change Source
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-4">No source selected</p>
          <button
            onClick={() => handleNavigate(VIEWS.WORKSPACE)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
          >
            Go to Workspace
          </button>
        </div>
      )}
    </div>
  );
}

function StrategySelectionPanel({ strategies, selectedStrategy, dispatch }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Analysis Strategy</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => dispatch({ 
              type: ACTIONS.SET_SELECTED_STRATEGY, 
              payload: strategy.id 
            })}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              selectedStrategy === strategy.id
                ? 'border-purple-400 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-semibold text-gray-900 text-sm">{strategy.name}</div>
            <div className="text-xs text-gray-600 mt-1">{strategy.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AnalyzeMainContent({ state, dispatch, currentSegments, handleNavigate, startAnalysis }) {
  if (!state.workspace.currentSource) {
    return <NoSourceSelected handleNavigate={handleNavigate} />;
  }

  if (state.analyze.currentJob) {
    return (
      <ProgressTracker
        status={state.analyze.currentJob.status}
        progress={state.analyze.currentJob.progress || 0}
        currentSegment={state.analyze.currentJob.currentSegment || 0}
        totalSegments={state.analyze.currentJob.totalSegments || currentSegments.length}
        startTime={state.analyze.currentJob.startTime}
        estimatedTimeRemaining={state.analyze.currentJob.estimatedTime}
        resultsSoFar={state.analyze.currentJob.resultsCount || 0}
        highConfidenceCount={state.analyze.currentJob.highConfidenceCount || 0}
        onPause={() => dispatch({ type: ACTIONS.PAUSE_ANALYSIS })}
        onResume={() => dispatch({ type: ACTIONS.RESUME_ANALYSIS })}
        onCancel={() => dispatch({ type: ACTIONS.CANCEL_ANALYSIS })}
        showDetails={true}
        latestResults={state.analyze.currentJob.latestResults || []}
      />
    );
  }

  return (
    <ReadyToAnalyze
      currentSegments={currentSegments}
      selectedStrategy={state.analyze.selectedStrategy}
      isLoading={state.ui.isLoading?.analysis}
      handleNavigate={handleNavigate}
      startAnalysis={startAnalysis}
    />
  );
}

function NoSourceSelected({ handleNavigate }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-16 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
        <Plus className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">No Source Selected</h3>
      <p className="text-gray-600 mb-6">Go to Workspace to select and segment a source text</p>
      <button
        onClick={() => handleNavigate(VIEWS.WORKSPACE)}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold inline-flex items-center gap-2"
      >
        <Edit2 className="w-5 h-5" />
        Open Workspace
      </button>
    </div>
  );
}

function ReadyToAnalyze({ currentSegments, selectedStrategy, isLoading, handleNavigate, startAnalysis }) {
  if (currentSegments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Segments Yet</h3>
          <p className="text-gray-600 mb-6">Create segments in the Workspace before starting analysis</p>
          <button
            onClick={() => handleNavigate(VIEWS.WORKSPACE)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold inline-flex items-center gap-2"
          >
            <Edit2 className="w-5 h-5" />
            Create Segments
          </button>
        </div>
      </div>
    );
  }

  const validCount = currentSegments.length;
  const invalidCount = 0
  const estimatedMinutes = Math.round(currentSegments.length * 3.5 / 60);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
      <div className="text-center space-y-6">
        <ReadyBanner
          validCount={validCount}
          totalCount={currentSegments.length}
          estimatedMinutes={estimatedMinutes}
          invalidCount={invalidCount}
        />

        <button
          onClick={startAnalysis}
          disabled={validCount === 0 || (!selectedStrategy ) || isLoading}

          className={`
            px-12 py-4 text-xl font-bold rounded-2xl transition-all inline-flex items-center gap-3 shadow-lg
            ${validCount > 0 && selectedStrategy
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Starting Analysis...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              Start Analysis
            </>
          )}
        </button>

        {!selectedStrategy  && (
          <p className="text-sm text-gray-600">
            Please select an analysis strategy or view mode above
          </p>
        )}
      </div>
    </div>
  );
}

function ReadyBanner({ validCount, totalCount, estimatedMinutes, invalidCount }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 mb-4">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-green-900 mb-2">Ready to Analyze</h3>
      <p className="text-green-700 mb-6">Everything is configured and ready to go</p>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <BannerStat label="Total Segments" value={totalCount} color="text-gray-900" />
        <BannerStat label="Valid Segments" value={validCount} color="text-green-600" />
        <BannerStat label="Est. Time" value={`${estimatedMinutes} min`} color="text-blue-600" />
      </div>

      {invalidCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-sm">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-semibold">
            <AlertCircle className="w-4 h-4" />
            {invalidCount} segment(s) invalid
          </div>
          <p className="text-amber-700 text-xs mt-1">
            Segments must have 50-1000 letters. Invalid segments will be skipped.
          </p>
        </div>
      )}
    </div>
  );
}

function BannerStat({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-green-700 text-sm font-medium mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// ============================================================================
// RESULTS SUB-COMPONENTS
// ============================================================================
function ResultsHeader({ patterns, highConfidenceResults, resultsByAuthor, totalWorks, dispatch, exportResults }) {
  const authorCount = Object.keys(resultsByAuthor).length;

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Results</h1>
        <p className="text-gray-600 mt-1">
          {patterns.length} patterns found across {authorCount} author{authorCount !== 1 ? 's' : ''} • {totalWorks} work{totalWorks !== 1 ? 's' : ''}
          {highConfidenceResults.length > 0 && (
            <span className="text-green-600 ml-2">
              • {highConfidenceResults.length} high confidence
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            dispatch({
              type: ACTIONS.SET_SELECTED_WORK_RESULTS,
              payload: {
                work_title: patterns[0]?.metadata?.work_title || 'Unknown Work',
                author: patterns[0]?.metadata?.author || 'Unknown Author',
                patterns: patterns
              }
            });
            dispatch({
              type: ACTIONS.TOGGLE_MODAL,
              payload: { modal: 'workSummary', isOpen: true }
            });
          }}
          disabled={patterns.length === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            patterns.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          📊 View All Work Results
        </button>
        <ExportControls
          selectedPatterns={[]}
          allPatterns={patterns}
          onExport={exportResults}
          isExporting={false}
        />
      </div>
    </div>
  );
}

function EmptyResults({ handleNavigate }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
      <p className="text-gray-600 mb-4">Run an analysis to see patterns here</p>
      <button
        onClick={() => handleNavigate(VIEWS.ANALYZE)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Analyze
      </button>
    </div>
  );
}

function ResultsList({ resultsByAuthor, state, dispatch }) {
  return (
    <div className="space-y-8">
      {Object.entries(resultsByAuthor).map(([author, works]) => (
        <AuthorResultsSection
          key={author}
          author={author}
          works={works}
          state={state}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}

function AuthorResultsSection({ author, works, state, dispatch }) {
  const totalPatterns = Object.values(works).reduce((sum, patterns) => sum + patterns.length, 0);
  const highConfCount = Object.values(works).reduce(
    (sum, patterns) => sum + patterns.filter(p => p.scores?.composite >= 70).length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {author.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{author}</h2>
              <p className="text-sm text-gray-600">
                {Object.keys(works).length} work{Object.keys(works).length !== 1 ? 's' : ''} • {totalPatterns} patterns
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalPatterns}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{highConfCount}</div>
              <div className="text-xs text-gray-600">High Conf</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-8 space-y-6">
        {Object.entries(works).map(([workTitle, patterns]) => (
          <WorkResultsSection
            key={workTitle}
            workTitle={workTitle}
            patterns={patterns}
            state={state}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}

function WorkResultsSection({ workTitle, patterns, state, dispatch }) {
  const highConfCount = patterns.filter(p => p.scores?.composite >= 70).length;
  const avgScore = patterns.reduce((sum, p) => sum + (p.scores?.composite || 0), 0) / patterns.length;

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{workTitle}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {patterns[0]?.metadata?.work_id || 'Unknown ID'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{patterns.length}</div>
              <div className="text-xs text-gray-600">Patterns</div>
            </div>
            {highConfCount > 0 && (
              <div className="text-center">
                <div className="font-semibold text-green-600">{highConfCount}</div>
                <div className="text-xs text-gray-600">High Conf</div>
              </div>
            )}
            <div className="text-center">
              <div className="font-semibold text-blue-600">{Math.round(avgScore)}</div>
              <div className="text-xs text-gray-600">Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 ml-8">
        {patterns.map((pattern, index) => (
          <ResultCard
            key={`${pattern.id}-${index}`}
            pattern={pattern}
            isSelected={state.results.selectedPatterns?.includes(pattern.id)}
            onSelect={(p) => dispatch({ type: ACTIONS.TOGGLE_PATTERN_SELECTION, payload: p.id })}
            onViewDetails={(p) => dispatch({ type: ACTIONS.VIEW_PATTERN_DETAILS, payload: p })}
            showCheckbox={true}
            showSegmentInfo={true}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// LIBRARY SUB-COMPONENTS
// ============================================================================
function LibraryHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Library</h1>
        <p className="text-gray-600 mt-1">Browse corpus and manage analysis sessions</p>
      </div>
    </div>
  );
}

function LibraryTabs({ activeTab, authorsCount, sessionsCount, dispatch }) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-4">
        <LibraryTab
          active={activeTab === 'sources'}
          onClick={() => dispatch({ type: ACTIONS.SET_LIBRARY_TAB, payload: 'sources' })}
          label={`Corpus (${authorsCount} authors)`}
        />
        <LibraryTab
          active={activeTab === 'sessions'}
          onClick={() => dispatch({ type: ACTIONS.SET_LIBRARY_TAB, payload: 'sessions' })}
          label={`Sessions (${sessionsCount})`}
        />
      </nav>
    </div>
  );
}

function LibraryTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 border-b-2 font-medium text-sm transition-colors
        ${active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
        }
      `}
    >
      {label}
    </button>
  );
}

function LibrarySourcesContent({ state, dispatch }) {
  const authors = state.library.authors || [];

  if (authors.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Library</h3>
        <p className="text-gray-600">Corpus is being loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Authors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((author) => (
            <AuthorCard
              key={author.folder_name}
              author={author}
              isSelected={state.library.selectedAuthor === author.folder_name}
              onClick={() => dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: author.folder_name })}
            />
          ))}
        </div>
      </div>

      {state.library.selectedAuthor && (state.library.availableWorks || []).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Works by {authors.find(a => a.folder_name === state.library.selectedAuthor)?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(state.library.availableWorks || []).map((work) => (
              <SourceCard
                key={work.id}
                source={work}
                showActions={true}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}

      {state.library.selectedAuthor && (state.library.availableWorks || []).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No works found for this author</p>
        </div>
      )}
    </div>
  );
}

function AuthorCard({ author, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 border rounded-lg transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <h3 className="font-semibold text-gray-900">{author.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{author.work_count} works</p>
    </button>
  );
}

function LibrarySessionsContent({ state, handleNavigate }) {
  const sessions = state.library.savedSessions || [];

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Saved Analysis Sessions</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Sessions</h3>
          <p className="text-gray-600 mb-4">Run an analysis and save your results to see them here</p>
          <button
            onClick={() => handleNavigate(VIEWS.WORKSPACE)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Saved Analysis Sessions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            showCheckbox={false}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// NOTIFICATION CONTAINER
// ============================================================================
function NotificationContainer({ notifications, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          notification={notif}
          onDismiss={() => onDismiss(notif.id)}
        />
      ))}
    </div>
  );
}

function Notification({ notification, onDismiss }) {
  const { type, title, message } = notification;

  const getNotificationStyles = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-500/95 text-white';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-500/95 text-white';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-amber-500/95 text-white';
      case NOTIFICATION_TYPES.INFO:
        return 'bg-blue-500/95 text-white';
      default:
        return 'bg-gray-500/95 text-white';
    }
  };

  const getNotificationIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return CheckCircle;
      case NOTIFICATION_TYPES.ERROR:
      case NOTIFICATION_TYPES.WARNING:
        return AlertCircle;
      case NOTIFICATION_TYPES.INFO:
        return Sparkles;
      default:
        return AlertCircle;
    }
  };

  const Icon = getNotificationIcon();

  return (
    <div
      className={`
        px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        ${getNotificationStyles()}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-bold mb-1">{title}</p>
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <AIEnhancementModal />

    </div>
  );
}

export default App;

// import APIConnectionTest from './test';
// function App() {

//   return <APIConnectionTest />
// }
// export default App;