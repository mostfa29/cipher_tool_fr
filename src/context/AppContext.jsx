// context/AppContext.jsx

import React, { createContext, useReducer, useEffect, useCallback, useContext, useRef } from 'react';
import { INITIAL_STATE } from './initialState';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export const AppContext = createContext();


// Map frontend segmentation modes to backend enum values
function mapSegmentationType(mode) {
  const segmentTypeMap = {
    'manual': 'sentence',
    'paragraph': 'paragraph',
    'sentence': 'sentence',
    'title': 'title',
    'clause': 'clause',
    'fixed': 'fixed_length',
    'fixed_length': 'fixed_length',
    '2line_pairs': '2line_pairs',
    'two_line_pairs': '2line_pairs',
    'ai_statistical': 'ai_statistical',  // NEW
  };
  
  return segmentTypeMap[mode] || 'paragraph';
}
// ==================== CONFIGURATION ====================
// const API_BASE_URL = 'http://localhost:8000'
const API_BASE_URL = 'http://192.99.245.215:8000'

// ==================== API CLIENT ====================
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

// ============================================================================
// EXACT FIX for ERR_CONNECTION_RESET issue in AppContext.jsx
// ============================================================================
// Location: Line 30-90, inside the APIClient.request() method
// Problem: Backend connection resets after 200 OK, before sending response body
// Solution: Add timeout and better error handling for connection reset

// REPLACE THIS SECTION (around line 47-58):

async request(endpoint, options = {}) {
  const url = `${this.baseURL}${endpoint}`;
  
  console.log('🌐 API Request:', {
    method: options.method || 'GET',
    url: url,
    bodyLength: options.body?.length
  });
  
  // ADD: Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 120 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal  // ADD: Connect abort signal
    });

    clearTimeout(timeoutId);  // ADD: Clear timeout on success

    console.log('🌐 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  
  console.error('❌ API Error Details:', {
    endpoint,
    status: response.status,
    statusText: response.statusText,
    error: error,
    detail: error.detail,
    body: error.body
  });
  
  if (error.detail && Array.isArray(error.detail)) {
    console.error('📋 Validation Errors:');
    error.detail.forEach(err => {
      console.error(`  - ${err.loc?.join('.')}: ${err.msg} (type: ${err.type})`);
    });
  }
  
  // ✅ FIX: Properly stringify error.detail if it's an object
  let errorMessage;
  if (typeof error.detail === 'string') {
    errorMessage = error.detail;
  } else if (error.detail && typeof error.detail === 'object') {
    errorMessage = JSON.stringify(error.detail);
  } else {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }
  
  throw new Error(errorMessage);
}

    const data = await response.json();
    console.log('🌐 API Response Data:', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);  // ADD: Clear timeout on error
    
    // ADD: Better error messages for different error types
    if (error.name === 'AbortError') {
      console.error(`❌ API Timeout [${endpoint}]: Request exceeded 120 seconds`);
      throw new Error(`Request timeout after 120s. Backend may still be processing. Endpoint: ${endpoint}`);
    }
    
    if (error.message === 'Failed to fetch') {
      console.error(`❌ Network Error [${endpoint}]: Connection failed or was reset`);
      throw new Error(`Network error: Connection to backend failed. Check if backend is running at ${this.baseURL}`);
    }
    
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
}


// MINI-MERLIN 2026 ENDPOINTS
createMiniMerlinSession() {
  return this.request('/api/mini-merlin/session/create', {
    method: 'POST',
  });
}

// In APIClient class (around line 150)
miniMerlinAIChat(sessionId, message, conversationHistory = []) {
  return this.request(`/api/mini-merlin/session/${sessionId}/ai-chat`, {
    method: 'POST',
    body: JSON.stringify({
      message: message,
      conversation_history: conversationHistory
    }),
  });
}
loadTextIntoMiniMerlin(text, sessionId = null) {
  return this.request('/api/mini-merlin/session/load-text', {
    method: 'POST',
    body: JSON.stringify({
      text: text,
      session_id: sessionId
    }),
  });
}

updateMiniMerlinScratchPad(sessionId, text) {
  return this.request('/api/mini-merlin/session/update-scratch', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      text: text
    }),
  });
}
getMiniMerlinSuggestions(sessionId, sentenceId, minLength = 4, maxResults = 10000, rawMode = true) {
  // ✅ FIX: sentenceId is now REQUIRED
  if (!sentenceId) {
    throw new Error('sentence_id is required to get suggestions');
  }
  
  // FIX #4: Increased maxResults to 10000
  // FIX #5: Added rawMode parameter (default true = no statistical bias)
  // FIX #2: minLength defaults to 4 (filters garbage words)
  return this.request(
    `/api/mini-merlin/session/${sessionId}/suggestions?sentence_id=${sentenceId}&min_length=${minLength}&max_results=${maxResults}&raw_mode=${rawMode}`
  );
}
setMiniMerlinRawMode(sessionId, enabled = true) {
  // FIX #5: Toggle raw mode for unbiased results
  return this.request(`/api/mini-merlin/session/${sessionId}/set-raw-mode`, {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}



getMiniMerlinSolutions(sessionId, sentenceId, maxWordsPerSolution = 10, maxResults = 50, timeout = 10) {
  // ✅ FIX: sentenceId is now REQUIRED
  if (!sentenceId) {
    throw new Error('sentence_id is required to get solutions');
  }
  
  return this.request(
    `/api/mini-merlin/session/${sessionId}/solutions?sentence_id=${sentenceId}&max_words_per_solution=${maxWordsPerSolution}&max_results=${maxResults}&timeout=${timeout}`
  );
}
addMiniMerlinNote(sessionId, text, tags = null) {
  return this.request('/api/mini-merlin/session/note/add', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      text: text,
      tags: tags
    }),
  });
}

deleteMiniMerlinNote(sessionId, noteId) {
  return this.request(`/api/mini-merlin/session/${sessionId}/note/${noteId}`, {
    method: 'DELETE',
  });
}

getMiniMerlinNotes(sessionId) {
  return this.request(`/api/mini-merlin/session/${sessionId}/notes`);
}

getMiniMerlinSessionState(sessionId) {
  return this.request(`/api/mini-merlin/session/${sessionId}/state`);
}
getMiniMerlinSession(sessionId) {
  return this.request(`/api/mini-merlin/session/${sessionId}`);
}
exportMiniMerlinSession(sessionId, format = 'csv') {
  // Don't use the request method - direct download
  const url = `${this.baseURL}/api/mini-merlin/session/${sessionId}/export?format=${format}`;
  
  // Create invisible link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
  
  return Promise.resolve({ success: true });
}

listMiniMerlinSessions() {
  return this.request('/api/mini-merlin/sessions/list');
}

deleteMiniMerlinSession(sessionId) {
  return this.request(`/api/mini-merlin/session/${sessionId}`, {
    method: 'DELETE',
  });
}
// ANAGRAM SOLVER ENDPOINTS
getAnagramSuggestions(sourceText, mode = "interactive", maxSuggestions = 20) {
  return this.request('/api/anagram/suggest', {
    method: 'POST',
    body: JSON.stringify({
      source_text: sourceText,
      mode: mode,
      use_ai: false,
      target_entities: [],
      max_suggestions: maxSuggestions
    }),
  });
}

getAIAnagramSuggestions(sourceText, targetEntities = [], maxSuggestions = 10) {
  return this.request('/api/anagram/ai-suggest', {
    method: 'POST',
    body: JSON.stringify({
      source_text: sourceText,
      mode: "interactive",
      use_ai: true,
      target_entities: targetEntities,
      max_suggestions: maxSuggestions
    }),
  });
}

explainAnagram(solution, sourceText, spoilage = "") {
  return this.request('/api/anagram/explain', {
    method: 'POST',
    body: JSON.stringify({
      solution: solution,
      source_text: sourceText,
      spoilage: spoilage
    }),
  });
}

validateAnagram(sourceText, proposedSolution) {
  return this.request('/api/anagram/validate', {
    method: 'POST',
    body: JSON.stringify({
      source_text: sourceText,
      proposed_solution: proposedSolution
    }),
  });
}

getAnagramStats() {
  return this.request('/api/anagram/stats');
}

batchAnagramSuggestions(sourceTexts, useAI = false, maxSuggestionsPerText = 10) {
  return this.request('/api/anagram/batch', {
    method: 'POST',
    body: JSON.stringify({
      source_texts: sourceTexts,
      use_ai: useAI,
      max_suggestions_per_text: maxSuggestionsPerText
    }),
  });
}

uploadWorkFile(file, authorFolder, workTitle, date, isNewAuthor = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('author_folder', authorFolder);
  formData.append('work_title', workTitle);
  formData.append('date', date);
  formData.append('is_new_author', isNewAuthor.toString());
  
  // Special handling for file upload - don't add Content-Type header
  return fetch(`${this.baseURL}/api/corpus/upload`, {
    method: 'POST',
    body: formData, // FormData automatically sets Content-Type with boundary
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Upload failed: ${response.statusText}`);
    }
    return response.json();
  });
}

// Get list of all authors for the upload dropdown
getAuthorsForUpload() {
  return this.request('/api/corpus/authors');
}

  getAllResults() {
    return this.request('/api/results/list');
  }

// In the APIClient class (around line 30-100), add this method:

uploadResultToDrive(resultId) {
  return this.request(`/api/results/${resultId}/upload-to-drive`, {
    method: 'POST',
  });
}
  autosaveSession(sessionId, tabState) {
  return this.request(`/api/sessions/${sessionId}/autosave`, {
    method: 'POST',
    body: JSON.stringify({
      tab_state: tabState
    }),
  });
}

  getResultDetails(resultId) {
    return this.request(`/api/results/${resultId}`);
  }

  getLatestResult() {
    return this.request('/api/results/latest');
  }

  addSentenceToSession(sessionId, text, name = null) {
  return this.request(`/api/mini-merlin/session/${sessionId}/sentence/add`, {
    method: 'POST',
    body: JSON.stringify({
      text: text,
      name: name
    }),
  });
}

updateSentence(sessionId, sentenceId, scratchPad, name = null) {
  return this.request(`/api/mini-merlin/session/${sessionId}/sentence/${sentenceId}`, {
    method: 'PUT',
    body: JSON.stringify({
      scratch_pad: scratchPad,
      name: name
    }),
  });
}

deleteSentence(sessionId, sentenceId) {
  return this.request(`/api/mini-merlin/session/${sessionId}/sentence/${sentenceId}`, {
    method: 'DELETE',
  });
}

saveSentenceSolution(sessionId, sentenceId, solutionText, solutionType = 'manual', metadata = {}) {
  return this.request(`/api/mini-merlin/session/${sessionId}/sentence/${sentenceId}/solution/save`, {
    method: 'POST',
    body: JSON.stringify({
      solution_text: solutionText,
      solution_type: solutionType,
      metadata: metadata
    }),
  });
}


  deleteResult(resultId) {
    return this.request(`/api/results/${resultId}`, {
      method: 'DELETE',
    });
  }

  // Session Management
createSession(sessionData) {
  return this.request('/api/sessions/create', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });
}

listSessions() {
  return this.request('/api/sessions/list');
}

getSession(sessionId) {
  return this.request(`/api/sessions/${sessionId}`);
}

deleteSession(sessionId) {
  return this.request(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

updateSession(sessionId, updates) {
  return this.request(`/api/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

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

analyzeMultiEdition(request) {
  console.log('🔥 API: analyzeMultiEdition called with:', request);
  return this.request('/api/analysis/multi-edition', {
    method: 'POST',
    body: JSON.stringify(request),
  }).then(response => {
    console.log('🔥 API: analyzeMultiEdition response:', response);
    return response;
  }).catch(error => {
    console.error('🔥 API: analyzeMultiEdition error:', error);
    throw error;
  });
}


createAISegmentation(workId, authorFolder, options = {}) {
  return this.request('/api/segmentation/auto-create', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      author_folder: authorFolder,
      use_statistical: options.useStatistical !== false,
      min_anomaly_score: options.minAnomalyScore || 3,
      length_mode: options.lengthMode || 'variable',  // NEW: 'ultra_short', 'short', 'medium', 'long', 'variable', 'title_focused', 'custom'
      custom_lengths: options.customLengths || null,  // NEW: [50, 100, 200] etc
      overlap: options.overlap || 0                   // NEW: character overlap
    }),
  });
}

analyzeSegmentsWithAI(workId, options = {}) {
  return this.request('/api/segmentation/ai-analyze', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      max_segments: options.maxSegments || 20,
      min_anomaly_score: options.minAnomalyScore || 3  // NEW: uses detector scoring
    }),
  });
}

prioritizeSegmentsWithAI(workId, options = {}) {
  return this.request('/api/segmentation/ai-prioritize', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      max_segments: options.maxSegments || 50,
      min_score: options.minScore || 3  // NEW: uses detector scoring
    }),
  });
}


getWorkEditions(authorFolder, workId) {
  return this.request(`/api/corpus/work/${authorFolder}/${workId}/editions`);
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
chatWithAI(message, conversationHistory = [], context = {}) {
  return this.request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: message,
      conversation_history: conversationHistory,
      work_id: context.work_id,
      author: context.author,
      work_title: context.work_title,
      current_results: context.current_results,
      job_id: context.job_id,
      command: context.command,
      command_data: context.command_data
    }),
  });
}

// Enhanced AI Chat with full context


// Enhance decoded text with AI
enhanceDecodeWithAI(decodedText, mode = 'standard') {
  return this.request('/api/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({
      decoded_text: decodedText,
      mode: mode
    }),
  });
}

// AI letter arrangement suggestions
suggestLetterArrangements(partialDecode, remainingLetters, targetEntities = [], maxSuggestions = 10) {
  return this.request('/api/ai/suggest-letters', {
    method: 'POST',
    body: JSON.stringify({
      partial_decode: partialDecode,
      remaining_letters: remainingLetters,
      target_entities: targetEntities,
      max_suggestions: maxSuggestions,
      aggressiveness: 0.5
    }),
  });
}

// Propose and evaluate research hypothesis
proposeHypothesis(hypothesis, evidence, workId = null, author = null, confidence = 0.5) {
  return this.request('/api/ai/propose-hypothesis', {
    method: 'POST',
    body: JSON.stringify({
      hypothesis: hypothesis,
      evidence: evidence,
      work_id: workId,
      author: author,
      initial_confidence: confidence
    }),
  });
}

// Synthesize comprehensive research narrative
synthesizeNarrative(workId, author, includeNetwork = true, includeTimeline = true) {
  return this.request('/api/ai/synthesize-narrative', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      author: author,
      include_network: includeNetwork,
      include_timeline: includeTimeline
    }),
  });
}

// AI-powered edition comparison
compareEditionsWithAI(edition1Id, edition2Id, authorFolder, analysisMode = 'differential') {
  return this.request('/api/ai/compare-editions', {
    method: 'POST',
    body: JSON.stringify({
      edition1_id: edition1Id,
      edition2_id: edition2Id,
      author_folder: authorFolder,
      analysis_mode: analysisMode
    }),
  });
}

// Build entity relationship network
buildEntityNetwork(workId, author, includeClusters = true, minCooccurrence = 2) {
  return this.request('/api/ai/build-entity-network', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      author: author,
      include_clusters: includeClusters,
      min_cooccurrence: minCooccurrence
    }),
  });
}

// Export comprehensive research report
exportResearchReport(workId, author, includeNarrative = true, includeNetwork = true, includeRawData = false, format = 'markdown') {
  return this.request('/api/ai/export-report', {
    method: 'POST',
    body: JSON.stringify({
      work_id: workId,
      author: author,
      include_narrative: includeNarrative,
      include_network: includeNetwork,
      include_raw_data: includeRawData,
      format: format
    }),
  });
}

// Download research report
downloadResearchReport(filename) {
  return this.request(`/api/ai/download-report/${filename}`);
}

// Get AI model statistics
getAIModelStats() {
  return this.request('/api/ai/model-stats');
}

// Clear AI cache
clearAICache() {
  return this.request('/api/ai/clear-cache', {
    method: 'POST',
  });
}

// Deep AI analysis of specific segment
analyzeSegmentWithAI(segmentId, segmentText, decodeResults, question = null) {
  return this.request('/api/ai/analyze-segment', {
    method: 'POST',
    body: JSON.stringify({
      segment_id: segmentId,
      segment_text: segmentText,
      decode_results: decodeResults,
      question: question
    }),
  });
}

// Reconstruct gibberish text
reconstructGibberish(gibberishText, maxReconstructions = 5) {
  return this.request('/api/ai/reconstruct-gibberish', {
    method: 'POST',
    body: JSON.stringify({
      gibberish_text: gibberishText,
      max_reconstructions: maxReconstructions
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

getWorkContent(authorFolder, editionId, baseWorkId = null) {
  // editionId is the specific edition to load (e.g., "01_tcp_1570_A Bull Granted")
  // baseWorkId is optional, used for tracking the primary work
  const actualId = editionId;
  return this.request(`/api/corpus/work/${encodeURIComponent(authorFolder)}/${encodeURIComponent(actualId)}`);
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
    const url = `${this.baseURL}/api/batch/export/${jobId}`;
    // window.open(url, '_blank');
  }

  healthCheck() {
    return this.request('/health');
  }
}

const api = new APIClient(API_BASE_URL);

// ==================== ACTION TYPES ====================
export const ACTIONS = {
  // Authors & Works
  // Around line 200 in ACTIONS
SET_MINI_MERLIN_AI_CHAT: 'SET_MINI_MERLIN_AI_CHAT',
SET_MINI_MERLIN_RAW_MODE: 'SET_MINI_MERLIN_RAW_MODE',

ADD_MINI_MERLIN_AI_MESSAGE: 'ADD_MINI_MERLIN_AI_MESSAGE',
CLEAR_MINI_MERLIN_AI_CHAT: 'CLEAR_MINI_MERLIN_AI_CHAT',
TOGGLE_MINI_MERLIN_AI: 'TOGGLE_MINI_MERLIN_AI',
  SET_AUTHORS: 'SET_AUTHORS',
  SET_SELECTED_AUTHOR: 'SET_SELECTED_AUTHOR',
  SET_UPLOAD_PROGRESS: 'SET_UPLOAD_PROGRESS',
  CLEAR_UPLOAD_PROGRESS: 'CLEAR_UPLOAD_PROGRESS',
  SET_AVAILABLE_WORKS: 'SET_AVAILABLE_WORKS',
  SET_SELECTED_WORK: 'SET_SELECTED_WORK',
  SET_AI_CHAT_HISTORY: 'SET_AI_CHAT_HISTORY',
  CLEAR_AI_CHAT_HISTORY: 'CLEAR_AI_CHAT_HISTORY',
  SET_AI_ENHANCEMENT: 'SET_AI_ENHANCEMENT',
  SET_LETTER_SUGGESTIONS: 'SET_LETTER_SUGGESTIONS',
  SET_HYPOTHESIS_EVALUATION: 'SET_HYPOTHESIS_EVALUATION',
  SET_RESEARCH_NARRATIVE: 'SET_RESEARCH_NARRATIVE',
  SET_ENTITY_NETWORK: 'SET_ENTITY_NETWORK',
  SET_AI_EDITION_COMPARISON: 'SET_AI_EDITION_COMPARISON',
  SET_SEGMENT_AI_ANALYSIS: 'SET_SEGMENT_AI_ANALYSIS',
  SET_AI_MODEL_STATS: 'SET_AI_MODEL_STATS',
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  SET_ANAGRAM_SUGGESTIONS: 'SET_ANAGRAM_SUGGESTIONS',
SET_AI_ANAGRAM_SUGGESTIONS: 'SET_AI_ANAGRAM_SUGGESTIONS',
SET_ANAGRAM_EXPLANATION: 'SET_ANAGRAM_EXPLANATION',
SET_ANAGRAM_VALIDATION: 'SET_ANAGRAM_VALIDATION',
SET_ANAGRAM_STATS: 'SET_ANAGRAM_STATS',
SET_BATCH_ANAGRAM_RESULTS: 'SET_BATCH_ANAGRAM_RESULTS',
UPDATE_SESSION_TAB_STATE: 'UPDATE_SESSION_TAB_STATE',
  SET_CURRENT_MINI_MERLIN_SESSION: 'SET_CURRENT_MINI_MERLIN_SESSION',
  UPDATE_MINI_MERLIN_SESSION: 'UPDATE_MINI_MERLIN_SESSION',
  UPDATE_MINI_MERLIN_SCRATCH_PAD: 'UPDATE_MINI_MERLIN_SCRATCH_PAD',
  SET_MINI_MERLIN_SUGGESTIONS: 'SET_MINI_MERLIN_SUGGESTIONS',
  SET_MINI_MERLIN_SOLUTIONS: 'SET_MINI_MERLIN_SOLUTIONS',
  ADD_MINI_MERLIN_NOTE: 'ADD_MINI_MERLIN_NOTE',
  DELETE_MINI_MERLIN_NOTE: 'DELETE_MINI_MERLIN_NOTE',
  SET_MINI_MERLIN_NOTES: 'SET_MINI_MERLIN_NOTES',
  SET_MINI_MERLIN_SESSION_STATE: 'SET_MINI_MERLIN_SESSION_STATE',
  SET_MINI_MERLIN_SESSIONS_LIST: 'SET_MINI_MERLIN_SESSIONS_LIST',
  DELETE_MINI_MERLIN_SESSION: 'DELETE_MINI_MERLIN_SESSION',
  CLEAR_MINI_MERLIN_SESSION: 'CLEAR_MINI_MERLIN_SESSION',

CLEAR_CURRENT_SESSION: 'CLEAR_CURRENT_SESSION',

  UPDATE_ANALYSIS_JOB: 'UPDATE_ANALYSIS_JOB',



  SET_MULTI_EDITION_CONFIG: 'SET_MULTI_EDITION_CONFIG',
  CLEAR_MULTI_EDITION_CONFIG: 'CLEAR_MULTI_EDITION_CONFIG',
  
  // Workspace
  SET_ACTIVE_SOURCE: 'SET_ACTIVE_SOURCE',
  SET_SEGMENTS: 'SET_SEGMENTS',
  SET_BOUNDARIES: 'SET_BOUNDARIES',
  SET_SEGMENTATION_MODE: 'SET_SEGMENTATION_MODE',
  TOGGLE_BOUNDARY: 'TOGGLE_BOUNDARY',
  LOAD_SAVED_SEGMENTATION: 'LOAD_SAVED_SEGMENTATION',
  CLEAR_WORKSPACE: 'CLEAR_WORKSPACE',

  SET_AI_SEGMENTATION_RESULT: 'SET_AI_SEGMENTATION_RESULT',
  SET_AI_SEGMENT_ANALYSIS: 'SET_AI_SEGMENT_ANALYSIS',
  SET_AI_PRIORITIZATION: 'SET_AI_PRIORITIZATION',
  
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
    case ACTIONS.SET_MINI_MERLIN_RAW_MODE:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      rawMode: action.payload,
    },
  };

      case ACTIONS.SET_MINI_MERLIN_AI_CHAT:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      aiChatHistory: action.payload,
    },
  };

case ACTIONS.ADD_MINI_MERLIN_AI_MESSAGE:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      aiChatHistory: [...(state.miniMerlin.aiChatHistory || []), action.payload],
    },
  };

case ACTIONS.CLEAR_MINI_MERLIN_AI_CHAT:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      aiChatHistory: [],
    },
  };

case ACTIONS.TOGGLE_MINI_MERLIN_AI:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      aiEnabled: action.payload,
    },
  };
      case ACTIONS.SET_CURRENT_SESSION:
  return {
    ...state,
    session: {
      ...state.session,
      current: action.payload,
      isActive: true
    }
  };
 
case ACTIONS.SET_ANAGRAM_SUGGESTIONS:
  return {
    ...state,
    anagram: {
      ...state.anagram || {},
      suggestions: action.payload,
    },
  };

case ACTIONS.SET_AI_ANAGRAM_SUGGESTIONS:
  return {
    ...state,
    anagram: {
      ...state.anagram || {},
      aiSuggestions: action.payload,
    },
  };

case ACTIONS.SET_ANAGRAM_EXPLANATION:
  return {
    ...state,
    anagram: {
      ...state.anagram || {},
      explanation: action.payload,
    },
  };

case ACTIONS.SET_ANAGRAM_VALIDATION:
  return {
    ...state,
    anagram: {
      ...state.anagram || {},
      validation: action.payload,
    },
  };

case ACTIONS.SET_ANAGRAM_STATS:
  return {
    ...state,
    anagram: {
      ...state.anagram || {},
      stats: action.payload,
    },
  };

case ACTIONS.SET_BATCH_ANAGRAM_RESULTS:
  return {
    ...state,
    anagram: {
      ...state.anagram || {},
      batchResults: action.payload,
    },
  };

case ACTIONS.UPDATE_SESSION_TAB_STATE:
  return {
    ...state,
    session: {
      ...state.session,
      tabStates: {
        ...state.session.tabStates,
        [action.payload.tab]: action.payload.state
      }
    }
  };

case ACTIONS.CLEAR_CURRENT_SESSION:
  return {
    ...state,
    session: INITIAL_STATE.session
  };
        case ACTIONS.SET_AI_CHAT_HISTORY:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          aiChatHistory: action.payload,
        },
      };
    
    case ACTIONS.CLEAR_AI_CHAT_HISTORY:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          aiChatHistory: [],
        },
      };
    
    case ACTIONS.SET_AI_ENHANCEMENT:
      return {
        ...state,
        results: {
          ...state.results,
          aiEnhancement: action.payload,
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
    
    case ACTIONS.SET_HYPOTHESIS_EVALUATION:
      return {
        ...state,
        results: {
          ...state.results,
          hypothesisEvaluation: action.payload,
        },
      };
    
    case ACTIONS.SET_RESEARCH_NARRATIVE:
      return {
        ...state,
        results: {
          ...state.results,
          researchNarrative: action.payload,
        },
      };
    
    case ACTIONS.SET_ENTITY_NETWORK:
      return {
        ...state,
        results: {
          ...state.results,
          entityNetwork: action.payload,
        },
      };
    
    case ACTIONS.SET_AI_EDITION_COMPARISON:
      return {
        ...state,
        results: {
          ...state.results,
          aiEditionComparison: action.payload,
        },
      };
    
    case ACTIONS.SET_SEGMENT_AI_ANALYSIS:
      return {
        ...state,
        results: {
          ...state.results,
          segmentAIAnalysis: action.payload,
        },
      };
    
    case ACTIONS.SET_AI_MODEL_STATS:
      return {
        ...state,
        ui: {
          ...state.ui,
          aiModelStats: action.payload,
        },
      };

    
    case ACTIONS.CLEAR_AI_CHAT_HISTORY:
      return {
        ...state,
        analyze: {
          ...state.analyze,
          aiChatHistory: [],
        },
      };
    
    case ACTIONS.SET_AI_ENHANCEMENT:
      return {
        ...state,
        results: {
          ...state.results,
          aiEnhancement: action.payload,
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
    
    case ACTIONS.SET_HYPOTHESIS_EVALUATION:
      return {
        ...state,
        results: {
          ...state.results,
          hypothesisEvaluation: action.payload,
        },
      };
    
    case ACTIONS.SET_RESEARCH_NARRATIVE:
      return {
        ...state,
        results: {
          ...state.results,
          researchNarrative: action.payload,
        },
      };
    
    case ACTIONS.SET_ENTITY_NETWORK:
      return {
        ...state,
        results: {
          ...state.results,
          entityNetwork: action.payload,
        },
      };
    
    case ACTIONS.SET_AI_EDITION_COMPARISON:
      return {
        ...state,
        results: {
          ...state.results,
          aiEditionComparison: action.payload,
        },
      };
    
    case ACTIONS.SET_SEGMENT_AI_ANALYSIS:
      return {
        ...state,
        results: {
          ...state.results,
          segmentAIAnalysis: action.payload,
        },
      };
    
    case ACTIONS.SET_AI_MODEL_STATS:
      return {
        ...state,
        ui: {
          ...state.ui,
          aiModelStats: action.payload,
        },
      };
    case ACTIONS.UPDATE_ANALYSIS_JOB:
  return {
    ...state,
    analyze: {
      ...state.analyze,
      currentJob: {
        ...state.analyze.currentJob,
        ...action.payload,
      },
    },
  };
case ACTIONS.SET_MULTI_EDITION_CONFIG:
  return {
    ...state,
    workspace: {
      ...state.workspace,
      multiEditionConfig: action.payload,
    },
  };

case ACTIONS.CLEAR_MULTI_EDITION_CONFIG:
  return {
    ...state,
    workspace: {
      ...state.workspace,
      multiEditionConfig: null,
    },
  };
    // Add to appReducer function:

  case ACTIONS.SET_AI_SEGMENTATION_RESULT:
    return {
      ...state,
      workspace: {
        ...state.workspace,
        aiSegmentationResult: action.payload,
      },
    };

  case ACTIONS.SET_AI_SEGMENT_ANALYSIS:
    return {
      ...state,
      workspace: {
        ...state.workspace,
        aiSegmentAnalysis: action.payload,
      },
    };

  case ACTIONS.SET_AI_PRIORITIZATION:
    return {
      ...state,
      workspace: {
        ...state.workspace,
        aiPrioritization: action.payload,
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

case ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      currentSession: action.payload,
    },
  };


  case ACTIONS.UPDATE_MINI_MERLIN_SCRATCH_PAD:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      currentSession: {
        ...state.miniMerlin.currentSession,
        scratch_pad: action.payload,
      },
    },
  };

case ACTIONS.SET_MINI_MERLIN_SUGGESTIONS:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      suggestions: action.payload,
    },
  };

case ACTIONS.SET_MINI_MERLIN_SOLUTIONS:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      solutions: action.payload,
    },
  };

case ACTIONS.ADD_MINI_MERLIN_NOTE:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      notes: [...state.miniMerlin.notes, action.payload],
    },
  };

case ACTIONS.DELETE_MINI_MERLIN_NOTE:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      notes: state.miniMerlin.notes.filter(n => n.id !== action.payload.noteId),
    },
  };

case ACTIONS.SET_MINI_MERLIN_NOTES:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      notes: action.payload.notes || [],
    },
  };


case ACTIONS.SET_MINI_MERLIN_SESSIONS_LIST:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      sessionsList: action.payload.sessions || [],
    },
  };

case ACTIONS.DELETE_MINI_MERLIN_SESSION:
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      sessionsList: state.miniMerlin.sessionsList.filter(
        s => s.session_id !== action.payload.sessionId
      ),
      currentSession: state.miniMerlin.currentSession?.session_id === action.payload.sessionId
        ? null
        : state.miniMerlin.currentSession,
    },
  };

case ACTIONS.CLEAR_MINI_MERLIN_SESSION:
  return {
    ...state,
    miniMerlin: INITIAL_STATE.miniMerlin,
  };

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
  console.log('🔥 REDUCER: START_ANALYSIS called with payload:', action.payload);
  let newState = {
    ...state,
    analyze: {
      ...state.analyze,
      currentJob: {
        id: action.payload.job_id,
        job_id: action.payload.job_id,
        status: 'processing',  // ← Change from 'queued' to 'processing'
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
  console.log('🔥 REDUCER: New currentJob:', newState.analyze.currentJob);
  return newState;
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
case ACTIONS.UPDATE_MINI_MERLIN_SESSION:
  console.log('🔧 REDUCER: UPDATE_MINI_MERLIN_SESSION', action.payload);
  
  // Build the new session state from the payload
  const updatedSessionState = {
    original_pool: action.payload.original_pool_str || state.miniMerlin.sessionState?.original_pool || '',
    current_pool: action.payload.current_pool_str || action.payload.original_pool_str || state.miniMerlin.sessionState?.current_pool || '',
    used_letters: action.payload.scratch_pad || '',
    spoilage: action.payload.spoilage || 0,
    letters_remaining: action.payload.pool_size || action.payload.remaining_letters || 0
  };
  
  console.log('🔧 REDUCER: New sessionState:', updatedSessionState);
  
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      currentSession: {
        ...state.miniMerlin.currentSession,
        ...action.payload,
      },
      sessionState: updatedSessionState  // ← CRITICAL: Always update sessionState
    },
  };
case ACTIONS.SET_MINI_MERLIN_SESSION_STATE:
  console.log('🔧 REDUCER: SET_MINI_MERLIN_SESSION_STATE', action.payload);
  
  return {
    ...state,
    miniMerlin: {
      ...state.miniMerlin,
      sessionState: action.payload,
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

// Around line 1500
const miniMerlinAIChat = useCallback(async (message) => {
  const currentSession = state.miniMerlin?.currentSession;
  
  if (!currentSession?.session_id) {
    addNotification('error', 'No active session');
    return null;
  }
  
  try {
    const conversationHistory = state.miniMerlin?.aiChatHistory || [];
    
    // Add user message to history
    dispatch({
      type: ACTIONS.ADD_MINI_MERLIN_AI_MESSAGE,
      payload: { role: 'user', content: message, timestamp: Date.now() }
    });
    
    const result = await api.miniMerlinAIChat(
      currentSession.session_id,
      message,
      conversationHistory
    );
    
    // Add AI response to history
    dispatch({
      type: ACTIONS.ADD_MINI_MERLIN_AI_MESSAGE,
      payload: { role: 'assistant', content: result.response, timestamp: Date.now() }
    });
    
    return result.response;
  } catch (error) {
    addNotification('error', 'AI chat failed: ' + error.message);
    throw error;
  }
}, [state.miniMerlin, addNotification, api, dispatch]);

const clearMiniMerlinAIChat = useCallback(() => {
  dispatch({ type: ACTIONS.CLEAR_MINI_MERLIN_AI_CHAT });
}, [dispatch]);

const toggleMiniMerlinAI = useCallback((enabled) => {
  dispatch({ type: ACTIONS.TOGGLE_MINI_MERLIN_AI, payload: enabled });
}, [dispatch]);
const addSentenceToSession = useCallback(async (text, name = null) => {
  // ✅ FIX: Get currentSession from state
  const currentSession = state.miniMerlin?.currentSession;
  
  if (!currentSession?.session_id) {
    addNotification('error', 'No active session');
    return;
  }
  
  try {
    const result = await api.addSentenceToSession(currentSession.session_id, text, name);
    
    // Update session in state
    const updatedSession = await api.getMiniMerlinSession(currentSession.session_id);
    dispatch({ 
      type: ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION, 
      payload: updatedSession.session 
    });
    
    addNotification('success', 'Sentence added to session');
    return result.sentence;
  } catch (error) {
    addNotification('error', 'Failed to add sentence: ' + error.message);
    throw error;
  }
}, [state.miniMerlin, addNotification, api, dispatch]); // ✅ FIX: Add state.miniMerlin to dependencies
const updateSentence = useCallback(async (sentenceId, scratchPad, name = null) => {
  // ✅ FIX: Get currentSession from state
  const currentSession = state.miniMerlin?.currentSession;
  
  if (!currentSession?.session_id) {
    addNotification('error', 'No active session');
    return;
  }
  
  try {
    const result = await api.updateSentence(
      currentSession.session_id, 
      sentenceId, 
      scratchPad, 
      name
    );
    
    // Refresh session
    const updatedSession = await api.getMiniMerlinSession(currentSession.session_id);
    dispatch({ 
      type: ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION, 
      payload: updatedSession.session 
    });
    
    return result.sentence;
  } catch (error) {
    addNotification('error', 'Failed to update sentence: ' + error.message);
    throw error;
  }
}, [state.miniMerlin, addNotification, api, dispatch]); // ✅ FIX: Add state.miniMerlin to dependencies
const deleteSentence = useCallback(async (sentenceId) => {
  // ✅ FIX: Get currentSession from state
  const currentSession = state.miniMerlin?.currentSession;
  
  if (!currentSession?.session_id) {
    addNotification('error', 'No active session');
    return;
  }
  
  try {
    await api.deleteSentence(currentSession.session_id, sentenceId);
    
    // Refresh session
    const updatedSession = await api.getMiniMerlinSession(currentSession.session_id);
    dispatch({ 
      type: ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION, 
      payload: updatedSession.session 
    });
    
    addNotification('success', 'Sentence deleted');
  } catch (error) {
    addNotification('error', 'Failed to delete sentence: ' + error.message);
    throw error;
  }
}, [state.miniMerlin, addNotification, api, dispatch]); // ✅ FIX: Add state.miniMerlin to dependencies
const saveSentenceSolution = useCallback(async (sentenceId, solutionText, type = 'manual', metadata = {}) => {
  // ✅ FIX: Get currentSession from state
  const currentSession = state.miniMerlin?.currentSession;
  
  if (!currentSession?.session_id) {
    addNotification('error', 'No active session');
    return;
  }
  
  try {
    const result = await api.saveSentenceSolution(
      currentSession.session_id,
      sentenceId,
      solutionText,
      type,
      metadata
    );
    
    // Refresh session
    const updatedSession = await api.getMiniMerlinSession(currentSession.session_id);
    dispatch({ 
      type: ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION, 
      payload: updatedSession.session 
    });
    
    addNotification('success', 'Solution saved');
    return result.solution;
  } catch (error) {
    addNotification('error', 'Failed to save solution: ' + error.message);
    throw error;
  }
}, [state.miniMerlin, addNotification, api, dispatch]); // ✅ FIX: Add state.miniMerlin to dependencies
const getMiniMerlinSession = useCallback(async (sessionId) => {
  try {
    const result = await api.getMiniMerlinSession(sessionId);
    
    // Update current session
    dispatch({ 
      type: ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION, 
      payload: result.session
    });
    
    // Update session state
    dispatch({
      type: ACTIONS.SET_MINI_MERLIN_SESSION_STATE,
      payload: {
        original_pool: result.session.original_pool_str,
        current_pool: result.session.current_pool_str,
        used_letters: result.session.scratch_pad,
        spoilage: result.session.spoilage || 0,
        letters_remaining: result.session.remaining_letters || 0
      }
    });
    
    return result.session;
  } catch (error) {
    addNotification('error', 'Failed to load session: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);
const createMiniMerlinSession = useCallback(async () => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlin', value: true } });
    
    const result = await api.createMiniMerlinSession();
    
    dispatch({ 
      type: ACTIONS.SET_CURRENT_MINI_MERLIN_SESSION, 
      payload: result 
    });
    
    addNotification('success', 'Mini-Merlin session created');
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to create Mini-Merlin session: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlin', value: false } });
  }
}, [api, addNotification, dispatch]);

// In AppContext.jsx, in the loadTextIntoMiniMerlin function, add logging:

const loadTextIntoMiniMerlin = useCallback(async (text, sessionId = null) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlinLoad', value: true } });
    
    const result = await api.loadTextIntoMiniMerlin(text, sessionId);
    
    console.log('🔥 API RESPONSE:', result); // ← ADD THIS
    console.log('🔥 Pool string:', result.pool_string); // ← ADD THIS
    console.log('🔥 Pool size:', result.pool_size); // ← ADD THIS
    
    // Update session data
    dispatch({ 
      type: ACTIONS.UPDATE_MINI_MERLIN_SESSION, 
      payload: {
        session_id: result.session_id,
        original_text: result.original_text,
        original_pool_str: result.pool_string,
        pool_size: result.pool_size,
        scratch_pad: '',
        current_words: []
      }
    });
    
    // ✅ FIX: Also set session state for components to use
    dispatch({
      type: ACTIONS.SET_MINI_MERLIN_SESSION_STATE,
      payload: {
        original_pool: result.pool_string,
        current_pool: result.pool_string,
        used_letters: '',
        spoilage: 0,
        letters_remaining: result.pool_size
      }
    });
    
    addNotification('success', `Loaded ${result.pool_size} letters into pool`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to load text: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlinLoad', value: false } });
  }
}, [api, addNotification, dispatch]);
// FIXED: updateMiniMerlinScratchPad
const updateMiniMerlinScratchPad = useCallback(async (sessionId, text) => {
  try {
    const result = await api.updateMiniMerlinScratchPad(sessionId, text);
    
    // Backend returns: { success, scratch_pad, spoilage, remaining_letters, remaining_pool, error }
    if (!result.success) {
      addNotification('warning', result.error || 'Invalid letters used');
      return result;
    }
    
    dispatch({ 
      type: ACTIONS.UPDATE_MINI_MERLIN_SESSION, 
      payload: {
        scratch_pad: result.scratch_pad,
        spoilage: result.spoilage,
        remaining_letters: result.remaining_letters,
        current_pool_str: result.remaining_pool
      }
    });
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to update scratch pad: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);

const getMiniMerlinSuggestions = useCallback(async (sessionId, sentenceId, minLength = 4, maxResults = 10000, rawMode = true) => {
  // ✅ FIX: Validate sentenceId is provided
  if (!sentenceId) {
    addNotification('error', 'No sentence selected. Please select a sentence first.');
    return { success: false, count: 0, suggestions: [] };
  }
  
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlinSuggestions', value: true } });
    
    // Use rawMode from state if not explicitly provided
    const effectiveRawMode = rawMode ?? state.miniMerlin?.rawMode ?? true;
    
    console.log(`🔍 Getting suggestions for sentence: ${sentenceId}`);
    console.log(`   Settings: minLength=${minLength}, maxResults=${maxResults}, rawMode=${effectiveRawMode}`);
    
    // FIX #4: maxResults now 10000 (was 100)
    // FIX #5: rawMode parameter added
    // FIX #2: minLength defaults to 4 (filters garbage)
    const result = await api.getMiniMerlinSuggestions(sessionId, sentenceId, minLength, maxResults, effectiveRawMode);
    
    // Backend returns: { success, count, suggestions, sentence_id, sentence_name, raw_mode }
    dispatch({ 
      type: ACTIONS.SET_MINI_MERLIN_SUGGESTIONS, 
      payload: {
        suggestions: result.suggestions || [],
        count: result.count || 0,
        sentence_id: result.sentence_id,
        sentence_name: result.sentence_name,
        rawMode: result.raw_mode,
        minLength: result.min_length,
        maxResults: result.max_results
      }
    });
    
    console.log(`✅ Got ${result.count} suggestions for "${result.sentence_name}"`);
    console.log(`   Raw mode: ${result.raw_mode ? 'ON (unbiased)' : 'OFF (statistical scoring)'}`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to get suggestions: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlinSuggestions', value: false } });
  }
}, [api, addNotification, dispatch, state.miniMerlin?.rawMode]);
const setMiniMerlinRawMode = useCallback(async (enabled = true) => {
  const currentSession = state.miniMerlin?.currentSession;
  
  if (!currentSession?.session_id) {
    addNotification('error', 'No active session');
    return null;
  }
  
  try {
    console.log(`🔧 Setting raw mode to: ${enabled ? 'ON (unbiased)' : 'OFF (statistical scoring)'}`);
    
    const result = await api.setMiniMerlinRawMode(currentSession.session_id, enabled);
    
    // Update state
    dispatch({
      type: ACTIONS.SET_MINI_MERLIN_RAW_MODE,
      payload: enabled
    });
    
    const modeDesc = enabled ? 'Raw mode (unbiased results)' : 'Smart mode (statistical scoring)';
    addNotification('success', `Switched to ${modeDesc}`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to set raw mode: ' + error.message);
    throw error;
  }
}, [state.miniMerlin, addNotification, api, dispatch]);

// FIXED: getMiniMerlinSolutions - now requires sentenceId
const getMiniMerlinSolutions = useCallback(async (sessionId, sentenceId, maxWordsPerSolution = 10, maxResults = 50, timeout = 10) => {
  // ✅ FIX: Validate sentenceId is provided
  if (!sentenceId) {
    addNotification('error', 'No sentence selected. Please select a sentence first.');
    return { success: false, count: 0, solutions: [] };
  }
  
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlinSolutions', value: true } });
    
    console.log(`🔍 Getting solutions for sentence: ${sentenceId}`);
    
    const result = await api.getMiniMerlinSolutions(sessionId, sentenceId, maxWordsPerSolution, maxResults, timeout);
    
    // ✅ FIX: Dispatch solutions to state with sentence metadata
    dispatch({ 
      type: ACTIONS.SET_MINI_MERLIN_SOLUTIONS, 
      payload: {
        solutions: result.solutions || [],
        count: result.count || 0,
        complete_count: result.complete_count || 0,
        partial_count: result.partial_count || 0,
        sentence_id: result.sentence_id,
        sentence_name: result.sentence_name,
        metadata: result.metadata
      }
    });
    
    console.log(`✅ Got ${result.count} solutions for "${result.sentence_name}"`);
    console.log(`   Complete: ${result.complete_count}, Partial: ${result.partial_count}`);
    
    addNotification('success', `Found ${result.count} solutions (${result.complete_count} complete, ${result.partial_count} partial)`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to get solutions: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'miniMerlinSolutions', value: false } });
  }
}, [api, addNotification, dispatch]);
// FIXED: addMiniMerlinNote
const addMiniMerlinNote = useCallback(async (sessionId, text, tags = null) => {
  try {
    const result = await api.addMiniMerlinNote(sessionId, text, tags);
    
    // Backend returns: { success, note: {id, text, tags, created_at} }
    dispatch({ 
      type: ACTIONS.ADD_MINI_MERLIN_NOTE, 
      payload: result.note
    });
    
    addNotification('success', 'Note added');
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to add note: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);

// FIXED: getMiniMerlinNotes - Handle 404 gracefully since endpoint doesn't exist yet
const getMiniMerlinNotes = useCallback(async (sessionId) => {
  try {
    const result = await api.getMiniMerlinNotes(sessionId);
    
    // Backend returns: { notes: [...] }
    dispatch({ 
      type: ACTIONS.SET_MINI_MERLIN_NOTES, 
      payload: {
        notes: result.notes || []
      }
    });
    
    return result;
  } catch (error) {
    // If 404, endpoint doesn't exist yet - silently set empty notes
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.log('ℹ️  Notes endpoint not yet implemented, using empty notes');
      dispatch({ 
        type: ACTIONS.SET_MINI_MERLIN_NOTES, 
        payload: { notes: [] }
      });
      return { notes: [] };
    }
    
    // For other errors, show notification
    addNotification('error', 'Failed to get notes: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);
// FIXED: listMiniMerlinSessions - Handle 404 gracefully
const listMiniMerlinSessions = useCallback(async () => {
  try {
    const result = await api.listMiniMerlinSessions();
    
    // Backend returns: { success, sessions: [...], total }
    dispatch({ 
      type: ACTIONS.SET_MINI_MERLIN_SESSIONS_LIST, 
      payload: {
        sessions: result.sessions || []
      }
    });
    
    return result;
  } catch (error) {
    // If 404, endpoint doesn't exist yet - silently set empty sessions
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.log('ℹ️  Sessions list endpoint not yet implemented, using empty list');
      dispatch({ 
        type: ACTIONS.SET_MINI_MERLIN_SESSIONS_LIST, 
        payload: { sessions: [] }
      });
      return { sessions: [], total: 0 };
    }
    
    // For other errors, show notification
    addNotification('error', 'Failed to list sessions: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);

const deleteMiniMerlinNote = useCallback(async (sessionId, noteId) => {
  try {
    const result = await api.deleteMiniMerlinNote(sessionId, noteId);
    
    dispatch({ 
      type: ACTIONS.DELETE_MINI_MERLIN_NOTE, 
      payload: { noteId } 
    });
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to delete note: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);


const exportMiniMerlinSession = useCallback(async (sessionId, filename) => {
  try {
    const result = await api.exportMiniMerlinSession(sessionId, filename);
    
    addNotification('success', `Session exported to ${filename}`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to export session: ' + error.message);
    throw error;
  }
}, [api, addNotification]);


const deleteMiniMerlinSession = useCallback(async (sessionId) => {
  try {
    await api.deleteMiniMerlinSession(sessionId);
    
    dispatch({ 
      type: ACTIONS.DELETE_MINI_MERLIN_SESSION, 
      payload: { sessionId } 
    });
    
    addNotification('success', 'Session deleted');
  } catch (error) {
    addNotification('error', 'Failed to delete session: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);

const getMiniMerlinSessionState = useCallback(async (sessionId) => {
  try {
    const result = await api.getMiniMerlinSessionState(sessionId);
    
    dispatch({ 
      type: ACTIONS.SET_MINI_MERLIN_SESSION_STATE, 
      payload: result 
    });
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to get session state: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);

const clearMiniMerlinSession = useCallback(() => {
  dispatch({ type: ACTIONS.CLEAR_MINI_MERLIN_SESSION });
  addNotification('info', 'Mini-Merlin session cleared');
}, [dispatch, addNotification]);



const getAnagramSuggestions = useCallback(async (sourceText, maxSuggestions = 20) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'anagramSuggestions', value: true } });
    
    const result = await api.getAnagramSuggestions(sourceText, 'interactive', maxSuggestions);
    
    dispatch({ type: ACTIONS.SET_ANAGRAM_SUGGESTIONS, payload: result });
    
    addNotification('success', `Found ${result.complete_suggestions.length} anagram suggestions`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to get anagram suggestions: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'anagramSuggestions', value: false } });
  }
}, [api, addNotification, dispatch]);

const getAIAnagramSuggestions = useCallback(async (sourceText, targetEntities = [], maxSuggestions = 10) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiAnagramSuggestions', value: true } });
    
    console.log('🤖 Requesting AI anagram suggestions:', {
      sourceText: sourceText.slice(0, 50),
      targetEntities,
      maxSuggestions
    });
    
    const result = await api.getAIAnagramSuggestions(sourceText, targetEntities, maxSuggestions);
    
    dispatch({ type: ACTIONS.SET_AI_ANAGRAM_SUGGESTIONS, payload: result });
    
    addNotification('success', `AI generated ${result.ai_suggestions.length} suggestions`);
    
    return result;
  } catch (error) {
    console.error('AI anagram error:', error);
    addNotification('error', 'Failed to get AI anagram suggestions: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiAnagramSuggestions', value: false } });
  }
}, [api, addNotification, dispatch]);

const explainAnagram = useCallback(async (solution, sourceText, spoilage = "") => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'anagramExplanation', value: true } });
    
    const result = await api.explainAnagram(solution, sourceText, spoilage);
    
    dispatch({ type: ACTIONS.SET_ANAGRAM_EXPLANATION, payload: result });
    
    addNotification('success', 'Anagram explanation generated');
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to explain anagram: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'anagramExplanation', value: false } });
  }
}, [api, addNotification, dispatch]);

const validateAnagram = useCallback(async (sourceText, proposedSolution) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'anagramValidation', value: true } });
    
    const result = await api.validateAnagram(sourceText, proposedSolution);
    
    dispatch({ type: ACTIONS.SET_ANAGRAM_VALIDATION, payload: result });
    
    if (result.valid) {
      const spoilageStr = result.spoilage.length > 0 
        ? ` (${result.spoilage.length} letters unused)`
        : ' (Perfect match!)';
      
      addNotification('success', `Valid anagram${spoilageStr}`);
    } else {
      addNotification('error', `Invalid: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to validate anagram: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'anagramValidation', value: false } });
  }
}, [api, addNotification, dispatch]);

const getAnagramStats = useCallback(async () => {
  try {
    const result = await api.getAnagramStats();
    
    dispatch({ type: ACTIONS.SET_ANAGRAM_STATS, payload: result });
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to load anagram stats: ' + error.message);
    throw error;
  }
}, [api, addNotification, dispatch]);

const batchAnagramSuggestions = useCallback(async (sourceTexts, useAI = false, maxSuggestionsPerText = 10) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'batchAnagrams', value: true } });
    
    const result = await api.batchAnagramSuggestions(sourceTexts, useAI, maxSuggestionsPerText);
    
    dispatch({ type: ACTIONS.SET_BATCH_ANAGRAM_RESULTS, payload: result });
    
    addNotification('success', `Processed ${result.processed} texts with anagram analysis`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to process batch anagrams: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'batchAnagrams', value: false } });
  }
}, [api, addNotification, dispatch]);

const uploadWorkFile = useCallback(async (file, options = {}) => {
  const {
    authorFolder,
    workTitle,
    date = 'Unknown',
    isNewAuthor = false
  } = options;
  
  // Validate inputs
  if (!file) {
    addNotification('error', 'No file selected');
    return null;
  }
  
  if (!authorFolder || !workTitle) {
    addNotification('error', 'Author and work title are required');
    return null;
  }
  
  // Validate file type
  const validExtensions = ['.txt', '.text'];
  const fileName = file.name.toLowerCase();
  const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValidFile) {
    addNotification('error', 'Only .txt files are supported');
    return null;
  }
  
  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    addNotification('error', 'File too large. Maximum size: 10MB');
    return null;
  }
  
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'upload', value: true } });
  
  try {
    console.log('📤 Uploading file:', {
      name: file.name,
      size: file.size,
      author: authorFolder,
      work: workTitle,
      isNewAuthor
    });
    
    const result = await api.uploadWorkFile(
      file,
      authorFolder,
      workTitle,
      date,
      isNewAuthor
    );
    
    console.log('✅ Upload successful:', result);
    
    // Show success notification with details
    const message = isNewAuthor
      ? `Created new author "${authorFolder}" and uploaded "${workTitle}"`
      : `Uploaded "${workTitle}" to ${authorFolder}`;
    
    addNotification('success', message, {
      duration: 5000
    });
    
    // If uploaded to existing author, refresh works list
    if (!isNewAuthor && state.library.selectedAuthor === authorFolder) {
      console.log('🔄 Refreshing works list...');
      const works = await api.getWorksByAuthor(authorFolder);
      dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: works });
    }
    
    // If uploaded to new author, refresh authors list
    if (isNewAuthor) {
      console.log('🔄 Refreshing authors list...');
      const authors = await api.getAuthors();
      dispatch({ type: ACTIONS.SET_AUTHORS, payload: authors });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Upload error:', error);
    addNotification('error', 'Upload failed: ' + error.message, {
      duration: 5000
    });
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'upload', value: false } });
  }
}, [state.library.selectedAuthor, addNotification, api, dispatch]);

const getAuthorsForUpload = useCallback(async () => {
  try {
    const authors = await api.getAuthorsForUpload();
    return authors.map(author => ({
      value: author.folder_name,
      label: author.name,
      workCount: author.work_count
    }));
  } catch (error) {
    console.error('Failed to load authors for upload:', error);
    addNotification('error', 'Failed to load authors');
    return [];
  }
}, [addNotification, api]);

const uploadResultToDrive = useCallback(async (resultId) => {
  try {
    console.log('📤 Auto-uploading result to Drive:', resultId);
    
    const result = await api.uploadResultToDrive(resultId);
    
    if (result.status === 'already_uploaded') {
      console.log('✅ Result already in Drive:', result.drive_upload.file_id);
      addNotification('info', 'Result already uploaded to Drive', {
        duration: 2000
      });
    } else if (result.status === 'uploaded') {
      console.log('✅ Uploaded to Drive:', result.drive_upload.file_id);
      addNotification('success', 'Result uploaded to Google Drive', {
        duration: 3000
      });
    } else {
      console.warn('⚠️  Upload failed but file is saved locally');
      addNotification('warning', 'Drive upload failed, but file saved locally', {
        duration: 3000
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Drive upload error:', error);
    // Don't show error notification - upload is optional
    return null;
  }
}, [addNotification, api]);

const listSessions = useCallback(async () => {
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'sessions', value: true } });
  
  try {
    const response = await api.listSessions();
    console.log(`📋 Loaded ${response.sessions.length} sessions`);
    return response.sessions;  // ← RETURN response.sessions, not response
  } catch (error) {
    addNotification('error', 'Failed to load sessions: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'sessions', value: false } });
  }
}, [addNotification, api, dispatch]);

const deleteSession = useCallback(async (sessionId) => {
  try {
    await api.deleteSession(sessionId);
    addNotification('success', 'Session deleted');
  } catch (error) {
    addNotification('error', 'Failed to delete session: ' + error.message);
    throw error;
  }
}, [addNotification, api]);
  // Advanced Analysis Functions
// Auto-save debouncer
const autoSaveTimerRef = useRef(null);

const autoSaveSession = useCallback(async (tabState) => {
  const currentSession = state.session?.current;
  if (!currentSession || !state.session?.autoSaveEnabled) return;
  
  // Debounce auto-saves
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
  }
  
  autoSaveTimerRef.current = setTimeout(async () => {
    try {
      await api.autosaveSession(currentSession.session_id, tabState);
      console.log('✅ Auto-saved session');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 2000); // Save after 2 seconds of inactivity
}, [state.session, api]);

const createSession = useCallback(async (name, notes = '', sessionData = {}) => {
  const currentWork = sessionData.work || state.workspace?.currentSource;
  const currentSegments = sessionData.work?.segments || state.workspace?.segments || [];
  
  if (!currentWork) {
    addNotification('error', 'No work loaded');
    return null;
  }
  
  // Load selected results
  let selectedPatterns = [];
  
  if (sessionData.selectedResults && sessionData.selectedResults.length > 0) {
    for (const resultId of sessionData.selectedResults) {
      try {
        if (resultId === 'current') {
          // Use current loaded results
          selectedPatterns = state.results?.patterns || [];
        } else {
          // Load result from API
          const result = await api.getResultDetails(resultId);
          
          // Transform based on type
          if (result.is_multi_edition) {
            const allPatterns = [];
            for (const [editionId, editionData] of Object.entries(result.editions || {})) {
              if (!editionData.error) {
                const editionPatterns = transformEditionToPatterns(editionData, result);
                allPatterns.push(...editionPatterns);
              }
            }
            selectedPatterns.push(...allPatterns);
          } else {
            const patterns = transformResultsToPatterns(result);
            selectedPatterns.push(...patterns);
          }
        }
      } catch (error) {
        console.error(`Failed to load result ${resultId}:`, error);
      }
    }
  }
  
  try {
    const result = await api.createSession({
      name,
      work_id: currentWork.id,
      work_title: currentWork.title,
      author: currentWork.author,
      author_folder: currentWork.author_folder,
      result_id: state.results.lastJobId,
      segments: currentSegments,
      selected_patterns: selectedPatterns.map(p => p.id),
      
      // Save all tab states
      chat_messages: state.session.tabStates.chat.messages || [],
      hypothesis_state: state.session.tabStates.hypothesis || null,
      narrative_state: state.session.tabStates.narrative || null,
      edition_comparison_state: state.session.tabStates.compare || null,
      segment_analysis_state: state.session.tabStates.segment || null,
      report_config: state.session.tabStates.report?.config || null,
      
      hypotheses: [],
      entity_network: null,
      last_tab: state.session.lastTab || 'chat',
      notes,
      
      // NEW: Store selected results metadata
      selected_results_metadata: sessionData.selectedResults || []
    });
    
    // Set as current session
    dispatch({
      type: ACTIONS.SET_CURRENT_SESSION,
      payload: {
        ...result.session,
        loaded_patterns: selectedPatterns  // Store patterns in memory
      }
    });
    
    addNotification('success', `Session created: ${name} (${selectedPatterns.length} patterns)`);
    return result.session;
  } catch (error) {
    addNotification('error', 'Failed to create session: ' + error.message);
    throw error;
  }
}, [state, addNotification, api, dispatch]);

// Update the loadWork function to properly handle edition_count:

const loadWork = useCallback(async (authorFolder, workId, selectedEdition = null) => {
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: true } });
  
  try {
    // Determine which edition to load
    const editionToLoad = selectedEdition?.id || workId;
    
    console.log(`📖 Loading work: ${workId}${selectedEdition ? ` (Edition: ${selectedEdition.date})` : ''}`);
    
    // Load the edition content
    const content = await api.getWorkContent(authorFolder, editionToLoad);
    console.log(`✅ Loaded work: ${content.title} (${content.line_count} lines)`);
    
    // Get the original work from availableWorks to preserve edition_count
    const originalWork = state.library.availableWorks.find(w => w.id === workId);
    
    // Cancel any running analysis
    dispatch({ type: ACTIONS.CANCEL_ANALYSIS });
    
    // Set active source with edition metadata AND edition_count preserved
    dispatch({ 
      type: ACTIONS.SET_ACTIVE_SOURCE, 
      payload: {
        ...content,
        author_folder: authorFolder,
        base_work_id: workId, // Store the base work ID (primary edition ID)
        edition_count: originalWork?.edition_count || 1,  // ← PRESERVE THIS!
        selected_edition: selectedEdition || {
          id: editionToLoad,
          date: content.date,
          isPrimary: editionToLoad === workId
        }
      }
    });
    
    // Try to load saved segmentation for THIS SPECIFIC EDITION
    try {
      const segmentation = await api.getSegmentation(editionToLoad);
      if (segmentation?.segments?.length > 0) {
        console.log(`✅ Loaded saved segmentation: ${segmentation.segments.length} segments for edition ${editionToLoad}`);
        
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
        
        const editionLabel = selectedEdition ? ` for ${selectedEdition.date} edition` : '';
        addNotification('info', `Loaded ${segmentation.segments.length} segments${editionLabel}`);
      }
    } catch (err) {
      console.log(`ℹ️  No saved segmentation found for edition ${editionToLoad}`);
    }
    
    // Set selected work
    dispatch({ type: ACTIONS.SET_SELECTED_WORK, payload: content });
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
    
    const editionLabel = selectedEdition ? ` (${selectedEdition.date} edition)` : '';
    addNotification('success', `Loaded: ${content.title}${editionLabel}`);
    
    return content;
  } catch (error) {
    addNotification('error', 'Failed to load work: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: false } });
  }
}, [addNotification, api, dispatch, state.library.availableWorks]);
const loadSession = useCallback(async (sessionId) => {
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'session', value: true } });
  
  try {
    const session = await api.getSession(sessionId);
    
    console.log('📂 Loading session:', session.name);
    
    // 1. Load work
    await loadWork(session.author_folder, session.work_id);
    
    // 2. Load segments
    if (session.segments && session.segments.length > 0) {
      dispatch({
        type: ACTIONS.LOAD_SAVED_SEGMENTATION,
        payload: { segments: session.segments }
      });
    }
    
    // 3. Load results if available
    let loadedPatterns = [];
    
    if (session.selected_results_metadata && session.selected_results_metadata.length > 0) {
      // Load all selected results
      for (const resultId of session.selected_results_metadata) {
        try {
          if (resultId === 'current' && session.result_id) {
            const result = await api.getResultDetails(session.result_id);
            const patterns = result.is_multi_edition
              ? transformMultiEditionToPatterns(result)
              : transformResultsToPatterns(result);
            loadedPatterns.push(...patterns);
          } else if (resultId !== 'current') {
            const result = await api.getResultDetails(resultId);
            const patterns = result.is_multi_edition
              ? transformMultiEditionToPatterns(result)
              : transformResultsToPatterns(result);
            loadedPatterns.push(...patterns);
          }
        } catch (error) {
          console.warn('Could not load result:', resultId, error);
        }
      }
    } else if (session.result_id) {
      // Fallback to single result_id
      try {
        const result = await api.getResultDetails(session.result_id);
        loadedPatterns = result.is_multi_edition
          ? transformMultiEditionToPatterns(result)
          : transformResultsToPatterns(result);
      } catch (error) {
        console.warn('Could not load session results:', error);
      }
    }
    
    if (loadedPatterns.length > 0) {
      dispatch({
        type: ACTIONS.SET_RESULTS,
        payload: { patterns: loadedPatterns, lastJobId: session.result_id }
      });
    }
    
    // 4. Restore ALL tab states with history
    const tabStates = {
      chat: {
        messages: session.chat_messages || []
      },
      hypothesis: session.hypothesis_state || {
        hypothesis: '',
        evidence: [],
        result: null
      },
      narrative: session.narrative_state || {
        narrative: null,
        options: {},
        history: []  // ← ADD HISTORY
      },
      compare: session.edition_comparison_state || {
        edition1: null,
        edition2: null,
        comparison: null,
        history: []  // ← ADD HISTORY
      },
      segment: session.segment_analysis_state || {
        selectedSegment: null,
        question: '',
        analysis: null,
        history: []  // ← ADD HISTORY
      },
      report: {
        config: session.report_config || {},
        generated_reports: session.generated_reports || []  // ← ADD HISTORY
      }
    };
    
    // 5. Set current session with loaded patterns
    dispatch({
      type: ACTIONS.SET_CURRENT_SESSION,
      payload: {
        ...session,
        tabStates,
        lastTab: session.last_tab || 'chat',
        loaded_patterns: loadedPatterns  // Store in memory
      }
    });
    
    addNotification('success', `Loaded session: ${session.name} (${loadedPatterns.length} patterns)`);
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'results' });
    
    return session;
  } catch (error) {
    addNotification('error', 'Failed to load session: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'session', value: false } });
  }
}, [loadWork, addNotification, api, dispatch]);

const updateSessionTabState = useCallback((tab, newState) => {
  dispatch({
    type: ACTIONS.UPDATE_SESSION_TAB_STATE,
    payload: { tab, state: newState }
  });
  
  // Auto-save the change
  const tabStateUpdate = {
    [`${tab}_state`]: newState,
    last_tab: tab
  };
  autoSaveSession(tabStateUpdate);
}, [dispatch, autoSaveSession]);

const closeSession = useCallback(() => {
  dispatch({ type: ACTIONS.CLEAR_CURRENT_SESSION });
  addNotification('info', 'Session closed');
}, [dispatch, addNotification]);
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



const createAISegmentation = useCallback(async (options = {}) => {
  const currentSource = state.workspace.currentSource;
  if (!currentSource?.id) {
    addNotification('error', 'No work loaded');
    return;
  }

  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiSegmentation', value: true } });

  try {
    console.log('🔬 Starting statistical segmentation...', {
      lengthMode: options.lengthMode || 'variable',
      minAnomalyScore: options.minAnomalyScore || 3,
      overlap: options.overlap || 0
    });
    
    const response = await api.createAISegmentation(
      currentSource.id,
      currentSource.author_folder,
      {
        useStatistical: options.useStatistical !== false,
        minAnomalyScore: options.minAnomalyScore || 3,
        lengthMode: options.lengthMode || 'variable',      // NEW
        customLengths: options.customLengths || null,      // NEW
        overlap: options.overlap || 0                       // NEW
      }
    );
    
    const segmentation = response.segmentation;
    console.log(`✅ Statistical Segmentation: ${segmentation.segments.length} anomalous segments detected`);
    
    // Show metadata about segment lengths if available
    if (segmentation.metadata?.segment_lengths) {
      console.log(`📊 Segment lengths tested: ${segmentation.metadata.segment_lengths.join(', ')}`);
    }
    
    dispatch({ 
      type: ACTIONS.SET_AI_SEGMENTATION_RESULT, 
      payload: response 
    });
    
    dispatch({ 
      type: ACTIONS.LOAD_SAVED_SEGMENTATION, 
      payload: segmentation 
    });
    
    addNotification('success', 
      `Statistical analysis found ${segmentation.segments.length} anomalous segments`, 
      { duration: 5000 }
    );
    
    return response;
  } catch (error) {
    console.error('Statistical segmentation error:', error);
    addNotification('error', 'Statistical segmentation failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiSegmentation', value: false } });
  }
}, [state.workspace.currentSource, addNotification]);




// UPDATE analyzeSegmentsWithAI callback:

const analyzeSegmentsWithAI = useCallback(async (options = {}) => {
  const currentSource = state.workspace.currentSource;
  if (!currentSource?.id) {
    addNotification('error', 'No work loaded');
    return;
  }

  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiAnalysis', value: true } });

  try {
    console.log('📊 Running statistical analysis on segments...');
    
    const result = await api.analyzeSegmentsWithAI(currentSource.id, {
      maxSegments: options.maxSegments || 20,
      minAnomalyScore: options.minAnomalyScore || 3
    });
    
    dispatch({ 
      type: ACTIONS.SET_AI_SEGMENT_ANALYSIS, 
      payload: result 
    });
    
    const summary = result.summary || {};
    const highPriority = summary.high_priority || 0;
    const mediumPriority = summary.medium_priority || 0;
    const lowPriority = summary.low_priority || 0;
    
    console.log(`✅ Analysis complete:`, {
      high: highPriority,
      medium: mediumPriority,
      low: lowPriority
    });
    
    addNotification('success', 
      `Statistical analysis: ${highPriority} high-priority, ${mediumPriority} medium-priority segments`,
      { duration: 5000 }
    );
    
    return result;
  } catch (error) {
    console.error('Statistical analysis error:', error);
    addNotification('error', 'Statistical analysis failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiAnalysis', value: false } });
  }
}, [state.workspace.currentSource, addNotification]);

// UPDATE prioritizeSegmentsWithAI callback:

const prioritizeSegmentsWithAI = useCallback(async (options = {}) => {
  const currentSource = state.workspace.currentSource;
  if (!currentSource?.id) {
    addNotification('error', 'No work loaded');
    return;
  }

  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiPrioritization', value: true } });

  try {
    console.log('🎯 Prioritizing segments from database...');
    
    const result = await api.prioritizeSegmentsWithAI(currentSource.id, {
      maxSegments: options.maxSegments || 50,
      minScore: options.minScore || 3
    });
    
    dispatch({ 
      type: ACTIONS.SET_AI_PRIORITIZATION, 
      payload: result 
    });
    
    const summary = result.summary || {};
    console.log(`✅ Prioritization complete:`, summary);
    
    addNotification('success', 
      `Prioritized ${result.segments_evaluated || 0} segments from statistical database`,
      { duration: 4000 }
    );
    
    return result;
  } catch (error) {
    console.error('Prioritization error:', error);
    addNotification('error', 'Prioritization failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiPrioritization', value: false } });
  }
}, [state.workspace.currentSource, addNotification]);


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
// In AppProvider component, add this callback:

const analyzeMultiEdition = useCallback(async (request) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: true } });
    
    const result = await api.analyzeMultiEdition(request);
    
    dispatch({ 
      type: ACTIONS.SET_MULTI_EDITION_RESULTS, 
      payload: result 
    });
    
    addNotification('success', `✅ Multi-edition analysis complete: ${result.editions_analyzed} editions analyzed`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Multi-edition analysis failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
  }
}, [addNotification, api, dispatch]);

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

const chatWithAI = useCallback(async (message, options = {}) => {
  try {
    console.log('💬 AI Chat Request:', { message: message.slice(0, 100) });
    
    // Get current results
    let currentResults = state.results.patterns;
    
    // If no patterns in state, try to load from latest result
    if (!currentResults || currentResults.length === 0) {
      try {
        const latestResult = await api.getLatestResult();
        
        if (latestResult.is_multi_edition) {
          const allPatterns = [];
          for (const [editionId, editionData] of Object.entries(latestResult.editions || {})) {
            if (!editionData.error) {
              const editionPatterns = transformEditionToPatterns(editionData, latestResult);
              allPatterns.push(...editionPatterns);
            }
          }
          currentResults = allPatterns;
        } else {
          currentResults = transformResultsToPatterns(latestResult);
        }
      } catch (error) {
        console.error('Could not load latest result:', error);
        currentResults = [];
      }
    }
    
    // Extract work metadata from patterns
    let work_id = 'unknown';
    let author = 'Unknown';
    let work_title = 'Unknown';
    
    if (currentResults && currentResults.length > 0) {
      const metadata = currentResults[0].metadata || {};
      work_id = metadata.work_id || metadata.edition_id || 'unknown';
      author = metadata.author || 'Unknown';
      work_title = metadata.work_title || 'Unknown';
    }
    
    // Build conversation history
    const conversationHistory = (state.analyze.aiChatHistory || []).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: typeof msg.timestamp === 'number' 
        ? new Date(msg.timestamp).toISOString() 
        : msg.timestamp
    }));
    
    // Build context
    const context = {
      work_id,
      author,
      work_title,
      current_results: currentResults?.length > 0 ? {
        segments: currentResults.map(p => ({
          segment_info: {
            id: p.segment_id,
            name: p.section_name
          },
          decode_results: {
            final_ranking: [p.best_candidate].filter(Boolean).concat(
              (p.credible_candidates || []).slice(0, 4)
            ).map(c => ({
              method: c?.method || 'unknown',
              decoded_message: c?.decoded_message || '',
              confidence: c?.confidence || 0,
              entities: c?.entities || [],
              spoilage: c?.spoilage || 0
            }))
          }
        })).slice(0, 20),
        total_count: currentResults.length
      } : null,
      command: options.command,
      command_data: options.command_data
    };
    
    console.log('💬 Context:', {
      has_work: !!work_id && work_id !== 'unknown',
      has_results: !!context.current_results,
      results_count: context.current_results?.total_count || 0
    });
    
    // Call API
    const result = await api.chatWithAI(message, conversationHistory, context);
    
    // Update chat history
    dispatch({ 
      type: ACTIONS.UPDATE_AI_CHAT_HISTORY, 
      payload: { 
        role: 'user', 
        content: message, 
        timestamp: new Date().toISOString()
      }
    });
    
    dispatch({ 
      type: ACTIONS.UPDATE_AI_CHAT_HISTORY, 
      payload: { 
        role: 'assistant', 
        content: result.response, 
        timestamp: new Date().toISOString()
      }
    });
    
    return result;
  } catch (error) {
    console.error('AI chat error:', error);
    addNotification('error', `AI chat failed: ${error.message}`);
    throw error;
  }
}, [state.results.patterns, state.analyze.aiChatHistory, addNotification, api, dispatch]);


const enhanceDecodeWithAI = useCallback(async (decodedText, mode = 'standard') => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiEnhancement', value: true } });
    
    const result = await api.enhanceDecodeWithAI(decodedText, mode);
    
    dispatch({ type: ACTIONS.SET_AI_ENHANCEMENT, payload: result });
    
    addNotification('success', 'Decode enhanced successfully');
    
    return result;
  } catch (error) {
    addNotification('error', 'Enhancement failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'aiEnhancement', value: false } });
  }
}, [addNotification, api, dispatch]);


// AI letter arrangement suggestions
const suggestLetterArrangements = useCallback(async (partialDecode, remainingLetters, targetEntities = [], maxSuggestions = 10) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'letterSuggestions', value: true } });
    
    const result = await api.suggestLetterArrangements(
      partialDecode,
      remainingLetters,
      targetEntities,
      maxSuggestions
    );
    
    dispatch({ type: ACTIONS.SET_LETTER_SUGGESTIONS, payload: result });
    
    addNotification('success', `Generated ${result.suggestions?.length || 0} letter arrangements`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Letter suggestion failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'letterSuggestions', value: false } });
  }
}, [addNotification, api, dispatch]);

// Propose research hypothesis
const proposeHypothesis = useCallback(async (hypothesis, evidence, workId = null, author = null) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'hypothesis', value: true } });
    
    const result = await api.proposeHypothesis(hypothesis, evidence, workId, author);
    
    dispatch({ type: ACTIONS.SET_HYPOTHESIS_EVALUATION, payload: result });
    
    const score = result.plausibility_score || 0;
    addNotification('success', `Hypothesis evaluated: ${score}/100 plausibility`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Hypothesis evaluation failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'hypothesis', value: false } });
  }
}, [addNotification, api, dispatch]);

// Synthesize research narrative
const synthesizeNarrative = useCallback(async (workId, author, includeNetwork = true) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'narrative', value: true } });
    
    // CRITICAL FIX: Get current work from workspace
    const currentWork = state.workspace?.currentSource;
    
    if (!currentWork && !workId) {
      throw new Error('No work loaded. Please load a work in the Workspace first.');
    }
    
    // Use current work if no workId provided
    const actualWorkId = workId || currentWork?.id;
    const actualAuthor = author || currentWork?.author;
    
    // Check if we have results to synthesize
    const hasResults = (state.results?.patterns || []).length > 0;
    
    if (!hasResults) {
      addNotification('warning', 'No analysis results found. Run an analysis first for better narrative generation.');
    }
    
    console.log('🎨 Generating narrative for:', {
      work_id: actualWorkId,
      author: actualAuthor,
      title: currentWork?.title,
      has_results: hasResults,
      results_count: state.results?.patterns?.length || 0
    });
    
    // Call API with proper work_id and author
    const result = await api.synthesizeNarrative(
      actualWorkId,
      actualAuthor,
      includeNetwork
    );
    
    
    dispatch({ type: ACTIONS.SET_RESEARCH_NARRATIVE, payload: result });
    
    const wordCount = result.word_count || 0;
    addNotification('success', `Generated ${wordCount}-word research narrative`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Narrative synthesis failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'narrative', value: false } });
  }
}, [addNotification, api, dispatch]);

// AI edition comparison
const compareEditionsWithAI = useCallback(async (edition1Id, edition2Id, authorFolder, mode = 'differential') => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'editionComparison', value: true } });
    
    const result = await api.compareEditionsWithAI(edition1Id, edition2Id, authorFolder, mode);
    
    dispatch({ type: ACTIONS.SET_AI_EDITION_COMPARISON, payload: result });
    
    const intentionality = result.ai_interpretation?.intentionality_score || 0;
    addNotification('success', `Edition comparison complete: ${intentionality}/100 intentionality`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Edition comparison failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'editionComparison', value: false } });
  }
}, [addNotification, api, dispatch]);

// Build entity network
const buildEntityNetwork = useCallback(async (workId, author, includeClusters = true) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'entityNetwork', value: true } });
    
    const result = await api.buildEntityNetwork(workId, author, includeClusters, 2);
    
    dispatch({ type: ACTIONS.SET_ENTITY_NETWORK, payload: result });
    
    const nodeCount = result.statistics?.total_entities || 0;
    addNotification('success', `Built entity network: ${nodeCount} entities, ${result.statistics?.total_relationships || 0} relationships`);
    
    return result;
  } catch (error) {
    addNotification('error', 'Entity network build failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'entityNetwork', value: false } });
  }
}, [addNotification, api, dispatch]);

const exportResearchReport = useCallback(async (workId, author, options = {}) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'reportExport', value: true } });
    
    addNotification('info', 'Generating comprehensive research report...', {
      duration: 5000
    });
    
    const result = await api.exportResearchReport(
      workId,
      author,
      options.includeNarrative !== false,
      options.includeNetwork !== false,
      options.includeRawData || false,
      options.format || 'markdown'
    );
    
    addNotification('success', `Report generated: ${result.filename}`);
    
    // Trigger download
    if (result.download_url) {
      const downloadUrl = `${API_BASE_URL}${result.download_url}`;
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = result.filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
    
    return result;
  } catch (error) {
    addNotification('error', 'Report export failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'reportExport', value: false } });
  }
}, [addNotification, api, dispatch]);

// Analyze specific segment with AI
const analyzeSegmentWithAI = useCallback(async (segmentId, segmentText, decodeResults, question = null) => {
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'segmentAIAnalysis', value: true } });
    
    const result = await api.analyzeSegmentWithAI(segmentId, segmentText, decodeResults, question);
    
    dispatch({ type: ACTIONS.SET_SEGMENT_AI_ANALYSIS, payload: result });
    
    addNotification('success', 'Segment analysis complete');
    
    return result;
  } catch (error) {
    addNotification('error', 'Segment analysis failed: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'segmentAIAnalysis', value: false } });
  }
}, [addNotification, api, dispatch]);

// Get AI model statistics
const getAIModelStats = useCallback(async () => {
  try {
    const result = await api.getAIModelStats();
    
    dispatch({ type: ACTIONS.SET_AI_MODEL_STATS, payload: result });
    
    return result;
  } catch (error) {
    addNotification('error', 'Failed to load AI stats: ' + error.message);
    throw error;
  }
}, [addNotification, api, dispatch]);

// Clear AI cache
const clearAICache = useCallback(async () => {
  try {
    await api.clearAICache();
    
    addNotification('success', 'AI cache cleared');
  } catch (error) {
    addNotification('error', 'Failed to clear cache: ' + error.message);
    throw error;
  }
}, [addNotification, api]);

// Clear chat history
const clearAIChatHistory = useCallback(() => {
  dispatch({ type: ACTIONS.CLEAR_AI_CHAT_HISTORY });
  addNotification('info', 'Chat history cleared');
}, [addNotification, dispatch]);

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
    console.log('📊 Sample work data:', works[0]); // DEBUG: See what data we're getting
    
    // Check if backend is returning edition_count
    const hasEditionCount = works.some(w => w.edition_count !== undefined);
    console.log('📚 Works have edition_count?', hasEditionCount); // DEBUG
    
    if (!hasEditionCount) {
      console.warn('⚠️ Backend not returning edition_count, adding placeholder...');
      // If backend doesn't have it yet, add placeholder
      works.forEach(work => {
        work.edition_count = 1;
        work.has_multiple_editions = false;
      });
    }
    
    dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: works });
  } catch (error) {
    addNotification('error', 'Failed to load works: ' + error.message);
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: false } });
  }
}, [addNotification, api, dispatch]);

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

  // CRITICAL: Use the current edition's ID (not base_work_id)
  // This ensures each edition gets its own segmentation file
  const editionId = currentSource.selected_edition?.id || currentSource.id;
  
  const segmentationPayload = {
    work_id: editionId,  // ← Save with edition-specific ID!
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
      edition_id: editionId,
      base_work_id: currentSource.base_work_id,
      edition_date: currentSource.selected_edition?.date,
      is_primary: currentSource.selected_edition?.isPrimary,
      boundaries: boundaries,
      total_lines: currentSource.line_count || currentSource.lines?.length || 0
    }
  };

  console.log(`💾 Saving segmentation for edition: ${editionId}`);

  try {
    await api.saveSegmentation(segmentationPayload);
    dispatch({ type: ACTIONS.SET_UNSAVED_CHANGES, payload: false });
    
    const editionLabel = currentSource.selected_edition?.date 
      ? ` (${currentSource.selected_edition.date} edition)` 
      : '';
    
    addNotification('success', `Saved ${segmentationPayload.segments.length} segments${editionLabel}`);
  } catch (error) {
    addNotification('error', 'Failed to save segmentation: ' + error.message);
    throw error;
  }
}, [state.workspace, addNotification, api, dispatch]);
const loadAllEditions = useCallback(async (authorFolder, baseWorkId) => {
  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'editions', value: true } });
  
  try {
    console.log(`📚 Loading all editions for: ${baseWorkId}`);
    
    const response = await api.getWorkEditions(authorFolder, baseWorkId);
    
    console.log(`✅ Found ${response.total_editions} editions`);
    console.log(`📊 Editions with segmentations: ${response.editions_with_segmentations}`);
    
    // Log each edition's segmentation status
    response.editions.forEach(ed => {
      if (ed.has_segmentation) {
        console.log(`  ✅ ${ed.id}: ${ed.segment_count} segments`);
      } else {
        console.log(`  ℹ️  ${ed.id}: no segmentation`);
      }
    });
    
    return response;
  } catch (error) {
    addNotification('error', 'Failed to load editions: ' + error.message);
    throw error;
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'editions', value: false } });
  }
}, [addNotification, api, dispatch]);
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

// Add pollJobStatus with useCallback

const pollJobStatus = useCallback(async (jobId) => {
  try {
    const jobData = await api.getJobStatus(jobId);
    
    dispatch({
      type: ACTIONS.UPDATE_ANALYSIS_JOB,
      payload: jobData
    });
    
    // When job completes, load results from file system
    if (jobData.status === 'completed') {
      console.log('✅ Job completed, loading results from file system...');
      
      try {
        // Use new endpoint to get latest result
        const result = await api.getLatestResult();
        console.log('📊 Loaded result:', result.result_id);
        
        // Transform based on result type
        let patterns = [];
        
        if (result.is_multi_edition) {
          for (const [editionId, editionData] of Object.entries(result.editions || {})) {
            if (!editionData.error) {
              const editionPatterns = transformEditionToPatterns(editionData, result);
              patterns.push(...editionPatterns);
            }
          }
        } else {
          patterns = transformResultsToPatterns(result);
        }
        
        console.log(`✅ Loaded ${patterns.length} patterns`);
        
        dispatch({
          type: ACTIONS.SET_RESULTS,
          payload: {
            patterns: patterns,
            lastJobId: result.result_id
          }
        });
        
        dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
        dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'results' });
        
        addNotification('success', `Analysis complete: ${patterns.length} patterns found`);
        
      } catch (error) {
        console.error('❌ Error loading results:', error);
        addNotification('error', 'Failed to load results: ' + error.message);
      }
      
      return; // Stop polling
    }
    
    // Continue polling if still running
    if (['queued', 'processing', 'paused'].includes(jobData.status)) {
      setTimeout(() => pollJobStatus(jobId), 1000);
    }
    
  } catch (error) {
    console.error('Error polling job status:', error);
  }
}, [addNotification]);

// ✅ ADD THIS NEW FUNCTION HERE
const startPollingJobStatus = useCallback((jobId) => {
  console.log('🔄 Starting job status polling:', jobId);
  
  // Start polling immediately
  pollJobStatus(jobId);
  
  // Set up interval for continuous polling
  const pollInterval = setInterval(() => {
    const currentJob = state.analyze.currentJob;
    
    // Stop polling if job is complete or failed
    if (!currentJob || ['completed', 'failed'].includes(currentJob.status)) {
      console.log('✅ Stopping polling - job finished');
      clearInterval(pollInterval);
      return;
    }
    
    // Continue polling
    pollJobStatus(jobId);
  }, 1000); // Poll every 1 second
  
  // Store interval ID so we can cancel it later if needed
  return pollInterval;
}, [pollJobStatus, state.analyze.currentJob]);


const startAnalysis = useCallback(async () => {
  console.log('🚀 START ANALYSIS CLICKED');
  
  // Check if multi-edition mode
  const isMultiEdition = state.workspace.multiEditionConfig?.isMultiEdition;
  
  // ========================================
  // MULTI-EDITION ANALYSIS
  // ========================================
  if (isMultiEdition) {
    console.log('🚀 Starting multi-edition analysis...');
    
    const multiConfig = state.workspace.multiEditionConfig;
    const workTitle = multiConfig.workTitle;
    const viewMode = state.analyze.viewMode || 'standard';
    
    console.log('   Work:', workTitle);
    console.log('   Editions:', multiConfig.selectedEditions.length);
    console.log('   Total segments:', multiConfig.totalSegments);
    
    // Build edition configs with segmentation data
    const editionConfigs = {};
    let totalSegments = 0;
    
// NEW CODE (FIXED):
for (const editionId of multiConfig.selectedEditions) {
  const editionData = multiConfig.editionData[editionId];
  
  // Validate edition data exists
  if (!editionData) {
    console.error(`❌ Missing edition data for: ${editionId}`);
    continue;
  }
  
  console.log(`   Edition ${editionId}: ${editionData.segments?.length || 0} segments`);
  
  // CRITICAL: Use edition ID as key (not editionName)
  // Ensure segments are in proper format with all required fields
  editionConfigs[editionId] = {
    file: editionData.id || editionId,
    author_folder: multiConfig.authorFolder,
    priority: 1,
    use_statistical: editionData.useStatistical || false,
    manual_segments: (editionData.segments || []).map(seg => ({
      id: seg.id,
      name: seg.name,
      start_line: seg.start_line,
      end_line: seg.end_line,
      start_char: seg.start_char,
      end_char: seg.end_char,
      text: seg.text,
      lines: seg.lines || [],
      metadata: seg.metadata || {}
    }))
  };
  
  totalSegments += editionData.segments?.length || 0;
}

console.log('📊 Built edition configs:', Object.keys(editionConfigs));
console.log('📊 Total editions:', multiConfig.selectedEditions.length);

// Debug log first config to verify structure
if (Object.keys(editionConfigs).length > 0) {
  const firstConfigKey = Object.keys(editionConfigs)[0];
  const firstConfig = editionConfigs[firstConfigKey];
  console.log('📦 Sample config structure:', {
    key: firstConfigKey,
    file: firstConfig.file,
    segment_count: firstConfig.manual_segments?.length || 0,
    first_segment_keys: firstConfig.manual_segments?.[0] ? Object.keys(firstConfig.manual_segments[0]) : []
  });
}
    
    console.log('📊 Built edition configs:', Object.keys(editionConfigs));
    console.log('📊 Total editions:', multiConfig.selectedEditions.length);
    
    // Build API request
    const multiEditionPayload = {
      author: multiConfig.author,
      author_folder: multiConfig.authorFolder,
      work_title: workTitle,
      edition_configs: editionConfigs,
      view_mode: viewMode,
      expected_entities: state.analyze.filters?.entities || [],
      expected_themes: [],
      use_statistical_segmentation: false,
      min_anomaly_score: 3,
      length_mode: 'variable',
      min_confidence: parseFloat(state.analyze.filters?.minConfidence || 15.0),
      max_results_per_method: 100,
      use_ai_enhancement: false
    };
    
    console.log('📦 Multi-edition request:', {
      editions: multiConfig.selectedEditions.length,
      view_mode: viewMode,
      total_segments: totalSegments
    });
    
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: true } });
      
      console.log('📡 Calling api.analyzeMultiEdition...');
      
      // Call API
      const response = await api.analyzeMultiEdition(multiEditionPayload);
      
      console.log('✅ Multi-edition API response:', response);
      
      // Check if job_id exists
      if (!response.job_id) {
        throw new Error('No job_id returned from API');
      }
      
      console.log('📝 Setting current job:', response.job_id);
      
      // SET CURRENT JOB - This is what makes the ProgressTracker appear
      dispatch({
        type: ACTIONS.SET_CURRENT_JOB,
        payload: {
          job_id: response.job_id,
          status: 'processing',
          work_title: workTitle,
          author: multiConfig.author,
          segments_count: totalSegments,
          view_mode: viewMode,
          created_at: new Date().toISOString(),
          progress: 0,
          total_segments: totalSegments,
          filtered_count: 0,
          is_multi_edition: true,
          edition_count: multiConfig.selectedEditions.length,
          editions: multiConfig.selectedEditions
        }
      });
      
      // Start polling for status updates
      console.log('🔄 Starting status polling for job:', response.job_id);
      startPollingJobStatus(response.job_id);
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          title: 'Multi-Edition Analysis Started',
          message: `Analyzing ${multiConfig.selectedEditions.length} editions with ${totalSegments} total segments`
        }
      });
      
    } catch (error) {
      console.error('❌ Multi-edition analysis error:', error);
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          title: 'Analysis Failed',
          message: error.message || 'Failed to start multi-edition analysis'
        }
      });
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
    }
    
    return; // Exit early for multi-edition
  }
  
  // ========================================
  // SINGLE EDITION ANALYSIS
  // ========================================
  console.log('🚀 Starting single-edition analysis...');
  
  // Validate source
  if (!state.workspace.currentSource) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        title: 'No Source Selected',
        message: 'Please select a source in the Workspace'
      }
    });
    return;
  }
  
  // Validate segments
  const currentSegments = state.workspace.segments || [];
  
  if (currentSegments.length === 0) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        title: 'No Segments',
        message: 'Please create segments before starting analysis'
      }
    });
    return;
  }
  
  // Validate view mode
  const viewMode = state.analyze.viewMode;
  if (!viewMode) {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        title: 'No View Mode',
        message: 'Please select a view mode'
      }
    });
    return;
  }
  
  try {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: true } });
    
    // Build single-edition request payload
    const requestPayload = {
      work_id: state.workspace.currentSource.id,
      work_title: state.workspace.currentSource.title,
      author: state.workspace.currentSource.author,
      segments: currentSegments.map(seg => ({
        id: seg.id,
        name: seg.name,
        start_line: seg.start_line,
        end_line: seg.end_line,
        start_char: seg.start_char,
        end_char: seg.end_char,
        text: seg.text,
        lines: seg.lines
      })),
      segment_type: 'manual',
      view_mode: viewMode,
      spoilage_threshold: state.analyze.filters?.spoilageLevel || null,
      word_filter: state.analyze.filters?.wordFilter || null,
      use_ai_enhancement: state.analyze.useAI || false,
      run_full_pipeline: true,
      max_texts: null,
      enable_chat_assistance: false,
      use_statistical_segmentation: false,
      min_anomaly_score: 3,
      length_mode: 'variable',
      custom_lengths: null,
      overlap: 0,
      min_confidence: parseFloat(state.analyze.filters?.minConfidence || 15.0),
      max_results_per_method: 100
    };
    
    console.log('📡 Calling api.analyzeText...');
    console.log('📦 Single-edition request:', {
      work_id: requestPayload.work_id,
      segments: currentSegments.length,
      view_mode: viewMode
    });
    
    // Call API
    const jobResponse = await api.analyzeText(requestPayload);
    
    console.log('✅ Single-edition API response:', jobResponse);
    
    // Check if job_id exists
    if (!jobResponse.job_id) {
      throw new Error('No job_id returned from API');
    }
    
    console.log('📝 Setting current job:', jobResponse.job_id);
    
    // SET CURRENT JOB - This is what makes the ProgressTracker appear
    dispatch({
      type: ACTIONS.SET_CURRENT_JOB,
      payload: {
        job_id: jobResponse.job_id,
        status: jobResponse.status || 'processing',
        work_title: jobResponse.work_title,
        author: state.workspace.currentSource.author,
        segments_count: jobResponse.segments_count,
        view_mode: jobResponse.view_mode,
        created_at: jobResponse.created_at,
        progress: 0,
        total_segments: currentSegments.length,
        filtered_count: 0,
        is_multi_edition: false
      }
    });
    
    // Start polling for status updates
    console.log('🔄 Starting status polling for job:', jobResponse.job_id);
    startPollingJobStatus(jobResponse.job_id);
    
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        title: 'Analysis Started',
        message: `Processing ${currentSegments.length} segments`
      }
    });
    
  } catch (error) {
    console.error('❌ Single-edition analysis error:', error);
    
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'error',
        title: 'Analysis Failed',
        message: error.message || 'Failed to start analysis'
      }
    });
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'analysis', value: false } });
  }
  
}, [state.workspace, state.analyze, dispatch]);

const exportResults = useCallback(async (format = 'excel') => {
  console.log('🔥 EXPORT STARTED');
  
  // Get the result ID from current job or last completed job
  const currentJob = state.analyze.currentJob;
  const lastJobId = state.results.lastJobId;
  
  console.log('   Current job:', currentJob);
  console.log('   Last job ID:', lastJobId);
  
  // ============================================================
  // Determine the CORRECT filename for the result file
  // ============================================================
  let resultFilename = null;
  
  if (currentJob) {
    // Use the job's work_key or build it from metadata
    if (currentJob.is_multi_edition) {
      // Multi-edition: Use work_key
      resultFilename = currentJob.work_key || 
                       `${currentJob.author}_${currentJob.work_title}`.replace(/\s+/g, '_').toLowerCase();
      resultFilename = `${resultFilename}_multi_edition`;
    } else {
      // Single-edition: Use job_id
      resultFilename = `${currentJob.job_id}_result`;
    }
  } else if (lastJobId) {
    // Fallback: Use last job ID
    if (lastJobId.includes('_multi_edition')) {
      resultFilename = lastJobId;
    } else {
      resultFilename = `${lastJobId}_result`;
    }
  }
  
  console.log('   Result filename:', resultFilename);
  
  if (!resultFilename) {
    console.error('❌ No result to export');
    addNotification('warning', 'No results to export');
    return;
  }

  try {
    const baseUrl = 'http://192.99.245.215:8000';
    
    // ============================================================
    // EXCEL EXPORT ONLY - Use fetch() to download
    // ============================================================
    console.log('📥 Fetching Excel file from backend...');
    const url = `${baseUrl}/api/batch/export/${resultFilename}`;
    console.log('   URL:', url);
    
    addNotification('info', 'Generating Excel file...', { duration: 2000 });
    
    // Fetch the file
    const response = await fetch(url);
    
    console.log('   Response status:', response.status);
    console.log('   Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Export failed:', errorText);
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }
    
    // Check content type to ensure we got Excel, not JSON error
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Backend returned JSON error instead of Excel
      const errorData = await response.json();
      console.error('❌ Backend returned JSON error:', errorData);
      throw new Error(errorData.detail || 'Export failed - backend returned JSON instead of Excel');
    }
    
    // Get the Excel file as blob
    const blob = await response.blob();
    console.log('   Blob size:', blob.size, 'bytes');
    console.log('   Blob type:', blob.type);
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    // Create a temporary download link and trigger download
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${resultFilename}.xlsx`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 100);
    
    console.log('✅ Excel download triggered');
    addNotification('success', 'Excel file downloaded successfully');
    
  } catch (error) {
    console.error('❌ Export error:', error);
    addNotification('error', 'Export failed: ' + error.message, {
      duration: 5000
    });
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
      // Use new endpoint to get latest result directly from file system
      const result = await api.getLatestResult();
      
      console.log('✅ Found latest result:', result.result_id);
      console.log('📊 Result type:', result.is_multi_edition ? 'Multi-edition' : 'Single-edition');
      
      // Transform based on result type
      let patterns = [];
      
      if (result.is_multi_edition) {
        // Multi-edition result
        console.log(`📚 Processing ${Object.keys(result.editions || {}).length} editions`);
        
        for (const [editionId, editionData] of Object.entries(result.editions || {})) {
          if (editionData.error) {
            console.warn(`⚠️  Edition ${editionId} had error:`, editionData.error);
            continue;
          }
          
          const editionPatterns = transformEditionToPatterns(editionData, result);
          patterns.push(...editionPatterns);
        }
      } else {
        // Single-edition result
        patterns = transformResultsToPatterns(result);
      }
      
      console.log(`✅ Restored ${patterns.length} patterns from latest analysis`);
      
      if (patterns.length > 0) {
        dispatch({ 
          type: ACTIONS.SET_RESULTS, 
          payload: {
            patterns: patterns,
            lastJobId: result.result_id
          }
        });
        
        addNotification('info', `Restored ${patterns.length} results from latest analysis`, {
          duration: 3000
        });
      }
      
    } catch (error) {
  // If 404, no results yet - this is normal
  if (error.message.includes('404') || error.message.includes('No results found')) {
    console.log('📭 No previous results found');
  } else {
    // ✅ FIX: Log the full error details
    console.error('❌ Error restoring latest results:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
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

  // In AppContext.jsx, find the restoreLatestResults useEffect (around line 1100)
// Add the upload call after loading results:

useEffect(() => {
  async function restoreLatestResults() {
    console.log('🔍 Checking for latest completed analysis...');
    
    try {
      const result = await api.getLatestResult();
      
      console.log('✅ Found latest result:', result.result_id);
      
      // Transform based on result type
      let patterns = [];
      
      if (result.is_multi_edition) {
        for (const [editionId, editionData] of Object.entries(result.editions || {})) {
          if (editionData.error) continue;
          const editionPatterns = transformEditionToPatterns(editionData, result);
          patterns.push(...editionPatterns);
        }
      } else {
        patterns = transformResultsToPatterns(result);
      }
      
      console.log(`✅ Restored ${patterns.length} patterns from latest analysis`);
      
      if (patterns.length > 0) {
        dispatch({ 
          type: ACTIONS.SET_RESULTS, 
          payload: {
            patterns: patterns,
            lastJobId: result.result_id
          }
        });
        
        addNotification('info', `Restored ${patterns.length} results from latest analysis`, {
          duration: 3000
        });
        
        // ============================================================
        // NEW: Auto-upload to Drive if enabled
        // ============================================================
        if (config.ENABLE_DRIVE_UPLOAD) {
          console.log('📤 Auto-uploading latest result to Drive...');
          uploadResultToDrive(result.result_id);
        }
      }
      
    } catch (error) {
      if (!error.message.includes('404') && !error.message.includes('No results found')) {
        console.error('❌ Error restoring latest results:', error);
      }
    }
  }
  
  const timer = setTimeout(restoreLatestResults, 1500);
  return () => clearTimeout(timer);
}, [addNotification, uploadResultToDrive]);

  // ==================== CONTEXT VALUE ====================
  // Update the value object to include new functions:
// Around line 1200 in AppContext.jsx, update the value object:
const value = {
  updateSessionTabState,
  autoSaveSession,
  closeSession,
    miniMerlinAIChat,
    setMiniMerlinRawMode,
  clearMiniMerlinAIChat,
  toggleMiniMerlinAI,
  createSession,
  loadSession,
  listSessions,
  deleteSession,
  uploadWorkFile,
  getAuthorsForUpload,
    getMiniMerlinSession,  // ← ADD THIS
  addSentenceToSession,
  updateSentence,
  deleteSentence,
  saveSentenceSolution,
  state,
  dispatch,
  uploadResultToDrive,  // ← ADD THIS
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
  getMiniMerlinSessionState,
  clearMiniMerlinSession,
  api,
  addNotification,
  toggleModal,
  selectAuthor,
  loadWork,
  // Add to context value object:
getAnagramSuggestions,
getAIAnagramSuggestions,
explainAnagram,
validateAnagram,
getAnagramStats,
batchAnagramSuggestions,
  loadAllEditions,
  saveWorkText,
  createAutoSegmentation,
  saveSegmentation,
  loadSegmentation,
  deleteSegmentation,
  startAnalysis,
  exportResults,
  createAISegmentation,
  analyzeSegmentsWithAI,
  prioritizeSegmentsWithAI,
  analyzeStatisticalImprobability,
  analyzeEntityClustering,
  getSpoilageDistribution,
  extractThematicLayers,
  compareWorks,
  analyzeMultiEdition,
  compareEditions,
  suggestLetters,
  chatWithAI,
  reconstructGibberish,
  enhanceDecodeWithAI,           // ← ADD
  suggestLetterArrangements,     // ← ADD
  proposeHypothesis,             // ← ADD
  synthesizeNarrative,           // ← ADD
  compareEditionsWithAI,         // ← ADD
  buildEntityNetwork,            // ← ADD
  exportResearchReport,          // ← ADD
  analyzeSegmentWithAI,          // ← ADD
  getAIModelStats,               // ← ADD
  clearAICache,                  // ← ADD
  clearAIChatHistory,            // ← ADD
  exportToSheets,
  getProgressDashboard,
};

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function transformEditionToPatterns(editionResult, workResponse) {
  if (!editionResult || !editionResult.segments) {
    console.warn('No segments in edition result');
    return [];
  }

  return editionResult.segments
    .filter(segment => {
      // Backend uses 'decode_results.final_ranking'
      const decodings = segment.decode_results?.final_ranking || [];
      return decodings.length > 0;
    })
    .map((segment, idx) => {
      const decodings = segment.decode_results?.final_ranking || [];
      const topDecoding = decodings[0] || {};
      
      const credibleDecodings = decodings.filter(d => 
        (d.confidence || 0) >= 70
      );

      return {
        id: segment.segment_info?.id || `seg_${idx}`,
        rank: idx + 1,
        segment_id: segment.segment_info?.id,
        section_name: segment.segment_info?.name || `Segment ${idx + 1}`,
        is_encoded: true,
        composite_score: Math.round(topDecoding.confidence || 0),
        
        // Map segment_info correctly
        segment_info: segment.segment_info || {},
        original_text: segment.segment_info?.text || '',
        
        // Use decode_results (not decoding_results)
        decode_results: segment.decode_results || {},
        
        scores: {
          composite: Math.round(topDecoding.confidence || 0),
          detection: 0,
          confidence: topDecoding.confidence || 0
        },
        
        candidates: decodings,
        credible_candidates: credibleDecodings,
        best_candidate: topDecoding,
        
        entities_detected: decodings.flatMap(d => d.entities || []),
        themes: [],
        classification: topDecoding.method || 'UNKNOWN',
        
        metadata: {
          author: workResponse.author || editionResult.author || 'Unknown',
          work_title: workResponse.work || editionResult.work_title || 'Unknown',
          edition_id: editionResult.edition_id,
          edition_date: editionResult.date,  // ← ADD THIS
          edition_name: editionResult.edition_name,  // ← ADD THIS
          is_primary: editionResult.is_primary,  // ← ADD THIS
          work_id: editionResult.edition_id,
          section_id: segment.segment_info?.id,
          has_credible: credibleDecodings.length > 0
        }
      };
    });
}

function transformResultsToPatterns(result) {
  if (!result || !result.segments) {
    return [];
  }

  return result.segments
    .filter(segment => {
      // Use correct backend field names
      const decodings = segment.decode_results?.final_ranking || [];
      return decodings.length > 0;
    })
    .map((segment, idx) => {
      const decodings = segment.decode_results?.final_ranking || [];
      const topDecoding = decodings[0] || {};
      
      const credibleDecodings = decodings.filter(d => 
        (d.confidence || 0) >= 70
      );

      return {
        id: segment.segment_info?.id || segment.segment_id || `segment_${idx}`,
        rank: idx + 1,
        segment_id: segment.segment_info?.id || segment.segment_id,
        section_name: segment.segment_info?.name || segment.segment_name || `Segment ${idx + 1}`,
        is_encoded: true,
        composite_score: Math.round(topDecoding.confidence || 0),
        
        segment_info: segment.segment_info || {},
        original_text: segment.segment_info?.text || '',
        decode_results: segment.decode_results || {},
        
        scores: {
          composite: Math.round(topDecoding.confidence || 0),
          detection: 0,
          confidence: topDecoding.confidence || 0
        },
        
        candidates: decodings,
        credible_candidates: credibleDecodings,
        best_candidate: topDecoding,
        
        entities_detected: decodings.flatMap(d => d.entities || []),
        themes: [],
        classification: topDecoding.method || 'UNKNOWN',
        
        metadata: {
          author: result.author || 'Unknown',
          work_title: result.work_title || 'Unknown',
          work_id: result.work_id || result.edition_id || 'unknown',
          section_id: segment.segment_info?.id || segment.segment_id,
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
    pollJobStatus
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
    pollJobStatus
  };
}
export function useAnagram() {
  const {
    state,
    getAnagramSuggestions,
    getAIAnagramSuggestions,
    explainAnagram,
    validateAnagram,
    getAnagramStats,
    batchAnagramSuggestions,
  } = useAppState();
  
  return {
    anagramState: state.anagram,
    getAnagramSuggestions,
    getAIAnagramSuggestions,
    explainAnagram,
    validateAnagram,
    getAnagramStats,
    batchAnagramSuggestions,
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


export function useMiniMerlin() {
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
    getMiniMerlinSessionState,
    clearMiniMerlinSession,
    setMiniMerlinRawMode,  // FIX #5: Added
  } = useAppState();
  
  return {
    miniMerlinState: state.miniMerlin,
    rawMode: state.miniMerlin?.rawMode ?? true,  // FIX #5: Expose rawMode
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
    getMiniMerlinSessionState,
    clearMiniMerlinSession,
    setMiniMerlinRawMode,  // FIX #5: Added
  };
}
