// context/initialState.js

export const INITIAL_STATE = {
  // ==================== WORKSPACE STATE ====================
workspace: {
  activeSource: null,
  currentSource: null,
  segments: [],
  boundaries: [],
  segmentationMode: 'paragraph',
  customSegmentSize: 20,
  aiSegmentationResult: null,
  aiSegmentAnalysis: null,
  aiPrioritization: null,
  multiEditionConfig: null,  // NEW
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
  results:  {
    patterns: [],
    filteredPatterns: [],
    selectedPatterns: [],
    expandedPatternId: null,
    selectedPatternDetails: null,
    sortBy: 'composite_score',
    sortOrder: 'desc',
    activeFilters: {
      lastJobId: null  // ✅ Add this
    },
    isExporting: false,
    lastJobId: null  // ✅ Add this too for redundancy
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