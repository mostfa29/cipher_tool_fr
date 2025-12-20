// src/LibraryView/SourceCard.jsx
// Source card displaying literary work details with actions and preview

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Edit2, Trash2, Eye, Loader, MessageSquare, FileText, List, AlertTriangle } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const SOURCE_TYPES = {
  play: {
    icon: '🎭',
    label: 'Play',
    color: 'purple',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  poem: {
    icon: '📜',
    label: 'Poem',
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  sonnet: {
    icon: '💝',
    label: 'Sonnet',
    color: 'pink',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  letter: {
    icon: '✉️',
    label: 'Letter',
    color: 'green',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  document: {
    icon: '📄',
    label: 'Document',
    color: 'gray',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  other: {
    icon: '📝',
    label: 'Other',
    color: 'gray',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
};

const ERA_DISPLAY = {
  pre_1593: { label: 'Pre-1593 (Juvenilia)', color: 'text-green-600' },
  post_1593: { label: 'Post-1593 (Mature)', color: 'text-blue-600' },
  unknown: { label: 'Unknown Era', color: 'text-gray-600' },
};

const MAX_PREVIEW_LENGTH = 200;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SourceCard = ({
  source,
  showActions = true,
  compact = false,
}) => {
  const { state, dispatch, loadWork } = useAppState();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isAnalyzing = useMemo(
    () => state.ui.isLoading?.work === source.id,
    [state.ui.isLoading, source.id]
  );

  // Extract source data
  const sourceData = useSourceData(source);
  const typeDisplay = useSourceTypeDisplay(source.type);
  const eraDisplay = useEraDisplay(source.era);
  const stats = useTextStats(source);

  // Event handlers
  const handleEdit = useCallback(() => {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: 'Edit functionality coming soon',
      },
    });
  }, [dispatch]);

  const handleDelete = useHandleDelete(source, dispatch, setShowDeleteConfirm);
  const handleAnalyze = useHandleAnalyze(source, loadWork, dispatch);
  const handleToggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

  return (
    <>
      <div className={`border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all ${compact ? 'p-3' : ''}`}>
        <CardHeader
          source={source}
          typeDisplay={typeDisplay}
          eraDisplay={eraDisplay}
          compact={compact}
          showActions={showActions}
          onEdit={handleEdit}
          onDelete={() => setShowDeleteConfirm(true)}
        />

        {!compact && (
          <CardContent
            source={source}
            sourceData={sourceData}
            stats={stats}
            isExpanded={isExpanded}
            onToggleExpanded={handleToggleExpanded}
          />
        )}

        <CardFooter
          source={source}
          compact={compact}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
        />
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          source={source}
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

function useSourceData(source) {
  return useMemo(() => {
    const content = source.content || source.text || '';
    return {
      content,
      hasContent: Boolean(content),
      hasDescription: Boolean(source.description),
    };
  }, [source.content, source.text, source.description]);
}

function useSourceTypeDisplay(type) {
  return useMemo(
    () => SOURCE_TYPES[type] || SOURCE_TYPES.other,
    [type]
  );
}

function useEraDisplay(era) {
  return useMemo(
    () => ERA_DISPLAY[era] || ERA_DISPLAY.unknown,
    [era]
  );
}

function useTextStats(source) {
  return useMemo(() => {
    const text = source.content || source.text || '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    const lineCount = source.line_count || text.split('\n').filter(Boolean).length;
    
    return { wordCount, charCount, lineCount };
  }, [source.content, source.text, source.line_count]);
}

function useHandleDelete(source, dispatch, setShowDeleteConfirm) {
  return useCallback(async () => {
    try {
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
  }, [source.id, source.title, dispatch, setShowDeleteConfirm]);
}

function useHandleAnalyze(source, loadWork, dispatch) {
  return useCallback(async () => {
    try {
      await loadWork(source.author_folder || source.author, source.id);
      dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
    } catch (error) {
      console.error('Failed to load work:', error);
    }
  }, [source.author_folder, source.author, source.id, loadWork, dispatch]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateText(text, maxLength = MAX_PREVIEW_LENGTH) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const CardHeader = ({
  source,
  typeDisplay,
  eraDisplay,
  compact,
  showActions,
  onEdit,
  onDelete,
}) => (
  <div className={compact ? '' : 'px-4 py-3 border-b border-gray-200'}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`}>
          {source.title || 'Untitled Source'}
        </h3>
        
        <MetadataRow
          typeDisplay={typeDisplay}
          source={source}
          eraDisplay={eraDisplay}
        />
      </div>

      {showActions && (
        <ActionButtons onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  </div>
);

const MetadataRow = ({ typeDisplay, source, eraDisplay }) => (
  <div className="flex flex-wrap items-center gap-2 mt-2">
    <TypeBadge typeDisplay={typeDisplay} />
    
    {source.era && (
      <span className={`text-xs font-medium ${eraDisplay.color}`}>
        {eraDisplay.label}
      </span>
    )}
    
    {source.author && (
      <span className="text-xs text-gray-600">
        by <span className="font-medium text-gray-900">{source.author}</span>
      </span>
    )}
    
    {(source.year || source.date) && (
      <span className="text-xs text-gray-600">
        ({source.year || source.date})
      </span>
    )}
  </div>
);

const TypeBadge = ({ typeDisplay }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${typeDisplay.border} ${typeDisplay.bg} ${typeDisplay.text}`}>
    <span>{typeDisplay.icon}</span>
    <span className="font-medium">{typeDisplay.label}</span>
  </span>
);

const ActionButtons = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onEdit}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title="Edit source"
    >
      <Edit2 className="w-4 h-4" />
    </button>
    
    <button
      onClick={onDelete}
      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Delete source"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const CardContent = ({
  source,
  sourceData,
  stats,
  isExpanded,
  onToggleExpanded,
}) => (
  <div className="px-4 py-3">
    {sourceData.hasDescription && (
      <p className="text-sm text-gray-600 mb-3">
        {source.description}
      </p>
    )}

    {sourceData.hasContent && (
      <TextPreview
        content={sourceData.content}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
      />
    )}

    <Statistics stats={stats} />
  </div>
);

const TextPreview = ({ content, isExpanded, onToggleExpanded }) => {
  const shouldShowToggle = content.length > MAX_PREVIEW_LENGTH;
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Text Preview</span>
        {shouldShowToggle && (
          <button
            onClick={onToggleExpanded}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-words">
        {isExpanded ? content : truncateText(content)}
      </p>
    </div>
  );
};

const Statistics = ({ stats }) => (
  <div className="flex items-center gap-4 text-xs text-gray-600">
    <StatItem icon={MessageSquare} value={stats.wordCount} label="words" />
    <StatItem icon={FileText} value={stats.charCount} label="chars" />
    <StatItem icon={List} value={stats.lineCount} label="lines" />
  </div>
);

const StatItem = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-1">
    <Icon className="w-4 h-4" />
    <span>{value.toLocaleString()} {label}</span>
  </div>
);

const CardFooter = ({ source, compact, isAnalyzing, onAnalyze }) => (
  <div className={compact ? 'mt-3' : 'px-4 py-3 border-t border-gray-200 bg-gray-50'}>
    <div className="flex items-center justify-between">
      {!compact && <FooterDates source={source} />}
      <AnalyzeButton
        compact={compact}
        isAnalyzing={isAnalyzing}
        onAnalyze={onAnalyze}
      />
    </div>
  </div>
);

const FooterDates = ({ source }) => (
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
);

const AnalyzeButton = ({ compact, isAnalyzing, onAnalyze }) => (
  <button
    onClick={onAnalyze}
    disabled={isAnalyzing}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      compact ? 'w-full justify-center' : ''
    } ${
      isAnalyzing
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-blue-600 text-white hover:bg-blue-700'
    }`}
  >
    {isAnalyzing ? (
      <>
        <Loader className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </>
    ) : (
      <>
        <Eye className="w-4 h-4" />
        <span>{compact ? 'Open' : 'Open in Workspace'}</span>
      </>
    )}
  </button>
);

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

const DeleteConfirmModal = ({ source, onConfirm, onCancel }) => (
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
        <ModalContent source={source} />
        <ModalFooter onConfirm={onConfirm} onCancel={onCancel} />
      </div>
    </div>
  </>
);

const ModalHeader = () => (
  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
      <AlertTriangle className="w-6 h-6 text-red-600" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Delete Source</h3>
      <p className="text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
    </div>
  </div>
);

const ModalContent = ({ source }) => (
  <div className="px-6 py-4">
    <p className="text-sm text-gray-700">
      Are you sure you want to delete{' '}
      <span className="font-semibold">"{source.title || 'Untitled Source'}"</span>?
    </p>
    <p className="text-sm text-gray-600 mt-2">
      This will permanently remove the source and all associated analysis results.
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
      Delete Source
    </button>
  </div>
);

// ============================================================================
// PROP TYPES
// ============================================================================

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