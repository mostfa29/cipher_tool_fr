// src/AnalyzeView/ProgressTracker.jsx
// Real-time progress tracking for cipher analysis jobs with pause/resume/cancel controls

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  Clock, Pause, Play, X, Info, ChevronRight, 
  CheckCircle, AlertCircle, Loader 
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  queued: {
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Clock,
    label: 'Queued',
    description: 'Preparing analysis...',
  },
  processing: {
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Loader,
    iconClass: 'animate-spin',
    label: 'Processing',
    description: (currentSegment, totalSegments) => `Segment ${currentSegment} of ${totalSegments}`,
  },
  paused: {
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: Pause,
    label: 'Paused',
    description: 'Analysis paused',
  },
  completed: {
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    label: 'Completed',
    description: 'Analysis finished successfully',
  },
  failed: {
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    label: 'Failed',
    description: 'Analysis encountered an error',
  },
  idle: {
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: Info,
    label: 'Idle',
    description: 'Ready to start',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getStatusDescription(statusConfig, currentSegment, totalSegments, job) {
  const { description } = statusConfig;
  
  // Check if this is a multi-edition job
  const isMultiEdition = job?.metadata?.is_multi_edition || 
                         job?.work_title?.includes('editions') ||
                         totalSegments > 100; // Heuristic
  
  if (typeof description === 'function') {
    const baseDesc = description(currentSegment, totalSegments);
    if (isMultiEdition) {
      return `${baseDesc} (Multi-Edition Analysis)`;
    }
    return baseDesc;
  }
  
  return description;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProgressTracker = ({ job, showDetails = false }) => {
  const { state, dispatch } = useAppState();
  
  // Use job from props or fallback to state
  const currentJob = job || state.analyze.currentJob;
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Extract job properties with defaults
  const {
    status = 'idle',
    progress = 0,
    currentSegment = 0,
    totalSegments = 0,
    startTime = null,
    estimatedTime = null,
    results_count = 0,
    high_confidence_count = 0,
    latest_results = [],
  } = currentJob || {};

  // Elapsed time tracking
  useElapsedTimeTracker(status, startTime, setElapsedTime);

  // Status configuration
  const statusConfig = useMemo(
    () => STATUS_CONFIG[status] || STATUS_CONFIG.idle,
    [status]
  );

  // Control states
  const controls = useMemo(() => ({
    canPause: status === 'processing',
    canResume: status === 'paused',
    canCancel: ['processing', 'paused', 'queued'].includes(status),
  }), [status]);

  // Event handlers
  const handlePause = useCallback(() => {
    dispatch({ type: ACTIONS.PAUSE_ANALYSIS });
  }, [dispatch]);

  const handleResume = useCallback(() => {
    dispatch({ type: ACTIONS.RESUME_ANALYSIS });
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel this analysis?')) {
      dispatch({ type: ACTIONS.CANCEL_ANALYSIS });
    }
  }, [dispatch]);

  const handleViewResults = useCallback(() => {
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'results' });
  }, [dispatch]);

  // Don't render if no job or idle
  if (!currentJob || status === 'idle') {
    return null;
  }

  return (
    <>
      <ProgressPanel
        status={status}
        statusConfig={statusConfig}
        progress={progress}
        currentSegment={currentSegment}
        totalSegments={totalSegments}
        elapsedTime={elapsedTime}
        estimatedTime={estimatedTime}
        resultsCount={results_count}
        highConfidenceCount={high_confidence_count}
        latestResults={latest_results}
        controls={controls}
        showDetails={showDetails}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onViewResults={handleViewResults}
        onShowDetails={() => setShowDetailModal(true)}
        job={currentJob}
      />

      {showDetailModal && (
        <DetailModal
          status={status}
          statusConfig={statusConfig}
          progress={progress}
          currentSegment={currentSegment}
          totalSegments={totalSegments}
          elapsedTime={elapsedTime}
          estimatedTime={estimatedTime}
          resultsCount={results_count}
          highConfidenceCount={high_confidence_count}
          latestResults={latest_results}
          controls={controls}
          onPause={handlePause}
          onResume={handleResume}
          onCancel={handleCancel}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useElapsedTimeTracker(status, startTime, setElapsedTime) {
  useEffect(() => {
    if (status === 'processing' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, startTime, setElapsedTime]);
}

// ============================================================================
// SUB-COMPONENTS - PROGRESS PANEL
// ============================================================================

const ProgressPanel = ({
  status,
  statusConfig,
  progress,
  currentSegment,
  totalSegments,
  elapsedTime,
  estimatedTime,
  resultsCount,
  highConfidenceCount,
  latestResults,
  controls,
  showDetails,
  onPause,
  onResume,
  onCancel,
  onViewResults,
  onShowDetails,
  job,
}) => (
  <div className={`border rounded-lg ${statusConfig.borderColor} ${statusConfig.bgColor} overflow-hidden`}>
    <PanelHeader
      statusConfig={statusConfig}
      status={status}
      progress={progress}
      currentSegment={currentSegment}
      totalSegments={totalSegments}
      controls={controls}
      showDetails={showDetails}
      onPause={onPause}
      onResume={onResume}
      onCancel={onCancel}
      onShowDetails={onShowDetails}
      job={job}
    />

    {(status === 'processing' || status === 'paused') && (
      <ProgressSection
        status={status}
        progress={progress}
        currentSegment={currentSegment}
        totalSegments={totalSegments}
        elapsedTime={elapsedTime}
        estimatedTime={estimatedTime}
        resultsCount={resultsCount}
        highConfidenceCount={highConfidenceCount}
      />
    )}

    {latestResults.length > 0 && status === 'processing' && (
      <LatestResultsPreview results={latestResults} />
    )}

    {status === 'completed' && (
      <CompletedSummary
        resultsCount={resultsCount}
        highConfidenceCount={highConfidenceCount}
        elapsedTime={elapsedTime}
        onViewResults={onViewResults}
      />
    )}
  </div>
);

const PanelHeader = ({
  statusConfig,
  status,
  progress,
  currentSegment,
  totalSegments,
  controls,
  showDetails,
  onPause,
  onResume,
  onCancel,
  onShowDetails,
  job,
}) => {
  const StatusIcon = statusConfig.icon;
  
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={statusConfig.textColor}>
            <StatusIcon className={`w-5 h-5 ${statusConfig.iconClass || ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
              {status === 'processing' && (
                <span className="text-sm text-gray-600">
                  {progress}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {getStatusDescription(statusConfig, currentSegment, totalSegments, job)}
            </p>
          </div>
        </div>

        <ControlButtons
          controls={controls}
          showDetails={showDetails}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onShowDetails={onShowDetails}
        />
      </div>
    </div>
  );
};

const ControlButtons = ({
  controls,
  showDetails,
  onPause,
  onResume,
  onCancel,
  onShowDetails,
}) => (
  <div className="flex items-center gap-2">
    {controls.canPause && (
      <IconButton onClick={onPause} title="Pause (Space)" icon={Pause} />
    )}
    {controls.canResume && (
      <IconButton onClick={onResume} title="Resume (Space)" icon={Play} />
    )}
    {controls.canCancel && (
      <IconButton 
        onClick={onCancel} 
        title="Cancel (Esc)" 
        icon={X} 
        hoverClass="hover:text-red-600" 
      />
    )}
    {showDetails && (
      <IconButton onClick={onShowDetails} title="View Details" icon={Info} />
    )}
  </div>
);

const IconButton = ({ onClick, title, icon: Icon, hoverClass = 'hover:text-gray-900' }) => (
  <button
    onClick={onClick}
    className={`p-2 text-gray-600 ${hoverClass} hover:bg-white rounded-lg transition-colors`}
    title={title}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const ProgressSection = ({
  status,
  progress,
  currentSegment,
  totalSegments,
  elapsedTime,
  estimatedTime,
  resultsCount,
  highConfidenceCount,
}) => (
  <div className="px-4 pb-3">
    <ProgressBar
      progress={progress}
      status={status}
      currentSegment={currentSegment}
      totalSegments={totalSegments}
    />
    <StatsRow
      currentSegment={currentSegment}
      totalSegments={totalSegments}
      elapsedTime={elapsedTime}
      estimatedTime={estimatedTime}
      status={status}
      resultsCount={resultsCount}
      highConfidenceCount={highConfidenceCount}
    />
  </div>
);

const ProgressBar = ({ progress, status, currentSegment, totalSegments }) => (
  <div className="relative">
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${
          status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
    
    {totalSegments > 0 && totalSegments <= 50 && (
      <SegmentIndicators
        totalSegments={totalSegments}
        currentSegment={currentSegment}
      />
    )}
  </div>
);

const SegmentIndicators = ({ totalSegments, currentSegment }) => (
  <div className="absolute top-0 left-0 right-0 flex h-2">
    {Array.from({ length: totalSegments }).map((_, index) => (
      <div
        key={index}
        className="flex-1 border-r border-white last:border-r-0"
        style={{ opacity: index < currentSegment ? 0 : 1 }}
      />
    ))}
  </div>
);

const StatsRow = ({
  currentSegment,
  totalSegments,
  elapsedTime,
  estimatedTime,
  status,
  resultsCount,
  highConfidenceCount,
}) => (
  <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
    <div className="flex items-center gap-4">
      <span>Segment: {currentSegment}/{totalSegments}</span>
      {elapsedTime > 0 && (
        <span>⏱️ {formatTime(elapsedTime)}</span>
      )}
      {estimatedTime && status === 'processing' && (
        <span className="text-gray-500">
          ~{formatTime(Math.floor(estimatedTime / 1000))} remaining
        </span>
      )}
    </div>

    {resultsCount > 0 && (
      <ResultsStats
        resultsCount={resultsCount}
        highConfidenceCount={highConfidenceCount}
      />
    )}
  </div>
);

const ResultsStats = ({ resultsCount, highConfidenceCount }) => (
  <div className="flex items-center gap-3">
    <span>{resultsCount} patterns found</span>
    {highConfidenceCount > 0 && (
      <span className="text-green-600 font-medium">
        ⭐ {highConfidenceCount} high-confidence
      </span>
    )}
  </div>
);

const LatestResultsPreview = ({ results }) => (
  <div className="border-t border-gray-200 px-4 py-2 bg-white">
    <p className="text-xs font-medium text-gray-700 mb-1">Latest Findings:</p>
    <div className="space-y-1">
      {results.slice(0, 3).map((result, index) => (
        <ResultPreviewItem key={index} result={result} />
      ))}
    </div>
  </div>
);

const ResultPreviewItem = ({ result }) => (
  <div className="flex items-center gap-2 text-xs text-gray-600">
    <span className="text-blue-600 font-medium">
      Score {result.scores?.composite || 0}:
    </span>
    <span className="truncate">
      {result.decoded_pattern?.substring(0, 50) || 'Pattern detected'}...
    </span>
  </div>
);

const CompletedSummary = ({
  resultsCount,
  highConfidenceCount,
  elapsedTime,
  onViewResults,
}) => (
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
        onClick={onViewResults}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
      >
        View Results
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ============================================================================
// SUB-COMPONENTS - DETAIL MODAL
// ============================================================================

const DetailModal = ({
  status,
  statusConfig,
  progress,
  currentSegment,
  totalSegments,
  elapsedTime,
  estimatedTime,
  resultsCount,
  highConfidenceCount,
  latestResults,
  controls,
  onPause,
  onResume,
  onCancel,
  onClose,
}) => (
  <>
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={onClose}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader onClose={onClose} />
        <ModalContent
          status={status}
          statusConfig={statusConfig}
          progress={progress}
          currentSegment={currentSegment}
          totalSegments={totalSegments}
          elapsedTime={elapsedTime}
          estimatedTime={estimatedTime}
          resultsCount={resultsCount}
          highConfidenceCount={highConfidenceCount}
          latestResults={latestResults}
        />
        <ModalFooter
          controls={controls}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onClose={onClose}
        />
      </div>
    </div>
  </>
);

const ModalHeader = ({ onClose }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Analysis Progress Details</h3>
    <button
      onClick={onClose}
      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

const ModalContent = ({
  status,
  statusConfig,
  progress,
  currentSegment,
  totalSegments,
  elapsedTime,
  estimatedTime,
  resultsCount,
  highConfidenceCount,
  latestResults,
}) => {
  const StatusIcon = statusConfig.icon;
  
  return (
    <div className="p-6 overflow-y-auto max-h-[60vh]">
      <div className="space-y-4">
        <ModalSection title="Status">
          <div className={`flex items-center gap-2 ${statusConfig.textColor}`}>
            <StatusIcon className={`w-5 h-5 ${statusConfig.iconClass || ''}`} />
            <span className="font-medium">{statusConfig.label}</span>
          </div>
        </ModalSection>

        <ModalSection title="Progress">
          <ProgressDetail progress={progress} />
        </ModalSection>

        <ModalSection title="Segments">
          <SegmentDetail
            currentSegment={currentSegment}
            totalSegments={totalSegments}
          />
        </ModalSection>

        <ModalSection title="Time">
          <TimeDetail
            elapsedTime={elapsedTime}
            estimatedTime={estimatedTime}
          />
        </ModalSection>

        {resultsCount > 0 && (
          <ModalSection title="Results Found">
            <ResultsDetail
              resultsCount={resultsCount}
              highConfidenceCount={highConfidenceCount}
            />
          </ModalSection>
        )}

        {latestResults.length > 0 && (
          <ModalSection title="Latest Findings">
            <LatestResultsDetail results={latestResults} />
          </ModalSection>
        )}
      </div>
    </div>
  );
};

const ModalSection = ({ title, children }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
    {children}
  </div>
);

const ProgressDetail = ({ progress }) => (
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
);

const SegmentDetail = ({ currentSegment, totalSegments }) => (
  <div className="grid grid-cols-2 gap-3">
    <StatCard label="Processed" value={currentSegment} />
    <StatCard label="Total" value={totalSegments} />
  </div>
);

const TimeDetail = ({ elapsedTime, estimatedTime }) => (
  <div className="grid grid-cols-2 gap-3">
    <StatCard label="Elapsed" value={formatTime(elapsedTime)} />
    {estimatedTime && (
      <StatCard label="Remaining" value={`~${formatTime(Math.floor(estimatedTime / 1000))}`} />
    )}
  </div>
);

const ResultsDetail = ({ resultsCount, highConfidenceCount }) => (
  <div className="grid grid-cols-2 gap-3">
    <StatCard
      label="Total Patterns"
      value={resultsCount}
      bgColor="bg-blue-50"
      textColor="text-blue-600"
      valueColor="text-blue-900"
    />
    <StatCard
      label="High Confidence"
      value={highConfidenceCount}
      bgColor="bg-green-50"
      textColor="text-green-600"
      valueColor="text-green-900"
    />
  </div>
);

const StatCard = ({
  label,
  value,
  bgColor = 'bg-gray-50',
  textColor = 'text-gray-600',
  valueColor = 'text-gray-900'
}) => (
  <div className={`${bgColor} rounded-lg p-3`}>
    <p className={`text-xs ${textColor}`}>{label}</p>
    <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
  </div>
);

const LatestResultsDetail = ({ results }) => (
  <div className="space-y-2 max-h-40 overflow-y-auto">
    {results.map((result, index) => (
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
);

const ModalFooter = ({ controls, onPause, onResume, onCancel, onClose }) => (
  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
    {controls.canPause && (
      <button
        onClick={() => {
          onPause();
          onClose();
        }}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
      >
        Pause
      </button>
    )}
    {controls.canResume && (
      <button
        onClick={() => {
          onResume();
          onClose();
        }}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Resume
      </button>
    )}
    {controls.canCancel && (
      <button
        onClick={() => {
          onCancel();
          onClose();
        }}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
      >
        Cancel Analysis
      </button>
    )}
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
    >
      Close
    </button>
  </div>
);

export default ProgressTracker;