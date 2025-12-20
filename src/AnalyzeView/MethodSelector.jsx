// src/AnalyzeView/MethodSelector.jsx
// Renaissance cipher method selection with success rate analytics and presets

import React, { useState, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Info, ChevronDown } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const CIPHER_METHODS = [
  {
    id: 'unusual_spelling',
    name: 'Unusual Spelling',
    category: 'letter_based',
    successRate: 2.25,
    icon: '✍️',
    computationalCost: 'low',
    description: 'Detects variant spellings of known entities using period orthography.',
    example: '"Whitgift" → "Whitgifte", "Walsingham" → "Walsinghame"',
    historicalBasis: 'Elizabethan spelling flexibility allowed systematic encoding',
    whenToUse: 'Most effective method. Use for all analyses.',
    enabled: true,
  },
  {
    id: 'nomenclator',
    name: 'Nomenclator Abbreviation',
    category: 'word_based',
    successRate: 2.025,
    icon: '📇',
    computationalCost: 'medium',
    description: 'Matches abbreviations and initialisms to entity names.',
    example: '"F.W." → Francis Walsingham, "T.W." → Thomas Walsingham',
    historicalBasis: 'Intelligence networks used codebook systems extensively',
    whenToUse: 'Effective for texts with many abbreviations.',
    enabled: true,
  },
  {
    id: 'anagram',
    name: 'Anagram Detection',
    category: 'letter_based',
    successRate: 0.643,
    icon: '🔤',
    computationalCost: 'high',
    description: 'Rearranges letters to form entity names and phrases.',
    example: 'Letters in "The Tragical History" → Christopher Marlowe',
    historicalBasis: 'Common Renaissance cipher method, well-documented',
    whenToUse: 'CPU-intensive. Best for titles and short segments.',
    enabled: true,
  },
  {
    id: 'caesar_rot13',
    name: 'Caesar ROT-13',
    category: 'letter_based',
    successRate: 0.353,
    icon: '🔄',
    computationalCost: 'low',
    description: 'Rotates letters 13 positions through the alphabet.',
    example: 'A→N, B→O, C→P, etc.',
    historicalBasis: 'Classical cipher with continued Renaissance use',
    whenToUse: 'Fast. Include in comprehensive analyses.',
    enabled: true,
  },
  {
    id: 'caesar_rot3',
    name: 'Caesar ROT-3',
    category: 'letter_based',
    successRate: 0.182,
    icon: '↩️',
    computationalCost: 'low',
    description: 'Rotates letters 3 positions through the alphabet.',
    example: 'A→D, B→E, C→F, etc.',
    historicalBasis: 'Caesar\'s original cipher',
    whenToUse: 'Lower effectiveness. Research shows false positives.',
    enabled: false,
  },
  {
    id: 'caesar_rot23',
    name: 'Caesar ROT-23',
    category: 'letter_based',
    successRate: 0.195,
    icon: '↪️',
    computationalCost: 'low',
    description: 'Rotates letters 23 positions (reverse of ROT-3).',
    example: 'A→X, B→Y, C→Z, D→A, etc.',
    historicalBasis: 'Inverse rotation variant',
    whenToUse: 'Lower effectiveness. Use for completeness.',
    enabled: false,
  },
  {
    id: 'pig_latin_us',
    name: 'Pig Latin (us-suffix)',
    category: 'word_based',
    successRate: 0.156,
    icon: '🐷',
    computationalCost: 'medium',
    description: 'Reverses pig latin with "us" suffix pattern.',
    example: '"Marloweus" → Marlowe',
    historicalBasis: 'Period "thieves\' cant" and concealment methods',
    whenToUse: 'Experimental. May find rare patterns.',
    enabled: false,
  },
  {
    id: 'pig_latin_ay',
    name: 'Pig Latin (ay-suffix)',
    category: 'word_based',
    successRate: 0.143,
    icon: '🐖',
    computationalCost: 'medium',
    description: 'Reverses pig latin with "ay" suffix pattern.',
    example: '"Marloway" → Marlowe',
    historicalBasis: 'Popular concealment variation',
    whenToUse: 'Experimental. Lower success rate.',
    enabled: false,
  },
  {
    id: 'letter_doubling',
    name: 'Letter Doubling',
    category: 'letter_based',
    successRate: 0.128,
    icon: '📊',
    computationalCost: 'low',
    description: 'Detects patterns where letters are systematically doubled.',
    example: '"Whitgifft" → "Whitgift"',
    historicalBasis: 'Period spelling variation technique',
    whenToUse: 'Lowest success rate. Use for comprehensive searches only.',
    enabled: false,
  },
];

const PRESETS = {
  top4: {
    label: '⭐ Top 4 (Recommended)',
    methods: ['unusual_spelling', 'nomenclator', 'anagram', 'caesar_rot13'],
    description: 'Most effective methods, ~75% of findings'
  },
  allEnabled: {
    label: 'Select All Validated',
    methods: CIPHER_METHODS.filter(m => m.enabled).map(m => m.id),
    description: 'All methods with proven success rates'
  },
  all: {
    label: 'Select All',
    methods: CIPHER_METHODS.map(m => m.id),
    description: 'Include experimental methods'
  },
  none: {
    label: 'Clear',
    methods: [],
    description: 'Deselect all methods'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MethodSelector = ({
  showSuccessRates = true,
  allowMultiple = true,
}) => {
  const { state, dispatch } = useAppState();
  const selectedMethods = state.analyze.selectedMethods || [];
  const [expandedMethod, setExpandedMethod] = useState(null);

  // Computed values
  const enabledMethods = useMemo(() => 
    CIPHER_METHODS.filter(m => m.enabled), 
    []
  );
  
  const experimentalMethods = useMemo(() => 
    CIPHER_METHODS.filter(m => !m.enabled), 
    []
  );

  const stats = useComputeStats(selectedMethods, CIPHER_METHODS);

  // Event handlers
  const handleToggle = useHandleToggle(selectedMethods, allowMultiple, dispatch);
  const handleSelectPreset = useSelectPreset(dispatch);
  const handleExpand = useCallback((methodId) => {
    setExpandedMethod(prev => prev === methodId ? null : methodId);
  }, []);

  return (
    <div className="space-y-4">
      <Header selectedCount={selectedMethods.length} />
      <PresetButtons onSelectPreset={handleSelectPreset} methodCount={CIPHER_METHODS.length} />
      
      {selectedMethods.length > 0 && <StatsPanel stats={stats} />}
      
      <MethodSection
        title="Validated Methods"
        methods={enabledMethods}
        selectedMethods={selectedMethods}
        expandedMethod={expandedMethod}
        onToggle={handleToggle}
        onExpand={handleExpand}
        showSuccessRates={showSuccessRates}
      />

      {experimentalMethods.length > 0 && (
        <MethodSection
          title="Experimental Methods"
          subtitle="Lower success rates"
          methods={experimentalMethods}
          selectedMethods={selectedMethods}
          expandedMethod={expandedMethod}
          onToggle={handleToggle}
          onExpand={handleExpand}
          showSuccessRates={showSuccessRates}
          isExperimental
        />
      )}

      <HelpPanel />
      {selectedMethods.length === 0 && <NoSelectionWarning />}
    </div>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useComputeStats(selectedMethods, allMethods) {
  return useMemo(() => {
    const totalSuccessRate = selectedMethods.reduce((sum, id) => {
      const method = allMethods.find(m => m.id === id);
      return sum + (method?.successRate || 0);
    }, 0);

    return {
      selected: selectedMethods.length,
      total: allMethods.length,
      avgSuccessRate: selectedMethods.length > 0 
        ? (totalSuccessRate / selectedMethods.length).toFixed(2)
        : 0,
      estimatedTime: (selectedMethods.length * 0.15).toFixed(1),
    };
  }, [selectedMethods, allMethods]);
}

function useHandleToggle(selectedMethods, allowMultiple, dispatch) {
  return useCallback((methodId) => {
    let newMethods;
    
    if (!allowMultiple) {
      newMethods = [methodId];
    } else {
      if (selectedMethods.includes(methodId)) {
        newMethods = selectedMethods.filter(id => id !== methodId);
      } else {
        newMethods = [...selectedMethods, methodId];
      }
    }
    
    dispatch({ type: ACTIONS.SET_SELECTED_METHODS, payload: newMethods });
  }, [selectedMethods, allowMultiple, dispatch]);
}

function useSelectPreset(dispatch) {
  return useCallback((presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      dispatch({ 
        type: ACTIONS.SET_SELECTED_METHODS, 
        payload: preset.methods 
      });
    }
  }, [dispatch]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCostColor(cost) {
  switch (cost) {
    case 'low': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'high': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

function formatCategory(category) {
  return category.replace(/_/g, ' ');
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header = ({ selectedCount }) => (
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">Cipher Methods</h3>
      <p className="text-xs text-gray-600 mt-0.5">
        Select which Renaissance cipher techniques to apply
      </p>
    </div>
    {selectedCount > 0 && (
      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
        {selectedCount} selected
      </span>
    )}
  </div>
);

const PresetButtons = ({ onSelectPreset, methodCount }) => (
  <div className="flex flex-wrap gap-2">
    {Object.entries(PRESETS).map(([key, preset]) => (
      <button
        key={key}
        onClick={() => onSelectPreset(key)}
        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title={preset.description}
      >
        {preset.label}{key === 'all' ? ` (${methodCount})` : ''}
      </button>
    ))}
  </div>
);

const StatsPanel = ({ stats }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
    <div className="grid grid-cols-3 gap-3 text-xs">
      <StatItem 
        label="Selected" 
        value={`${stats.selected}/${stats.total}`} 
      />
      <StatItem 
        label="Avg Success" 
        value={`${stats.avgSuccessRate}%`} 
      />
      <StatItem 
        label="Est. Time" 
        value={`+${stats.estimatedTime}s/segment`} 
      />
    </div>
  </div>
);

const StatItem = ({ label, value }) => (
  <div>
    <span className="text-blue-700">{label}:</span>
    <span className="ml-2 font-semibold text-blue-900">{value}</span>
  </div>
);

const MethodSection = ({
  title,
  subtitle,
  methods,
  selectedMethods,
  expandedMethod,
  onToggle,
  onExpand,
  showSuccessRates,
  isExperimental = false
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <h4 className="text-xs font-semibold text-gray-900">
        {title} ({methods.length})
      </h4>
      {subtitle && (
        <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
          {subtitle}
        </span>
      )}
    </div>
    <div className="space-y-2">
      {methods.map(method => (
        <MethodCard
          key={method.id}
          method={method}
          isSelected={selectedMethods.includes(method.id)}
          isExpanded={expandedMethod === method.id}
          onToggle={() => onToggle(method.id)}
          onExpand={() => onExpand(method.id)}
          showSuccessRates={showSuccessRates}
        />
      ))}
    </div>
  </div>
);

const MethodCard = ({
  method,
  isSelected,
  isExpanded,
  onToggle,
  onExpand,
  showSuccessRates,
}) => (
  <div
    className={`border rounded-lg transition-all ${
      isSelected
        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className="p-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />

        <div className="flex-1 min-w-0">
          <MethodCardHeader 
            method={method} 
            onExpand={onExpand} 
            isExpanded={isExpanded} 
          />
          <MethodCardMetadata 
            method={method} 
            showSuccessRates={showSuccessRates} 
          />
        </div>
      </div>
    </div>

    {isExpanded && <MethodCardDetails method={method} />}
  </div>
);

const MethodCardHeader = ({ method, onExpand, isExpanded }) => (
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-2">
      <span className="text-lg" role="img" aria-label={method.name}>
        {method.icon}
      </span>
      <div>
        <h5 className="text-sm font-medium text-gray-900">
          {method.name}
        </h5>
        <p className="text-xs text-gray-600 mt-0.5">
          {method.description}
        </p>
      </div>
    </div>

    <button
      onClick={onExpand}
      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
      title="More info"
      aria-label={isExpanded ? 'Hide details' : 'Show details'}
    >
      <ChevronDown 
        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
      />
    </button>
  </div>
);

const MethodCardMetadata = ({ method, showSuccessRates }) => (
  <div className="flex items-center gap-3 mt-2 text-xs">
    {showSuccessRates && (
      <MetadataItem 
        label="Success" 
        value={`${method.successRate}%`} 
      />
    )}
    <MetadataItem 
      label="Type" 
      value={formatCategory(method.category)} 
    />
    <CostBadge cost={method.computationalCost} />
  </div>
);

const MetadataItem = ({ label, value }) => (
  <div className="flex items-center gap-1">
    <span className="text-gray-600">{label}:</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

const CostBadge = ({ cost }) => (
  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCostColor(cost)}`}>
    {cost}
  </span>
);

const MethodCardDetails = ({ method }) => (
  <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-3">
    <DetailSection 
      title="Example" 
      content={method.example} 
      isCode 
    />
    <DetailSection 
      title="Historical Basis" 
      content={method.historicalBasis} 
    />
    <DetailSection 
      title="When to Use" 
      content={method.whenToUse} 
    />
    {!method.enabled && <ExperimentalWarning />}
  </div>
);

const DetailSection = ({ title, content, isCode = false }) => (
  <div>
    <h6 className="text-xs font-semibold text-gray-900 mb-1">
      {title}:
    </h6>
    <p className={`text-xs text-gray-700 ${
      isCode ? 'font-mono bg-white border border-gray-200 rounded px-2 py-1' : ''
    }`}>
      {content}
    </p>
  </div>
);

const ExperimentalWarning = () => (
  <div className="bg-amber-50 border border-amber-200 rounded p-2">
    <p className="text-xs text-amber-800">
      ⚠️ <strong>Experimental:</strong> Lower success rate based on corpus analysis. 
      May produce more false positives.
    </p>
  </div>
);

const HelpPanel = () => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <div className="flex gap-2">
      <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-gray-700">
        <p className="font-medium mb-1">💡 Method Selection Tips:</p>
        <ul className="space-y-1 list-disc list-inside text-gray-600">
          <li><strong>Top 4</strong> methods account for 75% of findings</li>
          <li>More methods = longer processing time but more comprehensive</li>
          <li>Success rates based on Shakespeare corpus analysis</li>
          <li>Click any method to see detailed information</li>
        </ul>
      </div>
    </div>
  </div>
);

const NoSelectionWarning = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
    <div className="flex gap-2">
      <svg
        className="w-5 h-5 text-amber-600 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="text-sm text-amber-800">
        <p className="font-medium">No methods selected</p>
        <p className="text-xs mt-1">
          Select at least one cipher method to begin analysis
        </p>
      </div>
    </div>
  </div>
);

export default MethodSelector;