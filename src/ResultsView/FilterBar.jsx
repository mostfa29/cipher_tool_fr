// src/ResultsView/FilterBar.jsx
// Results filtering bar with score range, method, entity, and quick filters

import React, { useState, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Filter, User, ChevronDown, X, Check } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const METHOD_NAMES = {
  unusual_spelling: 'Unusual Spelling',
  nomenclator: 'Nomenclator',
  anagram: 'Anagram',
  caesar_rot13: 'Caesar ROT-13',
  caesar_rot3: 'Caesar ROT-3',
  caesar_rot23: 'Caesar ROT-23',
  pig_latin_us: 'Pig Latin (us)',
  pig_latin_ay: 'Pig Latin (ay)',
  letter_doubling: 'Letter Doubling',
};

const DEFAULT_FILTERS = {
  minScore: 0,
  maxScore: 100,
  methods: [],
  entities: [],
  highConfidenceOnly: false,
};

const HIGH_CONFIDENCE_THRESHOLD = 70;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FilterBar = () => {
  const { state, dispatch } = useAppState();
  
  const [showMethodsDropdown, setShowMethodsDropdown] = useState(false);
  const [showEntitiesDropdown, setShowEntitiesDropdown] = useState(false);

  // Extract state with safe defaults
  const filters = useFilters(state);
  const availableMethods = useMemo(() => state.settings?.methods || [], [state.settings?.methods]);
  const availableEntities = useMemo(() => state.library?.entities || [], [state.library?.entities]);
  const allPatterns = useMemo(() => state.results?.patterns || [], [state.results?.patterns]);

  // Computed values
  const filteredPatterns = useFilteredPatterns(allPatterns, filters);
  const hasActiveFilters = useHasActiveFilters(filters);

  // Event handlers
  const updateFilters = useUpdateFilters(dispatch);
  
  const handleScoreChange = useCallback((type, value) => {
    const newValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    updateFilters({ [type]: newValue });
  }, [updateFilters]);

  const handleMethodToggle = useCallback((methodId) => {
    const newMethods = filters.methods.includes(methodId)
      ? filters.methods.filter(m => m !== methodId)
      : [...filters.methods, methodId];
    updateFilters({ methods: newMethods });
  }, [filters.methods, updateFilters]);

  const handleEntityToggle = useCallback((entityName) => {
    const newEntities = filters.entities.includes(entityName)
      ? filters.entities.filter(e => e !== entityName)
      : [...filters.entities, entityName];
    updateFilters({ entities: newEntities });
  }, [filters.entities, updateFilters]);

  const handleQuickFilter = useCallback((filterName) => {
    updateFilters({ [filterName]: !filters[filterName] });
  }, [filters, updateFilters]);

  const handleClearAll = useCallback(() => {
    updateFilters(DEFAULT_FILTERS);
  }, [updateFilters]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <TopBar
        filters={filters}
        availableMethods={availableMethods}
        availableEntities={availableEntities}
        hasActiveFilters={hasActiveFilters}
        totalCount={allPatterns.length}
        filteredCount={filteredPatterns.length}
        showMethodsDropdown={showMethodsDropdown}
        showEntitiesDropdown={showEntitiesDropdown}
        onScoreChange={handleScoreChange}
        onMethodToggle={handleMethodToggle}
        onEntityToggle={handleEntityToggle}
        onQuickFilter={handleQuickFilter}
        onClearAll={handleClearAll}
        onToggleMethodsDropdown={() => {
          setShowMethodsDropdown(!showMethodsDropdown);
          setShowEntitiesDropdown(false);
        }}
        onToggleEntitiesDropdown={() => {
          setShowEntitiesDropdown(!showEntitiesDropdown);
          setShowMethodsDropdown(false);
        }}
        onCloseDropdowns={() => {
          setShowMethodsDropdown(false);
          setShowEntitiesDropdown(false);
        }}
      />

      {hasActiveFilters && (
        <ActiveFiltersPills
          filters={filters}
          onScoreChange={handleScoreChange}
          onMethodToggle={handleMethodToggle}
          onEntityToggle={handleEntityToggle}
          onQuickFilter={handleQuickFilter}
        />
      )}
    </div>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useFilters(state) {
  return useMemo(() => {
    const activeFilters = state.results?.activeFilters || {};
    return {
      minScore: activeFilters.minScore || 0,
      maxScore: activeFilters.maxScore !== undefined ? activeFilters.maxScore : 100,
      methods: activeFilters.methods || [],
      entities: activeFilters.entities || [],
      highConfidenceOnly: activeFilters.highConfidenceOnly || false,
    };
  }, [state.results?.activeFilters]);
}

function useFilteredPatterns(patterns, filters) {
  return useMemo(() => {
    if (!Array.isArray(patterns)) {
      console.warn('FilterBar: No patterns array available');
      return [];
    }
    
    let filtered = [...patterns];

    // Score range filter
    if (filters.minScore > 0) {
      filtered = filtered.filter(p => (p.scores?.composite || 0) >= filters.minScore);
    }
    if (filters.maxScore < 100) {
      filtered = filtered.filter(p => (p.scores?.composite || 0) <= filters.maxScore);
    }

    // Methods filter
    if (Array.isArray(filters.methods) && filters.methods.length > 0) {
      filtered = filtered.filter(p => {
        const patternMethods = p.best_candidate?.method || p.method;
        if (!patternMethods) return false;
        const methodArray = Array.isArray(patternMethods) ? patternMethods : [patternMethods];
        return methodArray.some(m => filters.methods.includes(m));
      });
    }

    // Entities filter
    if (Array.isArray(filters.entities) && filters.entities.length > 0) {
      filtered = filtered.filter(p => {
        const entities = p.entities_detected || [];
        return entities.some(e => filters.entities.includes(e.name || e));
      });
    }

    // High confidence filter
    if (filters.highConfidenceOnly) {
      filtered = filtered.filter(p => (p.scores?.composite || 0) >= HIGH_CONFIDENCE_THRESHOLD);
    }

    return filtered;
  }, [patterns, filters]);
}

function useHasActiveFilters(filters) {
  return useMemo(() => {
    return (
      filters.minScore > 0 ||
      filters.maxScore < 100 ||
      (Array.isArray(filters.methods) && filters.methods.length > 0) ||
      (Array.isArray(filters.entities) && filters.entities.length > 0) ||
      filters.highConfidenceOnly
    );
  }, [filters]);
}

function useUpdateFilters(dispatch) {
  return useCallback((updates) => {
    dispatch({
      type: ACTIONS.UPDATE_RESULT_FILTERS,
      payload: updates,
    });
  }, [dispatch]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMethodName(methodId) {
  return METHOD_NAMES[methodId] || methodId;
}

// ============================================================================
// SUB-COMPONENTS - TOP BAR
// ============================================================================

const TopBar = ({
  filters,
  availableMethods,
  availableEntities,
  hasActiveFilters,
  totalCount,
  filteredCount,
  showMethodsDropdown,
  showEntitiesDropdown,
  onScoreChange,
  onMethodToggle,
  onEntityToggle,
  onQuickFilter,
  onClearAll,
  onToggleMethodsDropdown,
  onToggleEntitiesDropdown,
  onCloseDropdowns,
}) => (
  <div className="px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-wrap">
        <ScoreRangeInput
          minScore={filters.minScore}
          maxScore={filters.maxScore}
          onScoreChange={onScoreChange}
        />

        {availableMethods.length > 0 && (
          <MethodsFilter
            selectedMethods={filters.methods}
            availableMethods={availableMethods}
            isOpen={showMethodsDropdown}
            onToggle={onToggleMethodsDropdown}
            onMethodToggle={onMethodToggle}
            onClose={onCloseDropdowns}
            onClearMethods={() => onMethodToggle(filters.methods, [])}
          />
        )}

        {availableEntities.length > 0 && (
          <EntitiesFilter
            selectedEntities={filters.entities}
            availableEntities={availableEntities}
            isOpen={showEntitiesDropdown}
            onToggle={onToggleEntitiesDropdown}
            onEntityToggle={onEntityToggle}
            onClose={onCloseDropdowns}
            onClearEntities={() => onEntityToggle(filters.entities, [])}
          />
        )}

        <div className="h-6 w-px bg-gray-300" />

        <QuickFilterButton
          label="High Confidence"
          icon={Check}
          isActive={filters.highConfidenceOnly}
          onClick={() => onQuickFilter('highConfidenceOnly')}
        />
      </div>

      <ResultsCounter
        filteredCount={filteredCount}
        totalCount={totalCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={onClearAll}
      />
    </div>
  </div>
);

const ScoreRangeInput = ({ minScore, maxScore, onScoreChange }) => (
  <div className="flex items-center gap-2">
    <label className="text-sm text-gray-600">Score:</label>
    <input
      type="number"
      min="0"
      max="100"
      value={minScore}
      onChange={(e) => onScoreChange('minScore', e.target.value)}
      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
    <span className="text-gray-400">-</span>
    <input
      type="number"
      min="0"
      max="100"
      value={maxScore}
      onChange={(e) => onScoreChange('maxScore', e.target.value)}
      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const MethodsFilter = ({
  selectedMethods,
  availableMethods,
  isOpen,
  onToggle,
  onMethodToggle,
  onClose,
  onClearMethods,
}) => (
  <div className="relative">
    <FilterButton
      icon={Filter}
      label="Methods"
      count={selectedMethods.length}
      isActive={selectedMethods.length > 0}
      isOpen={isOpen}
      onClick={onToggle}
    />

    {isOpen && (
      <FilterDropdown onClose={onClose}>
        <DropdownHeader
          label="Filter by method"
          hasSelection={selectedMethods.length > 0}
          onClear={() => {
            selectedMethods.forEach(method => onMethodToggle(method));
          }}
        />
        {availableMethods.map((method) => (
          <CheckboxItem
            key={method.id}
            label={getMethodName(method.id)}
            checked={selectedMethods.includes(method.id)}
            onChange={() => onMethodToggle(method.id)}
          />
        ))}
      </FilterDropdown>
    )}
  </div>
);

const EntitiesFilter = ({
  selectedEntities,
  availableEntities,
  isOpen,
  onToggle,
  onEntityToggle,
  onClose,
  onClearEntities,
}) => (
  <div className="relative">
    <FilterButton
      icon={User}
      label="Entities"
      count={selectedEntities.length}
      isActive={selectedEntities.length > 0}
      isOpen={isOpen}
      onClick={onToggle}
    />

    {isOpen && (
      <FilterDropdown onClose={onClose}>
        <DropdownHeader
          label="Filter by entity"
          hasSelection={selectedEntities.length > 0}
          onClear={() => {
            selectedEntities.forEach(entity => onEntityToggle(entity));
          }}
        />
        {availableEntities.slice(0, 50).map((entity) => (
          <CheckboxItem
            key={entity.id || entity.name}
            label={entity.name}
            checked={selectedEntities.includes(entity.name)}
            onChange={() => onEntityToggle(entity.name)}
          />
        ))}
      </FilterDropdown>
    )}
  </div>
);

const QuickFilterButton = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      isActive
        ? 'border-green-500 bg-green-50 text-green-700'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

const ResultsCounter = ({ filteredCount, totalCount, hasActiveFilters, onClearAll }) => (
  <div className="flex items-center gap-3">
    {hasActiveFilters && (
      <button
        onClick={onClearAll}
        className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
      >
        Clear filters
      </button>
    )}
    <div className="text-sm text-gray-600">
      Showing <span className="font-semibold text-gray-900">{filteredCount}</span>
      {filteredCount !== totalCount && (
        <span> of <span className="font-semibold text-gray-900">{totalCount}</span></span>
      )}
    </div>
  </div>
);

// ============================================================================
// SUB-COMPONENTS - REUSABLE
// ============================================================================

const FilterButton = ({ icon: Icon, label, count, isActive, isOpen, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      isActive
        ? 'border-blue-500 bg-blue-50 text-blue-700'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {count > 0 && (
      <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
        {count}
      </span>
    )}
    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
  </button>
);

const FilterDropdown = ({ children, onClose }) => (
  <>
    <div className="fixed inset-0 z-10" onClick={onClose} />
    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
      <div className="p-2">{children}</div>
    </div>
  </>
);

const DropdownHeader = ({ label, hasSelection, onClear }) => (
  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    {hasSelection && (
      <button
        onClick={onClear}
        className="text-xs text-blue-600 hover:text-blue-700"
      >
        Clear
      </button>
    )}
  </div>
);

const CheckboxItem = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ============================================================================
// SUB-COMPONENTS - ACTIVE FILTERS PILLS
// ============================================================================

const ActiveFiltersPills = ({
  filters,
  onScoreChange,
  onMethodToggle,
  onEntityToggle,
  onQuickFilter,
}) => (
  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-600">Active filters:</span>

      {filters.minScore > 0 && (
        <FilterPill
          label={`Min score: ${filters.minScore}`}
          colorClass="bg-blue-100 text-blue-700"
          onRemove={() => onScoreChange('minScore', 0)}
        />
      )}

      {filters.maxScore < 100 && (
        <FilterPill
          label={`Max score: ${filters.maxScore}`}
          colorClass="bg-blue-100 text-blue-700"
          onRemove={() => onScoreChange('maxScore', 100)}
        />
      )}

      {filters.methods.map((methodId) => (
        <FilterPill
          key={methodId}
          label={getMethodName(methodId)}
          colorClass="bg-purple-100 text-purple-700"
          onRemove={() => onMethodToggle(methodId)}
        />
      ))}

      {filters.entities.map((entity) => (
        <FilterPill
          key={entity}
          label={entity}
          colorClass="bg-green-100 text-green-700"
          onRemove={() => onEntityToggle(entity)}
        />
      ))}

      {filters.highConfidenceOnly && (
        <FilterPill
          label="High Confidence Only"
          colorClass="bg-green-100 text-green-700"
          onRemove={() => onQuickFilter('highConfidenceOnly')}
        />
      )}
    </div>
  </div>
);

const FilterPill = ({ label, colorClass, onRemove }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${colorClass}`}>
    {label}
    <button onClick={onRemove} className="hover:opacity-75">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default FilterBar;