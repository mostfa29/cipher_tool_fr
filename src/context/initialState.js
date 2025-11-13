// context/initialState.js

export const INITIAL_STATE = {
  // ==================== WORKSPACE STATE ====================
  workspace: {
    // Current loaded source
    activeSource: null,
    currentSource: null,
    // Example: {
    //   id: 'faustus_a1_1604',
    //   title: 'Doctor Faustus A-text',
    //   author: 'Christopher Marlowe',
    //   text: '...',
    //   metadata: {...}
    // }

    // Generated segments (computed from boundaries)
    segments: [],
    // Example: [
    //   {
    //     id: 1,
    //     text: 'The tragicall historie of Doctor Faustus',
    //     startLine: 0,
    //     endLine: 2,
    //     lineCount: 2,
    //     letterCount: 41,
    //     isValid: true // 50-1000 letters
    //   }
    // ]

    // Boundary array for segmentation
    boundaries: [], // Array of line indices [0, 5, 10, 15, ..., totalLines]
    // Example: [0, 2, 4, 6, 8, 10] for 2-line pairs
    // First boundary is always 0, last is always total line count

    // Segmentation configuration
    segmentationMode: 'manual', // 'manual' | 'lines' | 'letters' | 'punctuation' | 'sentences' | 'balanced'
    customSegmentSize: 5, // When mode is 'custom'

    // Segmentation history for undo/redo
    segmentationHistory: [],
    segmentationHistoryIndex: -1,

    // Selected segment for operations
    selectedSegmentId: null,
    hoveredLineIndex: null,

    // Edition comparison mode
    comparisonMode: false,
    comparisonSources: [], // Array of source objects for side-by-side comparison
  },

  // ==================== ANALYZE STATE ====================
  analyze: {
    // Selected cipher methods
    selectedMethods: ['simple-english'],
    // Available: 'anagram', 'unusual_spelling', 'nomenclator', 
    //            'caesar_rot3', 'caesar_rot13', 'caesar_rot23',
    //            'pig_latin_us', 'pig_latin_ay', 'letter_doubling', 'simple-english'

    // View mode for filtering results
    viewMode: 'basic', // 'basic' | 'standard' | 'advanced' | 'expert'

    // Filter configuration for analysis
    filters: {
      spoilageMax: 0.15,
      entitySearch: [],
      wordSearch: [],
      wordExclusions: [],
      resultsPerSegment: 100,
      minCompositeScore: 0,
      minConfidence: 0, // 0-100
      methods: [], // Empty = all methods
      entities: [], // Empty = all entities
    },

    // Current analysis job
    currentJob: null,
    // Example: {
    //   id: 'job_123',
    //   status: 'processing', // 'idle' | 'processing' | 'paused' | 'completed' | 'failed'
    //   progress: 47, // 0-100
    //   currentSegment: 23,
    //   totalSegments: 47,
    //   startTime: Date.now(),
    //   estimatedTime: 12000, // milliseconds
    //   resultsCount: 89,
    //   highConfidenceCount: 12,
    //   latestResults: [...] // Last 5 results for preview
    // }
  },

  // ==================== RESULTS STATE ====================
  results: {
    // All decoded patterns from current analysis
    patterns: [],
    // Example: [
    //   {
    //     id: 789,
    //     segmentId: 3,
    //     segmentText: 'The tragicall historie...',
    //     decodedPattern: 'Whitgift tortured Roger Manwood...',
    //     cipherMethod: 'anagram',
    //     scores: {
    //       composite: 94,
    //       entity: 92,
    //       linguistic: 87,
    //       statistical: 96,
    //       spoilage: 97
    //     },
    //     spoilagePct: 3.2,
    //     entitiesDetected: [...],
    //     themes: ['persecution', 'torture'],
    //     transformationLog: [...]
    //   }
    // ]

    // Filtered patterns (after applying filters)
    filteredPatterns: null, // null means no filtering active

    // Result view configuration
    sortBy: 'confidence', // 'confidence' | 'entity_score' | 'spoilage' | 'method'
    sortOrder: 'desc', // 'asc' | 'desc'
    
    // Active filters for results view
    filters: {
      minConfidence: 0,
      maxConfidence: 100,
      methods: [], // Empty = all methods shown
      entities: [], // Empty = all entities shown
      sortBy: 'confidence',
      sortOrder: 'desc',
    },
    
    // Legacy alias
    activeFilters: {
      minConfidence: 0,
      maxConfidence: 100,
      methods: [],
      entities: [],
    },

    // Selected patterns (for batch operations)
    selectedPatterns: [], // Array of pattern IDs

    // Expanded pattern (showing transformation log)
    expandedPatternId: null,

    // Selected pattern details for modal
    selectedPatternDetails: null,

    // Export state
    isExporting: false,
  },

  // ==================== LIBRARY STATE ====================
  library: {
    // Available source texts
    availableSources: [], // Loaded from mock API on app init
    
    // Saved analysis sessions
    savedSessions: [],
    sessions: [], // Alias for compatibility
    // Example: [
    //   {
    //     id: 'session_123',
    //     name: 'Faustus Complete Analysis',
    //     created: '2025-11-10T14:30:00Z',
    //     source: {...}, // Complete source object
    //     segments: [...],
    //     boundaries: [...], // Saved boundaries
    //     resultCount: 412,
    //     highConfidenceCount: 89,
    //     configuration: {...} // Saved analyze config
    //   }
    // ]

    // Search/filter state
    searchQuery: '',
    categoryFilter: 'all', // 'all' | 'marlowe_plays' | 'shakespeare_tragedies' | etc.
    
    // Active tab
    activeTab: 'sources', // 'sources' | 'sessions'

    // Entity dictionary
    entities: [], // Cached entity dictionary
  },

  // ==================== UI STATE ====================
  ui: {
    // Active view
    activeView: 'workspace', // 'workspace' | 'analyze' | 'results' | 'library'

    // Unsaved changes flag
    hasUnsavedChanges: false,

    // Modal states
    modals: {
      settings: false,
      help: false,
      progressDetail: false,
      exportOptions: false,
      patternDetails: false,
    },

    // Notification queue
    notifications: [],
    // Example: [
    //   {
    //     id: 'notif_123',
    //     type: 'success', // 'success' | 'error' | 'warning' | 'info'
    //     title: 'Analysis Complete', // optional
    //     message: '412 patterns found',
    //     duration: 5000, // auto-dismiss after 5s, null = manual dismiss
    //     timestamp: Date.now(),
    //     autoDismiss: true
    //   }
    // ]

    // Loading states
    isLoading: {
      sources: false,
      analysis: false,
      export: false,
    },

    // UI settings for segmentation tool
    showStats: true,
    showValidation: true,
    highlightMode: 'segments', // 'segments' | 'validity' | 'none'
    fontSize: 'medium', // 'small' | 'medium' | 'large'
    showLineNumbers: true,
    compactMode: false,
  },

  // ==================== USER SETTINGS ====================
  settings: {
    // Appearance
    theme: 'light', // 'light' | 'dark' | 'auto'
    fontSize: 'medium', // 'small' | 'medium' | 'large'
    
    // Default analysis settings
    viewMode: 'basic',
    methods: ['simple-english'],
    
    // Export preferences
    export: {
      format: 'csv', // 'csv' | 'json' | 'txt'
      includeTransformationLogs: false,
      includeScoreBreakdown: true,
    },

    // Features
    autoSave: true,
    notifications: true,
    enableExperimentalFeatures: false,
    debugMode: false,
  },

  // ==================== ENTITY DICTIONARY (CACHED) ====================
  entityDictionary: [], // Loaded from mock API on init, array format for compatibility
  // Example: [
  //   {
  //     id: 1,
  //     name: 'John Whitgift',
  //     name_variants: ['Whitgift', 'Whitgifte'],
  //     type: 'person',
  //     period: 'post_1583',
  //     weight: 1.0,
  //     themes: ['persecution', 'torture']
  //   }
  // ]
};