// src/WorkspaceView/VirtualizedTextDisplay.jsx

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useAppState, ACTIONS } from '../context/AppContext';

const VirtualizedTextDisplay = ({ 
  segmentationMode = false,
  highlightSegments = true,
  showMetadata = true 
}) => {
  const { state, dispatch } = useAppState();
  const { activeSource, boundaries, selectedSegmentId, hoveredLineIndex } = state.workspace;
  
  const [fontSize, setFontSize] = useState('medium');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [hoveredBoundary, setHoveredBoundary] = useState(null);
  const [editingSegment, setEditingSegment] = useState(null);
  const virtuosoRef = useRef(null);

  const fontSizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  };

  const lines = useMemo(() => 
    activeSource?.lines || [], 
    [activeSource]
  );

  // Generate segments from boundaries
  const segments = useMemo(() => {
    if (!boundaries || boundaries.length < 2) return [];
    
    return boundaries.slice(0, -1).map((start, i) => {
      const end = boundaries[i + 1];
      const segmentLines = lines.slice(start, end);
      const text = segmentLines.join('\n');
      const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
      
      return {
        id: `segment_${start}_${end}`,
        numericId: i + 1,
        startLine: start,
        endLine: end,
        lineCount: end - start,
        text,
        lines: segmentLines,
        letterCount,
        isValid: letterCount >= 5 && letterCount <= 1000
      };
    });
  }, [boundaries, lines]);

  // Toggle boundary at line index
  const toggleBoundary = useCallback((lineIndex) => {
    if (!boundaries) return;
    
    const idx = boundaries.indexOf(lineIndex);
    let newBoundaries;
    
    if (idx > 0 && idx < boundaries.length - 1) {
      // Remove boundary (can't remove first or last)
      newBoundaries = boundaries.filter((_, i) => i !== idx);
    } else if (idx === -1) {
      // Add boundary
      newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
    }
    
    if (newBoundaries) {
      dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    }
  }, [boundaries, dispatch]);

  // Get segment for line
  const getSegmentForLine = useCallback((lineIndex) => {
    return segments.find(seg => 
      lineIndex >= seg.startLine && lineIndex < seg.endLine
    );
  }, [segments]);

  // Delete segment
  const deleteSegment = useCallback((segment) => {
    if (!segment || !boundaries) return;
    
    const newBoundaries = boundaries.filter(b => b !== segment.endLine);
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
    dispatch({ type: ACTIONS.SET_SELECTED_SEGMENT, payload: null });
  }, [boundaries, dispatch]);

  // Split segment at line
  const splitSegment = useCallback((segment, lineIndex) => {
    if (!segment || !boundaries) return;
    if (lineIndex <= segment.startLine || lineIndex >= segment.endLine) return;
    
    const newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
  }, [boundaries, dispatch]);

  // Merge segment with next
  const mergeWithNext = useCallback((segment) => {
    if (!segment || !boundaries) return;
    if (segment.numericId === segments.length) return;
    
    const newBoundaries = boundaries.filter(b => b !== segment.endLine);
    dispatch({ type: ACTIONS.SET_BOUNDARIES, payload: newBoundaries });
  }, [segments, boundaries, dispatch]);

  // Scroll to segment
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

  // Copy text
  const handleCopyText = async () => {
    if (!activeSource?.text) return;
    try {
      await navigator.clipboard.writeText(activeSource.text);
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: 'Text copied to clipboard',
          duration: 2000
        }
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: 'Failed to copy text',
          duration: 3000
        }
      });
    }
  };

  // Get segment color
  const getSegmentColor = (segment) => {
    if (!segment) return '';
    if (!segment.isValid) return 'bg-red-50';
    
    const colors = [
      'bg-blue-50',
      'bg-green-50', 
      'bg-yellow-50',
      'bg-purple-50',
      'bg-pink-50',
      'bg-indigo-50'
    ];
    return colors[(segment.numericId - 1) % colors.length];
  };

  // Row renderer
  const rowContent = useCallback((index) => {
    const line = lines[index];
    const segment = getSegmentForLine(index);
    const hasBoundaryAfter = boundaries?.includes(index + 1);
    const isFirstInSegment = segment && index === segment.startLine;
    const isLastInSegment = segment && index === segment.endLine - 1;
    const isSelected = segment && segment.id === selectedSegmentId;

    return (
      <div className="w-full">
        {/* Segment header (first line only) */}
        {isFirstInSegment && highlightSegments && (
          <div className={`flex items-center justify-between px-2 py-1 border-t-2 ${
            segment.isValid ? 'border-green-400' : 'border-red-400'
          } ${getSegmentColor(segment)}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">
                Segment {segment.numericId}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                segment.isValid 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {segment.letterCount}L
              </span>
              <span className="text-xs text-gray-500">
                {segment.lineCount} lines
              </span>
            </div>
            
            {segmentationMode && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingSegment(segment)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Edit segment"
                >
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteSegment(segment)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Delete segment"
                >
                  <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => dispatch({ 
                    type: ACTIONS.SET_SELECTED_SEGMENT, 
                    payload: isSelected ? null : segment.id 
                  })}
                  className={`p-1 rounded transition-colors ${
                    isSelected ? 'bg-blue-200' : 'hover:bg-white'
                  }`}
                  title="Select segment"
                >
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Line content */}
        <div className={`flex gap-2 px-2 py-0.5 relative ${
          highlightSegments && segment ? getSegmentColor(segment) : ''
        } ${isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''}`}>
          {showLineNumbers && (
            <span className="flex-shrink-0 w-12 text-right text-xs text-gray-400 select-none">
              {index + 1}
            </span>
          )}
          <div className={`flex-1 ${fontSizeMap[fontSize]} text-gray-800 font-mono whitespace-pre-wrap break-words`}>
            {line || '\u00A0'}
          </div>

          {/* Split button for selected segment */}
          {isSelected && segmentationMode && !isFirstInSegment && !isLastInSegment && (
            <button
              onClick={() => splitSegment(segment, index + 1)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors z-10"
              title="Split segment here"
            >
              ✂️ Split
            </button>
          )}
        </div>

        {/* Boundary control */}
        {segmentationMode && (
          <div
            className={`relative h-6 group cursor-pointer ${
              hoveredBoundary === index + 1 ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
            onMouseEnter={() => setHoveredBoundary(index + 1)}
            onMouseLeave={() => setHoveredBoundary(null)}
            onClick={() => toggleBoundary(index + 1)}
          >
            {hasBoundaryAfter ? (
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                <div className="flex-1 border-t-2 border-dashed border-blue-400"></div>
                <button className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors">
                  ✕ Remove Boundary
                </button>
                <div className="flex-1 border-t-2 border-dashed border-blue-400"></div>
              </div>
            ) : (
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex-1 border-t border-dashed border-gray-300"></div>
                <button className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors">
                  + Add Boundary
                </button>
                <div className="flex-1 border-t border-dashed border-gray-300"></div>
              </div>
            )}
          </div>
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
    getSegmentForLine,
    toggleBoundary,
    deleteSegment,
    splitSegment,
    dispatch
  ]);

  if (!activeSource) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-sm">No source loaded</p>
      </div>
    );
  }

  const currentSegment = selectedSegmentId ? segments.find(s => s.id === selectedSegmentId) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      {showMetadata && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {activeSource.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                <span>{activeSource.author}</span>
                {activeSource.date && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{activeSource.date}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {segments.length > 0 && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {segments.length} segments
                </span>
              )}
              {segmentationMode && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                  ✏️ Edit Mode
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">X-Large</option>
          </select>

          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`px-3 py-1 text-xs font-medium border rounded-lg transition-colors ${
              showLineNumbers
                ? 'bg-blue-100 text-blue-700 border-blue-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            #
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentSegment && (
            <>
              <button
                onClick={() => mergeWithNext(currentSegment)}
                disabled={currentSegment.numericId === segments.length}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Merge with next segment"
              >
                🔗 Merge
              </button>
              <button
                onClick={() => dispatch({ type: ACTIONS.SET_SELECTED_SEGMENT, payload: null })}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ✕
              </button>
            </>
          )}
          
          <button
            onClick={handleCopyText}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            📋 Copy
          </button>
          
          <span className="text-xs text-gray-500">
            {lines.length.toLocaleString()} lines
          </span>
        </div>
      </div>

      {/* Virtualized Text Content */}
      <div className="flex-1 overflow-hidden">
        {lines.length > 0 ? (
          <Virtuoso
            ref={virtuosoRef}
            totalCount={lines.length}
            itemContent={rowContent}
            style={{ height: '100%' }}
            overscan={10}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No content to display
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSegment && (
        <EditSegmentModal
          segment={editingSegment}
          onSave={() => setEditingSegment(null)}
          onCancel={() => setEditingSegment(null)}
        />
      )}
    </div>
  );
};

// Edit Segment Modal Component
const EditSegmentModal = ({ segment, onSave, onCancel }) => {
  const [text, setText] = useState(segment?.text || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Segment {segment.numericId}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Lines {segment.startLine + 1}-{segment.endLine}
          </p>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter segment text..."
          />
          <div className="mt-2 text-xs text-gray-500">
            {text.replace(/[^a-zA-Z]/g, '').length} letters
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(text)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualizedTextDisplay;