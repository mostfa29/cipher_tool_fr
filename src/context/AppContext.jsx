// context/AppContext.jsx

import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react';
import { INITIAL_STATE } from './initialState';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export const AppContext = createContext();

// ==================== API CLIENT ====================
const API_BASE_URL = 'http://localhost:8000';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== AUTHORS & WORKS ====================
  
  async getAuthors() {
    return this.request('/authors');
  }

  async getWorksByAuthor(authorFolder) {
    return this.request(`/authors/${authorFolder}/works`);
  }

  async getWorkContent(authorFolder, workId) {
    return this.request(`/works/${authorFolder}/${workId}`);
  }

  async saveWorkContent(workId, authorFolder, text) {
    return this.request('/works/save', {
      method: 'POST',
      body: JSON.stringify({
        work_id: workId,
        author_folder: authorFolder,
        text: text
      }),
    });
  }

  // ==================== SEGMENTATION ====================
  
  async saveSegmentation(segmentation) {
    return this.request('/segmentation/save', {
      method: 'POST',
      body: JSON.stringify(segmentation),
    });
  }

  async getSegmentation(workId) {
    return this.request(`/segmentation/${workId}`);
  }

  async deleteSegmentation(workId) {
    return this.request(`/segmentation/${workId}`, {
      method: 'DELETE',
    });
  }

  async createAutoSegmentation(workId, authorFolder, segmentSize = 20) {
    return this.request('/segmentation/auto', {
      method: 'POST',
      body: JSON.stringify({
        work_id: workId,
        author_folder: authorFolder,
        segment_size: segmentSize
      }),
    });
  }

  // ==================== ANALYSIS ====================
  
  async startAnalysis(analysisRequest) {
    return this.request('/analyze/start', {
      method: 'POST',
      body: JSON.stringify(analysisRequest),
    });
  }

  async getJobStatus(jobId) {
    return this.request(`/analyze/status/${jobId}`);
  }

  async getJobResults(jobId) {
    return this.request(`/analyze/results/${jobId}`);
  }

  async getAnalysisStrategies() {
    return this.request('/strategies');
  }

  async downloadResults(jobId, format) {
    // For file downloads, we need to handle differently
    const url = `${this.baseURL}/analyze/download/${jobId}/${format}`;
    window.open(url, '_blank');
  }
    async getRecentJobs(limit = 10) {
    return this.request(`/analyze/recent?limit=${limit}`);
  }

  async getLatestCompletedJob() {
    return this.request('/analyze/latest');
  }

  // ==================== HEALTH CHECK ====================
  
  async healthCheck() {
    return this.request('/health');
  }
}

const api = new APIClient(API_BASE_URL);

// ==================== ACTION TYPES ====================
export const ACTIONS = {
  // Authors & Works
  SET_AUTHORS: 'SET_AUTHORS',
  SET_SELECTED_AUTHOR: 'SET_SELECTED_AUTHOR',
  SET_AVAILABLE_WORKS: 'SET_AVAILABLE_WORKS',
  SET_SELECTED_WORK: 'SET_SELECTED_WORK',
  // In ACTIONS object around line 115
  SET_SELECTED_SEGMENT: 'SET_SELECTED_SEGMENT',
  SET_SELECTED_WORK_RESULTS: 'SET_SELECTED_WORK_RESULTS',
  
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
  LOAD_SAVED_SEGMENTATION: 'LOAD_SAVED_SEGMENTATION',

  // Analyze
  SET_AVAILABLE_STRATEGIES: 'SET_AVAILABLE_STRATEGIES',
  SET_SELECTED_STRATEGY: 'SET_SELECTED_STRATEGY',
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

  // Entity Dictionary (kept for compatibility)
  SET_ENTITY_DICTIONARY: 'SET_ENTITY_DICTIONARY',

  // Bulk operations
  RESTORE_SESSION: 'RESTORE_SESSION',
  RESET_STATE: 'RESET_STATE',
};

// ==================== REDUCER ====================
function appReducer(state, action) {
  switch (action.type) {
    // -------------------- AUTHORS & WORKS --------------------
    case ACTIONS.SET_AUTHORS:
      return {
        ...state,
        library: {
          ...state.library,
          authors: action.payload,
        },
      };
      case ACTIONS.SET_SELECTED_SEGMENT:
        return {
          ...state,
          results: {
            ...state.results,
            selectedSegment: action.payload,
          },
        };

      case ACTIONS.SET_SELECTED_WORK_RESULTS:
        return {
          ...state,
          results: {
            ...state.results,
            selectedWorkResults: action.payload,
          },
        };

    case ACTIONS.SET_SELECTED_AUTHOR:
      return {
        ...state,
        library: {
          ...state.library,
          selectedAuthor: action.payload,
          availableWorks: [], // Clear works when changing author
        },
      };

    case ACTIONS.SET_AVAILABLE_WORKS:
      return {
        ...state,
        library: {
          ...state.library,
          availableWorks: action.payload,
          availableSources: action.payload, // Backward compatibility
        },
      };

    case ACTIONS.SET_SELECTED_WORK:
      return {
        ...state,
        library: {
          ...state.library,
          selectedWork: action.payload,
        },
      };

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
          boundaries: action.payload?.lines ? [0, action.payload.lines.length] : [],
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

case ACTIONS.LOAD_SAVED_SEGMENTATION:
  // Ensure we have valid boundaries
  let loadedBoundaries = action.payload.boundaries || [];
  
  // If no boundaries provided, reconstruct from segments
  if (loadedBoundaries.length === 0 && action.payload.segments && action.payload.segments.length > 0) {
    loadedBoundaries = [0];
    action.payload.segments.forEach(seg => {
      const endLine = seg.end_line !== undefined ? seg.end_line + 1 : seg.endLine;
      loadedBoundaries.push(endLine);
    });
    console.log('Reconstructed boundaries from segments:', loadedBoundaries);
  }
  
  return {
    ...state,
    workspace: {
      ...state.workspace,
      segments: action.payload.segments || [],
      boundaries: loadedBoundaries,
      segmentationHistory: [],
      segmentationHistoryIndex: -1,
    },
    ui: { ...state.ui, hasUnsavedChanges: false },
  };
    // Advanced Segmentation Operations
    case ACTIONS.TOGGLE_BOUNDARY: {
      const lineIndex = action.payload;
      const boundaries = state.workspace.boundaries;
      const idx = boundaries.indexOf(lineIndex);
      let newBoundaries;
      
      if (idx > 0 && idx < boundaries.length - 1) {
        newBoundaries = boundaries.filter((_, i) => i !== idx);
      } else if (idx === -1) {
        newBoundaries = [...boundaries, lineIndex].sort((a, b) => a - b);
      } else {
        return state;
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
    analyze: {
      ...state.analyze,
      currentJob: null,
    },
    // DON'T clear results - they should persist
    // results: INITIAL_STATE.results,  // REMOVED
    ui: { ...state.ui, hasUnsavedChanges: false },
  };

    // -------------------- ANALYZE --------------------
    case ACTIONS.SET_AVAILABLE_STRATEGIES:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          availableStrategies: action.payload,
        },
      };

    case ACTIONS.SET_SELECTED_STRATEGY:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          selectedStrategy: action.payload,
        },
      };

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
            id: action.payload.job_id || `job_${Date.now()}`,
            status: 'processing',
            progress: 0,
            currentSegment: 0,
            totalSegments: action.payload.segments_count || state.workspace.segments.length || 0,
            startTime: Date.now(),
            estimatedTime: action.payload.estimated_time_seconds || null,
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
      console.log('📝 Reducer SET_RESULTS received:', action.payload);
      
      // Handle both array payload and object payload with patterns
      const patternsArray = Array.isArray(action.payload) 
        ? action.payload 
        : (action.payload?.patterns || []);
      const jobId = action.payload?.lastJobId || state.results.lastJobId;
      
      console.log(`📊 Setting ${patternsArray.length} patterns with jobId: ${jobId}`);
      
      return {
        ...state,
        results: {
          ...state.results,
          patterns: patternsArray,
          selectedPatterns: [],
          filteredPatterns: patternsArray,
          lastJobId: jobId,
          activeFilters: {
            ...state.results.activeFilters,
            lastJobId: jobId
          }
        },
        ui: { 
          ...state.ui, 
          hasUnsavedChanges: false 
        },
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
          sessions: action.payload,
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
console.log('🚀 Initializing Merlin App...');
  // Check API health
  try {
    const health = await api.healthCheck();
    console.log('✅ API connection established:', health);
    
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `Connected to backend at ${health.corpus_path}`,
        duration: 3000,
      },
    });
  } catch (error) {
    console.error('❌ API connection failed:', error);
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: 'Failed to connect to API. Please ensure the backend is running on port 8000.',
        duration: 10000,
      },
    });
  }

  // Load saved settings from localStorage
  const savedSettings = loadFromStorage('user-settings');
  if (savedSettings) {
    dispatch({
      type: ACTIONS.UPDATE_SETTINGS,
      payload: savedSettings,
    });
  }

  // Load authors from API
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'authors', value: true } });
  try {
    const authors = await api.getAuthors();
    console.log(`✅ Loaded ${authors.length} authors from corpus`);
    dispatch({ type: ACTIONS.SET_AUTHORS, payload: authors });
  } catch (error) {
    console.error('Failed to load authors:', error);
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        message: 'Failed to load author library',
        duration: 5000,
      },
    });
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'authors', value: false } });
  }

  // Load available analysis strategies
  try {
    const strategies = await api.getAnalysisStrategies();
    dispatch({ type: ACTIONS.SET_AVAILABLE_STRATEGIES, payload: strategies });
    console.log(`✅ Loaded ${strategies.length} analysis strategies`);
  } catch (error) {
    console.error('Failed to load strategies:', error);
  }
}

initializeApp();
}, []);

// Restore latest results on app load
useEffect(() => {
  async function restoreLatestResults() {
    console.log('🔍 Checking for latest completed analysis...');
    
    try {
      const latestJob = await api.getLatestCompletedJob();
      
      console.log('✅ Found latest job:', {
        job_id: latestJob.job_id,
        work_title: latestJob.work_title,
        results_count: latestJob.section_results?.length,
        completed_at: latestJob.completed_at
      });
      
      // Transform section_results to patterns format
      const patterns = latestJob.section_results
        .filter(section => section.decoded_messages && section.decoded_messages.length > 0)
        .map((section, idx) => {
          const topCandidate = section.decoded_messages[0];
          const credibleCandidates = section.decoded_messages.filter(c => 
            c.tier === "CREDIBLE" || c.quality_score >= 0.7
          );
          
          const workMeta = section.work_metadata || {};
          
          return {
            id: section.section_id,
            rank: idx + 1,
            segment_id: section.section_id,
            section_name: section.section_id,
            is_encoded: section.classification === "ENCODED",
            composite_score: Math.round((section.detection_score || 0) * 100),
            scores: {
              composite: Math.round((section.detection_score || 0) * 100),
              detection: Math.round((section.detection_score || 0) * 100),
              confidence: section.detection_confidence || 0
            },
            candidates: section.decoded_messages || [],
            credible_candidates: credibleCandidates,
            best_candidate: topCandidate,
            entities_detected: section.decoded_messages.flatMap(c => c.entities || []),
            themes: [],
            original_text: section.original_text,
            classification: section.classification,
            signal_breakdown: section.signal_breakdown,
            metadata: {
              author: workMeta.author || latestJob.author || 'Unknown',
              work_title: workMeta.work_title || latestJob.work_title || 'Unknown',
              work_id: workMeta.work_id || latestJob.work_id || 'unknown',
              section_id: section.section_id,
              detection_score: section.detection_score,
              has_credible: credibleCandidates.length > 0
            }
          };
        });
      
      console.log(`✅ Transformed ${patterns.length} patterns`);
      
      // Set results with job ID
      dispatch({ 
        type: ACTIONS.SET_RESULTS, 
        payload: {
          patterns: patterns,
          lastJobId: latestJob.job_id
        }
      });
      
      addNotification('info', `Restored ${patterns.length} results from latest analysis`, {
        duration: 3000
      });
      
    } catch (error) {
      // 404 is expected if no jobs exist yet
      if (error.message.includes('404')) {
        console.log('📭 No completed jobs found (expected for first run)');
      } else {
        console.error('❌ Error restoring latest results:', error);
      }
    }
  }
  
  // Run after initialization completes
  const timer = setTimeout(() => {
    restoreLatestResults();
  }, 1500);
  
  return () => clearTimeout(timer);
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
// ==================== AUTHORS & WORKS ====================
const selectAuthor = useCallback(async (authorFolder) => {
dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: authorFolder });
dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: true } });
try {
  const works = await api.getWorksByAuthor(authorFolder);
  console.log(`✅ Loaded ${works.length} works for ${authorFolder}`);
  dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: works });
} catch (error) {
  addNotification('error', 'Failed to load works: ' + error.message);
  console.error('Failed to load works:', error);
} finally {
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: false } });
}
}, [addNotification]);

// In AppContext.jsx - Replace the loadWork function:

const loadWork = useCallback(async (authorFolder, workId) => {
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: true } });
  
  try {
    const content = await api.getWorkContent(authorFolder, workId);
    console.log(`✅ Loaded work: ${content.title} (${content.line_count} lines)`);
    
    // Clear any existing analysis job before loading new work
    dispatch({ type: ACTIONS.CANCEL_ANALYSIS });
    
    // Set as active source
    dispatch({ 
      type: ACTIONS.SET_ACTIVE_SOURCE, 
      payload: {
        id: content.id,
        title: content.title,
        author: content.author,
        date: content.date,
        text: content.text,
        lines: content.lines,
        line_count: content.line_count,
        author_folder: authorFolder
      }
    });
    
    // Try to load saved segmentation
    try {
      const segmentation = await api.getSegmentation(workId);
      if (segmentation && segmentation.segments && segmentation.segments.length > 0) {
        console.log(`✅ Loaded saved segmentation with ${segmentation.segments.length} segments`);
        
        // Extract boundaries from segments
        const boundaries = [0];
        segmentation.segments.forEach(seg => {
          boundaries.push(seg.end_line + 1);
        });
        
        // Ensure boundaries include the end of the text
        if (boundaries[boundaries.length - 1] !== content.lines.length) {
          boundaries.push(content.lines.length);
        }
        
        console.log(`✅ Reconstructed ${boundaries.length} boundaries from segments`);
        
        dispatch({ 
          type: ACTIONS.LOAD_SAVED_SEGMENTATION, 
          payload: {
            segments: segmentation.segments,
            boundaries: boundaries
          }
        });
        addNotification('info', `Loaded saved segmentation: ${segmentation.segments.length} segments`);
      }
    } catch (err) {
      console.log('No saved segmentation found');
    }
    
    dispatch({ type: ACTIONS.SET_SELECTED_WORK, payload: content });
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
    addNotification('success', `Loaded: ${content.title}`);
    
    return content;
  } catch (error) {
    addNotification('error', 'Failed to load work: ' + error.message);
    console.error('Failed to load work:', error);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: false } });
  }
}, [addNotification]);

const saveWorkText = useCallback(async (workId, authorFolder, text) => {
try {
await api.saveWorkContent(workId, authorFolder, text);
addNotification('success', 'Text saved successfully');
  // Update current source
  const currentSource = state.workspace.currentSource;
  if (currentSource && currentSource.id === workId) {
    dispatch({
      type: ACTIONS.SET_ACTIVE_SOURCE,
      payload: {
        ...currentSource,
        text: text,
        lines: text.split('\n')
      }
    });
  }
} catch (error) {
  addNotification('error', 'Failed to save text: ' + error.message);
  throw error;
}
}, [state.workspace.currentSource, addNotification]);
// ==================== SEGMENTATION ====================
const createAutoSegmentation = useCallback(async (segmentSize = 20) => {
const currentSource = state.workspace.currentSource;
if (!currentSource || !currentSource.id) {
addNotification('error', 'No work loaded');
return;
}
try {
  const segmentation = await api.createAutoSegmentation(
    currentSource.id,
    currentSource.author_folder,
    segmentSize
  );
  
  console.log(`✅ Created auto-segmentation: ${segmentation.segments.length} segments`);
  dispatch({ type: ACTIONS.LOAD_SAVED_SEGMENTATION, payload: segmentation });
  addNotification('success', `Created ${segmentation.segments.length} segments`);
  
  return segmentation;
} catch (error) {
  addNotification('error', 'Failed to create segmentation: ' + error.message);
  throw error;
}
}, [state.workspace.currentSource, addNotification]);
// In AppContext.jsx, replace the saveSegmentation function:

const saveSegmentation = useCallback(async () => {
  const { currentSource, segments, boundaries } = state.workspace;
  
  if (!currentSource || !currentSource.id) {
    addNotification('error', 'No work loaded');
    return;
  }

  // Ensure segments have all required fields
  let segmentsToSave = segments;
  
  if (!segments || segments.length === 0 || !segments[0]?.text) {
    // Reconstruct from boundaries if segments are incomplete
    if (!boundaries || !currentSource.lines) {
      addNotification('error', 'Cannot create segments: missing boundaries or lines');
      return;
    }
    
    segmentsToSave = boundaries.slice(0, -1).map((start, i) => {
      const end = boundaries[i + 1];
      const segmentLines = currentSource.lines.slice(start, end);
      
      return {
        id: `segment_${start}_${end}`,
        name: `Lines ${start + 1}-${end}`,
        start_line: start,
        end_line: end - 1,
        text: segmentLines.join('\n'),
        lines: segmentLines
      };
    });
  }

  if (segmentsToSave.length === 0) {
    addNotification('error', 'No segments to save');
    return;
  }

  // Build the segmentation object matching Pydantic model exactly
  const segmentationPayload = {
    work_id: currentSource.id,
    work_title: currentSource.title || currentSource.name || 'Unknown',
    author: currentSource.author || 'Unknown',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    segments: segmentsToSave.map(seg => ({
      id: String(seg.id),
      name: String(seg.name),
      start_line: Number(seg.start_line),
      end_line: Number(seg.end_line),
      text: String(seg.text || ''),
      lines: Array.isArray(seg.lines) ? seg.lines.map(l => String(l)) : []
    })),
    metadata: {
      boundaries: boundaries,
      total_lines: currentSource.line_count || currentSource.lines?.length || 0
    }
  };

  console.log('📝 Saving segmentation:', {
    work_id: segmentationPayload.work_id,
    segments_count: segmentationPayload.segments.length,
    sample_segment: segmentationPayload.segments[0]
  });

  try {
    await api.saveSegmentation(segmentationPayload);
    dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    addNotification('success', `Saved ${segmentationPayload.segments.length} segments`);
    console.log(`✅ Segmentation saved for ${currentSource.id}`);
  } catch (error) {
    console.error('Segmentation save error:', error);
    addNotification('error', 'Failed to save segmentation: ' + error.message);
    throw error;
  }
}, [state.workspace, addNotification]);
const loadSegmentation = useCallback(async (workId) => {
try {
const segmentation = await api.getSegmentation(workId);
dispatch({ type: ACTIONS.LOAD_SAVED_SEGMENTATION, payload: segmentation });
addNotification('success', 'Segmentation loaded');
return segmentation;
} catch (error) {
addNotification('error', 'Failed to load segmentation: ' + error.message);
throw error;
}
}, [addNotification]);
const deleteSegmentation = useCallback(async (workId) => {
try {
await api.deleteSegmentation(workId);
addNotification('success', 'Segmentation deleted');
} catch (error) {
addNotification('error', 'Failed to delete segmentation: ' + error.message);
throw error;
}
}, [addNotification]);
// ==================== ANALYSIS ====================
const startAnalysis = useCallback(async () => {
  const { workspace, analyze } = state;
  
  // ==================== VALIDATION ====================
  
  // Check if work is loaded
  if (!workspace.currentSource || !workspace.currentSource.id) {
    addNotification('error', 'No work loaded. Please select a work first.');
    return;
  }

  // Check if strategy is selected
  if (!analyze.selectedStrategy) {
    addNotification('error', 'Please select an analysis strategy before starting.');
    return;
  }

  // ==================== SEGMENT VALIDATION & RECONSTRUCTION ====================
  
  let validSegments = [];
  
  // First, try to use existing segments
  if (workspace.segments && workspace.segments.length > 0) {
    // Validate existing segments have required data
    const hasValidData = workspace.segments.every(seg => 
      seg.text && seg.lines && seg.lines.length > 0
    );
    
    if (hasValidData) {
      validSegments = workspace.segments;
      console.log('✓ Using existing segments:', validSegments.length);
    } else {
      console.warn('⚠️ Existing segments missing data, will reconstruct from boundaries');
    }
  }
  
  // If no valid segments, reconstruct from boundaries
  if (validSegments.length === 0) {
    if (!workspace.boundaries || workspace.boundaries.length < 2) {
      addNotification('error', 'No segments defined. Please create segments in the Workspace first.');
      return;
    }
    
    if (!workspace.currentSource.lines || workspace.currentSource.lines.length === 0) {
      addNotification('error', 'Source text is empty or invalid.');
      return;
    }
    
    console.log('📝 Reconstructing segments from boundaries...');
    
    try {
      validSegments = workspace.boundaries.slice(0, -1).map((start, i) => {
        const end = workspace.boundaries[i + 1];
        const segmentLines = workspace.currentSource.lines.slice(start, end);
        const text = segmentLines.join('\n');
        
        return {
          id: `segment_${start}_${end}`,
          name: `Lines ${start + 1}-${end}`,
          start_line: start,
          end_line: end - 1,
          text: text,
          lines: segmentLines
        };
      });
      
      console.log(`✓ Reconstructed ${validSegments.length} segments`);
    } catch (error) {
      console.error('Error reconstructing segments:', error);
      addNotification('error', 'Failed to create segments from boundaries: ' + error.message);
      return;
    }
  }
  
  // Final validation - check we have valid segments
  if (validSegments.length === 0) {
    addNotification('error', 'No valid segments found. Please create segments in the Workspace.');
    return;
  }
  
  // Filter out segments with insufficient text (less than 50 letters)
  const segmentsWithEnoughText = validSegments.filter(seg => {
    const letterCount = seg.text.replace(/[^a-zA-Z]/g, '').length;
    return letterCount >= 50;
  });
  
  if (segmentsWithEnoughText.length === 0) {
    addNotification('error', 'All segments have insufficient text (need at least 50 letters). Please adjust your segmentation.');
    return;
  }
  
  if (segmentsWithEnoughText.length < validSegments.length) {
    const skipped = validSegments.length - segmentsWithEnoughText.length;
    console.warn(`⚠️ Skipping ${skipped} segment(s) with insufficient text`);
    addNotification('warning', `Analyzing ${segmentsWithEnoughText.length} segments (${skipped} skipped due to insufficient text)`);
  }

  // ==================== PREPARE REQUEST ====================
  
  console.log('\n🔬 Starting cipher analysis...');
  console.log(`Work: ${workspace.currentSource.title}`);
  console.log(`Author: ${workspace.currentSource.author}`);
  console.log(`Total Segments: ${segmentsWithEnoughText.length}`);
  console.log(`Strategy: ${analyze.selectedStrategy}`);

  // Extract source date from work date
  let sourceDate = 1593; // Default fallback
  if (workspace.currentSource.date) {
    const dateMatch = workspace.currentSource.date.match(/\d{4}/);
    if (dateMatch) {
      sourceDate = parseInt(dateMatch[0]);
      console.log(`Source Date: ${sourceDate}`);
    }
  }

  // Build the analysis request with strict type coercion
  const analysisRequest = {
    work_id: String(workspace.currentSource.id || ''),
    work_title: String(workspace.currentSource.title || 'Unknown Work'),
    author: String(workspace.currentSource.author || 'Unknown Author'),
    segments: segmentsWithEnoughText.map(seg => {
      // Ensure lines is an array of strings
      let lines = [];
      if (Array.isArray(seg.lines)) {
        lines = seg.lines.map(line => String(line || ''));
      } else if (seg.text) {
        lines = seg.text.split('\n');
      }
      
      return {
        id: String(seg.id || `seg_${Date.now()}`),
        name: String(seg.name || 'Unnamed Segment'),
        start_line: Number(seg.start_line) || 0,
        end_line: Number(seg.end_line) || 0,
        text: String(seg.text || ''),
        lines: lines
      };
    }),
    strategy: String(analyze.selectedStrategy),
    custom_methods: analyze.selectedStrategy === 'custom' 
      ? (Array.isArray(analyze.selectedMethods) ? analyze.selectedMethods : null)
      : null,
    source_date: Number(sourceDate),
    max_candidates: Number(analyze.filters?.maxCandidates) || 10,
    min_detection_score: Number(analyze.filters?.minScore) || 0.15,
    use_redis: false
  };

  // Log sample segment for debugging
  if (analysisRequest.segments.length > 0) {
    console.log('\n📋 Sample segment being sent:');
    console.log(JSON.stringify(analysisRequest.segments[0], null, 2));
  }

  // ==================== START ANALYSIS ====================
  
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: true } });

  try {
    // Start analysis job
    console.log('🚀 Sending analysis request to backend...');
    const job = await api.startAnalysis(analysisRequest);
    
    console.log(`✅ Analysis job created: ${job.job_id}`);
    console.log(`   Segments: ${job.segments_count}`);
    console.log(`   Estimated time: ${job.estimated_time_seconds}s`);
    
    // Update state with new job
    dispatch({
      type: ACTIONS.START_ANALYSIS,
      payload: job,
    });

    addNotification('info', `Analysis started: ${job.segments_count} segments`, {
      duration: 3000
    });

    // ==================== POLL FOR PROGRESS ====================
    
    let pollAttempts = 0;
    const maxPollAttempts = 300; // 10 minutes at 2s intervals
    
    const pollInterval = setInterval(async () => {
      pollAttempts++;
      
      if (pollAttempts > maxPollAttempts) {
        clearInterval(pollInterval);
        dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
        addNotification('error', 'Analysis timed out after 10 minutes. Please check the backend logs.');
        return;
      }
      
      try {
        const status = await api.getJobStatus(job.job_id);
        
        // Update progress
        dispatch({
          type: ACTIONS.UPDATE_JOB_PROGRESS,
          payload: {
            progress: status.progress || 0,
            currentSegment: status.current_segment || 0,
            resultsCount: status.results_count || 0,
            status: status.status,
          },
        });

        // Check if completed
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          
          console.log(`✅ Analysis completed: ${status.results_count} results`);
          
          // Fetch full results
          const resultsData = await api.getJobResults(job.job_id);
          
          console.log(`✅ Retrieved full results:`);
          console.log(`   Total sections: ${resultsData.total_sections}`);
          console.log(`   Encoded sections: ${resultsData.encoded_sections}`);
          console.log(`   Total candidates: ${resultsData.total_candidates}`);
          console.log(`   Credible count: ${resultsData.credible_count}`);
          
          // Transform section_results to patterns format
          const patterns = (resultsData.section_results || [])
            .filter(section => section.decoded_messages && section.decoded_messages.length > 0)
            .map((section, idx) => {
              const topCandidate = section.decoded_messages[0] || {};
              const credibleCandidates = (section.decoded_messages || []).filter(c => 
                c.tier === "CREDIBLE" || (c.quality_score || 0) >= 0.7
              );
              
              const workMeta = section.work_metadata || {};
              
              return {
                id: section.section_id,
                rank: idx + 1,
                segment_id: section.section_id,
                section_name: section.section_id,
                is_encoded: section.classification === "ENCODED",
                composite_score: Math.round((section.detection_score || 0) * 100),
                scores: {
                  composite: Math.round((section.detection_score || 0) * 100),
                  detection: Math.round((section.detection_score || 0) * 100),
                  confidence: section.detection_confidence || 0
                },
                candidates: section.decoded_messages || [],
                credible_candidates: credibleCandidates,
                best_candidate: topCandidate,
                entities_detected: (section.decoded_messages || []).flatMap(c => c.entities || []),
                themes: [],
                original_text: section.original_text || '',
                classification: section.classification || 'UNKNOWN',
                signal_breakdown: section.signal_breakdown || {},
                metadata: {
                  author: workMeta.author || workspace.currentSource.author || 'Unknown',
                  work_title: workMeta.work_title || workspace.currentSource.title || 'Unknown',
                  work_id: workMeta.work_id || workspace.currentSource.id || 'unknown',
                  section_id: section.section_id,
                  detection_score: section.detection_score || 0,
                  has_credible: credibleCandidates.length > 0
                }
              };
            });
          
          console.log(`✅ Transformed ${patterns.length} patterns`);
          
          // Set results
          dispatch({ 
            type: ACTIONS.SET_RESULTS, 
            payload: {
              patterns: patterns,
              lastJobId: job.job_id
            }
          });
          
          // Update job status to completed
          dispatch({ 
            type: ACTIONS.UPDATE_JOB_PROGRESS, 
            payload: { 
              status: 'completed',
              progress: 100,
              resultsCount: patterns.length,
              completedAt: new Date().toISOString()
            } 
          });
          
          // Navigate to results view
          dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'results' });
          dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
          
          addNotification('success', 
            `Analysis complete: ${resultsData.credible_count} credible decodings found`,
            { duration: 8000 }
          );
        }
        else if (status.status === 'failed') {
          clearInterval(pollInterval);
          dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
          addNotification('error', 'Analysis failed: ' + (status.error || 'Unknown error'));
          console.error('Job failed:', status.error);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(pollInterval);
        dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
        addNotification('error', 'Failed to check analysis status: ' + error.message);
      }
    }, 2000); // Poll every 2 seconds

  } catch (error) {
    console.error('❌ Failed to start analysis:', error);
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
    
    // Provide more specific error message
    let errorMessage = 'Failed to start analysis';
    if (error.message) {
      errorMessage += ': ' + error.message;
    }
    
    addNotification('error', errorMessage, { duration: 10000 });
  }
}, [state, addNotification, api, dispatch]);
const exportResults = useCallback((format = 'json') => {
  // Try multiple sources for job ID
  const jobId = state.analyze.currentJob?.id || 
                state.analyze.currentJob?.job_id || 
                state.results.lastJobId ||
                state.results.activeFilters?.lastJobId;
  
  if (!jobId) {
    addNotification('warning', 'No analysis results to export. Run an analysis first.');
    return;
  }

  try {
    api.downloadResults(jobId, format);
    addNotification('success', `Downloading results as ${format.toUpperCase()}...`);
  } catch (error) {
    addNotification('error', 'Export failed: ' + error.message);
  }
}, [state.analyze.currentJob, state.results, addNotification]);
// ==================== LEGACY COMPATIBILITY ====================
// Keep these for backward compatibility with existing components
const loadSource = loadWork;
const searchSources = useCallback(async (query) => {
// Search across all authors' works
addNotification('info', 'Search functionality coming soon');
}, [addNotification]);
// -------------------- CONTEXT VALUE --------------------
const value = {
state,
dispatch,
api,
// Notifications & UI
addNotification,
toggleModal,

// Authors & Works
selectAuthor,
loadWork,
saveWorkText,

// Segmentation
createAutoSegmentation,
saveSegmentation,
loadSegmentation,
deleteSegmentation,

// Analysis
startAnalysis,
exportResults,

// Legacy compatibility
loadSource,
searchSources,
};
return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
// ==================== CUSTOM HOOKS ====================
export function useAppState() {
const context = useContext(AppContext);
if (!context) {
throw new Error('useAppState must be used within an AppProvider');
}
return context;
}
// Convenience hooks for specific state slices
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
export function useAPI() {
const {
api,
selectAuthor,
loadWork,
saveWorkText,
createAutoSegmentation,
saveSegmentation,
loadSegmentation,
deleteSegmentation,
startAnalysis,
exportResults,
loadSource, // Legacy
searchSources, // Legacy
} = useAppState();
return {
api,
selectAuthor,
loadWork,
saveWorkText,
createAutoSegmentation,
saveSegmentation,
loadSegmentation,
deleteSegmentation,
startAnalysis,
exportResults,
loadSource,
searchSources,
};
}