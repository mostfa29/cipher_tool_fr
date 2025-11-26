// LibraryView/SourceCard.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';

const SourceCard = ({
  source,
  showActions = true,
  compact = false,
}) => {
  const { state, dispatch, loadWork } = useAppState();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if currently analyzing
  const isAnalyzing = state.ui.isLoading?.work === source.id;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get source type icon and color
  const getSourceTypeDisplay = () => {
    const typeMap = {
      'play': {
        icon: '🎭',
        label: 'Play',
        color: 'purple',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
      },
      'poem': {
        icon: '📜',
        label: 'Poem',
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      'sonnet': {
        icon: '💝',
        label: 'Sonnet',
        color: 'pink',
        bgColor: 'bg-pink-50',
        textColor: 'text-pink-700',
        borderColor: 'border-pink-200',
      },
      'letter': {
        icon: '✉️',
        label: 'Letter',
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
      },
      'document': {
        icon: '📄',
        label: 'Document',
        color: 'gray',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
      },
      'other': {
        icon: '📝',
        label: 'Other',
        color: 'gray',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
      },
    };
    return typeMap[source.type] || typeMap['other'];
  };

  // Get era display
  const getEraDisplay = (era) => {
    const eraMap = {
      'pre_1593': { label: 'Pre-1593 (Juvenilia)', color: 'text-green-600' },
      'post_1593': { label: 'Post-1593 (Mature)', color: 'text-blue-600' },
      'unknown': { label: 'Unknown Era', color: 'text-gray-600' },
    };
    return eraMap[era] || eraMap['unknown'];
  };

  // Truncate text
  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Calculate text statistics
  const getTextStats = () => {
    const text = source.content || source.text || '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    const lineCount = source.line_count || text.split('\n').filter(Boolean).length;
    
    return { wordCount, charCount, lineCount };
  };

  const typeDisplay = getSourceTypeDisplay();
  const eraDisplay = getEraDisplay(source.era);
  const stats = getTextStats();

  // Handle edit
  const handleEdit = () => {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: 'Edit functionality coming soon',
      },
    });
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      // Call API to delete source
      // await api.deleteSource(source.id);
      
      dispatch({ type: ACTIONS.DELETE_SOURCE, payload: source.id });
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: `Deleted "${source.title || 'source'}"`,
        },
      });
      setShowDeleteConfirm(false);
    } catch (error) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: `Failed to delete: ${error.message}`,
        },
      });
    }
  };

  // Handle analyze/load work
  const handleAnalyze = async () => {
    try {
      // Load the work into workspace
      await loadWork(source.author_folder || source.author, source.id);
      
      // Navigate to workspace
      dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
    } catch (error) {
      // Error handling is done in loadWork
      console.error('Failed to load work:', error);
    }
  };

  return (
    <>
      <div className={`
        border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all
        ${compact ? 'p-3' : ''}
      `}>
        {/* Header */}
        <div className={`${compact ? '' : 'px-4 py-3 border-b border-gray-200'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`}>
                {source.title || 'Untitled Source'}
              </h3>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Type Badge */}
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border
                  ${typeDisplay.borderColor} ${typeDisplay.bgColor} ${typeDisplay.textColor}
                `}>
                  <span>{typeDisplay.icon}</span>
                  <span className="font-medium">{typeDisplay.label}</span>
                </span>

                {/* Era */}
                {source.era && (
                  <span className={`text-xs font-medium ${eraDisplay.color}`}>
                    {eraDisplay.label}
                  </span>
                )}

                {/* Author */}
                {source.author && (
                  <span className="text-xs text-gray-600">
                    by <span className="font-medium text-gray-900">{source.author}</span>
                  </span>
                )}

                {/* Date/Year */}
                {(source.year || source.date) && (
                  <span className="text-xs text-gray-600">
                    ({source.year || source.date})
                  </span>
                )}
              </div>
            </div>

            {/* Actions Dropdown */}
            {showActions && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit source"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete source"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        {!compact && (
          <div className="px-4 py-3">
            {/* Description */}
            {source.description && (
              <p className="text-sm text-gray-600 mb-3">
                {source.description}
              </p>
            )}

            {/* Text Preview */}
            {(source.content || source.text) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Text Preview</span>
                  {(source.content || source.text).length > 200 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-words">
                  {isExpanded 
                    ? (source.content || source.text)
                    : truncateText(source.content || source.text, 200)
                  }
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>{stats.wordCount.toLocaleString()} words</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{stats.charCount.toLocaleString()} chars</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>{stats.lineCount.toLocaleString()} lines</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`${compact ? 'mt-3' : 'px-4 py-3 border-t border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            {!compact && (
              <div className="text-xs text-gray-500">
                {source.created_at && (
                  <span>Added {formatDate(source.created_at)}</span>
                )}
                {source.last_analyzed && (
                  <span className="ml-3">
                    Last analyzed {formatDate(source.last_analyzed)}
                  </span>
                )}
              </div>
            )}

            {/* Open/Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${compact ? 'w-full justify-center' : ''}
                ${isAnalyzing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{compact ? 'Open' : 'Open in Workspace'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Source</h3>
                  <p className="text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">"{source.title || 'Untitled Source'}"</span>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This will permanently remove the source and all associated analysis results.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete Source
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

SourceCard.propTypes = {
  source: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    author: PropTypes.string,
    author_folder: PropTypes.string,
    type: PropTypes.string,
    era: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
    description: PropTypes.string,
    content: PropTypes.string,
    text: PropTypes.string,
    line_count: PropTypes.number,
    created_at: PropTypes.string,
    last_analyzed: PropTypes.string,
  }).isRequired,
  showActions: PropTypes.bool,
  compact: PropTypes.bool,
};

export default SourceCard;