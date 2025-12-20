// src/AnalyzeView/FilterPanel.jsx
// Filter configuration panel for cipher analysis with spoilage, entity, and word filtering

import React, { useState, useCallback, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { X, ChevronDown, Info } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const SPOILAGE_PRESETS = [
  { label: '0%', value: 0, description: 'Perfect encoding' },
  { label: '0-5%', value: 0.05, description: 'Very clean' },
  { label: '5-20%', value: 0.20, description: 'Typical range' },
  { label: '20-40%', value: 0.40, description: 'Loose encoding' },
  { label: '40%+', value: 1.0, description: 'Any spoilage' },
];

const RESULTS_PER_SEGMENT_OPTIONS = [25, 50, 100, 200, 500];

const DEFAULT_FILTERS = {
  spoilageMax: 0.15,
  entitySearch: [],
  wordSearch: [],
  wordExclusions: [],
  resultsPerSegment: 100,
  minCompositeScore: 0,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FilterPanel = ({
  isExpanded = true,
  onToggleExpand,
}) => {
  const { state, dispatch } = useAppState();
  const filters = state.analyze.filters || DEFAULT_FILTERS;
  const availableEntities = state.library.entities || [];
  
  // Local state for inputs
  const [entitySearchInput, setEntitySearchInput] = useState('');
  const [wordSearchInput, setWordSearchInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false);

  // Computed values
  const entitySuggestions = useEntitySuggestions(
    availableEntities,
    entitySearchInput,
    filters.entitySearch || []
  );
  
  const hasActiveFilters = useHasActiveFilters(filters);
  const activeFilterCount = useActiveFilterCount(filters);

  // Event handlers
  const updateFilters = useUpdateFilters(dispatch);
  const handleSpoilageChange = useSpoilageChange(filters, updateFilters);
  const handleClearAll = useCallback(() => {
    updateFilters(DEFAULT_FILTERS);
  }, [updateFilters]);

  const entityHandlers = useEntityHandlers(
    filters,
    updateFilters,
    setEntitySearchInput,
    setShowEntitySuggestions
  );

  const wordHandlers = useWordHandlers(
    filters,
    updateFilters,
    wordSearchInput,
    setWordSearchInput
  );

  const exclusionHandlers = useExclusionHandlers(
    filters,
    updateFilters,
    exclusionInput,
    setExclusionInput
  );

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <PanelHeader
        isExpanded={isExpanded}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        onToggle={onToggleExpand}
        onClearAll={handleClearAll}
      />

      {isExpanded && (
        <div className="p-4 space-y-6">
          <SpoilageSection
            value={filters.spoilageMax}
            onChange={handleSpoilageChange}
          />

          <EntitySearchSection
            selectedEntities={filters.entitySearch || []}
            searchInput={entitySearchInput}
            suggestions={entitySuggestions}
            showSuggestions={showEntitySuggestions}
            onSearchInputChange={setEntitySearchInput}
            onShowSuggestionsChange={setShowEntitySuggestions}
            onAddEntity={entityHandlers.handleAddEntity}
            onRemoveEntity={entityHandlers.handleRemoveEntity}
          />

          <WordSearchSection
            selectedWords={filters.wordSearch || []}
            searchInput={wordSearchInput}
            onSearchInputChange={setWordSearchInput}
            onAddWord={wordHandlers.handleAddWord}
            onRemoveWord={wordHandlers.handleRemoveWord}
          />

          <ExclusionSection
            exclusions={filters.wordExclusions || []}
            exclusionInput={exclusionInput}
            onExclusionInputChange={setExclusionInput}
            onAddExclusion={exclusionHandlers.handleAddExclusion}
            onRemoveExclusion={exclusionHandlers.handleRemoveExclusion}
          />

          <MinScoreSection
            value={filters.minCompositeScore}
            onChange={(value) => updateFilters({ ...filters, minCompositeScore: parseInt(value) })}
          />

          <ResultsPerSegmentSection
            value={filters.resultsPerSegment}
            onChange={(value) => updateFilters({ ...filters, resultsPerSegment: parseInt(value) })}
          />

          {hasActiveFilters && (
            <ActiveFiltersSummary filters={filters} />
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useEntitySuggestions(availableEntities, searchInput, selectedEntities) {
  return useMemo(() => {
    if (!searchInput) return [];
    
    const searchLower = searchInput.toLowerCase();
    return availableEntities
      .filter(entity => {
        const matchesSearch = 
          entity.name.toLowerCase().includes(searchLower) ||
          entity.name_variants?.some(v => v.toLowerCase().includes(searchLower));
        const notSelected = !selectedEntities.includes(entity.name);
        return matchesSearch && notSelected;
      })
      .slice(0, 10);
  }, [availableEntities, searchInput, selectedEntities]);
}

function useHasActiveFilters(filters) {
  return useMemo(() => {
    return (
      filters.spoilageMax !== DEFAULT_FILTERS.spoilageMax ||
      (filters.entitySearch || []).length > 0 ||
      (filters.wordSearch || []).length > 0 ||
      (filters.wordExclusions || []).length > 0 ||
      filters.minCompositeScore > 0 ||
      filters.resultsPerSegment !== DEFAULT_FILTERS.resultsPerSegment
    );
  }, [filters]);
}

function useActiveFilterCount(filters) {
  return useMemo(() => {
    return [
      (filters.entitySearch || []).length > 0,
      (filters.wordSearch || []).length > 0,
      (filters.wordExclusions || []).length > 0,
    ].filter(Boolean).length;
  }, [filters]);
}

function useUpdateFilters(dispatch) {
  return useCallback((newFilters) => {
    dispatch({
      type: ACTIONS.UPDATE_ANALYZE_FILTERS,
      payload: newFilters,
    });
  }, [dispatch]);
}

function useSpoilageChange(filters, updateFilters) {
  return useCallback((value) => {
    updateFilters({
      ...filters,
      spoilageMax: parseFloat(value),
    });
  }, [filters, updateFilters]);
}

function useEntityHandlers(filters, updateFilters, setSearchInput, setShowSuggestions) {
  const handleAddEntity = useCallback((entityName) => {
    const entitySearch = filters.entitySearch || [];
    if (!entitySearch.includes(entityName)) {
      updateFilters({
        ...filters,
        entitySearch: [...entitySearch, entityName],
      });
    }
    setSearchInput('');
    setShowSuggestions(false);
  }, [filters, updateFilters, setSearchInput, setShowSuggestions]);

  const handleRemoveEntity = useCallback((entityName) => {
    updateFilters({
      ...filters,
      entitySearch: (filters.entitySearch || []).filter(e => e !== entityName),
    });
  }, [filters, updateFilters]);

  return { handleAddEntity, handleRemoveEntity };
}

function useWordHandlers(filters, updateFilters, searchInput, setSearchInput) {
  const handleAddWord = useCallback(() => {
    const word = searchInput.trim();
    const wordSearch = filters.wordSearch || [];
    if (word && !wordSearch.includes(word)) {
      updateFilters({
        ...filters,
        wordSearch: [...wordSearch, word],
      });
    }
    setSearchInput('');
  }, [searchInput, filters, updateFilters, setSearchInput]);

  const handleRemoveWord = useCallback((word) => {
    updateFilters({
      ...filters,
      wordSearch: (filters.wordSearch || []).filter(w => w !== word),
    });
  }, [filters, updateFilters]);

  return { handleAddWord, handleRemoveWord };
}

function useExclusionHandlers(filters, updateFilters, exclusionInput, setExclusionInput) {
  const handleAddExclusion = useCallback(() => {
    const word = exclusionInput.trim();
    const wordExclusions = filters.wordExclusions || [];
    if (word && !wordExclusions.includes(word)) {
      updateFilters({
        ...filters,
        wordExclusions: [...wordExclusions, word],
      });
    }
    setExclusionInput('');
  }, [exclusionInput, filters, updateFilters, setExclusionInput]);

  const handleRemoveExclusion = useCallback((word) => {
    updateFilters({
      ...filters,
      wordExclusions: (filters.wordExclusions || []).filter(w => w !== word),
    });
  }, [filters, updateFilters]);

  return { handleAddExclusion, handleRemoveExclusion };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PanelHeader = ({ isExpanded, hasActiveFilters, activeFilterCount, onToggle, onClearAll }) => (
  <div 
    className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
    onClick={onToggle}
  >
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-gray-900">Filters & Thresholds</h3>
      {hasActiveFilters && (
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
          {activeFilterCount} active
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {hasActiveFilters && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
        >
          Clear All
        </button>
      )}
      <ChevronDown 
        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
      />
    </div>
  </div>
);

const SpoilageSection = ({ value, onChange }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm font-medium text-gray-700">
        Spoilage Tolerance
      </label>
      <span className="text-sm font-semibold text-blue-600">
        {Math.round(value * 100)}%
      </span>
    </div>

    <input
      type="range"
      min="0"
      max="100"
      step="1"
      value={Math.round(value * 100)}
      onChange={(e) => onChange(parseFloat(e.target.value) / 100)}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />

    <div className="flex flex-wrap gap-2 mt-3">
      {SPOILAGE_PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onChange(preset.value)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            Math.abs(value - preset.value) < 0.01
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
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
);

const EntitySearchSection = ({
  selectedEntities,
  searchInput,
  suggestions,
  showSuggestions,
  onSearchInputChange,
  onShowSuggestionsChange,
  onAddEntity,
  onRemoveEntity
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Entity Search
      {selectedEntities.length > 0 && (
        <span className="ml-2 text-xs text-gray-500">
          ({selectedEntities.length} selected)
        </span>
      )}
    </label>

    {selectedEntities.length > 0 && (
      <TagList
        items={selectedEntities}
        onRemove={onRemoveEntity}
        colorClass="bg-blue-100 text-blue-700"
      />
    )}

    <div className="relative">
      <input
        type="text"
        value={searchInput}
        onChange={(e) => {
          onSearchInputChange(e.target.value);
          onShowSuggestionsChange(true);
        }}
        onFocus={() => onShowSuggestionsChange(true)}
        placeholder="Search for historical figures..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />

      {showSuggestions && searchInput && suggestions.length > 0 && (
        <EntitySuggestions
          suggestions={suggestions}
          onSelect={onAddEntity}
          onClose={() => onShowSuggestionsChange(false)}
        />
      )}
    </div>

    <p className="text-xs text-gray-500 mt-2">
      Find patterns mentioning specific historical figures
    </p>
  </div>
);

const EntitySuggestions = ({ suggestions, onSelect, onClose }) => (
  <>
    <div
      className="fixed inset-0 z-10"
      onClick={onClose}
    />
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
      {suggestions.map((entity) => (
        <button
          key={entity.id}
          onClick={() => onSelect(entity.name)}
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
);

const WordSearchSection = ({
  selectedWords,
  searchInput,
  onSearchInputChange,
  onAddWord,
  onRemoveWord
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Word Search
      {selectedWords.length > 0 && (
        <span className="ml-2 text-xs text-gray-500">
          ({selectedWords.length} words)
        </span>
      )}
    </label>

    {selectedWords.length > 0 && (
      <TagList
        items={selectedWords}
        onRemove={onRemoveWord}
        colorClass="bg-green-100 text-green-700"
      />
    )}

    <InputWithButton
      value={searchInput}
      onChange={onSearchInputChange}
      onAdd={onAddWord}
      placeholder="e.g., torture, Venice..."
      buttonColor="green"
    />

    <p className="text-xs text-gray-500 mt-2">
      Find patterns containing specific words or phrases
    </p>
  </div>
);

const ExclusionSection = ({
  exclusions,
  exclusionInput,
  onExclusionInputChange,
  onAddExclusion,
  onRemoveExclusion
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Exclude Words
      {exclusions.length > 0 && (
        <span className="ml-2 text-xs text-gray-500">
          ({exclusions.length} excluded)
        </span>
      )}
    </label>

    {exclusions.length > 0 && (
      <TagList
        items={exclusions}
        onRemove={onRemoveExclusion}
        colorClass="bg-red-100 text-red-700"
      />
    )}

    <InputWithButton
      value={exclusionInput}
      onChange={onExclusionInputChange}
      onAdd={onAddExclusion}
      placeholder="e.g., hoohoo..."
      buttonColor="red"
    />

    <p className="text-xs text-gray-500 mt-2">
      Filter out patterns containing unwanted words
    </p>
  </div>
);

const MinScoreSection = ({ value, onChange }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-gray-700">
        Minimum Composite Score
      </label>
      <span className="text-sm font-semibold text-blue-600">
        {value}
      </span>
    </div>

    <input
      type="range"
      min="0"
      max="100"
      step="5"
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
);

const ResultsPerSegmentSection = ({ value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Results Per Segment
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
    >
      {RESULTS_PER_SEGMENT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}{option === 100 ? ' (default)' : ''}
        </option>
      ))}
    </select>

    <p className="text-xs text-gray-500 mt-2">
      Maximum patterns to generate per segment (higher = longer processing)
    </p>
  </div>
);

const ActiveFiltersSummary = ({ filters }) => {
  const entitySearch = filters.entitySearch || [];
  const wordSearch = filters.wordSearch || [];
  const wordExclusions = filters.wordExclusions || [];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex gap-2">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800">
          <p className="font-medium mb-1">Active Filters:</p>
          <ul className="space-y-0.5 text-blue-700">
            {filters.spoilageMax !== DEFAULT_FILTERS.spoilageMax && (
              <li>• Spoilage: {Math.round(filters.spoilageMax * 100)}%</li>
            )}
            {entitySearch.length > 0 && (
              <li>• Entities: {entitySearch.join(', ')}</li>
            )}
            {wordSearch.length > 0 && (
              <li>• Contains: {wordSearch.join(', ')}</li>
            )}
            {wordExclusions.length > 0 && (
              <li>• Excludes: {wordExclusions.join(', ')}</li>
            )}
            {filters.minCompositeScore > 0 && (
              <li>• Min score: {filters.minCompositeScore}</li>
            )}
            {filters.resultsPerSegment !== DEFAULT_FILTERS.resultsPerSegment && (
              <li>• Results limit: {filters.resultsPerSegment}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

const TagList = ({ items, onRemove, colorClass }) => (
  <div className="flex flex-wrap gap-2 mb-3">
    {items.map((item) => (
      <span
        key={item}
        className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${colorClass}`}
      >
        {item}
        <button
          onClick={() => onRemove(item)}
          className="hover:opacity-80 transition-opacity"
          aria-label={`Remove ${item}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    ))}
  </div>
);

const InputWithButton = ({ value, onChange, onAdd, placeholder, buttonColor }) => {
  const buttonColors = {
    green: {
      enabled: 'text-white bg-green-600 hover:bg-green-700',
      disabled: 'text-gray-400 bg-gray-100 cursor-not-allowed'
    },
    red: {
      enabled: 'text-white bg-red-600 hover:bg-red-700',
      disabled: 'text-gray-400 bg-gray-100 cursor-not-allowed'
    }
  };

  const colors = buttonColors[buttonColor];
  const isEnabled = value.trim();

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isEnabled ? colors.enabled : colors.disabled
        }`}
      >
        Add
      </button>
    </div>
  );
};

export default FilterPanel;