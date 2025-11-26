// src/AnalyzeView/FilterPanel.jsx

import React, { useState } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';

const FilterPanel = ({
  isExpanded = true,
  onToggleExpand,
}) => {
  const { state, dispatch } = useAppState();
  const filters = state.analyze.filters || {
    spoilageMax: 0.15,
    entitySearch: [],
    wordSearch: [],
    wordExclusions: [],
    resultsPerSegment: 100,
    minCompositeScore: 0,
  };
  const availableEntities = state.library.entities || [];
  
  const [entitySearchInput, setEntitySearchInput] = useState('');
  const [wordSearchInput, setWordSearchInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false);

  // Spoilage presets
  const spoilagePresets = [
    { label: '0%', value: 0, description: 'Perfect encoding' },
    { label: '0-5%', value: 0.05, description: 'Very clean' },
    { label: '5-20%', value: 0.20, description: 'Typical range' },
    { label: '20-40%', value: 0.40, description: 'Loose encoding' },
    { label: '40%+', value: 1.0, description: 'Any spoilage' },
  ];

  // Filter entity suggestions based on input
  const entitySuggestions = availableEntities
    .filter(entity => {
      const searchLower = entitySearchInput.toLowerCase();
      const entitySearchArray = filters.entitySearch || [];
      return (
        entity.name.toLowerCase().includes(searchLower) ||
        entity.name_variants?.some(v => v.toLowerCase().includes(searchLower))
      ) && !entitySearchArray.includes(entity.name);
    })
    .slice(0, 10);

  // Update filters helper
  const updateFilters = (newFilters) => {
    dispatch({
      type: ACTIONS.UPDATE_ANALYZE_FILTERS,
      payload: newFilters,
    });
  };

  // Handle spoilage change
  const handleSpoilageChange = (value) => {
    updateFilters({
      ...filters,
      spoilageMax: parseFloat(value),
    });
  };

  // Handle entity add
  const handleAddEntity = (entityName) => {
    const entitySearchArray = filters.entitySearch || [];
    if (!entitySearchArray.includes(entityName)) {
      updateFilters({
        ...filters,
        entitySearch: [...entitySearchArray, entityName],
      });
    }
    setEntitySearchInput('');
    setShowEntitySuggestions(false);
  };

  // Handle entity remove
  const handleRemoveEntity = (entityName) => {
    updateFilters({
      ...filters,
      entitySearch: (filters.entitySearch || []).filter(e => e !== entityName),
    });
  };

  // Handle word search add
  const handleAddWord = () => {
    const word = wordSearchInput.trim();
    const wordSearchArray = filters.wordSearch || [];
    if (word && !wordSearchArray.includes(word)) {
      updateFilters({
        ...filters,
        wordSearch: [...wordSearchArray, word],
      });
    }
    setWordSearchInput('');
  };

  // Handle word remove
  const handleRemoveWord = (word) => {
    updateFilters({
      ...filters,
      wordSearch: (filters.wordSearch || []).filter(w => w !== word),
    });
  };

  // Handle exclusion add
  const handleAddExclusion = () => {
    const word = exclusionInput.trim();
    const exclusionsArray = filters.wordExclusions || [];
    if (word && !exclusionsArray.includes(word)) {
      updateFilters({
        ...filters,
        wordExclusions: [...exclusionsArray, word],
      });
    }
    setExclusionInput('');
  };

  // Handle exclusion remove
  const handleRemoveExclusion = (word) => {
    updateFilters({
      ...filters,
      wordExclusions: (filters.wordExclusions || []).filter(w => w !== word),
    });
  };

  // Handle results per segment change
  const handleResultsPerSegmentChange = (value) => {
    updateFilters({
      ...filters,
      resultsPerSegment: parseInt(value),
    });
  };

  // Handle min score change
  const handleMinScoreChange = (value) => {
    updateFilters({
      ...filters,
      minCompositeScore: parseInt(value),
    });
  };

  // Clear all filters
  const handleClearAll = () => {
    updateFilters({
      spoilageMax: 0.15,
      entitySearch: [],
      wordSearch: [],
      wordExclusions: [],
      resultsPerSegment: 100,
      minCompositeScore: 0,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.spoilageMax !== 0.15 ||
    (filters.entitySearch || []).length > 0 ||
    (filters.wordSearch || []).length > 0 ||
    (filters.wordExclusions || []).length > 0 ||
    filters.minCompositeScore > 0 ||
    filters.resultsPerSegment !== 100;

  const entitySearchArray = filters.entitySearch || [];
  const wordSearchArray = filters.wordSearch || [];
  const exclusionsArray = filters.wordExclusions || [];

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Filters & Thresholds</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {[
                entitySearchArray.length > 0 && entitySearchArray.length,
                wordSearchArray.length > 0 && wordSearchArray.length,
                exclusionsArray.length > 0 && exclusionsArray.length,
              ].filter(Boolean).length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            >
              Clear All
            </button>
          )}
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Spoilage Tolerance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Spoilage Tolerance
              </label>
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(filters.spoilageMax * 100)}%
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(filters.spoilageMax * 100)}
              onChange={(e) => handleSpoilageChange(parseFloat(e.target.value) / 100)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {spoilagePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleSpoilageChange(preset.value)}
                  className={`
                    px-3 py-1 text-xs rounded-full transition-colors
                    ${Math.abs(filters.spoilageMax - preset.value) < 0.01
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Percentage of unused letters. Research shows 5-12% typical for intentional encoding.
            </p>
          </div>

          {/* Entity Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Search
              {entitySearchArray.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({entitySearchArray.length} selected)
                </span>
              )}
            </label>

            {/* Selected Entities */}
            {entitySearchArray.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {entitySearchArray.map((entity) => (
                  <span
                    key={entity}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                  >
                    {entity}
                    <button
                      onClick={() => handleRemoveEntity(entity)}
                      className="hover:text-blue-900 transition-colors"
                      aria-label={`Remove ${entity}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="relative">
              <input
                type="text"
                value={entitySearchInput}
                onChange={(e) => {
                  setEntitySearchInput(e.target.value);
                  setShowEntitySuggestions(true);
                }}
                onFocus={() => setShowEntitySuggestions(true)}
                placeholder="Search for historical figures..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />

              {/* Suggestions Dropdown */}
              {showEntitySuggestions && entitySearchInput && entitySuggestions.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEntitySuggestions(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                    {entitySuggestions.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleAddEntity(entity.name)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {entity.name}
                        </div>
                        {entity.name_variants && entity.name_variants.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Also: {entity.name_variants.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Find patterns mentioning specific historical figures
            </p>
          </div>

          {/* Word/String Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word Search
              {wordSearchArray.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({wordSearchArray.length} words)
                </span>
              )}
            </label>

            {/* Selected Words */}
            {wordSearchArray.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {wordSearchArray.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full"
                  >
                    {word}
                    <button
                      onClick={() => handleRemoveWord(word)}
                      className="hover:text-green-900 transition-colors"
                      aria-label={`Remove ${word}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={wordSearchInput}
                onChange={(e) => setWordSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddWord();
                  }
                }}
                placeholder="e.g., torture, Venice..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleAddWord}
                disabled={!wordSearchInput.trim()}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${wordSearchInput.trim()
                    ? 'text-white bg-green-600 hover:bg-green-700'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }
                `}
              >
                Add
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Find patterns containing specific words or phrases
            </p>
          </div>

          {/* Word Exclusions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exclude Words
              {exclusionsArray.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({exclusionsArray.length} excluded)
                </span>
              )}
            </label>

            {/* Selected Exclusions */}
            {exclusionsArray.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {exclusionsArray.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full"
                  >
                    {word}
                    <button
                      onClick={() => handleRemoveExclusion(word)}
                      className="hover:text-red-900 transition-colors"
                      aria-label={`Remove ${word}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={exclusionInput}
                onChange={(e) => setExclusionInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExclusion();
                  }
                }}
                placeholder="e.g., hoohoo..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleAddExclusion}
                disabled={!exclusionInput.trim()}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${exclusionInput.trim()
                    ? 'text-white bg-red-600 hover:bg-red-700'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }
                `}
              >
                Add
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Filter out patterns containing unwanted words
            </p>
          </div>

          {/* Minimum Composite Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Minimum Composite Score
              </label>
              <span className="text-sm font-semibold text-blue-600">
                {filters.minCompositeScore}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minCompositeScore}
              onChange={(e) => handleMinScoreChange(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (any)</span>
              <span>50</span>
              <span>100 (perfect)</span>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Filter results below this composite score (70+ is high confidence)
            </p>
          </div>

          {/* Results Per Segment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Results Per Segment
            </label>
            <select
              value={filters.resultsPerSegment}
              onChange={(e) => handleResultsPerSegmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100 (default)</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>

            <p className="text-xs text-gray-500 mt-2">
              Maximum patterns to generate per segment (higher = longer processing)
            </p>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Active Filters:</p>
                  <ul className="space-y-0.5 text-blue-700">
                    {filters.spoilageMax !== 0.15 && (
                      <li>• Spoilage: {Math.round(filters.spoilageMax * 100)}%</li>
                    )}
                    {entitySearchArray.length > 0 && (
                      <li>• Entities: {entitySearchArray.join(', ')}</li>
                    )}
                    {wordSearchArray.length > 0 && (
                      <li>• Contains: {wordSearchArray.join(', ')}</li>
                    )}
                    {exclusionsArray.length > 0 && (
                      <li>• Excludes: {exclusionsArray.join(', ')}</li>
                    )}
                    {filters.minCompositeScore > 0 && (
                      <li>• Min score: {filters.minCompositeScore}</li>
                    )}
                    {filters.resultsPerSegment !== 100 && (
                      <li>• Results limit: {filters.resultsPerSegment}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;