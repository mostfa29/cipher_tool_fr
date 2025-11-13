// src/App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, ACTIONS } from './context/AppContext';

// AppShell Components
import Navigation from './AppShell/Navigation';
import SettingsModal from './AppShell/SettingsModal';
import HelpSystem from './AppShell/HelpSystem';

// WorkspaceView Components
import SourcePicker from './WorkspaceView/SourcePicker';
import VirtualizedTextDisplay from './WorkspaceView/VirtualizedTextDisplay';
import EnhancedSegmentationTool from './WorkspaceView/EnhancedSegmentationTool'; // NEW

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

function App() {
  const { state, dispatch } = useAppState();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState('integrated'); // 'integrated' or 'standalone'

  // Generate segments from boundaries
  const currentSegments = useMemo(() => {
    if (!state.workspace.activeSource?.text || !state.workspace.boundaries) {
      return [];
    }

    const lines = state.workspace.activeSource.text.split('\n');
    const boundaries = state.workspace.boundaries;

    return boundaries.slice(0, -1).map((start, i) => {
      const end = boundaries[i + 1];
      const segmentLines = lines.slice(start, end);
      const text = segmentLines.join('\n');
      const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
      
      return {
        id: i + 1,
        startLine: start,
        endLine: end,
        lineCount: end - start,
        text,
        letterCount,
        isValid: letterCount >= 100 && letterCount <= 500
      };
    });
  }, [state.workspace.activeSource, state.workspace.boundaries]);

  // Handle navigation
  const handleNavigate = (viewName) => {
    // Check for unsaved changes
    if (state.ui.hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      if (!confirmed) return;
    }

    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: viewName });
    
    // Clear unsaved changes flag
    if (state.ui.hasUnsavedChanges) {
      dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    }
  };

  // Handle boundaries change
  const handleBoundariesChange = (newBoundaries) => {
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: true });
  };

  // Handle source selection
  const handleSourceSelect = (source) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_SOURCE, payload: source });
    
    // Initialize boundaries for new source
    const lines = source.text.split('\n');
    const initialBoundaries = [0, lines.length];
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: initialBoundaries });
    
    dispatch({ 
      type: ACTIONS.ADD_NOTIFICATION, 
      payload: {
        type: 'success',
        message: `Source "${source.title}" loaded successfully`,
        duration: 3000
      }
    });
  };

  // Calculate high confidence results
  const highConfidenceResults = state.results.patterns.filter(
    (r) => r.scores?.composite >= 70
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when no modal is open and not typing in input
      if (showSettings || showHelp) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd + key shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleNavigate('workspace');
            break;
          case '2':
            e.preventDefault();
            handleNavigate('analyze');
            break;
          case '3':
            e.preventDefault();
            handleNavigate('results');
            break;
          case '4':
            e.preventDefault();
            handleNavigate('library');
            break;
          case 'l':
            // Toggle layout in workspace
            if (state.ui.activeView === 'workspace') {
              e.preventDefault();
              setWorkspaceLayout(prev => prev === 'integrated' ? 'standalone' : 'integrated');
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
          default:
            break;
        }
      }

      // Escape key to close modals
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else if (showHelp) setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showSettings, showHelp, state.ui.activeView, state.ui.hasUnsavedChanges]);

  // Auto-dismiss notifications
  useEffect(() => {
    state.ui.notifications.forEach((notif) => {
      if (notif.autoDismiss !== false) {
        const timer = setTimeout(() => {
          dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notif.id });
        }, notif.duration || 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [state.ui.notifications, dispatch]);

  // Render active view
  const renderView = () => {
    switch (state.ui.activeView) {

      case 'workspace':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workspace</h1>
                <p className="text-gray-600 mt-1">
                  {state.workspace.activeSource 
                    ? `Editing: ${state.workspace.activeSource.title}`
                    : 'Select and prepare your source text for analysis'
                  }
                </p>
              </div>
              
              {/* Layout Toggle */}
              {state.workspace.activeSource && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setWorkspaceLayout('integrated')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        workspaceLayout === 'integrated'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📄 Split View
                    </button>
                    <button
                      onClick={() => setWorkspaceLayout('standalone')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        workspaceLayout === 'standalone'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ✂️ Full Editor
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Conditional Layout Rendering */}
            {!state.workspace.activeSource ? (
              // No source selected - show source picker prominently
              <div className="max-w-4xl mx-auto">
                <SourcePicker 
                  onSourceSelect={handleSourceSelect}
                  selectedSourceId={state.workspace.activeSource?.id}
                />
              </div>
            ) : workspaceLayout === 'standalone' ? (
              // Standalone Segmentation Tool (full screen)
              <EnhancedSegmentationTool
                source={state.workspace.activeSource}
                boundaries={state.workspace.boundaries || []}
                onBoundariesChange={handleBoundariesChange}
                onBack={() => setWorkspaceLayout('integrated')}
              />
            ) : (
              // Integrated Layout (split view)
              <div className="grid grid-cols-12 gap-4">
                {/* Left Sidebar: Source Picker */}
                <div className="col-span-3">
                  <div className="sticky top-4">
                    <SourcePicker 
                      onSourceSelect={handleSourceSelect}
                      selectedSourceId={state.workspace.activeSource?.id}
                      compact={true}
                    />
                  </div>
                </div>

                {/* Main Content: Text Display */}
                <div className="col-span-6 space-y-4">
                  <VirtualizedTextDisplay
                    source={state.workspace.activeSource}
                    boundaries={state.workspace.boundaries || []}
                    onBoundariesChange={handleBoundariesChange}
                    segmentationMode={true}
                    highlightSegments={true}
                    showMetadata={true}
                  />

                  {/* Quick Stats Bar */}
                  {currentSegments.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-600">Segments:</span>
                            <span className="ml-2 font-semibold text-gray-900">
                              {currentSegments.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Valid:</span>
                            <span className="ml-2 font-semibold text-green-700">
                              {currentSegments.filter(s => s.isValid).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Invalid:</span>
                            <span className="ml-2 font-semibold text-red-700">
                              {currentSegments.filter(s => !s.isValid).length}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleNavigate('analyze')}
                          disabled={currentSegments.filter(s => s.isValid).length === 0}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentSegments.filter(s => s.isValid).length > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Proceed to Analysis →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar: Quick Segmentation Controls */}
                <div className="col-span-3">
                  <div className="sticky top-4 space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setWorkspaceLayout('standalone')}
                          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                        >
                          ✂️ Open Full Editor
                        </button>
                        <button
                          onClick={() => {
                            // Quick generate with defaults
                            const lines = state.workspace.activeSource.text.split('\n');
                            const newBoundaries = [0];
                            for (let i = 3; i < lines.length; i += 3) {
                              newBoundaries.push(i);
                            }
                            newBoundaries.push(lines.length);
                            handleBoundariesChange(newBoundaries);
                          }}
                          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                        >
                          ⚡ Quick Segment (3 lines)
                        </button>
                        <button
                          onClick={() => {
                            const lines = state.workspace.activeSource.text.split('\n');
                            handleBoundariesChange([0, lines.length]);
                          }}
                          className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
                        >
                          🗑️ Clear All Segments
                        </button>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    {currentSegments.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold text-gray-900">
                              {currentSegments.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg Letters:</span>
                            <span className="font-semibold text-gray-900">
                              {Math.round(
                                currentSegments.reduce((sum, s) => sum + s.letterCount, 0) / 
                                currentSegments.length
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Range:</span>
                            <span className="font-semibold text-gray-900">
                              {Math.min(...currentSegments.map(s => s.letterCount))} - {Math.max(...currentSegments.map(s => s.letterCount))}
                            </span>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">Validity:</span>
                              <span className="font-semibold text-gray-900">
                                {Math.round((currentSegments.filter(s => s.isValid).length / currentSegments.length) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${(currentSegments.filter(s => s.isValid).length / currentSegments.length) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Click between lines to add boundaries</li>
                        <li>• Valid segments: 100-500 letters</li>
                        <li>• Use Full Editor for advanced controls</li>
                        <li>• Ctrl+L to toggle layout</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'analyze':
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analyze</h1>
                <p className="text-gray-600 mt-1">Configure and run cipher analysis</p>
              </div>
            </div>

            {/* Analyze View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Configuration */}
              <div className="lg:col-span-1 space-y-6">
                <ViewModeToggle
                  selectedMode={state.settings.viewMode}
                  onModeChange={(mode) => 
                    dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: { viewMode: mode } })
                  }
                />
                <MethodSelector
                  selectedMethods={state.settings.methods}
                  onMethodsChange={(methods) => 
                    dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: { methods } })
                  }
                />
                <FilterPanel
                  filters={state.analyze.filters}
                  onFiltersChange={(filters) =>
                    dispatch({ type: ACTIONS.UPDATE_ANALYZE_FILTERS, payload: filters })
                  }
                  availableEntities={state.library.entities}
                  isExpanded={true}
                  onToggleExpand={() => {}}
                />
              </div>

              {/* Right Column: Progress & Results Preview */}
              <div className="lg:col-span-2 space-y-6">
                <ProgressTracker
                  status={state.analyze.currentJob?.status || 'idle'}
                  progress={state.analyze.currentJob?.progress || 0}
                  currentSegment={state.analyze.currentJob?.currentSegment || 0}
                  totalSegments={state.analyze.currentJob?.totalSegments || currentSegments.length}
                  startTime={state.analyze.currentJob?.startTime}
                  estimatedTimeRemaining={state.analyze.currentJob?.estimatedTime}
                  resultsSoFar={state.analyze.currentJob?.resultsCount || 0}
                  highConfidenceCount={state.analyze.currentJob?.highConfidenceCount || 0}
                  onPause={() => dispatch({ type: ACTIONS.PAUSE_ANALYSIS })}
                  onResume={() => dispatch({ type: ACTIONS.RESUME_ANALYSIS })}
                  onCancel={() => dispatch({ type: ACTIONS.CANCEL_ANALYSIS })}
                  showDetails={true}
                  latestResults={state.analyze.currentJob?.latestResults || []}
                />

                {/* Start Analysis Button */}
                {!state.analyze.currentJob && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-center">
                      <button
                        onClick={() => {
                          // Pass segments to analysis
                          dispatch({ 
                            type: ACTIONS.START_ANALYSIS,
                            payload: { segments: currentSegments }
                          });
                        }}
                        disabled={!state.workspace.activeSource || currentSegments.length === 0}
                        className={`
                          px-8 py-3 text-lg font-semibold rounded-lg transition-colors
                          ${state.workspace.activeSource && currentSegments.length > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }
                        `}
                      >
                        Start Analysis
                      </button>
                      {!state.workspace.activeSource ? (
                        <p className="text-sm text-gray-600 mt-3">
                          Please select a source in Workspace first
                        </p>
                      ) : currentSegments.length === 0 ? (
                        <p className="text-sm text-gray-600 mt-3">
                          Please create segments in Workspace first
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-3">
                          Ready to analyze {currentSegments.length} segments ({currentSegments.filter(s => s.isValid).length} valid)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Results</h1>
                <p className="text-gray-600 mt-1">
                  {state.results.patterns.length} patterns found
                  {highConfidenceResults.length > 0 && (
                    <span className="text-green-600 ml-2">
                      • {highConfidenceResults.length} high confidence
                    </span>
                  )}
                </p>
              </div>
              <ExportControls
                selectedPatterns={state.results.selectedPatterns || []}
                allPatterns={state.results.patterns}
                onExport={(patterns, config) => {
                  dispatch({ type: ACTIONS.EXPORT_RESULTS, payload: { patterns, config } });
                }}
                isExporting={state.results.isExporting}
              />
            </div>

            {/* Filter Bar */}
            <FilterBar
              filters={state.results.filters}
              onFiltersChange={(filters) =>
                dispatch({ type: ACTIONS.UPDATE_RESULT_FILTERS, payload: filters })
              }
              availableMethods={state.settings.methods}
              availableEntities={state.library.entities}
              resultCount={state.results.patterns.length}
              filteredCount={state.results.filteredPatterns?.length || state.results.patterns.length}
            />

            {/* Results Grid */}
            {state.results.patterns.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600 mb-4">Run an analysis to see patterns here</p>
                <button
                  onClick={() => handleNavigate('analyze')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Analyze
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(state.results.filteredPatterns || state.results.patterns).map((pattern, index) => (
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
            )}
          </div>
        );

      case 'library':
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Library</h1>
                <p className="text-gray-600 mt-1">Manage your sources and analysis sessions</p>
              </div>
            </div>

            {/* Search */}
            <SearchBar
              value={state.library.searchQuery || ''}
              onChange={(query) => dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: query })}
              placeholder="Search sources and sessions..."
              suggestions={[]}
              showSuggestions={false}
            />

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-4">
                <button
                  onClick={() => dispatch({ type: ACTIONS.SET_LIBRARY_TAB, payload: 'sources' })}
                  className={`
                    px-4 py-2 border-b-2 font-medium text-sm transition-colors
                    ${state.library.activeTab === 'sources'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Sources ({state.library.availableSources?.length || 0})
                </button>
                <button
                  onClick={() => dispatch({ type: ACTIONS.SET_LIBRARY_TAB, payload: 'sessions' })}
                  className={`
                    px-4 py-2 border-b-2 font-medium text-sm transition-colors
                    ${state.library.activeTab === 'sessions'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Sessions ({state.library.sessions?.length || 0})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {state.library.activeTab === 'sources' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(state.library.availableSources || []).map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    onEdit={(s) => dispatch({ type: ACTIONS.EDIT_SOURCE, payload: s })}
                    onDelete={(s) => dispatch({ type: ACTIONS.DELETE_SOURCE, payload: s.id })}
                    onAnalyze={(s) => {
                      dispatch({ type: ACTIONS.SET_ACTIVE_SOURCE, payload: s });
                      handleNavigate('analyze');
                    }}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(state.library.sessions || []).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onView={(s) => {
                      dispatch({ type: ACTIONS.LOAD_SESSION, payload: s });
                      handleNavigate('results');
                    }}
                    onDelete={(s) => dispatch({ type: ACTIONS.DELETE_SESSION, payload: s.id })}
                    onExport={(s) => dispatch({ type: ACTIONS.EXPORT_SESSION, payload: s })}
                    showCheckbox={false}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">View Not Found</h1>
            <p className="text-gray-600">The requested view does not exist.</p>
            <button
              onClick={() => handleNavigate('workspace')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Workspace
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-screen-2xl">
        {renderView()}
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      <HelpSystem 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)}
        currentView={state.ui.activeView}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
        {state.ui.notifications.map((notif) => (
          <div
            key={notif.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg
              transform transition-all duration-300 ease-in-out
              ${notif.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${notif.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${notif.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
              ${notif.type === 'info' ? 'bg-blue-500 text-white' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {notif.type === 'success' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notif.type === 'error' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notif.type === 'warning' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {notif.type === 'info' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {notif.title && (
                  <p className="text-sm font-semibold mb-1">{notif.title}</p>
                )}
                <p className="text-sm">{notif.message}</p>
              </div>

              <button
                onClick={() =>
                  dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notif.id })
                }
                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;