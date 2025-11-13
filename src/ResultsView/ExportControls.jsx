// components/ExportControls.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAppState } from '../context/AppContext';

const ExportControls = ({
  selectedPatterns = [],
  allPatterns = [],
  onExport,
  isExporting = false,
}) => {
  const { state } = useAppState();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    format: state.settings.export.format || 'csv',
    includeTransformationLogs: state.settings.export.includeTransformationLogs || false,
    includeScoreBreakdown: state.settings.export.includeScoreBreakdown !== false,
    includeMetadata: true,
    scope: 'selected', // 'selected' | 'filtered' | 'all'
  });

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
      id: 'google-sheets',
      name: 'Google Sheets',
      icon: '📈',
      description: 'Open directly in Google Sheets',
      extension: null,
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
      description: `Export ${selectedPatterns.length} selected pattern${selectedPatterns.length !== 1 ? 's' : ''}`,
      count: selectedPatterns.length,
      disabled: selectedPatterns.length === 0,
    },
    {
      id: 'filtered',
      name: 'Current View',
      description: `Export all visible patterns`,
      count: allPatterns.length,
      disabled: allPatterns.length === 0,
    },
    {
      id: 'all',
      name: 'All Results',
      description: 'Export complete analysis results',
      count: state.results.patterns.length,
      disabled: state.results.patterns.length === 0,
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
        return selectedPatterns;
      case 'filtered':
        return allPatterns;
      case 'all':
        return state.results.patterns;
      default:
        return [];
    }
  };

  // Handle export
  const handleExport = async () => {
    const patternsToExport = getPatternsToExport();
    
    if (patternsToExport.length === 0) {
      return;
    }

    try {
      await onExport(patternsToExport, exportConfig);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Quick export (uses saved settings)
  const handleQuickExport = () => {
    if (selectedPatterns.length > 0) {
      onExport(selectedPatterns, {
        ...exportConfig,
        scope: 'selected',
      });
    } else if (allPatterns.length > 0) {
      onExport(allPatterns, {
        ...exportConfig,
        scope: 'filtered',
      });
    }
  };

  const patternsToExport = getPatternsToExport();
  const estimatedFileSize = Math.ceil(patternsToExport.length * 0.5); // ~0.5KB per pattern

  return (
    <>
      {/* Export Button */}
      <div className="flex items-center gap-2">
        {selectedPatterns.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedPatterns.length} selected
          </span>
        )}
        
        <button
          onClick={handleQuickExport}
          disabled={isExporting || (selectedPatterns.length === 0 && allPatterns.length === 0)}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${isExporting || (selectedPatterns.length === 0 && allPatterns.length === 0)
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
          disabled={isExporting || state.results.patterns.length === 0}
          className={`
            p-2 rounded-lg transition-colors
            ${isExporting || state.results.patterns.length === 0
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

ExportControls.propTypes = {
  selectedPatterns: PropTypes.array,
  allPatterns: PropTypes.array,
  onExport: PropTypes.func.isRequired,
  isExporting: PropTypes.bool,
};

export default ExportControls;