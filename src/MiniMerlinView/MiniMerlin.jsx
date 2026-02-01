// frontend/src/components/MiniMerlin.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Play, RotateCcw, Save, FileText, Trash2, Copy, Check, AlertCircle,
  Sparkles, StickyNote, Download, Upload, X, ChevronDown, ChevronUp,
  Zap, List, Filter, Info, RefreshCw, Hash, Plus, Loader, Edit2, 
  CheckCircle, Layers, Archive, Search, Calendar, Clock, FolderOpen,
  ToggleLeft, ToggleRight, Settings, Database, BookOpen  // NEW: Added for fixes
} from 'lucide-react';
import { useAppState } from '../context/AppContext';

const MiniMerlin = () => {
  const { 
    state, 
    createMiniMerlinSession,
    loadTextIntoMiniMerlin,
    updateMiniMerlinScratchPad,
    getMiniMerlinSuggestions,
    getMiniMerlinSolutions,
    addMiniMerlinNote,
    deleteMiniMerlinNote,
    getMiniMerlinNotes,
    exportMiniMerlinSession,
    listMiniMerlinSessions,
    deleteMiniMerlinSession,
    clearMiniMerlinSession,
    getMiniMerlinSession,
    getMiniMerlinSessionState,
    addSentenceToSession,
    updateSentence,
    deleteSentence,
    saveSentenceSolution,
      miniMerlinAIChat,
  clearMiniMerlinAIChat,
  toggleMiniMerlinAI,
  setMiniMerlinRawMode,
    addNotification
  } = useAppState();

  const miniMerlinState = state.miniMerlin;
  const currentSession = miniMerlinState?.currentSession;
  const sessionState = miniMerlinState?.sessionState;

  // ==================== STATE ====================
  // View state
  const [activeView, setActiveView] = useState('sessions'); // 'sessions' | 'workspace'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('solver'); // 'solver' | 'ai' | 'history'
const [aiMessage, setAiMessage] = useState('');
const [isAISending, setIsAISending] = useState(false);
const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
const [hasFetchedSolutions, setHasFetchedSolutions] = useState(false);

// Get AI state from context
const aiEnabled = miniMerlinState?.aiEnabled || false;
const aiChatHistory = miniMerlinState?.aiChatHistory || [];

// FIX #5: Get raw mode from context (default true = unbiased like boulter.com)
const rawMode = miniMerlinState?.rawMode ?? true;
  // Session management
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  
  // Workspace state
  const [sentences, setSentences] = useState([]);
  const [activeSentenceId, setActiveSentenceId] = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [scratchPad, setScratchPad] = useState('');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // UI state
  const [showAddSentence, setShowAddSentence] = useState(false);
  const [newSentenceText, setNewSentenceText] = useState('');
  const [newSentenceName, setNewSentenceName] = useState('');
  const [editingSentenceId, setEditingSentenceId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Loading states
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  
  // Results state
  const [suggestions, setSuggestions] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [expandedSolution, setExpandedSolution] = useState(null);
  
  // Filter/sort state
  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('score');
  const [minWordLength, setMinWordLength] = useState(4);      // FIX #2: Was 2, now 4
  const [maxSuggestions, setMaxSuggestions] = useState(5000); // FIX #4: Was 100, now 5000
  
  // NEW: Display mode and settings panel
  const [suggestionDisplayMode, setSuggestionDisplayMode] = useState('grouped'); // 'grouped' | 'flat'
  const [showSettings, setShowSettings] = useState(false);
  
  // Message state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const scratchPadRef = useRef(null);
const previousScratchPadRef = useRef('');

  // ==================== EFFECTS ====================
  
  // Load sessions on mount
  useEffect(() => {
    loadSessionsList();
  }, []);


  // Load sentences when session changes
  useEffect(() => {
    if (currentSession?.sentences) {
      setSentences(currentSession.sentences);
      
      if (!activeSentenceId && currentSession.sentences.length > 0) {
        setActiveSentenceId(currentSession.sentences[0].id);
      }
    } else {
      setSentences([]);
      setActiveSentenceId(null);
    }
  }, [currentSession]);

  // Load active sentence data
// Load active sentence data
useEffect(() => {
  const activeSentence = sentences.find(s => s.id === activeSentenceId);
  if (activeSentence) {
    setOriginalText(activeSentence.original_text || '');
    setScratchPad(activeSentence.scratch_pad || '');
    
    // Reset fetch flags when switching sentences
    setHasFetchedSuggestions(false);
    setHasFetchedSolutions(false);
  }
}, [activeSentenceId, sentences]);

  // Load notes when session changes
  useEffect(() => {
    if (currentSession?.session_id && activeView === 'workspace') {
      loadNotes();
    }
  }, [currentSession?.session_id, activeView]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);


const handleRawModeToggle = async () => {
  try {
    const newMode = !rawMode;
    await setMiniMerlinRawMode(newMode);
    
    // Refresh suggestions if we have them
    if (hasFetchedSuggestions && currentSession?.session_id && activeSentenceId) {
      setTimeout(() => refreshSuggestions(), 200);
    }
    
    setSuccess(newMode 
      ? 'Raw mode ON - Results sorted by length (like boulter.com)'
      : 'Smart mode ON - Statistical scoring active'
    );
  } catch (err) {
    setError('Failed to toggle raw mode: ' + err.message);
  }
};

const handleAIChat = async () => {
  if (!aiMessage.trim()) return;
  
  try {
    setIsAISending(true);
    await miniMerlinAIChat(aiMessage);
    setAiMessage('');
  } catch (err) {
    setError('AI chat failed: ' + err.message);
  } finally {
    setIsAISending(false);
  }
};
  const loadSessionsList = async () => {
    try {
      setLoadingSessions(true);
      const result = await listMiniMerlinSessions();
      setSessions(result.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      setError('');
      await createMiniMerlinSession();
      await loadSessionsList();
      setSuccess('New session created');
      setActiveView('workspace');
    } catch (err) {
      setError('Failed to create session: ' + err.message);
    }
  };

  const handleLoadSession = async (sessionId) => {
    try {
      setError('');
      setIsLoadingText(true);
      
      console.log('📂 Loading session:', sessionId);
      
      const result = await getMiniMerlinSession(sessionId);
      
      console.log('✅ Session loaded:', result.session);
      
      // Switch to workspace view
      setActiveView('workspace');
      setSuccess(`Loaded session: ${sessionId.slice(0, 12)}`);
      
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load session: ' + err.message);
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;

    try {
      await deleteMiniMerlinSession(sessionId);
      await loadSessionsList();
      setSuccess('Session deleted');
      
      if (currentSession?.session_id === sessionId) {
        clearMiniMerlinSession();
        setActiveView('sessions');
      }
      
      if (selectedSessionForDetails?.session_id === sessionId) {
        setSelectedSessionForDetails(null);
        setShowSessionDetails(false);
      }
    } catch (err) {
      setError('Failed to delete session: ' + err.message);
    }
  };

  const handleExportSession = async (sessionId, format = 'csv') => {
    try {
      await exportMiniMerlinSession(sessionId, format);
      setSuccess(`Session exported as ${format.toUpperCase()}`);
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  const handleViewSessionDetails = async (sessionId) => {
    try {
      const result = await getMiniMerlinSession(sessionId);
      setSelectedSessionForDetails(result.session);
      setShowSessionDetails(true);
    } catch (err) {
      setError('Failed to load session details: ' + err.message);
    }
  };

  // ==================== SENTENCE MANAGEMENT FUNCTIONS ====================

  const handleAddSentence = async () => {
    if (!newSentenceText.trim()) {
      setError('Please enter text for the sentence');
      return;
    }

    try {
      setIsLoadingText(true);
      
      const sentence = await addSentenceToSession(
        newSentenceText,
        newSentenceName || null
      );

      setNewSentenceText('');
      setNewSentenceName('');
      setShowAddSentence(false);
      setActiveSentenceId(sentence.id);
      
      setSuccess('Sentence added to session');
    } catch (err) {
      setError('Failed to add sentence: ' + err.message);
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleUpdateSentence = async (sentenceId, newScratchPad) => {
    try {
      await updateSentence(sentenceId, newScratchPad);
    } catch (err) {
      setError('Failed to update sentence: ' + err.message);
    }
  };

  const handleDeleteSentence = async (sentenceId) => {
    if (!confirm('Delete this sentence?')) return;

    try {
      await deleteSentence(sentenceId);
      
      const remainingSentences = sentences.filter(s => s.id !== sentenceId);
      if (remainingSentences.length > 0) {
        setActiveSentenceId(remainingSentences[0].id);
      } else {
        setActiveSentenceId(null);
      }
      
      setSuccess('Sentence deleted');
    } catch (err) {
      setError('Failed to delete sentence: ' + err.message);
    }
  };

  const handleSaveSolution = async (solutionText, type = 'manual') => {
    if (!activeSentenceId) {
      setError('No active sentence');
      return;
    }

    try {
      const activeSentence = sentences.find(s => s.id === activeSentenceId);
      
      await saveSentenceSolution(
        activeSentenceId,
        solutionText,
        type,
        {
          spoilage: activeSentence?.spoilage || 0,
          pool_size: activeSentence?.pool_size || 0
        }
      );
      
      setSuccess('Solution saved!');
    } catch (err) {
      setError('Failed to save solution: ' + err.message);
    }
  };

  // ==================== WORKSPACE FUNCTIONS ====================

  const loadNotes = async () => {
    if (!currentSession?.session_id) return;
    try {
      const result = await getMiniMerlinNotes(currentSession.session_id);
      setNotes(result.notes || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !currentSession?.session_id) return;

    try {
      await addMiniMerlinNote(currentSession.session_id, newNote);
      setNewNote('');
      await loadNotes();
      setSuccess('Note added');
    } catch (err) {
      setError('Failed to add note: ' + err.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!currentSession?.session_id) return;

    try {
      await deleteMiniMerlinNote(currentSession.session_id, noteId);
      await loadNotes();
      setSuccess('Note deleted');
    } catch (err) {
      setError('Failed to delete note: ' + err.message);
    }
  };

const handleScratchPadChange = (e) => {
  const newValue = e.target.value;
  
  // If no active sentence, allow typing (for initial setup)
  if (!activeSentenceId) {
    setScratchPad(newValue);
    return;
  }
  
  // Get active sentence
  const activeSentence = sentences.find(s => s.id === activeSentenceId);
  
  // Extract current pool from active sentence
  const currentPool = activeSentence?.original_pool_str || '';
  
  if (!currentPool) {
    // No pool loaded yet, allow typing
    setScratchPad(newValue);
    return;
  }
  
  // Build available letters map (case-insensitive)
  const availableLetters = {};
  for (const char of currentPool.toLowerCase()) {
    if (/[a-z]/.test(char)) {
      availableLetters[char] = (availableLetters[char] || 0) + 1;
    }
  }
  
  // Check if new value uses only available letters
  const usedLetters = {};
  let isValid = true;
  let invalidChar = null;
  
  for (const char of newValue.toLowerCase()) {
    if (/[a-z]/.test(char)) {
      usedLetters[char] = (usedLetters[char] || 0) + 1;
      
      // Check if we have enough of this letter
      if (usedLetters[char] > (availableLetters[char] || 0)) {
        isValid = false;
        invalidChar = char.toUpperCase();
        break;
      }
    }
  }
  
  if (isValid) {
    setScratchPad(newValue);
    setError(''); // Clear any previous error
  } else {
    // Don't update - show error
    setError(`Cannot use '${invalidChar}' - not enough in pool`);
    
    // Auto-clear error after 2 seconds
    setTimeout(() => {
      setError('');
    }, 2000);
    
    // Optional: Play error sound or visual feedback
    if (scratchPadRef.current) {
      scratchPadRef.current.classList.add('shake');
      setTimeout(() => {
        scratchPadRef.current?.classList.remove('shake');
      }, 500);
    }
  }
};
  const handleScratchPadBlur = async () => {
    if (!currentSession?.session_id || !activeSentenceId) return;

    try {
      await handleUpdateSentence(activeSentenceId, scratchPad);
    } catch (err) {
      setError('Update failed: ' + err.message);
    }
  };
// Wrap refresh handlers in useCallback for stable references
const refreshSuggestions = useCallback(async () => {
  if (!currentSession?.session_id || !activeSentenceId || isLoadingSuggestions) {
    return;
  }

  try {
    setIsLoadingSuggestions(true);
    
    // FIX #4 & #5: Pass updated params including rawMode
    const result = await getMiniMerlinSuggestions(
      currentSession.session_id,
      activeSentenceId,
      minWordLength,
      maxSuggestions,
      rawMode  // FIX #5: Pass raw mode
    );
    setSuggestions(result.suggestions || []);
  } catch (err) {
    console.error('Failed to refresh suggestions:', err);
  } finally {
    setIsLoadingSuggestions(false);
  }
}, [
  currentSession?.session_id,
  activeSentenceId,
  minWordLength,
  maxSuggestions,
  rawMode,  // FIX #5: Include in dependencies
  isLoadingSuggestions,
  getMiniMerlinSuggestions
]);

const refreshSolutions = useCallback(async () => {
  if (!currentSession?.session_id || !activeSentenceId || isLoadingSolutions) {
    return;
  }

  try {
    setIsLoadingSolutions(true);
    const result = await getMiniMerlinSolutions(
      currentSession.session_id,
      activeSentenceId,
      10,
      50,
      10
    );
    setSolutions(result.solutions || []);
  } catch (err) {
    console.error('Failed to refresh solutions:', err);
  } finally {
    setIsLoadingSolutions(false);
  }
}, [
  currentSession?.session_id,
  activeSentenceId,
  isLoadingSolutions,
  getMiniMerlinSolutions
]);
const handleGetSuggestions = useCallback(async () => {
  if (!currentSession?.session_id) {
    setError('No active session');
    return;
  }

  if (!activeSentenceId) {
    setError('No sentence selected. Please select or add a sentence first.');
    return;
  }

  if (isLoadingSuggestions) return;

  try {
    setIsLoadingSuggestions(true);
    setError('');
    
    console.log(`🔍 Getting suggestions: minLength=${minWordLength}, maxResults=${maxSuggestions}, rawMode=${rawMode}`);
    
    // FIX #4 & #5: Pass updated params
    const result = await getMiniMerlinSuggestions(
      currentSession.session_id,
      activeSentenceId,
      minWordLength,
      maxSuggestions,
      rawMode  // FIX #5: Pass raw mode
    );

    setSuggestions(result.suggestions || []);
    setHasFetchedSuggestions(true);
    
    if (result.suggestions?.length > 0) {
      setSuccess(`Found ${result.suggestions.length.toLocaleString()} words for "${result.sentence_name}"`);
    }
    
  } catch (err) {
    setError('Failed to get suggestions: ' + err.message);
  } finally {
    setIsLoadingSuggestions(false);
  }
}, [currentSession?.session_id, activeSentenceId, minWordLength, maxSuggestions, rawMode, getMiniMerlinSuggestions, isLoadingSuggestions]);



const handleGetSolutions = useCallback(async () => {
  if (!currentSession?.session_id) {
    setError('No active session');
    return;
  }

  if (!activeSentenceId) {
    setError('No sentence selected. Please select or add a sentence first.');
    return;
  }

  if (isLoadingSolutions) return;

  try {
    setIsLoadingSolutions(true);
    setError('');
    
    const result = await getMiniMerlinSolutions(
      currentSession.session_id,
      activeSentenceId,
      10,
      50,
      10
    );
    
    setSolutions(result.solutions || []);
    setHasFetchedSolutions(true);
    
    if (result.solutions?.length > 0) {
      setSuccess(
        `Found ${result.solutions.length} solutions for "${result.sentence_name}" ` +
        `(${result.complete_count} complete, ${result.partial_count} partial)`
      );
    } else {
      setError('No solutions found for this sentence');
    }
    
  } catch (err) {
    setError('Failed to get solutions: ' + err.message);
  } finally {
    setIsLoadingSolutions(false);
  }
}, [currentSession?.session_id, activeSentenceId, getMiniMerlinSolutions, isLoadingSolutions]);

// Then replace the useEffect with this simpler version:
useEffect(() => {
  if (!activeSentenceId || !currentSession?.session_id) return;
  if (!hasFetchedSuggestions && !hasFetchedSolutions) return;
  
  // Only refresh if scratch pad actually changed
  if (previousScratchPadRef.current === scratchPad) return;
  
  const debounceTimer = setTimeout(() => {
    if (hasFetchedSuggestions) {
      refreshSuggestions();
    }
    
    if (hasFetchedSolutions) {
      refreshSolutions();
    }
    
    // Update the ref
    previousScratchPadRef.current = scratchPad;
  }, 800);
  
  return () => clearTimeout(debounceTimer);
}, [
  scratchPad, 
  activeSentenceId, 
  currentSession?.session_id,
  hasFetchedSuggestions, 
  hasFetchedSolutions,
  refreshSuggestions,
  refreshSolutions
]);

const handleAddWordToScratchPad = async (word) => {
  const newScratchPad = scratchPad ? `${scratchPad} ${word}` : word;
  setScratchPad(newScratchPad);
  
  if (currentSession?.session_id && activeSentenceId) {
    try {
      await handleUpdateSentence(activeSentenceId, newScratchPad);
      setSuccess(`Added "${word}"`);
      
      // ✅ IMMEDIATE REFRESH: Trigger refresh right after adding word
      // Don't wait for debounce timer since this is a deliberate action
      if (hasFetchedSuggestions) {
        setTimeout(() => refreshSuggestions(), 200);
      }
      
      if (hasFetchedSolutions) {
        setTimeout(() => refreshSolutions(), 200);
      }
      
    } catch (err) {
      setError('Failed to add word: ' + err.message);
    }
  }
};

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      setSuccess('Copied to clipboard');
    } catch (err) {
      setError('Failed to copy: ' + err.message);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset session? This will clear all data.')) {
      setOriginalText('');
      setScratchPad('');
      setSuggestions([]);
      setSolutions([]);
      setNotes([]);
      setError('');
      await clearMiniMerlinSession();
      setActiveView('sessions');
      await loadSessionsList();
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const getSessionStatus = (session) => {
    const sentences = session.sentences || [];
    const totalSentences = sentences.length;
    const solvedSentences = sentences.filter(s => s.solutions && s.solutions.length > 0).length;

    // if (totalSentences === 0) return { status: 'empty', text: 'Empty', color: 'text-gray-400' };
    if (solvedSentences === totalSentences) return { status: 'completed', text: 'Completed', color: 'text-green-400' };
    if (solvedSentences > 0) return { status: 'in_progress', text: 'In Progress', color: 'text-yellow-400' };
    return { status: 'active', text: 'Active', color: 'text-blue-400' };
  };

  const filteredSessions = sessions
    .filter(session => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesText = session.original_text_preview?.toLowerCase().includes(search);
        const matchesSentence = session.sentences?.some(s => 
          s.name?.toLowerCase().includes(search) || 
          s.original_text?.toLowerCase().includes(search)
        );
        if (!matchesText && !matchesSentence) return false;
      }

      if (filterStatus === 'active') {
        return session.sentences?.some(s => !s.solutions || s.solutions.length === 0);
      } else if (filterStatus === 'completed') {
        return session.sentences?.every(s => s.solutions && s.solutions.length > 0);
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at);
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'sentences':
          return (b.sentences?.length || 0) - (a.sentences?.length || 0);
        default:
          return 0;
      }
    });

  const getFilteredSolutions = () => {
    let filtered = [...solutions];

    if (filterMode === 'zero_spoilage') {
      filtered = filtered.filter(s => {
        const spoilage = s.spoilage_pct ?? s.spoilage ?? 0;
        return spoilage === 0;
      });
    } else if (filterMode === 'low_spoilage') {
      filtered = filtered.filter(s => {
        const spoilage = s.spoilage_pct ?? s.spoilage ?? 0;
        return spoilage <= 10;
      });
    }

    if (sortMode === 'spoilage') {
      filtered.sort((a, b) => {
        const spoilageA = a.spoilage_pct ?? a.spoilage ?? 0;
        const spoilageB = b.spoilage_pct ?? b.spoilage ?? 0;
        return spoilageA - spoilageB;
      });
    } else if (sortMode === 'length') {
      filtered.sort((a, b) => {
        const lettersA = a.letters_used ?? 0;
        const lettersB = b.letters_used ?? 0;
        return lettersB - lettersA;
      });
    } else {
      filtered.sort((a, b) => {
        const scoreA = a.total_score ?? 0;
        const scoreB = b.total_score ?? 0;
        return scoreB - scoreA;
      });
    }

    return filtered;
  };

  const filteredSolutions = getFilteredSolutions();
const suggestionsByLength = useMemo(() => {
  if (!suggestions || suggestions.length === 0) return {};
  
  const grouped = suggestions.reduce((acc, sug) => {
    const len = sug.length || sug.word?.length || 0;
    if (!acc[len]) acc[len] = [];
    acc[len].push(sug);
    return acc;
  }, {});
  
  // Sort within each length group alphabetically
  Object.keys(grouped).forEach(len => {
    grouped[len].sort((a, b) => (a.word || '').localeCompare(b.word || ''));
  });
  
  return grouped;
}, [suggestions]);

const sortedLengths = useMemo(() => {
  return Object.keys(suggestionsByLength)
    .map(Number)
    .sort((a, b) => b - a);  // Descending order (longest first)
}, [suggestionsByLength]);
  // Calculate stats for active sentence
  const activeSentence = sentences.find(s => s.id === activeSentenceId);
  const poolSize = activeSentence?.pool_size || 0;
  const usedLetters = scratchPad.replace(/[^a-zA-Z]/g, '').length;
  const availableLetters = poolSize - usedLetters;
  const spoilage = activeSentence?.spoilage || 0;

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ==================== HEADER ==================== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Mini-Merlin</h1>
                <p className="text-purple-300 text-sm">
                  {activeView === 'sessions' 
                    ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''} total`
                    : sentences.length > 0 
                      ? `${sentences.length} sentence${sentences.length !== 1 ? 's' : ''} in session`
                      : 'Elizabethan Anagram Solver'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('sessions')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeView === 'sessions'
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-300 hover:bg-white/10'
                  }`}
                >
                  <Archive className="w-4 h-4 inline mr-2" />
                  Sessions
                </button>
                <button
                  onClick={() => setActiveView('workspace')}
                  disabled={!currentSession}
                  className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeView === 'workspace'
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-300 hover:bg-white/10'
                  }`}
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Workspace
                </button>
              </div>

              {activeView === 'sessions' && (
                <button
                  onClick={handleCreateNewSession}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors flex items-center gap-2 border border-green-500/30"
                >
                  <Plus className="w-4 h-4" />
                  New Session
                </button>
              )}

              {/* ==================== WORKSPACE VIEW ==================== */}
{activeView === 'workspace' && currentSession && (
  <div>
    {/* Workspace Header with AI Toggle */}
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-purple-300">Session:</span>
        <span className="text-white font-semibold">
          {currentSession.session_id.slice(0, 12)}
        </span>
      </div>
      
      {/* AI Assistant Toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-purple-300">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => toggleMiniMerlinAI(e.target.checked)}
            className="w-4 h-4 rounded border-purple-500/30 bg-white/10 text-purple-600 focus:ring-purple-500"
          />
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </label>
      </div>
    </div>

    {/* Workspace Tabs */}
    <div className="mb-4">
      <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setActiveWorkspaceTab('solver')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeWorkspaceTab === 'solver'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:bg-white/10'
          }`}
        >
          <Zap className="w-4 h-4" />
          Solver
        </button>
        
        {aiEnabled && (
          <button
            onClick={() => setActiveWorkspaceTab('ai')}
            className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeWorkspaceTab === 'ai'
                ? 'bg-purple-600 text-white'
                : 'text-purple-300 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Assistant
            {aiChatHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                {aiChatHistory.length}
              </span>
            )}
          </button>
        )}
        
        <button
          onClick={() => setActiveWorkspaceTab('history')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeWorkspaceTab === 'history'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:bg-white/10'
          }`}
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </div>
    </div>

    {/* Tab Content */}
    {activeWorkspaceTab === 'solver' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your existing solver content - left column with sentences, pools, scratch pad */}
        {/* ... existing left column code ... */}
        
        {/* Your existing solver content - right column with suggestions and solutions */}
        {/* ... existing right column code ... */}
      </div>
    )}

    {activeWorkspaceTab === 'ai' && aiEnabled && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Context */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Sentence Context */}
          {activeSentence && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Current Context
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-purple-400 mb-1">Sentence:</div>
                  <div className="text-sm text-white">{activeSentence.name}</div>
                </div>
                
                <div>
                  <div className="text-xs text-purple-400 mb-1">Original Text:</div>
                  <div className="p-2 bg-black/20 rounded text-xs text-purple-200 font-mono break-words">
                    {activeSentence.original_text}
                  </div>
                </div>
                
                {activeSentence.scratch_pad && (
                  <div>
                    <div className="text-xs text-purple-400 mb-1">Current Work:</div>
                    <div className="p-2 bg-black/20 rounded text-xs text-white font-mono break-words">
                      {activeSentence.scratch_pad}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-purple-400">Pool Size</div>
                    <div className="text-sm font-semibold text-white">
                      {activeSentence.pool_size}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-400">Spoilage</div>
                    <div className="text-sm font-semibold text-white">
                      {activeSentence.spoilage?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>
                
                {activeSentence.solutions && activeSentence.solutions.length > 0 && (
                  <div>
                    <div className="text-xs text-purple-400 mb-1">
                      Solutions ({activeSentence.solutions.length}):
                    </div>
                    <div className="space-y-1">
                      {activeSentence.solutions.slice(0, 3).map((sol) => (
                        <div
                          key={sol.id}
                          className="p-2 bg-green-500/10 rounded text-xs text-green-300 font-mono"
                        >
                          {sol.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
            <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Prompts
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setAiMessage("What Elizabethan names or terms could fit these letters?")}
                className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors"
              >
                Suggest historical names
              </button>
              <button
                onClick={() => setAiMessage("Analyze the letter frequency pattern in this text")}
                className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors"
              >
                Analyze letter patterns
              </button>
              <button
                onClick={() => setAiMessage("What's a good next word to try based on remaining letters?")}
                className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors"
              >
                Suggest next word
              </button>
              <button
                onClick={() => setAiMessage("Explain the historical context of this potential solution")}
                className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors"
              >
                Explain historical context
              </button>
              <button
                onClick={() => {
                  clearMiniMerlinAIChat();
                  setSuccess('Chat history cleared');
                }}
                className="w-full text-left px-3 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm text-red-300 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat History
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Assistant
              </h3>
              <div className="text-xs text-purple-400">
                {aiChatHistory.length} messages
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              {aiChatHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                  <p className="text-purple-300 text-lg mb-2">AI Assistant Ready</p>
                  <p className="text-purple-400/70 text-sm">
                    Ask me anything about solving anagrams, Elizabethan history,<br />
                    or strategies for finding patterns in your letters.
                  </p>
                </div>
              ) : (
                aiChatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-purple-100 border border-purple-500/20'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      <div className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-purple-200' : 'text-purple-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isAISending && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-purple-100 border border-purple-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAISending && handleAIChat()}
                placeholder="Ask the AI assistant..."
                disabled={isAISending}
                className="flex-1 px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={handleAIChat}
                disabled={!aiMessage.trim() || isAISending}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center gap-2 font-semibold shadow-lg disabled:opacity-50"
              >
                {isAISending ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeWorkspaceTab === 'history' && (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Session History
        </h3>
        
        {/* Show all solutions across all sentences */}
        <div className="space-y-4">
          {sentences.map((sentence) => (
            sentence.solutions && sentence.solutions.length > 0 && (
              <div key={sentence.id} className="p-4 bg-white/5 rounded-lg border border-purple-500/20">
                <div className="font-semibold text-white mb-2">{sentence.name}</div>
                <div className="space-y-2">
                  {sentence.solutions.map((solution) => (
                    <div
                      key={solution.id}
                      className="p-3 bg-green-500/10 border border-green-500/20 rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono text-white">{solution.text}</div>
                        <div className="text-xs text-green-400 mt-1">
                          {solution.type} • {solution.spoilage?.toFixed(1) || 0}% spoilage
                        </div>
                      </div>
                      <div className="text-xs text-purple-400">
                        {new Date(solution.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          
          {sentences.every(s => !s.solutions || s.solutions.length === 0) && (
            <div className="text-center py-12 text-purple-400/50">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No solutions saved yet</p>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
)}

              {activeView === 'workspace' && (
                <div 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    rawMode 
                      ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                      : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {rawMode ? (
                    <>
                      <Database className="w-3 h-3" />
                      Raw Mode
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Smart Mode
                    </>
                  )}
                </div>
              )}

              {/* Settings Button */}
              {activeView === 'workspace' && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSettings
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-purple-300 hover:bg-white/20'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================== SUCCESS/ERROR MESSAGES ==================== */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <div className="text-green-300">{success}</div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-300">Error</div>
              <div className="text-sm text-red-200">{error}</div>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-300 hover:text-red-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {showSettings && activeView === 'workspace' && (
          <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Solver Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-purple-400 hover:text-purple-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* FIX #5: Raw Mode Toggle */}
              <div className="p-3 bg-white/5 rounded-lg border border-purple-500/20">
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Scoring Mode
                </label>
                <button
                  onClick={handleRawModeToggle}
                  className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${
                    rawMode
                      ? 'bg-green-600/20 border-green-500/30 text-green-300'
                      : 'bg-purple-600/20 border-purple-500/30 text-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {rawMode ? (
                      <>
                        <ToggleRight className="w-5 h-5" />
                        <span>Raw Mode</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5" />
                        <span>Smart Mode</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs opacity-70">
                    {rawMode ? 'Like boulter.com' : 'Statistical bias'}
                  </div>
                </button>
                <p className="text-xs text-purple-400 mt-2">
                  {rawMode 
                    ? 'Results sorted by length then alphabetically - no intelligence vocabulary bias'
                    : 'Results prioritized by Elizabethan intelligence vocabulary scoring'
                  }
                </p>
              </div>

              {/* FIX #2: Min Word Length */}
              <div className="p-3 bg-white/5 rounded-lg border border-purple-500/20">
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Min Word Length
                </label>
                <select
                  value={minWordLength}
                  onChange={(e) => setMinWordLength(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={2}>2 letters (includes short words)</option>
                  <option value={3}>3 letters</option>
                  <option value={4}>4 letters (recommended)</option>
                  <option value={5}>5 letters</option>
                  <option value={6}>6 letters</option>
                </select>
                <p className="text-xs text-purple-400 mt-2">
                  Filters out garbage words shorter than this
                </p>
              </div>

              {/* FIX #4: Max Results */}
              <div className="p-3 bg-white/5 rounded-lg border border-purple-500/20">
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Max Results
                </label>
                <select
                  value={maxSuggestions}
                  onChange={(e) => setMaxSuggestions(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={100}>100 (fast)</option>
                  <option value={500}>500</option>
                  <option value={1000}>1,000</option>
                  <option value={2000}>2,000</option>
                  <option value={5000}>5,000 (recommended)</option>
                  <option value={10000}>10,000 (comprehensive)</option>
                </select>
                <p className="text-xs text-purple-400 mt-2">
                  More results = more comprehensive coverage
                </p>
              </div>

              {/* Display Mode */}
              <div className="p-3 bg-white/5 rounded-lg border border-purple-500/20">
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Display Mode
                </label>
                <select
                  value={suggestionDisplayMode}
                  onChange={(e) => setSuggestionDisplayMode(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="grouped">Grouped by Length (boulter-style)</option>
                  <option value="flat">Flat Grid</option>
                </select>
                <p className="text-xs text-purple-400 mt-2">
                  How to display word suggestions
                </p>
              </div>
            </div>
          </div>
        )}


        {/* ==================== SESSIONS VIEW ==================== */}
        {activeView === 'sessions' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search sessions..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Sessions</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="name">Name</option>
                <option value="sentences">Most Sentences</option>
              </select>
            </div>

            {/* Sessions Grid */}
            {loadingSessions ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <p className="text-purple-300 mt-4">Loading sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                <p className="text-purple-300 text-lg mb-4">
                  {searchTerm ? 'No sessions found' : 'No sessions yet'}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={handleCreateNewSession}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Session
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => {
                  const status = getSessionStatus(session);
                  const sentences = session.sentences || [];
                  const totalSentences = sentences.length;
                  const solvedSentences = sentences.filter(s => s.solutions && s.solutions.length > 0).length;

                  return (
                    <div
                      key={session.session_id}
                      className="bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all p-4"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white truncate">
                            Session {session.session_id.slice(0, 8)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${status.color}`}>
                              {status.text}
                            </span>
                            {totalSentences > 0 && (
                              <span className="text-xs text-purple-400">
                                {solvedSentences}/{totalSentences} solved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      {session.original_text_preview && (
                        <div className="mb-3 p-2 bg-black/20 rounded text-xs text-purple-200 font-mono truncate">
                          {session.original_text_preview}
                        </div>
                      )}

                      {/* Stats
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-xs">
                          <div className="text-purple-400">Sentences</div>
                          <div className="text-white font-semibold">{totalSentences}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-purple-400">Notes</div>
                          <div className="text-white font-semibold">{session.notes_count || 0}</div>
                        </div>
                      </div> */}

                      {/* Dates */}
                      <div className="text-xs text-purple-400 mb-3 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {new Date(session.created_at).toLocaleDateString()}
                        </div>
                        {session.updated_at && (<div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated: {new Date(session.updated_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadSession(session.session_id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all text-sm flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Open
                        </button>
                        <button
                          onClick={() => handleViewSessionDetails(session.session_id)}
                          className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportSession(session.session_id, 'csv')}
                          className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.session_id)}
                          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== WORKSPACE VIEW ==================== */}
        {activeView === 'workspace' && currentSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ==================== LEFT COLUMN ==================== */}
            <div className="lg:col-span-1 space-y-4">
              {/* Sentence Tabs */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Sentences ({sentences.length})
                  </label>
                  <button
                    onClick={() => setShowAddSentence(true)}
                    className="p-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded transition-colors"
                    title="Add Sentence"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Sentence List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sentences.length === 0 ? (
                    <div className="text-center py-4 text-purple-400/50 text-sm">
                      No sentences yet. Click + to add one.
                    </div>
                  ) : (
                    sentences.map((sentence) => {
                      const isActive = sentence.id === activeSentenceId;
                      const hasSolution = sentence.solutions && sentence.solutions.length > 0;
                      
                      return (
                        <div
                          key={sentence.id}
                          className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                            isActive
                              ? 'bg-purple-600/20 border-purple-500/50'
                              : 'bg-white/5 border-purple-500/20 hover:border-purple-500/30'
                          }`}
                          onClick={() => setActiveSentenceId(sentence.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-white text-sm truncate">
                                  {sentence.name}
                                </div>
                                {hasSolution && (
                                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-purple-400 mt-1">
                                {sentence.pool_size} letters • {sentence.spoilage?.toFixed(1) || 0}% spoilage
                              </div>
                              {hasSolution && (
                                <div className="text-xs text-green-400 mt-1">
                                  {sentence.solutions.length} solution{sentence.solutions.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSentence(sentence.id);
                                }}
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Preview */}
                          <div className="mt-2 p-2 bg-black/20 rounded text-xs text-purple-200 font-mono truncate">
                            {sentence.original_text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Session Info Bar */}
              {activeSentenceId && poolSize > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20">
                    <div className="text-xs text-purple-400 mb-1">Total Letters</div>
                    <div className="text-lg font-bold text-white">{poolSize}</div>
                  </div>

                  <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20">
                    <div className="text-xs text-green-400 mb-1">Available</div>
                    <div className="text-lg font-bold text-white">{availableLetters}</div>
                  </div>

                  <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20">
                    <div className="text-xs text-blue-400 mb-1">Used</div>
                    <div className="text-lg font-bold text-white">{usedLetters}</div>
                  </div>

                  <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20">
                    <div className="text-xs text-yellow-400 mb-1">Spoilage</div>
                    <div className="text-lg font-bold text-white">{spoilage.toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {/* Original Text (Read-only) */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                <label className="block text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original Text {activeSentenceId && '(Selected Sentence)'}
                </label>
                <textarea
                  value={originalText}
                  readOnly
                  placeholder={activeSentenceId ? "No text loaded" : "Select a sentence to view its text"}
                  className="w-full h-32 px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none resize-none font-mono text-sm opacity-75"
                />
                {!activeSentenceId && (
                  <button
                    onClick={() => setShowAddSentence(true)}
                    className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Sentence
                  </button>
                )}
              </div>

              {/* Letter Pools */}
              {activeSentence && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                  <label className="block text-sm font-semibold text-purple-300 mb-2">
                    Original Pool
                  </label>
                  <div className="p-3 bg-black/30 rounded-lg border border-purple-500/20 font-mono text-xs text-purple-200 break-all min-h-[60px]">
                    {activeSentence.original_pool_str || 'No pool loaded'}
                  </div>

                  <label className="block text-sm font-semibold text-purple-300 mb-2 mt-4">
                    Current Pool (Remaining)
                  </label>
                  <div className="p-3 bg-black/30 rounded-lg border border-green-500/20 font-mono text-xs text-green-300 break-all min-h-[60px]">
                    {(() => {
                      const originalPool = activeSentence.original_pool_str || '';
                      
                      if (!originalPool) return 'No pool loaded';
                      
                      const poolCounts = {};
                      for (const char of originalPool.toUpperCase()) {
                        if (/[A-Z]/.test(char)) {
                          poolCounts[char] = (poolCounts[char] || 0) + 1;
                        }
                      }
                      
                      for (const char of scratchPad.toUpperCase()) {
                        if (/[A-Z]/.test(char) && poolCounts[char] > 0) {
                          poolCounts[char]--;
                        }
                      }
                      
                      let remainingPool = '';
                      const sortedLetters = Object.keys(poolCounts).sort();
                      
                      for (const letter of sortedLetters) {
                        const count = poolCounts[letter];
                        if (count > 0) {
                          remainingPool += letter.repeat(count);
                        }
                      }
                      
                      return remainingPool || '(All letters used)';
                    })()}
                  </div>
                </div>
              )}

             {/* Scratch Pad Section - around line 800-900 */}
<div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
  <label className="block text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
    <Zap className="w-4 h-4" />
    Scratch Pad
  </label>
  
  {/* Available Letters Helper - Real-time */}
  {activeSentence && activeSentence.original_pool_str && (
    <div className="mb-3 p-3 bg-black/20 rounded-lg border border-purple-500/20">
      <div className="text-xs text-purple-400 mb-2 flex items-center gap-2">
        <Info className="w-3 h-3" />
        Available Letters (click to add) - Updates in real-time
      </div>
      <div className="flex flex-wrap gap-1">
        {(() => {
          // Calculate from ORIGINAL pool
          const originalPool = activeSentence.original_pool_str || '';
          
          // Build letter counts from original pool
          const poolCounts = {};
          for (const char of originalPool.toLowerCase()) {
            if (/[a-z]/.test(char)) {
              poolCounts[char] = (poolCounts[char] || 0) + 1;
            }
          }
          
          // Count letters used in scratch pad
          const usedCounts = {};
          for (const char of scratchPad.toLowerCase()) {
            if (/[a-z]/.test(char)) {
              usedCounts[char] = (usedCounts[char] || 0) + 1;
            }
          }
          
          // Calculate remaining for each letter
          const remainingCounts = {};
          for (const [letter, total] of Object.entries(poolCounts)) {
            const used = usedCounts[letter] || 0;
            const remaining = total - used;
            remainingCounts[letter] = { remaining, total, used };
          }
          
          // Sort alphabetically
          const sortedLetters = Object.entries(remainingCounts)
            .sort((a, b) => a[0].localeCompare(b[0]));
          
          return sortedLetters.map(([letter, counts]) => {
            const { remaining, total, used } = counts;
            
            return (
              <button
                key={letter}
                onClick={() => {
                  if (remaining <= 0) return;
                  
                  const newScratchPad = scratchPad + letter;
                  setScratchPad(newScratchPad);
                  
                  // Trigger backend update
                  if (currentSession?.session_id && activeSentenceId) {
                    handleUpdateSentence(activeSentenceId, newScratchPad);
                  }
                }}
                disabled={remaining === 0}
                className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                  remaining === 0
                    ? 'bg-gray-600/20 text-gray-500 border-gray-500/20 line-through cursor-not-allowed opacity-50'
                    : remaining === total
                    ? 'bg-green-600/20 hover:bg-green-600/40 text-green-200 border-green-500/30 hover:scale-110'
                    : remaining > total / 2
                    ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 border-blue-500/30 hover:scale-110'
                    : 'bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-200 border-yellow-500/30 hover:scale-110'
                }`}
                title={remaining === 0 ? 'No more available' : `Click to add. ${remaining} of ${total} remaining`}
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">{letter.toUpperCase()}</span>
                  <span className="text-[10px] opacity-70">
                    {remaining}/{total}
                  </span>
                </div>
              </button>
            );
          });
        })()}
      </div>
      
      {/* Usage Summary Bar */}
      <div className="mt-3 pt-3 border-t border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-400">Letter Usage</span>
          <span className="text-xs text-purple-300">
            {usedLetters} / {poolSize} letters
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              spoilage === 0
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : spoilage <= 10
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                : spoilage <= 25
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ width: `${poolSize > 0 ? (usedLetters / poolSize) * 100 : 0}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className={`font-semibold ${
            spoilage === 0
              ? 'text-green-400'
              : spoilage <= 10
              ? 'text-blue-400'
              : spoilage <= 25
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {spoilage.toFixed(1)}% spoilage
          </span>
          
          <span className="text-purple-400">
            {availableLetters} remaining
          </span>
        </div>
      </div>
    </div>
  )}
  
  {/* Scratch Pad Textarea */}
  <textarea
    ref={scratchPadRef}
    value={scratchPad}
    onChange={handleScratchPadChange}
    onBlur={handleScratchPadBlur}
    placeholder={activeSentenceId ? "Type your anagram here..." : "Select a sentence first"}
    disabled={!activeSentenceId}
    className="w-full h-32 px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-base disabled:opacity-50"
  />
  <div className="mt-2 text-xs text-purple-400">
    Letters used: {usedLetters} / {poolSize}
  </div>

  {/* Save Solution Button */}
  {activeSentenceId && scratchPad.trim() && (
    <button
      onClick={() => handleSaveSolution(scratchPad, 'manual')}
      className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      <Save className="w-4 h-4" />
      Save as Solution
    </button>
  )}
</div>

              {/* Action Buttons */}
<div className="grid grid-cols-2 gap-3">
  <button
    onClick={handleGetSuggestions}
    disabled={isLoadingSuggestions || !currentSession || !activeSentenceId}
    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-50"
    title={!activeSentenceId ? "Select a sentence first" : "Get word suggestions"}
  >
    {isLoadingSuggestions ? (
      <RefreshCw className="w-4 h-4 animate-spin" />
    ) : (
      <List className="w-4 h-4" />
    )}
    Word List
  </button>

  <button
    onClick={handleGetSolutions}
    disabled={isLoadingSolutions || !currentSession || !activeSentenceId}
    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-50"
    title={!activeSentenceId ? "Select a sentence first" : "Find multi-word solutions"}
  >
    {isLoadingSolutions ? (
      <>
        <RefreshCw className="w-4 h-4 animate-spin" />
        Searching...
      </>
    ) : (
      <>
        <Sparkles className="w-4 h-4" />
        Solutions
      </>
    )}
  </button>
</div>

              {/* Notes */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                <label className="block text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Session Notes
                </label>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add a note..."
                    disabled={!currentSession}
                    className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || !currentSession}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notes.length === 0 ? (
                    <div className="text-sm text-purple-400/50 italic text-center py-4">
                      No notes yet
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-white/5 rounded-lg border border-purple-500/20 flex items-start justify-between gap-2 group"
                      >
                        <div className="flex-1 text-sm text-purple-200 break-words">
                          {note.text}
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ==================== RIGHT COLUMN - RESULTS ==================== */}
            <div className="lg:col-span-2 space-y-4">
              {/* Word Suggestions */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-purple-400" />
                    Word Suggestions
                    {suggestions.length > 0 && (
                      <span className="text-sm text-purple-400">({suggestions.length.toLocaleString()})</span>
                    )}
                  </h3>
                  
                  {/* FIX #5: Mode indicator */}
                  {suggestions.length > 0 && (
                    <div className={`text-xs px-2 py-1 rounded ${
                      rawMode 
                        ? 'bg-green-600/20 text-green-300' 
                        : 'bg-purple-600/20 text-purple-300'
                    }`}>
                      {rawMode ? 'Sorted by length' : 'Scored by relevance'}
                    </div>
                  )}
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-12 text-purple-400/50">
                      <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Click "Word List" to get suggestions</p>
                      <p className="text-xs mt-2">
                        Settings: min {minWordLength} letters, max {maxSuggestions.toLocaleString()} results
                      </p>
                    </div>
                  ) : suggestionDisplayMode === 'grouped' ? (
                    /* FIX #4: Grouped by length display (like boulter.com) */
                    <div className="space-y-4">
                      {sortedLengths.map(length => (
                        <div key={length} className="border-b border-purple-500/20 pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2 sticky top-0 bg-white/5 py-1 px-2 rounded">
                            <h4 className="text-sm font-semibold text-purple-300">
                              {length} letters
                            </h4>
                            <span className="text-xs text-purple-400">
                              {suggestionsByLength[length].length} words
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {suggestionsByLength[length].map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAddWordToScratchPad(suggestion.word)}
                                className={`px-2 py-1 text-sm font-mono rounded border transition-all hover:scale-105 ${
                                  suggestion.in_corpus
                                    ? 'bg-green-600/20 border-green-500/30 text-green-200 hover:bg-green-600/30'
                                    : 'bg-white/5 border-purple-500/20 text-white hover:bg-white/10'
                                }`}
                                title={`${suggestion.word} (${suggestion.length}L)${suggestion.in_corpus ? ' - In corpus' : ''}`}
                              >
                                {suggestion.word}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Flat grid display */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddWordToScratchPad(suggestion.word)}
                          className="p-3 bg-white/5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 hover:bg-white/10 transition-all group text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-white font-semibold truncate group-hover:text-purple-300">
                                {suggestion.word}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-purple-400">
                                  {suggestion.length}L
                                </span>
                                {suggestion.in_corpus && (
                                  <span className="text-green-400">★</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(suggestion.word, `word-${index}`);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              {copiedIndex === `word-${index}` ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-purple-400" />
                              )}
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Word Solutions */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Multi-Word Solutions
                    {filteredSolutions.length > 0 && (
                      <span className="text-sm text-purple-400">
                        ({filteredSolutions.length})
                      </span>
                    )}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={filterMode}
                      onChange={(e) => setFilterMode(e.target.value)}
                      className="px-3 py-1.5 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Solutions</option>
                      <option value="zero_spoilage">0% Spoilage</option>
                      <option value="low_spoilage">≤10% Spoilage</option>
                    </select>

                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value)}
                      className="px-3 py-1.5 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="score">Best Score</option>
                      <option value="spoilage">Least Spoilage</option>
                      <option value="length">Most Letters</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto space-y-3">
                  {filteredSolutions.length === 0 ? (
                    <div className="text-center py-12 text-purple-400/50">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Click "Solutions" to find multi-word combinations</p>
                    </div>
                  ) : (
                    filteredSolutions.map((solution, index) => {
                      const isExpanded = expandedSolution === index;
                      
                      const spoilage = solution.spoilage_pct ?? solution.spoilage ?? 0;
                      const totalScore = solution.total_score ?? 0;
                      const wordsArray = solution.words || [];
                      const lettersUsed = solution.letters_used ?? 0;
                      const avgFreqScore = solution.avg_freq_score ?? 0;
                      
                      const spoilageColor = 
                        spoilage === 0 ? 'text-green-400' :
                        spoilage <= 10 ? 'text-yellow-400' :
                        'text-red-400';

                      return (
                        <div
                          key={index}
                          className="p-4 bg-white/5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm flex-shrink-0">
                                {index + 1}
                              </span>
                              
                              <div className="flex-1">
                                <div className="font-mono text-white font-semibold text-lg break-words">
                                  {solution.text || wordsArray.join(' ')}
                                </div>
                                
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  <span className="text-sm text-purple-300">
                                    {wordsArray.length} words
                                  </span>
                                  <span className="text-sm text-blue-300">
                                    {lettersUsed} letters
                                  </span>
                                  <span className={`text-sm font-semibold ${spoilageColor}`}>
                                    {spoilage.toFixed(1)}% spoilage
                                  </span>
                                  <span className="text-sm text-green-300">
                                    Score: {totalScore}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopy(solution.text || wordsArray.join(' '), `solution-${index}`)}
                                className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors"
                              >
                                {copiedIndex === `solution-${index}` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              
                              <button
                                onClick={() => setExpandedSolution(expandedSolution === index ? null : index)}
                                className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-purple-500/20">
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <div className="text-xs text-purple-400 mb-1">Total Score</div>
                                  <div className="text-sm font-semibold text-white">
                                    {totalScore}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-purple-400 mb-1">Average Frequency</div>
                                  <div className="text-sm font-semibold text-white">
                                    {avgFreqScore.toFixed(1)}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-purple-400 mb-1">Letters Used</div>
                                  <div className="text-sm font-semibold text-white">
                                    {lettersUsed} / {poolSize}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-purple-400 mb-1">Spoilage</div>
                                  <div className={`text-sm font-semibold ${spoilageColor}`}>
                                    {spoilage.toFixed(1)}%
                                  </div>
                                </div>
                              </div>

                              {/* Individual Words */}
                              <div>
                                <div className="text-xs text-purple-400 mb-2">Individual Words:</div>
                                <div className="flex flex-wrap gap-2">
                                  {wordsArray.map((word, wordIdx) => (
                                    <div
                                      key={wordIdx}
                                      className="px-3 py-1.5 bg-white/5 rounded-lg border border-purple-500/20"
                                    >
                                      <div className="text-sm text-white font-mono">{word}</div>
                                      <div className="text-xs text-purple-400 mt-0.5">
                                        {word.length}L
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => {
                                    const solutionText = solution.text || wordsArray.join(' ');
                                    setScratchPad(solutionText);
                                    if (activeSentenceId) {
                                      handleUpdateSentence(activeSentenceId, solutionText);
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                  <Zap className="w-4 h-4" />
                                  Copy to Scratch Pad
                                </button>
                                <button
                                  onClick={() => handleSaveSolution(solution.text || wordsArray.join(' '), 'multi_word')}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  Save
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ADD SENTENCE MODAL ==================== */}
        {showAddSentence && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-xl border border-purple-500/30 max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add New Sentence</h3>
                <button
                  onClick={() => {
                    setShowAddSentence(false);
                    setNewSentenceText('');
                    setNewSentenceName('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newSentenceName}
                    onChange={(e) => setNewSentenceName(e.target.value)}
                    placeholder="e.g., Title Page, Dedication, Act 1 Scene 1, etc."
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Text to Analyze *
                  </label>
                  <textarea
                    value={newSentenceText}
                    onChange={(e) => setNewSentenceText(e.target.value)}
                    placeholder="Paste the text segment you want to solve as an anagram..."
                    className="w-full h-32 px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                  />
                  <div className="mt-1 text-xs text-purple-400">
                    {newSentenceText.replace(/[^a-zA-Z]/g, '').length} letters
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddSentence}
                    disabled={!newSentenceText.trim() || isLoadingText}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {isLoadingText ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add Sentence
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSentence(false);
                      setNewSentenceText('');
                      setNewSentenceName('');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SESSION DETAILS MODAL ==================== */}
        {showSessionDetails && selectedSessionForDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Session Details
                    </h2>
                    <p className="text-purple-300 text-sm mt-1">
                      {selectedSessionForDetails.sentences?.length || 0} sentence{selectedSessionForDetails.sentences?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSessionDetails(false);
                      setSelectedSessionForDetails(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Session Info */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Session Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-purple-400">Session ID</div>
                      <div className="text-white font-mono text-xs">{selectedSessionForDetails.session_id}</div>
                    </div>
                    <div>
                      <div className="text-purple-400">Created</div>
                      <div className="text-white">{new Date(selectedSessionForDetails.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-purple-400">Last Updated</div>
                      <div className="text-white">{new Date(selectedSessionForDetails.updated_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-purple-400">Total Notes</div>
                      <div className="text-white">{selectedSessionForDetails.notes?.length || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Sentences */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Sentences</h3>
                  {selectedSessionForDetails.sentences?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSessionForDetails.sentences.map((sentence) => (
                        <div
                          key={sentence.id}
                          className="p-4 bg-white/5 rounded-lg border border-purple-500/20"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{sentence.name}</h4>
                              <div className="text-xs text-purple-400 mt-1">
                                {sentence.pool_size} letters • {sentence.spoilage?.toFixed(1) || 0}% spoilage
                              </div>
                            </div>
                            {sentence.solutions && sentence.solutions.length > 0 && (
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">{sentence.solutions.length} solution{sentence.solutions.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* Original Text */}
                          <div className="mb-2">
                            <div className="text-xs text-purple-400 mb-1">Original Text:</div>
                            <div className="p-2 bg-black/20 rounded text-sm text-purple-200 font-mono">
                              {sentence.original_text}
                            </div>
                          </div>

                          {/* Scratch Pad */}
                          {sentence.scratch_pad && (
                            <div className="mb-2">
                              <div className="text-xs text-purple-400 mb-1">Scratch Pad:</div>
                              <div className="p-2 bg-black/20 rounded text-sm text-white font-mono">
                                {sentence.scratch_pad}
                              </div>
                            </div>
                          )}

                          {/* Solutions */}
                          {sentence.solutions && sentence.solutions.length > 0 && (
                            <div>
                              <div className="text-xs text-purple-400 mb-1">Solutions:</div>
                              <div className="space-y-2">
                                {sentence.solutions.map((solution) => (
                                  <div
                                    key={solution.id}
                                    className="p-2 bg-green-500/10 border border-green-500/20 rounded"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 font-mono text-sm text-white">
                                        {solution.text}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                                          {solution.type}
                                        </span>
                                        <span className="text-green-400">
                                          {solution.spoilage?.toFixed(1) || 0}% spoilage
                                        </span>
                                      </div>
                                    </div>
                                    {solution.metadata && (
                                      <div className="mt-1 text-xs text-green-400">
                                        Saved: {new Date(solution.created_at).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sentence Notes */}
                          {sentence.notes && sentence.notes.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-purple-400 mb-1">Notes:</div>
                              <div className="space-y-1">
                                {sentence.notes.map((note) => (
                                  <div
                                    key={note.id}
                                    className="text-xs text-purple-200 p-2 bg-black/20 rounded"
                                  >
                                    {note.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-purple-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No sentences in this session</p>
                    </div>
                  )}
                </div>

                {/* Global Session Notes */}
                {selectedSessionForDetails.notes && selectedSessionForDetails.notes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Session Notes</h3>
                    <div className="space-y-2">
                      {selectedSessionForDetails.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-white/5 rounded-lg text-sm text-purple-200"
                        >
                          {note.text}
                          <div className="text-xs text-purple-400 mt-1">
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-purple-500/20 flex gap-3">
                <button
                  onClick={() => handleLoadSession(selectedSessionForDetails.session_id)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open Session
                </button>
                <button
                  onClick={() => handleExportSession(selectedSessionForDetails.session_id, 'csv')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportSession(selectedSessionForDetails.session_id, 'json')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this session?')) {
                      handleDeleteSession(selectedSessionForDetails.session_id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniMerlin;