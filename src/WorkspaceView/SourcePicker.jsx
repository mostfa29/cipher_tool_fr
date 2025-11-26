// components/SourcePicker.jsx

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';

const SourcePicker = ({ onSourceSelect, selectedSourceId, compact = false }) => {
  const { state, dispatch, selectAuthor, loadWork, addNotification } = useAppState();
  const { authors, selectedAuthor, availableWorks } = state.library;
  
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload' | 'paste'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthorFolder, setSelectedAuthorFolder] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) {
      return authors || [];
    }

    const query = searchQuery.toLowerCase();
    return (authors || []).filter(author =>
      author.name.toLowerCase().includes(query)
    );
  }, [authors, searchQuery]);

  // Filter works based on search
  const filteredWorks = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableWorks || [];
    }

    const query = searchQuery.toLowerCase();
    return (availableWorks || []).filter(work =>
      work.title.toLowerCase().includes(query) ||
      work.author.toLowerCase().includes(query) ||
      work.date.toLowerCase().includes(query)
    );
  }, [availableWorks, searchQuery]);

  // Load works when an author is selected
  const handleAuthorSelect = async (authorFolder) => {
    setSelectedAuthorFolder(authorFolder);
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: true } });
    
    try {
      await selectAuthor(authorFolder);
    } catch (error) {
      addNotification('error', `Failed to load works: ${error.message}`);
    }
  };

  // Handle work selection
  const handleWorkSelect = async (work) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: true } });
    
    try {
      await loadWork(work.author_folder, work.id);
      if (onSourceSelect) {
        onSourceSelect(work);
      }
    } catch (error) {
      addNotification('error', `Failed to load work: ${error.message}`);
    }
  };

  // Go back to author list
  const handleBackToAuthors = () => {
    setSelectedAuthorFolder(null);
    dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: [] });
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      addNotification('error', 'Please upload a .txt file');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      addNotification('error', 'File too large. Maximum size is 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      // Create source object matching backend TextContent format
      const source = {
        id: `upload_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        author: 'User Upload',
        author_folder: 'user_uploads',
        date: new Date().toISOString().split('T')[0],
        text: text,
        lines: lines,
        line_count: lines.length,
        metadata: {
          uploaded_at: new Date().toISOString(),
          original_filename: file.name,
        },
      };

      setUploadedFile(source);
      addNotification('success', `File "${file.name}" loaded successfully`);
    };

    reader.onerror = () => {
      addNotification('error', 'Failed to read file');
    };

    reader.readAsText(file);
  };

  // Handle paste text
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      addNotification('error', 'Please paste some text');
      return;
    }

    const lines = pastedText.split('\n');
    
    const source = {
      id: `paste_${Date.now()}`,
      title: pastedTitle.trim() || 'Pasted Text',
      author: 'User Input',
      author_folder: 'user_uploads',
      date: new Date().toISOString().split('T')[0],
      text: pastedText,
      lines: lines,
      line_count: lines.length,
      metadata: {
        pasted_at: new Date().toISOString(),
      },
    };

    // Set as active source
    dispatch({ type: ACTIONS.SET_ACTIVE_SOURCE, payload: source });
    
    if (onSourceSelect) {
      onSourceSelect(source);
    }
    
    addNotification('success', 'Text loaded successfully');
  };

  // Handle uploaded file selection
  const handleUploadedFileSelect = () => {
    if (uploadedFile) {
      // Set as active source
      dispatch({ type: ACTIONS.SET_ACTIVE_SOURCE, payload: uploadedFile });
      
      if (onSourceSelect) {
        onSourceSelect(uploadedFile);
      }
    }
  };

  // Compact view (for sidebar)
  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-900">Source Library</h3>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {!selectedAuthorFolder ? (
            // Author list
            <div className="divide-y divide-gray-100">
              {filteredAuthors.map(author => (
                <button
                  key={author.folder_name}
                  onClick={() => handleAuthorSelect(author.folder_name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-900">{author.name}</div>
                  <div className="text-xs text-gray-500">{author.work_count} works</div>
                </button>
              ))}
            </div>
          ) : (
            // Works list
            <div>
              <button
                onClick={handleBackToAuthors}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
              >
                <div className="text-xs font-medium text-blue-600">← Back to Authors</div>
              </button>
              <div className="divide-y divide-gray-100">
                {state.ui.isLoading?.works ? (
                  <div className="px-3 py-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Loading works...</p>
                  </div>
                ) : filteredWorks.length === 0 ? (
                  <div className="px-3 py-8 text-center text-xs text-gray-500">
                    No works found
                  </div>
                ) : (
                  filteredWorks.map(work => (
                    <button
                      key={work.id}
                      onClick={() => handleWorkSelect(work)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                        selectedSourceId === work.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-900 truncate">{work.title}</div>
                      <div className="text-xs text-gray-500">
                        {work.date} • {work.line_count.toLocaleString()} lines
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full view (for main workspace)
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Select Source Text</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('library')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'library'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            📚 Corpus Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            📤 Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'paste'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            📋 Paste Text
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={selectedAuthorFolder ? "Search works..." : "Search authors..."}
                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Breadcrumb */}
            {selectedAuthorFolder && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleBackToAuthors}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Authors
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700">
                  {authors?.find(a => a.folder_name === selectedAuthorFolder)?.name || selectedAuthorFolder}
                </span>
              </div>
            )}

            {/* List Container */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {!selectedAuthorFolder ? (
                // Show Authors
                <>
                  {state.ui.isLoading?.authors ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-3">Loading authors...</p>
                    </div>
                  ) : filteredAuthors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <p className="text-sm">No authors found</p>
                    </div>
                  ) : (
                    filteredAuthors.map(author => (
                      <button
                        key={author.folder_name}
                        onClick={() => handleAuthorSelect(author.folder_name)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {author.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {author.work_count} {author.work_count === 1 ? 'work' : 'works'}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </>
              ) : (
                // Show Works
                <>
                  {state.ui.isLoading?.works ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-3">Loading works...</p>
                    </div>
                  ) : filteredWorks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-sm">No works found</p>
                    </div>
                  ) : (
                    filteredWorks.map(work => (
                      <button
                        key={work.id}
                        onClick={() => handleWorkSelect(work)}
                        disabled={state.ui.isLoading?.work}
                        className={`
                          w-full text-left p-3 rounded-lg border transition-all
                          ${selectedSourceId === work.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                          ${state.ui.isLoading?.work ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {work.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {work.author} • {work.date}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">
                                {work.line_count.toLocaleString()} lines
                              </span>
                              {work.has_segmentation && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ Saved segmentation
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedSourceId === work.id && (
                            <svg
                              className="w-5 h-5 text-blue-600 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {!uploadedFile ? (
              <div>
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Plain text files (.txt) • Max 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
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
                      <p className="font-medium mb-1">💡 Tips for best results:</p>
                      <ul className="text-blue-700 space-y-1 text-xs list-disc list-inside">
                        <li>Use plain text format (.txt)</li>
                        <li>Remove modern editorial notes and line numbers</li>
                        <li>Keep original spelling and punctuation</li>
                        <li>One line per line of verse/prose</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900">File loaded successfully</h4>
                      <p className="text-sm text-green-800 mt-1">{uploadedFile.title}</p>
                      <p className="text-xs text-green-700 mt-1">
                        {uploadedFile.line_count.toLocaleString()} lines
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Upload Different File
                  </button>
                  <button
                    onClick={handleUploadedFileSelect}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Use This File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paste Tab */}
        {activeTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="e.g., Sonnet 18"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your text here (one line per line of verse/prose)..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {pastedText.split('\n').length} lines • {pastedText.length.toLocaleString()} characters
              </p>
            </div>

            <button
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim()}
              className={`
                w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${pastedText.trim()
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }
              `}
            >
              Load Pasted Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

SourcePicker.propTypes = {
  onSourceSelect: PropTypes.func,
  selectedSourceId: PropTypes.string,
  compact: PropTypes.bool,
};

export default SourcePicker;