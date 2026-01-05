// EnhancedSegmentationTool.jsx - MULTI-EDITION SUPPORT
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  Scissors, BarChart3, ArrowLeft, Trash2, Check, X, Split, Combine, 
  Download, Layers, Sparkles, AlertCircle, Info, Zap, RefreshCw, 
  Lock, Unlock, Plus, Minus, Eye, EyeOff, Save, MousePointer, Hand,
  Type, Hash, FileText, ChevronDown, ChevronUp, Play, Target, Grid,
  Circle, Square, Triangle, Diamond, Hexagon, CircleDot, Star,
  TrendingUp, Activity, TrendingDown, HelpCircle, Edit3, Copy,
  BookOpen, GitCompare, Calendar, Percent
} from 'lucide-react';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const MODES = {
  SELECT: 'select',
  DELETE: 'delete',
  MERGE: 'merge',
  RESIZE_START: 'resize-start',
  RESIZE_END: 'resize-end',
};

const COLOR_PALETTE = [
  { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81', name: 'Indigo', icon: Circle, highlight: '#C7D2FE' },
  { bg: '#DBEAFE', border: '#0284C7', text: '#0C4A6E', name: 'Sky Blue', icon: Square, highlight: '#BAE6FD' },
  { bg: '#D1FAE5', border: '#059669', text: '#064E3B', name: 'Emerald', icon: Triangle, highlight: '#A7F3D0' },
  { bg: '#FEF3C7', border: '#D97706', text: '#78350F', name: 'Amber', icon: Diamond, highlight: '#FDE68A' },
  { bg: '#FCE7F3', border: '#DB2777', text: '#831843', name: 'Pink', icon: Hexagon, highlight: '#FBCFE8' },
  { bg: '#E9D5FF', border: '#9333EA', text: '#581C87', name: 'Purple', icon: CircleDot, highlight: '#D8B4FE' },
  { bg: '#FFEDD5', border: '#EA580C', text: '#7C2D12', name: 'Orange', icon: Star, highlight: '#FED7AA' },
  { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', name: 'Red', icon: Activity, highlight: '#FECACA' },
];

const VALIDATION_COLORS = {
  valid: { bg: 'bg-green-50', border: 'border-green-400', color: '#10b981', emoji: '✅' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-400', color: '#f59e0b', emoji: '⚠️' },
  'too-short': { bg: 'bg-red-50', border: 'border-red-400', color: '#ef4444', emoji: '❌' },
  'too-long': { bg: 'bg-orange-50', border: 'border-orange-400', color: '#f97316', emoji: '⚡' },
};

const SEGMENTATION_MODES = [
  { value: 'ai_statistical', label: 'AI Statistical', icon: Sparkles, desc: 'AI-powered anomaly detection' },
  { value: 'smart', label: 'Smart Segments', icon: Sparkles, desc: 'AI-powered natural breaks' },
  { value: 'lines', label: 'Fixed Lines', icon: Target, desc: 'Split every N lines' },
  { value: 'letters', label: 'Letter Count', icon: Type, desc: 'Target character count' },
  { value: 'paragraphs', label: 'Paragraphs', icon: Grid, desc: 'Split at empty lines' },
  { value: 'punctuation', label: 'Sentences', icon: Split, desc: 'Split at sentence endings' },
  { value: 'manual', label: 'Manual Mode', icon: Hand, desc: 'Hand-crafted segments' },
];

// ============================================================================
// UTILITY FUNCTIONS (same as before)
// ============================================================================

const calculateLevel = (annotation, allAnnotations) => {
  let level = 0;
  for (const other of allAnnotations) {
    if (other.id === annotation.id) continue;
    if (other.start <= annotation.start && other.end >= annotation.end) {
      level++;
    }
  }
  return level;
};

// ============================================================================
// CORRECTED: Color assignment without recursion
// ============================================================================

const getAnnotationColor = (annotation, allAnnotations) => {
  const level = calculateLevel(annotation, allAnnotations);
  
  // Get siblings at the same level
  const siblings = allAnnotations.filter(ann => {
    const annLevel = calculateLevel(ann, allAnnotations);
    return annLevel === level && ann.id !== annotation.id;
  }).sort((a, b) => a.start - b.start);
  
  const position = siblings.findIndex(s => s.start > annotation.start);
  const actualPosition = position === -1 ? siblings.length : position;
  
  // Calculate base color index using level and position
  let colorIndex;
  if (level === 0) {
    // Top-level annotations: spread them out
    colorIndex = (actualPosition * 3) % COLOR_PALETTE.length;
  } else {
    // Nested annotations: offset by level and position
    colorIndex = (level * 4 + actualPosition * 2) % COLOR_PALETTE.length;
  }
  
  // REMOVED: Recursive parent color check that caused infinite loop
  // Instead, just use level-based differentiation which is already sufficient
  
  return COLOR_PALETTE[colorIndex];
};

const validateAnnotation = (text) => {
  const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
  
  if (letterCount < 5) {
    return { status: 'too-short', message: 'Too short for analysis (<30 letters)' };
  } else if (letterCount > 500) {
    return { status: 'too-long', message: 'Very long segment (>500 letters)' };
  } else if (letterCount < 30) {
    return { status: 'warning', message: 'Small but usable (50+ recommended)' };
  } else {
    return { status: 'valid', message: 'Perfect for analysis' };
  }
};

const calculateQuality = (text) => {
  const idealLength = 150;
  const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
  const distance = Math.abs(letterCount - idealLength);
  let quality = Math.max(0, 100 - (distance / idealLength) * 100);
  
  if (/[.!?]$/.test(text.trim())) quality += 5;
  if (letterCount < 30) quality *= 0.5;
  if (letterCount >= 50 && letterCount <= 200) quality += 10;
  
  return Math.min(100, Math.round(quality));
};

// ============================================================================
// SEGMENTATION ENGINES (same as before)
// ============================================================================

const SegmentationEngine = {
  byLines: (lines, count) => {
    const boundaries = [0];
    for (let i = count; i < lines.length; i += count) {
      boundaries.push(i);
    }
    boundaries.push(lines.length);
    return boundaries;
  },

  byLetterCount: (lines, targetCount) => {
    const boundaries = [0];
    let currentCount = 0;
    
    lines.forEach((line, idx) => {
      const letters = line.replace(/[^a-zA-Z]/g, '').length;
      currentCount += letters;
      
      if (currentCount >= targetCount && idx < lines.length - 1) {
        boundaries.push(idx + 1);
        currentCount = 0;
      }
    });
    
    boundaries.push(lines.length);
    return boundaries;
  },

  byPunctuation: (lines) => {
    const boundaries = [0];
    
    lines.forEach((line, idx) => {
      if (/[.!?;:]$/.test(line.trim()) && idx < lines.length - 1) {
        boundaries.push(idx + 1);
      }
    });
    
    boundaries.push(lines.length);
    return boundaries;
  },

  byParagraphs: (lines) => {
    const boundaries = [0];
    
    lines.forEach((line, idx) => {
      if (line.trim() === '' && idx < lines.length - 1) {
        const nextNonEmpty = lines.findIndex((l, i) => i > idx && l.trim() !== '');
        if (nextNonEmpty !== -1) {
          boundaries.push(nextNonEmpty);
        }
      }
    });
    
    boundaries.push(lines.length);
    return [...new Set(boundaries)].sort((a, b) => a - b);
  },

  smart: (lines, targetSize = 150) => {
    const boundaries = [0];
    let currentSize = 0;
    let lastGoodBreak = 0;
    
    lines.forEach((line, idx) => {
      const letters = line.replace(/[^a-zA-Z]/g, '').length;
      currentSize += letters;
      
      const hasEndPunctuation = /[.!?]$/.test(line.trim());
      const isEmptyLine = line.trim() === '';
      const isNewParagraph = idx > 0 && lines[idx - 1].trim() === '';
      
      if (hasEndPunctuation || isEmptyLine || isNewParagraph) {
        lastGoodBreak = idx + 1;
      }
      
      if (currentSize >= targetSize && lastGoodBreak > boundaries[boundaries.length - 1]) {
        boundaries.push(lastGoodBreak);
        currentSize = 0;
      }
    });
    
    boundaries.push(lines.length);
    return [...new Set(boundaries)].sort((a, b) => a - b);
  }
};

// ============================================================================
// EDITION SELECTOR COMPONENT
// ============================================================================

const EditionSelector = ({ editions, selectedEditions, onToggleEdition, onAddEdition, onRemoveEdition }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Editions</h3>
            <p className="text-xs text-gray-500">{selectedEditions.length} active</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {editions.map((edition, idx) => {
            const isSelected = selectedEditions.includes(edition.id);
            const editionColor = COLOR_PALETTE[idx % COLOR_PALETTE.length];
            
            return (
              <div
                key={edition.id}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? `border-${editionColor.border} bg-gradient-to-r from-${editionColor.bg} to-white`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => onToggleEdition(edition.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: editionColor.border }}
                      />
                      <span className="font-bold text-sm text-gray-900">
                        {edition.date || `Edition ${idx + 1}`}
                      </span>
                      {edition.isPrimary && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        <span>{edition.line_count?.toLocaleString()} lines</span>
                      </div>
                      {edition.estc_id && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          <span>{edition.estc_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleEdition(edition.id);
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {isSelected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    {editions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveEdition(edition.id);
                        }}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <button
            onClick={() => setShowAddDialog(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold text-sm">Add Another Edition</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EDITION COMPARISON PANEL
// ============================================================================

const EditionComparisonPanel = ({ editions, selectedEditions, editionAnnotations }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const comparisonStats = useMemo(() => {
    if (selectedEditions.length < 2) return null;
    
    const stats = selectedEditions.map(edId => {
      const annotations = editionAnnotations[edId] || [];
      return {
        editionId: edId,
        edition: editions.find(e => e.id === edId),
        segmentCount: annotations.length,
        avgQuality: annotations.length > 0
          ? Math.round(annotations.reduce((sum, ann) => sum + calculateQuality(ann.text), 0) / annotations.length)
          : 0,
        validCount: annotations.filter(ann => validateAnnotation(ann.text).status === 'valid').length
      };
    });
    
    return stats;
  }, [editions, selectedEditions, editionAnnotations]);
  
  if (!comparisonStats || selectedEditions.length < 2) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Edition Comparison</h3>
            <p className="text-xs text-gray-500">Compare {selectedEditions.length} editions</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {comparisonStats.map((stat, idx) => {
            const editionColor = COLOR_PALETTE[idx % COLOR_PALETTE.length];
            
            return (
              <div
                key={stat.editionId}
                className="p-4 rounded-xl border-2"
                style={{ 
                  borderColor: editionColor.border,
                  backgroundColor: editionColor.bg
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: editionColor.border }}
                    />
                    <span className="font-bold text-sm" style={{ color: editionColor.text }}>
                      {stat.edition?.date || `Edition ${idx + 1}`}
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: editionColor.text }}>
                    {stat.segmentCount} segments
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-600">Avg Quality</div>
                    <div className="text-lg font-bold" style={{ color: editionColor.border }}>
                      {stat.avgQuality}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-600">Valid</div>
                    <div className="text-lg font-bold" style={{ color: editionColor.border }}>
                      {stat.validCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Comparison Insights</span>
            </div>
            <div className="text-xs text-blue-800 space-y-1">
              <div>• Spoilage tracking across editions</div>
              <div>• Cipher evolution analysis</div>
              <div>• Text corruption detection</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TextAnnotator = ({ 
  text, 
  annotations, 
  onAnnotationAdd, 
  onAnnotationDelete, 
  onAnnotationUpdate,
  onAnnotationMerge,
  selectedId, 
  onSelect,
  isEnabled,
  mode,
  onModeComplete
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [tempSelection, setTempSelection] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [charRects, setCharRects] = useState([]);
  const [mergeSource, setMergeSource] = useState(null);

  // Measure character positions
  useEffect(() => {
    if (!textRef.current) return;
    
    const measureChars = () => {
      const rects = [];
      const range = document.createRange();
      const textNode = textRef.current.firstChild;
      
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        for (let i = 0; i < text.length; i++) {
          try {
            range.setStart(textNode, i);
            range.setEnd(textNode, i + 1);
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            rects.push({
              left: rect.left - containerRect.left + containerRef.current.scrollLeft,
              top: rect.top - containerRect.top + containerRef.current.scrollTop,
              width: rect.width,
              height: rect.height
            });
          } catch (e) {
            rects.push({ left: 0, top: 0, width: 0, height: 0 });
          }
        }
      }
      setCharRects(rects);
    };
    
    const timer = setTimeout(measureChars, 100);
    window.addEventListener('resize', measureChars);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureChars);
    };
  }, [text, annotations.length]);

  // Handle mouse move for selection
  const handleMouseMove = useCallback((e) => {
    if (!isSelecting || !selectionBox) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const endX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
    const endY = e.clientY - containerRect.top + containerRef.current.scrollTop;

    setSelectionBox(prev => ({ ...prev, endX, endY }));

    if (charRects.length > 0) {
      const minX = Math.min(selectionBox.startX, endX);
      const maxX = Math.max(selectionBox.startX, endX);
      const minY = Math.min(selectionBox.startY, endY);
      const maxY = Math.max(selectionBox.startY, endY);

      let start = -1;
      let end = -1;

      for (let i = 0; i < charRects.length; i++) {
        const rect = charRects[i];
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;

        if (charCenterX >= minX && charCenterX <= maxX &&
            charCenterY >= minY && charCenterY <= maxY) {
          if (start === -1) start = i;
          end = i + 1;
        }
      }

      if (start !== -1 && end !== -1 && end > start) {
        setTempSelection({ start, end });
      } else {
        setTempSelection(null);
      }
    }
  }, [isSelecting, selectionBox, charRects]);

  // Handle mouse up - create annotation
  // In the handleMouseUp callback of TextAnnotator component, replace it with:

const handleMouseUp = useCallback(() => {
  if (isSelecting && tempSelection && tempSelection.end - tempSelection.start > 0) {
    const selectedText = text.slice(tempSelection.start, tempSelection.end);
    const label = selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText;
    
    // Check if this new annotation is nested within existing ones
    const containingAnnotations = annotations.filter(ann => 
      ann.start <= tempSelection.start && ann.end >= tempSelection.end
    );
    
    const isNested = containingAnnotations.length > 0;
    
    onAnnotationAdd({
      start: tempSelection.start,
      end: tempSelection.end,
      label: label,
      text: selectedText,
      isNested: isNested,
      parentIds: containingAnnotations.map(a => a.id) // Track parent annotations
    });
    
    // Show notification about nesting
    if (isNested) {
      console.log(`✨ Created nested annotation (Level ${containingAnnotations.length})`);
    }
  }
  setSelectionBox(null);
  setTempSelection(null);
  setIsSelecting(false);
}, [isSelecting, tempSelection, onAnnotationAdd, text, annotations]);

  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  // Calculate annotation boxes
  const annotationBoxes = useMemo(() => {
    if (charRects.length === 0) return [];

    const withLevels = annotations.map(ann => ({
      ...ann,
      level: calculateLevel(ann, annotations)
    }));

    return withLevels.map(annotation => {
      const boxes = [];
      let currentBox = null;

      for (let i = annotation.start; i < Math.min(annotation.end, charRects.length); i++) {
        const rect = charRects[i];

        if (!currentBox) {
          currentBox = { ...rect, startChar: i, endChar: i + 1 };
        } else {
          if (Math.abs(rect.top - currentBox.top) < 10) {
            currentBox.width = (rect.left + rect.width) - currentBox.left;
            currentBox.endChar = i + 1;
            currentBox.height = Math.max(currentBox.height, rect.height);
          } else {
            boxes.push(currentBox);
            currentBox = { ...rect, startChar: i, endChar: i + 1 };
          }
        }
      }

      if (currentBox) boxes.push(currentBox);
      return { annotation, boxes };
    });
  }, [annotations, charRects]);

  // Handle annotation click
  const handleAnnotationClick = useCallback((e, annId) => {
    if (!isEnabled) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    if (mode === MODES.SELECT) {
      onSelect(selectedId === annId ? null : annId);
    } else if (mode === MODES.DELETE) {
      onAnnotationDelete(annId);
      onModeComplete();
    } else if (mode === MODES.MERGE) {
      if (!mergeSource) {
        setMergeSource(annId);
        onSelect(annId);
      } else if (mergeSource !== annId) {
        onAnnotationMerge(mergeSource, annId);
        setMergeSource(null);
        onSelect(null);
        onModeComplete();
      } else {
        setMergeSource(null);
        onSelect(null);
      }
    }
  }, [isEnabled, mode, selectedId, mergeSource, onSelect, onAnnotationDelete, onAnnotationMerge, onModeComplete]);

  // Handle mouse down for new selection
  const handleMouseDown = useCallback((e) => {
    if (!isEnabled || e.button !== 0) return;
    
    const target = e.target;
    const annotationId = target.dataset.annotation || target.parentElement?.dataset.annotation;
    
    if (annotationId) {
      handleAnnotationClick(e, annotationId);
      return;
    }

    // Only allow new selections in SELECT mode
    if (mode !== MODES.SELECT) return;

    setIsSelecting(true);
    const containerRect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
    const startY = e.clientY - containerRect.top + containerRef.current.scrollTop;
    
    setSelectionBox({ startX, startY, endX: startX, endY: startY });
  }, [isEnabled, mode, handleAnnotationClick]);

  const getCursor = () => {
    if (!isEnabled) return 'not-allowed';
    if (isSelecting) return 'crosshair';
    if (mode === MODES.DELETE) return 'not-allowed';
    if (mode === MODES.MERGE) return 'copy';
    return 'text';
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{ 
        position: 'relative', 
        minHeight: '400px',
        cursor: getCursor(),
        userSelect: 'none',
        opacity: isEnabled ? 1 : 0.5,
      }}
    >


      <div
        ref={textRef}
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          lineHeight: '2.2',
          whiteSpace: 'pre-wrap',
          color: '#111827',
          position: 'relative',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      {/* Annotation overlays */}

{charRects.length > 0 && isEnabled && (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
    {annotationBoxes.map(({ annotation, boxes }) => {
      const isSelected = selectedId === annotation.id;
      const isHovered = hoveredId === annotation.id;
      const isMergeSource = mergeSource === annotation.id;
      const level = calculateLevel(annotation, annotations);
      
      // Dynamic padding based on nesting level
      const basePadding = 3;
      const levelPadding = level * 5; // More spacing for nested levels
      const padding = basePadding + levelPadding;
      
      const colors = getAnnotationColor(annotation, annotations);
      
      // Enhanced opacity for better distinction
      let opacity = 0.3 + (level * 0.05); // Nested annotations slightly more opaque
      if (isSelected) opacity = 0.7;
      if (isHovered) opacity = 0.6;
      if (isMergeSource) opacity = 0.8;
      
      // Border thickness based on level and state
      const borderWidth = isSelected ? 4 : isHovered ? 3 : (2 + level);

      return (
        <div key={annotation.id}>
          {boxes.map((box, idx) => (
            <div
              key={`${annotation.id}-box-${idx}`}
              data-annotation={annotation.id}
              onMouseEnter={() => setHoveredId(annotation.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'absolute',
                left: `${box.left - padding}px`,
                top: `${box.top - padding}px`,
                width: `${box.width + padding * 2}px`,
                height: `${box.height + padding * 2}px`,
                
                // Enhanced background with gradient for nested items
                background: level > 0 
                  ? `linear-gradient(135deg, ${colors.bg} 0%, ${colors.highlight} 100%)`
                  : colors.bg,
                
                backgroundOpacity: opacity,
                
                // Multi-border effect for nested annotations
                border: `${borderWidth}px solid ${
                  isMergeSource ? '#F59E0B' : colors.border
                }`,
                
                // Add inner shadow for depth on nested items
                boxShadow: level > 0
                  ? `inset 0 2px 4px rgba(0,0,0,0.1), ${
                      isSelected 
                        ? `0 0 0 4px ${colors.border}40, 0 8px 24px rgba(0,0,0,0.2)` 
                        : isHovered 
                        ? `0 0 0 3px ${colors.border}30, 0 6px 16px rgba(0,0,0,0.15)` 
                        : '0 2px 6px rgba(0,0,0,0.08)'
                    }`
                  : isSelected 
                  ? `0 0 0 4px ${colors.border}40, 0 8px 24px rgba(0,0,0,0.2)` 
                  : isHovered 
                  ? `0 0 0 3px ${colors.border}30, 0 6px 16px rgba(0,0,0,0.15)` 
                  : '0 2px 6px rgba(0,0,0,0.08)',
                
                borderRadius: `${6 + level * 2}px`, // Larger radius for nested items
                
                pointerEvents: 'all',
                cursor: mode === MODES.DELETE ? 'not-allowed' : 
                        mode === MODES.MERGE ? 'copy' : 'pointer',
                
                transition: 'all 0.15s ease',
                
                // Z-index: deeper nesting = higher z-index, selected on top
                zIndex: (level * 100) + (isSelected ? 2000 : 0) + (isHovered ? 1000 : 0),
                
                transform: isSelected 
                  ? 'scale(1.02)' 
                  : isHovered 
                  ? 'scale(1.01)' 
                  : 'scale(1)',
                
                // Add a subtle pattern for nested items
                ...(level > 1 && {
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    ${colors.border}10 10px,
                    ${colors.border}10 11px
                  )`
                })
              }}
            />
          ))}
          
          {/* Add level indicator badge for nested annotations */}
          {level > 0 && isHovered && (
            <div
              style={{
                position: 'absolute',
                left: `${boxes[0].left - padding - 30}px`,
                top: `${boxes[0].top - padding}px`,
                padding: '2px 8px',
                backgroundColor: colors.border,
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '12px',
                zIndex: 9999,
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Layers className="w-3 h-3" />
              L{level}
            </div>
          )}
        </div>
      );
    })}

    {/* Temporary selection highlight */}
    {tempSelection && charRects.length > 0 && (
      <div>
        {(() => {
          const boxes = [];
          let currentBox = null;

          for (let i = tempSelection.start; i < Math.min(tempSelection.end, charRects.length); i++) {
            const rect = charRects[i];

            if (!currentBox) {
              currentBox = { ...rect };
            } else {
              if (Math.abs(rect.top - currentBox.top) < 10) {
                currentBox.width = (rect.left + rect.width) - currentBox.left;
                currentBox.height = Math.max(currentBox.height, rect.height);
              } else {
                boxes.push(currentBox);
                currentBox = { ...rect };
              }
            }
          }
          if (currentBox) boxes.push(currentBox);

          return boxes.map((box, idx) => (
            <div
              key={`temp-${idx}`}
              style={{
                position: 'absolute',
                left: `${box.left - 3}px`,
                top: `${box.top - 3}px`,
                width: `${box.width + 6}px`,
                height: `${box.height + 6}px`,
                backgroundColor: '#3B82F6',
                opacity: 0.3,
                border: '2px dashed #2563EB',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 5000
              }}
            />
          ));
        })()}
      </div>
    )}
  </div>
)}

      {/* Selection box */}
      {isSelecting && selectionBox && mode === MODES.SELECT && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
            width: `${Math.abs(selectionBox.endX - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.endY - selectionBox.startY)}px`,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '2px dashed #3B82F6',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// ANNOTATION LIST SIDEBAR
// ============================================================================

// Update the AnnotationList component to show nesting better:

const AnnotationList = ({ annotations, onSelect, selectedId, onDelete, onLock }) => {
  // Sort by position and group by nesting level
  const sortedAnnotations = useMemo(() => {
    return [...annotations]
      .map(ann => ({
        ...ann,
        level: calculateLevel(ann, annotations)
      }))
      .sort((a, b) => {
        // Sort AI segments by priority first if present
        if (a.metadata?.aiGenerated && b.metadata?.aiGenerated) {
          const priorityDiff = (b.metadata.priority || 0) - (a.metadata.priority || 0);
          if (priorityDiff !== 0) return priorityDiff;
        }
        
        // Then by level
        if (a.level !== b.level) return a.level - b.level;
        
        // Finally by position
        return a.start - b.start;
      });
  }, [annotations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {sortedAnnotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
          <Layers className="w-16 h-16" style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>No segments yet</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Use AI detection or drag to select text
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats for AI segments */}
          {annotations.some(a => a.metadata?.aiGenerated) && (
            <div style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #EDE9FE 0%, #FBCFE8 100%)',
              border: '2px solid #9333EA',
              borderRadius: '12px',
              marginBottom: '8px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Sparkles className="w-4 h-4" style={{ color: '#9333EA' }} />
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: '#581C87' 
                }}>
                  AI-Detected Segments
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '8px',
                fontSize: '11px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#DC2626' 
                  }}>
                    {annotations.filter(a => a.metadata?.priority >= 4).length}
                  </div>
                  <div style={{ color: '#7C2D12' }}>High Priority</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#F59E0B' 
                  }}>
                    {annotations.filter(a => a.metadata?.priority === 3).length}
                  </div>
                  <div style={{ color: '#78350F' }}>Medium</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#10B981' 
                  }}>
                    {annotations.filter(a => a.metadata?.priority <= 2).length}
                  </div>
                  <div style={{ color: '#064E3B' }}>Low</div>
                </div>
              </div>
              
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #D8B4FE',
                fontSize: '10px',
                color: '#581C87',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>
                  Avg Score: {
                    annotations.filter(a => a.metadata?.anomalyScore).length > 0
                      ? (annotations
                          .filter(a => a.metadata?.anomalyScore)
                          .reduce((sum, a) => sum + a.metadata.anomalyScore, 0) / 
                         annotations.filter(a => a.metadata?.anomalyScore).length
                        ).toFixed(1)
                      : 'N/A'
                  }
                </span>
                <span>
                  Analysis: {annotations[0]?.metadata?.segmentType === 'ai_statistical' 
                    ? annotations[0]?.metadata?.aiGenerated ? 'AI Statistical' : 'Standard'
                    : 'Manual'}
                </span>
              </div>
            </div>
          )}
          
          {/* Individual Segments */}
          {sortedAnnotations.map(ann => {
            const isSelected = selectedId === ann.id;
            const colors = getAnnotationColor(ann, annotations);
            const validation = validateAnnotation(ann.text || '');
            const validationColor = VALIDATION_COLORS[validation.status];
            const quality = calculateQuality(ann.text || '');
            const Icon = colors.icon;
            const isAIGenerated = ann.metadata?.aiGenerated;

            return (
              <div
                key={ann.id}
                onClick={() => onSelect(ann.id)}
                style={{
                  padding: '12px',
                  marginLeft: `${ann.level * 20}px`,
                  backgroundColor: isAIGenerated 
                    ? `linear-gradient(135deg, ${colors.bg} 0%, #FDF4FF 100%)`
                    : colors.bg,
                  border: `2px solid ${colors.border}`,
                  borderLeft: `${4 + ann.level * 2}px solid ${colors.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected 
                    ? `0 6px 20px ${colors.border}40` 
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  position: 'relative',
                  background: isAIGenerated
                    ? `linear-gradient(135deg, ${colors.bg} 0%, #FDF4FF 100%)`
                    : colors.bg
                }}
              >
                {/* Nesting indicator line */}
                {ann.level > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-20px',
                      top: '0',
                      width: '2px',
                      height: '100%',
                      backgroundColor: colors.border,
                      opacity: 0.3
                    }}
                  />
                )}
                
                {/* Top Row: Badges and Actions */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    flexWrap: 'wrap' 
                  }}>
                    {/* AI Badge */}
                    {isAIGenerated && (
                      <span style={{
                        padding: '4px 10px',
                        background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                        color: 'white',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
                      }}>
                        <Sparkles className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    
                    {/* Level Badge */}
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: colors.border,
                      color: 'white',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Icon className="w-3 h-3" />
                      L{ann.level}
                    </span>
                    
                    {/* Color Badge */}
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: 'white',
                      border: `2px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: colors.text
                    }}>
                      {colors.name}
                    </span>
                    
                    {/* Validation Badge */}
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: validationColor.color
                    }}>
                      {validationColor.emoji} {validation.status}
                    </span>
                    
                    {/* Priority Badge (AI segments only) */}
                    {isAIGenerated && ann.metadata?.priority && (
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: 
                          ann.metadata.priority >= 4 ? '#FEE2E2' :
                          ann.metadata.priority === 3 ? '#FEF3C7' : '#D1FAE5',
                        color:
                          ann.metadata.priority >= 4 ? '#991B1B' :
                          ann.metadata.priority === 3 ? '#78350F' : '#064E3B',
                        border: `2px solid ${
                          ann.metadata.priority >= 4 ? '#DC2626' :
                          ann.metadata.priority === 3 ? '#F59E0B' : '#10B981'
                        }`,
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {ann.metadata.priority >= 4 ? (
                          <><AlertCircle className="w-3 h-3" /> HIGH</>
                        ) : ann.metadata.priority === 3 ? (
                          <><Activity className="w-3 h-3" /> MED</>
                        ) : (
                          <><Check className="w-3 h-3" /> LOW</>
                        )}
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLock(ann.id);
                      }}
                      style={{ 
                        padding: '4px', 
                        borderRadius: '6px', 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={ann.locked ? 'Unlock segment' : 'Lock segment'}
                    >
                      {ann.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(ann.id);
                      }}
                      style={{ 
                        padding: '4px', 
                        borderRadius: '6px', 
                        backgroundColor: 'white', 
                        color: '#ef4444',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete segment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Label Text */}
                <p style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#1F2937', 
                  marginBottom: '6px',
                  lineHeight: '1.4'
                }}>
                  {ann.label}
                </p>
                
                {/* Basic Stats */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  fontSize: '11px', 
                  color: '#6B7280', 
                  fontFamily: 'monospace',
                  flexWrap: 'wrap',
                  marginBottom: isAIGenerated ? '8px' : '0'
                }}>
                  <span>{ann.start} → {ann.end}</span>
                  <span>•</span>
                  <span>{ann.end - ann.start} chars</span>
                  <span>•</span>
                  <span>{ann.metadata?.letterCount || (ann.text || '').replace(/[^a-zA-Z]/g, '').length} letters</span>
                  <span>•</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: quality >= 80 ? '#059669' : quality >= 60 ? '#0284C7' : '#D97706'
                  }}>
                    Q: {quality}%
                  </span>
                </div>
                
                  {/* AI-Generated Metadata Section */}
{isAIGenerated && (
  <div style={{
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '2px solid #E9D5FF',
    background: 'linear-gradient(135deg, rgba(233, 213, 255, 0.3) 0%, rgba(251, 207, 232, 0.3) 100%)',
    borderRadius: '8px',
    padding: '8px'
  }}>
    {/* Header */}
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px',
      marginBottom: '8px'
    }}>
      <Sparkles className="w-3 h-3" style={{ color: '#9333EA' }} />
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 'bold', 
        color: '#581C87' 
      }}>
        Statistical Analysis Results
      </span>
    </div>
    
    {/* Top-Level Scores */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '6px',
      marginBottom: '8px'
    }}>
      {/* Anomaly Score */}
      {ann.metadata.anomalyScore !== undefined && (
        <div style={{
          padding: '6px 8px',
          backgroundColor: 
            ann.metadata.anomalyScore >= 4 ? '#FEE2E2' :
            ann.metadata.anomalyScore >= 3 ? '#FEF3C7' : '#D1FAE5',
          border: `2px solid ${
            ann.metadata.anomalyScore >= 4 ? '#DC2626' :
            ann.metadata.anomalyScore >= 3 ? '#F59E0B' : '#10B981'
          }`,
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#6B7280', fontWeight: '600' }}>
            Anomaly Score
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: ann.metadata.anomalyScore >= 4 ? '#991B1B' :
                   ann.metadata.anomalyScore >= 3 ? '#78350F' : '#064E3B'
          }}>
            {ann.metadata.anomalyScore}<span style={{ fontSize: '12px' }}>/5</span>
          </div>
        </div>
      )}
      
      {/* Priority */}
      {ann.metadata.priority !== undefined && (
        <div style={{
          padding: '6px 8px',
          backgroundColor: 
            ann.metadata.priority >= 4 ? '#FEE2E2' :
            ann.metadata.priority === 3 ? '#FEF3C7' : '#D1FAE5',
          border: `2px solid ${
            ann.metadata.priority >= 4 ? '#DC2626' :
            ann.metadata.priority === 3 ? '#F59E0B' : '#10B981'
          }`,
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#6B7280', fontWeight: '600' }}>
            Priority
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: ann.metadata.priority >= 4 ? '#991B1B' :
                   ann.metadata.priority === 3 ? '#78350F' : '#064E3B'
          }}>
            {ann.metadata.priority}<span style={{ fontSize: '12px' }}>/5</span>
          </div>
        </div>
      )}
    </div>
    
    {/* Statistical Metrics Grid */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr',
      gap: '6px',
      fontSize: '10px',
      marginBottom: '8px'
    }}>
      {/* Chi-Squared */}
      {ann.metadata.chiSquared !== undefined && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #E9D5FF'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>χ²:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: ann.metadata.chiSquared > 100 ? '#DC2626' :
                   ann.metadata.chiSquared > 40 ? '#F59E0B' : '#581C87'
          }}>
            {ann.metadata.chiSquared.toFixed(1)}
          </span>
        </div>
      )}
      
      {/* Index of Coincidence */}
      {ann.metadata.ioc !== undefined && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #E9D5FF'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>IoC:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: ann.metadata.ioc < 0.045 ? '#DC2626' :
                   ann.metadata.ioc < 0.060 ? '#F59E0B' : '#581C87'
          }}>
            {ann.metadata.ioc.toFixed(4)}
          </span>
        </div>
      )}
      
      {/* Entropy */}
      {ann.metadata.entropy !== undefined && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #E9D5FF'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Entropy:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: ann.metadata.entropy > 4.6 ? '#DC2626' :
                   ann.metadata.entropy > 4.5 ? '#F59E0B' : '#581C87'
          }}>
            {ann.metadata.entropy.toFixed(2)}
          </span>
        </div>
      )}
      
      {/* Quadgram Score */}
      {ann.metadata.quadgramScore !== undefined && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #E9D5FF'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Quadgram:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: ann.metadata.quadgramScore < -8 ? '#DC2626' :
                   ann.metadata.quadgramScore < -6 ? '#F59E0B' : '#581C87'
          }}>
            {ann.metadata.quadgramScore.toFixed(2)}
          </span>
        </div>
      )}
      
      {/* Proper Noun Density */}
      {ann.metadata.properNounDensity !== undefined && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #E9D5FF'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Proper Nouns:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: ann.metadata.properNounDensity > 0.15 ? '#DC2626' :
                   ann.metadata.properNounDensity > 0.10 ? '#F59E0B' : '#581C87'
          }}>
            {(ann.metadata.properNounDensity * 100).toFixed(1)}%
          </span>
        </div>
      )}
      
      {/* Segment Length Target */}
      {ann.metadata.segmentLengthTarget !== undefined && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #E9D5FF'
        }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Target Len:</span>
          <span style={{ fontWeight: 'bold', color: '#581C87' }}>
            {ann.metadata.segmentLengthTarget} ch
          </span>
        </div>
      )}
    </div>
    
    {/* Classification Badge */}
    {ann.metadata.classification && (
      <div style={{
        marginBottom: '8px',
        padding: '6px 10px',
        backgroundColor: 
          ann.metadata.classification.includes('HIGHLY') ? '#FEE2E2' :
          ann.metadata.classification.includes('ANOMALOUS') && !ann.metadata.classification.includes('HIGHLY') ? '#FEF3C7' : 
          ann.metadata.classification.includes('SUSPICIOUS') ? '#DBEAFE' : 
          ann.metadata.classification.includes('UNUSUAL') ? '#FED7AA' : '#F3F4F6',
        border: `2px solid ${
          ann.metadata.classification.includes('HIGHLY') ? '#DC2626' :
          ann.metadata.classification.includes('ANOMALOUS') && !ann.metadata.classification.includes('HIGHLY') ? '#F59E0B' :
          ann.metadata.classification.includes('SUSPICIOUS') ? '#3B82F6' :
          ann.metadata.classification.includes('UNUSUAL') ? '#EA580C' : '#9CA3AF'
        }`,
        borderRadius: '8px',
        fontSize: '11px',
        color: '#1F2937',
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: '0.5px'
      }}>
      {ann.metadata.classification.includes('HIGHLY') ? '🔴' :
       ann.metadata.classification.includes('ANOMALOUS') ? '🟠' :
       ann.metadata.classification.includes('SUSPICIOUS') ? '🟡' :
       ann.metadata.classification.includes('UNUSUAL') ? '🟢' : '⚪'}{' '}
      {ann.metadata.classification.replace(/_/g, ' ')}
      </div>
    )}
    
    {/* Detection Confidence Bar */}
    {ann.metadata.detectionConfidence !== undefined && (
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '600' }}>
            Detection Confidence
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#581C87' }}>
            {ann.metadata.detectionConfidence.toFixed(1)}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#E9D5FF',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(100, ann.metadata.detectionConfidence)}%`,
            height: '100%',
            background: ann.metadata.detectionConfidence >= 70 
              ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
              : ann.metadata.detectionConfidence >= 40
              ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
              : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    )}
    
    {/* Statistical Flags */}
    {ann.metadata.flags && ann.metadata.flags.length > 0 && (
      <div style={{
        padding: '6px 8px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #FCD34D',
        borderRadius: '6px',
        fontSize: '9px',
        color: '#78350F',
        maxHeight: '80px',
        overflowY: 'auto',
        marginBottom: '8px'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '4px',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <AlertCircle className="w-3 h-3" />
          Detection Flags ({ann.metadata.flags.length})
        </div>
        <div style={{ marginLeft: '16px', lineHeight: '1.4' }}>
          {ann.metadata.flags.slice(0, 4).map((flag, idx) => (
            <div key={idx} style={{ marginBottom: '2px' }}>
              • {flag}
            </div>
          ))}
          {ann.metadata.flags.length > 4 && (
            <div style={{ 
              fontStyle: 'italic', 
              color: '#92400E',
              marginTop: '4px'
            }}>
              + {ann.metadata.flags.length - 4} more flag{ann.metadata.flags.length - 4 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    )}
    
    {/* Lines Reference */}
    {ann.metadata.startLine !== undefined && ann.metadata.endLine !== undefined && (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderRadius: '6px',
        fontSize: '9px',
        color: '#581C87',
        fontWeight: '600'
      }}>
        <FileText className="w-3 h-3" />
        Lines {ann.metadata.startLine + 1}–{ann.metadata.endLine + 1}
      </div>
    )}
  </div>
)}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// ============================================================================
// CONTROL PANELS
// ============================================================================

const AlgorithmPanel = ({ config, updateConfig, onGenerate, isGenerating }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Algorithm</h3>
            <p className="text-xs text-gray-500">Auto-generate segments</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            {SEGMENTATION_MODES.map(m => {
              const Icon = m.icon;
              const isActive = config.mode === m.value;
              
              return (
                <button
                  key={m.value}
                  onClick={() => updateConfig(draft => { draft.mode = m.value; })}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{m.label}</div>
                      <div className="text-xs text-gray-600">{m.desc}</div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mode-specific config */}
          {config.mode === 'lines' && (
            <div className="bg-blue-50 rounded-xl p-4">
              <label className="text-sm font-bold text-blue-900 mb-2 block">
                Lines per Segment: {config.linesPerSegment}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={config.linesPerSegment}
                onChange={(e) => updateConfig(draft => { 
                  draft.linesPerSegment = parseInt(e.target.value); 
                })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-blue-700 mt-1">
                <span>5</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          )}

          {config.mode === 'letters' && (
            <div className="bg-green-50 rounded-xl p-4">
              <label className="text-sm font-bold text-green-900 mb-2 block">
                Target Letters: {config.lettersPerSegment}
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={config.lettersPerSegment}
                onChange={(e) => updateConfig(draft => { 
                  draft.lettersPerSegment = parseInt(e.target.value); 
                })}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-green-700 mt-1">
                <span>50</span>
                <span>275</span>
                <span>500</span>
              </div>
            </div>
          )}
{config.mode === 'ai_statistical' && (
  <div className="space-y-3">
    <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <span className="text-sm font-bold text-purple-900">Statistical Analysis</span>
      </div>
      
      {/* Min Anomaly Score */}
      <div className="mb-3">
        <label className="text-sm font-bold text-purple-900 mb-2 block">
          Min Anomaly Score: {config.minAnomalyScore}
        </label>
        <input
          type="range"
          min="2"
          max="5"
          step="1"
          value={config.minAnomalyScore}
          onChange={(e) => updateConfig(draft => { 
            draft.minAnomalyScore = parseInt(e.target.value); 
          })}
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-xs text-purple-700 mt-1">
          <span>2 (More segments)</span>
          <span>3 (Balanced)</span>
          <span>5 (High confidence)</span>
        </div>
      </div>
      
      {/* NEW: Length Mode Selection */}
      <div className="mb-3">
        <label className="text-sm font-bold text-purple-900 mb-2 block">
          Segment Length Mode
        </label>
        <select
          value={config.lengthMode || 'variable'}
          onChange={(e) => updateConfig(draft => { 
            draft.lengthMode = e.target.value; 
          })}
          className="w-full px-3 py-2 bg-white border-2 border-purple-300 rounded-lg text-sm font-semibold text-purple-900"
        >
          <option value="ultra_short">Ultra Short (15-30 chars)</option>
          <option value="short">Short (30-70 chars)</option>
          <option value="medium">Medium (80-180 chars)</option>
          <option value="long">Long (200-400 chars)</option>
          <option value="variable">Variable (mixed lengths)</option>
          <option value="title_focused">Title Focused (50-200 chars)</option>
        </select>
        <div className="text-xs text-purple-700 mt-1">
          Tests multiple segment sizes to find anomalous patterns
        </div>
      </div>
      
      {/* NEW: Overlap Setting */}
      <div className="mb-3">
        <label className="text-sm font-bold text-purple-900 mb-2 block">
          Overlap: {config.overlap || 0} chars
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={config.overlap || 0}
          onChange={(e) => updateConfig(draft => { 
            draft.overlap = parseInt(e.target.value); 
          })}
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-xs text-purple-700 mt-1">
          <span>0 (No overlap)</span>
          <span>25</span>
          <span>50 (Sliding window)</span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-purple-700 bg-purple-100 rounded-lg p-3">
        <div className="font-bold mb-1">How it works:</div>
        <ul className="space-y-1">
          <li>• Statistical analysis: chi-squared, entropy, IoC</li>
          <li>• Tests multiple segment lengths automatically</li>
          <li>• Returns ALL segments meeting anomaly threshold</li>
          <li>• Higher score = stronger cipher signal</li>
        </ul>
      </div>
    </div>
  </div>
)}


          {config.mode === 'smart' && (
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-purple-900">Smart Mode Active</span>
              </div>
              <p className="text-xs text-purple-700">
                AI analyzes sentence endings, paragraphs, and semantic breaks
              </p>
            </div>
          )}

          {/* Generate Button */}
          {config.mode !== 'manual' && (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${
                isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Segments
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ModePanel = ({ mode, onModeChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MousePointer className="w-5 h-5" />
        Interaction Mode
      </h3>
      
      <div className="space-y-2">
        {[
          { value: MODES.SELECT, label: 'Select', icon: MousePointer, desc: 'Click to select segments' },
          { value: MODES.DELETE, label: 'Delete', icon: Trash2, desc: 'Click to delete segments' },
          { value: MODES.MERGE, label: 'Merge', icon: Combine, desc: 'Click two to merge' },
        ].map(m => {
          const Icon = m.icon;
          const isActive = mode === m.value;
          
          return (
            <button
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{m.label}</div>
                  <div className="text-xs text-gray-600">{m.desc}</div>
                </div>
                {isActive && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StatisticsPanel = ({ annotations }) => {
  const stats = useMemo(() => {
    if (annotations.length === 0) return null;

    const validationCounts = {
      valid: 0,
      warning: 0,
      'too-short': 0,
      'too-long': 0
    };

    let totalQuality = 0;
    let totalLetters = 0;

    annotations.forEach(ann => {
      const validation = validateAnnotation(ann.text || '');
      validationCounts[validation.status]++;
      totalQuality += calculateQuality(ann.text || '');
      totalLetters += (ann.text || '').replace(/[^a-zA-Z]/g, '').length;
    });

    return {
      total: annotations.length,
      ...validationCounts,
      avgQuality: Math.round(totalQuality / annotations.length),
      avgLetters: Math.round(totalLetters / annotations.length)
    };
  }, [annotations]);

  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-xs text-blue-700">Total Segments</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
          <div className="text-2xl font-bold text-green-900">{stats.valid}</div>
          <div className="text-xs text-green-700">Valid</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border-2 border-yellow-200">
          <div className="text-2xl font-bold text-yellow-900">{stats.warning}</div>
          <div className="text-xs text-yellow-700">Warnings</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border-2 border-red-200">
          <div className="text-2xl font-bold text-red-900">{stats['too-short']}</div>
          <div className="text-xs text-red-700">Too Short</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Quality</span>
          <span className="font-bold text-gray-900">{stats.avgQuality}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Letters</span>
          <span className="font-bold text-gray-900">{stats.avgLetters}</span>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// MULTI-EDITION TOOL HEADER
// ============================================================================

const MultiEditionToolHeader = ({ 
  workTitle, 
  author, 
  editions, 
  selectedEditions, 
  editionAnnotations,
  onBack, 
  onSave, 
  onExport, 
  onClear, 
  onAnalyzeMultiEdition,
  hasUnsavedChanges 
}) => {
  const totalSegments = useMemo(() => {
    return selectedEditions.reduce((sum, edId) => {
      return sum + (editionAnnotations[edId]?.length || 0);
    }, 0);
  }, [selectedEditions, editionAnnotations]);
  
  const allSaved = useMemo(() => {
    return !hasUnsavedChanges && totalSegments > 0;
  }, [hasUnsavedChanges, totalSegments]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all"
            title="Back to Library"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="h-12 w-px bg-gray-300" />
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {workTitle}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {selectedEditions.length} edition{selectedEditions.length !== 1 ? 's' : ''} active
              </span>
              <span>•</span>
              <span className="font-medium">{author}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Total Segments Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <Scissors className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-xl text-blue-900">{totalSegments}</span>
            <span className="text-sm text-blue-700 font-medium">total segments</span>
          </div>

          {/* Clear All Button */}
          <button
            onClick={onClear}
            disabled={totalSegments === 0}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
              totalSegments > 0
                ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Clear all segments from all editions"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>

          {/* Save All Button */}
          <button
            onClick={onSave}
            disabled={totalSegments === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
              totalSegments > 0
                ? hasUnsavedChanges
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg'
                  : 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={hasUnsavedChanges ? 'Save all editions' : 'All editions saved'}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'Save All' : 'Saved ✓'}
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            disabled={totalSegments === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
              totalSegments > 0
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Export all editions"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>

          {/* Multi-Edition Analysis Button */}
          <button
            onClick={onAnalyzeMultiEdition}
            disabled={!allSaved || selectedEditions.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              allSaved && selectedEditions.length > 0
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={
              selectedEditions.length === 0
                ? 'Select editions first'
                : !allSaved
                ? 'Save all editions before analyzing'
                : 'Analyze all editions simultaneously'
            }
          >
            <GitCompare className="w-5 h-5" />
            Analyze {selectedEditions.length} Edition{selectedEditions.length !== 1 ? 's' : ''}
            {allSaved && selectedEditions.length > 0 && <span className="ml-1">→</span>}
          </button>
        </div>
      </div>
      
      {/* Status Messages */}
      <div className="mt-4">
        {totalSegments === 0 && (
          <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm text-blue-900 flex items-center gap-3">
            <div className="flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold mb-1">Multi-Edition Segmentation</div>
              <div className="text-blue-700">
                Select editions from the sidebar, then create segments for each. 
                The tool will analyze all editions simultaneously and track cipher evolution.
              </div>
            </div>
          </div>
        )}
        
        {totalSegments > 0 && hasUnsavedChanges && (
          <div className="px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-sm text-amber-900 flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold mb-1">Unsaved Changes Across Editions</div>
              <div className="text-amber-800">
                You have <strong>{totalSegments} segment{totalSegments !== 1 ? 's' : ''}</strong> across {selectedEditions.length} edition{selectedEditions.length !== 1 ? 's' : ''}. 
                Click <strong>"Save All"</strong> before multi-edition analysis.
              </div>
            </div>
          </div>
        )}
        
        {allSaved && selectedEditions.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl text-sm text-green-900 flex items-center gap-3">
            <div className="flex-shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold mb-1">Ready for Multi-Edition Analysis</div>
              <div className="text-green-800">
                <strong>{selectedEditions.length} edition{selectedEditions.length !== 1 ? 's' : ''}</strong> with <strong>{totalSegments} total segments</strong> saved. 
                Click <strong>"Analyze"</strong> to track cipher evolution and spoilage across editions.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN MULTI-EDITION COMPONENT
// ============================================================================

const EnhancedSegmentationTool = ({ onBack, saveSegmentation, hasUnsavedChanges, onAnalyze }) => {
  const { state, dispatch, api } = useAppState();
  const { workspace } = state;
  
  // Multi-edition state
  const [editions, setEditions] = useState([]);
  const [selectedEditions, setSelectedEditions] = useState([]);
  const [activeEditionId, setActiveEditionId] = useState(null);
  const [editionAnnotations, setEditionAnnotations] = useImmer({});
  
  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(MODES.SELECT);
const [config, updateConfig] = useImmer({
  mode: 'smart',
  linesPerSegment: 20,
  lettersPerSegment: 150,
  // AI segmentation options
  minAnomalyScore: 3,
  lengthMode: 'variable',  // NEW: 'ultra_short', 'short', 'medium', 'long', 'variable', 'title_focused'
  overlap: 0,              // NEW: character overlap for sliding window
  // REMOVED: maxAISegments - get ALL anomalous segments
});
  const [isGenerating, setIsGenerating] = useState(false);

// Load editions on mount
// Load editions on mount
useEffect(() => {
  const loadEditions = async () => {
    if (!workspace.currentSource) return;
    
    try {
      // Check if this work has multiple editions
      const editionCount = workspace.currentSource.edition_count || 1;
      
      console.log(`📚 Work has ${editionCount} edition(s)`);
      
      if (editionCount > 1) {
        // Fetch all editions from backend
        dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'editions', value: true } });
        
        try {
          const editionsResponse = await api.getWorkEditions(
            workspace.currentSource.author_folder,
            workspace.currentSource.base_work_id || workspace.currentSource.id
          );
          
          console.log(`📊 API returned ${editionsResponse.total_editions} editions`);
          
          if (editionsResponse && editionsResponse.editions) {
            // Load full content for each edition
            const editionsWithContent = await Promise.all(
              editionsResponse.editions.map(async (edition) => {
                try {
                  const content = await api.getWorkContent(
                    workspace.currentSource.author_folder,
                    edition.id  // Load this specific edition
                  );
                  
                  return {
                    id: edition.id,
                    title: content.title,
                    author: content.author,
                    date: edition.date,
                    lines: content.lines,
                    line_count: content.line_count,
                    isPrimary: edition.isPrimary,
                    estc_id: edition.estc_id,
                    has_segmentation: edition.has_segmentation,
                    segment_count: edition.segment_count || 0
                  };
                } catch (error) {
                  console.error(`❌ Failed to load edition ${edition.id}:`, error);
                  return null;
                }
              })
            );
            
            // Filter out failed loads
            const validEditions = editionsWithContent.filter(e => e !== null);
            
            if (validEditions.length > 0) {
              setEditions(validEditions);
              
              // Select all editions by default
              const allEditionIds = validEditions.map(e => e.id);
              setSelectedEditions(allEditionIds);
              
              // Set primary edition as active
              const primaryEdition = validEditions.find(e => e.isPrimary) || validEditions[0];
              setActiveEditionId(primaryEdition.id);
              
              // Initialize annotations for all editions (empty at first)
              setEditionAnnotations(draft => {
                validEditions.forEach(edition => {
                  draft[edition.id] = [];
                });
              });
              
              // Load saved segmentations for each edition (INDEPENDENTLY)
              let totalSegmentsLoaded = 0;
              for (const edition of validEditions) {
                const segmentCount = await loadSegmentationForEdition(edition);
                totalSegmentsLoaded += segmentCount;
              }
              
              dispatch({
                type: ACTIONS.ADD_NOTIFICATION,
                payload: {
                  type: 'success',
                  message: `✅ Loaded ${validEditions.length} editions${totalSegmentsLoaded > 0 ? ` with ${totalSegmentsLoaded} saved segments` : ''}`,
                  duration: 3000
                }
              });
              
              return;
            }
          }
        } catch (error) {
          console.error('❌ Failed to load editions:', error);
          dispatch({
            type: ACTIONS.ADD_NOTIFICATION,
            payload: {
              type: 'warning',
              message: 'Failed to load additional editions. Loading primary edition only.',
              duration: 3000
            }
          });
        } finally {
          dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'editions', value: false } });
        }
      }
      
      // Fallback: Load just the current source as single edition
      const primaryEdition = {
        id: workspace.currentSource.id,
        title: workspace.currentSource.title,
        author: workspace.currentSource.author,
        date: workspace.currentSource.date,
        lines: workspace.currentSource.lines,
        line_count: workspace.currentSource.line_count,
        isPrimary: true,
        estc_id: workspace.currentSource.estc_id,
      };
      
      setEditions([primaryEdition]);
      setSelectedEditions([primaryEdition.id]);
      setActiveEditionId(primaryEdition.id);
      
      // Initialize annotations for this edition
      setEditionAnnotations(draft => {
        draft[primaryEdition.id] = [];
      });
      
      // Load saved segmentation for this specific edition
      await loadSegmentationForEdition(primaryEdition);
      
    } catch (error) {
      console.error('❌ Error loading editions:', error);
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: 'Failed to load work editions',
          duration: 3000
        }
      });
    }
  };
  
// Helper function to load saved segmentation for ONE specific edition
// Replace the loadSegmentationForEdition helper function completely:

const loadSegmentationForEdition = async (edition) => {
  try {
    console.log(`🔍 Loading saved segmentation for: ${edition.id}`);
    
    const segmentation = await api.getSegmentation(edition.id);
    
    if (!segmentation?.segments?.length) {
      console.log(`ℹ️  No saved segmentation found for ${edition.id}`);
      return 0;
    }
    
    console.log(`✅ Found ${segmentation.segments.length} saved segments for ${edition.id}`);
    
    const fullText = edition.lines.join('\n');
    
    // Convert segments to annotations
    const annotations = segmentation.segments.map((seg, idx) => {
      // PRIORITY 1: Use root-level character positions (most reliable)
      if (seg.start_char !== undefined && seg.end_char !== undefined) {
        const startChar = seg.start_char;
        const endChar = seg.end_char;
        
        // Validate positions
        if (startChar < 0 || endChar > fullText.length || startChar >= endChar) {
          console.error(`❌ Invalid char positions for ${seg.id}: ${startChar}-${endChar}`);
          return null;
        }
        
        const text = fullText.slice(startChar, endChar);
        const label = text.length > 50 ? text.slice(0, 50) + '...' : text;
        
        console.log(`✅ Segment ${idx + 1}: char positions ${startChar}-${endChar}`);
        
        return {
          id: seg.id,
          start: startChar,
          end: endChar,
          label: label,
          text: text,
          locked: false,
          createdAt: Date.now(),
          metadata: {
            ...seg.metadata,
            startLine: seg.start_line,
            endLine: seg.end_line,
            loadedFrom: 'saved_char_positions'
          }
        };
      }
      
      // PRIORITY 2: Check metadata for character positions
      if (seg.metadata?.start_char !== undefined && seg.metadata?.end_char !== undefined) {
        const startChar = seg.metadata.start_char;
        const endChar = seg.metadata.end_char;
        
        if (startChar < 0 || endChar > fullText.length || startChar >= endChar) {
          console.error(`❌ Invalid metadata char positions for ${seg.id}: ${startChar}-${endChar}`);
          return null;
        }
        
        const text = fullText.slice(startChar, endChar);
        const label = text.length > 50 ? text.slice(0, 50) + '...' : text;
        
        console.log(`✅ Segment ${idx + 1}: metadata char positions ${startChar}-${endChar}`);
        
        return {
          id: seg.id,
          start: startChar,
          end: endChar,
          label: label,
          text: text,
          locked: false,
          createdAt: Date.now(),
          metadata: {
            ...seg.metadata,
            loadedFrom: 'metadata_char_positions'
          }
        };
      }
      
      // PRIORITY 3: FALLBACK - Calculate from line numbers
      console.warn(`⚠️  Segment ${idx + 1}: No char positions, calculating from lines ${seg.start_line}-${seg.end_line}`);
      
      if (seg.start_line === undefined || seg.end_line === undefined) {
        console.error(`❌ Segment ${idx + 1}: Missing both char positions AND line numbers`);
        return null;
      }
      
      // FIXED: More accurate line-to-char conversion
      let startChar = 0;
      let endChar = 0;
      
      // Calculate start position: sum of all lines before start_line + newlines
      for (let i = 0; i < seg.start_line && i < edition.lines.length; i++) {
        startChar += edition.lines[i].length + 1; // +1 for newline
      }
      
      // Calculate end position: start + lines in segment + newlines
      endChar = startChar;
      for (let i = seg.start_line; i <= seg.end_line && i < edition.lines.length; i++) {
        endChar += edition.lines[i].length;
        if (i < seg.end_line) {
          endChar += 1; // Add newline between lines (but not after last line)
        }
      }
      
      // Validate calculated positions
      if (startChar >= endChar || endChar > fullText.length) {
        console.error(`❌ Calculated invalid positions for segment ${idx + 1}: ${startChar}-${endChar}`);
        return null;
      }
      
      const text = fullText.slice(startChar, endChar);
      const label = text.length > 50 ? text.slice(0, 50) + '...' : text;
      
      console.log(`📍 Segment ${idx + 1}: Calculated ${startChar}-${endChar} from lines ${seg.start_line}-${seg.end_line}`);
      if (seg.text) {
        const expectedPreview = seg.text.substring(0, 30);
        const actualPreview = text.substring(0, 30);
        if (expectedPreview !== actualPreview) {
          console.warn(`⚠️  Text mismatch:`);
          console.warn(`   Expected: "${expectedPreview}..."`);
          console.warn(`   Got: "${actualPreview}..."`);
        }
      }
      
      return {
        id: seg.id,
        start: startChar,
        end: endChar,
        label: label,
        text: text,
        locked: false,
        createdAt: Date.now(),
        metadata: {
          ...seg.metadata,
          startLine: seg.start_line,
          endLine: seg.end_line,
          loadedFrom: 'calculated_from_lines'
        }
      };
    }).filter(ann => ann !== null); // Remove any failed conversions
    
    if (annotations.length === 0) {
      console.warn(`⚠️  No valid annotations could be created for ${edition.id}`);
      return 0;
    }
    
    // CRITICAL: Sort annotations by start position to avoid rendering issues
    annotations.sort((a, b) => a.start - b.start);
    
    // VALIDATION: Check for overlapping segments (nested is OK, overlapping is not)
    for (let i = 0; i < annotations.length - 1; i++) {
      const curr = annotations[i];
      const next = annotations[i + 1];
      
      // Check if next segment starts before current ends (overlap)
      if (next.start < curr.end) {
        // Check if it's properly nested (next ends before or at curr end)
        const isNested = next.end <= curr.end;
        
        if (!isNested) {
          console.warn(`⚠️  Segments ${i} and ${i+1} overlap incorrectly:`);
          console.warn(`   Segment ${i}: ${curr.start}-${curr.end}`);
          console.warn(`   Segment ${i+1}: ${next.start}-${next.end}`);
        }
      }
    }
    
    setEditionAnnotations(draft => {
      draft[edition.id] = annotations;
    });
    
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: `📂 Loaded ${annotations.length} segments for ${edition.date || edition.id}`,
        duration: 2000
      }
    });
    
    return annotations.length;
    
  } catch (error) {
    console.log(`ℹ️  Could not load segmentation for ${edition.id}:`, error.message);
    return 0;
  }
};
  loadEditions();
}, [workspace.currentSource, api, dispatch]);

  // Get active edition data
  const activeEdition = useMemo(() => {
    return editions.find(e => e.id === activeEditionId);
  }, [editions, activeEditionId]);

  const activeAnnotations = useMemo(() => {
    return editionAnnotations[activeEditionId] || [];
  }, [editionAnnotations, activeEditionId]);

  const fullText = useMemo(() => {
    return activeEdition?.lines?.join('\n') || '';
  }, [activeEdition]);

  // Edition management handlers
  const handleToggleEdition = useCallback((editionId) => {
    setSelectedEditions(prev => {
      if (prev.includes(editionId)) {
        return prev.filter(id => id !== editionId);
      } else {
        return [...prev, editionId];
      }
    });
  }, []);

  const handleAddEdition = useCallback(async () => {
    // TODO: Implement adding another edition
    // This would open a dialog to select another edition of the same work
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: 'Add edition feature coming soon!',
        duration: 2000
      }
    });
  }, [dispatch]);

  const handleRemoveEdition = useCallback((editionId) => {
    if (editions.length === 1) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: 'Cannot remove the last edition',
          duration: 2000
        }
      });
      return;
    }
    
    setEditions(prev => prev.filter(e => e.id !== editionId));
    setSelectedEditions(prev => prev.filter(id => id !== editionId));
    setEditionAnnotations(draft => {
      delete draft[editionId];
    });
    
    if (activeEditionId === editionId) {
      setActiveEditionId(editions[0].id);
    }
  }, [editions, activeEditionId, dispatch]);

  // Annotation handlers (same as before, but for active edition)
  const handleAnnotationAdd = useCallback((newAnn) => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const currentAnnotations = editionAnnotations[activeEditionId] || [];
    
    const level = currentAnnotations.filter(ann => 
      ann.start <= newAnn.start && ann.end >= newAnn.end
    ).length;
    
    setEditionAnnotations(draft => {
      if (!draft[activeEditionId]) {
        draft[activeEditionId] = [];
      }
      draft[activeEditionId].push({
        id,
        start: newAnn.start,
        end: newAnn.end,
        label: newAnn.label,
        text: newAnn.text,
        locked: false,
        createdAt: Date.now(),
        parentIds: newAnn.parentIds || [],
        level: level
      });
    });

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: level > 0 
          ? `✨ Nested segment created (Level ${level})` 
          : '✅ Segment created',
        duration: 2000
      }
    });
  }, [activeEditionId, editionAnnotations, setEditionAnnotations, dispatch]);

  const handleAnnotationDelete = useCallback((id) => {
    setEditionAnnotations(draft => {
      const annotations = draft[activeEditionId] || [];
      const index = annotations.findIndex(a => a.id === id);
      if (index !== -1) {
        annotations.splice(index, 1);
      }
    });
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [activeEditionId, setEditionAnnotations, selectedId]);

  const handleAnnotationUpdate = useCallback((id, updates) => {
    setEditionAnnotations(draft => {
      const annotations = draft[activeEditionId] || [];
      const ann = annotations.find(a => a.id === id);
      if (ann) {
        Object.assign(ann, updates);
      }
    });
  }, [activeEditionId, setEditionAnnotations]);

  const handleAnnotationMerge = useCallback((id1, id2) => {
    const annotations = editionAnnotations[activeEditionId] || [];
    const ann1 = annotations.find(a => a.id === id1);
    const ann2 = annotations.find(a => a.id === id2);
    
    if (!ann1 || !ann2) return;

    const start = Math.min(ann1.start, ann2.start);
    const end = Math.max(ann1.end, ann2.end);
    const text = fullText.slice(start, end);
    const label = text.length > 50 ? text.slice(0, 50) + '...' : text;

    setEditionAnnotations(draft => {
      const annots = draft[activeEditionId] || [];
      const idx1 = annots.findIndex(a => a.id === id1);
      const idx2 = annots.findIndex(a => a.id === id2);
      if (idx1 !== -1) annots.splice(idx1, 1);
      if (idx2 !== -1) annots.splice(idx2 > idx1 ? idx2 - 1 : idx2, 1);
      
      annots.push({
        id: `ann-${Date.now()}-merged`,
        start,
        end,
        label,
        text,
        locked: false,
        createdAt: Date.now()
      });
    });

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: '✅ Segments merged',
        duration: 2000
      }
    });
  }, [activeEditionId, editionAnnotations, fullText, setEditionAnnotations, dispatch]);

  const handleLockToggle = useCallback((id) => {
    setEditionAnnotations(draft => {
      const annotations = draft[activeEditionId] || [];
      const ann = annotations.find(a => a.id === id);
      if (ann) {
        ann.locked = !ann.locked;
      }
    });
  }, [activeEditionId, setEditionAnnotations]);

  // Generate segments (same as before, but for active edition)
const handleGenerate = useCallback(async () => {
  if (!activeEdition?.lines || activeEdition.lines.length === 0) return;
  
  setIsGenerating(true);
  
  // ========================================================================
  // AI STATISTICAL MODE - Use backend AI segmentation
  // ========================================================================
if (config.mode === 'ai_statistical') {
  try {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: '🔍 Statistical analysis running (chi², entropy, IoC)...',
        duration: 2000
      }
    });
    
    const response = await api.createAISegmentation(
      activeEdition.id,
      workspace.currentSource.author_folder,
      {
        useStatistical: true,
        minAnomalyScore: config.minAnomalyScore,
        lengthMode: config.lengthMode || 'variable',  // NEW
        overlap: config.overlap || 0                   // NEW
        // REMOVED: maxSegments - backend returns ALL anomalous segments
      }
    );
    
    if (!response.segmentation || !response.segmentation.segments) {
      throw new Error('No segments returned from statistical analysis');
    }
    
    const segments = response.segmentation.segments;
    
    console.log(`📊 Statistical Analysis Complete:`);
    console.log(`   Length Mode: ${config.lengthMode}`);
    console.log(`   Overlap: ${config.overlap} chars`);
    console.log(`   Min Score: ${config.minAnomalyScore}`);
    console.log(`   Segments Found: ${segments.length}`);
    
    // Show segment length distribution if available
    if (response.segmentation.metadata?.segment_lengths) {
      console.log(`   Tested Lengths: ${response.segmentation.metadata.segment_lengths.join(', ')}`);
    }
    
    // Convert statistical segments to annotations with proper character positions
    const newAnnotations = [];
    
    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx];
      
      // Calculate character positions from line numbers
      let startChar = 0;
      for (let i = 0; i < seg.start_line; i++) {
        startChar += activeEdition.lines[i].length + 1; // +1 for newline
      }
      
      let endChar = startChar;
      for (let i = seg.start_line; i <= seg.end_line; i++) {
        if (i < activeEdition.lines.length) {
          endChar += activeEdition.lines[i].length;
          if (i < seg.end_line) endChar += 1; // Add newline except for last line
        }
      }
      
      // Ensure we don't exceed text length
      endChar = Math.min(endChar, fullText.length);
      
      // Extract actual text from fullText
      const segmentText = fullText.slice(startChar, endChar);
      
      // Create label
      const label = segmentText.length > 50 
        ? segmentText.slice(0, 50) + '...' 
        : segmentText;
      
      newAnnotations.push({
        id: `stat-${seg.id || `${Date.now()}-${idx}`}`,
        start: startChar,
        end: endChar,
        label: label,
        text: segmentText,
        locked: false,
        createdAt: Date.now(),
        metadata: {
          aiGenerated: true,
          segmentType: 'ai_statistical',
          segmentLengthTarget: seg.segment_length_chars,  // NEW: which length was this from
          anomalyScore: seg.metadata?.anomaly_score || 0,
          classification: seg.metadata?.classification || 'Unknown',
          priority: seg.metadata?.priority_score 
            ? Math.ceil(seg.metadata.priority_score / 20) // Convert 0-100 to 1-5
            : 3,
          chiSquared: seg.metadata?.chi_squared,
          ioc: seg.metadata?.ioc,
          entropy: seg.metadata?.entropy,
          quadgramScore: seg.metadata?.quadgram_score,
          properNounDensity: seg.metadata?.proper_noun_density,
          detectionConfidence: seg.metadata?.confidence,
          flags: seg.metadata?.flags || [],
          startLine: seg.start_line,
          endLine: seg.end_line,
          originalSegmentId: seg.id
        }
      });
    }
    
    if (newAnnotations.length === 0) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'warning',
          message: `⚠️ No anomalous segments found with score ≥ ${config.minAnomalyScore}. Try lowering threshold or changing length mode.`,
          duration: 5000
        }
      });
      setIsGenerating(false);
      return;
    }
    
    // Update annotations for this edition
    setEditionAnnotations(draft => {
      draft[activeEditionId] = newAnnotations;
    });
    
    // Calculate statistics
    const highPriority = newAnnotations.filter(a => a.metadata.priority >= 4).length;
    const mediumPriority = newAnnotations.filter(a => a.metadata.priority === 3).length;
    const avgAnomalyScore = (
      newAnnotations.reduce((sum, a) => sum + a.metadata.anomalyScore, 0) / 
      newAnnotations.length
    ).toFixed(1);
    
    // Group by classification
    const classifications = newAnnotations.reduce((acc, a) => {
      const classification = a.metadata.classification || 'Unknown';
      acc[classification] = (acc[classification] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`📈 Results Summary:`, classifications);
    
    // Success notification with detailed stats
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `✅ Found ${newAnnotations.length} anomalous segments (Avg score: ${avgAnomalyScore}, ${highPriority} high priority, ${mediumPriority} medium)`,
        duration: 5000
      }
    });
    
    // Show classification breakdown
    setTimeout(() => {
      const classificationSummary = Object.entries(classifications)
        .map(([cls, count]) => `${count} ${cls}`)
        .join(', ');
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'info',
          message: `📊 Classifications: ${classificationSummary}`,
          duration: 4000
        }
      });
    }, 1000);
    
    // Store full response for reference
    dispatch({
      type: ACTIONS.SET_AI_SEGMENTATION_RESULT,
      payload: response
    });
    
  } catch (error) {
    console.error('❌ Statistical segmentation error:', error);
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: `Statistical analysis failed: ${error.message}`,
        duration: 5000
      }
    });
  } finally {
    setIsGenerating(false);
  }
  return;
}
  
  // ========================================================================
  // TRADITIONAL MODES - Local segmentation algorithms
  // ========================================================================
  
  setTimeout(() => {
    let boundaries;
    
    switch (config.mode) {
      case 'lines':
        boundaries = SegmentationEngine.byLines(activeEdition.lines, config.linesPerSegment);
        break;
        
      case 'letters':
        boundaries = SegmentationEngine.byLetterCount(activeEdition.lines, config.lettersPerSegment);
        break;
        
      case 'punctuation':
        boundaries = SegmentationEngine.byPunctuation(activeEdition.lines);
        break;
        
      case 'paragraphs':
        boundaries = SegmentationEngine.byParagraphs(activeEdition.lines);
        break;
        
      case 'smart':
        boundaries = SegmentationEngine.smart(activeEdition.lines, config.lettersPerSegment);
        break;
        
      default:
        setIsGenerating(false);
        dispatch({
          type: ACTIONS.ADD_NOTIFICATION,
          payload: {
            type: 'error',
            message: '❌ Unknown segmentation mode',
            duration: 2000
          }
        });
        return;
    }
    
    if (!boundaries || boundaries.length < 2) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { 
          type: 'error', 
          message: '❌ Failed to generate segments', 
          duration: 2000 
        }
      });
      setIsGenerating(false);
      return;
    }

    // Helper function to get character position from line index
    const getCharPosition = (lineIndex) => {
      let charPos = 0;
      for (let i = 0; i < lineIndex && i < activeEdition.lines.length; i++) {
        charPos += activeEdition.lines[i].length + 1; // +1 for newline
      }
      return charPos;
    };

    // Generate annotations from boundaries
    const newAnnotations = [];
    
    for (let i = 0; i < boundaries.length - 1; i++) {
      const startLine = boundaries[i];
      const endLine = boundaries[i + 1];
      
      // Validate line boundaries
      if (startLine >= endLine || startLine >= activeEdition.lines.length) {
        continue;
      }
      
      const startChar = getCharPosition(startLine);
      const segmentLines = activeEdition.lines.slice(startLine, endLine);
      const text = segmentLines.join('\n');
      const endChar = startChar + text.length;
      
      // Validate character positions
      if (startChar >= endChar || endChar > fullText.length) {
        console.warn(`Invalid segment ${i}: startChar=${startChar}, endChar=${endChar}, textLength=${fullText.length}`);
        continue;
      }
      
      // Create label (truncate if too long)
      const label = text.length > 50 ? text.slice(0, 50) + '...' : text;
      
      // Validate segment has enough content
      const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
      if (letterCount < 5) {
        console.warn(`Skipping tiny segment ${i}: only ${letterCount} letters`);
        continue;
      }
      
      newAnnotations.push({
        id: `ann-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        start: startChar,
        end: endChar,
        label: label,
        text: text,
        locked: false,
        createdAt: Date.now(),
        metadata: {
          aiGenerated: false,
          segmentType: config.mode,
          startLine: startLine,
          endLine: endLine - 1,
          letterCount: letterCount,
          wordCount: text.split(/\s+/).filter(Boolean).length,
          quality: calculateQuality(text),
          validation: validateAnnotation(text)
        }
      });
    }

    if (newAnnotations.length === 0) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { 
          type: 'error', 
          message: '❌ No valid segments generated', 
          duration: 2000 
        }
      });
      setIsGenerating(false);
      return;
    }

    // Update annotations for this edition
    setEditionAnnotations(draft => {
      draft[activeEditionId] = newAnnotations;
    });
    
    // Calculate statistics
    const validCount = newAnnotations.filter(a => 
      a.metadata.validation.status === 'valid'
    ).length;
    
    const avgQuality = Math.round(
      newAnnotations.reduce((sum, a) => sum + a.metadata.quality, 0) / newAnnotations.length
    );
    
    // Success notification
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `✅ Generated ${newAnnotations.length} segments (${validCount} valid, avg quality: ${avgQuality}%)`,
        duration: 3000
      }
    });
    
    setIsGenerating(false);
  }, 100);
  
}, [
  config, 
  activeEdition, 
  fullText, 
  activeEditionId, 
  setEditionAnnotations, 
  dispatch, 
  api, 
  workspace.currentSource
]);
// Save all editions
const handleSaveAll = useCallback(async () => {
  const totalSegments = selectedEditions.reduce((sum, edId) => {
    return sum + (editionAnnotations[edId]?.length || 0);
  }, 0);
  
  if (totalSegments === 0) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: { type: 'error', message: '❌ No segments to save', duration: 2000 }
    });
    return;
  }
  
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'saving', value: true } });
    
    let savedCount = 0;
    
    for (const editionId of selectedEditions) {
      const annotations = editionAnnotations[editionId] || [];
      if (annotations.length === 0) {
        console.log(`⏭️  Skipping ${editionId}: no segments`);
        continue;
      }
      
      const edition = editions.find(e => e.id === editionId);
      const fullText = edition.lines.join('\n');
      
      // Convert annotations to segments - CHARACTER POSITIONS ARE SOURCE OF TRUTH
      const segmentsToSave = annotations.map((ann, idx) => {
        // Calculate line numbers from character positions (for reference only)
        let currentPos = 0;
        let startLine = 0;
        let endLine = 0;
        
        for (let i = 0; i < edition.lines.length; i++) {
          const lineLength = edition.lines[i].length;
          const lineEnd = currentPos + lineLength;
          
          // Find start line
          if (currentPos <= ann.start && ann.start <= lineEnd) {
            startLine = i;
          }
          
          // Find end line
          if (currentPos <= ann.end && ann.end <= lineEnd + 1) {
            endLine = i;
          }
          
          currentPos = lineEnd + 1; // +1 for newline
          
          if (endLine > 0 && currentPos > ann.end) {
            break;
          }
        }
        
        const segmentLines = edition.lines.slice(startLine, endLine + 1);
        
        // Extract and verify the actual text using character positions
        const extractedText = fullText.slice(ann.start, ann.end);
        
        // Verify text matches
        if (extractedText !== ann.text) {
          console.error(`❌ TEXT MISMATCH for segment ${idx + 1}!`);
          console.error(`  Expected: "${ann.text.substring(0, 50)}..."`);
          console.error(`  Got: "${extractedText.substring(0, 50)}..."`);
          console.error(`  Char positions: ${ann.start}-${ann.end}`);
          console.error(`  Lines: ${startLine}-${endLine}`);
        } else {
          console.log(`✅ Segment ${idx + 1} verified: ${ann.start}-${ann.end} (lines ${startLine}-${endLine})`);
        }
        
        // CRITICAL: Character positions at ROOT level (primary source of truth)
        // Line numbers are secondary/reference only
        return {
          id: ann.id,
          name: `Segment ${idx + 1}`,
          start_char: ann.start,      // ← PRIMARY: Character position
          end_char: ann.end,          // ← PRIMARY: Character position
          start_line: startLine,      // ← SECONDARY: For reference
          end_line: endLine,          // ← SECONDARY: For reference
          text: extractedText,        // ← Use verified extracted text
          lines: segmentLines,
          metadata: {
            edition_id: editionId,
            edition_date: edition.date,
            start_char: ann.start,    // Redundant but harmless
            end_char: ann.end,        // Redundant but harmless
            label: ann.label,
            quality: calculateQuality(extractedText),
            validation: validateAnnotation(extractedText),
            level: ann.level || 0,
            letter_count: extractedText.replace(/[^a-zA-Z]/g, '').length,
            word_count: extractedText.split(/\s+/).filter(Boolean).length,
            ...(ann.metadata || {})
          }
        };
      });
      
      const segmentationData = {
        work_id: editionId,
        work_title: workspace.currentSource?.title,
        author: workspace.currentSource?.author,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        segments: segmentsToSave,
        metadata: {
          edition_id: editionId,
          edition_date: edition.date,
          is_primary: edition.isPrimary,
          total_segments: segmentsToSave.length,
          segmentation_mode: config.mode,
          ai_generated: config.mode === 'ai_statistical',
          full_text_length: fullText.length,
          total_lines: edition.lines.length,
          saved_with_char_positions: true // Flag for future compatibility
        }
      };
      
      console.log(`💾 Saving ${segmentsToSave.length} segments for edition: ${editionId}`);
      console.log(`📋 First segment:`, {
        id: segmentsToSave[0]?.id,
        start_char: segmentsToSave[0]?.start_char,
        end_char: segmentsToSave[0]?.end_char,
        text_preview: segmentsToSave[0]?.text?.substring(0, 50)
      });
      
      await api.saveSegmentation(segmentationData);
      
      savedCount += segmentsToSave.length;
      
      console.log(`✅ Saved ${segmentsToSave.length} segments for edition: ${editionId}`);
    }
    
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `✅ Saved ${savedCount} segments across ${selectedEditions.length} edition${selectedEditions.length !== 1 ? 's' : ''}`,
        duration: 3000
      }
    });
    
    dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    
  } catch (error) {
    console.error('❌ Save error:', error);
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: `Failed to save: ${error.message}`,
        duration: 5000
      }
    });
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'saving', value: false } });
  }
}, [selectedEditions, editionAnnotations, editions, workspace.currentSource, config.mode, dispatch, api]);

// Export all editions
  const handleExportAll = useCallback(() => {
    const exportData = {
      metadata: {
        workTitle: workspace.currentSource?.title,
        author: workspace.currentSource?.author,
        exportDate: new Date().toISOString(),
        editionsCount: selectedEditions.length,
        totalSegments: selectedEditions.reduce((sum, edId) => sum + (editionAnnotations[edId]?.length || 0), 0),
      },
      editions: selectedEditions.map(edId => {
        const edition = editions.find(e => e.id === edId);
        const annotations = editionAnnotations[edId] || [];
        
        return {
          editionId: edId,
          editionDate: edition?.date,
          isPrimary: edition?.isPrimary,
          segments: annotations.map(ann => ({
            ...ann,
            quality: calculateQuality(ann.text),
            validation: validateAnnotation(ann.text),
            letterCount: ann.text.replace(/[^a-zA-Z]/g, '').length,
            wordCount: ann.text.split(/\s+/).filter(Boolean).length
          }))
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi_edition_segmentation_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `✅ Exported ${selectedEditions.length} editions`,
        duration: 3000
      }
    });
  }, [workspace.currentSource, selectedEditions, editions, editionAnnotations, dispatch]);

  // Clear all editions
  const handleClearAll = useCallback(() => {
    const totalSegments = selectedEditions.reduce((sum, edId) => {
      return sum + (editionAnnotations[edId]?.length || 0);
    }, 0);
    
    if (window.confirm(`Clear all ${totalSegments} segments across ${selectedEditions.length} editions?`)) {
      setEditionAnnotations(draft => {
        selectedEditions.forEach(edId => {
          draft[edId] = [];
        });
      });
      setSelectedId(null);
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'info',
          message: '🗑️ All segments cleared',
          duration: 2000
        }
      });
    }
  }, [selectedEditions, editionAnnotations, setEditionAnnotations, dispatch]);

// Replace the handleAnalyzeMultiEdition callback (around line 1650):

const handleAnalyzeMultiEdition = useCallback(async () => {
  // Validate all editions are saved
  const allSaved = !hasUnsavedChanges && selectedEditions.length > 0;
  
  if (!allSaved) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: 'Please save all editions before analyzing',
        duration: 3000
      }
    });
    return;
  }
  
  // Calculate total segments across all editions
  const totalSegments = selectedEditions.reduce((sum, edId) => {
    return sum + (editionAnnotations[edId]?.length || 0);
  }, 0);
  
  if (totalSegments === 0) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: 'No segments to analyze',
        duration: 3000
      }
    });
    return;
  }
  
  // ✅ BUILD PROPER editionData OBJECT WITH SEGMENTS
  const editionData = {};
  
  for (const editionId of selectedEditions) {
    const edition = editions.find(e => e.id === editionId);
    const annotations = editionAnnotations[editionId] || [];
    
    if (!edition) {
      console.error(`❌ Edition not found: ${editionId}`);
      continue;
    }
    
    const fullText = edition.lines.join('\n');
    
    // Convert annotations to proper segment format
    const segments = annotations.map((ann, idx) => {
      // Calculate line numbers from character positions
      let currentPos = 0;
      let startLine = 0;
      let endLine = 0;
      
      for (let i = 0; i < edition.lines.length; i++) {
        const lineLength = edition.lines[i].length;
        const lineEnd = currentPos + lineLength;
        
        if (currentPos <= ann.start && ann.start <= lineEnd) {
          startLine = i;
        }
        
        if (currentPos <= ann.end && ann.end <= lineEnd + 1) {
          endLine = i;
        }
        
        currentPos = lineEnd + 1;
        
        if (endLine > 0 && currentPos > ann.end) {
          break;
        }
      }
      
      const segmentLines = edition.lines.slice(startLine, endLine + 1);
      
      return {
        id: ann.id,
        name: `Segment ${idx + 1}`,
        start_char: ann.start,
        end_char: ann.end,
        start_line: startLine,
        end_line: endLine,
        text: ann.text,
        lines: segmentLines,
        metadata: {
          edition_id: editionId,
          edition_date: edition.date,
          label: ann.label,
          ...(ann.metadata || {})
        }
      };
    });
    
    // ✅ THIS IS THE CRITICAL PART - editionData with proper structure
    editionData[editionId] = {
      id: editionId,
      date: edition.date,
      title: edition.title,
      isPrimary: edition.isPrimary,
      segments: segments,  // ← ACTUAL SEGMENT OBJECTS, not annotations
      useStatistical: false,
      segment_count: segments.length
    };
    
    console.log(`✅ Prepared ${segments.length} segments for edition: ${editionId}`);
  }
  
  // Verify editionData is properly populated
  if (Object.keys(editionData).length === 0) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: 'Failed to prepare edition data',
        duration: 3000
      }
    });
    return;
  }
  
  console.log('📦 Edition data prepared:', {
    editions: Object.keys(editionData),
    totalSegments: Object.values(editionData).reduce((sum, ed) => sum + ed.segments.length, 0)
  });
  
  // Store multi-edition configuration in workspace for analysis view
  dispatch({
    type: ACTIONS.SET_MULTI_EDITION_CONFIG,
    payload: {
      isMultiEdition: true,
      selectedEditions: selectedEditions,
      editionData: editionData,  // ← THIS IS NOW PROPERLY FORMATTED
      authorFolder: workspace.currentSource.author_folder,
      workTitle: workspace.currentSource.title,
      author: workspace.currentSource.author,
      baseWorkId: workspace.currentSource.base_work_id || workspace.currentSource.id,
      totalSegments: totalSegments
    }
  });
  
  // Show success notification
  dispatch({
    type: ACTIONS.ADD_NOTIFICATION,
    payload: {
      type: 'success',
      message: `✅ Ready to analyze ${selectedEditions.length} editions with ${totalSegments} segments`,
      duration: 3000
    }
  });
  
  // Navigate to analyze view where user will select view mode and methods
  dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'analyze' });
  
}, [
  selectedEditions, 
  editions, 
  editionAnnotations, 
  workspace.currentSource,
  hasUnsavedChanges,
  dispatch
]);
  if (!activeEdition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center p-12 bg-white rounded-3xl shadow-2xl border-2 border-gray-200 max-w-md">
          <AlertCircle className="w-24 h-24 text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">No Work Loaded</h2>
          <p className="text-gray-600 mb-8">Select a work from your library to start segmenting.</p>
          <button
            onClick={onBack}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-3 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        
        {/* Multi-Edition Header */}
        <MultiEditionToolHeader
          workTitle={workspace.currentSource?.title || 'Unknown Work'}
          author={workspace.currentSource?.author || 'Unknown Author'}
          editions={editions}
          selectedEditions={selectedEditions}
          editionAnnotations={editionAnnotations}
          onBack={onBack}
          onSave={handleSaveAll}
          onExport={handleExportAll}
          onClear={handleClearAll}
          onAnalyzeMultiEdition={handleAnalyzeMultiEdition}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Edition Selector */}
            <EditionSelector
              editions={editions}
              selectedEditions={selectedEditions}
              onToggleEdition={handleToggleEdition}
              onAddEdition={handleAddEdition}
              onRemoveEdition={handleRemoveEdition}
            />
            
            {/* Edition Comparison Panel */}
            <EditionComparisonPanel
              editions={editions}
              selectedEditions={selectedEditions}
              editionAnnotations={editionAnnotations}
            />
            
            {/* Mode Panel */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Interaction Mode
              </h3>
              
              <div className="space-y-2">
                {[
                  { value: MODES.SELECT, label: 'Select', icon: MousePointer, desc: 'Click to select segments' },
                  { value: MODES.DELETE, label: 'Delete', icon: Trash2, desc: 'Click to delete segments' },
                  { value: MODES.MERGE, label: 'Merge', icon: Combine, desc: 'Click two to merge' },
                ].map(m => {
                  const Icon = m.icon;
                  const isActive = mode === m.value;
                  
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900">{m.label}</div>
                          <div className="text-xs text-gray-600">{m.desc}</div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Algorithm Panel */}
            <AlgorithmPanel
              config={config}
              updateConfig={updateConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            {/* Statistics Panel */}
            <StatisticsPanel annotations={activeAnnotations} />

            {/* Annotation List */}
            <AnnotationList
              annotations={activeAnnotations}
              onSelect={setSelectedId}
              selectedId={selectedId}
              onDelete={handleAnnotationDelete}
              onLock={handleLockToggle}
            />
          </div>
          
          {/* Main Content - Text Annotator */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              {/* Active Edition Indicator */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-blue-900">
                        {activeEdition.date || 'Primary Edition'}
                      </div>
                      <div className="text-sm text-blue-700">
                        {activeAnnotations.length} segments • {activeEdition.line_count?.toLocaleString()} lines
                      </div>
                    </div>
                  </div>
                  
                  {editions.length > 1 && (
                    <select
                      value={activeEditionId}
                      onChange={(e) => setActiveEditionId(e.target.value)}
                      className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg font-semibold text-blue-900"
                    >
                      {editions.map(ed => (
                        <option key={ed.id} value={ed.id}>
                          {ed.date || ed.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              {/* Text Annotator - reuse from previous implementation */}
              <TextAnnotator
                text={fullText}
                annotations={activeAnnotations}
                onAnnotationAdd={handleAnnotationAdd}
                onAnnotationDelete={handleAnnotationDelete}
                onAnnotationUpdate={handleAnnotationUpdate}
                onAnnotationMerge={handleAnnotationMerge}
                selectedId={selectedId}
                onSelect={setSelectedId}
                isEnabled={true}
                mode={mode}
                onModeComplete={() => setMode(MODES.SELECT)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export all components including TextAnnotator, AnnotationList, AlgorithmPanel, etc.
// (Include all the previous component definitions here)

export default EnhancedSegmentationTool;