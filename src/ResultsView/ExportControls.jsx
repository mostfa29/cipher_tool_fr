// src/ResultsView/ExportControls.jsx
// Export controls for cipher analysis results with multiple formats and scopes

import React, { useState, useMemo, useCallback } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Download, MoreVertical, X, Loader } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPORT_FORMATS = [
  {
    id: 'csv',
    name: 'CSV',
    icon: '📊',
    description: 'Comma-separated values (Excel, Google Sheets)',
    extension: '.csv',
    mimeType: 'text/csv',
  },
  {
    id: 'json',
    name: 'JSON',
    icon: '📋',
    description: 'Structured data format (developers)',
    extension: '.json',
    mimeType: 'application/json',
  },
  {
    id: 'xlsx',
    name: 'Excel',
    icon: '📈',
    description: 'Microsoft Excel workbook',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    icon: '📄',
    description: 'Simple text report',
    extension: '.txt',
    mimeType: 'text/plain',
  },
];

const HIGH_CONFIDENCE_THRESHOLD = 70;
const ESTIMATED_SIZE_PER_PATTERN = 0.5; // KB

const DEFAULT_EXPORT_CONFIG = {
  format: 'json',
  includeTransformationLogs: false,
  includeScoreBreakdown: true,
  includeMetadata: true,
  scope: 'selected',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExportControls = () => {
  const { state, dispatch, exportResults } = useAppState();
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    ...DEFAULT_EXPORT_CONFIG,
    format: state.settings?.export?.format || 'json',
    includeTransformationLogs: state.settings?.export?.includeTransformationLogs || false,
  });

  // Extract state data
  const selectedPatterns = state.results.selectedPatterns || [];
  const allPatterns = state.results.patterns || [];
  const isExporting = state.results.isExporting || false;

  // Computed values
  const filteredPatterns = useFilteredPatterns(allPatterns, state.results.activeFilters);
  const selectedPatternObjects = useSelectedPatternObjects(allPatterns, selectedPatterns);
  const exportScopes = useExportScopes(selectedPatternObjects, filteredPatterns, allPatterns);
  const patternsToExport = usePatternsToExport(
    exportConfig.scope,
    selectedPatternObjects,
    filteredPatterns,
    allPatterns
  );

  // Event handlers
  const handleConfigChange = useCallback((key, value) => {
    setExportConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useHandleExport(
    patternsToExport,
    exportConfig,
    state,
    dispatch,
    exportResults,
    setShowExportModal
  );

  const handleQuickExport = useHandleQuickExport(
    selectedPatternObjects,
    filteredPatterns,
    exportConfig,
    setExportConfig,
    handleExport,
    dispatch
  );

  const estimatedFileSize = Math.ceil(patternsToExport.length * ESTIMATED_SIZE_PER_PATTERN);

  return (
    <>
      <ExportButtons
        selectedCount={selectedPatternObjects.length}
        isExporting={isExporting}
        hasPatterns={selectedPatternObjects.length > 0 || filteredPatterns.length > 0}
        allPatternsCount={allPatterns.length}
        onQuickExport={handleQuickExport}
        onShowModal={() => setShowExportModal(true)}
      />

      {showExportModal && (
        <ExportModal
          exportConfig={exportConfig}
          exportScopes={exportScopes}
          patternsToExport={patternsToExport}
          estimatedFileSize={estimatedFileSize}
          isExporting={isExporting}
          onConfigChange={handleConfigChange}
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useFilteredPatterns(allPatterns, activeFilters) {
  return useMemo(() => {
    const filters = activeFilters || {};
    let filtered = [...allPatterns];

    if (filters.minScore > 0) {
      filtered = filtered.filter(p => 
        (p.scores?.composite || p.composite_score || 0) >= filters.minScore
      );
    }

    if (filters.maxScore < 100) {
      filtered = filtered.filter(p => 
        (p.scores?.composite || p.composite_score || 0) <= filters.maxScore
      );
    }

    if (filters.methods?.length > 0) {
      filtered = filtered.filter(p => {
        const method = p.decoding_method || p.best_candidate?.method || p.method;
        return method && filters.methods.includes(method);
      });
    }

    if (filters.entities?.length > 0) {
      filtered = filtered.filter(p => {
        const entities = p.entity_matches || p.entities_detected || [];
        return entities.some(e => filters.entities.includes(e.name || e));
      });
    }

    if (filters.highConfidenceOnly) {
      filtered = filtered.filter(p => 
        (p.scores?.composite || p.composite_score || 0) >= HIGH_CONFIDENCE_THRESHOLD
      );
    }

    return filtered;
  }, [allPatterns, activeFilters]);
}

function useSelectedPatternObjects(allPatterns, selectedPatterns) {
  return useMemo(() => {
    return allPatterns.filter(p => selectedPatterns.includes(p.id));
  }, [allPatterns, selectedPatterns]);
}

function useExportScopes(selectedPatternObjects, filteredPatterns, allPatterns) {
  return useMemo(() => [
    {
      id: 'selected',
      name: 'Selected Results',
      description: `Export ${selectedPatternObjects.length} selected pattern${selectedPatternObjects.length !== 1 ? 's' : ''}`,
      count: selectedPatternObjects.length,
      disabled: selectedPatternObjects.length === 0,
    },
    {
      id: 'filtered',
      name: 'Current View',
      description: 'Export all visible patterns',
      count: filteredPatterns.length,
      disabled: filteredPatterns.length === 0,
    },
    {
      id: 'all',
      name: 'All Results',
      description: 'Export complete analysis results',
      count: allPatterns.length,
      disabled: allPatterns.length === 0,
    },
  ], [selectedPatternObjects.length, filteredPatterns.length, allPatterns.length]);
}

function usePatternsToExport(scope, selectedPatternObjects, filteredPatterns, allPatterns) {
  return useMemo(() => {
    switch (scope) {
      case 'selected': return selectedPatternObjects;
      case 'filtered': return filteredPatterns;
      case 'all': return allPatterns;
      default: return [];
    }
  }, [scope, selectedPatternObjects, filteredPatterns, allPatterns]);
}

function useHandleExport(patternsToExport, exportConfig, state, dispatch, exportResults, setShowExportModal) {
  return useCallback(async () => {
    if (patternsToExport.length === 0) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'warning',
          message: 'No patterns to export',
        },
      });
      return;
    }

    try {
      dispatch({ type: ACTIONS.EXPORT_RESULTS });

      if (exportResults) {
        await exportResults(exportConfig.format);
      } else {
        await createExportFile(patternsToExport, exportConfig, state);
      }

      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'success',
          message: `Exported ${patternsToExport.length} pattern${patternsToExport.length !== 1 ? 's' : ''} as ${exportConfig.format.toUpperCase()}`,
        },
      });

      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: `Export failed: ${error.message}`,
        },
      });
    } finally {
      dispatch({ type: ACTIONS.SET_RESULTS, payload: state.results.patterns });
    }
  }, [patternsToExport, exportConfig, state, dispatch, exportResults, setShowExportModal]);
}

function useHandleQuickExport(selectedPatternObjects, filteredPatterns, exportConfig, setExportConfig, handleExport, dispatch) {
  return useCallback(() => {
    const config = { ...exportConfig };
    
    if (selectedPatternObjects.length > 0) {
      config.scope = 'selected';
    } else if (filteredPatterns.length > 0) {
      config.scope = 'filtered';
    } else {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'warning',
          message: 'No patterns to export',
        },
      });
      return;
    }

    setExportConfig(config);
    handleExport();
  }, [selectedPatternObjects.length, filteredPatterns.length, exportConfig, setExportConfig, handleExport, dispatch]);
}

// ============================================================================
// EXPORT FILE CREATION
// ============================================================================

async function createExportFile(patterns, config, state) {
  const currentJob = state.analyze.currentJob;
  const sourceInfo = state.workspace.currentSource;

  const exportData = buildExportData(patterns, config, currentJob, sourceInfo);
  const { content, filename, mimeType } = formatExportContent(exportData, config);

  downloadFile(content, filename, mimeType);
}

function buildExportData(patterns, config, currentJob, sourceInfo) {
  return {
    metadata: config.includeMetadata ? {
      exportDate: new Date().toISOString(),
      source: sourceInfo?.title || 'Unknown',
      author: sourceInfo?.author || 'Unknown',
      analysisDate: currentJob?.startTime ? new Date(currentJob.startTime).toISOString() : null,
      totalPatterns: patterns.length,
    } : undefined,
    patterns: patterns.map(p => ({
      id: p.id,
      segment: p.section_name || p.segment_id,
      isEncoded: p.is_encoded,
      decodedText: p.decoded_pattern || p.best_candidate?.decoded_text,
      method: p.decoding_method || p.best_candidate?.method,
      compositeScore: p.scores?.composite || p.composite_score,
      ...(config.includeScoreBreakdown ? {
        entityScore: p.scores?.entity_score,
        linguisticScore: p.scores?.linguistic_score,
        statisticalScore: p.scores?.statistical_score,
        spoilageRatio: p.spoilage_ratio,
      } : {}),
      entities: p.entity_matches || p.entities_detected || [],
      isCredible: p.best_candidate?.is_credible || false,
      ...(config.includeTransformationLogs ? {
        transformationLog: p.transformation_log || [],
      } : {}),
    })),
  };
}

function formatExportContent(exportData, config) {
  const timestamp = Date.now();
  
  switch (config.format) {
    case 'json':
      return {
        content: JSON.stringify(exportData, null, 2),
        filename: `cipher-analysis-${timestamp}.json`,
        mimeType: 'application/json',
      };
    
    case 'csv':
      return formatAsCSV(exportData, config, timestamp);
    
    case 'txt':
      return formatAsText(exportData, config, timestamp);
    
    default:
      throw new Error(`Unsupported format: ${config.format}`);
  }
}

function formatAsCSV(exportData, config, timestamp) {
  const headers = [
    'ID',
    'Segment',
    'Decoded Text',
    'Method',
    'Composite Score',
    ...(config.includeScoreBreakdown ? [
      'Entity Score',
      'Linguistic Score',
      'Statistical Score',
      'Spoilage Ratio'
    ] : []),
    'Is Encoded',
    'Is Credible',
    'Entities',
  ];
  
  const rows = exportData.patterns.map(p => [
    p.id,
    p.segment,
    `"${(p.decodedText || '').replace(/"/g, '""')}"`,
    p.method,
    p.compositeScore || 0,
    ...(config.includeScoreBreakdown ? [
      p.entityScore || 0,
      p.linguisticScore || 0,
      p.statisticalScore || 0,
      p.spoilageRatio || 0,
    ] : []),
    p.isEncoded ? 'Yes' : 'No',
    p.isCredible ? 'Yes' : 'No',
    `"${(p.entities || []).map(e => e.name || e).join(', ')}"`,
  ]);

  return {
    content: [headers.join(','), ...rows.map(r => r.join(','))].join('\n'),
    filename: `cipher-analysis-${timestamp}.csv`,
    mimeType: 'text/csv',
  };
}

function formatAsText(exportData, config, timestamp) {
  const lines = [
    config.includeMetadata ? `Cipher Analysis Export\n${'='.repeat(50)}\n` : '',
    config.includeMetadata ? `Source: ${exportData.metadata.source}` : '',
    config.includeMetadata ? `Author: ${exportData.metadata.author}` : '',
    config.includeMetadata ? `Export Date: ${new Date(exportData.metadata.exportDate).toLocaleString()}` : '',
    config.includeMetadata ? `Total Patterns: ${exportData.metadata.totalPatterns}\n` : '',
    '',
    ...exportData.patterns.map((p, i) => [
      `\nPattern ${i + 1}`,
      '-'.repeat(50),
      `Segment: ${p.segment}`,
      `Method: ${p.method}`,
      `Score: ${p.compositeScore || 0}`,
      `Is Encoded: ${p.isEncoded ? 'Yes' : 'No'}`,
      `Is Credible: ${p.isCredible ? 'Yes' : 'No'}`,
      `\nDecoded Text:\n${p.decodedText || 'N/A'}`,
      p.entities.length > 0 ? `\nEntities: ${p.entities.map(e => e.name || e).join(', ')}` : '',
    ].join('\n')),
  ];
  
  return {
    content: lines.join('\n'),
    filename: `cipher-analysis-${timestamp}.txt`,
    mimeType: 'text/plain',
  };
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ExportButtons = ({
  selectedCount,
  isExporting,
  hasPatterns,
  allPatternsCount,
  onQuickExport,
  onShowModal,
}) => (
  <div className="flex items-center gap-2">
    {selectedCount > 0 && (
      <span className="text-sm text-gray-600">
        {selectedCount} selected
      </span>
    )}
    
    <button
      onClick={onQuickExport}
      disabled={isExporting || !hasPatterns}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isExporting || !hasPatterns
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      title="Quick export with saved settings"
    >
      {isExporting ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export</span>
        </>
      )}
    </button>

    <button
      onClick={onShowModal}
      disabled={isExporting || allPatternsCount === 0}
      className={`p-2 rounded-lg transition-colors ${
        isExporting || allPatternsCount === 0
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      title="Export options"
    >
      <MoreVertical className="w-5 h-5" />
    </button>
  </div>
);

const ExportModal = ({
  exportConfig,
  exportScopes,
  patternsToExport,
  estimatedFileSize,
  isExporting,
  onConfigChange,
  onExport,
  onClose,
}) => (
  <>
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={onClose}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader onClose={onClose} />
        <ModalContent
          exportConfig={exportConfig}
          exportScopes={exportScopes}
          patternsToExport={patternsToExport}
          estimatedFileSize={estimatedFileSize}
          onConfigChange={onConfigChange}
        />
        <ModalFooter
          patternsToExport={patternsToExport}
          isExporting={isExporting}
          onExport={onExport}
          onClose={onClose}
        />
      </div>
    </div>
  </>
);

const ModalHeader = ({ onClose }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
    <div className="flex items-center gap-3">
      <Download className="w-6 h-6 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-900">Export Results</h2>
    </div>
    <button
      onClick={onClose}
      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

const ModalContent = ({
  exportConfig,
  exportScopes,
  patternsToExport,
  estimatedFileSize,
  onConfigChange,
}) => (
  <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
    <div className="space-y-6">
      <ScopeSection
        exportScopes={exportScopes}
        selectedScope={exportConfig.scope}
        onScopeChange={(scope) => onConfigChange('scope', scope)}
      />
      
      <FormatSection
        selectedFormat={exportConfig.format}
        onFormatChange={(format) => onConfigChange('format', format)}
      />
      
      <OptionsSection
        exportConfig={exportConfig}
        onConfigChange={onConfigChange}
      />
      
      <PreviewSection
        patternsCount={patternsToExport.length}
        format={exportConfig.format}
        estimatedFileSize={estimatedFileSize}
        includeTransformationLogs={exportConfig.includeTransformationLogs}
      />
    </div>
  </div>
);

const ScopeSection = ({ exportScopes, selectedScope, onScopeChange }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">What to Export</h3>
    <div className="space-y-2">
      {exportScopes.map((scope) => (
        <ScopeOption
          key={scope.id}
          scope={scope}
          isSelected={selectedScope === scope.id}
          onSelect={() => onScopeChange(scope.id)}
        />
      ))}
    </div>
  </div>
);

const ScopeOption = ({ scope, isSelected, onSelect }) => (
  <label
    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
      scope.disabled
        ? 'opacity-50 cursor-not-allowed'
        : isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <input
      type="radio"
      name="scope"
      value={scope.id}
      checked={isSelected}
      onChange={onSelect}
      disabled={scope.disabled}
      className="mt-1 w-4 h-4 text-blue-600 border-gray-300"
    />
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {scope.name}
        </span>
        <span className="text-sm text-gray-600">
          {scope.count} pattern{scope.count !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-0.5">
        {scope.description}
      </p>
    </div>
  </label>
);

const FormatSection = ({ selectedFormat, onFormatChange }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">Export Format</h3>
    <div className="grid grid-cols-2 gap-3">
      {EXPORT_FORMATS.map((format) => (
        <FormatOption
          key={format.id}
          format={format}
          isSelected={selectedFormat === format.id}
          onSelect={() => onFormatChange(format.id)}
        />
      ))}
    </div>
  </div>
);

const FormatOption = ({ format, isSelected, onSelect }) => (
  <label
    className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isSelected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <input
      type="radio"
      name="format"
      value={format.id}
      checked={isSelected}
      onChange={onSelect}
      className="sr-only"
    />
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xl">{format.icon}</span>
      <span className="text-sm font-medium text-gray-900">
        {format.name}
      </span>
    </div>
    <p className="text-xs text-gray-600">
      {format.description}
    </p>
  </label>
);

const OptionsSection = ({ exportConfig, onConfigChange }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">Include in Export</h3>
    <div className="space-y-3">
      <CheckboxOption
        label="Score breakdown"
        description="Entity, linguistic, statistical, and spoilage scores"
        checked={exportConfig.includeScoreBreakdown}
        onChange={(checked) => onConfigChange('includeScoreBreakdown', checked)}
      />
      <CheckboxOption
        label="Transformation logs"
        description="Step-by-step decoding process (increases file size)"
        checked={exportConfig.includeTransformationLogs}
        onChange={(checked) => onConfigChange('includeTransformationLogs', checked)}
      />
      <CheckboxOption
        label="Analysis metadata"
        description="Source text, configuration, timestamp"
        checked={exportConfig.includeMetadata}
        onChange={(checked) => onConfigChange('includeMetadata', checked)}
      />
    </div>
  </div>
);

const CheckboxOption = ({ label, description, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded"
    />
    <div>
      <span className="text-sm text-gray-900">{label}</span>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  </label>
);

const PreviewSection = ({
  patternsCount,
  format,
  estimatedFileSize,
  includeTransformationLogs,
}) => {
  const formatName = EXPORT_FORMATS.find(f => f.id === format)?.name;
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Export Preview</h4>
      <div className="space-y-1 text-sm text-gray-600">
        <PreviewRow label="Patterns" value={patternsCount} />
        <PreviewRow label="Format" value={formatName} />
        <PreviewRow label="Estimated size" value={`~${estimatedFileSize} KB`} />
        {includeTransformationLogs && (
          <div className="text-xs text-amber-600 mt-2">
            ⚠️ Including transformation logs will increase file size significantly
          </div>
        )}
      </div>
    </div>
  );
};

const PreviewRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span>{label}:</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const ModalFooter = ({ patternsToExport, isExporting, onExport, onClose }) => (
  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
    >
      Cancel
    </button>
    <button
      onClick={onExport}
      disabled={patternsToExport.length === 0 || isExporting}
      className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
        patternsToExport.length === 0 || isExporting
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isExporting ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export {patternsToExport.length} Pattern{patternsToExport.length !== 1 ? 's' : ''}</span>
        </>
      )}
    </button>
  </div>
);

export default ExportControls;