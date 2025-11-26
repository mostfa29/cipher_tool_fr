// ResultsView/ResultCard.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';

const ResultCard = ({
  pattern,
  showCheckbox = false,
  showSegmentInfo = true,
  compact = false,
}) => {
  const { state, dispatch } = useAppState();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if this pattern is selected
  const isSelected = state.results.selectedPatterns?.includes(pattern.id) || false;

  // Handle selection toggle
  const handleSelect = () => {
    dispatch({
      type: ACTIONS.TOGGLE_PATTERN_SELECTION,
      payload: pattern.id,
    });
  };

  // Handle view details
  const handleViewDetails = () => {
    dispatch({
      type: ACTIONS.VIEW_PATTERN_DETAILS,
      payload: pattern,
    });
  };

  // Get confidence level based on composite score
  const getConfidenceLevel = (score) => {
    if (score >= 80) return { label: 'Very High', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' };
    if (score >= 70) return { label: 'High', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' };
    if (score >= 50) return { label: 'Medium', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' };
    return { label: 'Low', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' };
  };

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

  // Truncate text with ellipsis
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Extract decoded pattern text from various possible structures
  const getDecodedText = () => {
    if (pattern.decoded_pattern) return pattern.decoded_pattern;
    if (pattern.best_candidate?.decoded_text) return pattern.best_candidate.decoded_text;
    if (pattern.candidates?.[0]?.decoded_text) return pattern.candidates[0].decoded_text;
    return 'No decoded text available';
  };

  // Extract method from various possible structures
  const getMethod = () => {
    if (pattern.decoding_method) return pattern.decoding_method;
    if (pattern.best_candidate?.method) return pattern.best_candidate.method;
    if (pattern.candidates?.[0]?.method) return pattern.candidates[0].method;
    return 'unknown';
  };

  // Extract entity matches from various possible structures
  const getEntityMatches = () => {
    if (pattern.entity_matches) return pattern.entity_matches;
    if (pattern.entities_detected) return pattern.entities_detected;
    if (pattern.best_candidate?.entities) return pattern.best_candidate.entities;
    return [];
  };

  // Check for RoBERTa/coherence validation
  const hasRobertaMatch = 
    pattern.roberta_validation?.is_coherent || 
    pattern.best_candidate?.is_credible ||
    false;

  const confidence = getConfidenceLevel(pattern.scores?.composite || pattern.composite_score || 0);
  const decodedText = getDecodedText();
  const method = getMethod();
  const entityMatches = getEntityMatches();

  return (
    <div
      className={`
        border rounded-lg transition-all cursor-pointer
        ${isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={() => !showCheckbox && handleViewDetails()}
    >
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            {showCheckbox && (
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelect();
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Decoded Pattern */}
              <div className="mb-2">
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 break-words`}>
                  {isExpanded || compact
                    ? decodedText
                    : truncateText(decodedText, 150)
                  }
                </p>
                {!compact && decodedText.length > 150 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Method */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  {getMethodName(method)}
                </span>

                {/* Roberta/Credible Match */}
                {hasRobertaMatch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                    ⭐ Credible
                  </span>
                )}

                {/* Encoded Status */}
                {pattern.is_encoded && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                    🔐 Encoded
                  </span>
                )}

                {/* Segment Info */}
                {showSegmentInfo && (pattern.segment_id || pattern.section_id) && (
                  <span className="text-gray-500">
                    {pattern.section_name || `Segment ${pattern.segment_id || pattern.section_id}`}
                  </span>
                )}

                {/* Entities Count */}
                {entityMatches.length > 0 && (
                  <span className="text-gray-500">
                    {entityMatches.length} entit{entityMatches.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
              </div>

              {/* Entity Tags (if present and not compact) */}
              {!compact && entityMatches.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entityMatches.slice(0, 5).map((entity, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {entity.name || entity}
                    </span>
                  ))}
                  {entityMatches.length > 5 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      +{entityMatches.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex-shrink-0">
            <div className={`
              px-3 py-1 rounded-lg border-2 ${confidence.borderColor} ${confidence.bgColor}
            `}>
              <div className="text-center">
                <div className={`text-lg font-bold ${confidence.textColor}`}>
                  {Math.round(pattern.scores?.composite || pattern.composite_score || 0)}
                </div>
                <div className={`text-xs ${confidence.textColor}`}>
                  {confidence.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown (expandable) */}
        {!compact && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Entity:</span>
                  <span className="text-gray-900">{Math.round(pattern.scores?.entity_score || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Linguistic:</span>
                  <span className="text-gray-900">{Math.round(pattern.scores?.linguistic_score || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Statistical:</span>
                  <span className="text-gray-900">{Math.round(pattern.scores?.statistical_score || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Spoilage:</span>
                  <span className={`${
                    (pattern.spoilage_ratio || 0) <= 0.15 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {Math.round((pattern.spoilage_ratio || 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: ACTIONS.SET_SELECTED_SEGMENT,
                      payload: pattern
                    });
                    dispatch({
                      type: ACTIONS.TOGGLE_MODAL,
                      payload: { modal: 'segmentCandidates', isOpen: true }
                    });
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  All Candidates ({pattern.candidates?.length || 0})
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Mode Footer */}
        {compact && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-3">
              <span>Entity: {Math.round(pattern.scores?.entity_score || 0)}</span>
              <span>Ling: {Math.round(pattern.scores?.linguistic_score || 0)}</span>
              <span>Stat: {Math.round(pattern.scores?.statistical_score || 0)}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Details →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ResultCard.propTypes = {
  pattern: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    decoded_pattern: PropTypes.string,
    decoding_method: PropTypes.string,
    segment_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    section_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    section_name: PropTypes.string,
    is_encoded: PropTypes.bool,
    scores: PropTypes.shape({
      composite: PropTypes.number,
      entity_score: PropTypes.number,
      linguistic_score: PropTypes.number,
      statistical_score: PropTypes.number,
    }),
    composite_score: PropTypes.number,
    spoilage_ratio: PropTypes.number,
    entity_matches: PropTypes.array,
    entities_detected: PropTypes.array,
    best_candidate: PropTypes.shape({
      decoded_text: PropTypes.string,
      method: PropTypes.string,
      is_credible: PropTypes.bool,
      entities: PropTypes.array,
    }),
    candidates: PropTypes.array,
    roberta_validation: PropTypes.shape({
      is_coherent: PropTypes.bool,
    }),
  }).isRequired,
  showCheckbox: PropTypes.bool,
  showSegmentInfo: PropTypes.bool,
  compact: PropTypes.bool,
};

export default ResultCard;