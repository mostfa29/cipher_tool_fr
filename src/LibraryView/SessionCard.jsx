// src/LibraryView/SessionCard.jsx
// Session card displaying analysis session details with actions and statistics

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  MoreVertical, Eye, Download, Trash2, CheckCircle, 
  XCircle, X as XIcon, AlertCircle, Loader, ChevronRight, RotateCcw 
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'green',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  cancelled: {
    icon: XIcon,
    label: 'Cancelled',
    color: 'gray',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  processing: {
    icon: Loader,
    iconClass: 'animate-spin',
    label: 'Processing',
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};

const VIEW_MODE_CONFIG = {
  standard: { icon: '🎯', label: 'Standard' },
  juvenilia: { icon: '📚', label: 'Juvenilia' },
  alt_cipher: { icon: '🔢', label: 'Alt Cipher' },
  show_all: { icon: '🌐', label: 'Show All' },
};

const HIGH_CONFIDENCE_THRESHOLD = 70;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SessionCard = ({
  session,
  showCheckbox = false,
  compact = false,
}) => {
  const { state, dispatch, exportResults } = useAppState();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const isSelected = useMemo(
    () => state.library.selectedSessions?.includes(session.id) || false,
    [state.library.selectedSessions, session.id]
  );

  // Computed values
  const statusDisplay = useStatusDisplay(session.status);
  const viewModeDisplay = useViewModeDisplay(session.view_mode);
  const highConfidenceCount = useHighConfidenceCount(session);

  // Event handlers
  const handleSelect = useHandleSelect(session.id, state, dispatch);
  const handleView = useHandleView(session, dispatch, setShowActionsMenu);
  const handleExport = useHandleExport(exportResults, dispatch, setShowActionsMenu);
  const handleDelete = useHandleDelete(session, dispatch, setShowDeleteConfirm);

  return (
    <>
      <div className={`border rounded-lg bg-white transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      } ${compact ? 'p-3' : ''}`}>
        
        <CardHeader
          session={session}
          statusDisplay={statusDisplay}
          viewModeDisplay={viewModeDisplay}
          compact={compact}
          showCheckbox={showCheckbox}
          isSelected={isSelected}
          showActionsMenu={showActionsMenu}
          onSelect={handleSelect}
          onToggleActionsMenu={() => setShowActionsMenu(!showActionsMenu)}
          onView={handleView}
          onExport={handleExport}
          onDelete={() => {
            setShowDeleteConfirm(true);
            setShowActionsMenu(false);
          }}
          onCloseMenu={() => setShowActionsMenu(false)}
        />

        {!compact && (
          <CardContent
            session={session}
            highConfidenceCount={highConfidenceCount}
          />
        )}

        <CardFooter
          session={session}
          compact={compact}
          onView={handleView}
        />
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          session={session}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useStatusDisplay(status) {
  return useMemo(
    () => STATUS_CONFIG[status] || STATUS_CONFIG.completed,
    [status]
  );
}

function useViewModeDisplay(viewMode) {
  return useMemo(
    () => VIEW_MODE_CONFIG[viewMode] || VIEW_MODE_CONFIG.standard,
    [viewMode]
  );
}

function useHighConfidenceCount(session) {
  return useMemo(() => {
    if (!session.patterns_found || !session.results) return 0;
    return session.results.filter(r => r.scores?.composite >= HIGH_CONFIDENCE_THRESHOLD).length;
  }, [session.patterns_found, session.results]);
}

function useHandleSelect(sessionId, state, dispatch) {
  return useCallback(() => {
    const selectedSessions = state.library.selectedSessions || [];
    const newSelection = selectedSessions.includes(sessionId)
      ? selectedSessions.filter(id => id !== sessionId)
      : [...selectedSessions, sessionId];
    
    dispatch({
      type: ACTIONS.UPDATE_SETTINGS,
      payload: { selectedSessions: newSelection },
    });
  }, [sessionId, state.library.selectedSessions, dispatch]);
}

function useHandleView(session, dispatch, setShowActionsMenu) {
  return useCallback(() => {
    dispatch({
      type: ACTIONS.RESTORE_SESSION,
      payload: session,
    });

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: `Restored session: ${session.source_title || 'analysis'}`,
        duration: 3000,
      },
    });

    setShowActionsMenu(false);
  }, [session, dispatch, setShowActionsMenu]);
}

function useHandleExport(exportResults, dispatch, setShowActionsMenu) {
  return useCallback(async () => {
    try {
      if (exportResults) {
        await exportResults('json');
      }
      
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: 'Session exported successfully',
        },
      });
    } catch (error) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: `Export failed: ${error.message}`,
        },
      });
    }
    
    setShowActionsMenu(false);
  }, [exportResults, dispatch, setShowActionsMenu]);
}

function useHandleDelete(session, dispatch, setShowDeleteConfirm) {
  return useCallback(() => {
    dispatch({
      type: ACTIONS.DELETE_SESSION,
      payload: session.id,
    });

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: 'Session deleted',
      },
    });

    setShowDeleteConfirm(false);
  }, [session.id, dispatch, setShowDeleteConfirm]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
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
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// ============================================================================
// SUB-COMPONENTS - CARD HEADER
// ============================================================================

const CardHeader = ({
  session,
  statusDisplay,
  viewModeDisplay,
  compact,
  showCheckbox,
  isSelected,
  showActionsMenu,
  onSelect,
  onToggleActionsMenu,
  onView,
  onExport,
  onDelete,
  onCloseMenu,
}) => (
  <div className={compact ? '' : 'px-4 py-3 border-b border-gray-200'}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {showCheckbox && (
          <SelectionCheckbox isSelected={isSelected} onSelect={onSelect} />
        )}
        
        <MainInfo
          session={session}
          statusDisplay={statusDisplay}
          viewModeDisplay={viewModeDisplay}
          compact={compact}
        />
      </div>

      <ActionsMenu
        isOpen={showActionsMenu}
        onToggle={onToggleActionsMenu}
        onView={onView}
        onExport={onExport}
        onDelete={onDelete}
        onClose={onCloseMenu}
      />
    </div>
  </div>
);

const SelectionCheckbox = ({ isSelected, onSelect }) => (
  <div className="flex-shrink-0 mt-1">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
  </div>
);

const MainInfo = ({ session, statusDisplay, viewModeDisplay, compact }) => (
  <div className="flex-1 min-w-0">
    <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
      {session.source_title || 'Untitled Analysis'}
    </h3>
    
    <BadgesRow
      statusDisplay={statusDisplay}
      viewModeDisplay={viewModeDisplay}
      session={session}
    />
  </div>
);

const BadgesRow = ({ statusDisplay, viewModeDisplay, session }) => {
  const StatusIcon = statusDisplay.icon;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${statusDisplay.border} ${statusDisplay.bg} ${statusDisplay.text}`}>
        <StatusIcon className={`w-4 h-4 ${statusDisplay.iconClass || ''}`} />
        <span className="font-medium">{statusDisplay.label}</span>
      </span>

      {session.view_mode && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
          <span>{viewModeDisplay.icon}</span>
          <span className="font-medium">{viewModeDisplay.label}</span>
        </span>
      )}

      <span className="text-gray-600">
        {formatDate(session.created_at)}
      </span>
    </div>
  );
};

const ActionsMenu = ({ isOpen, onToggle, onView, onExport, onDelete, onClose }) => (
  <div className="relative flex-shrink-0">
    <button
      onClick={onToggle}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <MoreVertical className="w-5 h-5" />
    </button>

    {isOpen && (
      <>
        <div className="fixed inset-0 z-10" onClick={onClose} />
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <MenuItem icon={Eye} label="View Results" onClick={onView} />
          <MenuItem icon={Download} label="Export Results" onClick={onExport} />
          <MenuItem icon={Trash2} label="Delete Session" onClick={onDelete} danger />
        </div>
      </>
    )}
  </div>
);

const MenuItem = ({ icon: Icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
      danger
        ? 'text-red-600 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// ============================================================================
// SUB-COMPONENTS - CARD CONTENT
// ============================================================================

const CardContent = ({ session, highConfidenceCount }) => (
  <div className="px-4 py-3">
    <Statistics
      patternsFound={session.patterns_found}
      highConfidenceCount={highConfidenceCount}
      segmentsProcessed={session.segments_processed}
      duration={session.duration}
    />

    {session.configuration && (
      <ConfigurationSummary config={session.configuration} />
    )}

    {session.status === 'failed' && session.error_message && (
      <ErrorMessage message={session.error_message} />
    )}
  </div>
);

const Statistics = ({ patternsFound, highConfidenceCount, segmentsProcessed, duration }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard value={patternsFound || 0} label="Patterns Found" />
    {highConfidenceCount > 0 && (
      <StatCard value={highConfidenceCount} label="High Confidence" highlight />
    )}
    <StatCard value={segmentsProcessed || 0} label="Segments" />
    {duration && (
      <StatCard value={formatDuration(duration)} label="Duration" />
    )}
  </div>
);

const StatCard = ({ value, label, highlight = false }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <div className="text-xs text-gray-600 mt-1">
      {label}
    </div>
  </div>
);

const ConfigurationSummary = ({ config }) => (
  <div className="mt-3 pt-3 border-t border-gray-200">
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-gray-600">Config:</span>
      
      {config.spoilage_max && (
        <ConfigBadge
          text={`Spoilage: ${Math.round(config.spoilage_max * 100)}%`}
          color="gray"
        />
      )}

      {config.entity_search?.length > 0 && (
        <ConfigBadge
          text={`${config.entity_search.length} entit${config.entity_search.length === 1 ? 'y' : 'ies'}`}
          color="blue"
        />
      )}

      {config.word_search?.length > 0 && (
        <ConfigBadge
          text={`${config.word_search.length} word${config.word_search.length === 1 ? '' : 's'}`}
          color="green"
        />
      )}

      {config.word_exclusions?.length > 0 && (
        <ConfigBadge
          text={`${config.word_exclusions.length} exclusion${config.word_exclusions.length === 1 ? '' : 's'}`}
          color="red"
        />
      )}
    </div>
  </div>
);

const ConfigBadge = ({ text, color }) => {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-0.5 rounded ${colorMap[color]}`}>
      {text}
    </span>
  );
};

const ErrorMessage = ({ message }) => (
  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex gap-2">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-red-900">Analysis Failed</p>
        <p className="text-xs text-red-700 mt-1">{message}</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// SUB-COMPONENTS - CARD FOOTER
// ============================================================================

const CardFooter = ({ session, compact, onView }) => (
  <div className={compact ? 'mt-3' : 'px-4 py-3 border-t border-gray-200 bg-gray-50'}>
    <div className="flex items-center justify-between">
      {!compact && <SourceInfo session={session} />}
      <ActionButton session={session} compact={compact} onView={onView} />
    </div>
  </div>
);

const SourceInfo = ({ session }) => (
  <div className="text-xs text-gray-500">
    {session.source_author && (
      <span>by {session.source_author}</span>
    )}
    {session.source_year && (
      <span className="ml-2">({session.source_year})</span>
    )}
  </div>
);

const ActionButton = ({ session, compact, onView }) => {
  if (session.status === 'completed') {
    return (
      <button
        onClick={onView}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors ${
          compact ? 'w-full justify-center' : ''
        }`}
      >
        View Results
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  if (session.status === 'failed') {
    return (
      <button
        onClick={onView}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors ${
          compact ? 'w-full justify-center' : ''
        }`}
      >
        <RotateCcw className="w-4 h-4" />
        Retry
      </button>
    );
  }

  return null;
};

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

const DeleteConfirmModal = ({ session, onConfirm, onCancel }) => (
  <>
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={onCancel}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader />
        <ModalContent session={session} />
        <ModalFooter onConfirm={onConfirm} onCancel={onCancel} />
      </div>
    </div>
  </>
);

const ModalHeader = () => (
  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
      <AlertCircle className="w-6 h-6 text-red-600" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Delete Session</h3>
      <p className="text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
    </div>
  </div>
);

const ModalContent = ({ session }) => (
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
);

const ModalFooter = ({ onConfirm, onCancel }) => (
  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
    <button
      onClick={onCancel}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
    >
      Cancel
    </button>
    <button
      onClick={onConfirm}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
    >
      Delete Session
    </button>
  </div>
);

// ============================================================================
// PROP TYPES
// ============================================================================

SessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
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
  showCheckbox: PropTypes.bool,
  compact: PropTypes.bool,
};

export default SessionCard;