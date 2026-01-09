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
    multiEditionConfig: null,
  },

  // ==================== ANALYZE STATE ====================
  analyze: {
    selectedMethods: ['simple-english'],
    aiChatHistory: [],
    letterSuggestions: null,
    viewMode: 'basic',
    
    filters: {
      spoilageMax: 0.15,
      entitySearch: [],
      wordSearch: [],
      wordExclusions: [],
      resultsPerSegment: 100,
      minCompositeScore: 0,
      minConfidence: 0,
      methods: [],
      entities: [],
    },

    currentJob: null,
  },

  // ==================== RESULTS STATE ====================
  results: {
    patterns: [],
    filteredPatterns: [],
    selectedPatterns: [],
    expandedPatternId: null,
    selectedPatternDetails: null,
    sortBy: 'composite_score',
    sortOrder: 'desc',
    activeFilters: {
      lastJobId: null,
    },
    isExporting: false,
    lastJobId: null,
    aiEnhancement: null,
    hypothesisEvaluation: null,
    researchNarrative: null,
    entityNetwork: null,
    aiEditionComparison: null,
    segmentAIAnalysis: null,
    statisticalImprobability: null,
    entityClustering: null,
    spoilageDistribution: null,
    thematicLayers: null,
    workComparison: null,
    multiEditionResults: null,
    editionComparison: null,
    gibberishReconstructions: null,
    batchResults: null,
  },

  // ==================== LIBRARY STATE ====================
  library: {
    authors: [],
    selectedAuthor: null,
    availableWorks: [],
    selectedWork: null,
    availableSources: [],
    savedSessions: [],
    sessions: [],
    searchQuery: '',
    categoryFilter: 'all',
    activeTab: 'sources',
    entities: [],
  },
  session: {
  current: null,
  isActive: false,
  tabStates: {
    chat: { messages: [] },
    hypothesis: { hypothesis: '', evidence: [], result: null },
    narrative: { narrative: null, options: {} },
    compare: { edition1: null, edition2: null, comparison: null },
    segment: { selectedSegment: null, question: '', analysis: null },
    report: { config: {} }
  },
  lastTab: 'chat',
  autoSaveEnabled: true
},

  // ==================== UI STATE ====================
  ui: {
    activeView: 'workspace',
    hasUnsavedChanges: false,
    
    modals: {
      settings: false,
      help: false,
      progressDetail: false,
      exportOptions: false,
      patternDetails: false,
    },

    notifications: [],
    
    isLoading: {
      sources: false,
      analysis: false,
      export: false,
      authors: false,
      works: false,
      work: false,
      editions: false,
      aiSegmentation: false,
      aiAnalysis: false,
      aiPrioritization: false,
      letterSuggestions: false,
      hypothesis: false,
      narrative: false,
      editionComparison: false,
      entityNetwork: false,
      reportExport: false,
      segmentAIAnalysis: false,
    },

    showStats: true,
    showValidation: true,
    highlightMode: 'segments',
    fontSize: 'medium',
    showLineNumbers: true,
    compactMode: false,
    aiModelStats: null,
    exportStatus: null,
    progressDashboard: null,
  },

  // ==================== USER SETTINGS ====================
  settings: {
    theme: 'light',
    fontSize: 'medium',
    viewMode: 'basic',
    methods: ['simple-english'],
    
    export: {
      format: 'csv',
      includeTransformationLogs: false,
      includeScoreBreakdown: true,
    },

    autoSave: true,
    notifications: true,
    enableExperimentalFeatures: false,
    debugMode: false,
  },

  // ==================== ENTITY DICTIONARY ====================
  entityDictionary: [],
};