// src/WorkspaceView/VirtualizedTextDisplay.jsx
// Enhanced virtualized text display with refined typography and advanced segmentation features

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useAppState, ACTIONS } from '../context/AppContext';
import {
  Copy, Check, Edit2, Trash2, Scissors, ZoomIn, ZoomOut,
  Hash, ChevronDown, ChevronUp, Search, X, FileText, Layers,
  Split, Combine, Lock, Unlock, AlertCircle, CheckCircle,
  Bookmark, Navigation, Maximize2, Minimize2, Info
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const FONT_SIZES = {
  small: 'text-xs leading-relaxed',
  medium: 'text-sm leading-relaxed',
  large: 'text-base leading-relaxed',
  xlarge: 'text-lg leading-relaxed',
};

const SEGMENT_COLORS = [
  'bg-blue-50/50',
  'bg-emerald-50/50', 
  'bg-amber-50/50',
  'bg-purple-50/50',
  'bg-pink-50/50',
  'bg-indigo-50/50',
  'bg-cyan-50/50',
  'bg-rose-50/50',
];

const BORDER_COLORS = [
  'border-blue-300',
  'border-emerald-300',
  'border-amber-300',
  'border-purple-300',
  'border-pink-300',
  'border-indigo-300',
  'border-cyan-300',
  'border-rose-300',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const VirtualizedTextDisplay = ({ 
  segmentationMode = false,
  highlightSegments = true,
  showMetadata = true 
}) => {
  const { state, dispatch } = useAppState();
  const { activeSource, boundaries, selectedSegmentId } = state.workspace;
  
  // View state
  const [fontSize, setFontSize] = useState('medium');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [expandedStats, setExpandedStats] = useState(false);
  
  // Interaction state
  const [hoveredBoundary, setHoveredBoundary] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [copiedSegment, setCopiedSegment] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  
  // Segment state
  const [lockedSegments, setLockedSegments] = useState(new Set());
  const [bookmarkedSegments, setBookmarkedSegments] = useState(new Set());
  const [editingSegment, setEditingSegment] = useState(null);
  
  const virtuosoRef = useRef(null);
  const searchInputRef = useRef(null);

  const lines = useMemo(() => activeSource?.lines || [], [activeSource]);

  // ============================================================================
  // COMPUTED SEGMENTS
  // ============================================================================
  const segments = useComputeSegments(
    boundaries, 
    lines, 
    lockedSegments, 
    bookmarkedSegments
  );

  const stats = useComputeStats(segments);
  const searchResults = useSearchResults(segments, searchTerm);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const toggleBoundary = useToggleBoundary(boundaries, dispatch);
  const deleteSegment = useDeleteSegment(boundaries, dispatch);
  const splitSegment = useSplitSegment(boundaries, dispatch);
  const mergeWithNext = useMergeSegment(segments, boundaries, dispatch);
  
  const toggleLock = useCallback((segmentId) => {
    setLockedSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentId)) {
        newSet.delete(segmentId);
      } else {
        newSet.add(segmentId);
      }
      return newSet;
    });
  }, []);

  const toggleBookmark = useCallback((segmentId) => {
    setBookmarkedSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentId)) {
        newSet.delete(segmentId);
      } else {
        newSet.add(segmentId);
      }
      return newSet;
    });
  }, []);

  const scrollToSegment = useCallback((segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: segment.startLine,
        align: 'center',
        behavior: 'smooth'
      });
      dispatch({ type: ACTIONS.SET_SELECTED_SEGMENT, payload: segmentId });
    }
  }, [segments, dispatch]);

  const copySegmentText = useCopySegment(setCopiedSegment, dispatch);
  const handleCopyText = useCopyAllText(activeSource, dispatch);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useKeyboardShortcuts(setSearchVisible, searchInputRef, dispatch);

  // ============================================================================
  // HELPERS
  // ============================================================================
  const getSegmentForLine = useCallback((lineIndex) => {
    return segments.find(seg => 
      lineIndex >= seg.startLine && lineIndex < seg.endLine
    );
  }, [segments]);

  // ============================================================================
  // ROW RENDERER
  // ============================================================================
  const rowContent = useCallback((index) => {
    const line = lines[index];
    const segment = getSegmentForLine(index);
    const hasBoundaryAfter = boundaries?.includes(index + 1);
    const isFirstInSegment = segment && index === segment.startLine;
    const isLastInSegment = segment && index === segment.endLine - 1;
    const isSelected = segment && segment.id === selectedSegmentId;
    const isHovered = segment && segment.id === hoveredSegment;
    const matchesSearch = searchTerm && segment && 
      segment.text.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <div className="w-full">
        {/* Segment header */}
        {isFirstInSegment && highlightSegments && (
          <SegmentHeader
            segment={segment}
            isSelected={isSelected}
            isHovered={isHovered}
            matchesSearch={matchesSearch}
            segmentationMode={segmentationMode}
            copiedSegment={copiedSegment}
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
            onToggleBookmark={toggleBookmark}
            onToggleLock={toggleLock}
            onCopy={() => copySegmentText(segment)}
            onEdit={() => setEditingSegment(segment)}
            onDelete={() => deleteSegment(segment)}
            onToggleSelect={() => dispatch({ 
              type: ACTIONS.SET_SELECTED_SEGMENT, 
              payload: isSelected ? null : segment.id 
            })}
          />
        )}

        {/* Line content */}
        <LineContent
          line={line}
          lineIndex={index}
          segment={segment}
          isSelected={isSelected}
          isHovered={isHovered}
          isFirstInSegment={isFirstInSegment}
          isLastInSegment={isLastInSegment}
          matchesSearch={matchesSearch}
          highlightSegments={highlightSegments}
          showLineNumbers={showLineNumbers}
          fontSize={fontSize}
          compactMode={compactMode}
          segmentationMode={segmentationMode}
          onSplit={() => splitSegment(segment, index + 1)}
        />

        {/* Boundary control */}
        {segmentationMode && !compactMode && (
          <BoundaryControl
            lineIndex={index + 1}
            hasBoundary={hasBoundaryAfter}
            hoveredBoundary={hoveredBoundary}
            onMouseEnter={() => setHoveredBoundary(index + 1)}
            onMouseLeave={() => setHoveredBoundary(null)}
            onToggle={() => toggleBoundary(index + 1)}
          />
        )}
      </div>
    );
  }, [
    lines,
    boundaries,
    segments,
    segmentationMode,
    highlightSegments,
    showLineNumbers,
    fontSize,
    selectedSegmentId,
    hoveredBoundary,
    hoveredSegment,
    copiedSegment,
    searchTerm,
    compactMode,
    getSegmentForLine,
    toggleBoundary,
    deleteSegment,
    splitSegment,
    toggleLock,
    toggleBookmark,
    copySegmentText,
    dispatch
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!activeSource) {
    return <EmptyState message="No source loaded" />;
  }

  const currentSegment = selectedSegmentId ? 
    segments.find(s => s.id === selectedSegmentId) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      {showMetadata && (
        <DocumentHeader
          source={activeSource}
          segments={segments}
          stats={stats}
          segmentationMode={segmentationMode}
          expandedStats={expandedStats}
          onToggleStats={() => setExpandedStats(!expandedStats)}
        />
      )}

      {/* Toolbar */}
      <Toolbar
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        showLineNumbers={showLineNumbers}
        onToggleLineNumbers={() => setShowLineNumbers(!showLineNumbers)}
        compactMode={compactMode}
        onToggleCompactMode={() => setCompactMode(!compactMode)}
        searchVisible={searchVisible}
        onToggleSearch={() => {
          setSearchVisible(!searchVisible);
          if (!searchVisible) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }
        }}
        currentSegment={currentSegment}
        segments={segments}
        onMerge={() => mergeWithNext(currentSegment)}
        onClearSelection={() => dispatch({ type: ACTIONS.SET_SELECTED_SEGMENT, payload: null })}
        onCopyAll={handleCopyText}
        lineCount={lines.length}
      />

      {/* Search bar */}
      {searchVisible && (
        <SearchBar
          ref={searchInputRef}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resultCount={searchResults.length}
          onClose={() => {
            setSearchVisible(false);
            setSearchTerm('');
          }}
        />
      )}

      {/* Virtualized text content */}
      <div className="flex-1 overflow-hidden">
        {lines.length > 0 ? (
          <Virtuoso
            ref={virtuosoRef}
            totalCount={lines.length}
            itemContent={rowContent}
            style={{ height: '100%' }}
            overscan={20}
          />
        ) : (
          <EmptyState message="No content to display" />
        )}
      </div>

      {/* Edit modal */}
      {editingSegment && (
        <EditSegmentModal
          segment={editingSegment}
          onSave={(newText) => {
            // TODO: Implement save logic
            setEditingSegment(null);
          }}
          onCancel={() => setEditingSegment(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// SEGMENT HEADER COMPONENT
// ============================================================================
const SegmentHeader = ({
  segment,
  isSelected,
  isHovered,
  matchesSearch,
  segmentationMode,
  copiedSegment,
  onMouseEnter,
  onMouseLeave,
  onToggleBookmark,
  onToggleLock,
  onCopy,
  onEdit,
  onDelete,
  onToggleSelect
}) => {
  const segmentColor = getSegmentColor(segment);
  const borderColor = getBorderColor(segment);
  const qualityColor = getQualityColor(segment.quality);

  return (
    <div 
      className={`
        group relative flex items-center justify-between px-4 py-2.5 border-t-2 transition-all duration-200
        ${borderColor} ${segmentColor}
        ${isSelected ? 'ring-2 ring-blue-400 ring-inset shadow-sm' : ''}
        ${isHovered ? 'shadow-md' : ''}
        ${matchesSearch ? 'ring-2 ring-yellow-400 ring-inset' : ''}
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-3">
        {/* Segment number badge */}
        <div className={`
          flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shadow-sm
          ${segment.isValid ? 'bg-white/80 text-gray-700' : 'bg-red-100 text-red-700'}
        `}>
          {segment.numericId}
        </div>
        
        {/* Metrics */}
        <div className="flex items-center gap-2">
          <MetricBadge
            value={`${segment.letterCount}L`}
            variant={segment.isValid ? 'success' : 'error'}
          />
          <MetricBadge value={`${segment.wordCount}W`} variant="default" />
          <MetricBadge 
            value={`${segment.lineCount} ${segment.lineCount === 1 ? 'line' : 'lines'}`} 
            variant="default" 
          />
          <MetricBadge
            value={`${segment.quality}%`}
            className={qualityColor}
          />
          {segment.hasEndPunctuation && (
            <CheckCircle className="w-4 h-4 text-emerald-500" title="Complete sentence" />
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1">
          {segment.isLocked && (
            <StatusBadge icon={Lock} variant="locked" />
          )}
          {segment.isBookmarked && (
            <StatusBadge icon={Bookmark} variant="bookmarked" />
          )}
        </div>
      </div>
      
      {/* Actions */}
      {segmentationMode && (
        <SegmentActions
          segment={segment}
          copiedSegment={copiedSegment}
          isSelected={isSelected}
          onToggleBookmark={() => onToggleBookmark(segment.id)}
          onToggleLock={() => onToggleLock(segment.id)}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSelect={onToggleSelect}
        />
      )}
    </div>
  );
};

// ============================================================================
// SEGMENT ACTIONS COMPONENT
// ============================================================================
const SegmentActions = ({
  segment,
  copiedSegment,
  isSelected,
  onToggleBookmark,
  onToggleLock,
  onCopy,
  onEdit,
  onDelete,
  onToggleSelect
}) => (
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <ActionButton
      onClick={onToggleBookmark}
      icon={Bookmark}
      variant={segment.isBookmarked ? 'bookmarked' : 'default'}
      title="Bookmark segment"
    />
    
    <ActionButton
      onClick={onToggleLock}
      icon={segment.isLocked ? Lock : Unlock}
      variant={segment.isLocked ? 'locked' : 'default'}
      title={segment.isLocked ? 'Unlock segment' : 'Lock segment'}
    />
    
    <ActionButton
      onClick={onCopy}
      icon={copiedSegment === segment.id ? Check : Copy}
      variant={copiedSegment === segment.id ? 'success' : 'default'}
      title="Copy segment text"
    />
    
    <ActionButton
      onClick={onEdit}
      icon={Edit2}
      disabled={segment.isLocked}
      title="Edit segment"
    />
    
    <ActionButton
      onClick={onDelete}
      icon={Trash2}
      variant="danger"
      disabled={segment.isLocked}
      title="Delete segment"
    />
    
    <ActionButton
      onClick={onToggleSelect}
      icon={Navigation}
      variant={isSelected ? 'selected' : 'default'}
      className={isSelected ? 'fill-current' : ''}
      title={isSelected ? 'Deselect segment' : 'Select segment'}
    />
  </div>
);

// ============================================================================
// LINE CONTENT COMPONENT
// ============================================================================
const LineContent = ({
  line,
  lineIndex,
  segment,
  isSelected,
  isHovered,
  isFirstInSegment,
  isLastInSegment,
  matchesSearch,
  highlightSegments,
  showLineNumbers,
  fontSize,
  compactMode,
  segmentationMode,
  onSplit
}) => {
  const segmentColor = segment && highlightSegments ? getSegmentColor(segment) : '';
  
  return (
    <div className={`
      group relative flex gap-3 px-4 py-1 transition-colors duration-150
      ${segmentColor}
      ${isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''}
      ${isHovered ? 'bg-white/30' : ''}
      ${compactMode ? 'py-0.5' : 'py-1'}
      ${matchesSearch ? 'bg-yellow-100/50' : ''}
    `}>
      {showLineNumbers && (
        <span className={`
          flex-shrink-0 w-12 text-right font-mono select-none transition-colors
          ${compactMode ? 'text-[10px]' : 'text-xs'}
          ${isHovered ? 'text-gray-600 font-semibold' : 'text-gray-400'}
        `}>
          {lineIndex + 1}
        </span>
      )}
      
      <div className={`
        flex-1 font-mono whitespace-pre-wrap break-words text-gray-800
        ${FONT_SIZES[fontSize]}
        ${compactMode ? 'leading-snug' : ''}
      `}>
        {line || '\u00A0'}
      </div>

      {/* Split button */}
      {isSelected && segmentationMode && !isFirstInSegment && !isLastInSegment && !segment?.isLocked && (
        <button
          onClick={onSplit}
          className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-all shadow-md hover:shadow-lg z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
          title="Split segment here"
        >
          <Scissors className="w-3.5 h-3.5" />
          Split
        </button>
      )}
    </div>
  );
};

// ============================================================================
// BOUNDARY CONTROL COMPONENT
// ============================================================================
const BoundaryControl = ({
  lineIndex,
  hasBoundary,
  hoveredBoundary,
  onMouseEnter,
  onMouseLeave,
  onToggle
}) => (
  <div
    className={`
      relative h-8 group/boundary cursor-pointer transition-all duration-200
      ${hoveredBoundary === lineIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
    `}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onToggle}
  >
    {hasBoundary ? (
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-4">
        <div className="flex-1 border-t-2 border-dashed border-blue-400"></div>
        <button className="mx-3 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5">
          <X className="w-3 h-3" />
          Remove
        </button>
        <div className="flex-1 border-t-2 border-dashed border-blue-400"></div>
      </div>
    ) : (
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-4 opacity-0 group-hover/boundary:opacity-100 transition-opacity">
        <div className="flex-1 border-t border-dashed border-gray-300"></div>
        <button className="mx-3 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5">
          <Split className="w-3 h-3" />
          Add Boundary
        </button>
        <div className="flex-1 border-t border-dashed border-gray-300"></div>
      </div>
    )}
  </div>
);

// ============================================================================
// DOCUMENT HEADER COMPONENT
// ============================================================================
const DocumentHeader = ({
  source,
  segments,
  stats,
  segmentationMode,
  expandedStats,
  onToggleStats
}) => (
  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {source.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span className="font-medium">{source.author}</span>
          </span>
          {source.date && (
            <>
              <span className="text-gray-300">•</span>
              <span>{source.date}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-end">
        {segments.length > 0 && (
          <InfoBadge icon={Layers} value={`${segments.length} segments`} variant="primary" />
        )}
        {segmentationMode && (
          <InfoBadge icon={Edit2} value="Edit Mode" variant="success" />
        )}
        {stats && stats.locked > 0 && (
          <InfoBadge icon={Lock} value={stats.locked} variant="locked" />
        )}
        {stats && stats.bookmarked > 0 && (
          <InfoBadge icon={Bookmark} value={stats.bookmarked} variant="bookmarked" />
        )}
      </div>
    </div>

    {/* Expandable statistics */}
    {stats && (
      <div className="mt-4">
        <button
          onClick={onToggleStats}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          {expandedStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Statistics
        </button>
        
        {expandedStats && (
          <div className="mt-3 grid grid-cols-4 gap-3 animate-in slide-in-from-top-2">
            <StatCard label="Avg Quality" value={`${stats.avgQuality}%`} color={getQualityColor(stats.avgQuality)} />
            <StatCard label="Valid" value={`${stats.valid}/${stats.total}`} color="text-emerald-600" />
            <StatCard label="Avg Letters" value={stats.avgLetters} color="text-blue-600" />
            <StatCard label="Total Words" value={stats.totalWords.toLocaleString()} color="text-purple-600" />
          </div>
        )}
      </div>
    )}
  </div>
);

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================
const Toolbar = ({
  fontSize,
  onFontSizeChange,
  showLineNumbers,
  onToggleLineNumbers,
  compactMode,
  onToggleCompactMode,
  searchVisible,
  onToggleSearch,
  currentSegment,
  segments,
  onMerge,
  onClearSelection,
  onCopyAll,
  lineCount
}) => (
  <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4 flex-shrink-0">
    <div className="flex items-center gap-2">
      <select
        value={fontSize}
        onChange={(e) => onFontSizeChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
        <option value="xlarge">X-Large</option>
      </select>

      <ToolbarButton
        icon={Hash}
        active={showLineNumbers}
        onClick={onToggleLineNumbers}
        title="Toggle line numbers"
      />

      <ToolbarButton
        icon={compactMode ? Minimize2 : Maximize2}
        active={compactMode}
        onClick={onToggleCompactMode}
        activeColor="purple"
        title="Toggle compact mode"
      />

      <ToolbarButton
        icon={Search}
        active={searchVisible}
        onClick={onToggleSearch}
        activeColor="amber"
        title="Search (Ctrl+F)"
      />
    </div>

    <div className="flex items-center gap-2">
      {currentSegment && (
        <>
          <button
            onClick={onMerge}
            disabled={currentSegment.numericId === segments.length || currentSegment.isLocked}
            className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center gap-1.5"
            title="Merge with next segment"
          >
            <Combine className="w-4 h-4" />
            Merge
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
      
      <button
        onClick={onCopyAll}
        className="px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow flex items-center gap-1.5"
        title="Copy all text"
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>
      
      <span className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg font-medium">
        {lineCount.toLocaleString()} lines
      </span>
    </div>
  </div>
);

// ============================================================================
// SEARCH BAR COMPONENT
// ============================================================================
const SearchBar = React.forwardRef(({ searchTerm, onSearchChange, resultCount, onClose }, ref) => (
  <div className="px-6 py-3 border-b border-gray-200 bg-amber-50 flex items-center gap-3 animate-in slide-in-from-top-2">
    <Search className="w-4 h-4 text-gray-600" />
    <input
      ref={ref}
      type="text"
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search in segments..."
      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
    />
    {searchTerm && (
      <span className="text-sm text-gray-600 font-medium">
        {resultCount} result{resultCount !== 1 ? 's' : ''}
      </span>
    )}
    <button
      onClick={onClose}
      className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
));

SearchBar.displayName = 'SearchBar';

// ============================================================================
// EDIT SEGMENT MODAL COMPONENT
// ============================================================================
const EditSegmentModal = ({ segment, onSave, onCancel }) => {
  const [text, setText] = useState(segment?.text || '');
  const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lineCount = text.split('\n').length;
  const isValid = letterCount >= 5 && letterCount <= 1000;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            Edit Segment {segment.numericId}
          </h3>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-3">
            <span>Lines {segment.startLine + 1} - {segment.endLine}</span>
            <span className="text-gray-400">•</span>
            <span>{segment.lineCount} lines</span>
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 flex-1 overflow-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-80 px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-inner"
            placeholder="Enter segment text..."
          />
          
          {/* Metrics */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <MetricDisplay label="Letters" value={letterCount} color="blue" />
            <MetricDisplay label="Words" value={wordCount} color="purple" />
            <MetricDisplay label="Lines" value={lineCount} color="gray" />
            
            {!isValid && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-600">
                  {letterCount < 5 ? 'Too short (min 5 letters)' : 'Too long (max 1000 letters)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(text)}
            disabled={!isValid}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================
const MetricBadge = ({ value, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/80 text-gray-600',
    success: 'bg-emerald-100 text-emerald-700',
    error: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`
      px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm
      ${className || variants[variant]}
    `}>
      {value}
    </span>
  );
};

const StatusBadge = ({ icon: Icon, variant }) => {
  const variants = {
    locked: 'bg-gray-700 text-white',
    bookmarked: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${variants[variant]}`}>
      <Icon className="w-3 h-3" />
    </div>
  );
};

const ActionButton = ({ onClick, icon: Icon, variant = 'default', disabled = false, title, className = '' }) => {
  const variants = {
    default: 'bg-white/80 text-gray-600 hover:bg-white',
    bookmarked: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    locked: 'bg-gray-700 text-white hover:bg-gray-800',
    success: 'bg-white/80 text-emerald-600 hover:bg-white',
    danger: 'bg-white/80 text-red-600 hover:bg-red-50',
    selected: 'bg-blue-500 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-1.5 rounded-md transition-colors
        ${variants[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
};

const InfoBadge = ({ icon: Icon, value, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    locked: 'bg-gray-700 text-white',
    bookmarked: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className={`px-3 py-1.5 text-sm rounded-lg font-semibold flex items-center gap-1.5 shadow-sm ${variants[variant]}`}>
      <Icon className="w-4 h-4" />
      {value}
    </div>
  );
};

const ToolbarButton = ({ icon: Icon, active, onClick, title, activeColor = 'blue' }) => {
  const activeColors = {
    blue: 'bg-blue-500 text-white border-blue-600',
    purple: 'bg-purple-500 text-white border-purple-600',
    amber: 'bg-amber-500 text-white border-amber-600'
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 text-sm font-semibold border rounded-lg transition-all shadow-sm hover:shadow
        ${active
          ? activeColors[activeColor]
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }
      `}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

const MetricDisplay = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700'
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors[color]}`}>
      <span className="text-xs font-medium">{label}:</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-16 text-center shadow-inner">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-6">
      <FileText className="w-10 h-10 text-gray-400" />
    </div>
    <p className="text-gray-500 text-base font-medium">{message}</p>
    <p className="text-gray-400 text-sm mt-2">Select a document to begin</p>
  </div>
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================
function useComputeSegments(boundaries, lines, lockedSegments, bookmarkedSegments) {
  return useMemo(() => {
    if (!boundaries || boundaries.length < 2) return [];
    
    return boundaries.slice(0, -1).map((start, i) => {
      const end = boundaries[i + 1];
      const segmentLines = lines.slice(start, end);
      const text = segmentLines.join('\n');
      const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      
      const idealLength = 150;
      const distance = Math.abs(letterCount - idealLength);
      const quality = Math.max(0, 100 - (distance / idealLength) * 100);
      
      const id = `segment_${start}_${end}`;
      
      return {
        id,
        numericId: i + 1,
        startLine: start,
        endLine: end,
        lineCount: end - start,
        text,
        lines: segmentLines,
        letterCount,
        wordCount,
        quality: Math.round(quality),
        isValid: letterCount >= 5 && letterCount <= 1000,
        hasEndPunctuation: /[.!?]$/.test(text.trim()),
        isLocked: lockedSegments.has(id),
        isBookmarked: bookmarkedSegments.has(id),
      };
    });
  }, [boundaries, lines, lockedSegments, bookmarkedSegments]);
}

function useComputeStats(segments) {
  return useMemo(() => {
    if (segments.length === 0) return null;
    
    const validSegments = segments.filter(s => s.isValid);
    const letterCounts = segments.map(s => s.letterCount);
    const qualities = segments.map(s => s.quality);
    
    return {
      total: segments.length,
      valid: validSegments.length,
      invalid: segments.length - validSegments.length,
      avgLetters: Math.round(letterCounts.reduce((a, b) => a + b, 0) / letterCounts.length),
      minLetters: Math.min(...letterCounts),
      maxLetters: Math.max(...letterCounts),
      avgQuality: Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length),
      totalWords: segments.reduce((sum, s) => sum + s.wordCount, 0),
      locked: segments.filter(s => s.isLocked).length,
      bookmarked: segments.filter(s => s.isBookmarked).length,
    };
  }, [segments]);
}

function useSearchResults(segments, searchTerm) {
  return useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return segments.filter(seg => 
      seg.text.toLowerCase().includes(term)
    );
  }, [segments, searchTerm]);
}

function useToggleBoundary(boundaries, dispatch) {
  return useCallback((lineIndex) => {
    if (!boundaries) return;
    
    const idx = boundaries.indexOf(lineIndex);
    let newBoundaries;
    let message;
    
    if (idx > 0 && idx < boundaries.length - 1) {
      newBoundaries = boundaries.filter((_, i) => i !== idx);
      message = 'Boundary removed';
    } else if (idx === -1) {
      newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
      message = 'Boundary added';
    }
    
    if (newBoundaries) {
      dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'success', message, duration: 1500 }
      });
    }
  }, [boundaries, dispatch]);
}

function useDeleteSegment(boundaries, dispatch) {
  return useCallback((segment) => {
    if (!segment || !boundaries) return;
    
    if (segment.isLocked) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'error', message: 'Cannot delete locked segment', duration: 2000 }
      });
      return;
    }
    
    const newBoundaries = boundaries.filter(b => b !== segment.endLine);
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({ type: ACTIONS.SET_SELECTED_SEGMENT, payload: null });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: { type: 'success', message: `Segment ${segment.numericId} deleted`, duration: 2000 }
    });
  }, [boundaries, dispatch]);
}

function useSplitSegment(boundaries, dispatch) {
  return useCallback((segment, lineIndex) => {
    if (!segment || !boundaries) return;
    
    if (segment.isLocked) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'error', message: 'Cannot split locked segment', duration: 2000 }
      });
      return;
    }
    
    if (lineIndex <= segment.startLine || lineIndex >= segment.endLine) return;
    
    const newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: { type: 'success', message: `Split segment ${segment.numericId}`, duration: 2000 }
    });
  }, [boundaries, dispatch]);
}

function useMergeSegment(segments, boundaries, dispatch) {
  return useCallback((segment) => {
    if (!segment || !boundaries) return;
    if (segment.numericId === segments.length) return;
    
    const nextSegment = segments.find(s => s.numericId === segment.numericId + 1);
    if (segment.isLocked || nextSegment?.isLocked) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'error', message: 'Cannot merge locked segments', duration: 2000 }
      });
      return;
    }
    
    const newBoundaries = boundaries.filter(b => b !== segment.endLine);
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: { 
        type: 'success', 
        message: `Merged segments ${segment.numericId} & ${segment.numericId + 1}`, 
        duration: 2000 
      }
    });
  }, [segments, boundaries, dispatch]);
}

function useCopySegment(setCopiedSegment, dispatch) {
  return useCallback(async (segment) => {
    try {
      await navigator.clipboard.writeText(segment.text);
      setCopiedSegment(segment.id);
      setTimeout(() => setCopiedSegment(null), 2000);
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'success', message: 'Segment copied to clipboard', duration: 2000 }
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [setCopiedSegment, dispatch]);
}

function useCopyAllText(activeSource, dispatch) {
  return useCallback(async () => {
    if (!activeSource?.text) return;
    try {
      await navigator.clipboard.writeText(activeSource.text);
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'success', message: 'Text copied to clipboard', duration: 2000 }
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [activeSource, dispatch]);
}

function useKeyboardShortcuts(setSearchVisible, searchInputRef, dispatch) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else if (e.key === 'Escape') {
        setSearchVisible(false);
        dispatch({ type: ACTIONS.SET_SELECTED_SEGMENT, payload: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchVisible, searchInputRef, dispatch]);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getSegmentColor(segment) {
  if (!segment) return '';
  if (!segment.isValid) return 'bg-red-50/50';
  return SEGMENT_COLORS[(segment.numericId - 1) % SEGMENT_COLORS.length];
}

function getBorderColor(segment) {
  if (!segment) return 'border-gray-200';
  if (!segment.isValid) return 'border-red-300';
  return BORDER_COLORS[(segment.numericId - 1) % BORDER_COLORS.length];
}

function getQualityColor(quality) {
  if (quality >= 80) return 'text-emerald-600';
  if (quality >= 60) return 'text-blue-600';
  if (quality >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export default VirtualizedTextDisplay;