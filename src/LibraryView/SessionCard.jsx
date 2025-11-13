// components/SessionCard.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SessionCard = ({
  session,
  onView,
  onDelete,
  onExport,
  isSelected = false,
  showCheckbox = false,
  onSelect,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Get status display
  const getStatusDisplay = () => {
    const statusMap = {
      'completed': {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Completed',
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
      },
      'failed': {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'Failed',
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
      },
      'cancelled': {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        label: 'Cancelled',
        color: 'gray',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
      },
      'processing': {
        icon: (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ),
        label: 'Processing',
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
    };
    return statusMap[session.status] || statusMap['completed'];
  };

  // Get view mode display
  const getViewModeDisplay = (mode) => {
    const modeMap = {
      'standard': { icon: '🎯', label: 'Standard' },
      'juvenilia': { icon: '📚', label: 'Juvenilia' },
      'alt_cipher': { icon: '🔢', label: 'Alt Cipher' },
      'show_all': { icon: '🌐', label: 'Show All' },
    };
    return modeMap[mode] || { icon: '🎯', label: 'Standard' };
  };

  const statusDisplay = getStatusDisplay();
  const viewModeDisplay = getViewModeDisplay(session.view_mode);

  // Calculate high confidence count
  const highConfidenceCount = session.patterns_found
    ? session.results?.filter(r => r.scores?.composite >= 70).length || 0
    : 0;

  // Handle delete
  const handleDelete = () => {
    onDelete?.(session);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className={`
          border rounded-lg bg-white transition-all
          ${isSelected
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
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
                      onSelect?.(session);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {session.source_title || 'Untitled Analysis'}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  {/* Status Badge */}
                  <span className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded border
                    ${statusDisplay.borderColor} ${statusDisplay.bgColor} ${statusDisplay.textColor}
                  `}>
                    {statusDisplay.icon}
                    <span className="font-medium">{statusDisplay.label}</span>
                  </span>

                  {/* View Mode */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                    <span>{viewModeDisplay.icon}</span>
                    <span className="font-medium">{viewModeDisplay.label}</span>
                  </span>

                  {/* Date */}
                  <span className="text-gray-600">
                    {formatDate(session.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {/* Actions Dropdown */}
              {showActionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <button
                      onClick={() => {
                        onView?.(session);
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Results
                    </button>
                    
                    <button
                      onClick={() => {
                        onExport?.(session);
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Results
                    </button>

                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Session
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Patterns Found */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {session.patterns_found?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Patterns Found
              </div>
            </div>

            {/* High Confidence */}
            {highConfidenceCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {highConfidenceCount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  High Confidence
                </div>
              </div>
            )}

            {/* Segments */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {session.segments_processed || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Segments
              </div>
            </div>

            {/* Duration */}
            {session.duration && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(session.duration)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Duration
                </div>
              </div>
            )}
          </div>

          {/* Configuration Summary */}
          {session.configuration && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-600">Config:</span>
                
                {session.configuration.spoilage_max && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                    Spoilage: {Math.round(session.configuration.spoilage_max * 100)}%
                  </span>
                )}

                {session.configuration.entity_search?.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {session.configuration.entity_search.length} entit{session.configuration.entity_search.length === 1 ? 'y' : 'ies'}
                  </span>
                )}

                {session.configuration.word_search?.length > 0 && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    {session.configuration.word_search.length} word{session.configuration.word_search.length === 1 ? '' : 's'}
                  </span>
                )}

                {session.configuration.word_exclusions?.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                    {session.configuration.word_exclusions.length} exclusion{session.configuration.word_exclusions.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {session.status === 'failed' && session.error_message && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900">Analysis Failed</p>
                  <p className="text-xs text-red-700 mt-1">{session.error_message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {session.source_author && (
                <span>by {session.source_author}</span>
              )}
              {session.source_year && (
                <span className="ml-2">({session.source_year})</span>
              )}
            </div>

            {/* View Button */}
            {session.status === 'completed' && (
              <button
                onClick={() => onView?.(session)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                View Results
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Retry Button */}
            {session.status === 'failed' && (
              <button
                onClick={() => onView?.(session)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            )}
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
                  <p className="text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this analysis session?
                </p>
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {session.source_title || 'Untitled Analysis'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {session.patterns_found?.toLocaleString() || 0} patterns found • {formatDate(session.created_at)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  All analysis results and data will be permanently removed.
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
                  Delete Session
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

SessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    source_title: PropTypes.string,
    source_author: PropTypes.string,
    source_year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    view_mode: PropTypes.string,
    created_at: PropTypes.string,
    patterns_found: PropTypes.number,
    segments_processed: PropTypes.number,
    duration: PropTypes.number,
    error_message: PropTypes.string,
    configuration: PropTypes.object,
    results: PropTypes.array,
  }).isRequired,
  onView: PropTypes.func,
  onDelete: PropTypes.func,
  onExport: PropTypes.func,
  isSelected: PropTypes.bool,
  showCheckbox: PropTypes.bool,
  onSelect: PropTypes.func,
};

export default SessionCard;