// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from './context/AppContext';
import AIViewComponent from './AIView/AIView';
import MiniMerlinView from './MiniMerlinView/MiniMerlin';

// AppShell Components
import Navigation from './AppShell/Navigation';
import SettingsModal from './AppShell/SettingsModal';
import HelpSystem from './AppShell/HelpSystem';
import AIEnhancementModal from './AppShell/AIEnhancementModal';

// WorkspaceView Components
import WorkspaceView from "./WorkspaceView/WorkspaceView";

// AnalyzeView Components
import MethodSelector from './AnalyzeView/MethodSelector';
import ViewModeToggle from './AnalyzeView/ViewModeToggle';
import FilterPanel from './AnalyzeView/FilterPanel';
import ProgressTracker from './AnalyzeView/ProgressTracker';

// ResultsView Components
import ResultsView from './ResultsView/ResultsView';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEWS = {
  WORKSPACE: 'workspace',
  ANALYZE: 'analyze',
  RESULTS: 'results',
  // LIBRARY: 'library',
  AI_CHAT: 'ai_chat',
    MINI_MERLIN: 'mini_merlin'  // ADD THIS

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

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const highConfidenceResults = useHighConfidenceResults(state.results.patterns);
  const resultsByAuthor = useResultsByAuthor(state.results.patterns);
  const totalWorks = useTotalWorks(resultsByAuthor);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useGlobalKeyboardShortcuts({
    showSettings,
    showHelp,
    activeView: state.ui.activeView,
    setShowSettings,
    setShowHelp,
    handleNavigate: useNavigateCallback(dispatch, state.ui.hasUnsavedChanges)
  });

  // ============================================================================
  // CALLBACKS
  // ============================================================================
  const handleNavigate = useNavigateCallback(dispatch, state.ui.hasUnsavedChanges);

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

      <main className="flex-1">
        <ViewRouter
          activeView={state.ui.activeView}
          state={state}
          dispatch={dispatch}
          highConfidenceResults={highConfidenceResults}
          resultsByAuthor={resultsByAuthor}
          totalWorks={totalWorks}
          handleNavigate={handleNavigate}
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
      
      <AIEnhancementModal />
    </div>
  );
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

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

function useNavigateCallback(dispatch, hasUnsavedChanges) {
  return useCallback((viewName) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: viewName });
    if (hasUnsavedChanges) {
      dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    }
  }, [dispatch, hasUnsavedChanges]);
}

function useGlobalKeyboardShortcuts(options) {
  const {
    showSettings,
    showHelp,
    activeView,
    setShowSettings,
    setShowHelp,
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
            handleNavigate(VIEWS.AI_CHAT);
            break;
          case ',':
            e.preventDefault();
            setShowSettings(true);
            break;
          case '5':
            e.preventDefault();
            handleNavigate(VIEWS.MINI_MERLIN);
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
  }, [showSettings, showHelp, activeView, setShowSettings, setShowHelp, handleNavigate]);
}

// ============================================================================
// VIEW ROUTER COMPONENT
// ============================================================================
function ViewRouter(props) {
  const { activeView, exportResults } = props;

  switch (activeView) {
    case VIEWS.WORKSPACE:
      return <WorkspaceView />;
    case VIEWS.ANALYZE:
      return <AnalyzeView {...props} />;
    case VIEWS.RESULTS:
      return <ResultsView exportResults={exportResults} />;
    case VIEWS.AI_CHAT:
      return <AIViewComponent />;
    case VIEWS.MINI_MERLIN:  // ADD THIS CASE
      return <MiniMerlinView />;
    default:
      return <NotFoundView />;
  }
}

// ============================================================================
// ANALYZE VIEW
// ============================================================================
function AnalyzeView(props) {
  const {
    state,
    dispatch,
    handleNavigate,
    startAnalysis
  } = props;

  // Get segments from context
  const currentSegments = state.workspace.segments || [];

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-2xl space-y-6">
      <AnalyzeHeader currentSource={state.workspace.currentSource} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SourceSelectionPanel
            currentSource={state.workspace.currentSource}
            currentSegments={currentSegments}
            handleNavigate={handleNavigate}
            dispatch={dispatch}
            multiEditionConfig={state.workspace.multiEditionConfig}  // NEW
          />

          {state.workspace.currentSource && (
            <>
              <ViewModeToggle />
              
              {state.analyze.viewMode === 'custom' && (
                <MethodSelector />
              )}

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

function SourceSelectionPanel({ currentSource, currentSegments, handleNavigate, dispatch, multiEditionConfig }) {
  // Check if we're in multi-edition mode
  const isMultiEdition = multiEditionConfig?.isMultiEdition;
  
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-purple-600" />
        Source
      </h3>
      {currentSource ? (
        <div className="space-y-3">
          <div className={`border-2 rounded-xl p-4 ${
            isMultiEdition 
              ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            {isMultiEdition && (
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">
                  MULTI-EDITION
                </span>
              </div>
            )}
            
            <div className="font-bold text-gray-900 text-sm mb-1">
              {currentSource.title}
            </div>
            <div className="text-xs text-gray-700 mb-2">
              {currentSource.author}
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {isMultiEdition ? (
                <>
                  <span className="px-2 py-1 bg-white text-purple-700 rounded-lg font-medium">
                    {multiEditionConfig.selectedEditions.length} editions
                  </span>
                  <span className="px-2 py-1 bg-white text-green-700 rounded-lg font-medium">
                    {multiEditionConfig.totalSegments} total segments
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-1 bg-white text-blue-700 rounded-lg font-medium">
                    {currentSource.line_count?.toLocaleString()} lines
                  </span>
                  {currentSegments?.length > 0 && (
                    <span className="px-2 py-1 bg-white text-green-700 rounded-lg font-medium">
                      {currentSegments.length} segments
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleNavigate(VIEWS.WORKSPACE)}
            className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {isMultiEdition ? 'Edit Editions' : 'Edit Segmentation'}
          </button>
          
          <button
            onClick={() => {
              dispatch({ type: ACTIONS.CLEAR_WORKSPACE });
              dispatch({ type: ACTIONS.CLEAR_MULTI_EDITION_CONFIG });
            }}
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

function AnalyzeMainContent({ state, dispatch, currentSegments, handleNavigate, startAnalysis }) {
  console.log('🎨 AnalyzeMainContent render');
  console.log('   currentSource:', state.workspace.currentSource?.id);
  console.log('   currentJob:', state.analyze.currentJob);
  console.log('   isLoading.analysis:', state.ui.isLoading?.analysis);

  if (!state.workspace.currentSource) {
    console.log('   → Rendering NoSourceSelected');
    return <NoSourceSelected handleNavigate={handleNavigate} />;
  }

  // Show progress tracker if there's a current job
  if (state.analyze.currentJob) {
    console.log('   → Rendering ProgressTracker');
    return (
      <ProgressTracker
        job={state.analyze.currentJob}
        showDetails={true}
      />
    );
  }

  console.log('   → Rendering ReadyToAnalyze');
  return (
    <ReadyToAnalyze
      currentSegments={currentSegments}
      selectedViewMode={state.analyze.viewMode}
      isLoading={state.ui.isLoading?.analysis}
      handleNavigate={handleNavigate}
      startAnalysis={startAnalysis}
    />
  );
}

function NoSourceSelected({ handleNavigate }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-16 text-center">
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

function ReadyToAnalyze({ currentSegments, selectedViewMode, isLoading, handleNavigate, startAnalysis }) {
  // Get multi-edition config from state if needed
  const { state } = useAppState();
  const multiEditionConfig = state.workspace.multiEditionConfig;
  const isMultiEdition = multiEditionConfig?.isMultiEdition;
  
  // Use multi-edition total if available, otherwise use current segments
  const totalSegments = isMultiEdition 
    ? multiEditionConfig.totalSegments 
    : currentSegments.length;
  
  const validCount = totalSegments;
  const estimatedMinutes = Math.round(totalSegments * 3.5 / 60);

  if (!isMultiEdition && currentSegments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-8">
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

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-8">
      <div className="text-center space-y-6">
        <ReadyBanner
          validCount={validCount}
          totalCount={totalSegments}
          estimatedMinutes={estimatedMinutes}
          isMultiEdition={isMultiEdition}
          editionCount={multiEditionConfig?.selectedEditions?.length}
        />

        <button
          onClick={startAnalysis}
          disabled={validCount === 0 || !selectedViewMode || isLoading}
          className={`
            px-12 py-4 text-xl font-bold rounded-2xl transition-all inline-flex items-center gap-3 shadow-lg
            ${validCount > 0 && selectedViewMode
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

        {!selectedViewMode && (
          <p className="text-sm text-gray-600">
            Please select a view mode above
          </p>
        )}
      </div>
    </div>
  );
}

function ReadyBanner({ validCount, totalCount, estimatedMinutes, isMultiEdition, editionCount }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 mb-4">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-green-900 mb-2">Ready to Analyze</h3>
      <p className="text-green-700 mb-6">
        {isMultiEdition 
          ? `Multi-edition analysis configured with ${editionCount} editions`
          : 'Everything is configured and ready to go'
        }
      </p>
      
      <div className={`grid ${isMultiEdition ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
        {isMultiEdition && (
          <BannerStat label="Editions" value={editionCount} color="text-purple-600" />
        )}
        <BannerStat label="Total Segments" value={totalCount} color="text-gray-900" />
        <BannerStat label="Valid Segments" value={validCount} color="text-green-600" />
        <BannerStat label="Est. Time" value={`${estimatedMinutes} min`} color="text-blue-600" />
      </div>
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





function AuthorCard({ author, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 border-2 rounded-xl transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
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
        <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
// NOT FOUND VIEW
// ============================================================================
function NotFoundView() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">View Not Found</h1>
      <p className="text-gray-600">The requested view does not exist.</p>
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
    </div>
  );
}

export default App;