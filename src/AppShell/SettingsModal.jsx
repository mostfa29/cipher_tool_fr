// components/SettingsModal.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useAppState();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(state.settings);
      setHasChanges(false);
    }
  }, [isOpen, state.settings]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleChange = (section, key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    dispatch({
      type: ACTIONS.UPDATE_SETTINGS,
      payload: localSettings,
    });
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      'This will reset all settings to defaults. Are you sure?'
    );
    if (!confirmReset) return;

    const defaultSettings = {
      theme: 'light',
      defaults: {
        spoilageTolerance: 0.15,
        viewMode: 'standard',
        resultsPerSegment: 100,
      },
      export: {
        format: 'csv',
        includeTransformationLogs: false,
        includeScoreBreakdown: true,
      },
      enableExperimentalFeatures: false,
      debugMode: false,
    };

    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 id="settings-title" className="text-xl font-semibold text-gray-900">
                Settings
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* General Settings */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General</h3>
                <div className="space-y-4">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <div className="flex gap-3">
                      {['light', 'dark', 'auto'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => handleChange('', 'theme', theme)}
                          className={`
                            flex-1 px-4 py-2 rounded-lg border-2 transition-all
                            ${
                              localSettings.theme === theme
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {theme === 'light' && '☀️'}
                            {theme === 'dark' && '🌙'}
                            {theme === 'auto' && '🔄'}
                            <span className="capitalize">{theme}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Default Analysis Settings */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Default Analysis Settings
                </h3>
                <div className="space-y-4">
                  {/* Spoilage Tolerance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Spoilage Tolerance: {Math.round(localSettings.defaults.spoilageTolerance * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(localSettings.defaults.spoilageTolerance * 100)}
                      onChange={(e) =>
                        handleChange('defaults', 'spoilageTolerance', parseInt(e.target.value) / 100)
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* View Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default View Mode
                    </label>
                    <select
                      value={localSettings.defaults.viewMode}
                      onChange={(e) => handleChange('defaults', 'viewMode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="standard">Standard Post-1593</option>
                      <option value="juvenilia">Juvenilia Pre-1593</option>
                      <option value="alt_cipher">Alt Cipher Mode</option>
                      <option value="show_all">Show Everything</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {localSettings.defaults.viewMode === 'standard' &&
                        'Prioritizes Whitgift, hoohoo, Hen, de Vere'}
                      {localSettings.defaults.viewMode === 'juvenilia' &&
                        'Prioritizes Roger Manwood, Cate, classical refs'}
                      {localSettings.defaults.viewMode === 'alt_cipher' &&
                        'No thematic bias, pure statistical scoring'}
                      {localSettings.defaults.viewMode === 'show_all' &&
                        'Raw top results, no filtering'}
                    </p>
                  </div>

                  {/* Results Per Segment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Results Per Segment
                    </label>
                    <select
                      value={localSettings.defaults.resultsPerSegment}
                      onChange={(e) =>
                        handleChange('defaults', 'resultsPerSegment', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Export Preferences */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Preferences</h3>
                <div className="space-y-4">
                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Export Format
                    </label>
                    <select
                      value={localSettings.export.format}
                      onChange={(e) => handleChange('export', 'format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="google-sheets">Google Sheets</option>
                    </select>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localSettings.export.includeTransformationLogs}
                        onChange={(e) =>
                          handleChange('export', 'includeTransformationLogs', e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Include transformation logs
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localSettings.export.includeScoreBreakdown}
                        onChange={(e) =>
                          handleChange('export', 'includeScoreBreakdown', e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Include score breakdown
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Advanced Settings */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localSettings.enableExperimentalFeatures}
                      onChange={(e) =>
                        handleChange('', 'enableExperimentalFeatures', e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable experimental features
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localSettings.debugMode}
                      onChange={(e) => handleChange('', 'debugMode', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Debug mode (shows computation times)
                    </span>
                  </label>
                </div>
              </section>

              {/* Info Section */}
              <section className="border-t border-gray-200 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Settings are saved automatically</p>
                      <p className="text-blue-700">
                        Your preferences are stored locally and will persist between sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${
                    hasChanges
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SettingsModal;