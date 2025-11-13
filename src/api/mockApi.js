// api/mockApi.js

import { MOCK_SOURCES, MOCK_ENTITIES } from '../data/mockData';

/**
 * Mock API layer that simulates backend responses
 * Mirrors the real API interface for seamless transition
 */
class MockAPI {
  constructor() {
    this.activeJobs = new Map(); // Track in-progress analysis jobs
    this.jobIdCounter = 1000;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Simulate network delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random number within range
   */
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ==================== SOURCE MANAGEMENT ====================

  /**
   * Get a single source by ID
   * @param {string} sourceId
   * @returns {Promise<Object>}
   */
  async getSource(sourceId) {
    await this.delay(200);
    
    const source = MOCK_SOURCES.find(s => s.id === sourceId);
    
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }
    
    return { ...source }; // Return copy to prevent mutation
  }

  /**
   * Get all sources, optionally filtered by category
   * @param {string} category - 'all' or specific category
   * @returns {Promise<Object[]>}
   */
  async getLibrarySources(category = 'all') {
    await this.delay(300);
    
    if (category === 'all') {
      return MOCK_SOURCES.map(s => ({ ...s }));
    }
    
    return MOCK_SOURCES.filter(s => s.category === category).map(s => ({ ...s }));
  }

  /**
   * Search sources by query
   * @param {string} query
   * @returns {Promise<Object[]>}
   */
  async searchSources(query) {
    await this.delay(200);
    
    const lowerQuery = query.toLowerCase();
    
    return MOCK_SOURCES.filter(source => 
      source.title.toLowerCase().includes(lowerQuery) ||
      source.author.toLowerCase().includes(lowerQuery) ||
      source.text.toLowerCase().includes(lowerQuery)
    ).map(s => ({ ...s }));
  }

  // ==================== ENTITY DICTIONARY ====================

  /**
   * Get entity dictionary
   * @returns {Promise<Object[]>}
   */
  async getEntityDictionary() {
    await this.delay(200);
    return MOCK_ENTITIES.map(e => ({ ...e }));
  }

  /**
   * Search entities by name
   * @param {string} query
   * @returns {Promise<Object[]>}
   */
  async searchEntities(query) {
    await this.delay(150);
    
    const lowerQuery = query.toLowerCase();
    
    return MOCK_ENTITIES.filter(entity =>
      entity.name.toLowerCase().includes(lowerQuery) ||
      entity.name_variants.some(v => v.toLowerCase().includes(lowerQuery))
    ).map(e => ({ ...e }));
  }

  // ==================== ANALYSIS JOB MANAGEMENT ====================

  /**
   * Create a new analysis job
   * @param {Object} config - Analysis configuration
   * @returns {Promise<Object>}
   */
  async createAnalysisJob(config) {
    await this.delay(500);
    
    const jobId = this.jobIdCounter++;
    const estimatedTimeSeconds = config.segments.length * 0.5; // 0.5s per segment
    
    const job = {
      job_id: jobId,
      status: 'queued',
      segments_to_analyze: config.segments.length,
      estimated_time_seconds: estimatedTimeSeconds,
      configuration: {
        source_id: config.sourceId,
        methods: config.methods,
        view_mode: config.viewMode,
        filters: config.filters,
      },
      created_at: new Date().toISOString(),
    };
    
    this.activeJobs.set(jobId, {
      ...job,
      config,
      results: [],
    });
    
    return job;
  }

  /**
   * Get job status
   * @param {number} jobId
   * @returns {Promise<Object>}
   */
  async getJobStatus(jobId) {
    await this.delay(100);
    
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    return {
      job_id: jobId,
      status: job.status,
      progress: job.progress || 0,
      current_segment: job.currentSegment || 0,
      total_segments: job.segments_to_analyze,
      results_count: job.results.length,
    };
  }

  /**
   * Run analysis with progressive updates
   * This is an async generator that yields progress updates
   * @param {number} jobId
   * @yields {Object} Progress updates
   */
  async *runAnalysis(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    job.status = 'processing';
    job.progress = 0;
    job.currentSegment = 0;
    job.results = [];
    
    const { config } = job;
    const totalSegments = config.segments.length;
    
    // Process each segment
    for (let i = 0; i < totalSegments; i++) {
      await this.delay(500); // Simulate processing time
      
      const segment = config.segments[i];
      const segmentResults = this.generateMockResults(segment, config);
      
      job.results.push(...segmentResults);
      job.currentSegment = i + 1;
      job.progress = Math.floor(((i + 1) / totalSegments) * 100);
      
      // Yield progress update
      yield {
        job_id: jobId,
        status: 'processing',
        progress: job.progress,
        current_segment: job.currentSegment,
        total_segments: totalSegments,
        results_so_far: job.results.length,
        latest_results: segmentResults,
      };
    }
    
    // Complete job
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    
    yield {
      job_id: jobId,
      status: 'completed',
      progress: 100,
      total_results: job.results.length,
      high_confidence_count: job.results.filter(r => r.scores.composite >= 70).length,
      roberta_matches: job.results.filter(r => r.roberta_match).length,
      processing_time_ms: totalSegments * 500,
    };
  }

  /**
   * Get all results for a completed job
   * @param {number} jobId
   * @returns {Promise<Object[]>}
   */
  async getJobResults(jobId) {
    await this.delay(200);
    
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    if (job.status !== 'completed') {
      throw new Error(`Job not completed: ${jobId}`);
    }
    
    return job.results.map(r => ({ ...r }));
  }

  // ==================== RESULT GENERATION ====================

  /**
   * Generate mock decoded patterns for a segment
   * @param {Object} segment
   * @param {Object} config
   * @returns {Object[]}
   */
  generateMockResults(segment, config) {
    const templates = this.getResultTemplates();
    
    // Filter by view mode
    let filtered = this.filterByViewMode(templates, config.viewMode);
    
    // Apply spoilage filter
    filtered = filtered.filter(t => {
      const spoilage = this.calculateSpoilage(segment.text, t.pattern);
      return spoilage <= config.filters.spoilageMax;
    });
    
    // Apply entity search
    if (config.filters.entitySearch && config.filters.entitySearch.length > 0) {
      filtered = filtered.filter(t =>
        config.filters.entitySearch.some(e => 
          t.entities.some(te => te.toLowerCase().includes(e.toLowerCase()))
        )
      );
    }
    
    // Apply word search
    if (config.filters.wordSearch && config.filters.wordSearch.length > 0) {
      filtered = filtered.filter(t =>
        config.filters.wordSearch.every(w => 
          t.pattern.toLowerCase().includes(w.toLowerCase())
        )
      );
    }
    
    // Apply word exclusions
    if (config.filters.wordExclusions && config.filters.wordExclusions.length > 0) {
      filtered = filtered.filter(t =>
        !config.filters.wordExclusions.some(w => 
          t.pattern.toLowerCase().includes(w.toLowerCase())
        )
      );
    }
    
    // Apply minimum composite score
    if (config.filters.minCompositeScore) {
      filtered = filtered.filter(t => 
        t.scores.composite >= config.filters.minCompositeScore
      );
    }
    
    // Randomly assign Roberta matches (~20% probability)
    filtered = filtered.map(t => ({
      ...t,
      roberta_match: Math.random() < 0.2 ? this.generateRobertaMatch() : null,
    }));
    
    // Add segment-specific data
    filtered = filtered.map((t, index) => ({
      id: `result_${Date.now()}_${Math.random()}`,
      rank: index + 1,
      segment_id: segment.id,
      segment_text: segment.text,
      segment_lines: segment.lines,
      decoded_pattern: t.pattern,
      cipher_method: config.methods[Math.floor(Math.random() * config.methods.length)],
      scores: t.scores,
      spoilage_pct: this.calculateSpoilage(segment.text, t.pattern),
      unused_letters: this.getUnusedLetters(segment.text, t.pattern),
      entities_detected: t.entities.map(name => ({
        name,
        confidence: 0.80 + Math.random() * 0.20,
        type: 'person',
      })),
      themes: t.themes,
      roberta_match: t.roberta_match,
      transformation_log: this.generateTransformationLog(segment.text, t.pattern),
    }));
    
    // Limit to resultsPerSegment
    const limit = config.filters.resultsPerSegment || 100;
    return filtered.slice(0, limit);
  }

  /**
   * Get result templates (decoded patterns)
   */
  getResultTemplates() {
    return [
      {
        pattern: 'Whitgift tortured Roger Manwood anal lance lathe',
        entities: ['Whitgift', 'Roger Manwood'],
        themes: ['persecution', 'torture', 'imprisonment'],
        scores: { composite: 94, entity: 92, linguistic: 87, statistical: 96, spoilage: 97 },
      },
      {
        pattern: 'hoohoo de Vere bastard son incest scandal',
        entities: ['hoohoo', 'de Vere'],
        themes: ['royal_scandal', 'incest', 'succession'],
        scores: { composite: 89, entity: 88, linguistic: 84, statistical: 92, spoilage: 93 },
      },
      {
        pattern: 'Marina Cicogna Venice duke wife daughter',
        entities: ['Marina', 'Cicogna'],
        themes: ['venice', 'marriage', 'family'],
        scores: { composite: 87, entity: 90, linguistic: 83, statistical: 88, spoilage: 91 },
      },
      {
        pattern: 'Bacon Robert poisoner hunchback sonnets editor',
        entities: ['Bacon', 'Robert'],
        themes: ['authorship', 'encoding', 'sonnets'],
        scores: { composite: 82, entity: 85, linguistic: 79, statistical: 84, spoilage: 88 },
      },
      {
        pattern: 'Archbishop threatened judge prison death',
        entities: ['Whitgift', 'Roger Manwood'],
        themes: ['persecution', 'threat', 'death'],
        scores: { composite: 81, entity: 79, linguistic: 78, statistical: 86, spoilage: 85 },
      },
      {
        pattern: 'Hen persecuted murdered bishop order',
        entities: ['Hen', 'Whitgift'],
        themes: ['persecution', 'murder', 'religious'],
        scores: { composite: 79, entity: 82, linguistic: 76, statistical: 81, spoilage: 83 },
      },
      {
        pattern: 'Leicester bastard royal father secret',
        entities: ['Leicester', 'hoohoo'],
        themes: ['royal_scandal', 'paternity', 'secret'],
        scores: { composite: 77, entity: 80, linguistic: 74, statistical: 79, spoilage: 81 },
      },
      {
        pattern: 'Cate Benchkin Marlowe juvenilia early',
        entities: ['Cate', 'Benchkin'],
        themes: ['juvenilia', 'early_work', 'patron'],
        scores: { composite: 75, entity: 78, linguistic: 72, statistical: 77, spoilage: 79 },
      },
      {
        pattern: 'Ovid metamorphoses translation classical Latin',
        entities: ['Ovid'],
        themes: ['classical', 'translation', 'latin'],
        scores: { composite: 73, entity: 71, linguistic: 70, statistical: 76, spoilage: 77 },
      },
      {
        pattern: 'Giovanni Cicogna Venetian duke nobility merchant',
        entities: ['Giovanni', 'Cicogna'],
        themes: ['venice', 'nobility', 'merchant'],
        scores: { composite: 71, entity: 73, linguistic: 68, statistical: 74, spoilage: 75 },
      },
      {
        pattern: 'Watson patron friend death murder',
        entities: ['Watson'],
        themes: ['friendship', 'death', 'patron'],
        scores: { composite: 68, entity: 70, linguistic: 65, statistical: 71, spoilage: 72 },
      },
      {
        pattern: 'Walsingham spy intelligence network secret',
        entities: ['Walsingham'],
        themes: ['espionage', 'intelligence', 'secret'],
        scores: { composite: 66, entity: 68, linguistic: 63, statistical: 69, spoilage: 70 },
      },
      // Lower scoring patterns
      {
        pattern: 'torture chamber screams blood death agony',
        entities: [],
        themes: ['torture', 'violence', 'death'],
        scores: { composite: 58, entity: 45, linguistic: 60, statistical: 65, spoilage: 62 },
      },
      {
        pattern: 'poison dagger murder secret plot conspiracy',
        entities: [],
        themes: ['murder', 'conspiracy', 'violence'],
        scores: { composite: 55, entity: 42, linguistic: 58, statistical: 62, spoilage: 60 },
      },
      {
        pattern: 'theater play stage actor manuscript',
        entities: [],
        themes: ['theater', 'performance', 'writing'],
        scores: { composite: 52, entity: 40, linguistic: 55, statistical: 59, spoilage: 57 },
      },
    ];
  }

  /**
   * Filter templates by view mode
   */
  filterByViewMode(templates, mode) {
    const priorities = {
      'standard': ['Whitgift', 'hoohoo', 'Hen', 'de Vere', 'Marina', 'Leicester'],
      'juvenilia': ['Roger', 'Cate', 'Benchkin', 'Ovid', 'Watson', 'classical'],
      'alt_cipher': null, // no filtering
      'show_all': null,
    };
    
    const priorityEntities = priorities[mode];
    
    if (!priorityEntities) {
      return [...templates]; // Return all, no filtering
    }
    
    // Sort by relevance to priority entities
    return [...templates].sort((a, b) => {
      const aScore = a.entities.filter(e => 
        priorityEntities.some(p => e.toLowerCase().includes(p.toLowerCase()))
      ).length;
      const bScore = b.entities.filter(e => 
        priorityEntities.some(p => e.toLowerCase().includes(p.toLowerCase()))
      ).length;
      
      if (bScore !== aScore) return bScore - aScore;
      return b.scores.composite - a.scores.composite; // Tie-breaker
    });
  }

  /**
   * Calculate spoilage percentage
   */
  calculateSpoilage(segmentText, pattern) {
    const segmentLetters = segmentText.toLowerCase().replace(/[^a-z]/g, '').length;
    const patternLetters = pattern.toLowerCase().replace(/[^a-z]/g, '').length;
    
    if (segmentLetters === 0) return 100;
    
    const unused = Math.abs(segmentLetters - patternLetters);
    return Math.min(100, (unused / segmentLetters) * 100);
  }

  /**
   * Get unused letters
   */
  getUnusedLetters(segmentText, pattern) {
    const segmentLetters = segmentText.toLowerCase().replace(/[^a-z]/g, '').split('');
    const patternLetters = pattern.toLowerCase().replace(/[^a-z]/g, '').split('');
    
    const segmentCount = {};
    const patternCount = {};
    
    segmentLetters.forEach(l => segmentCount[l] = (segmentCount[l] || 0) + 1);
    patternLetters.forEach(l => patternCount[l] = (patternCount[l] || 0) + 1);
    
    const unused = [];
    for (const letter in segmentCount) {
      const diff = segmentCount[letter] - (patternCount[letter] || 0);
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          unused.push(letter);
        }
      }
    }
    
    return unused;
  }

  /**
   * Generate transformation log
   */
  generateTransformationLog(segmentText, pattern) {
    return [
      `Original: "${segmentText.substring(0, 50)}${segmentText.length > 50 ? '...' : ''}"`,
      `Normalized long s: ſ → s`,
      `Expanded ligatures: ff→ff, fi→fi, fl→fl`,
      `Letter inventory built: ${this.getLetterInventory(segmentText)}`,
      `Applied cipher method: ${this.random(100, 999)} permutations tested`,
      `Top match selected: "${pattern}"`,
      `Unused letters: ${this.getUnusedLetters(segmentText, pattern).join(', ') || 'none'}`,
      `Spoilage: ${this.calculateSpoilage(segmentText, pattern).toFixed(1)}%`,
    ];
  }

  /**
   * Get letter inventory summary
   */
  getLetterInventory(text) {
    const letters = text.toLowerCase().replace(/[^a-z]/g, '').split('');
    const counts = {};
    letters.forEach(l => counts[l] = (counts[l] || 0) + 1);
    
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return sorted.map(([l, c]) => `${l}:${c}`).join(', ');
  }

  /**
   * Generate Roberta match data
   */
  // generateRobertaMatch() {
  //   return {
  //     found: true,
  //     page: this.random(1, 600),
  //     year: 1975 + this.random(0, 45),
  //     roberta_decode: this.shuffle([
  //       'Whitgift threatened Roger Manwood with prison',
  //       'hoohoo concealed bastard son scandal',
  //       'Marina Cicogna married Venetian duke',
  //       'Bacon edited Shakespeare sonnets secretly',
  //       'Leicester fathered royal bastard child',
  //     ])[0],
  //     similarity: 0.75 + Math.random() * 0.25,
  //     cross_refs: [
  //       this.random(1, 600),
  //       this.random(1, 600),
  //     ],
  //     notes: 'Found in Roberta\'s analysis notebook',
  //   };
  // }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Save analysis session
   * @param {Object} sessionData
   * @returns {Promise<Object>}
   */
  async saveSession(sessionData) {
    await this.delay(300);
    
    const session = {
      id: `session_${Date.now()}`,
      name: sessionData.name || `Analysis ${new Date().toLocaleDateString()}`,
      created: new Date().toISOString(),
      source: sessionData.source,
      segments: sessionData.segments,
      configuration: sessionData.configuration,
      results: sessionData.results || [],
      result_count: sessionData.resultCount || 0,
      high_confidence_count: sessionData.highConfidenceCount || 0,
    };
    
    // Store in localStorage
    const sessions = JSON.parse(localStorage.getItem('cipher_tool_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('cipher_tool_sessions', JSON.stringify(sessions));
    
    return session;
  }

  /**
   * Get all saved sessions
   * @returns {Promise<Object[]>}
   */
  async getSavedSessions() {
    await this.delay(200);
    
    const sessions = JSON.parse(localStorage.getItem('cipher_tool_sessions') || '[]');
    return sessions.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  /**
   * Delete a session
   * @param {string} sessionId
   * @returns {Promise<boolean>}
   */
  async deleteSession(sessionId) {
    await this.delay(200);
    
    const sessions = JSON.parse(localStorage.getItem('cipher_tool_sessions') || '[]');
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem('cipher_tool_sessions', JSON.stringify(filtered));
    
    return true;
  }

  /**
   * Restore a session
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async restoreSession(sessionId) {
    await this.delay(200);
    
    const sessions = JSON.parse(localStorage.getItem('cipher_tool_sessions') || '[]');
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    return { ...session };
  }

  // ==================== EXPORT ====================

  /**
   * Export results to various formats
   * @param {Object[]} results
   * @param {string} format - 'csv' | 'json' | 'google-sheets'
   * @returns {Promise<string>}
   */
  async exportResults(results, format = 'csv') {
    await this.delay(500);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(results);
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'google-sheets':
        // In real implementation, this would use Google Sheets API
        return this.exportToCSV(results);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert results to CSV format
   */
  exportToCSV(results) {
    const headers = [
      'Rank',
      'Segment ID',
      'Segment Text',
      'Decoded Pattern',
      'Cipher Method',
      'Composite Score',
      'Entity Score',
      'Linguistic Score',
      'Statistical Score',
      'Spoilage Score',
      'Spoilage %',
      'Entities',
      'Themes',
    ];
    
    const rows = results.map(r => [
      r.rank,
      r.segment_id,
      `"${r.segment_text.replace(/"/g, '""')}"`,
      `"${r.decoded_pattern.replace(/"/g, '""')}"`,
      r.cipher_method,
      r.scores.composite,
      r.scores.entity,
      r.scores.linguistic,
      r.scores.statistical,
      r.scores.spoilage,
      r.spoilage_pct.toFixed(2),
      `"${r.entities_detected.map(e => e.name).join(', ')}"`,
      `"${r.themes.join(', ')}"`,
      r.roberta_match ? 'Yes' : 'No',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return csv;
  }
}

// Export singleton instance
export default new MockAPI();