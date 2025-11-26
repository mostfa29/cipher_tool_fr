// ResultsView/FilterBar.jsx

import React, { useState, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';

const FilterBar = () => {
const { state, dispatch } = useAppState();
  const [showMethodsDropdown, setShowMethodsDropdown] = useState(false);
  const [showEntitiesDropdown, setShowEntitiesDropdown] = useState(false);

  const filters = useMemo(() => {
    const activeFilters = state.results?.activeFilters || {};
    return {
      minScore: activeFilters.minScore || 0,
      maxScore: activeFilters.maxScore !== undefined ? activeFilters.maxScore : 100,
      methods: activeFilters.methods || [],
      entities: activeFilters.entities || [],
      highConfidenceOnly: activeFilters.highConfidenceOnly || false,
    };
  }, [state.results?.activeFilters]);


  // SAFELY get available options from state with defaults
  const availableMethods = useMemo(() => {
    return state.settings?.methods || [];
  }, [state.settings?.methods]);
  const availableEntities = useMemo(() => {
    return state.library?.entities || [];
  }, [state.library?.entities]);
  const resultCount = useMemo(() => {
    return state.results?.patterns?.length || 0;
  }, [state.results?.patterns?.length]);

  // Filter results based on active filters
  const filteredPatterns = useMemo(() => {
    // Safety check: ensure patterns exist and is an array
    if (!state.results?.patterns || !Array.isArray(state.results.patterns)) {
      console.warn('FilterBar: No patterns array available');
      return [];
    }
    
    let filtered = [...state.results.patterns];

    // Score range filter
    if (filters.minScore > 0) {
      filtered = filtered.filter(p => (p.scores?.composite || 0) >= filters.minScore);
    }
    if (filters.maxScore < 100) {
      filtered = filtered.filter(p => (p.scores?.composite || 0) <= filters.maxScore);
    }

    // Methods filter - ADD SAFETY CHECK
    if (filters.methods && Array.isArray(filters.methods) && filters.methods.length > 0) {
      filtered = filtered.filter(p => {
        const patternMethods = p.best_candidate?.method || p.method;
        if (!patternMethods) return false;
        const methodArray = Array.isArray(patternMethods) ? patternMethods : [patternMethods];
        return methodArray.some(m => filters.methods.includes(m));
      });
    }

    // Entities filter - ADD SAFETY CHECK
    if (filters.entities && Array.isArray(filters.entities) && filters.entities.length > 0) {
      filtered = filtered.filter(p => {
        const entities = p.entities_detected || [];
        return entities.some(e => filters.entities.includes(e.name || e));
      });
    }

    // High confidence filter
    if (filters.highConfidenceOnly) {
      filtered = filtered.filter(p => (p.scores?.composite || 0) >= 70);
    }

    return filtered;
  }, [state.results?.patterns, filters]);

    const filteredCount = useMemo(() => {
      return filteredPatterns.length;
    }, [filteredPatterns.length]);


  // Handle filter changes
  const updateFilters = (updates) => {
    dispatch({
      type: ACTIONS.UPDATE_RESULT_FILTERS,
      payload: updates,
    });
  };

  // Handle score range change
  const handleScoreChange = (type, value) => {
    const newValue = parseInt(value) || 0;
    updateFilters({
      [type]: Math.max(0, Math.min(100, newValue)),
    });
  };

  // Handle method toggle
  const handleMethodToggle = (methodId) => {
    const newMethods = filters.methods.includes(methodId)
      ? filters.methods.filter(m => m !== methodId)
      : [...filters.methods, methodId];
    
    updateFilters({ methods: newMethods });
  };

  // Handle entity toggle
  const handleEntityToggle = (entityName) => {
    const newEntities = filters.entities.includes(entityName)
      ? filters.entities.filter(e => e !== entityName)
      : [...filters.entities, entityName];
    
    updateFilters({ entities: newEntities });
  };

  // Handle quick filter toggles
  const handleQuickFilter = (filterName) => {
    updateFilters({
      [filterName]: !filters[filterName],
    });
  };

  // Clear all filters
  const handleClearAll = () => {
    updateFilters({
      minScore: 0,
      maxScore: 100,
      methods: [],
      entities: [],
      highConfidenceOnly: false,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.minScore > 0 ||
    filters.maxScore < 100 ||
    (Array.isArray(filters.methods) && filters.methods.length > 0) ||
    (Array.isArray(filters.entities) && filters.entities.length > 0) ||
    filters.highConfidenceOnly;

  // Get method display name
  const getMethodName = (methodId) => {
    const methodMap = {
      'unusual_spelling': 'Unusual Spelling',
      'nomenclator': 'Nomenclator',
      'anagram': 'Anagram',
      'caesar_rot13': 'Caesar ROT-13',
      'caesar_rot3': 'Caesar ROT-3',
      'caesar_rot23': 'Caesar ROT-23',
      'pig_latin_us': 'Pig Latin (us)',
      'pig_latin_ay': 'Pig Latin (ay)',
      'letter_doubling': 'Letter Doubling',
    };
    return methodMap[methodId] || methodId;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Left: Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Score Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Score:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => handleScoreChange('minScore', e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.maxScore}
                onChange={(e) => handleScoreChange('maxScore', e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Methods Filter */}
            {availableMethods.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMethodsDropdown(!showMethodsDropdown);
                    setShowEntitiesDropdown(false);
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors
                    ${filters.methods.length > 0
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Methods</span>
                  {filters.methods.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      {filters.methods.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${showMethodsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Methods Dropdown */}
                {showMethodsDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMethodsDropdown(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                          <span className="text-xs font-medium text-gray-600">Filter by method</span>
                          {filters.methods.length > 0 && (
                            <button
                              onClick={() => updateFilters({ methods: [] })}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {availableMethods.map((method) => (
                          <label
                            key={method.id}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters.methods.includes(method.id)}
                              onChange={() => handleMethodToggle(method.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {getMethodName(method.id)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Entities Filter */}
            {availableEntities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowEntitiesDropdown(!showEntitiesDropdown);
                    setShowMethodsDropdown(false);
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors
                    ${filters.entities.length > 0
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Entities</span>
                  {filters.entities.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      {filters.entities.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${showEntitiesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Entities Dropdown */}
                {showEntitiesDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEntitiesDropdown(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                          <span className="text-xs font-medium text-gray-600">Filter by entity</span>
                          {filters.entities.length > 0 && (
                            <button
                              onClick={() => updateFilters({ entities: [] })}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {availableEntities.slice(0, 50).map((entity) => (
                          <label
                            key={entity.id || entity.name}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters.entities.includes(entity.name)}
                              onChange={() => handleEntityToggle(entity.name)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {entity.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Quick Filters */}
            <button
              onClick={() => handleQuickFilter('highConfidenceOnly')}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors
                ${filters.highConfidenceOnly
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>High Confidence</span>
            </button>
          </div>

          {/* Right: Clear & Results Count */}
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                Clear filters
              </button>
            )}
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredCount}</span>
              {filteredCount !== resultCount && (
                <span> of <span className="font-semibold text-gray-900">{resultCount}</span></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600">Active filters:</span>

            {filters.minScore > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                Min score: {filters.minScore}
                <button
                  onClick={() => handleScoreChange('minScore', 0)}
                  className="hover:text-blue-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}

            {filters.maxScore < 100 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                Max score: {filters.maxScore}
                <button
                  onClick={() => handleScoreChange('maxScore', 100)}
                  className="hover:text-blue-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}

            {filters.methods.map((methodId) => (
              <span
                key={methodId}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
              >
                {getMethodName(methodId)}
                <button
                  onClick={() => handleMethodToggle(methodId)}
                  className="hover:text-purple-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}

            {filters.entities.map((entity) => (
              <span
                key={entity}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
              >
                {entity}
                <button
                  onClick={() => handleEntityToggle(entity)}
                  className="hover:text-green-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}

            {filters.highConfidenceOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                High Confidence Only
                <button
                  onClick={() => handleQuickFilter('highConfidenceOnly')}
                  className="hover:text-green-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;