// src/AnalyzeView/ProgressTracker.jsx

import React, { useState, useEffect } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';

const ProgressTracker = ({
  showDetails = false,
}) => {
  const { state, dispatch } = useAppState();
  const job = state.analyze.currentJob;
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // If no job, don't render
  if (!job) {
    return null;
  }

  const {
    status = 'idle',
    progress = 0,
    currentSegment = 0,
    totalSegments = 0,
    startTime = null,
    estimatedTime = null,
    resultsCount = 0,
    highConfidenceCount = 0,
    latestResults = [],
  } = job;

  // Calculate elapsed time
  useEffect(() => {
    if (status === 'processing' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, startTime]);

  // Format time in seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle pause
  const handlePause = () => {
    dispatch({ type: ACTIONS.PAUSE_ANALYSIS });
  };

  // Handle resume
  const handleResume = () => {
    dispatch({ type: ACTIONS.RESUME_ANALYSIS });
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this analysis?')) {
      dispatch({ type: ACTIONS.CANCEL_ANALYSIS });
    }
  };

  // Get status color and icon
  const getStatusDisplay = () => {
    switch (status) {
      case 'queued':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Queued',
          description: 'Preparing analysis...',
        };
      case 'processing':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ),
          label: 'Processing',
          description: `Segment ${currentSegment} of ${totalSegments}`,
        };
      case 'paused':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Paused',
          description: 'Analysis paused',
        };
      case 'completed':
        return {
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Completed',
          description: 'Analysis finished successfully',
        };
      case 'failed':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Failed',
          description: 'Analysis encountered an error',
        };
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Idle',
          description: 'Ready to start',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const canPause = status === 'processing';
  const canResume = status === 'paused';
  const canCancel = status === 'processing' || status === 'paused' || status === 'queued';

  if (status === 'idle') {
    return null;
  }

  return (
    <>
      {/* Compact Progress Bar */}
      <div className={`border rounded-lg ${statusDisplay.borderColor} ${statusDisplay.bgColor} overflow-hidden`}>
        {/* Header */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={statusDisplay.textColor}>
                {statusDisplay.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${statusDisplay.textColor}`}>
                    {statusDisplay.label}
                  </span>
                  {status === 'processing' && (
                    <span className="text-sm text-gray-600">
                      {progress}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {statusDisplay.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canPause && (
                <button
                  onClick={handlePause}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="Pause (Space)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}

              {canResume && (
                <button
                  onClick={handleResume}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="Resume (Space)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  title="Cancel (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {showDetails && (
                <button
                  onClick={() => setShowDetailModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  title="View Details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {(status === 'processing' || status === 'paused') && (
          <div className="px-4 pb-3">
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Segment Indicators */}
              {totalSegments > 0 && totalSegments <= 50 && (
                <div className="absolute top-0 left-0 right-0 flex h-2">
                  {Array.from({ length: totalSegments }).map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 border-r border-white last:border-r-0"
                      style={{ opacity: index < currentSegment ? 0 : 1 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span>
                  Segment: {currentSegment}/{totalSegments}
                </span>
                {elapsedTime > 0 && (
                  <span>
                    ⏱️ {formatTime(elapsedTime)}
                  </span>
                )}
                {estimatedTime && status === 'processing' && (
                  <span className="text-gray-500">
                    ~{formatTime(Math.floor(estimatedTime / 1000))} remaining
                  </span>
                )}
              </div>

              {resultsCount > 0 && (
                <div className="flex items-center gap-3">
                  <span>
                    {resultsCount} patterns found
                  </span>
                  {highConfidenceCount > 0 && (
                    <span className="text-green-600 font-medium">
                      ⭐ {highConfidenceCount} high-confidence
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Latest Results Preview */}
        {latestResults.length > 0 && status === 'processing' && (
          <div className="border-t border-gray-200 px-4 py-2 bg-white">
            <p className="text-xs font-medium text-gray-700 mb-1">Latest Findings:</p>
            <div className="space-y-1">
              {latestResults.slice(0, 3).map((result, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-blue-600 font-medium">
                    Score {result.scores?.composite || 0}:
                  </span>
                  <span className="truncate">
                    {result.decoded_pattern?.substring(0, 50) || 'Pattern detected'}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Summary */}
        {status === 'completed' && (
          <div className="border-t border-green-200 px-4 py-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {resultsCount} patterns found
                </p>
                {highConfidenceCount > 0 && (
                  <p className="text-sm text-green-600">
                    ⭐ {highConfidenceCount} high-confidence results
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Completed in {formatTime(elapsedTime)}
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'results' })}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                View Results →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Analysis Progress Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                    <div className={`flex items-center gap-2 ${statusDisplay.textColor}`}>
                      {statusDisplay.icon}
                      <span className="font-medium">{statusDisplay.label}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completion</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Segments */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Segments</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Processed</p>
                        <p className="text-lg font-semibold text-gray-900">{currentSegment}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-lg font-semibold text-gray-900">{totalSegments}</p>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Time</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Elapsed</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatTime(elapsedTime)}
                        </p>
                      </div>
                      {estimatedTime && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">Remaining</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ~{formatTime(Math.floor(estimatedTime / 1000))}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results */}
                  {resultsCount > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Results Found</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600">Total Patterns</p>
                          <p className="text-lg font-semibold text-blue-900">{resultsCount}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600">High Confidence</p>
                          <p className="text-lg font-semibold text-green-900">
                            {highConfidenceCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Latest Results */}
                  {latestResults.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Findings</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {latestResults.map((result, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-600">
                                Score: {result.scores?.composite || 0}
                              </span>
                              <span className="text-xs text-gray-500">
                                Segment {result.segment_id}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 truncate">
                              {result.decoded_pattern}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                {canPause && (
                  <button
                    onClick={() => {
                      handlePause();
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Pause
                  </button>
                )}
                {canResume && (
                  <button
                    onClick={() => {
                      handleResume();
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Resume
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => {
                      handleCancel();
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cancel Analysis
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProgressTracker;