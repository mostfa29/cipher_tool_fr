// components/WorkspaceView.jsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import SourcePicker from './SourcePicker';
import EnhancedSegmentationTool from './EnhancedSegmentationTool';
import { 
  RefreshCw, 
  Save, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  BookOpen,
  Layers,
  FileText,
  ArrowLeft,
  Settings,
  Info,
  Zap,
  Download,
  Upload,
  GitCompare,
  Calendar,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// WORKSPACE HEADER COMPONENT
// ============================================================================

const WorkspaceHeader = ({ 
  activeSource, 
  hasUnsavedChanges, 
  onChangeText, 
  hasSavedSegments,
  segmentCount,
  onNavigate,
  isMultiEdition,
  editionCount
}) => {
  if (!activeSource) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workspace</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a text to begin segmentation and analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            {isMultiEdition ? (
              <GitCompare className="w-6 h-6 text-white" />
            ) : (
              <FileText className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeSource.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {activeSource.author}
              </span>
              <span>•</span>
              {isMultiEdition ? (
                <span className="flex items-center gap-1">
                  <GitCompare className="w-4 h-4" />
                  {editionCount} edition{editionCount !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {activeSource.line_count?.toLocaleString()} lines
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Segment Count Badge */}
          {segmentCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-lg text-blue-900">{segmentCount}</span>
              <span className="text-sm text-blue-700 font-medium">segments</span>
            </div>
          )}

          {/* Status Badge */}
          {hasUnsavedChanges && segmentCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border-2 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">Unsaved</span>
            </div>
          )}
          
          {hasSavedSegments && !hasUnsavedChanges && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border-2 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900">Saved</span>
            </div>
          )}

          {/* Change Text Button */}
          <button
            onClick={onChangeText}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            title="Change source text"
          >
            <RefreshCw className="w-4 h-4" />
            Change Text
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyWorkspaceState = () => {
  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to Segmentation Workspace
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a text from your corpus library, upload a new work, or paste text to begin creating segments for cipher analysis
          </p>
        </div>

        {/* SourcePicker with NO props - it handles everything internally */}
        <SourcePicker />

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Layers className="w-6 h-6 text-blue-600" />}
            title="Multi-Edition Support"
            description="Analyze multiple editions simultaneously to track cipher evolution"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            title="Smart Segmentation"
            description="AI-powered algorithms detect natural breaks and semantic boundaries"
          />
          <FeatureCard
            icon={<Target className="w-6 h-6 text-green-600" />}
            title="Nested Segments"
            description="Create hierarchical annotations for complex multi-layer ciphers"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// QUICK START WIZARD (Optional helper for first-time users)
// ============================================================================

const QuickStartWizard = ({ onDismiss, onSelectMode }) => {
  const [showWizard, setShowWizard] = useState(() => {
    const hasSeenWizard = localStorage.getItem('merlin_workspace_wizard_seen');
    return !hasSeenWizard;
  });

  const handleDismiss = useCallback(() => {
    localStorage.setItem('merlin_workspace_wizard_seen', 'true');
    setShowWizard(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!showWizard) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to the Segmentation Workspace!
          </h2>
          <p className="text-lg text-gray-600">
            Choose your workflow to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <WorkflowCard
            icon={<BookOpen className="w-8 h-8 text-blue-600" />}
            title="Single Edition"
            description="Analyze one edition of a work with manual or automatic segmentation"
            onClick={() => {
              onSelectMode?.('single');
              handleDismiss();
            }}
          />
          <WorkflowCard
            icon={<GitCompare className="w-8 h-8 text-purple-600" />}
            title="Multi-Edition"
            description="Compare multiple editions to track cipher evolution and spoilage"
            recommended
            onClick={() => {
              onSelectMode?.('multi');
              handleDismiss();
            }}
          />
        </div>

        <button
          onClick={handleDismiss}
          className="w-full px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
};

const WorkflowCard = ({ icon, title, description, recommended, onClick }) => (
  <button
    onClick={onClick}
    className={`
      p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02]
      ${recommended 
        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-600' 
        : 'border-gray-200 bg-white hover:border-blue-300'
      }
    `}
  >
    <div className="flex items-start gap-4 mb-4">
      <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
          {title}
          {recommended && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
              RECOMMENDED
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </button>
);

// ============================================================================
// MAIN WORKSPACE VIEW COMPONENT
// ============================================================================

const WorkspaceView = () => {
  const { state, dispatch, saveSegmentation, addNotification } = useAppState();
  const { workspace, ui } = state;
  const { currentSource, segments, boundaries } = workspace;

  const [workflowMode, setWorkflowMode] = useState(null);

  const segmentCount = useMemo(() => {
    if (!segments) return 0;
    if (Array.isArray(segments)) return segments.length;
    
    if (typeof segments === 'object') {
      return Object.values(segments).reduce((sum, editionSegments) => {
        return sum + (Array.isArray(editionSegments) ? editionSegments.length : 0);
      }, 0);
    }
    
    return 0;
  }, [segments]);

  const isMultiEdition = useMemo(() => {
    const hasMultipleEditions = (currentSource?.edition_count || 0) > 1 || 
                                (currentSource?.editions?.length || 0) > 1;
    
    return workflowMode === 'multi' || hasMultipleEditions;
  }, [workflowMode, currentSource]);

  const editionCount = useMemo(() => {
    return currentSource?.edition_count || 
           currentSource?.editions?.length || 
           1;
  }, [currentSource]);

  const handleChangeText = useCallback(() => {
    if (ui.hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to change the source text?')) {
        return;
      }
    }
    
    dispatch({ type: ACTIONS.CLEAR_WORKSPACE });
    setWorkflowMode(null);
    
    addNotification('info', 'Workspace cleared');
  }, [ui.hasUnsavedChanges, dispatch, addNotification]);

  const handleNavigateToAnalysis = useCallback(() => {
    if (segments?.length === 0) {
      addNotification('warning', 'Create segments before analyzing');
      return;
    }
    
    if (ui.hasUnsavedChanges) {
      addNotification('warning', 'Save segments before analyzing');
      return;
    }
    
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'analyze' });
  }, [segments, ui.hasUnsavedChanges, dispatch, addNotification]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentSource && segments?.length > 0) {
          saveSegmentation();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentSource && segments?.length > 0 && !ui.hasUnsavedChanges) {
          handleNavigateToAnalysis();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSource, segments, ui.hasUnsavedChanges, saveSegmentation, handleNavigateToAnalysis]);

  // Show empty state if no source selected
  if (!currentSource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <WorkspaceHeader 
            activeSource={null}
            hasUnsavedChanges={false}
            onChangeText={handleChangeText}
            hasSavedSegments={false}
            segmentCount={0}
            onNavigate={handleNavigateToAnalysis}
            isMultiEdition={false}
            editionCount={1}
          />
          
          <EmptyWorkspaceState />
          
          <QuickStartWizard
            onSelectMode={setWorkflowMode}
            onDismiss={() => {}}
          />
        </div>
      </div>
    );
  }

  // Show segmentation tool
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <WorkspaceHeader 
          activeSource={currentSource}
          hasUnsavedChanges={ui.hasUnsavedChanges}
          onChangeText={handleChangeText}
          hasSavedSegments={segments?.length > 0 && !ui.hasUnsavedChanges}
          segmentCount={segmentCount}
          onNavigate={handleNavigateToAnalysis}
          isMultiEdition={isMultiEdition}
          editionCount={editionCount}
        />

        <KeyboardShortcutsHint />

        <EnhancedSegmentationTool
          onBack={handleChangeText}
          saveSegmentation={saveSegmentation}
          hasUnsavedChanges={ui.hasUnsavedChanges}
          onAnalyze={handleNavigateToAnalysis}
        />
      </div>
    </div>
  );
};

// ============================================================================
// KEYBOARD SHORTCUTS HINT
// ============================================================================

const KeyboardShortcutsHint = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">
            Keyboard Shortcuts
          </span>
        </div>
        <span className="text-xs text-blue-700">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ShortcutItem 
            keys={['Ctrl/Cmd', 'S']} 
            description="Save segments" 
          />
          <ShortcutItem 
            keys={['Ctrl/Cmd', 'Enter']} 
            description="Start analysis" 
          />
          <ShortcutItem 
            keys={['Esc']} 
            description="Clear selection" 
          />
          <ShortcutItem 
            keys={['Delete']} 
            description="Delete selected segment" 
          />
          <ShortcutItem 
            keys={['Drag']} 
            description="Select text to annotate" 
          />
          <ShortcutItem 
            keys={['Click']} 
            description="Select/interact with segment" 
          />
        </div>
      )}
    </div>
  );
};

const ShortcutItem = ({ keys, description }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1">
      {keys.map((key, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-blue-600 text-xs mx-1">+</span>}
          <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono text-blue-900 shadow-sm">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
    <span className="text-xs text-blue-800">{description}</span>
  </div>
);

export default WorkspaceView;
export { WorkspaceHeader, EmptyWorkspaceState, QuickStartWizard };