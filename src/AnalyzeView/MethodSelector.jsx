// src/AnalyzeView/MethodSelector.jsx
// Renaissance cipher method selection with success rate analytics and presets

import React, { useState, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

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
    label: 'All Validated',
    methods: CIPHER_METHODS.filter(m => m.enabled).map(m => m.id),
    description: 'All methods with proven success rates'
  },
  all: {
    label: 'Select All',
    methods: CIPHER_METHODS.map(m => m.id),
    description: 'Include experimental methods'
  },
  none: {
    label: 'Clear All',
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🔤</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Cipher Methods</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {selectedMethods.length > 0 
                ? `${selectedMethods.length} method${selectedMethods.length !== 1 ? 's' : ''} selected`
                : 'Select Renaissance cipher techniques'
              }
            </p>
          </div>
        </div>
        {isCollapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
      </button>

      {!isCollapsed && (
        <div className="px-5 pb-5 space-y-4">
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
      )}
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

    const highCostMethods = selectedMethods.filter(id => {
      const method = allMethods.find(m => m.id === id);
      return method?.computationalCost === 'high';
    }).length;

    return {
      selected: selectedMethods.length,
      total: allMethods.length,
      avgSuccessRate: selectedMethods.length > 0 
        ? (totalSuccessRate / selectedMethods.length).toFixed(2)
        : 0,
      totalSuccessRate: totalSuccessRate.toFixed(2),
      estimatedTime: (selectedMethods.length * 0.15 + highCostMethods * 0.5).toFixed(1),
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
    
    // Add notification for method selection
    const method = CIPHER_METHODS.find(m => m.id === methodId);
    if (method && !selectedMethods.includes(methodId)) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'info',
          message: `${method.icon} ${method.name} selected`,
          duration: 1500
        }
      });
    }
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
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: `${preset.label} applied (${preset.methods.length} methods)`,
          duration: 2000
        }
      });
    }
  }, [dispatch]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCostColor(cost) {
  switch (cost) {
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function formatCategory(category) {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PresetButtons = ({ onSelectPreset, methodCount }) => (
  <div className="flex flex-wrap gap-2">
    {Object.entries(PRESETS).map(([key, preset]) => (
      <button
        key={key}
        onClick={() => onSelectPreset(key)}
        className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all border-2 ${
          key === 'top4'
            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-900 hover:from-purple-100 hover:to-pink-100'
            : key === 'none'
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        title={preset.description}
      >
        {preset.label}
        {key === 'all' ? ` (${methodCount})` : 
         key === 'allEnabled' ? ` (${CIPHER_METHODS.filter(m => m.enabled).length})` :
         key === 'top4' ? ' (4)' : ''}
      </button>
    ))}
  </div>
);

const StatsPanel = ({ stats }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatItem 
        label="Selected" 
        value={`${stats.selected}/${stats.total}`}
        icon="✓"
      />
      <StatItem 
        label="Avg Success" 
        value={`${stats.avgSuccessRate}%`}
        icon="📊"
      />
      <StatItem 
        label="Total Success" 
        value={`${stats.totalSuccessRate}%`}
        icon="🎯"
      />
      <StatItem 
        label="Est. Time" 
        value={`+${stats.estimatedTime}s`}
        icon="⏱️"
        sublabel="per segment"
      />
    </div>
  </div>
);

const StatItem = ({ label, value, icon, sublabel }) => (
  <div className="text-center">
    <div className="text-sm text-blue-700 font-medium mb-1 flex items-center justify-center gap-1">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
    <div className="text-2xl font-bold text-blue-900">{value}</div>
    {sublabel && <div className="text-xs text-blue-600 mt-0.5">{sublabel}</div>}
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
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <h4 className="text-sm font-bold text-gray-900">
        {title}
      </h4>
      <span className={`px-2 py-1 text-xs font-bold rounded ${
        isExperimental 
          ? 'bg-amber-100 text-amber-700' 
          : 'bg-green-100 text-green-700'
      }`}>
        {methods.length} {isExperimental ? 'experimental' : 'validated'}
      </span>
      {subtitle && (
        <span className="text-xs text-gray-600">• {subtitle}</span>
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
    className={`border-2 rounded-xl transition-all ${
      isSelected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}
  >
    <div className="p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
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
    <div className="flex items-center gap-2 flex-1">
      <span className="text-2xl flex-shrink-0" role="img" aria-label={method.name}>
        {method.icon}
      </span>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-bold text-gray-900">
          {method.name}
        </h5>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {method.description}
        </p>
      </div>
    </div>

    <button
      onClick={onExpand}
      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      title={isExpanded ? "Hide details" : "Show details"}
      aria-label={isExpanded ? 'Hide details' : 'Show details'}
    >
      {isExpanded ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  </div>
);

const MethodCardMetadata = ({ method, showSuccessRates }) => (
  <div className="flex items-center gap-2 mt-3 text-xs flex-wrap">
    {showSuccessRates && (
      <MetadataBadge 
        label="Success" 
        value={`${method.successRate}%`}
        color="bg-green-50 text-green-700 border-green-200"
      />
    )}
    <MetadataBadge 
      label="Type" 
      value={formatCategory(method.category)}
      color="bg-blue-50 text-blue-700 border-blue-200"
    />
    <CostBadge cost={method.computationalCost} />
  </div>
);

const MetadataBadge = ({ label, value, color }) => (
  <span className={`px-2 py-1 rounded-lg border font-semibold ${color}`}>
    {label}: {value}
  </span>
);

const CostBadge = ({ cost }) => (
  <span className={`px-2 py-1 rounded-lg border font-semibold capitalize ${getCostColor(cost)}`}>
    {cost} cost
  </span>
);

const MethodCardDetails = ({ method }) => (
  <div className="border-t-2 border-gray-200 p-4 bg-gray-50 space-y-4">
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
    <h6 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1">
      <span className="text-blue-600">▸</span>
      {title}
    </h6>
    <p className={`text-xs text-gray-700 ${
      isCode ? 'font-mono bg-white border border-gray-300 rounded-lg px-3 py-2' : ''
    }`}>
      {content}
    </p>
  </div>
);

const ExperimentalWarning = () => (
  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
    <div className="flex items-start gap-2">
      <span className="text-lg flex-shrink-0">⚠️</span>
      <p className="text-xs text-amber-900">
        <strong className="font-bold">Experimental Method:</strong> Lower success rate based on corpus analysis. 
        May produce more false positives. Use with caution or combine with validated methods.
      </p>
    </div>
  </div>
);

const HelpPanel = () => (
  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
    <div className="flex gap-3">
      <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-indigo-900">
        <p className="font-bold mb-2 text-sm">💡 Method Selection Tips</p>
        <ul className="space-y-1.5 list-disc list-inside text-indigo-800">
          <li><strong>Top 4 Preset:</strong> Accounts for ~75% of all findings</li>
          <li><strong>Processing Time:</strong> More methods = longer analysis but more comprehensive</li>
          <li><strong>Success Rates:</strong> Based on extensive Shakespeare corpus analysis</li>
          <li><strong>Details:</strong> Click any method card to see examples and usage guidance</li>
          <li><strong>Experimental:</strong> Lower success rates but may catch unique patterns</li>
        </ul>
      </div>
    </div>
  </div>
);

const NoSelectionWarning = () => (
  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
        <span className="text-xl">⚠️</span>
      </div>
      <div className="flex-1">
        <p className="font-bold text-amber-900 mb-1">No Methods Selected</p>
        <p className="text-sm text-amber-800">
          Select at least one cipher method to begin analysis. We recommend starting with the 
          <strong> Top 4 Preset</strong> for optimal results.
        </p>
      </div>
    </div>
  </div>
);

export default MethodSelector;