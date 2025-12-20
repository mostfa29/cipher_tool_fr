// EnhancedSegmentationTool.jsx - COMPLETE REWRITE
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  Scissors, BarChart3, ArrowLeft, Trash2, Check, X, Split, Combine, 
  Download, Layers, Sparkles, AlertCircle, Info, Zap, RefreshCw, 
  Lock, Unlock, Plus, Minus, Eye, EyeOff, Save, MousePointer, Hand,
  Type, Hash, FileText, ChevronDown, ChevronUp, Play, Target, Grid,
  Circle, Square, Triangle, Diamond, Hexagon, CircleDot, Star,
  TrendingUp, Activity, TrendingDown, HelpCircle, Edit3, Copy
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

// Replace the COLOR_PALETTE constant with this enhanced version
const COLOR_PALETTE = [
  { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81', name: 'Indigo', icon: Circle, highlight: '#C7D2FE' },
  { bg: '#DBEAFE', border: '#0284C7', text: '#0C4A6E', name: 'Sky Blue', icon: Square, highlight: '#BAE6FD' },
  { bg: '#D1FAE5', border: '#059669', text: '#064E3B', name: 'Emerald', icon: Triangle, highlight: '#A7F3D0' },
  { bg: '#FEF3C7', border: '#D97706', text: '#78350F', name: 'Amber', icon: Diamond, highlight: '#FDE68A' },
  { bg: '#FCE7F3', border: '#DB2777', text: '#831843', name: 'Pink', icon: Hexagon, highlight: '#FBCFE8' },
  { bg: '#E9D5FF', border: '#9333EA', text: '#581C87', name: 'Purple', icon: CircleDot, highlight: '#D8B4FE' },
  { bg: '#FFEDD5', border: '#EA580C', text: '#7C2D12', name: 'Orange', icon: Star, highlight: '#FED7AA' },
  { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', name: 'Red', icon: Activity, highlight: '#FECACA' },
  { bg: '#E0F2FE', border: '#0369A1', text: '#0C4A6E', name: 'Cyan', icon: Circle, highlight: '#BAE6FD' },
  { bg: '#FAF5FF', border: '#7C3AED', text: '#5B21B6', name: 'Violet', icon: Square, highlight: '#E9D5FF' },
  { bg: '#ECFCCB', border: '#65A30D', text: '#3F6212', name: 'Lime', icon: Triangle, highlight: '#D9F99D' },
  { bg: '#FFF7ED', border: '#C2410C', text: '#7C2D12', name: 'Rust', icon: Diamond, highlight: '#FFEDD5' },
];

const VALIDATION_COLORS = {
  valid: { bg: 'bg-green-50', border: 'border-green-400', color: '#10b981', emoji: '✅' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-400', color: '#f59e0b', emoji: '⚠️' },
  'too-short': { bg: 'bg-red-50', border: 'border-red-400', color: '#ef4444', emoji: '❌' },
  'too-long': { bg: 'bg-orange-50', border: 'border-orange-400', color: '#f97316', emoji: '⚡' },
};

const SEGMENTATION_MODES = [
  { value: 'smart', label: 'Smart Segments', icon: Sparkles, desc: 'AI-powered natural breaks' },
  { value: 'lines', label: 'Fixed Lines', icon: Target, desc: 'Split every N lines' },
  { value: 'letters', label: 'Letter Count', icon: Type, desc: 'Target character count' },
  { value: 'paragraphs', label: 'Paragraphs', icon: Grid, desc: 'Split at empty lines' },
  { value: 'punctuation', label: 'Sentences', icon: Split, desc: 'Split at sentence endings' },
  { value: 'manual', label: 'Manual Mode', icon: Hand, desc: 'Hand-crafted segments' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateLevel = (annotation, allAnnotations) => {
  let level = 0;
  for (const other of allAnnotations) {
    if (other.id === annotation.id) continue;
    // An annotation is nested if another completely contains it
    if (other.start <= annotation.start && other.end >= annotation.end) {
      level++;
    }
  }
  return level;
};

// Replace the getAnnotationColor function with this smarter version
const getAnnotationColor = (annotation, allAnnotations) => {
  const level = calculateLevel(annotation, allAnnotations);
  
  // Get siblings (annotations at the same level)
  const siblings = allAnnotations.filter(ann => {
    const annLevel = calculateLevel(ann, allAnnotations);
    return annLevel === level && ann.id !== annotation.id;
  }).sort((a, b) => a.start - b.start);
  
  // Find position among siblings
  const position = siblings.findIndex(s => s.start > annotation.start);
  const actualPosition = position === -1 ? siblings.length : position;
  
  // Use different color strategy based on level
  let colorIndex;
  if (level === 0) {
    // Top level: use position-based colors with spacing
    colorIndex = (actualPosition * 3) % COLOR_PALETTE.length;
  } else {
    // Nested levels: offset by level to avoid parent color
    colorIndex = (level * 4 + actualPosition * 2) % COLOR_PALETTE.length;
  }
  
  // Avoid using same color as parent
  const parent = allAnnotations.find(other => 
    other.id !== annotation.id && 
    other.start <= annotation.start && 
    other.end >= annotation.end
  );
  
  if (parent) {
    const parentColor = getAnnotationColor(parent, allAnnotations);
    const parentIndex = COLOR_PALETTE.findIndex(c => c.border === parentColor.border);
    
    // If same color as parent, shift to next color
    if (colorIndex === parentIndex) {
      colorIndex = (colorIndex + 1) % COLOR_PALETTE.length;
    }
  }
  
  return COLOR_PALETTE[colorIndex];
};

const validateAnnotation = (text) => {
  const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
  
  if (letterCount < 30) {
    return { status: 'too-short', message: 'Too short for analysis (<30 letters)' };
  } else if (letterCount > 500) {
    return { status: 'too-long', message: 'Very long segment (>500 letters)' };
  } else if (letterCount < 50) {
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
// SEGMENTATION ENGINES
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
// TEXT ANNOTATOR COMPONENT (Core Manual Annotation)
// ============================================================================
// Add this component before TextAnnotator
const NestingGuide = ({ annotations, selectedId, hoveredId }) => {
  if (annotations.length === 0) return null;
  
  const selected = annotations.find(a => a.id === selectedId);
  const hovered = annotations.find(a => a.id === hoveredId);
  const target = selected || hovered;
  
  if (!target) return null;
  
  // Find parents (annotations that contain this one)
  const parents = annotations.filter(ann => 
    ann.id !== target.id &&
    ann.start <= target.start && 
    ann.end >= target.end
  ).sort((a, b) => (a.end - a.start) - (b.end - b.start)); // Innermost first
  
  // Find children (annotations contained by this one)
  const children = annotations.filter(ann => 
    ann.id !== target.id &&
    target.start <= ann.start && 
    target.end >= ann.end
  );
  
  if (parents.length === 0 && children.length === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      border: '2px solid #e5e7eb',
      zIndex: 10000,
      maxWidth: '300px'
    }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '12px',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Layers className="w-4 h-4" />
        Nesting Hierarchy
      </div>
      
      {parents.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
            📦 Parents (contains this):
          </div>
          {parents.map((parent, idx) => {
            const color = getAnnotationColor(parent, annotations);
            return (
              <div 
                key={parent.id}
                style={{
                  fontSize: '11px',
                  padding: '6px 8px',
                  backgroundColor: color.bg,
                  border: `2px solid ${color.border}`,
                  borderRadius: '6px',
                  marginBottom: '4px',
                  marginLeft: `${idx * 12}px`
                }}
              >
                L{calculateLevel(parent, annotations)}: {parent.label.substring(0, 30)}...
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{
        fontSize: '12px',
        fontWeight: '700',
        color: '#3b82f6',
        padding: '8px',
        backgroundColor: '#eff6ff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        🎯 Current: {target.label.substring(0, 30)}...
      </div>
      
      {children.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
            📎 Children (inside this):
          </div>
          {children.map((child, idx) => {
            const color = getAnnotationColor(child, annotations);
            return (
              <div 
                key={child.id}
                style={{
                  fontSize: '11px',
                  padding: '6px 8px',
                  backgroundColor: color.bg,
                  border: `2px solid ${color.border}`,
                  borderRadius: '6px',
                  marginBottom: '4px',
                  marginLeft: `${idx * 12}px`
                }}
              >
                L{calculateLevel(child, annotations)}: {child.label.substring(0, 30)}...
              </div>
            );
          })}
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
        // Sort by level first, then by position
        if (a.level !== b.level) return a.level - b.level;
        return a.start - b.start;
      });
  }, [annotations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {sortedAnnotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
          <Layers className="w-16 h-16" style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>No segments yet</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Drag to select text</p>
        </div>
      ) : (
        sortedAnnotations.map(ann => {
          const isSelected = selectedId === ann.id;
          const colors = getAnnotationColor(ann, annotations);
          const validation = validateAnnotation(ann.text || '');
          const validationColor = VALIDATION_COLORS[validation.status];
          const quality = calculateQuality(ann.text || '');
          const Icon = colors.icon;

          return (
            <div
              key={ann.id}
              onClick={() => onSelect(ann.id)}
              style={{
                padding: '12px',
                marginLeft: `${ann.level * 20}px`, // Indent based on nesting
                backgroundColor: colors.bg,
                border: `2px solid ${colors.border}`,
                borderLeft: `${4 + ann.level * 2}px solid ${colors.border}`, // Thicker left border for nested
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected 
                  ? `0 6px 20px ${colors.border}40` 
                  : '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative'
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
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                  
                  {/* Color indicator */}
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
                </div>
                
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
                      cursor: 'pointer'
                    }}
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
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <p style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1F2937', 
                marginBottom: '6px',
                lineHeight: '1.4'
              }}>
                {ann.label}
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                fontSize: '11px', 
                color: '#6B7280', 
                fontFamily: 'monospace',
                flexWrap: 'wrap'
              }}>
                <span>{ann.start} → {ann.end}</span>
                <span>•</span>
                <span>{ann.end - ann.start} chars</span>
                <span>•</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: quality >= 80 ? '#059669' : quality >= 60 ? '#0284C7' : '#D97706'
                }}>
                  Q: {quality}%
                </span>
              </div>
            </div>
          );
        })
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

// Update the ToolHeader component in EnhancedSegmentationTool.jsx:

const ToolHeader = ({ onBack, activeSource, annotations, onSave, onExport, onClear, hasUnsavedChanges, onAnalyze }) => {
  const hasSavedSegments = annotations.length > 0 && !hasUnsavedChanges;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all"
            title="Change Text"
          >
            <RefreshCw className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="h-12 w-px bg-gray-300" />
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {activeSource.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {activeSource.line_count?.toLocaleString()} lines
              </span>
              <span>•</span>
              <span className="font-medium">{activeSource.author}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Segment Count */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <Scissors className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-xl text-blue-900">{annotations.length}</span>
            <span className="text-sm text-blue-700 font-medium">segments</span>
          </div>

          {/* Clear Button */}
          <button
            onClick={onClear}
            disabled={annotations.length === 0}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
              annotations.length > 0
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={annotations.length === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
              annotations.length > 0
                ? hasUnsavedChanges
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  : 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'Save' : 'Saved'}
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            disabled={annotations.length === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
              annotations.length > 0
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Analyze Button - Only enabled when saved */}
          <button
            onClick={onAnalyze}
            disabled={!hasSavedSegments}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              hasSavedSegments
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={!hasSavedSegments ? 'Save segments before analyzing' : 'Start analysis'}
          >
            <Target className="w-5 h-5" />
            Analyze
          </button>
        </div>
      </div>
      
      {/* Status message */}
      {annotations.length > 0 && hasUnsavedChanges && (
        <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Save your segments before proceeding to analysis
        </div>
      )}
    </div>
  );
};
// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EnhancedSegmentationTool = ({ onBack, saveSegmentation, hasUnsavedChanges, onAnalyze }) => {
  const { state, dispatch } = useAppState();
  const { workspace } = state;
  const activeSource = workspace.currentSource;
  
  if (!activeSource) {
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
            <RefreshCw className="w-5 h-5" />
            Change Text
          </button>
        </div>
      </div>
    );
  }

  const lines = activeSource?.lines || [];
  const fullText = lines.join('\n');
  
  // State management
  const [annotations, setAnnotations] = useImmer([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(MODES.SELECT);
  const [config, updateConfig] = useImmer({
    mode: 'smart',
    linesPerSegment: 20,
    lettersPerSegment: 150,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Annotation handlers
  const handleAnnotationAdd = useCallback((newAnn) => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const level = annotations.filter(ann => 
      ann.start <= newAnn.start && ann.end >= newAnn.end
    ).length;
    
    setAnnotations(draft => {
      draft.push({
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
  }, [annotations, setAnnotations, dispatch]);

  const handleAnnotationDelete = useCallback((id) => {
    setAnnotations(draft => {
      const index = draft.findIndex(a => a.id === id);
      if (index !== -1) {
        draft.splice(index, 1);
      }
    });
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [setAnnotations, selectedId]);

  const handleAnnotationUpdate = useCallback((id, updates) => {
    setAnnotations(draft => {
      const ann = draft.find(a => a.id === id);
      if (ann) {
        Object.assign(ann, updates);
      }
    });
  }, [setAnnotations]);

  const handleAnnotationMerge = useCallback((id1, id2) => {
    const ann1 = annotations.find(a => a.id === id1);
    const ann2 = annotations.find(a => a.id === id2);
    
    if (!ann1 || !ann2) return;

    const start = Math.min(ann1.start, ann2.start);
    const end = Math.max(ann1.end, ann2.end);
    const text = fullText.slice(start, end);
    const label = text.length > 50 ? text.slice(0, 50) + '...' : text;

    setAnnotations(draft => {
      const idx1 = draft.findIndex(a => a.id === id1);
      const idx2 = draft.findIndex(a => a.id === id2);
      if (idx1 !== -1) draft.splice(idx1, 1);
      if (idx2 !== -1) draft.splice(idx2 > idx1 ? idx2 - 1 : idx2, 1);
      
      draft.push({
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
  }, [annotations, fullText, setAnnotations, dispatch]);

  const handleLockToggle = useCallback((id) => {
    setAnnotations(draft => {
      const ann = draft.find(a => a.id === id);
      if (ann) {
        ann.locked = !ann.locked;
      }
    });
  }, [setAnnotations]);

  // Generate segments from algorithm
  const handleGenerate = useCallback(() => {
    if (!lines || lines.length === 0) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      let boundaries;
      
      switch (config.mode) {
        case 'lines':
          boundaries = SegmentationEngine.byLines(lines, config.linesPerSegment);
          break;
        case 'letters':
          boundaries = SegmentationEngine.byLetterCount(lines, config.lettersPerSegment);
          break;
        case 'punctuation':
          boundaries = SegmentationEngine.byPunctuation(lines);
          break;
        case 'paragraphs':
          boundaries = SegmentationEngine.byParagraphs(lines);
          break;
        case 'smart':
          boundaries = SegmentationEngine.smart(lines, config.lettersPerSegment);
          break;
        default:
          setIsGenerating(false);
          return;
      }
      
      if (!boundaries || boundaries.length < 2) {
        dispatch({
          type: ACTIONS.ADD_NOTIFICATION,
          payload: { type: 'error', message: '❌ Failed to generate segments', duration: 2000 }
        });
        setIsGenerating(false);
        return;
      }

      const getCharPosition = (lineIndex) => {
        let charPos = 0;
        for (let i = 0; i < lineIndex; i++) {
          charPos += lines[i].length + 1;
        }
        return charPos;
      };

      const newAnnotations = [];
      for (let i = 0; i < boundaries.length - 1; i++) {
        const startLine = boundaries[i];
        const endLine = boundaries[i + 1];
        
        if (startLine >= endLine) continue;
        
        const startChar = getCharPosition(startLine);
        const segmentLines = lines.slice(startLine, endLine);
        const text = segmentLines.join('\n');
        const endChar = startChar + text.length;
        
        if (startChar >= endChar || endChar > fullText.length) continue;
        
        const label = text.length > 50 ? text.slice(0, 50) + '...' : text;
        
        newAnnotations.push({
          id: `ann-${Date.now()}-${i}`,
          start: startChar,
          end: endChar,
          label,
          text,
          locked: false,
          createdAt: Date.now()
        });
      }

      setAnnotations(newAnnotations);
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: `✅ Generated ${newAnnotations.length} segments`,
          duration: 3000
        }
      });
      
      setIsGenerating(false);
    }, 100);
  }, [config, lines, fullText, setAnnotations, dispatch]);

  // Save to backend
  const handleSave = useCallback(async () => {
    if (annotations.length === 0) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: { type: 'error', message: '❌ No segments to save', duration: 2000 }
      });
      return;
    }
    
    // Update segments in context first
    const segmentsToSave = annotations.map((ann, idx) => ({
      id: ann.id,
      name: `Segment ${idx + 1}`,
      start_line: 0,
      end_line: 0,
      text: ann.text,
      lines: ann.text.split('\n'),
      metadata: {
        start: ann.start,
        end: ann.end,
        label: ann.label,
        quality: calculateQuality(ann.text),
        validation: validateAnnotation(ann.text)
      }
    }));
    
    dispatch({ type: ACTIONS.SET_SEGMENTS, payload: segmentsToSave });
    
    // Then call the save function from parent
    await saveSegmentation();
  }, [annotations, dispatch, saveSegmentation]);

  // Export to JSON
  const handleExport = useCallback(() => {
    const exportData = {
      metadata: {
        workId: activeSource.id,
        workTitle: activeSource.title,
        author: activeSource.author,
        exportDate: new Date().toISOString(),
        totalSegments: annotations.length,
      },
      annotations: annotations.map(ann => ({
        ...ann,
        quality: calculateQuality(ann.text),
        validation: validateAnnotation(ann.text),
        letterCount: ann.text.replace(/[^a-zA-Z]/g, '').length,
        wordCount: ann.text.split(/\s+/).filter(Boolean).length
      })),
      fullText: fullText,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segmentation_${activeSource.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `✅ Exported ${annotations.length} segments`,
        duration: 3000
      }
    });
  }, [annotations, activeSource, fullText, dispatch]);

  const handleClear = useCallback(() => {
    if (window.confirm(`Clear all ${annotations.length} segments?`)) {
      setAnnotations([]);
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
  }, [annotations.length, setAnnotations, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setSelectedId(null);
        setMode(MODES.SELECT);
      } else if (e.key === 'Delete' && selectedId) {
        handleAnnotationDelete(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleAnnotationDelete]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-[1920px] mx-auto space-y-6">
        
        {/* Header */}
        <ToolHeader
          onBack={onBack}
          activeSource={activeSource}
          annotations={annotations}
          onSave={handleSave}
          onExport={handleExport}
          onClear={handleClear}
          hasUnsavedChanges={hasUnsavedChanges}
          onAnalyze={onAnalyze}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Controls */}
          <div className="xl:col-span-1 space-y-6">
            <ModePanel mode={mode} onModeChange={setMode} />
            
            <AlgorithmPanel
              config={config}
              updateConfig={updateConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            <StatisticsPanel annotations={annotations} />

            <AnnotationList
              annotations={annotations}
              onSelect={setSelectedId}
              selectedId={selectedId}
              onDelete={handleAnnotationDelete}
              onLock={handleLockToggle}
            />
          </div>
          
          {/* Main Content - Text Annotator */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <TextAnnotator
                text={fullText}
                annotations={annotations}
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
      <NestingGuide 
        annotations={annotations} 
        selectedId={selectedId} 
        hoveredId={null}
      />
    </div>
  );
};

export default EnhancedSegmentationTool;