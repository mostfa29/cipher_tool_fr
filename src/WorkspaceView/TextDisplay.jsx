import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  Tag, Trash2, Download, RefreshCw, Eye, EyeOff,
  CheckCircle, Layers, Maximize2, Minimize2,
  Merge, Power, MousePointer2, Move, Scissors
} from 'lucide-react';

const SAMPLE_TEXT = `The Odyssey is one of two major ancient Greek epic poems attributed to Homer. It is one of the oldest works of literature still widely read by modern audiences. As with the Iliad, the poem is divided into 24 books. It follows the Greek hero Odysseus, king of Ithaca, and his journey home after the Trojan War.

After the war itself, which lasted ten years, his journey lasts for ten additional years, during which time he encounters many perils and all his crew mates are killed. In his absence, Odysseus is assumed dead, and his wife Penelope and son Telemachus must contend with a group of unruly suitors who compete for Penelope's hand in marriage.

The Odyssey was originally composed in Homeric Greek in around the 8th or 7th century BC and, by the mid-6th century BC, had become part of the Greek literary canon. In antiquity, Homer's authorship of the poem was not questioned, but contemporary scholarship predominantly assumes that the Iliad and the Odyssey were composed independently and that the stories had existed as oral traditions before being written down.`;

const INITIAL_ANNOTATIONS = [
  { id: 'ann-1', start: 0, end: 89, label: 'Opening sentence' },
  { id: 'ann-2', start: 90, end: 165, label: 'Literary significance' },
  { id: 'ann-3', start: 283, end: 377, label: 'Hero introduction' },
];

const COLOR_PALETTE = [
  { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81' },
  { bg: '#DBEAFE', border: '#0284C7', text: '#0C4A6E' },
  { bg: '#D1FAE5', border: '#059669', text: '#064E3B' },
  { bg: '#FEF3C7', border: '#D97706', text: '#78350F' },
  { bg: '#FCE7F3', border: '#DB2777', text: '#831843' },
  { bg: '#E9D5FF', border: '#9333EA', text: '#581C87' },
  { bg: '#FFEDD5', border: '#EA580C', text: '#7C2D12' },
  { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
];

const MODES = {
  SELECT: 'select',
  DELETE: 'delete',
  MERGE: 'merge',
  RESIZE_START: 'resize-start',
  RESIZE_END: 'resize-end',
};

// Calculate nesting level
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

// Get color for annotation
const getAnnotationColor = (annotation, allAnnotations) => {
  const sorted = [...allAnnotations].sort((a, b) => a.start - b.start);
  const index = sorted.findIndex(a => a.id === annotation.id);
  
  // Try to avoid same color for adjacent or nested annotations
  let colorIndex = index % COLOR_PALETTE.length;
  
  // Check if nested parent has same color
  const parent = allAnnotations.find(other => 
    other.id !== annotation.id && 
    other.start <= annotation.start && 
    other.end >= annotation.end
  );
  
  if (parent) {
    const parentColorIndex = sorted.findIndex(a => a.id === parent.id) % COLOR_PALETTE.length;
    if (colorIndex === parentColorIndex) {
      colorIndex = (colorIndex + 1) % COLOR_PALETTE.length;
    }
  }
  
  return COLOR_PALETTE[colorIndex];
};

// Text Annotator Component
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
  const [resizeAnnotation, setResizeAnnotation] = useState(null);

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

  // In your TextAnnotator component, add this at the top of the render:
console.log('TextAnnotator render:', {
  annotationsCount: annotations.length,
  mode: mode,
  text: text.substring(0, 50) + '...'
});

// Log each annotation as it renders:
annotations.forEach(ann => {
  console.log('Rendering annotation:', ann.id, 'from', ann.start, 'to', ann.end);
});

// Handle mouse down for selection

  // Handle mouse move
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

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isSelecting && tempSelection && tempSelection.end - tempSelection.start > 0) {
      const selectedText = text.slice(tempSelection.start, tempSelection.end);
      const label = selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText;
      
      onAnnotationAdd({
        start: tempSelection.start,
        end: tempSelection.end,
        label: label
      });
    }
    setSelectionBox(null);
    setTempSelection(null);
    setIsSelecting(false);
  }, [isSelecting, tempSelection, onAnnotationAdd, text]);

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
// Handle annotation click
const handleAnnotationClick = useCallback((e, annId) => {
  console.log('🎯 ANNOTATION CLICKED:', { annId, mode, isEnabled });
  
  if (!isEnabled) {
    console.log('❌ Tool disabled, ignoring click');
    return;
  }
  
  e.stopPropagation();
  e.preventDefault();
  
  console.log('📍 Processing click in mode:', mode);
  
  if (mode === MODES.SELECT) {
    console.log('  → SELECT mode: toggling selection');
    onSelect(selectedId === annId ? null : annId);
  } else if (mode === MODES.DELETE) {
    console.log('  → DELETE mode: deleting annotation', annId);
    onAnnotationDelete(annId);
    onModeComplete();
  } else if (mode === MODES.MERGE) {
    console.log('  → MERGE mode: merge source is', mergeSource);
    if (!mergeSource) {
      console.log('    → Setting first annotation for merge');
      setMergeSource(annId);
      onSelect(annId);
    } else if (mergeSource !== annId) {
      console.log('    → Merging', mergeSource, 'with', annId);
      onAnnotationMerge(mergeSource, annId);
      setMergeSource(null);
      onSelect(null);
      onModeComplete();
    } else {
      console.log('    → Same annotation clicked, deselecting');
      setMergeSource(null);
      onSelect(null);
    }
  } else if (mode === MODES.RESIZE_START || mode === MODES.RESIZE_END) {
    console.log('  → RESIZE mode: selecting annotation', annId);
    setResizeAnnotation(annId);
    onSelect(annId);
  }
}, [isEnabled, mode, selectedId, mergeSource, onSelect, onAnnotationDelete, onAnnotationMerge, onModeComplete]);
  
// In handleMouseDown, update the logging:
const handleMouseDown = useCallback((e) => {
  console.log('🖱️ MOUSE DOWN:', { 
    button: e.button, 
    isEnabled, 
    mode,
    target: e.target.tagName,
    targetClass: e.target.className,
    targetId: e.target.id,
    targetInnerText: e.target.innerText?.substring(0, 50), // See what text it contains
    targetPosition: e.target.style.position,
    targetZIndex: e.target.style.zIndex,
    hasDataAnnotation: !!e.target.dataset.annotation,
    dataset: e.target.dataset,
    parentDataset: e.target.parentElement?.dataset,
    // NEW: Check all parents up to 3 levels
    parent1: e.target.parentElement?.dataset,
    parent2: e.target.parentElement?.parentElement?.dataset,
    parent3: e.target.parentElement?.parentElement?.parentElement?.dataset,
  });
  
  if (!isEnabled || e.button !== 0) {
    console.log('  → Ignoring: disabled or wrong button');
    return;
  }
  
  const target = e.target;
  
  // Check if clicking on annotation (check target first, then parent)
  let annotationId = target.dataset.annotation;
  
  if (!annotationId && target.parentElement) {
    console.log('  → Checking parent element for annotation');
    annotationId = target.parentElement.dataset.annotation;
  }
  
  console.log('  → Annotation ID from dataset:', annotationId);
  
  if (annotationId) {
    console.log('  → Found annotation, calling handleAnnotationClick');
    handleAnnotationClick(e, annotationId);
    return;
  }

  // Only allow new selections in SELECT mode
  if (mode !== MODES.SELECT) {
    console.log('  → Not in SELECT mode, ignoring non-annotation click');
    return;
  }

  console.log('  → Starting new selection');
  setIsSelecting(true);
  const containerRect = containerRef.current.getBoundingClientRect();
  const startX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
  const startY = e.clientY - containerRect.top + containerRef.current.scrollTop;
  
  setSelectionBox({ startX, startY, endX: startX, endY: startY });
}, [isEnabled, mode, handleAnnotationClick]);
// Handle resize selection
  useEffect(() => {
    if (!resizeAnnotation || !tempSelection) return;
    
    const annotation = annotations.find(a => a.id === resizeAnnotation);
    if (!annotation) return;

    if (mode === MODES.RESIZE_START) {
      onAnnotationUpdate(resizeAnnotation, {
        start: Math.min(tempSelection.start, annotation.end - 1),
        label: text.slice(Math.min(tempSelection.start, annotation.end - 1), annotation.end).slice(0, 50) + '...'
      });
    } else if (mode === MODES.RESIZE_END) {
      onAnnotationUpdate(resizeAnnotation, {
        end: Math.max(tempSelection.end, annotation.start + 1),
        label: text.slice(annotation.start, Math.max(tempSelection.end, annotation.start + 1)).slice(0, 50) + '...'
      });
    }
  }, [tempSelection, resizeAnnotation, mode, annotations, onAnnotationUpdate, text]);

  const getCursor = () => {
    if (!isEnabled) return 'not-allowed';
    if (isSelecting) return 'crosshair';
    if (mode === MODES.DELETE) return 'not-allowed';
    if (mode === MODES.MERGE) return 'copy';
    if (mode === MODES.RESIZE_START || mode === MODES.RESIZE_END) return 'col-resize';
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
        pointerEvents: isEnabled ? 'all' : 'none'
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
          padding: '0',
        pointerEvents: 'none' ,
        mixBlendMode: 'multiply' 

        }}
      >
        {text}
      </div>

      {/* Annotation overlays */}
      {charRects.length > 0 && isEnabled && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
{annotationBoxes.map(
  ({ annotation, boxes }) => {
    const isSelected = selectedId === annotation.id;
    const isHovered = hoveredId === annotation.id;
    const isMergeSource = mergeSource === annotation.id;
    const isResizing = resizeAnnotation === annotation.id;
    const padding = 3 + annotation.level * 4;
    const colors = getAnnotationColor(annotation, annotations);

    console.log('📦 Rendering annotation box:', annotation.id, 'boxes:', boxes.length);

    return (
      <div key={annotation.id}>
          {boxes.map((box, idx) => {
            console.log(`  → Box ${idx} for annotation ${annotation.id}`);
            return (
              <div
                key={`${annotation.id}-box-${idx}`}
                data-annotation={annotation.id}
                onClick={(e) => {
                  console.log('📦 BOX CLICKED directly:', annotation.id, 'mode:', mode);
                  handleAnnotationClick(e, annotation.id);
                }}
                onMouseEnter={() => {
                  console.log('🐭 MOUSE ENTER:', annotation.id);
                  setHoveredId(annotation.id);
                }}
                onMouseLeave={() => {
                  console.log('🐭 MOUSE LEAVE:', annotation.id);
                  setHoveredId(null);
                }}
                style={{
                  position: 'absolute',
                  left: `${box.left - padding}px`,
                  top: `${box.top - padding}px`,
                  width: `${box.width + padding * 2}px`,
                  height: `${box.height + padding * 2}px`,
                  backgroundColor: isMergeSource 
                    ? '#FEF3C7' 
                    : isResizing 
                    ? '#DBEAFE'
                    : colors.bg + (isSelected ? 'ff' : 'dd'),
                  border: `2px solid ${isMergeSource ? '#F59E0B' : isResizing ? '#3B82F6' : colors.border}`,
                  borderRadius: '6px',
                  pointerEvents: mode === MODES.SELECT ? 'none' : 'all',  // CHANGE: Only capture in non-SELECT modes
                  cursor: mode === MODES.DELETE ? 'not-allowed' : 
                          mode === MODES.MERGE ? 'copy' : 
                          mode === MODES.RESIZE_START ? 'w-resize' :
                          mode === MODES.RESIZE_END ? 'e-resize' :
                          'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: annotation.level * 10 + (isSelected ? 2000 : 0) + (isHovered ? 1000 : 0),
                  boxShadow: isSelected 
                    ? `0 0 0 4px ${colors.border}40, 0 8px 24px rgba(0,0,0,0.2)`
                    : isHovered 
                    ? `0 0 0 3px ${colors.border}30, 0 6px 16px rgba(0,0,0,0.15)`
                    : '0 2px 6px rgba(0,0,0,0.08)',
                  transform: isSelected ? 'scale(1.02)' : isHovered ? 'scale(1.01)' : 'scale(1)'
                }}
              />
            );
          })}
        </div>
    );
  }
)}

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

// Annotation List Sidebar
const AnnotationList = ({ annotations, onSelect, selectedId }) => {
  const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortedAnnotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
          <Layers className="w-16 h-16" style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>No annotations yet</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Drag to select text</p>
        </div>
      ) : (
        sortedAnnotations.map(ann => {
          const level = calculateLevel(ann, annotations);
          const isSelected = selectedId === ann.id;
          const colors = getAnnotationColor(ann, annotations);

          return (
            <div
              key={ann.id}
              onClick={() => onSelect(ann.id)}
              style={{
                padding: '16px',
                backgroundColor: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? `0 6px 20px ${colors.border}40` : '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: colors.border,
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    L{level}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: colors.text
                  }}>
                    sentence
                  </span>
                </div>
                {isSelected && <CheckCircle className="w-4 h-4" style={{ color: colors.border }} />}
              </div>
              
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
                {ann.label}
              </p>
              
              <p style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>
                {ann.start} → {ann.end} ({ann.end - ann.start} chars)
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

// Main App
export default function App() {
  const [text] = useState(SAMPLE_TEXT);
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [mode, setMode] = useState(MODES.SELECT);

  const handleAddAnnotation = useCallback((data) => {
    const newAnnotation = {
      id: `ann-${Date.now()}`,
      ...data
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedId(newAnnotation.id);
  }, []);

  const handleDeleteAnnotation = useCallback((id) => {
  console.log('🗑️ DELETE HANDLER CALLED:', id);
  console.log('  → Current annotations:', annotations.map(a => a.id));
  
  setAnnotations(prev => {
    const filtered = prev.filter(a => a.id !== id);
    console.log('  → After delete:', filtered.map(a => a.id));
    return filtered;
  });
  
  if (selectedId === id) {
    console.log('  → Clearing selection');
    setSelectedId(null);
  }
}, [annotations, selectedId]);
  const handleUpdateAnnotation = useCallback((id, updates) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const handleMergeAnnotations = useCallback((sourceId, targetId) => {
    const source = annotations.find(a => a.id === sourceId);
    const target = annotations.find(a => a.id === targetId);
    
    if (!source || !target) return;

    const newStart = Math.min(source.start, target.start);
    const newEnd = Math.max(source.end, target.end);
    const newText = text.slice(newStart, newEnd);
    const newLabel = newText.length > 50 ? newText.slice(0, 50) + '...' : newText;

    setAnnotations(prev => [
      ...prev.filter(a => a.id !== sourceId && a.id !== targetId),
      {
        id: `ann-${Date.now()}`,
        start: newStart,
        end: newEnd,
        label: newLabel
      }
    ]);
    setSelectedId(null);
  }, [annotations, text]);

  const handleLoadDemo = () => {
    setAnnotations(INITIAL_ANNOTATIONS);
    setSelectedId(null);
    setMode(MODES.SELECT);
  };

  const handleClear = () => {
    if (window.confirm('Clear all annotations?')) {
      setAnnotations([]);
      setSelectedId(null);
      setMode(MODES.SELECT);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(annotations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleModeChange = (newMode) => {
    if (mode === newMode) {
      setMode(MODES.SELECT);
    } else {
      setMode(newMode);
    }
    setSelectedId(null);
    console.log('Changing mode from', mode, 'to', newMode);

  };

  const handleModeComplete = () => {
    setMode(MODES.SELECT);
  };

  const getModeInfo = () => {
    switch (mode) {
      case MODES.DELETE:
        return { text: 'Delete Mode: Click an annotation to delete it', color: '#EF4444', icon: Trash2 };
      case MODES.MERGE:
        return { text: 'Merge Mode: Click two annotations to merge them', color: '#8B5CF6', icon: Merge };
      case MODES.RESIZE_START:
        return { text: 'Resize Start: Select an annotation, then drag to adjust start', color: '#3B82F6', icon: Minimize2 };
      case MODES.RESIZE_END:
        return { text: 'Resize End: Select an annotation, then drag to adjust end', color: '#3B82F6', icon: Maximize2 };
      default:
        return null;
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #F8FAFC, #EEF2FF, #F5F3FF)', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '900', background: 'linear-gradient(to right, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, marginBottom: '8px' }}>
                Sentence Annotator Pro
              </h1>
              <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
                {isEnabled ? 'Select mode → Click annotations → Use toolbar actions' : 'Annotation disabled'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                style={{
                  padding: '10px 16px',
                  background: isEnabled 
                    ? 'linear-gradient(to right, #10B981, #059669)' 
                    : 'linear-gradient(to right, #EF4444, #DC2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <Power className="w-4 h-4" />
                {isEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setShowSidebar(!showSidebar)}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(to right, #F3F4F6, #E5E7EB)',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {showSidebar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSidebar ? 'Hide' : 'Show'}
              </button>

              <button
                onClick={handleLoadDemo}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(to right, #8B5CF6, #7C3AED)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Demo
              </button>

              <button
                onClick={handleExport}
                disabled={annotations.length === 0}
                style={{
                  padding: '10px 16px',
                  background: annotations.length > 0 ? 'linear-gradient(to right, #3B82F6, #2563EB)' : '#E5E7EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <button
                onClick={handleClear}
                disabled={annotations.length === 0}
                style={{
                  padding: '10px 16px',
                  background: annotations.length > 0 ? 'linear-gradient(to right, #EF4444, #DC2626)' : '#E5E7EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Mode Toolbar */}
          <div style={{ marginTop: '20px', padding: '16px', background: 'linear-gradient(to right, #F9FAFB, #F3F4F6)', borderRadius: '12px', border: '2px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                <button
                  onClick={() => handleModeChange(MODES.SELECT)}
                  style={{
                    padding: '8px 16px',
                    background: mode === MODES.SELECT ? 'linear-gradient(to right, #3B82F6, #2563EB)' : 'white',
                    color: mode === MODES.SELECT ? 'white' : '#6B7280',
                    border: mode === MODES.SELECT ? 'none' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: mode === MODES.SELECT ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  <MousePointer2 className="w-4 h-4" />
                  Select
                </button>

                <button
                  onClick={() => handleModeChange(MODES.DELETE)}
                  disabled={annotations.length === 0}
                  style={{
                    padding: '8px 16px',
                    background: mode === MODES.DELETE ? 'linear-gradient(to right, #EF4444, #DC2626)' : 'white',
                    color: mode === MODES.DELETE ? 'white' : annotations.length === 0 ? '#D1D5DB' : '#6B7280',
                    border: mode === MODES.DELETE ? 'none' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: mode === MODES.DELETE ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                    opacity: annotations.length === 0 ? 0.5 : 1
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <button
                  onClick={() => handleModeChange(MODES.MERGE)}
                  disabled={annotations.length < 2}
                  style={{
                    padding: '8px 16px',
                    background: mode === MODES.MERGE ? 'linear-gradient(to right, #8B5CF6, #7C3AED)' : 'white',
                    color: mode === MODES.MERGE ? 'white' : annotations.length < 2 ? '#D1D5DB' : '#6B7280',
                    border: mode === MODES.MERGE ? 'none' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: annotations.length >= 2 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: mode === MODES.MERGE ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
                    opacity: annotations.length < 2 ? 0.5 : 1
                  }}
                >
                  <Merge className="w-4 h-4" />
                  Merge
                </button>

                <button
                  onClick={() => handleModeChange(MODES.RESIZE_START)}
                  disabled={annotations.length === 0}
                  style={{
                    padding: '8px 16px',
                    background: mode === MODES.RESIZE_START ? 'linear-gradient(to right, #0EA5E9, #0284C7)' : 'white',
                    color: mode === MODES.RESIZE_START ? 'white' : annotations.length === 0 ? '#D1D5DB' : '#6B7280',
                    border: mode === MODES.RESIZE_START ? 'none' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: mode === MODES.RESIZE_START ? '0 2px 8px rgba(14, 165, 233, 0.3)' : 'none',
                    opacity: annotations.length === 0 ? 0.5 : 1
                  }}
                >
                  <Minimize2 className="w-4 h-4" />
                  Resize Start
                </button>

                <button
                  onClick={() => handleModeChange(MODES.RESIZE_END)}
                  disabled={annotations.length === 0}
                  style={{
                    padding: '8px 16px',
                    background: mode === MODES.RESIZE_END ? 'linear-gradient(to right, #0EA5E9, #0284C7)' : 'white',
                    color: mode === MODES.RESIZE_END ? 'white' : annotations.length === 0 ? '#D1D5DB' : '#6B7280',
                    border: mode === MODES.RESIZE_END ? 'none' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: mode === MODES.RESIZE_END ? '0 2px 8px rgba(14, 165, 233, 0.3)' : 'none',
                    opacity: annotations.length === 0 ? 0.5 : 1
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                  Resize End
                </button>
              </div>

              {mode !== MODES.SELECT && (
                <button
                  onClick={handleModeComplete}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(to right, #F3F4F6, #E5E7EB)',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Mode Info Banner */}
          {modeInfo && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              background: `${modeInfo.color}15`, 
              borderRadius: '10px', 
              border: `2px solid ${modeInfo.color}30`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ 
                padding: '8px', 
                backgroundColor: modeInfo.color, 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <modeInfo.icon className="w-4 h-4" style={{ color: 'white' }} />
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1F2937', fontWeight: '600' }}>
                💡 {modeInfo.text}
              </p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: showSidebar ? '2fr 1fr' : '1fr', gap: '24px' }}>
          {/* Text editor */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '2px solid #F3F4F6', background: 'linear-gradient(to right, #FAFAFA, #F9FAFB)' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag className="w-5 h-5" style={{ color: '#3B82F6' }} />
                Document
                <span style={{ marginLeft: 'auto', padding: '4px 12px', backgroundColor: '#E0E7FF', color: '#4338CA', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                  {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  backgroundColor: isEnabled ? '#D1FAE5' : '#FEE2E2', 
                  color: isEnabled ? '#065F46' : '#991B1B', 
                  borderRadius: '999px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: isEnabled ? '#10B981' : '#EF4444' 
                  }} />
                  {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </h3>
            </div>

            <div style={{ padding: '32px', maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' }}>
              <TextAnnotator
                text={text}
                annotations={annotations}
                onAnnotationAdd={handleAddAnnotation}
                onAnnotationDelete={handleDeleteAnnotation}
                onAnnotationUpdate={handleUpdateAnnotation}
                onAnnotationMerge={handleMergeAnnotations}
                selectedId={selectedId}
                onSelect={setSelectedId}
                isEnabled={isEnabled}
                mode={mode}
                onModeComplete={handleModeComplete}
              />
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '2px solid #F3F4F6', background: 'linear-gradient(to right, #FAFAFA, #F9FAFB)' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                  Annotations
                </h3>
              </div>

              <div style={{ padding: '20px', maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' }}>
                <AnnotationList
                  annotations={annotations}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                />
              </div>
            </div>
          )}
        </div>

        {/* Feature info panel */}
        <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
            How to Use
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#DBEAFE', borderRadius: '8px', flexShrink: 0 }}>
                <MousePointer2 className="w-4 h-4" style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Select Mode (Default)</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Drag to create new annotations, click to select existing ones</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#FEE2E2', borderRadius: '8px', flexShrink: 0 }}>
                <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Delete Mode</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Click any annotation to permanently remove it</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#EDE9FE', borderRadius: '8px', flexShrink: 0 }}>
                <Merge className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Merge Mode</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Click two annotations to combine them into one</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#DBEAFE', borderRadius: '8px', flexShrink: 0 }}>
                <Minimize2 className="w-4 h-4" style={{ color: '#0EA5E9' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Resize Start</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Select annotation, then drag to adjust beginning position</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#DBEAFE', borderRadius: '8px', flexShrink: 0 }}>
                <Maximize2 className="w-4 h-4" style={{ color: '#0EA5E9' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Resize End</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Select annotation, then drag to adjust ending position</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#F3E8FF', borderRadius: '8px', flexShrink: 0 }}>
                <Layers className="w-4 h-4" style={{ color: '#9333EA' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Nested Annotations</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Create overlapping annotations with automatic level detection</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}