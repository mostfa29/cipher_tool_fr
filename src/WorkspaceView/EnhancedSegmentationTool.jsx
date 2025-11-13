import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useImmer } from 'use-immer';
import { useDebounce } from 'use-debounce';
import { 
  Scissors, BarChart3, Settings, Maximize2, Minimize2, 
  ZapOff, Trash2, Check, X, ChevronDown, ChevronUp,
  Split, Combine, Eye, EyeOff, Copy, Download, Upload
} from 'lucide-react';

// Mock data
const MOCK_TEXT = `The end of physicke is our bodies health:
Why Faustus hast thou not attain'd that end?
Is not thy common talke sound Aphorismes?
Are not thy billes hung vp as monuments,
Whereby whole Cities haue escapt the plague,
And thousand desperate maladies beene eas'd?
Yet art thou still but Faustus, and a man.
Couldst thou make men to liue eternally,
Or being dead, raise them to life againe,
Then this profession were to be esteem'd.
Physicke farewell, where is Iustinian?
Si vna eademque res legatur duobus,
Alter rem, alter valorem rei, etc.
A petty case of paltry Legacies:
Exhereditare filium non potest pater nisi, etc.
Such is the subiect of the Institute,
And vniuersall body of the Law:
This study fits a mercenary drudge,
Who aimes at nothing but externall trash;
Too seruile and illiberall for mee.
When all is done, Diuinity is best.
Ierome's Bible Faustus, view it well:
Stipendium peccati mors est: ha, Stipendium, etc.
The reward of sinne is death: that's hard.
Si peccasse negamus, fallimur, et nulla est in nobis veritas.
If we say that we have no sinne,
We deceiue our selues, and there's no truth in vs.
Why then belike we must sinne,
And so consequently die.
I, we must die an euerlasting death.`;

// Segmentation algorithms
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

  bySentences: (lines, sentenceCount) => {
    const boundaries = [0];
    let sentencesSeen = 0;
    
    lines.forEach((line, idx) => {
      const sentencesInLine = (line.match(/[.!?]+/g) || []).length;
      sentencesSeen += sentencesInLine;
      
      if (sentencesSeen >= sentenceCount && idx < lines.length - 1) {
        boundaries.push(idx + 1);
        sentencesSeen = 0;
      }
    });
    
    boundaries.push(lines.length);
    return boundaries;
  },

  balanced: (lines, targetCount) => {
    const totalLetters = lines.join('').replace(/[^a-zA-Z]/g, '').length;
    const segmentCount = Math.ceil(totalLetters / targetCount);
    const lettersPerSegment = Math.floor(totalLetters / segmentCount);
    
    return SegmentationEngine.byLetterCount(lines, lettersPerSegment);
  }
};

// Enhanced Segment class with validation
class Segment {
  constructor(lines, startLine, endLine) {
    this.startLine = startLine;
    this.endLine = endLine;
    this.text = lines.slice(startLine, endLine).join('\n');
    this.letterCount = this.text.replace(/[^a-zA-Z]/g, '').length;
    this.wordCount = this.text.split(/\s+/).filter(Boolean).length;
    this.lineCount = endLine - startLine;
  }

  get isValid() {
    return this.letterCount >= 100 && this.letterCount <= 500;
  }

  get validationStatus() {
    if (this.letterCount < 100) return 'too-short';
    if (this.letterCount > 500) return 'too-long';
    return 'valid';
  }

  get quality() {
    const ideal = 300;
    const distance = Math.abs(this.letterCount - ideal);
    return Math.max(0, 100 - (distance / ideal) * 100);
  }
}

const EnhancedSegmentationTool = () => {
  // State management with immer for complex nested updates
  const [config, updateConfig] = useImmer({
    mode: 'lines',
    linesPerSegment: 3,
    lettersPerSegment: 250,
    sentencesPerSegment: 2,
    minLetters: 100,
    maxLetters: 500,
    autoBalance: false
  });

  const [ui, updateUI] = useImmer({
    showStats: true,
    showValidation: true,
    highlightMode: 'segments', // 'segments', 'validity', 'none'
    fontSize: 'medium',
    showLineNumbers: true,
    compactMode: false,
    selectedSegmentId: null,
    hoveredLineIndex: null,
    editingSegmentId: null
  });

  const [boundaries, setBoundaries] = useState([0, MOCK_TEXT.split('\n').length]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const virtuosoRef = useRef(null);
  const lines = useMemo(() => MOCK_TEXT.split('\n'), []);

  // Debounced config for auto-regeneration
  const [debouncedConfig] = useDebounce(config, 300);

  // Generate segments from boundaries
  const segments = useMemo(() => {
    if (boundaries.length < 2) return [];
    
    return boundaries.slice(0, -1).map((start, i) => {
      const end = boundaries[i + 1];
      const segment = new Segment(lines, start, end);
      return { ...segment, id: i + 1 };
    });
  }, [boundaries, lines]);

  // Statistics
  const stats = useMemo(() => {
    if (segments.length === 0) return null;
    
    const letterCounts = segments.map(s => s.letterCount);
    const validSegments = segments.filter(s => s.isValid);
    
    return {
      total: segments.length,
      valid: validSegments.length,
      invalid: segments.length - validSegments.length,
      avgLetters: Math.round(letterCounts.reduce((a, b) => a + b, 0) / letterCounts.length),
      minLetters: Math.min(...letterCounts),
      maxLetters: Math.max(...letterCounts),
      avgQuality: Math.round(segments.reduce((sum, s) => sum + s.quality, 0) / segments.length),
      totalLetters: letterCounts.reduce((a, b) => a + b, 0)
    };
  }, [segments]);

  // Auto-generate segments
  const generateSegments = useCallback(() => {
    let newBoundaries;
    
    switch (config.mode) {
      case 'lines':
        newBoundaries = SegmentationEngine.byLines(lines, config.linesPerSegment);
        break;
      case 'letters':
        newBoundaries = config.autoBalance
          ? SegmentationEngine.balanced(lines, config.lettersPerSegment)
          : SegmentationEngine.byLetterCount(lines, config.lettersPerSegment);
        break;
      case 'punctuation':
        newBoundaries = SegmentationEngine.byPunctuation(lines);
        break;
      case 'sentences':
        newBoundaries = SegmentationEngine.bySentences(lines, config.sentencesPerSegment);
        break;
      default:
        return;
    }
    
    // Save to history
    setHistory(prev => [...prev.slice(0, historyIndex + 1), boundaries]);
    setHistoryIndex(prev => prev + 1);
    setBoundaries(newBoundaries);
  }, [config, lines, boundaries, historyIndex]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setBoundaries(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setBoundaries(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Manual boundary operations
  const toggleBoundary = useCallback((lineIndex) => {
    const idx = boundaries.indexOf(lineIndex);
    let newBoundaries;
    
    if (idx > 0 && idx < boundaries.length - 1) {
      newBoundaries = boundaries.filter((_, i) => i !== idx);
    } else if (idx === -1) {
      newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
    } else {
      return;
    }
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), boundaries]);
    setHistoryIndex(prev => prev + 1);
    setBoundaries(newBoundaries);
  }, [boundaries, historyIndex]);

  const splitSegment = useCallback((segmentId, lineIndex) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || lineIndex <= segment.startLine || lineIndex >= segment.endLine) return;
    
    const newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), boundaries]);
    setHistoryIndex(prev => prev + 1);
    setBoundaries(newBoundaries);
  }, [segments, boundaries, historyIndex]);

  const mergeSegments = useCallback((segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || segmentId === segments.length) return;
    
    const newBoundaries = boundaries.filter(b => b !== segment.endLine);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), boundaries]);
    setHistoryIndex(prev => prev + 1);
    setBoundaries(newBoundaries);
  }, [segments, boundaries, historyIndex]);

  const deleteSegment = useCallback((segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    const newBoundaries = boundaries.filter(b => b !== segment.endLine);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), boundaries]);
    setHistoryIndex(prev => prev + 1);
    setBoundaries(newBoundaries);
    updateUI(draft => { draft.selectedSegmentId = null; });
  }, [segments, boundaries, historyIndex, updateUI]);

  // Get segment for line
  const getSegmentForLine = useCallback((lineIndex) => {
    return segments.find(seg => 
      lineIndex >= seg.startLine && lineIndex < seg.endLine
    );
  }, [segments]);

  // Color schemes
  const getSegmentColor = useCallback((segment) => {
    if (!segment) return '';
    
    if (ui.highlightMode === 'validity') {
      switch (segment.validationStatus) {
        case 'valid': return 'bg-green-50 border-green-200';
        case 'too-short': return 'bg-yellow-50 border-yellow-200';
        case 'too-long': return 'bg-red-50 border-red-200';
        default: return '';
      }
    }
    
    if (ui.highlightMode === 'segments') {
      const colors = [
        'bg-blue-50 border-blue-200',
        'bg-green-50 border-green-200',
        'bg-purple-50 border-purple-200',
        'bg-pink-50 border-pink-200',
        'bg-indigo-50 border-indigo-200',
        'bg-cyan-50 border-cyan-200'
      ];
      return colors[(segment.id - 1) % colors.length];
    }
    
    return '';
  }, [ui.highlightMode]);

  // Export/Import
  const exportSegments = useCallback(() => {
    const data = {
      segments: segments.map(s => ({
        id: s.id,
        startLine: s.startLine,
        endLine: s.endLine,
        text: s.text,
        letterCount: s.letterCount
      })),
      boundaries,
      config,
      stats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segments.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [segments, boundaries, config, stats]);

  // Scroll to segment
  const scrollToSegment = useCallback((segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: segment.startLine,
        align: 'center',
        behavior: 'smooth'
      });
      updateUI(draft => { draft.selectedSegmentId = segmentId; });
    }
  }, [segments, updateUI]);

  // Row renderer for virtualized list
  const rowContent = useCallback((index) => {
    const line = lines[index];
    const segment = getSegmentForLine(index);
    const isFirstInSegment = segment && index === segment.startLine;
    const isLastInSegment = segment && index === segment.endLine - 1;
    const isSelected = segment && segment.id === ui.selectedSegmentId;
    const hasBoundaryAfter = boundaries.includes(index + 1);

    return (
      <div className="w-full">
        {/* Segment Header */}
        {isFirstInSegment && !ui.compactMode && (
          <div 
            onClick={() => updateUI(draft => { 
              draft.selectedSegmentId = isSelected ? null : segment.id;
            })}
            className={`cursor-pointer border-l-4 px-3 py-2 mb-1 rounded flex items-center justify-between group hover:shadow-sm transition-all ${
              segment.isValid ? 'border-green-500' : 'border-red-500'
            } ${getSegmentColor(segment)} ${
              isSelected ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-700">
                Seg {segment.id}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                segment.isValid 
                  ? 'bg-green-100 text-green-700' 
                  : segment.validationStatus === 'too-short'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {segment.letterCount}L
              </span>
              <span className="text-xs text-gray-500">
                {segment.lineCount} lines • {segment.wordCount} words
              </span>
              {ui.showValidation && (
                <span className="text-xs text-gray-400">
                  Q: {Math.round(segment.quality)}%
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  mergeSegments(segment.id);
                }}
                disabled={segment.id === segments.length}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Merge with next"
              >
                <div className="w-3 h-3 text-blue-600" > 🔗 </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSegment(segment.id);
                }}
                className="p-1 hover:bg-red-100 rounded"
                title="Delete segment"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* Line Content */}
        <div
          className={`flex gap-2 px-3 py-0.5 relative group/line ${
            segment ? getSegmentColor(segment) : ''
          } ${isSelected ? 'ring-1 ring-blue-300 ring-inset' : ''}`}
          onMouseEnter={() => updateUI(draft => { draft.hoveredLineIndex = index; })}
          onMouseLeave={() => updateUI(draft => { draft.hoveredLineIndex = null; })}
        >
          {ui.showLineNumbers && (
            <span className="flex-shrink-0 w-10 text-right text-xs text-gray-400 select-none">
              {index + 1}
            </span>
          )}
          <div className={`flex-1 font-mono ${
            ui.fontSize === 'small' ? 'text-sm' :
            ui.fontSize === 'large' ? 'text-lg' : 'text-base'
          } text-gray-800`}>
            {line || '\u00A0'}
          </div>
          
          {/* Split button on hover */}
          {isSelected && ui.hoveredLineIndex === index && !isFirstInSegment && !isLastInSegment && (
            <button
              onClick={() => splitSegment(segment.id, index + 1)}
              className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors opacity-0 group-hover/line:opacity-100"
              title="Split here"
            >
              <Split className="w-3 h-3 inline mr-1" />
              Split
            </button>
          )}
        </div>

        {/* Boundary Control */}
        <div
          className={`relative h-4 group/boundary cursor-pointer ${
            ui.hoveredLineIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => toggleBoundary(index + 1)}
        >
          {hasBoundaryAfter ? (
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
              <div className="flex-1 border-t-2 border-dashed border-blue-400"></div>
              <button className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors">
                ✕ Remove
              </button>
              <div className="flex-1 border-t-2 border-dashed border-blue-400"></div>
            </div>
          ) : index < lines.length - 1 && (
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center opacity-0 group-hover/boundary:opacity-100 transition-opacity">
              <div className="flex-1 border-t border-dashed border-gray-300"></div>
              <button className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors">
                + Add
              </button>
              <div className="flex-1 border-t border-dashed border-gray-300"></div>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    lines, boundaries, segments, ui, getSegmentForLine, getSegmentColor,
    toggleBoundary, splitSegment, mergeSegments, deleteSegment, updateUI
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Text Segmentation</h1>
              <p className="text-sm text-gray-600 mt-1">Automated + Manual segmentation with real-time validation</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo"
              >
                ↷
              </button>
              <button
                onClick={exportSegments}
                disabled={segments.length === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Mode Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Segmentation Mode
              </h3>
              
              <div className="space-y-3">
                {['lines', 'letters', 'punctuation', 'sentences', 'manual'].map(mode => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={mode}
                      checked={config.mode === mode}
                      onChange={(e) => updateConfig(draft => { draft.mode = e.target.value; })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 capitalize">{mode}</span>
                  </label>
                ))}
              </div>

              {/* Mode-specific controls */}
              {config.mode === 'lines' && (
                <div className="mt-3 space-y-2">
                  <label className="text-xs text-gray-600">Lines: {config.linesPerSegment}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.linesPerSegment}
                    onChange={(e) => updateConfig(draft => { 
                      draft.linesPerSegment = parseInt(e.target.value); 
                    })}
                    className="w-full"
                  />
                </div>
              )}

              {config.mode === 'letters' && (
                <div className="mt-3 space-y-2">
                  <label className="text-xs text-gray-600">Target: {config.lettersPerSegment}L</label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={config.lettersPerSegment}
                    onChange={(e) => updateConfig(draft => { 
                      draft.lettersPerSegment = parseInt(e.target.value); 
                    })}
                    className="w-full"
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={config.autoBalance}
                      onChange={(e) => updateConfig(draft => { 
                        draft.autoBalance = e.target.checked; 
                      })}
                    />
                    Auto-balance segments
                  </label>
                </div>
              )}

              {config.mode === 'sentences' && (
                <div className="mt-3 space-y-2">
                  <label className="text-xs text-gray-600">Sentences: {config.sentencesPerSegment}</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.sentencesPerSegment}
                    onChange={(e) => updateConfig(draft => { 
                      draft.sentencesPerSegment = parseInt(e.target.value); 
                    })}
                    className="w-full"
                  />
                </div>
              )}
              
              <button
                onClick={generateSegments}
                disabled={config.mode === 'manual'}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Generate Segments
              </button>
              
              {segments.length > 0 && (
                <button
                  onClick={() => {
                    setBoundaries([0, lines.length]);
                    updateUI(draft => { draft.selectedSegmentId = null; });
                  }}
                  className="w-full mt-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Statistics */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Statistics
                  </h3>
                  <button
                    onClick={() => updateUI(draft => { draft.showStats = !draft.showStats; })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {ui.showStats ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
                
                {ui.showStats && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Total</div>
                        <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <div className="text-xs text-green-600">Valid</div>
                        <div className="text-lg font-semibold text-green-700">{stats.valid}</div>
                      </div>
                      <div className="bg-red-50 rounded p-2">
                        <div className="text-xs text-red-600">Invalid</div>
                        <div className="text-lg font-semibold text-red-700">{stats.invalid}</div>
                      </div>
                      <div className="bg-blue-50 rounded p-2">
                        <div className="text-xs text-blue-600">Quality</div>
                        <div className="text-lg font-semibold text-blue-700">{stats.avgQuality}%</div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Letters:</span>
                        <span className="font-semibold text-gray-900">{stats.avgLetters}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Range:</span>
                        <span className="font-semibold text-gray-900">{stats.minLetters}-{stats.maxLetters}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold text-gray-900">{stats.totalLetters}L</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                View Options
              </h3>
              
              <div className="space-y-2">
<label className="flex items-center gap-2 text-xs cursor-pointer">
<input
type="checkbox"
checked={ui.showLineNumbers}
onChange={(e) => updateUI(draft => {
draft.showLineNumbers = e.target.checked;
})}
className="w-4 h-4"
/>
Show line numbers
</label>            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={ui.showValidation}
                onChange={(e) => updateUI(draft => { 
                  draft.showValidation = e.target.checked; 
                })}
                className="w-4 h-4"
              />
              Show validation
            </label>            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={ui.compactMode}
                onChange={(e) => updateUI(draft => { 
                  draft.compactMode = e.target.checked; 
                })}
                className="w-4 h-4"
              />
              Compact mode
            </label>            <div className="pt-2 border-t border-gray-200">
              <label className="text-xs text-gray-600 block mb-2">Highlight Mode</label>
              <select
                value={ui.highlightMode}
                onChange={(e) => updateUI(draft => { 
                  draft.highlightMode = e.target.value; 
                })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="segments">By Segment</option>
                <option value="validity">By Validity</option>
                <option value="none">None</option>
              </select>
            </div>            <div className="pt-2 border-t border-gray-200">
              <label className="text-xs text-gray-600 block mb-2">Font Size</label>
              <select
                value={ui.fontSize}
                onChange={(e) => updateUI(draft => { 
                  draft.fontSize = e.target.value; 
                })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>        {/* Segment Navigator */}
        {segments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Segment Navigator
            </h3>
            <div className="space-y-1">
              {segments.map(segment => (
                <button
                  key={segment.id}
                  onClick={() => scrollToSegment(segment.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    ui.selectedSegmentId === segment.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Seg {segment.id}</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      segment.isValid 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {segment.letterCount}L
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}        {/* Tips */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Tips</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Click segment header to select</li>
            <li>• Hover between lines to add/remove boundaries</li>
            <li>• Use ✂️ Split on selected segments</li>
            <li>• Use 🔗 Merge to combine segments</li>
            <li>• Valid range: 100-500 letters</li>
            <li>• Use Ctrl+Z / Ctrl+Y for undo/redo</li>
          </ul>
        </div>
      </div>      {/* Text Display */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>          {/* Text Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Doctor Faustus A-text</h3>
                <p className="text-xs text-gray-600 mt-1">Christopher Marlowe • 1604 • {lines.length} lines</p>
              </div>
              {segments.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {segments.length} segments
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    {stats.valid} valid
                  </span>
                  {stats.invalid > 0 && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                      {stats.invalid} invalid
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>          {/* Virtualized Content */}
          <div className="flex-1 overflow-hidden">
            {segments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ZapOff className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm mb-2">No segments generated yet</p>
                <p className="text-gray-400 text-xs">Select a mode and click "Generate Segments" to begin</p>
              </div>
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                totalCount={lines.length}
                itemContent={rowContent}
                style={{ height: '100%' }}
                overscan={20}
              />
            )}
          </div>          {/* Footer */}
          {segments.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <span>
                    {lines.length} lines • {stats.totalLetters} letters
                  </span>
                  {ui.selectedSegmentId && (
                    <span className="text-blue-600 font-medium">
                      Segment {ui.selectedSegmentId} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded ${
                    stats.valid === stats.total 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {Math.round((stats.valid / stats.total) * 100)}% valid
                  </span>
                  <span>Avg quality: {stats.avgQuality}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
);
};export default EnhancedSegmentationTool;