// src/App.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from './context/AppContext';

// AppShell Components
import Navigation from './AppShell/Navigation';
import SettingsModal from './AppShell/SettingsModal';
import HelpSystem from './AppShell/HelpSystem';

// WorkspaceView Components
import SourcePicker from './WorkspaceView/SourcePicker';
import VirtualizedTextDisplay from './WorkspaceView/VirtualizedTextDisplay';
import EnhancedSegmentationTool from './WorkspaceView/EnhancedSegmentationTool';

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
  const { state, dispatch, startAnalysis, exportResults, saveSegmentation, loadWork } = useAppState();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState('integrated');

  // ALL MEMOS AT TOP LEVEL - ALWAYS CALLED
const currentSegments = useMemo(() => {
  if (!state.workspace.activeSource?.lines || !state.workspace.boundaries) {
    return [];
  }

  const lines = state.workspace.activeSource.lines;
  const boundaries = state.workspace.boundaries;

  return boundaries.slice(0, -1).map((start, i) => {
    const end = boundaries[i + 1];
    const segmentLines = lines.slice(start, end);
    const text = segmentLines.join('\n');
    const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
    
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
      isValid: letterCount >= 50 && letterCount <= 10000  // Fixed: was 1-10000, should be 50-10000
    };
  });
}, [state.workspace.activeSource, state.workspace.boundaries]);
  const highConfidenceResults = useMemo(() => 
    state.results.patterns.filter((r) => r.scores?.composite >= 70),
    [state.results.patterns]
  );

  // Group results by author and work - ALWAYS CALCULATED
  const resultsByAuthor = useMemo(() => {
    const grouped = {};
    
    state.results.patterns.forEach(pattern => {
      const author = pattern.metadata?.author || 'Unknown Author';
      const workTitle = pattern.metadata?.work_title || 'Unknown Work';
      
      if (!grouped[author]) {
        grouped[author] = {};
      }
      if (!grouped[author][workTitle]) {
        grouped[author][workTitle] = [];
      }
      grouped[author][workTitle].push(pattern);
    });
    
    return grouped;
  }, [state.results.patterns]);

  const totalWorks = useMemo(() => {
    let count = 0;
    Object.values(resultsByAuthor).forEach(works => {
      count += Object.keys(works).length;
    });
    return count;
  }, [resultsByAuthor]);
  useEffect(() => {
    console.log('📊 Results state changed:', {
      patterns: state.results.patterns.length,
      lastJobId: state.results.lastJobId,
      activeFiltersJobId: state.results.activeFilters?.lastJobId,
      sample: state.results.patterns[0]?.metadata,
      authors: Object.keys(resultsByAuthor).length
    });
  }, [state.results, resultsByAuthor]);


  // Update segments when boundaries change
  useEffect(() => {
    if (currentSegments.length > 0 && state.workspace.currentSource?.id) {
      dispatch({ type: ACTIONS.SET_SEGMENTS, payload: currentSegments });
    }
  }, [currentSegments, state.workspace.currentSource?.id, dispatch]);

  // ALL CALLBACKS
  const handleNavigate = useCallback((viewName) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: viewName });
    if (state.ui.hasUnsavedChanges) {
      dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    }
  }, [dispatch, state.ui.hasUnsavedChanges]);

  const handleBoundariesChange = useCallback((newBoundaries) => {
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: true });
  }, [dispatch]);

  const handleSegmentsChange = useCallback((segments) => {
    dispatch({ type: ACTIONS.SET_SEGMENTS, payload: segments });
  }, [dispatch]);

  const createQuickSegmentation = useCallback((linesPerSegment = 3) => {
    if (!state.workspace.activeSource?.lines) return;
    
    const lines = state.workspace.activeSource.lines;
    const newBoundaries = [0];
    
    for (let i = linesPerSegment; i < lines.length; i += linesPerSegment) {
      newBoundaries.push(i);
    }
    newBoundaries.push(lines.length);
    
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `Created ${newBoundaries.length - 1} segments`
      }
    });
  }, [state.workspace.activeSource, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showSettings || showHelp) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
            if (state.ui.activeView === 'workspace') {
              e.preventDefault();
              setWorkspaceLayout(prev => prev === 'integrated' ? 'standalone' : 'integrated');
            }
            break;
          case 's':
            if (state.ui.activeView === 'workspace' && state.workspace.currentSource?.id) {
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
          default:
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
  }, [showSettings, showHelp, state.ui.activeView, state.workspace.currentSource?.id, saveSegmentation, handleNavigate]);

  const renderView = () => {
    switch (state.ui.activeView) {
      case 'workspace':
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workspace</h1>
                <p className="text-gray-600 mt-1">
                  {state.workspace.activeSource 
                    ? `Editing: ${state.workspace.activeSource.title} by ${state.workspace.activeSource.author}`
                    : 'Select and prepare your source text for analysis'
                  }
                </p>
              </div>
              
              {state.workspace.activeSource && (
                <div className="flex items-center gap-3">
                  {state.ui.hasUnsavedChanges && (
                    <button
                      onClick={() => saveSegmentation()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      💾 Save Segmentation
                    </button>
                  )}
                  
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

            {!state.workspace.activeSource ? (
              <div className="max-w-4xl mx-auto">
                <SourcePicker 
                  onSourceSelect={() => {}}
                  selectedSourceId={state.workspace.activeSource?.id}
                />
              </div>
            ) : workspaceLayout === 'standalone' ? (
              <EnhancedSegmentationTool
                source={state.workspace.activeSource}
                boundaries={state.workspace.boundaries || []}
                onBoundariesChange={handleBoundariesChange}
                onSegmentsChange={handleSegmentsChange}
                onBack={() => setWorkspaceLayout('integrated')}
              />
            ) : (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <div className="sticky top-4">
                    <SourcePicker 
                      onSourceSelect={() => {}}
                      selectedSourceId={state.workspace.activeSource?.id}
                      compact={true}
                    />
                  </div>
                </div>

                <div className="col-span-6 space-y-4">
                  <VirtualizedTextDisplay
                    source={state.workspace.activeSource}
                    boundaries={state.workspace.boundaries || []}
                    onBoundariesChange={handleBoundariesChange}
                    segmentationMode={true}
                    highlightSegments={true}
                    showMetadata={true}
                  />

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

                <div className="col-span-3">
                  <div className="sticky top-4 space-y-4">
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
                          onClick={() => createQuickSegmentation(3)}
                          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                        >
                          ⚡ Quick Segment (3 lines)
                        </button>
                        <button
                          onClick={() => createQuickSegmentation(5)}
                          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                        >
                          ⚡ Quick Segment (5 lines)
                        </button>
                        <button
                          onClick={() => {
                            const lines = state.workspace.activeSource.lines;
                            handleBoundariesChange([0, lines.length]);
                          }}
                          className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
                        >
                          🗑️ Clear All Segments
                        </button>
                        {state.ui.hasUnsavedChanges && (
                          <button
                            onClick={() => saveSegmentation()}
                            className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-left"
                          >
                            💾 Save Changes
                          </button>
                        )}
                      </div>
                    </div>

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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Click between lines to add boundaries</li>
                        <li>• Valid segments: 50-1000 letters</li>
                        <li>• Use Full Editor for advanced controls</li>
                        <li>• Ctrl+L to toggle layout</li>
                        <li>• Ctrl+S to save segmentation</li>
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
                <p className="text-gray-600 mt-1">
                  {state.workspace.currentSource 
                    ? `Analyzing: ${state.workspace.currentSource.title}`
                    : 'Select a source and configure analysis'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📚 Select Source</h3>
                  {state.workspace.currentSource ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-medium text-blue-900 text-sm">{state.workspace.currentSource.title}</div>
                        <div className="text-xs text-blue-700 mt-1">
                          {state.workspace.currentSource.author} • {state.workspace.currentSource.date}
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          {state.workspace.currentSource.line_count} lines
                          {currentSegments.length > 0 && ` • ${currentSegments.length} segments`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleNavigate('workspace')}
                        className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        ✏️ Edit Segmentation
                      </button>
                      <button
                        onClick={() => dispatch({ type: ACTIONS.CLEAR_WORKSPACE })}
                        className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        🔄 Change Source
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-600 mb-4">No source selected</p>
                      <button
                        onClick={() => handleNavigate('workspace')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Go to Workspace
                      </button>
                    </div>
                  )}
                </div>

                {state.workspace.currentSource && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Analysis Strategy</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(state.analyze.availableStrategies || []).map(strategy => (
                        <button
                          key={strategy.id}
                          onClick={() => dispatch({ 
                            type: ACTIONS.SET_SELECTED_STRATEGY, 
                            payload: strategy.id 
                          })}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                            state.analyze.selectedStrategy === strategy.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900 text-sm">{strategy.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{strategy.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {state.workspace.currentSource && state.analyze.selectedStrategy === 'custom' && (
                  <MethodSelector
                    selectedMethods={state.analyze.selectedMethods || []}
                    onMethodsChange={(methods) => 
                      dispatch({ type: ACTIONS.SET_SELECTED_METHODS, payload: methods })
                    }
                  />
                )}

                {state.workspace.currentSource && (
                  <>
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

              <div className="lg:col-span-2 space-y-6">
                {!state.workspace.currentSource ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Source Selected</h3>
                    <p className="text-gray-600 mb-4">Go to Workspace to select and segment a source text</p>
                    <button
                      onClick={() => handleNavigate('workspace')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open Workspace
                    </button>
                  </div>
                ) : state.analyze.currentJob ? (
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
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <div className="text-center space-y-4">
                      {currentSegments.length > 0 ? (
                        <>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                            <h3 className="font-semibold text-green-900 mb-4">✅ Ready to Analyze</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <div className="text-green-700 font-medium">Work</div>
                                <div className="text-green-900">{state.workspace.currentSource.title}</div>
                              </div>
                              <div>
                                <div className="text-green-700 font-medium">Author</div>
                                <div className="text-green-900">{state.workspace.currentSource.author}</div>
                              </div>
                              <div>
                                <div className="text-green-700 font-medium">Total Segments</div>
                                <div className="text-green-900">{currentSegments.length}</div>
                              </div>
                              <div>
                                <div className="text-green-700 font-medium">Valid Segments</div>
                                <div className="text-green-900 font-semibold">
                                  {currentSegments.filter(s => s.isValid).length}
                                </div>
                              </div>
                              <div>
                                <div className="text-green-700 font-medium">Strategy</div>
                                <div className="text-green-900">
                                  {state.analyze.availableStrategies?.find(s => s.id === state.analyze.selectedStrategy)?.name || 'Not selected'}
                                </div>
                              </div>
                              <div>
                                <div className="text-green-700 font-medium">Est. Time</div>
                                <div className="text-green-900">{Math.round(currentSegments.length * 3.5 / 60)} min</div>
                              </div>
                            </div>

                            {currentSegments.filter(s => !s.isValid).length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                ⚠️ {currentSegments.filter(s => !s.isValid).length} segment(s) invalid (need 50-1000 letters)
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => startAnalysis()}
                            disabled={
                              !state.workspace.currentSource || 
                              currentSegments.filter(s => s.isValid).length === 0 || 
                              !state.analyze.selectedStrategy ||
                              state.ui.isLoading?.analysis
                            }
                            className={`
                              px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-flex items-center gap-2
                              ${state.workspace.currentSource && currentSegments.filter(s => s.isValid).length > 0 && state.analyze.selectedStrategy
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }
                            `}
                          >
                            {state.ui.isLoading?.analysis ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Starting Analysis...
                              </>
                            ) : (
                              <>
                                🔬 Start Analysis
                              </>
                            )}
                          </button>

                          {!state.analyze.selectedStrategy && (
                            <p className="text-sm text-gray-600">
                              Please select an analysis strategy
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
<h3 className="text-lg font-semibold text-gray-900 mb-2">No Segments Yet</h3>
<p className="text-gray-600 mb-4">Create segments in the Workspace before starting analysis</p>
<button
onClick={() => handleNavigate('workspace')}
className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
>
✏️ Create Segments
</button>
</>
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
              {state.results.patterns.length} patterns found across {Object.keys(resultsByAuthor).length} author{Object.keys(resultsByAuthor).length !== 1 ? 's' : ''} • {totalWorks} work{totalWorks !== 1 ? 's' : ''}
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
      const workResults = state.results.patterns;
      dispatch({
        type: ACTIONS.SET_SELECTED_WORK_RESULTS,
        payload: {
          work_title: state.results.patterns[0]?.metadata?.work_title || 'Unknown Work',
          author: state.results.patterns[0]?.metadata?.author || 'Unknown Author',
          patterns: workResults
        }
      });
      dispatch({
        type: ACTIONS.TOGGLE_MODAL,
        payload: { modal: 'workSummary', isOpen: true }
      });
    }}
    disabled={state.results.patterns.length === 0}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      state.results.patterns.length > 0
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }`}
  >
    📊 View All Work Results
  </button>
  <ExportControls
    selectedPatterns={state.results.selectedPatterns || []}
    allPatterns={state.results.patterns}
    onExport={(format) => exportResults(format)}
    isExporting={state.results.isExporting}
  />
</div>
          
        </div>

        <FilterBar
          filters={state.results.activeFilters || {}}
          onFiltersChange={(filters) =>
            dispatch({ type: ACTIONS.UPDATE_RESULT_FILTERS, payload: filters })
          }
          availableMethods={state.settings.methods}
          availableEntities={state.library.entities}
          resultCount={state.results.patterns.length}
          filteredCount={state.results.patterns.length}
        />

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
          <div className="space-y-8">
            {Object.entries(resultsByAuthor).map(([author, works]) => (
              <div key={author} className="space-y-4">
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
                          {Object.keys(works).length} work{Object.keys(works).length !== 1 ? 's' : ''} • {Object.values(works).reduce((sum, patterns) => sum + patterns.length, 0)} patterns
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Object.values(works).reduce((sum, patterns) => sum + patterns.length, 0)}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.values(works).reduce((sum, patterns) => 
                            sum + patterns.filter(p => p.scores?.composite >= 70).length, 0
                          )}
                        </div>
                        <div className="text-xs text-gray-600">High Conf</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-8 space-y-6">
                  {Object.entries(works).map(([workTitle, patterns]) => {
                    const highConfCount = patterns.filter(p => p.scores?.composite >= 70).length;
                    const avgScore = patterns.reduce((sum, p) => sum + (p.scores?.composite || 0), 0) / patterns.length;
                    
                    return (
                      <div key={workTitle} className="space-y-3">
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
                  })}
                </div>
              </div>
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
            <p className="text-gray-600 mt-1">Browse corpus and manage analysis sessions</p>
          </div>
        </div>

        <SearchBar
          value={state.library.searchQuery || ''}
          onChange={(query) => dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: query })}
          placeholder="Search authors and works..."
          suggestions={[]}
          showSuggestions={false}
        />

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
              Corpus ({state.library.authors?.length || 0} authors)
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
              Sessions ({state.library.savedSessions?.length || 0})
            </button>
          </nav>
        </div>

        {state.library.activeTab === 'sources' ? (
          <div className="space-y-6">
            {(state.library.authors || []).length > 0 ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Authors</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(state.library.authors || []).map((author) => (
                      <button
                        key={author.folder_name}
                        onClick={() => dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: author.folder_name })}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <h3 className="font-semibold text-gray-900">{author.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{author.work_count} works</p>
                      </button>
                    ))}
                  </div>
                </div>

                {state.library.selectedAuthor && (state.library.availableWorks || []).length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Works by {state.library.authors?.find(a => a.folder_name === state.library.selectedAuthor)?.name}
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
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Library</h3>
                <p className="text-gray-600">Corpus is being loaded</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Saved Analysis Sessions</h2>
            
            {(state.library.savedSessions || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(state.library.savedSessions || []).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    showCheckbox={false}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Sessions</h3>
                <p className="text-gray-600 mb-4">Run an analysis and save your results to see them here</p>
                <button
                  onClick={() => handleNavigate('workspace')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Analysis
                </button>
              </div>
            )}
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
  <main className="flex-1 container mx-auto px-4 py-6 max-w-screen-2xl">
    {renderView()}
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
  {/* Pattern Details Modal */}
{state.ui.modals?.patternDetails && state.results.selectedPatternDetails && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Background overlay */}
    <div 
      className="absolute inset-0 bg-gray-900 bg-opacity-50"
      onClick={() => dispatch({ 
        type: ACTIONS.TOGGLE_MODAL, 
        payload: { modal: 'patternDetails', isOpen: false } 
      })}
    />

    {/* Modal panel */}
    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            Pattern Details
          </h3>
          <button
            onClick={() => dispatch({ 
              type: ACTIONS.TOGGLE_MODAL, 
              payload: { modal: 'patternDetails', isOpen: false } 
            })}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 overflow-y-auto flex-1">
        {(() => {
          const pattern = state.results.selectedPatternDetails;
          const bestCandidate = pattern.best_candidate || pattern.candidates?.[0] || {};
          
          return (
            <div className="space-y-6">
              {/* Decoded Text */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Decoded Text</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">
                    {pattern.decoded_pattern || bestCandidate.decoded_text || 'No decoded text'}
                  </p>
                </div>
              </div>

              {/* Original Text */}
              {pattern.original_text && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Original Text</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900 font-mono text-sm">
                      {pattern.original_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Method</h4>
                  <p className="text-gray-900">
                    {pattern.decoding_method || bestCandidate.method || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Segment</h4>
                  <p className="text-gray-900">
                    {pattern.section_name || pattern.segment_id || pattern.section_id || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Classification</h4>
                  <p className="text-gray-900">
                    {pattern.classification || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Composite Score</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(pattern.scores?.composite || pattern.composite_score || 0)}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Entity Score', value: pattern.scores?.entity_score || 0 },
                    { label: 'Linguistic Score', value: pattern.scores?.linguistic_score || 0 },
                    { label: 'Statistical Score', value: pattern.scores?.statistical_score || 0 },
                    { label: 'Detection Score', value: pattern.scores?.detection || 0 },
                  ].map((score) => (
                    <div key={score.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{score.label}</span>
                        <span className="font-semibold text-gray-900">{Math.round(score.value)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(score.value, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities */}
              {(pattern.entities_detected?.length > 0 || pattern.entity_matches?.length > 0) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Detected Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {(pattern.entities_detected || pattern.entity_matches || []).map((entity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {entity.name || entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All Candidates */}
              {pattern.candidates && pattern.candidates.length > 1 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    All Candidates ({pattern.candidates.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pattern.candidates.map((candidate, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded p-3"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-900 flex-1">
                            {candidate.decoded_text || candidate.text}
                          </p>
                          <span className="text-xs font-semibold text-gray-600 ml-2">
                            {Math.round((candidate.quality_score || 0) * 100)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {candidate.method}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3 border-t">
        <button
          onClick={() => dispatch({ 
            type: ACTIONS.TOGGLE_MODAL, 
            payload: { modal: 'patternDetails', isOpen: false } 
          })}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{/* Segment Candidates Modal */}
{state.ui.modals?.segmentCandidates && state.results.selectedSegment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-gray-900 bg-opacity-50"
      onClick={() => dispatch({ 
        type: ACTIONS.TOGGLE_MODAL, 
        payload: { modal: 'segmentCandidates', isOpen: false } 
      })}
    />

    <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              All Decoded Candidates
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              {state.results.selectedSegment.section_name || state.results.selectedSegment.section_id} • 
              {state.results.selectedSegment.candidates?.length || 0} candidates found
            </p>
          </div>
          <button
            onClick={() => dispatch({ 
              type: ACTIONS.TOGGLE_MODAL, 
              payload: { modal: 'segmentCandidates', isOpen: false } 
            })}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 py-4 overflow-y-auto flex-1">
        <div className="space-y-4">
          {/* Original Text */}
          {state.results.selectedSegment.original_text && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Original Text</h4>
              <p className="text-gray-900 font-mono text-sm">
                {state.results.selectedSegment.original_text}
              </p>
            </div>
          )}

          {/* Candidates List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Decoded Candidates (sorted by quality)
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                  ⭐ Credible: {state.results.selectedSegment.credible_candidates?.length || 0}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  Total: {state.results.selectedSegment.candidates?.length || 0}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {(state.results.selectedSegment.candidates || []).map((candidate, idx) => {
                const isCredible = candidate.tier === 'CREDIBLE' || candidate.quality_score >= 0.7;
                const qualityScore = Math.round((candidate.quality_score || 0) * 100);
                
                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-all ${
                      isCredible 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          isCredible ? 'bg-green-200 text-green-800' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Decoded Text */}
                        <p className="text-gray-900 font-medium mb-2">
                          {candidate.decoded_text || candidate.text}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                            {candidate.method}
                          </span>
                          
                          {isCredible && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
                              ⭐ CREDIBLE
                            </span>
                          )}

                          {candidate.tier && (
                            <span className={`px-2 py-1 rounded font-medium ${
                              candidate.tier === 'CREDIBLE' ? 'bg-green-100 text-green-700' :
                              candidate.tier === 'PLAUSIBLE' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {candidate.tier}
                            </span>
                          )}

                          {candidate.entities && candidate.entities.length > 0 && (
                            <span className="text-gray-600">
                              {candidate.entities.length} entit{candidate.entities.length === 1 ? 'y' : 'ies'}
                            </span>
                          )}
                        </div>

                        {/* Entities */}
                        {candidate.entities && candidate.entities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.entities.slice(0, 10).map((entity, eIdx) => (
                              <span
                                key={eIdx}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {entity.text || entity.name || entity}
                              </span>
                            ))}
                            {candidate.entities.length > 10 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{candidate.entities.length - 10} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score Badge */}
                      <div className="flex-shrink-0">
                        <div className={`px-3 py-2 rounded-lg text-center ${
                          qualityScore >= 80 ? 'bg-green-100 border-2 border-green-300' :
                          qualityScore >= 70 ? 'bg-blue-100 border-2 border-blue-300' :
                          qualityScore >= 50 ? 'bg-yellow-100 border-2 border-yellow-300' :
                          'bg-gray-100 border-2 border-gray-300'
                        }`}>
                          <div className={`text-xl font-bold ${
                            qualityScore >= 80 ? 'text-green-700' :
                            qualityScore >= 70 ? 'text-blue-700' :
                            qualityScore >= 50 ? 'text-yellow-700' :
                            'text-gray-700'
                          }`}>
                            {qualityScore}
                          </div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3 border-t">
        <button
          onClick={() => dispatch({ 
            type: ACTIONS.TOGGLE_MODAL, 
            payload: { modal: 'segmentCandidates', isOpen: false } 
          })}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* Work Summary Modal */}
{state.ui.modals?.workSummary && state.results.selectedWorkResults && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-gray-900 bg-opacity-50"
      onClick={() => dispatch({ 
        type: ACTIONS.TOGGLE_MODAL, 
        payload: { modal: 'workSummary', isOpen: false } 
      })}
    />

    <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Complete Work Analysis
            </h3>
            <p className="text-indigo-100 text-sm mt-1">
              {state.results.selectedWorkResults.work_title} by {state.results.selectedWorkResults.author}
            </p>
          </div>
          <button
            onClick={() => dispatch({ 
              type: ACTIONS.TOGGLE_MODAL, 
              payload: { modal: 'workSummary', isOpen: false } 
            })}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 py-4 overflow-y-auto flex-1">
        {(() => {
          const patterns = state.results.selectedWorkResults.patterns || [];
          const totalCandidates = patterns.reduce((sum, p) => sum + (p.candidates?.length || 0), 0);
          const credibleCount = patterns.reduce((sum, p) => 
            sum + (p.credible_candidates?.length || p.candidates?.filter(c => c.tier === 'CREDIBLE' || c.quality_score >= 0.7).length || 0), 0
          );
          const encodedSections = patterns.filter(p => p.is_encoded || p.classification === 'ENCODED').length;

          return (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700">{patterns.length}</div>
                  <div className="text-sm text-blue-600 font-medium">Total Segments</div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700">{credibleCount}</div>
                  <div className="text-sm text-green-600 font-medium">Credible Decodings</div>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-700">{totalCandidates}</div>
                  <div className="text-sm text-purple-600 font-medium">Total Candidates</div>
                </div>
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-indigo-700">{encodedSections}</div>
                  <div className="text-sm text-indigo-600 font-medium">Encoded Sections</div>
                </div>
              </div>

              {/* All Segments with Candidates */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">
                  All Decoded Candidates by Segment
                </h4>
                
                <div className="space-y-6">
                  {patterns.map((pattern, pIdx) => {
                    const candidates = pattern.candidates || [];
                    const credibleInSegment = candidates.filter(c => c.tier === 'CREDIBLE' || c.quality_score >= 0.7);
                    
                    return (
                      <div key={pIdx} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                        {/* Segment Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-300">
                          <div>
                            <h5 className="font-bold text-gray-900">
                              {pattern.section_name || pattern.section_id || `Segment ${pIdx + 1}`}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} • 
                              {credibleInSegment.length > 0 && (
                                <span className="text-green-600 font-medium ml-2">
                                  {credibleInSegment.length} credible
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.round(pattern.scores?.composite || pattern.composite_score || 0)}
                            </div>
                            <div className="text-xs text-gray-600">Score</div>
                          </div>
                        </div>

                        {/* Original Text */}
                        {pattern.original_text && (
                          <div className="bg-white border border-gray-200 rounded p-3 mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Original:</p>
                            <p className="text-sm text-gray-900 font-mono">
                              {pattern.original_text}
                            </p>
                          </div>
                        )}

                        {/* Top Candidates */}
                        <div className="space-y-2">
                          {candidates.slice(0, 5).map((candidate, cIdx) => {
                            const isCredible = candidate.tier === 'CREDIBLE' || candidate.quality_score >= 0.7;
                            const qualityScore = Math.round((candidate.quality_score || 0) * 100);
                            
                            return (
                              <div
                                key={cIdx}
                                className={`border rounded p-3 ${
                                  isCredible ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    cIdx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                    isCredible ? 'bg-green-200 text-green-800' :
                                    'bg-gray-200 text-gray-600'
                                  }`}>
                                    {cIdx + 1}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 font-medium">
                                      {candidate.decoded_text || candidate.text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs">
                                      <span className="text-purple-600">{candidate.method}</span>
                                      {isCredible && (
                                        <span className="text-green-600 font-bold">⭐ CREDIBLE</span>
                                      )}
                                      {candidate.entities && candidate.entities.length > 0 && (
                                        <span className="text-gray-600">
                                          {candidate.entities.length} entities
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-shrink-0">
                                    <span className={`text-sm font-bold ${
                                      qualityScore >= 70 ? 'text-green-600' :
                                      qualityScore >= 50 ? 'text-blue-600' :
                                      'text-gray-600'
                                    }`}>
                                      {qualityScore}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {candidates.length > 5 && (
                            <button
                              onClick={() => {
                                dispatch({
                                  type: ACTIONS.SET_SELECTED_SEGMENT,
                                  payload: pattern
                                });
                                dispatch({
                                  type: ACTIONS.TOGGLE_MODAL,
                                  payload: { modal: 'workSummary', isOpen: false }
                                });
                                dispatch({
                                  type: ACTIONS.TOGGLE_MODAL,
                                  payload: { modal: 'segmentCandidates', isOpen: true }
                                });
                              }}
                              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2"
                            >
                              View all {candidates.length} candidates →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3 border-t">
        <button
          onClick={() => dispatch({ 
            type: ACTIONS.TOGGLE_MODAL, 
            payload: { modal: 'workSummary', isOpen: false } 
          })}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

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