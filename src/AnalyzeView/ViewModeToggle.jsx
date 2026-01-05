// src/AnalyzeView/ViewModeToggle.jsx
// View mode selector for cipher result prioritization and filtering

import React, { useState, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Info, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEW_MODES = [
  {
    id: 'standard',
    name: 'Standard Post-1593',
    shortName: 'Standard',
    icon: '🎯',
    description: 'Post-1593 historical context and mature works',
    details: 'Prioritizes results related to figures active after 1593: Whitgift, Marina, Hen, de Vere, Elizabeth I. Best for analyzing plays, mature poetry, and late-period works. De-prioritizes pre-1593 juvenile figures.',
    priorityEntities: ['Whitgift', 'Marina', 'Hen', 'de Vere', 'Elizabeth', 'Leicester', 'Cecil'],
    dePrioritizedEntities: ['Roger Manwood', 'Cate', 'Watson'],
    color: 'blue',
    recommended: true,
    useCase: 'Plays, sonnets, and mature work (1593+)',
  },
  {
    id: 'juvenilia',
    name: 'Juvenilia Pre-1593',
    shortName: 'Juvenilia',
    icon: '📚',
    description: 'Pre-1593 historical context and early works',
    details: 'Prioritizes results related to early figures and pre-1593 period: Roger Manwood, Cate, classical references, early patrons. Best for translations, early poetry, and apprentice work. De-prioritizes post-1593 figures like Whitgift.',
    priorityEntities: ['Roger Manwood', 'Cate', 'Benchkin', 'Ovid', 'Watson', 'Lyly'],
    dePrioritizedEntities: ['Whitgift', 'Cecil'],
    color: 'green',
    recommended: false,
    useCase: 'Early translations, juvenilia, pre-1593 poetry',
  },
  {
    id: 'alt_cipher',
    name: 'Alt Cipher Mode',
    shortName: 'Alt Cipher',
    icon: '🔢',
    description: 'Pure statistical analysis without thematic bias',
    details: 'NO thematic prioritization. Ranks results purely by: letter efficiency, entity clustering coherence, and linguistic patterns. Use when you have 17 fungible letters, 4 alternatives, and no idea what the author is saying. Best for exploratory analysis of unfamiliar texts.',
    priorityEntities: [],
    dePrioritizedEntities: [],
    color: 'purple',
    recommended: false,
    useCase: 'Exploratory analysis, unknown texts, pure statistics',
  },
  {
    id: 'other_encoder',
    name: 'Other Encoder Mode',
    shortName: 'Other Encoder',
    icon: '👤',
    description: 'Alternative authorship profiles (Jonson, Wotton, Milton)',
    details: 'Tests alternative encoder profiles: Ben Jonson, Henry Wotton, John Milton, and other period writers. Use when exploring texts that may have been encoded by someone other than the primary suspect. Includes different entity networks and biographical contexts.',
    priorityEntities: ['Ben Jonson', 'Henry Wotton', 'John Milton', 'Chapman', 'Kyd'],
    dePrioritizedEntities: [],
    color: 'orange',
    recommended: false,
    useCase: 'Alternative authorship testing, collaborative works',
  },
  {
    id: 'show_all',
    name: 'Show Everything',
    shortName: 'Show All',
    icon: '🌐',
    description: 'Raw top 500 permutations without filtering',
    details: 'Shows all results without any thematic filtering or prioritization. Returns raw top 500 permutations by composite score. Useful for comprehensive review and discovering unexpected patterns. Warning: May include more noise.',
    priorityEntities: [],
    dePrioritizedEntities: [],
    color: 'gray',
    recommended: false,
    useCase: 'Comprehensive review, pattern discovery, no bias',
  },
];

const USAGE_GUIDELINES = [
  { 
    scenario: 'Known mature work (plays, sonnets)', 
    recommendation: 'Standard Post-1593',
    icon: '🎭'
  },
  { 
    scenario: 'Early translations or poetry', 
    recommendation: 'Juvenilia Pre-1593',
    icon: '📖'
  },
  { 
    scenario: 'Unclear or experimental text', 
    recommendation: 'Alt Cipher Mode',
    icon: '🔬'
  },
  { 
    scenario: 'Testing alternative authorship', 
    recommendation: 'Other Encoder Mode',
    icon: '🕵️'
  },
  { 
    scenario: 'Want to see everything', 
    recommendation: 'Show Everything',
    icon: '🔍'
  },
];

const COLOR_CLASSES = {
  blue: {
    border: { selected: 'border-blue-500', default: 'border-gray-200' },
    bg: { selected: 'bg-gradient-to-br from-blue-50 to-indigo-50', default: 'bg-white' },
    text: { selected: 'text-blue-900', default: 'text-gray-700' },
    ring: 'ring-2 ring-blue-200',
    hover: 'hover:border-blue-300 hover:bg-blue-50',
    dot: 'bg-blue-600',
    badge: 'bg-blue-600 text-white',
  },
  green: {
    border: { selected: 'border-green-500', default: 'border-gray-200' },
    bg: { selected: 'bg-gradient-to-br from-green-50 to-emerald-50', default: 'bg-white' },
    text: { selected: 'text-green-900', default: 'text-gray-700' },
    ring: 'ring-2 ring-green-200',
    hover: 'hover:border-green-300 hover:bg-green-50',
    dot: 'bg-green-600',
    badge: 'bg-green-600 text-white',
  },
  purple: {
    border: { selected: 'border-purple-500', default: 'border-gray-200' },
    bg: { selected: 'bg-gradient-to-br from-purple-50 to-pink-50', default: 'bg-white' },
    text: { selected: 'text-purple-900', default: 'text-gray-700' },
    ring: 'ring-2 ring-purple-200',
    hover: 'hover:border-purple-300 hover:bg-purple-50',
    dot: 'bg-purple-600',
    badge: 'bg-purple-600 text-white',
  },
  orange: {
    border: { selected: 'border-orange-500', default: 'border-gray-200' },
    bg: { selected: 'bg-gradient-to-br from-orange-50 to-amber-50', default: 'bg-white' },
    text: { selected: 'text-orange-900', default: 'text-gray-700' },
    ring: 'ring-2 ring-orange-200',
    hover: 'hover:border-orange-300 hover:bg-orange-50',
    dot: 'bg-orange-600',
    badge: 'bg-orange-600 text-white',
  },
  gray: {
    border: { selected: 'border-gray-500', default: 'border-gray-200' },
    bg: { selected: 'bg-gradient-to-br from-gray-50 to-slate-50', default: 'bg-white' },
    text: { selected: 'text-gray-900', default: 'text-gray-700' },
    ring: 'ring-2 ring-gray-300',
    hover: 'hover:border-gray-300 hover:bg-gray-50',
    dot: 'bg-gray-600',
    badge: 'bg-gray-600 text-white',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ViewModeToggle = () => {
  const { state, dispatch } = useAppState();
  const selectedMode = state.analyze.viewMode || 'standard';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const selectedModeData = useMemo(
    () => VIEW_MODES.find(m => m.id === selectedMode),
    [selectedMode]
  );

  const handleModeChange = useHandleModeChange(dispatch);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">View Mode</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {selectedModeData ? selectedModeData.name : 'Select prioritization strategy'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedModeData && (
            <ModeBadge 
              label={selectedModeData.shortName}
              color={selectedModeData.color}
            />
          )}
          {isCollapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {!isCollapsed && (
        <div className="px-5 pb-5 space-y-4">
          {/* Quick Guide Toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full px-4 py-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-between text-sm font-semibold text-indigo-900"
          >
            <span>📖 View Mode Selection Guide</span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && <UsageGuidePanel />}

          {/* Mode Selector */}
          <ModeSelector 
            modes={VIEW_MODES}
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
          />

          {/* Current Mode Summary */}
          {selectedModeData && <CurrentModeSummary mode={selectedModeData} />}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useHandleModeChange(dispatch) {
  return useCallback((modeId) => {
    dispatch({
      type: ACTIONS.SET_VIEW_MODE,
      payload: modeId,
    });

    dispatch({
      type: ACTIONS.SET_SELECTED_STRATEGY,
      payload: modeId,
    });

    const mode = VIEW_MODES.find(m => m.id === modeId);
    if (mode) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: `${mode.icon} View mode: ${mode.name}`,
          duration: 2500,
        },
      });
    }

    dispatch({
      type: ACTIONS.UPDATE_SETTINGS,
      payload: { defaultViewMode: modeId },
    });
  }, [dispatch]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getColorClasses(color, isSelected) {
  const colorConfig = COLOR_CLASSES[color];
  if (!colorConfig) return COLOR_CLASSES.gray;

  return {
    border: isSelected ? colorConfig.border.selected : colorConfig.border.default,
    bg: isSelected ? colorConfig.bg.selected : colorConfig.bg.default,
    text: isSelected ? colorConfig.text.selected : colorConfig.text.default,
    ring: isSelected ? colorConfig.ring : '',
    hover: !isSelected ? colorConfig.hover : '',
    dot: colorConfig.dot,
    badge: colorConfig.badge,
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ModeBadge = ({ label, color }) => {
  const colorClasses = getColorClasses(color, true);
  return (
    <span className={`px-3 py-1 text-xs rounded-full font-bold ${colorClasses.badge}`}>
      {label}
    </span>
  );
};

const ModeSelector = ({ modes, selectedMode, onModeChange }) => (
  <div className="space-y-2" role="radiogroup" aria-label="View mode selection">
    {modes.map((mode) => (
      <ModeCard
        key={mode.id}
        mode={mode}
        isSelected={selectedMode === mode.id}
        onSelect={() => onModeChange(mode.id)}
      />
    ))}
  </div>
);

const ModeCard = ({ mode, isSelected, onSelect }) => {
  const colorClasses = getColorClasses(mode.color, isSelected);

  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all
        ${colorClasses.border}
        ${colorClasses.bg}
        ${colorClasses.ring}
        ${colorClasses.hover}
        ${isSelected ? 'shadow-md' : 'shadow-sm'}
      `}
      role="radio"
      aria-checked={isSelected}
    >
      <div className="flex items-start gap-3">
        <RadioIndicator isSelected={isSelected} color={mode.color} />
        <ModeCardContent 
          mode={mode} 
          isSelected={isSelected} 
          colorClasses={colorClasses} 
        />
      </div>
    </button>
  );
};

const RadioIndicator = ({ isSelected, color }) => {
  const colorClasses = getColorClasses(color, isSelected);
  
  return (
    <div className="flex-shrink-0 mt-0.5">
      <div className={`
        w-6 h-6 rounded-full border-2 flex items-center justify-center
        ${isSelected ? `${colorClasses.border} ${colorClasses.bg}` : 'border-gray-300 bg-white'}
      `}>
        {isSelected && (
          <div className={`w-3 h-3 rounded-full ${colorClasses.dot}`} />
        )}
      </div>
    </div>
  );
};

const ModeCardContent = ({ mode, isSelected, colorClasses }) => (
  <div className="flex-1 min-w-0">
    <ModeCardHeader 
      mode={mode} 
      isSelected={isSelected} 
      colorClasses={colorClasses} 
    />
    <ModeCardDescription 
      description={mode.description} 
      details={mode.details} 
    />
    <ModeCardUseCase useCase={mode.useCase} />
    {mode.priorityEntities.length > 0 && (
      <PriorityEntities 
        label="Prioritizes"
        entities={mode.priorityEntities} 
        isSelected={isSelected}
        colorClasses={colorClasses}
      />
    )}
    {mode.dePrioritizedEntities && mode.dePrioritizedEntities.length > 0 && (
      <PriorityEntities 
        label="De-prioritizes"
        entities={mode.dePrioritizedEntities} 
        isSelected={isSelected}
        colorClasses={colorClasses}
        isDePrioritized
      />
    )}
  </div>
);

const ModeCardHeader = ({ mode, isSelected, colorClasses }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl" role="img" aria-label={mode.name}>
      {mode.icon}
    </span>
    <span className={`text-base font-bold ${colorClasses.text}`}>
      {mode.name}
    </span>
    {mode.recommended && (
      <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
        RECOMMENDED
      </span>
    )}
    {isSelected && <Check className={`w-5 h-5 ${colorClasses.text} ml-auto`} />}
  </div>
);

const ModeCardDescription = ({ description, details }) => (
  <>
    <p className="text-sm font-semibold text-gray-900 mb-1">
      {description}
    </p>
    <p className="text-xs text-gray-600 leading-relaxed">
      {details}
    </p>
  </>
);

const ModeCardUseCase = ({ useCase }) => (
  <div className="mt-2 px-3 py-1.5 bg-white/80 border border-gray-200 rounded-lg">
    <p className="text-xs text-gray-700">
      <strong className="text-gray-900">Best for:</strong> {useCase}
    </p>
  </div>
);

const PriorityEntities = ({ label, entities, isSelected, colorClasses, isDePrioritized = false }) => (
  <div className="mt-3">
    <p className="text-xs font-semibold text-gray-700 mb-1.5">
      {isDePrioritized ? '⬇️' : '⬆️'} {label}:
    </p>
    <div className="flex flex-wrap gap-1.5">
      {entities.map((entity, index) => (
        <span
          key={index}
          className={`
            px-2 py-1 text-xs rounded-lg font-medium border
            ${isSelected 
              ? isDePrioritized
                ? 'bg-red-50 text-red-700 border-red-200'
                : `${colorClasses.bg} ${colorClasses.text} border-${colorClasses.dot.replace('bg-', '')}`
              : 'bg-gray-50 text-gray-600 border-gray-200'
            }
          `}
        >
          {entity}
        </span>
      ))}
    </div>
  </div>
);

const UsageGuidePanel = () => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
    <div className="flex gap-3">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold text-blue-900 mb-3">When to Use Each Mode:</p>
        <div className="space-y-2">
          {USAGE_GUIDELINES.map((guide, index) => (
            <GuidelineItem key={index} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const GuidelineItem = ({ guide }) => (
  <div className="flex items-start gap-2 text-xs text-blue-800">
    <span className="text-base flex-shrink-0">{guide.icon}</span>
    <div>
      <strong className="text-blue-900">{guide.scenario}:</strong>
      <span className="ml-1">{guide.recommendation}</span>
    </div>
  </div>
);

const CurrentModeSummary = ({ mode }) => {
  const colorClasses = getColorClasses(mode.color, true);
  
  return (
    <div className={`border-2 rounded-xl p-4 ${colorClasses.border} ${colorClasses.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses.badge}`}>
          <span className="text-2xl" role="img" aria-label={mode.name}>
            {mode.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 mb-1">
            Active Mode: {mode.name}
          </p>
          <p className="text-xs text-gray-700 mb-2">
            {mode.details}
          </p>
          {mode.priorityEntities.length > 0 && (
            <div className="text-xs text-gray-600">
              <strong>Focus:</strong> {mode.priorityEntities.slice(0, 3).join(', ')}
              {mode.priorityEntities.length > 3 && ` +${mode.priorityEntities.length - 3} more`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewModeToggle;