// context/AppContext.jsx

import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react';
import { INITIAL_STATE } from './initialState';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export const AppContext = createContext();


// Map frontend segmentation modes to backend enum values
function mapSegmentationType(mode) {
  const segmentTypeMap = {
    'manual': 'sentence',        // Manual segmentation → paragraph
    'paragraph': 'paragraph',
    'sentence': 'sentence',
    'title': 'title',
    'clause': 'clause',
    'fixed': 'fixed_length',      // Map 'fixed' to backend enum
    'fixed_length': 'fixed_length',
    '2line_pairs': '2line_pairs',
    'two_line_pairs': '2line_pairs',
  };
  
  return segmentTypeMap[mode] || 'paragraph'; // Default to 'paragraph' if unknown
}
// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://192.99.245.215:8000'
// const API_BASE_URL = 'http://192.99.245.215:8000'

// ==================== API CLIENT ====================
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
      
      // IMPROVED ERROR LOGGING
      console.error('❌ API Error Details:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        error: error,
        detail: error.detail,
        body: error.body
      });
      
      // If it's a validation error, log the details
      if (error.detail && Array.isArray(error.detail)) {
        console.error('📋 Validation Errors:');
        error.detail.forEach(err => {
          console.error(`  - ${err.loc?.join('.')}: ${err.msg} (type: ${err.type})`);
        });
      }
      
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
// Add these methods to the APIClient class:

// Advanced Analysis Endpoints
calculateStatisticalImprobability(decodedText, segmentLength, cipherMethod) {
  return this.request('/api/analysis/statistical-improbability', {
    method: 'POST',
    body: JSON.stringify({
      decoded_text: decodedText,
      segment_length: segmentLength,
      cipher_method: cipherMethod
    }),
  });
}

analyzeEntityClustering(decodedText, entities = null) {
  return this.request('/api/analysis/entity-clustering', {
    method: 'POST',
    body: JSON.stringify({
      decoded_text: decodedText,
      entities: entities
    }),
  });
}

getSpoilageDistribution(workIds = null, viewMode = 'standard') {
  const params = new URLSearchParams();
  if (workIds) workIds.forEach(id => params.append('work_ids', id));
  params.append('view_mode', viewMode);
  return this.request(`/api/analysis/spoilage-distribution?${params}`);
}

extractThematicLayers(jobId, themes = ['identity', 'persecution', 'scandal', 'decoy', 'venice']) {
  return this.request('/api/analysis/extract-themes', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId, themes }),
  });
}

compareMultipleWorks(workIds, comparisonMetrics = ['spoilage', 'entity_frequency', 'cipher_methods', 'confidence']) {
  return this.request('/api/analysis/compare-works', {
    method: 'POST',
    body: JSON.stringify({
      work_ids: workIds,
      comparison_metrics: comparisonMetrics
    }),
  });
}

// Multi-Edition Analysis
analyzeMultipleEditions(request) {
  return this.request('/api/analysis/multi-edition', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

compareEditions(request) {
  return this.request('/api/analysis/compare-editions', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

analyzeSpoilageAcrossEditions(request) {
  return this.request('/api/analysis/spoilage-analysis', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Advanced Segmentation
segmentByClause(workId, authorFolder, minClauseLength = 30, maxClauseLength = 150) {
  return this.request('/api/segmentation/by-clause', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      author_folder: authorFolder,
      min_clause_length: minClauseLength,
      max_clause_length: maxClauseLength
    }),
  });
}

// Interactive Analysis
suggestLetterChoices(partialDecode, remainingLetters, targetEntities = [], maxSuggestions = 10, aggressiveness = 0.5) {
  return this.request('/api/analysis/suggest-letters', {
    method: 'POST',
    body: JSON.stringify({
      partial_decode: partialDecode,
      remaining_letters: remainingLetters,
      target_entities: targetEntities,
      max_suggestions: maxSuggestions,
      aggressiveness: aggressiveness
    }),
  });
}

// Batch Processing & Export
batchProcess(request) {
  return this.request('/api/batch/process', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

exportToGoogleSheets(jobIds, sheetName = "Cipher Analysis", includeMetadata = true, includeQualityFlags = true, groupBy = "work") {
  return this.request('/api/batch/export-to-sheets', {
    method: 'POST',
    body: JSON.stringify({
      job_ids: jobIds,
      sheet_name: sheetName,
      include_metadata: includeMetadata,
      include_quality_flags: includeQualityFlags,
      group_by: groupBy
    }),
  });
}

listBatchExports() {
  return this.request('/api/batch/exports');
}

downloadBatchExport(filename) {
  return this.request(`/api/batch/download/${filename}`);
}

// AI Enhancement
enhanceWithAI(decodedText, mode = 'standard', maxSuggestions = 10) {
  return this.request('/api/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({
      decoded_text: decodedText,
      mode: mode,
      max_suggestions: maxSuggestions
    }),
  });
}

chatWithAI(message, conversationHistory = []) {
  return this.request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: message,
      conversation_history: conversationHistory
    }),
  });
}

reconstructGibberish(gibberishText, maxReconstructions = 5) {
  return this.request('/api/ai/reconstruct-gibberish', {
    method: 'POST',
    body: JSON.stringify({
      gibberish_text: gibberishText,
      max_reconstructions: maxReconstructions
    }),
  });
}

// Progress & Statistics
getProgressDashboard() {
  return this.request('/api/progress/dashboard');
}

validateJobResult(jobId) {
  return this.request(`/api/jobs/${jobId}/validate`);
}

downloadResults(jobId, format = 'json') {
  const url = `${this.baseURL}/api/batch/export/${jobId}_export.${format}`;
  window.open(url, '_blank');
}

healthCheck() {
  return this.request('/health');
}
  // Authors & Works
  getAuthors() {
    return this.request('/api/corpus/authors');
  }

  getWorksByAuthor(authorFolder) {
    return this.request(`/api/corpus/authors/${authorFolder}/works`);
  }

  getWorkContent(authorFolder, workId) {
    return this.request(`/api/corpus/work/${authorFolder}/${workId}`);
  }

  saveWorkContent(workId, authorFolder, text) {
    return this.request('/api/corpus/work/save', {
      method: 'POST',
      body: JSON.stringify({
        work_id: workId,
        author_folder: authorFolder,
        text: text
      }),
    });
  }

  // Segmentation
  saveSegmentation(segmentation) {
    return this.request('/api/segmentation/save', {
      method: 'POST',
      body: JSON.stringify(segmentation),
    });
  }

  getSegmentation(workId) {
    return this.request(`/api/segmentation/${workId}`);
  }

  deleteSegmentation(workId) {
    return this.request(`/api/segmentation/${workId}`, {
      method: 'DELETE',
    });
  }

  createAutoSegmentation(workId, authorFolder, segmentType = 'paragraph', segmentSize = 20) {
    return this.request('/api/segmentation/auto-create', {
      method: 'POST',
      body: JSON.stringify({
        work_id: workId,
        author_folder: authorFolder,
        segment_type: segmentType,
        segment_size: segmentSize
      }),
    });
  }

  // Analysis
  startAnalysis(analysisRequest) {
    return this.request('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(analysisRequest),
    });
  }

  getJobStatus(jobId) {
    return this.request(`/api/jobs/${jobId}/status`);
  }

  getJobResults(jobId) {
    return this.request(`/api/jobs/${jobId}/result`);
  }

  getAllJobs() {
    return this.request('/api/jobs');
  }

  deleteJob(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  downloadResults(jobId, format = 'json') {
    const url = `${this.baseURL}/api/batch/export/${jobId}_export.${format}`;
    window.open(url, '_blank');
  }

  healthCheck() {
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
  
  // Workspace
  SET_ACTIVE_SOURCE: 'SET_ACTIVE_SOURCE',
  SET_SEGMENTS: 'SET_SEGMENTS',
  SET_BOUNDARIES: 'SET_BOUNDARIES',
  SET_SEGMENTATION_MODE: 'SET_SEGMENTATION_MODE',
  TOGGLE_BOUNDARY: 'TOGGLE_BOUNDARY',
  LOAD_SAVED_SEGMENTATION: 'LOAD_SAVED_SEGMENTATION',
  CLEAR_WORKSPACE: 'CLEAR_WORKSPACE',
  
  // Analysis
  SET_SELECTED_STRATEGY: 'SET_SELECTED_STRATEGY',
  SET_SELECTED_METHODS: 'SET_SELECTED_METHODS',
  SET_CURRENT_JOB: 'SET_CURRENT_JOB',
  UPDATE_JOB_PROGRESS: 'UPDATE_JOB_PROGRESS',
  START_ANALYSIS: 'START_ANALYSIS',
  CANCEL_ANALYSIS: 'CANCEL_ANALYSIS',

  // Results
  SET_RESULTS: 'SET_RESULTS',
  SET_SELECTED_SEGMENT: 'SET_SELECTED_SEGMENT',
  UPDATE_RESULT_FILTERS: 'UPDATE_RESULT_FILTERS',
  CLEAR_RESULTS: 'CLEAR_RESULTS',

  // UI
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_UNSAVED_CHANGES: 'SET_UNSAVED_CHANGES',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',


  TOGGLE_MODAL: 'TOGGLE_MODAL',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

    // Advanced Analysis
  SET_STATISTICAL_IMPROBABILITY: 'SET_STATISTICAL_IMPROBABILITY',
  SET_ENTITY_CLUSTERING: 'SET_ENTITY_CLUSTERING',
  SET_SPOILAGE_DISTRIBUTION: 'SET_SPOILAGE_DISTRIBUTION',
  SET_THEMATIC_LAYERS: 'SET_THEMATIC_LAYERS',
  SET_WORK_COMPARISON: 'SET_WORK_COMPARISON',
  
  // Multi-Edition
  SET_MULTI_EDITION_RESULTS: 'SET_MULTI_EDITION_RESULTS',
  SET_EDITION_COMPARISON: 'SET_EDITION_COMPARISON',
  
  // Interactive Analysis
  SET_LETTER_SUGGESTIONS: 'SET_LETTER_SUGGESTIONS',
  UPDATE_AI_CHAT_HISTORY: 'UPDATE_AI_CHAT_HISTORY',
  SET_GIBBERISH_RECONSTRUCTIONS: 'SET_GIBBERISH_RECONSTRUCTIONS',
  
  // Batch & Export
  SET_BATCH_RESULTS: 'SET_BATCH_RESULTS',
  SET_EXPORT_STATUS: 'SET_EXPORT_STATUS',
  
  // Progress
  SET_PROGRESS_DASHBOARD: 'SET_PROGRESS_DASHBOARD',
};

// ==================== REDUCER ====================
function appReducer(state, action) {
  switch (action.type) {
    // Authors & Works
    case ACTIONS.SET_AUTHORS:
      return {
        ...state,
        library: {
          ...state.library,
          authors: action.payload,
        },
      };
    case ACTIONS.SET_VIEW_MODE:
  return {
    ...state,
    analyze: {
      ...state.analyze,
      viewMode: action.payload,
      selectedStrategy: action.payload, // Ensure both are set
    },
  };
  // In appReducer function, add these cases:

case ACTIONS.SET_STATISTICAL_IMPROBABILITY:
  return {
    ...state,
    results: {
      ...state.results,
      statisticalImprobability: action.payload,
    },
  };

case ACTIONS.SET_ENTITY_CLUSTERING:
  return {
    ...state,
    results: {
      ...state.results,
      entityClustering: action.payload,
    },
  };

case ACTIONS.SET_SPOILAGE_DISTRIBUTION:
  return {
    ...state,
    results: {
      ...state.results,
      spoilageDistribution: action.payload,
    },
  };

case ACTIONS.SET_THEMATIC_LAYERS:
  return {
    ...state,
    results: {
      ...state.results,
      thematicLayers: action.payload,
    },
  };

case ACTIONS.SET_WORK_COMPARISON:
  return {
    ...state,
    results: {
      ...state.results,
      workComparison: action.payload,
    },
  };

case ACTIONS.SET_MULTI_EDITION_RESULTS:
  return {
    ...state,
    results: {
      ...state.results,
      multiEditionResults: action.payload,
    },
  };

case ACTIONS.SET_EDITION_COMPARISON:
  return {
    ...state,
    results: {
      ...state.results,
      editionComparison: action.payload,
    },
  };

case ACTIONS.SET_LETTER_SUGGESTIONS:
  return {
    ...state,
    analyze: {
      ...state.analyze,
      letterSuggestions: action.payload,
    },
  };

case ACTIONS.UPDATE_AI_CHAT_HISTORY:
  return {
    ...state,
    analyze: {
      ...state.analyze,
      aiChatHistory: [...(state.analyze.aiChatHistory || []), action.payload],
    },
  };

case ACTIONS.SET_GIBBERISH_RECONSTRUCTIONS:
  return {
    ...state,
    results: {
      ...state.results,
      gibberishReconstructions: action.payload,
    },
  };

case ACTIONS.SET_BATCH_RESULTS:
  return {
    ...state,
    results: {
      ...state.results,
      batchResults: action.payload,
    },
  };

case ACTIONS.SET_EXPORT_STATUS:
  return {
    ...state,
    ui: {
      ...state.ui,
      exportStatus: action.payload,
    },
  };

case ACTIONS.SET_PROGRESS_DASHBOARD:
  return {
    ...state,
    ui: {
      ...state.ui,
      progressDashboard: action.payload,
    },
  };
  case ACTIONS.SET_AI_ENHANCEMENT_RESULT:
  return {
    ...state,
    results: {
      ...state.results,
      aiEnhancementResult: action.payload
    }
  };

    case ACTIONS.SET_SELECTED_AUTHOR:
      return {
        ...state,
        library: {
          ...state.library,
          selectedAuthor: action.payload,
          availableWorks: [],
        },
      };

    case ACTIONS.SET_AVAILABLE_WORKS:
      return {
        ...state,
        library: {
          ...state.library,
          availableWorks: action.payload,
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

    // Workspace
    case ACTIONS.SET_ACTIVE_SOURCE:
      return {
        ...state,
        workspace: {
          ...state.workspace,
          activeSource: action.payload,
          currentSource: action.payload,
          segments: [],
          boundaries: action.payload?.lines ? [0, action.payload.lines.length] : [],
        },
        ui: { ...state.ui, hasUnsavedChanges: false },
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

    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
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
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };
    }

    case ACTIONS.LOAD_SAVED_SEGMENTATION: {
      let loadedBoundaries = action.payload.boundaries || [];
      
      if (loadedBoundaries.length === 0 && action.payload.segments?.length > 0) {
        loadedBoundaries = [0];
        action.payload.segments.forEach(seg => {
          const endLine = seg.end_line !== undefined ? seg.end_line + 1 : seg.endLine + 1;
          loadedBoundaries.push(endLine);
        });
      }
      
      return {
        ...state,
        workspace: {
          ...state.workspace,
          segments: action.payload.segments || [],
          boundaries: loadedBoundaries,
        },
        ui: { ...state.ui, hasUnsavedChanges: false },
      };
    }

    case ACTIONS.CLEAR_WORKSPACE:
      return {
        ...state,
        workspace: INITIAL_STATE.workspace,
        analyze: {
          ...state.analyze,
          currentJob: null,
        },
        ui: { ...state.ui, hasUnsavedChanges: false },
      };

    // Analysis
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
            id: action.payload.job_id,
            job_id: action.payload.job_id,
            status: 'processing',
            progress: 0,
            currentSegment: 0,
            totalSegments: action.payload.segments_count || 0,
            startTime: Date.now(),
            work_title: action.payload.work_title,
          },
        },
        ui: {
          ...state.ui,
          activeView: 'analyze',
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

    // Results
    case ACTIONS.SET_RESULTS: {
      const patternsArray = Array.isArray(action.payload) 
        ? action.payload 
        : (action.payload?.patterns || []);
      const jobId = action.payload?.lastJobId || state.results.lastJobId;
      
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
    }

    case ACTIONS.SET_SELECTED_SEGMENT:
      return {
        ...state,
        results: {
          ...state.results,
          selectedSegment: action.payload,
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

    case ACTIONS.CLEAR_RESULTS:
      return {
        ...state,
        results: {
          ...INITIAL_STATE.results,
          sortBy: state.results.sortBy,
          sortOrder: state.results.sortOrder,
        },
      };

    // UI
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

    case ACTIONS.ADD_NOTIFICATION: {
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
    }

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

    default:
      return state;
  }
}

// ==================== PROVIDER COMPONENT ====================
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // ==================== ALL CALLBACKS FIRST ====================
  const addNotification = useCallback((type, message, options = {}) => {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: { type, message, ...options },
    });
  }, []);
  // Advanced Analysis Functions
const analyzeStatisticalImprobability = useCallback(async (decodedText, segmentLength, cipherMethod) => {
  try {
    const result = await api.calculateStatisticalImprobability(decodedText, segmentLength, cipherMethod);
    dispatch({ type: ACTIONS.SET_STATISTICAL_IMPROBABILITY, payload: result });
    return result;
  } catch (error) {
    addNotification('error', 'Failed to calculate improbability: ' + error.message);
    throw error;
  }
}, [addNotification]);

const analyzeEntityClustering = useCallback(async (decodedText, entities = null) => {
  try {
    const result = await api.analyzeEntityClustering(decodedText, entities);
    dispatch({ type: ACTIONS.SET_ENTITY_CLUSTERING, payload: result });
    return result;
  } catch (error) {
    addNotification('error', 'Failed to analyze entity clustering: ' + error.message);
    throw error;
  }
}, [addNotification]);

const getSpoilageDistribution = useCallback(async (workIds = null, viewMode = 'standard') => {
  try {
    const result = await api.getSpoilageDistribution(workIds, viewMode);
    dispatch({ type: ACTIONS.SET_SPOILAGE_DISTRIBUTION, payload: result });
    return result;
  } catch (error) {
    addNotification('error', 'Failed to get spoilage distribution: ' + error.message);
    throw error;
  }
}, [addNotification]);

const extractThematicLayers = useCallback(async (jobId, themes) => {
  try {
    const result = await api.extractThematicLayers(jobId, themes);
    dispatch({ type: ACTIONS.SET_THEMATIC_LAYERS, payload: result });
    addNotification('success', `Extracted ${Object.keys(result.layers).length} thematic layers`);
    return result;
  } catch (error) {
    addNotification('error', 'Failed to extract themes: ' + error.message);
    throw error;
  }
}, [addNotification]);

const compareWorks = useCallback(async (workIds, metrics) => {
  try {
    const result = await api.compareMultipleWorks(workIds, metrics);
    dispatch({ type: ACTIONS.SET_WORK_COMPARISON, payload: result });
    addNotification('success', `Compared ${workIds.length} works`);
    return result;
  } catch (error) {
    addNotification('error', 'Failed to compare works: ' + error.message);
    throw error;
  }
}, [addNotification]);

// Multi-Edition Functions
const analyzeMultiEdition = useCallback(async (request) => {
  try {
    const result = await api.analyzeMultipleEditions(request);
    dispatch({ type: ACTIONS.SET_MULTI_EDITION_RESULTS, payload: result });
    addNotification('success', `Analyzed ${result.editions_analyzed} editions`);
    return result;
  } catch (error) {
    addNotification('error', 'Multi-edition analysis failed: ' + error.message);
    throw error;
  }
}, [addNotification]);

const compareEditions = useCallback(async (request) => {
  try {
    const result = await api.compareEditions(request);
    dispatch({ type: ACTIONS.SET_EDITION_COMPARISON, payload: result });
    return result;
  } catch (error) {
    addNotification('error', 'Edition comparison failed: ' + error.message);
    throw error;
  }
}, [addNotification]);

// Interactive Analysis
const suggestLetters = useCallback(async (partialDecode, remainingLetters, targetEntities, maxSuggestions, aggressiveness) => {
  try {
    const result = await api.suggestLetterChoices(partialDecode, remainingLetters, targetEntities, maxSuggestions, aggressiveness);
    dispatch({ type: ACTIONS.SET_LETTER_SUGGESTIONS, payload: result });
    return result;
  } catch (error) {
    addNotification('error', 'Failed to suggest letters: ' + error.message);
    throw error;
  }
}, [addNotification]);

const chatWithAI = useCallback(async (message) => {
  try {
    const history = state.analyze.aiChatHistory || [];
    const result = await api.chatWithAI(message, history);
    dispatch({ type: ACTIONS.UPDATE_AI_CHAT_HISTORY, payload: { role: 'user', content: message } });
    dispatch({ type: ACTIONS.UPDATE_AI_CHAT_HISTORY, payload: { role: 'assistant', content: result.response } });
    return result;
  } catch (error) {
    addNotification('error', 'AI chat failed: ' + error.message);
    throw error;
  }
}, [state.analyze.aiChatHistory, addNotification]);

const reconstructGibberish = useCallback(async (gibberishText, maxReconstructions = 5) => {
  try {
    const result = await api.reconstructGibberish(gibberishText, maxReconstructions);
    dispatch({ type: ACTIONS.SET_GIBBERISH_RECONSTRUCTIONS, payload: result });
    addNotification('success', `Generated ${result.count} reconstructions`);
    return result;
  } catch (error) {
    addNotification('error', 'Gibberish reconstruction failed: ' + error.message);
    throw error;
  }
}, [addNotification]);

// Batch & Export
const exportToSheets = useCallback(async (jobIds, options = {}) => {
  try {
    const result = await api.exportToGoogleSheets(
      jobIds,
      options.sheetName,
      options.includeMetadata,
      options.includeQualityFlags,
      options.groupBy
    );
    dispatch({ type: ACTIONS.SET_EXPORT_STATUS, payload: result });
    addNotification('success', `Exported ${result.rows_exported} rows to CSV`);
    return result;
  } catch (error) {
    addNotification('error', 'Export failed: ' + error.message);
    throw error;
  }
}, [addNotification]);

const getProgressDashboard = useCallback(async () => {
  try {
    const result = await api.getProgressDashboard();
    dispatch({ type: ACTIONS.SET_PROGRESS_DASHBOARD, payload: result });
    return result;
  } catch (error) {
    addNotification('error', 'Failed to load dashboard: ' + error.message);
    throw error;
  }
}, [addNotification]);

  const toggleModal = useCallback((modalName, isOpen) => {
    dispatch({
      type: ACTIONS.TOGGLE_MODAL,
      payload: { modal: modalName, isOpen },
    });
  }, []);

  const selectAuthor = useCallback(async (authorFolder) => {
    dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: authorFolder });
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: true } });
    
    try {
      const works = await api.getWorksByAuthor(authorFolder);
      console.log(`✅ Loaded ${works.length} works for ${authorFolder}`);
      dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: works });
    } catch (error) {
      addNotification('error', 'Failed to load works: ' + error.message);
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: false } });
    }
  }, [addNotification]);

  const loadWork = useCallback(async (authorFolder, workId) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: true } });
    
    try {
      const content = await api.getWorkContent(authorFolder, workId);
      console.log(`✅ Loaded work: ${content.title} (${content.line_count} lines)`);
      
      dispatch({ type: ACTIONS.CANCEL_ANALYSIS });
      
      dispatch({ 
        type: ACTIONS.SET_ACTIVE_SOURCE, 
        payload: {
          ...content,
          author_folder: authorFolder
        }
      });
      
      try {
        const segmentation = await api.getSegmentation(workId);
        if (segmentation?.segments?.length > 0) {
          console.log(`✅ Loaded saved segmentation: ${segmentation.segments.length} segments`);
          
          const boundaries = [0];
          segmentation.segments.forEach(seg => {
            boundaries.push(seg.end_line + 1);
          });
          
          if (boundaries[boundaries.length - 1] !== content.lines.length) {
            boundaries.push(content.lines.length);
          }
          
          dispatch({ 
            type: ACTIONS.LOAD_SAVED_SEGMENTATION, 
            payload: {
              segments: segmentation.segments,
              boundaries: boundaries
            }
          });
          
          addNotification('info', `Loaded ${segmentation.segments.length} segments`);
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
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: false } });
    }
  }, [addNotification]);

  const saveWorkText = useCallback(async (workId, authorFolder, text) => {
    try {
      await api.saveWorkContent(workId, authorFolder, text);
      addNotification('success', 'Text saved successfully');
      
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

  const createAutoSegmentation = useCallback(async (segmentType = 'paragraph', segmentSize = 20) => {
    const currentSource = state.workspace.currentSource;
    if (!currentSource?.id) {
      addNotification('error', 'No work loaded');
      return;
    }

    try {
      const response = await api.createAutoSegmentation(
        currentSource.id,
        currentSource.author_folder,
        segmentType,
        segmentSize
      );
      
      const segmentation = response.segmentation;
      console.log(`✅ Created auto-segmentation: ${segmentation.segments.length} segments`);
      
      dispatch({ type: ACTIONS.LOAD_SAVED_SEGMENTATION, payload: segmentation });
      addNotification('success', `Created ${segmentation.segments.length} segments`);
      
      return segmentation;
    } catch (error) {
      addNotification('error', 'Failed to create segmentation: ' + error.message);
      throw error;
    }
  }, [state.workspace.currentSource, addNotification]);

  const saveSegmentation = useCallback(async () => {
    const { currentSource, segments, boundaries } = state.workspace;
    
    if (!currentSource?.id) {
      addNotification('error', 'No work loaded');
      return;
    }

    let segmentsToSave = segments;
    
    if (!segments?.length || !segments[0]?.text) {
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

    const segmentationPayload = {
      work_id: currentSource.id,
      work_title: currentSource.title || 'Unknown',
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

    try {
      await api.saveSegmentation(segmentationPayload);
      dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
      addNotification('success', `Saved ${segmentationPayload.segments.length} segments`);
    } catch (error) {
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

  const startAnalysis = useCallback(async () => {
  const { workspace, analyze } = state;
  
  if (!workspace.currentSource?.id) {
    addNotification('error', 'No work loaded');
    return;
  }

  if (!analyze.selectedStrategy) {
    addNotification('error', 'Please select an analysis strategy');
    return;
  }

  let validSegments = workspace.segments;
  
  if (!validSegments?.length || !validSegments[0]?.text) {
    if (!workspace.boundaries?.length >= 2 || !workspace.currentSource.lines) {
      addNotification('error', 'No segments defined. Please create segments first.');
      return;
    }
    
    validSegments = workspace.boundaries.slice(0, -1).map((start, i) => {
      const end = workspace.boundaries[i + 1];
      const segmentLines = workspace.currentSource.lines.slice(start, end);
      
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

  const segmentsWithText = validSegments

  if (segmentsWithText.length === 0) {
    addNotification('error', 'All segments have insufficient text (need 50+ letters)');
    return;
  }

  if (segmentsWithText.length < 1) {
    const skipped = validSegments.length - segmentsWithText.length;
    addNotification('warning', `Analyzing ${segmentsWithText.length} segments (${skipped} skipped)`);
  }

  console.log(`🔬 Starting analysis: ${workspace.currentSource.title}`);

 const analysisRequest = {
  work_id: String(workspace.currentSource.id),
  work_title: String(workspace.currentSource.title || 'Unknown'),
  author: String(workspace.currentSource.author || 'Unknown'),
  segments: segmentsWithText.map(seg => ({
    id: String(seg.id),
    name: String(seg.name),
    start_line: Number(seg.start_line),
    end_line: Number(seg.end_line),
    text: String(seg.text),
    lines: Array.isArray(seg.lines) ? seg.lines.map(l => String(l)) : []
  })),
  
  // FIX: Map segmentation mode to valid backend values
  segment_type: mapSegmentationType(workspace.segmentationMode),
  view_mode: analyze.selectedStrategy || 'standard',
  use_ai_enhancement: false,
  run_full_pipeline: true
  };
  console.log('🔍 Current segmentationMode:', workspace.segmentationMode);


  // DETAILED LOGGING BEFORE API CALL
  console.log('📤 Analysis Request:', {
    work_id: analysisRequest.work_id,
    work_title: analysisRequest.work_title,
    author: analysisRequest.author,
    segment_count: analysisRequest.segments.length,
    segment_type: analysisRequest.segment_type,
    view_mode: analysisRequest.view_mode,
    use_ai_enhancement: analysisRequest.use_ai_enhancement,
    run_full_pipeline: analysisRequest.run_full_pipeline,
    first_segment: analysisRequest.segments[0], // Log first segment for inspection
  });

  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: true } });

  try {
    const job = await api.startAnalysis(analysisRequest);
    
    console.log(`✅ Analysis job created: ${job.job_id}`);
    
          
      dispatch({
        type: ACTIONS.START_ANALYSIS,
        payload: job,
      });

      addNotification('info', `Analysis started: ${job.segments_count} segments`);

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getJobStatus(job.job_id);
          
          dispatch({
            type: ACTIONS.UPDATE_JOB_PROGRESS,
            payload: {
              progress: status.progress || 0,
              currentSegment: status.current_segment || 0,
              status: status.status,
            },
          });

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            
            const result = await api.getJobResults(job.job_id);
            const patterns = transformResultsToPatterns(result);
            
            dispatch({ 
              type: ACTIONS.SET_RESULTS, 
              payload: {
                patterns: patterns,
                lastJobId: job.job_id
              }
            });
            
            dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'results' });
            dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
            
            addNotification('success', `Analysis complete: ${patterns.length} results`);
          }
          else if (status.status === 'failed') {
            clearInterval(pollInterval);
            dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
            addNotification('error', 'Analysis failed: ' + (status.error || 'Unknown error'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
          addNotification('error', 'Failed to check status: ' + error.message);
        }
      }, 2000);

    } catch (error) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
      addNotification('error', 'Failed to start analysis: ' + error.message);
    }
  }, [state, addNotification]);

  const exportResults = useCallback((format = 'json') => {
    const jobId = state.analyze.currentJob?.job_id || state.results.lastJobId;
    
    if (!jobId) {
      addNotification('warning', 'No results to export');
      return;
    }

    try {
      api.downloadResults(jobId, format);
      addNotification('success', `Downloading results as ${format.toUpperCase()}...`);
    } catch (error) {
      addNotification('error', 'Export failed: ' + error.message);
    }
  }, [state, addNotification]);

  // ==================== ALL useEffect HOOKS AFTER CALLBACKS ====================
  useEffect(() => {
    async function initializeApp() {
      console.log('🚀 Initializing Merlin App...');

      try {
        const health = await api.healthCheck();
        console.log('✅ API connection established:', health);
        
        addNotification('success', `Connected to backend - ${health.authors_count} authors available`, {
          duration: 3000,
        });
      } catch (error) {
        console.error('❌ API connection failed:', error);
        addNotification('error', 'Failed to connect to API. Please ensure the backend is running.', {
          duration: 10000,
        });
      }

      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'authors', value: true } });
      try {
        const authors = await api.getAuthors();
        console.log(`✅ Loaded ${authors.length} authors`);
        dispatch({ type: ACTIONS.SET_AUTHORS, payload: authors });
      } catch (error) {
        console.error('Failed to load authors:', error);
        addNotification('error', 'Failed to load author library');
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'authors', value: false } });
      }
    }

    initializeApp();
  }, [addNotification]);

  useEffect(() => {
    async function restoreLatestResults() {
      console.log('🔍 Checking for latest completed analysis...');
      
      try {
        const allJobs = await api.getAllJobs();
        const completedJobs = allJobs.filter(job => job.status === 'completed');
        
        if (completedJobs.length === 0) {
          console.log('📭 No completed jobs found');
          return;
        }

        const latestJob = completedJobs.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0];

        console.log('✅ Found latest job:', latestJob.job_id);

        const result = await api.getJobResults(latestJob.job_id);
        const patterns = transformResultsToPatterns(result);
        
        console.log(`✅ Restored ${patterns.length} patterns`);
        
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
        if (!error.message.includes('404')) {
          console.error('❌ Error restoring latest results:', error);
        }
      }
    }
    
    const timer = setTimeout(restoreLatestResults, 1500);
    return () => clearTimeout(timer);
  }, [addNotification]);

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

  // ==================== CONTEXT VALUE ====================
  const value = {
  state,
  dispatch,
  api,
  // Existing functions
  addNotification,
  toggleModal,
  selectAuthor,
  loadWork,
  saveWorkText,
  createAutoSegmentation,
  saveSegmentation,
  loadSegmentation,
  deleteSegmentation,
  startAnalysis,
  exportResults,
  // New advanced analysis functions
  analyzeStatisticalImprobability,
  analyzeEntityClustering,
  getSpoilageDistribution,
  extractThematicLayers,
  compareWorks,
  // Multi-edition functions
  analyzeMultiEdition,
  compareEditions,
  // Interactive analysis
  suggestLetters,
  chatWithAI,
  reconstructGibberish,
  // Batch & export
  exportToSheets,
  getProgressDashboard,
};

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}


function transformResultsToPatterns(result) {
  if (!result || !result.segments) {
    return [];
  }

  return result.segments
    .filter(segment => {
      const decodings = segment.decoding_results?.top_decodings || [];
      return decodings.length > 0;
    })
    .map((segment, idx) => {
      const decodings = segment.decoding_results?.top_decodings || [];
      const topDecoding = decodings[0] || {};
      
      const credibleDecodings = decodings.filter(d => 
        (d.quality_score || 0) >= 0.7 || d.tier === "CREDIBLE"
      );

      return {
        id: segment.segment_id || `segment_${idx}`,
        rank: idx + 1,
        segment_id: segment.segment_id,
        section_name: segment.segment_name || `Segment ${idx + 1}`,
        is_encoded: segment.anomaly_detection?.is_anomalous || false,
        composite_score: Math.round((segment.anomaly_detection?.anomaly_score || 0) * 100),
        
        // THESE ARE THE CRITICAL ADDITIONS:
        segment_info: segment.segment_info || {
          id: segment.segment_id,
          name: segment.segment_name || `Segment ${idx + 1}`,
          text: segment.segment_info?.text || segment.original_text || '',
          lines: segment.segment_info?.lines || [],
          start_line: segment.segment_info?.start_line,
          end_line: segment.segment_info?.end_line
        },
        
        original_text: segment.segment_info?.text || segment.original_text || '',
        
        // Add anomaly_detection
        anomaly_detection: segment.anomaly_detection || {},
        
        // Add decoding_results
        decoding_results: segment.decoding_results || {},
        
        // Add cipher_detection
        cipher_detection: segment.cipher_detection || {},
        
        scores: {
          composite: Math.round((segment.anomaly_detection?.anomaly_score || 0) * 100),
          detection: Math.round((segment.anomaly_detection?.detection_confidence || 0) * 100),
          confidence: segment.decoding_results?.confidence || 0
        },
        candidates: decodings,
        credible_candidates: credibleDecodings,
        best_candidate: topDecoding,
        entities_detected: decodings.flatMap(d => d.entities || []),
        themes: segment.themes || [],
        classification: segment.classification || 'UNKNOWN',
        signal_breakdown: segment.signal_breakdown || {},
        metadata: {
          author: result.author || 'Unknown',
          work_title: result.work_title || 'Unknown',
          work_id: result.work_id || 'unknown',
          section_id: segment.segment_id,
          detection_score: segment.anomaly_detection?.anomaly_score || 0,
          has_credible: credibleDecodings.length > 0
        }
      };
    });
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

// Convenience hook for all API methods
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
  };
}

// Hook for notifications
export function useNotifications() {
  const { addNotification, state } = useAppState();
  return {
    addNotification,
    notifications: state.ui.notifications,
  };
}