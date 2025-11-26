// ResultsView/ExportControls.jsx

import React, { useState, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';

const ExportControls = () => {
  const { state, dispatch, exportResults } = useAppState();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    format: state.settings?.export?.format || 'json',
    includeTransformationLogs: state.settings?.export?.includeTransformationLogs || false,
    includeScoreBreakdown: state.settings?.export?.includeScoreBreakdown !== false,
    includeMetadata: true,
    scope: 'selected', // 'selected' | 'filtered' | 'all'
  });

  // Get data from state
  const selectedPatterns = state.results.selectedPatterns || [];
  const allPatterns = state.results.patterns || [];
  const isExporting = state.results.isExporting || false;

  // Filter patterns based on active filters
  const filteredPatterns = useMemo(() => {
    const filters = state.results.activeFilters || {};
    let filtered = [...allPatterns];

    // Apply score range filter
    if (filters.minScore > 0) {
      filtered = filtered.filter(p => (p.scores?.composite || p.composite_score || 0) >= filters.minScore);
    }
    if (filters.maxScore < 100) {
      filtered = filtered.filter(p => (p.scores?.composite || p.composite_score || 0) <= filters.maxScore);
    }

    // Apply methods filter
    if (filters.methods?.length > 0) {
      filtered = filtered.filter(p => {
        const method = p.decoding_method || p.best_candidate?.method || p.method;
        return method && filters.methods.includes(method);
      });
    }

    // Apply entities filter
    if (filters.entities?.length > 0) {
      filtered = filtered.filter(p => {
        const entities = p.entity_matches || p.entities_detected || [];
        return entities.some(e => filters.entities.includes(e.name || e));
      });
    }

    // Apply high confidence filter
    if (filters.highConfidenceOnly) {
      filtered = filtered.filter(p => (p.scores?.composite || p.composite_score || 0) >= 70);
    }

    return filtered;
  }, [allPatterns, state.results.activeFilters]);

  // Get selected pattern objects
  const selectedPatternObjects = useMemo(() => {
    return allPatterns.filter(p => selectedPatterns.includes(p.id));
  }, [allPatterns, selectedPatterns]);

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV',
      icon: '📊',
      description: 'Comma-separated values (Excel, Google Sheets)',
      extension: '.csv',
    },
    {
      id: 'json',
      name: 'JSON',
      icon: '📋',
      description: 'Structured data format (developers)',
      extension: '.json',
    },
    {
      id: 'xlsx',
      name: 'Excel',
      icon: '📈',
      description: 'Microsoft Excel workbook',
      extension: '.xlsx',
    },
    {
      id: 'txt',
      name: 'Plain Text',
      icon: '📄',
      description: 'Simple text report',
      extension: '.txt',
    },
  ];

  const exportScopes = [
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
  ];

  // Handle export configuration change
  const handleConfigChange = (key, value) => {
    setExportConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Get patterns to export based on scope
  const getPatternsToExport = () => {
    switch (exportConfig.scope) {
      case 'selected':
        return selectedPatternObjects;
      case 'filtered':
        return filteredPatterns;
      case 'all':
        return allPatterns;
      default:
        return [];
    }
  };

  // Handle export
  const handleExport = async () => {
    const patternsToExport = getPatternsToExport();
    
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
      // Set exporting state
      dispatch({ type: ACTIONS.EXPORT_RESULTS });

      // Call the export function from context
      // The exportResults function should handle the actual export logic
      if (exportResults) {
        await exportResults(exportConfig.format);
      } else {
        // Fallback: create export data manually
        await createExportFile(patternsToExport, exportConfig);
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
      // Reset exporting state
      dispatch({ type: ACTIONS.SET_RESULTS, payload: state.results.patterns });
    }
  };

  // Create export file (fallback implementation)
  const createExportFile = async (patterns, config) => {
    const currentJob = state.analyze.currentJob;
    const sourceInfo = state.workspace.currentSource;

    let content;
    let filename;
    let mimeType;

    const exportData = {
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

    switch (config.format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `cipher-analysis-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        const headers = [
          'ID',
          'Segment',
          'Decoded Text',
          'Method',
          'Composite Score',
          ...(config.includeScoreBreakdown ? ['Entity Score', 'Linguistic Score', 'Statistical Score', 'Spoilage Ratio'] : []),
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

        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename = `cipher-analysis-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'txt':
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
        
        content = lines.join('\n');
        filename = `cipher-analysis-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick export (uses saved settings)
  const handleQuickExport = () => {
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
  };

  const patternsToExport = getPatternsToExport();
  const estimatedFileSize = Math.ceil(patternsToExport.length * 0.5); // ~0.5KB per pattern

  return (
    <>
      {/* Export Button */}
      <div className="flex items-center gap-2">
        {selectedPatternObjects.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedPatternObjects.length} selected
          </span>
        )}
        
        <button
          onClick={handleQuickExport}
          disabled={isExporting || (selectedPatternObjects.length === 0 && filteredPatterns.length === 0)}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${isExporting || (selectedPatternObjects.length === 0 && filteredPatterns.length === 0)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
          title="Quick export with saved settings"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          disabled={isExporting || allPatterns.length === 0}
          className={`
            p-2 rounded-lg transition-colors
            ${isExporting || allPatterns.length === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
          title="Export options"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowExportModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-900">Export Results</h2>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-6">
                  {/* Export Scope */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">What to Export</h3>
                    <div className="space-y-2">
                      {exportScopes.map((scope) => (
                        <label
                          key={scope.id}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${scope.disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : exportConfig.scope === scope.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="scope"
                            value={scope.id}
                            checked={exportConfig.scope === scope.id}
                            onChange={(e) => handleConfigChange('scope', e.target.value)}
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
                      ))}
                    </div>
                  </div>

                  {/* Export Format */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Export Format</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {exportFormats.map((format) => (
                        <label
                          key={format.id}
                          className={`
                            flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${exportConfig.format === format.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={format.id}
                            checked={exportConfig.format === format.id}
                            onChange={(e) => handleConfigChange('format', e.target.value)}
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
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Include in Export</h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeScoreBreakdown}
                          onChange={(e) => handleConfigChange('includeScoreBreakdown', e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm text-gray-900">Score breakdown</span>
                          <p className="text-xs text-gray-600">
                            Entity, linguistic, statistical, and spoilage scores
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeTransformationLogs}
                          onChange={(e) => handleConfigChange('includeTransformationLogs', e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm text-gray-900">Transformation logs</span>
                          <p className="text-xs text-gray-600">
                            Step-by-step decoding process (increases file size)
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeMetadata}
                          onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm text-gray-900">Analysis metadata</span>
                          <p className="text-xs text-gray-600">
                            Source text, configuration, timestamp
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* File Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Export Preview</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Patterns:</span>
                        <span className="font-medium text-gray-900">
                          {patternsToExport.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span className="font-medium text-gray-900">
                          {exportFormats.find(f => f.id === exportConfig.format)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated size:</span>
                        <span className="font-medium text-gray-900">
                          ~{estimatedFileSize} KB
                        </span>
                      </div>
                      {exportConfig.includeTransformationLogs && (
                        <div className="text-xs text-amber-600 mt-2">
                          ⚠️ Including transformation logs will increase file size significantly
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={patternsToExport.length === 0 || isExporting}
                  className={`
                    flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors
                    ${patternsToExport.length === 0 || isExporting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export {patternsToExport.length} Pattern{patternsToExport.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ExportControls;