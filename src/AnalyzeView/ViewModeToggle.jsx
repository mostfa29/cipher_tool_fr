// components/ViewModeToggle.jsx

import React from 'react';
import PropTypes from 'prop-types';

const ViewModeToggle = ({ selectedMode, onModeChange }) => {
  const modes = [
    {
      id: 'standard',
      name: 'Standard Post-1593',
      shortName: 'Standard',
      icon: '🎯',
      description: 'Prioritizes Whitgift, hoohoo, Hen, de Vere',
      details: 'Focuses on mature work and post-1593 historical figures. Best for plays and late poetry.',
      priority_entities: ['Whitgift', 'hoohoo', 'Hen', 'de Vere', 'Marina', 'Leicester'],
      color: 'blue',
    },
    {
      id: 'juvenilia',
      name: 'Juvenilia Pre-1593',
      shortName: 'Juvenilia',
      icon: '📚',
      description: 'Prioritizes Roger Manwood, Cate, classical refs',
      details: 'Focuses on early work and pre-1593 figures. Best for translations and early poetry.',
      priority_entities: ['Roger Manwood', 'Cate', 'Benchkin', 'Ovid', 'Watson'],
      color: 'green',
    },
    {
      id: 'alt_cipher',
      name: 'Alt Cipher Mode',
      shortName: 'Alt Cipher',
      icon: '🔢',
      description: 'No thematic bias, pure statistical scoring',
      details: 'Ranks results by statistical significance only, ignoring entity priorities. Best for exploratory analysis.',
      priority_entities: [],
      color: 'purple',
    },
    {
      id: 'show_all',
      name: 'Show Everything',
      shortName: 'Show All',
      icon: '🌐',
      description: 'Raw top results, no filtering',
      details: 'Shows all results without any thematic filtering. Useful for comprehensive review.',
      priority_entities: [],
      color: 'gray',
    },
  ];

  const selectedModeData = modes.find(m => m.id === selectedMode);

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-gray-200',
        bg: isSelected ? 'bg-blue-50' : 'bg-white',
        text: isSelected ? 'text-blue-700' : 'text-gray-700',
        ring: isSelected ? 'ring-2 ring-blue-200' : '',
        hover: !isSelected ? 'hover:border-blue-300 hover:bg-blue-50' : '',
      },
      green: {
        border: isSelected ? 'border-green-500' : 'border-gray-200',
        bg: isSelected ? 'bg-green-50' : 'bg-white',
        text: isSelected ? 'text-green-700' : 'text-gray-700',
        ring: isSelected ? 'ring-2 ring-green-200' : '',
        hover: !isSelected ? 'hover:border-green-300 hover:bg-green-50' : '',
      },
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-gray-200',
        bg: isSelected ? 'bg-purple-50' : 'bg-white',
        text: isSelected ? 'text-purple-700' : 'text-gray-700',
        ring: isSelected ? 'ring-2 ring-purple-200' : '',
        hover: !isSelected ? 'hover:border-purple-300 hover:bg-purple-50' : '',
      },
      gray: {
        border: isSelected ? 'border-gray-500' : 'border-gray-200',
        bg: isSelected ? 'bg-gray-50' : 'bg-white',
        text: isSelected ? 'text-gray-900' : 'text-gray-700',
        ring: isSelected ? 'ring-2 ring-gray-300' : '',
        hover: !isSelected ? 'hover:border-gray-300 hover:bg-gray-50' : '',
      },
    };
    return colorMap[color];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">View Mode</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Controls how results are prioritized and filtered
          </p>
        </div>
        {selectedModeData && (
          <span className={`px-2 py-1 text-xs rounded-full ${getColorClasses(selectedModeData.color, true).bg} ${getColorClasses(selectedModeData.color, true).text}`}>
            {selectedModeData.shortName}
          </span>
        )}
      </div>

      {/* Mode Selection - Radio Group */}
      <div className="space-y-2">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const colorClasses = getColorClasses(mode.color, isSelected);

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                w-full text-left p-3 rounded-lg border-2 transition-all
                ${colorClasses.border}
                ${colorClasses.bg}
                ${colorClasses.ring}
                ${colorClasses.hover}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Radio Circle */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? `${colorClasses.border} ${colorClasses.bg}` : 'border-gray-300 bg-white'}
                  `}>
                    {isSelected && (
                      <div className={`w-2.5 h-2.5 rounded-full ${mode.color === 'blue' ? 'bg-blue-600' : mode.color === 'green' ? 'bg-green-600' : mode.color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'}`} />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{mode.icon}</span>
                    <span className={`text-sm font-medium ${colorClasses.text}`}>
                      {mode.name}
                    </span>
                    {isSelected && (
                      <svg className={`w-4 h-4 ${colorClasses.text}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {mode.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mode.details}
                  </p>

                  {/* Priority Entities */}
                  {mode.priority_entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mode.priority_entities.map((entity, index) => (
                        <span
                          key={index}
                          className={`
                            px-2 py-0.5 text-xs rounded
                            ${isSelected ? `${colorClasses.bg} ${colorClasses.text}` : 'bg-gray-100 text-gray-600'}
                          `}
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
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
            <p className="font-medium mb-1">💡 View Mode Tips:</p>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li><strong>Standard</strong>: Use for plays and mature work (post-1593)</li>
              <li><strong>Juvenilia</strong>: Use for early translations and poetry (pre-1593)</li>
              <li><strong>Alt Cipher</strong>: Use when exploring unfamiliar texts</li>
              <li><strong>Show All</strong>: Use for comprehensive review without bias</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Mode Summary */}
      {selectedModeData && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">{selectedModeData.icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Current Mode: {selectedModeData.name}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {selectedModeData.details}
              </p>
              {selectedModeData.priority_entities.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Prioritizing: {selectedModeData.priority_entities.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ViewModeToggle.propTypes = {
  selectedMode: PropTypes.oneOf(['standard', 'juvenilia', 'alt_cipher', 'show_all']).isRequired,
  onModeChange: PropTypes.func.isRequired,
};

export default ViewModeToggle;