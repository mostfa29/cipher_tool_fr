// context/AppContext.jsx

import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react';
import { INITIAL_STATE } from './initialState';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import mockAPI from '../api/mockApi';

export const AppContext = createContext();

// ==================== ACTION TYPES ====================
export const ACTIONS = {
  // Workspace
  SET_CURRENT_SOURCE: 'SET_CURRENT_SOURCE',
  SET_ACTIVE_SOURCE: 'SET_ACTIVE_SOURCE',
  SET_SEGMENTS: 'SET_SEGMENTS',
  SET_BOUNDARIES: 'SET_BOUNDARIES',
  SET_SEGMENTATION_MODE: 'SET_SEGMENTATION_MODE',
  SET_CUSTOM_SEGMENT_SIZE: 'SET_CUSTOM_SEGMENT_SIZE',
  TOGGLE_COMPARISON_MODE: 'TOGGLE_COMPARISON_MODE',
  ADD_COMPARISON_SOURCE: 'ADD_COMPARISON_SOURCE',
  CLEAR_WORKSPACE: 'CLEAR_WORKSPACE',
  
  // Advanced Segmentation Operations
  SPLIT_SEGMENT: 'SPLIT_SEGMENT',
  MERGE_SEGMENTS: 'MERGE_SEGMENTS',
  DELETE_SEGMENT: 'DELETE_SEGMENT',
  TOGGLE_BOUNDARY: 'TOGGLE_BOUNDARY',
  SET_SELECTED_SEGMENT: 'SET_SELECTED_SEGMENT',
  SET_HOVERED_LINE: 'SET_HOVERED_LINE',
  
  // Segmentation History
  UNDO_SEGMENTATION: 'UNDO_SEGMENTATION',
  REDO_SEGMENTATION: 'REDO_SEGMENTATION',
  SAVE_SEGMENTATION_STATE: 'SAVE_SEGMENTATION_STATE',

  // Analyze
  SET_SELECTED_METHODS: 'SET_SELECTED_METHODS',
  TOGGLE_METHOD: 'TOGGLE_METHOD',
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  UPDATE_FILTERS: 'UPDATE_FILTERS',
  UPDATE_ANALYZE_FILTERS: 'UPDATE_ANALYZE_FILTERS',
  SET_CURRENT_JOB: 'SET_CURRENT_JOB',
  UPDATE_JOB_PROGRESS: 'UPDATE_JOB_PROGRESS',
  START_ANALYSIS: 'START_ANALYSIS',
  PAUSE_ANALYSIS: 'PAUSE_ANALYSIS',
  RESUME_ANALYSIS: 'RESUME_ANALYSIS',
  CANCEL_ANALYSIS: 'CANCEL_ANALYSIS',

  // Results
  SET_RESULTS: 'SET_RESULTS',
  ADD_RESULTS: 'ADD_RESULTS',
  SET_SORT: 'SET_SORT',
  UPDATE_RESULT_FILTERS: 'UPDATE_RESULT_FILTERS',
  TOGGLE_PATTERN_SELECTION: 'TOGGLE_PATTERN_SELECTION',
  SELECT_ALL_PATTERNS: 'SELECT_ALL_PATTERNS',
  CLEAR_PATTERN_SELECTION: 'CLEAR_PATTERN_SELECTION',
  TOGGLE_PATTERN_EXPAND: 'TOGGLE_PATTERN_EXPAND',
  VIEW_PATTERN_DETAILS: 'VIEW_PATTERN_DETAILS',
  CLEAR_RESULTS: 'CLEAR_RESULTS',
  EXPORT_RESULTS: 'EXPORT_RESULTS',

  // Library
  SET_AVAILABLE_SOURCES: 'SET_AVAILABLE_SOURCES',
  SET_SAVED_SESSIONS: 'SET_SAVED_SESSIONS',
  ADD_SAVED_SESSION: 'ADD_SAVED_SESSION',
  DELETE_SESSION: 'DELETE_SESSION',
  SET_LIBRARY_SEARCH: 'SET_LIBRARY_SEARCH',
  SET_CATEGORY_FILTER: 'SET_CATEGORY_FILTER',
  SET_LIBRARY_TAB: 'SET_LIBRARY_TAB',
  LOAD_SESSION: 'LOAD_SESSION',
  EXPORT_SESSION: 'EXPORT_SESSION',
  EDIT_SOURCE: 'EDIT_SOURCE',
  DELETE_SOURCE: 'DELETE_SOURCE',

  // UI
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_UNSAVED_CHANGES: 'SET_UNSAVED_CHANGES',
  TOGGLE_MODAL: 'TOGGLE_MODAL',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
  
  // UI Settings for Segmentation
  UPDATE_UI_SETTINGS: 'UPDATE_UI_SETTINGS',
  SET_HIGHLIGHT_MODE: 'SET_HIGHLIGHT_MODE',
  SET_FONT_SIZE: 'SET_FONT_SIZE',
  TOGGLE_LINE_NUMBERS: 'TOGGLE_LINE_NUMBERS',
  TOGGLE_COMPACT_MODE: 'TOGGLE_COMPACT_MODE',

  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Entity Dictionary
  SET_ENTITY_DICTIONARY: 'SET_ENTITY_DICTIONARY',

  // Bulk operations
  RESTORE_SESSION: 'RESTORE_SESSION',
  RESET_STATE: 'RESET_STATE',
};

// ==================== REDUCER ====================
function appReducer(state, action) {
  switch (action.type) {
    // -------------------- WORKSPACE --------------------
    case ACTIONS.SET_ACTIVE_SOURCE:
    case ACTIONS.SET_CURRENT_SOURCE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          activeSource: action.payload,
          currentSource: action.payload,
          segments: [],
          boundaries: action.payload?.text ? [0, action.payload.text.split('\n').length] : [],
          segmentationHistory: [],
          segmentationHistoryIndex: -1,
          selectedSegmentId: null,
          hoveredLineIndex: null,
        },
        ui: { ...state.ui, hasUnsavedChanges: false },
      };

case ACTIONS.SET_SEGMENTS:
  return {
    ...state,
    workspace: {
      ...state.workspace,
      segments: action.payload,
    },
    ui: { ...state.ui, hasUnsavedChanges: true },
  };

    case ACTIONS.SET_BOUNDARIES:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          boundaries: action.payload,
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case ACTIONS.SET_SEGMENTATION_MODE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          segmentationMode: action.payload.mode || action.payload,
          customSegmentSize: action.payload.customSize || state.workspace.customSegmentSize,
        },
      };

    case ACTIONS.SET_CUSTOM_SEGMENT_SIZE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          customSegmentSize: action.payload,
        },
      };

    // Advanced Segmentation Operations
    case ACTIONS.TOGGLE_BOUNDARY: {
      const lineIndex = action.payload;
      const boundaries = state.workspace.boundaries;
      const idx = boundaries.indexOf(lineIndex);
      let newBoundaries;
      
      if (idx > 0 && idx < boundaries.length - 1) {
        // Remove boundary
        newBoundaries = boundaries.filter((_, i) => i !== idx);
      } else if (idx === -1) {
        // Add boundary
        newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
      } else {
        return state; // Can't remove first or last boundary
      }
      
      return {
        ...state,
        workspace: {
          ...state.workspace,
          boundaries: newBoundaries,
          segmentationHistory: [
            ...state.workspace.segmentationHistory.slice(0, state.workspace.segmentationHistoryIndex + 1),
            boundaries
          ],
          segmentationHistoryIndex: state.workspace.segmentationHistoryIndex + 1,
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };
    }

    case ACTIONS.SPLIT_SEGMENT: {
      const { segmentId, lineIndex } = action.payload;
      const newBoundaries = [...state.workspace.boundaries, lineIndex].sort((a, b) => a - b);
      
      return {
        ...state,
        workspace: {
          ...state.workspace,
          boundaries: newBoundaries,
          segmentationHistory: [
            ...state.workspace.segmentationHistory.slice(0, state.workspace.segmentationHistoryIndex + 1),
            state.workspace.boundaries
          ],
          segmentationHistoryIndex: state.workspace.segmentationHistoryIndex + 1,
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };
    }

    case ACTIONS.MERGE_SEGMENTS: {
      const { segmentId, boundaryIndex } = action.payload;
      const newBoundaries = state.workspace.boundaries.filter((_, i) => i !== boundaryIndex);
      
      return {
        ...state,
        workspace: {
          ...state.workspace,
          boundaries: newBoundaries,
          segmentationHistory: [
            ...state.workspace.segmentationHistory.slice(0, state.workspace.segmentationHistoryIndex + 1),
            state.workspace.boundaries
          ],
          segmentationHistoryIndex: state.workspace.segmentationHistoryIndex + 1,
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };
    }

    case ACTIONS.DELETE_SEGMENT: {
      const segmentId = action.payload;
      // Find and remove the boundary that ends this segment
      // This would need segment calculation logic
      return {
        ...state,
        workspace: {
          ...state.workspace,
          selectedSegmentId: null,
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };
    }

    case ACTIONS.SET_SELECTED_SEGMENT:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          selectedSegmentId: action.payload,
        },
      };

    case ACTIONS.SET_HOVERED_LINE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          hoveredLineIndex: action.payload,
        },
      };

    // Segmentation History
    case ACTIONS.UNDO_SEGMENTATION: {
      const { segmentationHistory, segmentationHistoryIndex } = state.workspace;
      
      if (segmentationHistoryIndex > 0) {
        return {
          ...state,
          workspace: {
            ...state.workspace,
            boundaries: segmentationHistory[segmentationHistoryIndex - 1],
            segmentationHistoryIndex: segmentationHistoryIndex - 1,
          },
        };
      }
      return state;
    }

    case ACTIONS.REDO_SEGMENTATION: {
      const { segmentationHistory, segmentationHistoryIndex } = state.workspace;
      
      if (segmentationHistoryIndex < segmentationHistory.length - 1) {
        return {
          ...state,
          workspace: {
            ...state.workspace,
            boundaries: segmentationHistory[segmentationHistoryIndex + 1],
            segmentationHistoryIndex: segmentationHistoryIndex + 1,
          },
        };
      }
      return state;
    }

    case ACTIONS.SAVE_SEGMENTATION_STATE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          segmentationHistory: [
            ...state.workspace.segmentationHistory.slice(0, state.workspace.segmentationHistoryIndex + 1),
            state.workspace.boundaries
          ],
          segmentationHistoryIndex: state.workspace.segmentationHistoryIndex + 1,
        },
      };

    case ACTIONS.TOGGLE_COMPARISON_MODE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          comparisonMode: !state.workspace.comparisonMode,
          comparisonSources: !state.workspace.comparisonMode ? [] : state.workspace.comparisonSources,
        },
      };

    case ACTIONS.ADD_COMPARISON_SOURCE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          comparisonSources: [...state.workspace.comparisonSources, action.payload],
        },
      };

    case ACTIONS.CLEAR_WORKSPACE:
      return {
        ...state,
        workspace: INITIAL_STATE.workspace,
        ui: { ...state.ui, hasUnsavedChanges: false },
      };

    // -------------------- ANALYZE --------------------
    case ACTIONS.SET_SELECTED_METHODS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          selectedMethods: action.payload,
        },
      };

    case ACTIONS.TOGGLE_METHOD:
      const methods = state.analyze.selectedMethods;
      const methodIndex = methods.indexOf(action.payload);
      
      return {
        ...state,
        analyze: {
          ...state.analyze,
          selectedMethods:
            methodIndex >= 0
              ? methods.filter((m) => m !== action.payload)
              : [...methods, action.payload],
        },
      };

    case ACTIONS.SET_VIEW_MODE:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          viewMode: action.payload,
        },
      };

    case ACTIONS.UPDATE_FILTERS:
    case ACTIONS.UPDATE_ANALYZE_FILTERS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          filters: {
            ...state.analyze.filters,
            ...action.payload,
          },
        },
      };

    case ACTIONS.SET_CURRENT_JOB:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          currentJob: action.payload,
        },
      };

    case ACTIONS.UPDATE_JOB_PROGRESS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          currentJob: state.analyze.currentJob
            ? {
                ...state.analyze.currentJob,
                ...action.payload,
              }
            : null,
        },
      };

    case ACTIONS.START_ANALYSIS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          currentJob: {
            id: `job_${Date.now()}`,
            status: 'processing',
            progress: 0,
            currentSegment: 0,
            totalSegments: action.payload?.segments?.length || state.workspace.segments.length || 0,
            startTime: Date.now(),
            estimatedTime: null,
            resultsCount: 0,
            highConfidenceCount: 0,
            latestResults: [],
          },
        },
        ui: {
          ...state.ui,
          activeView: 'analyze',
        },
      };

    case ACTIONS.PAUSE_ANALYSIS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          currentJob: state.analyze.currentJob
            ? { ...state.analyze.currentJob, status: 'paused' }
            : null,
        },
      };

    case ACTIONS.RESUME_ANALYSIS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          currentJob: state.analyze.currentJob
            ? { ...state.analyze.currentJob, status: 'processing' }
            : null,
        },
      };

    case ACTIONS.CANCEL_ANALYSIS:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          currentJob: null,
        },
      };

    // -------------------- RESULTS --------------------
    case ACTIONS.SET_RESULTS:
      return {
        ...state,
        results: {
          ...state.results,
          patterns: action.payload,
          selectedPatterns: [],
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case ACTIONS.ADD_RESULTS:
      return {
        ...state,
        results: {
          ...state.results,
          patterns: [...state.results.patterns, ...action.payload],
        },
      };

    case ACTIONS.SET_SORT:
      return {
        ...state,
        results: {
          ...state.results,
          sortBy: action.payload.sortBy || state.results.sortBy,
          sortOrder: action.payload.sortOrder || state.results.sortOrder,
        },
      };

    case ACTIONS.UPDATE_RESULT_FILTERS:
      return {
        ...state,
        results: {
          ...state.results,
          activeFilters: {
            ...state.results.activeFilters,
            ...action.payload,
          },
        },
      };

    case ACTIONS.TOGGLE_PATTERN_SELECTION:
      const selectedPatterns = state.results.selectedPatterns || [];
      const patternId = action.payload;
      
      return {
        ...state,
        results: {
          ...state.results,
          selectedPatterns: selectedPatterns.includes(patternId)
            ? selectedPatterns.filter((id) => id !== patternId)
            : [...selectedPatterns, patternId],
        },
      };

    case ACTIONS.SELECT_ALL_PATTERNS:
      return {
        ...state,
        results: {
          ...state.results,
          selectedPatterns: action.payload,
        },
      };

    case ACTIONS.CLEAR_PATTERN_SELECTION:
      return {
        ...state,
        results: {
          ...state.results,
          selectedPatterns: [],
        },
      };

    case ACTIONS.TOGGLE_PATTERN_EXPAND:
      return {
        ...state,
        results: {
          ...state.results,
          expandedPatternId:
            state.results.expandedPatternId === action.payload ? null : action.payload,
        },
      };

    case ACTIONS.VIEW_PATTERN_DETAILS:
      return {
        ...state,
        results: {
          ...state.results,
          selectedPatternDetails: action.payload,
        },
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            patternDetails: true,
          },
        },
      };

    case ACTIONS.CLEAR_RESULTS:
      return {
        ...state,
        results: {
          ...INITIAL_STATE.results,
          sortBy: state.results.sortBy,
          sortOrder: state.results.sortOrder,
        },
      };

    case ACTIONS.EXPORT_RESULTS:
      return {
        ...state,
        results: {
          ...state.results,
          isExporting: true,
        },
      };

    // -------------------- LIBRARY --------------------
    case ACTIONS.SET_AVAILABLE_SOURCES:
      return {
        ...state,
        library: {
          ...state.library,
          availableSources: action.payload,
        },
      };

    case ACTIONS.SET_SAVED_SESSIONS:
      return {
        ...state,
        library: {
          ...state.library,
          savedSessions: action.payload,
          sessions: action.payload, // Alias for compatibility
        },
      };

    case ACTIONS.ADD_SAVED_SESSION:
      return {
        ...state,
        library: {
          ...state.library,
          savedSessions: [action.payload, ...state.library.savedSessions],
          sessions: [action.payload, ...(state.library.sessions || [])],
        },
      };

    case ACTIONS.DELETE_SESSION:
      return {
        ...state,
        library: {
          ...state.library,
          savedSessions: state.library.savedSessions.filter(
            (session) => session.id !== action.payload
          ),
          sessions: (state.library.sessions || []).filter(
            (session) => session.id !== action.payload
          ),
        },
      };

    case ACTIONS.SET_LIBRARY_SEARCH:
      return {
        ...state,
        library: {
          ...state.library,
          searchQuery: action.payload,
        },
      };

    case ACTIONS.SET_CATEGORY_FILTER:
      return {
        ...state,
        library: {
          ...state.library,
          categoryFilter: action.payload,
        },
      };

    case ACTIONS.SET_LIBRARY_TAB:
      return {
        ...state,
        library: {
          ...state.library,
          activeTab: action.payload,
        },
      };

    case ACTIONS.LOAD_SESSION:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          activeSource: action.payload.source,
          currentSource: action.payload.source,
          segments: action.payload.segments || [],
          boundaries: action.payload.boundaries || [],
        },
        results: {
          ...state.results,
          patterns: action.payload.results || [],
        },
        ui: {
          ...state.ui,
          activeView: 'results',
          hasUnsavedChanges: false,
        },
      };

    case ACTIONS.EDIT_SOURCE:
      return {
        ...state,
        library: {
          ...state.library,
          availableSources: state.library.availableSources.map((source) =>
            source.id === action.payload.id ? action.payload : source
          ),
        },
      };

    case ACTIONS.DELETE_SOURCE:
      return {
        ...state,
        library: {
          ...state.library,
          availableSources: state.library.availableSources.filter(
            (source) => source.id !== action.payload
          ),
        },
      };

    case ACTIONS.EXPORT_SESSION:
      // Handle session export
      return state;

    // -------------------- UI --------------------
    case ACTIONS.SET_ACTIVE_VIEW:
      return {
        ...state,
        ui: {
          ...state.ui,
          activeView: action.payload,
        },
      };

    case ACTIONS.SET_UNSAVED_CHANGES:
      return {
        ...state,
        ui: {
          ...state.ui,
          hasUnsavedChanges: action.payload,
        },
      };

    case ACTIONS.TOGGLE_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.modal]: action.payload.isOpen,
          },
        },
      };

    case ACTIONS.ADD_NOTIFICATION:
      const notification = {
        id: action.payload.id || `notif_${Date.now()}_${Math.random()}`,
        type: action.payload.type || 'info',
        message: action.payload.message,
        title: action.payload.title,
        duration: action.payload.duration !== undefined ? action.payload.duration : 5000,
        timestamp: action.payload.timestamp || Date.now(),
        autoDismiss: action.payload.autoDismiss !== false,
      };
      
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, notification],
        },
      };

    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            (notif) => notif.id !== action.payload
          ),
        },
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: {
            ...state.ui.isLoading,
            [action.payload.key]: action.payload.value,
          },
        },
      };

    // UI Settings for Segmentation
    case ACTIONS.UPDATE_UI_SETTINGS:
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload,
        },
      };

    case ACTIONS.SET_HIGHLIGHT_MODE:
      return {
        ...state,
        ui: {
          ...state.ui,
          highlightMode: action.payload,
        },
      };

    case ACTIONS.SET_FONT_SIZE:
      return {
        ...state,
        ui: {
          ...state.ui,
          fontSize: action.payload,
        },
      };

    case ACTIONS.TOGGLE_LINE_NUMBERS:
      return {
        ...state,
        ui: {
          ...state.ui,
          showLineNumbers: !state.ui.showLineNumbers,
        },
      };

    case ACTIONS.TOGGLE_COMPACT_MODE:
      return {
        ...state,
        ui: {
          ...state.ui,
          compactMode: !state.ui.compactMode,
        },
      };

    // -------------------- SETTINGS --------------------
    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    // -------------------- ENTITY DICTIONARY --------------------
    case ACTIONS.SET_ENTITY_DICTIONARY:
      return {
        ...state,
        library: {
          ...state.library,
          entities: action.payload,
        },
        entityDictionary: action.payload,
      };

    // -------------------- BULK OPERATIONS --------------------
    case ACTIONS.RESTORE_SESSION:
      const session = action.payload;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          activeSource: session.source,
          currentSource: session.source,
          segments: session.segments || [],
          boundaries: session.boundaries || [],
        },
        analyze: {
          ...state.analyze,
          ...session.configuration,
        },
        results: {
          ...state.results,
          patterns: session.results || [],
        },
        ui: {
          ...state.ui,
          activeView: 'results',
          hasUnsavedChanges: false,
        },
      };

    case ACTIONS.RESET_STATE:
      return {
        ...INITIAL_STATE,
        library: state.library,
        entityDictionary: state.entityDictionary,
        settings: state.settings,
      };

    default:
      return state;
  }
}

// ==================== PROVIDER COMPONENT ====================
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // -------------------- INITIALIZATION --------------------
  useEffect(() => {
    async function initializeApp() {
      // Load saved settings from localStorage
      const savedSettings = loadFromStorage('user-settings');
      if (savedSettings) {
        dispatch({
          type: ACTIONS.UPDATE_SETTINGS,
          payload: savedSettings,
        });
      }

      // Load available sources from mock API
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'sources', value: true } });
      try {
        const sources = await mockAPI.getLibrarySources();
        dispatch({ type: ACTIONS.SET_AVAILABLE_SOURCES, payload: sources });
      } catch (error) {
        dispatch({
          type: ACTIONS.ADD_NOTIFICATION,
          payload: {
            type: 'error',
            message: 'Failed to load source library',
            duration: 5000,
          },
        });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'sources', value: false } });
      }

      // Load saved sessions from localStorage
      try {
        const sessions = await mockAPI.getSavedSessions();
        dispatch({ type: ACTIONS.SET_SAVED_SESSIONS, payload: sessions });
      } catch (error) {
        console.error('Failed to load saved sessions:', error);
      }

      // Load entity dictionary
      try {
        const entities = await mockAPI.getEntityDictionary();
        dispatch({ type: ACTIONS.SET_ENTITY_DICTIONARY, payload: entities });
      } catch (error) {
        console.error('Failed to load entity dictionary:', error);
      }
    }

    initializeApp();
  }, []);

  // -------------------- AUTO-SAVE SETTINGS --------------------
  useEffect(() => {
    saveToStorage('user-settings', state.settings);
  }, [state.settings]);

  // -------------------- AUTO-DISMISS NOTIFICATIONS --------------------
  useEffect(() => {
    const timers = state.ui.notifications
      .filter((notif) => notif.autoDismiss && notif.duration)
      .map((notif) =>
        setTimeout(() => {
          dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notif.id });
        }, notif.duration)
      );

    return () => timers.forEach(clearTimeout);
  }, [state.ui.notifications]);

  // -------------------- HELPER FUNCTIONS --------------------
  
  const addNotification = useCallback((type, message, options = {}) => {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type,
        message,
        ...options,
      },
    });
  }, []);

  const toggleModal = useCallback((modalName, isOpen) => {
    dispatch({
      type: ACTIONS.TOGGLE_MODAL,
      payload: { modal: modalName, isOpen },
    });
  }, []);

  const saveSession = useCallback(async (sessionName) => {
    const session = {
      id: `session_${Date.now()}`,
      name: sessionName || `Analysis ${new Date().toLocaleDateString()}`,
      source: state.workspace.activeSource || state.workspace.currentSource,
      segments: state.workspace.segments,
      boundaries: state.workspace.boundaries,
      configuration: {
        selectedMethods: state.analyze.selectedMethods,
        viewMode: state.analyze.viewMode,
        filters: state.analyze.filters,
      },
      results: state.results.patterns,
      resultCount: state.results.patterns.length,
      highConfidenceCount: state.results.patterns.filter((p) => p.scores?.composite >= 70)
        .length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const savedSession = await mockAPI.saveSession(session);
      dispatch({ type: ACTIONS.ADD_SAVED_SESSION, payload: savedSession });
      dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
      addNotification('success', 'Session saved successfully');
      return savedSession;
    } catch (error) {
      addNotification('error', 'Failed to save session');
      throw error;
    }
  }, [state, addNotification]);

  // -------------------- CONTEXT VALUE --------------------
  const value = {
    state,
    dispatch,
    addNotification,
    toggleModal,
    saveSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ==================== CUSTOM HOOKS ====================

/**
 * Custom hook to access app state and actions
 */
export function useAppState() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  
  return context;
}

/**
 * Convenience hooks for specific state slices
 */
export function useWorkspace() {
  const { state } = useAppState();
  return state.workspace;
}

export function useAnalyze() {
  const { state } = useAppState();
  return state.analyze;
}

export function useResults() {
  const { state } = useAppState();
  return state.results;
}

export function useLibrary() {
  const { state } = useAppState();
  return state.library;
}

export function useUI() {
  const { state } = useAppState();
  return state.ui;
}

export function useSettings() {
  const { state } = useAppState();
  return state.settings;
}

export function useEntityDictionary() {
  const { state } = useAppState();
  return state.entityDictionary;
}