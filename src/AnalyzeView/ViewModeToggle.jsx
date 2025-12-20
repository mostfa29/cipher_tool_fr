// src/AnalyzeView/ViewModeToggle.jsx
// View mode selector for cipher result prioritization and filtering

import React, { useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Info, Check } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEW_MODES = [
  {
    id: 'standard',
    name: 'Standard Post-1593',
    shortName: 'Standard',
    icon: '🎯',
    description: 'Prioritizes Whitgift, hoohoo, Hen, de Vere',
    details: 'Focuses on mature work and post-1593 historical figures. Best for plays and late poetry.',
    priorityEntities: ['Whitgift', 'hoohoo', 'Hen', 'de Vere', 'Marina', 'Leicester'],
    color: 'blue',
  },
  {
    id: 'juvenilia',
    name: 'Juvenilia Pre-1593',
    shortName: 'Juvenilia',
    icon: '📚',
    description: 'Prioritizes Roger Manwood, Cate, classical refs',
    details: 'Focuses on early work and pre-1593 figures. Best for translations and early poetry.',
    priorityEntities: ['Roger Manwood', 'Cate', 'Benchkin', 'Ovid', 'Watson'],
    color: 'green',
  },
  {
    id: 'alt_cipher',
    name: 'Alt Cipher Mode',
    shortName: 'Alt Cipher',
    icon: '🔢',
    description: 'No thematic bias, pure statistical scoring',
    details: 'Ranks results by statistical significance only, ignoring entity priorities. Best for exploratory analysis.',
    priorityEntities: [],
    color: 'purple',
  },
  {
    id: 'show_all',
    name: 'Show Everything',
    shortName: 'Show All',
    icon: '🌐',
    description: 'Raw top results, no filtering',
    details: 'Shows all results without any thematic filtering. Useful for comprehensive review.',
    priorityEntities: [],
    color: 'gray',
  },
];

const USAGE_TIPS = [
  { mode: 'Standard', usage: 'Use for plays and mature work (post-1593)' },
  { mode: 'Juvenilia', usage: 'Use for early translations and poetry (pre-1593)' },
  { mode: 'Alt Cipher', usage: 'Use when exploring unfamiliar texts' },
  { mode: 'Show All', usage: 'Use for comprehensive review without bias' },
];

const COLOR_CLASSES = {
  blue: {
    border: { selected: 'border-blue-500', default: 'border-gray-200' },
    bg: { selected: 'bg-blue-50', default: 'bg-white' },
    text: { selected: 'text-blue-700', default: 'text-gray-700' },
    ring: 'ring-2 ring-blue-200',
    hover: 'hover:border-blue-300 hover:bg-blue-50',
    dot: 'bg-blue-600',
  },
  green: {
    border: { selected: 'border-green-500', default: 'border-gray-200' },
    bg: { selected: 'bg-green-50', default: 'bg-white' },
    text: { selected: 'text-green-700', default: 'text-gray-700' },
    ring: 'ring-2 ring-green-200',
    hover: 'hover:border-green-300 hover:bg-green-50',
    dot: 'bg-green-600',
  },
  purple: {
    border: { selected: 'border-purple-500', default: 'border-gray-200' },
    bg: { selected: 'bg-purple-50', default: 'bg-white' },
    text: { selected: 'text-purple-700', default: 'text-gray-700' },
    ring: 'ring-2 ring-purple-200',
    hover: 'hover:border-purple-300 hover:bg-purple-50',
    dot: 'bg-purple-600',
  },
  gray: {
    border: { selected: 'border-gray-500', default: 'border-gray-200' },
    bg: { selected: 'bg-gray-50', default: 'bg-white' },
    text: { selected: 'text-gray-900', default: 'text-gray-700' },
    ring: 'ring-2 ring-gray-300',
    hover: 'hover:border-gray-300 hover:bg-gray-50',
    dot: 'bg-gray-600',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ViewModeToggle = () => {
  const { state, dispatch } = useAppState();
  const selectedMode = state.analyze.viewMode || 'standard';
  
  const selectedModeData = useMemo(
    () => VIEW_MODES.find(m => m.id === selectedMode),
    [selectedMode]
  );

  const handleModeChange = useHandleModeChange(dispatch);

  return (
    <div className="space-y-4">
      <Header selectedModeData={selectedModeData} />
      <ModeSelector 
        modes={VIEW_MODES}
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
      />
      <UsageTipsPanel />
      {selectedModeData && <CurrentModeSummary mode={selectedModeData} />}
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
          type: 'info',
          message: `View mode changed to: ${mode.name}`,
          duration: 2000,
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
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header = ({ selectedModeData }) => (
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">View Mode</h3>
      <p className="text-xs text-gray-600 mt-0.5">
        Controls how results are prioritized and filtered
      </p>
    </div>
    {selectedModeData && (
      <ModeBadge 
        label={selectedModeData.shortName}
        color={selectedModeData.color}
      />
    )}
  </div>
);

const ModeBadge = ({ label, color }) => {
  const colorClasses = getColorClasses(color, true);
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${colorClasses.bg} ${colorClasses.text}`}>
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
        w-full text-left p-3 rounded-lg border-2 transition-all
        ${colorClasses.border}
        ${colorClasses.bg}
        ${colorClasses.ring}
        ${colorClasses.hover}
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
        w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${isSelected ? `${colorClasses.border} ${colorClasses.bg}` : 'border-gray-300 bg-white'}
      `}>
        {isSelected && (
          <div className={`w-2.5 h-2.5 rounded-full ${colorClasses.dot}`} />
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
    {mode.priorityEntities.length > 0 && (
      <PriorityEntities 
        entities={mode.priorityEntities} 
        isSelected={isSelected}
        colorClasses={colorClasses}
      />
    )}
  </div>
);

const ModeCardHeader = ({ mode, isSelected, colorClasses }) => (
  <div className="flex items-center gap-2 mb-1">
    <span className="text-lg" role="img" aria-label={mode.name}>
      {mode.icon}
    </span>
    <span className={`text-sm font-medium ${colorClasses.text}`}>
      {mode.name}
    </span>
    {isSelected && <Check className={`w-4 h-4 ${colorClasses.text}`} />}
  </div>
);

const ModeCardDescription = ({ description, details }) => (
  <>
    <p className="text-xs text-gray-600 mb-1">
      {description}
    </p>
    <p className="text-xs text-gray-500">
      {details}
    </p>
  </>
);

const PriorityEntities = ({ entities, isSelected, colorClasses }) => (
  <div className="flex flex-wrap gap-1 mt-2">
    {entities.map((entity, index) => (
      <span
        key={index}
        className={`
          px-2 py-0.5 text-xs rounded
          ${isSelected 
            ? `${colorClasses.bg} ${colorClasses.text}` 
            : 'bg-gray-100 text-gray-600'
          }
        `}
      >
        {entity}
      </span>
    ))}
  </div>
);

const UsageTipsPanel = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
    <div className="flex gap-2">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-blue-800">
        <p className="font-medium mb-1">💡 View Mode Tips:</p>
        <ul className="space-y-1 list-disc list-inside text-blue-700">
          {USAGE_TIPS.map((tip, index) => (
            <li key={index}>
              <strong>{tip.mode}</strong>: {tip.usage}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const CurrentModeSummary = ({ mode }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <div className="flex items-start gap-2">
      <span className="text-xl" role="img" aria-label={mode.name}>
        {mode.icon}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-900">
          Current Mode: {mode.name}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {mode.details}
        </p>
        {mode.priorityEntities.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Prioritizing: {mode.priorityEntities.join(', ')}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default ViewModeToggle;