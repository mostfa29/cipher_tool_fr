import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  FileText, 
  Scissors, 
  Save, 
  Play, 
  ChevronDown,
  ChevronUp,
  Settings,
  Grid3x3,
  Type,
  List,
  Check,
  X,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  Undo,
  RefreshCw
} from 'lucide-react';

// ==================== CONSTANTS ====================
const SEGMENTATION_MODES = [
  { 
    value: 'paragraph', 
    label: 'Paragraphs', 
    icon: Type,
    description: 'Split by blank lines (most common)'
  },
  { 
    value: 'fixed_length', 
    label: 'Fixed Length', 
    icon: Grid3x3,
    description: 'Equal-sized segments'
  },
  { 
    value: 'two_line_pairs', 
    label: 'Line Pairs', 
    icon: List,
    description: 'Every 2 lines'
  },
  { 
    value: 'title', 
    label: 'Titles Only', 
    icon: Type,
    description: 'Uppercase or short lines'
  }
];

// ==================== SUB-COMPONENTS ====================

const WorkspaceHeader = ({ workTitle, hasUnsavedChanges, onSave, onAnalyze, isSaving }) => (
  <div className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">{workTitle}</h1>
          <p className="text-sm text-gray-500">Workspace - Segment & Analyze</p>
        </div>
        {hasUnsavedChanges && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
            Unsaved Changes
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            hasUnsavedChanges && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Segments
        </button>
        
        <button
          onClick={onAnalyze}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          Analyze
        </button>
      </div>
    </div>
  </div>
);

const SegmentationControls = ({ 
  mode, 
  segmentSize, 
  onModeChange, 
  onSizeChange, 
  onAutoSegment,
  segmentCount,
  isProcessing 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className="bg-white border-b border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Segmentation Controls</span>
          {segmentCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {segmentCount} segments
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SEGMENTATION_MODES.map(({ value, label, icon: Icon, description }) => (
              <button
                key={value}
                onClick={() => onModeChange(value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  mode === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    mode === value ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 mb-1">{label}</div>
                    <div className="text-xs text-gray-600">{description}</div>
                  </div>
                  {mode === value && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {mode === 'fixed_length' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lines per segment
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={segmentSize}
                  onChange={(e) => onSizeChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={segmentSize}
                  onChange={(e) => onSizeChange(parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onAutoSegment}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Auto-Segment
            </button>
            
            <div className="text-sm text-gray-600">
              Click to automatically create segments using {SEGMENTATION_MODES.find(m => m.value === mode)?.label.toLowerCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SegmentPreview = ({ segments, onToggleBoundary, showPreview }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!showPreview || segments.length === 0) return null;
  
  return (
    <div className="bg-white border-b border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Segment Preview</span>
          <span className="text-sm text-gray-500">({segments.length} segments)</span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-4 pt-2 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      Lines {segment.start_line + 1}–{segment.end_line + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({segment.text.length} chars)
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {segment.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TextViewer = ({ lines, boundaries, onToggleBoundary, mode }) => {
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  
  const isSegmentBoundary = useCallback((lineIndex) => {
    return boundaries.includes(lineIndex);
  }, [boundaries]);
  
  const canToggleBoundary = useCallback((lineIndex) => {
    return lineIndex !== 0 && lineIndex !== lines.length;
  }, [lines.length]);
  
  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Text Editor</span>
          <span className="text-sm text-gray-500">({lines.length} lines)</span>
        </div>
        
        <button
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {showLineNumbers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showLineNumbers ? 'Hide' : 'Show'} Line Numbers
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-0">
          {lines.map((line, index) => {
            const isBoundary = isSegmentBoundary(index);
            const isClickable = canToggleBoundary(index);
            
            return (
              <div key={index} className="relative group">
                {isBoundary && index !== 0 && (
                  <div className="absolute inset-x-0 -top-2 h-4 flex items-center">
                    <div className="flex-1 border-t-2 border-blue-500" />
                    <button
                      onClick={() => onToggleBoundary(index)}
                      className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                    >
                      Remove Break
                    </button>
                    <div className="flex-1 border-t-2 border-blue-500" />
                  </div>
                )}
                
                <div
                  onClick={isClickable ? () => onToggleBoundary(index) : undefined}
                  className={`flex items-start gap-3 py-1 px-2 rounded ${
                    isBoundary ? 'mt-4' : ''
                  } ${
                    isClickable 
                      ? 'cursor-pointer hover:bg-blue-50 transition-colors' 
                      : ''
                  }`}
                >
                  {showLineNumbers && (
                    <span className="flex-shrink-0 w-12 text-right text-xs text-gray-400 select-none">
                      {index + 1}
                    </span>
                  )}
                  
                  <span className="flex-1 text-sm text-gray-800 font-mono leading-relaxed">
                    {line || '\u00A0'}
                  </span>
                  
                  {isClickable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBoundary(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-all"
                    >
                      {isBoundary ? 'Remove' : 'Add'} Break
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span>
            Click between lines to add segment breaks. Click on blue lines to remove breaks.
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Workspace = () => {
  const { state, dispatch, saveSegmentation, createAutoSegmentation, startAnalysis, addNotification } = useAppState();
  const { workspace, ui } = state;
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSegmenting, setIsAutoSegmenting] = useState(false);
  const [localSegmentSize, setLocalSegmentSize] = useState(workspace.customSegmentSize || 20);
  
  // ==================== COMPUTED VALUES ====================
  const currentSegments = useMemo(() => {
    if (!workspace.boundaries || !workspace.currentSource?.lines) return [];
    
    const { boundaries, currentSource } = workspace;
    const segments = [];
    
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      const segmentLines = currentSource.lines.slice(start, end);
      
      segments.push({
        id: `segment_${start}_${end}`,
        name: `Lines ${start + 1}-${end}`,
        start_line: start,
        end_line: end - 1,
        text: segmentLines.join('\n'),
        lines: segmentLines
      });
    }
    
    return segments;
  }, [workspace.boundaries, workspace.currentSource]);
  
  // ==================== HANDLERS ====================
  const handleModeChange = useCallback((newMode) => {
    dispatch({
      type: ACTIONS.SET_SEGMENTATION_MODE,
      payload: { mode: newMode, customSize: localSegmentSize }
    });
  }, [dispatch, localSegmentSize]);
  
  const handleSizeChange = useCallback((newSize) => {
    setLocalSegmentSize(newSize);
    dispatch({
      type: ACTIONS.SET_SEGMENTATION_MODE,
      payload: { mode: workspace.segmentationMode, customSize: newSize }
    });
  }, [dispatch, workspace.segmentationMode]);
  
  const handleAutoSegment = useCallback(async () => {
    if (!workspace.currentSource) return;
    
    setIsAutoSegmenting(true);
    
    try {
      await createAutoSegmentation(
        workspace.segmentationMode,
        localSegmentSize
      );
    } catch (error) {
      console.error('Auto-segmentation failed:', error);
    } finally {
      setIsAutoSegmenting(false);
    }
  }, [workspace.currentSource, workspace.segmentationMode, localSegmentSize, createAutoSegmentation]);
  
  const handleToggleBoundary = useCallback((lineIndex) => {
    dispatch({
      type: ACTIONS.TOGGLE_BOUNDARY,
      payload: lineIndex
    });
  }, [dispatch]);
  
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Update segments before saving
      dispatch({
        type: ACTIONS.SET_SEGMENTS,
        payload: currentSegments
      });
      
      // Save to backend
      await saveSegmentation();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, currentSegments, saveSegmentation]);
  
  const handleAnalyze = useCallback(async () => {
    if (currentSegments.length === 0) {
      addNotification('error', 'Please create segments before analyzing');
      return;
    }
    
    // Update segments in state
    dispatch({
      type: ACTIONS.SET_SEGMENTS,
      payload: currentSegments
    });
    
    // Start analysis
    await startAnalysis();
  }, [currentSegments, dispatch, startAnalysis, addNotification]);
  
  // ==================== EFFECTS ====================
  useEffect(() => {
    // Initialize boundaries if not set
    if (workspace.currentSource?.lines && workspace.boundaries.length === 0) {
      dispatch({
        type: ACTIONS.SET_BOUNDARIES,
        payload: [0, workspace.currentSource.lines.length]
      });
    }
  }, [workspace.currentSource, workspace.boundaries.length, dispatch]);
  
  // ==================== RENDER ====================
  if (!workspace.currentSource) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Work Loaded</h2>
          <p className="text-gray-600">Select a work from the Library to begin</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <WorkspaceHeader
        workTitle={workspace.currentSource.title}
        hasUnsavedChanges={ui.hasUnsavedChanges}
        onSave={handleSave}
        onAnalyze={handleAnalyze}
        isSaving={isSaving}
      />
      
      <SegmentationControls
        mode={workspace.segmentationMode}
        segmentSize={localSegmentSize}
        onModeChange={handleModeChange}
        onSizeChange={handleSizeChange}
        onAutoSegment={handleAutoSegment}
        segmentCount={currentSegments.length}
        isProcessing={isAutoSegmenting}
      />
      
      <SegmentPreview
        segments={currentSegments}
        onToggleBoundary={handleToggleBoundary}
        showPreview={currentSegments.length > 0}
      />
      
      <TextViewer
        lines={workspace.currentSource.lines}
        boundaries={workspace.boundaries}
        onToggleBoundary={handleToggleBoundary}
        mode={workspace.segmentationMode}
      />
    </div>
  );
};

export default Workspace;