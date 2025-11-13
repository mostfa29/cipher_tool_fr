// components/SourcePicker.jsx

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';

const SourcePicker = ({ onSourceSelect, selectedSourceId }) => {
  const { state, addNotification } = useAppState();
  const { availableSources } = state.library;
  
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload' | 'paste'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');

  // Filter sources based on search and category
  const filteredSources = useMemo(() => {
    let filtered = availableSources;

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(source => source.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(source =>
        source.title.toLowerCase().includes(query) ||
        source.author.toLowerCase().includes(query) ||
        (source.edition && source.edition.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [availableSources, categoryFilter, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(availableSources.map(s => s.category));
    return Array.from(cats).sort();
  }, [availableSources]);

  // Category display names
  const categoryNames = {
    marlowe_plays: 'Marlowe - Plays',
    marlowe_poetry: 'Marlowe - Poetry',
    spanish_tragedy: 'Spanish Tragedy',
    shakespeare_tragedies: 'Shakespeare - Tragedies',
    shakespeare_histories: 'Shakespeare - Histories',
    shakespeare_poetry: 'Shakespeare - Poetry',
    bible: 'King James Bible',
    poetry: 'Other Poetry',
    prose: 'Prose Works',
    user_uploads: 'My Uploads',
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/plain', 'application/rtf', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      addNotification('error', 'Please upload a .txt, .rtf, or .doc file');
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
      
      // Create source object
      const source = {
        id: `upload_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        author: 'Unknown',
        category: 'user_uploads',
        publication_year: null,
        edition: null,
        character_count: text.length,
        source_authority: 'User uploaded',
        text: text,
        metadata: {
          contains_blackletter: false,
          corruption_flags: [],
          quality_score: null,
          uploaded_at: new Date().toISOString(),
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

    const source = {
      id: `paste_${Date.now()}`,
      title: pastedTitle.trim() || 'Pasted Text',
      author: 'Unknown',
      category: 'user_uploads',
      publication_year: null,
      edition: null,
      character_count: pastedText.length,
      source_authority: 'User pasted',
      text: pastedText,
      metadata: {
        contains_blackletter: false,
        corruption_flags: [],
        quality_score: null,
        pasted_at: new Date().toISOString(),
      },
    };

    onSourceSelect(source);
    addNotification('success', 'Text loaded successfully');
  };

  // Handle source selection
  const handleSourceClick = (source) => {
    onSourceSelect(source);
  };

  // Handle uploaded file selection
  const handleUploadedFileSelect = () => {
    if (uploadedFile) {
      onSourceSelect(uploadedFile);
    }
  };

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
            📚 Library ({availableSources.length})
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
            📤 Upload
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
            📋 Paste
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or edition..."
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

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Categories ({availableSources.length})</option>
                {categories.map(cat => {
                  const count = availableSources.filter(s => s.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {categoryNames[cat] || cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Select */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const faustus = availableSources.find(s => s.id === 'faustus_a1_1604');
                    if (faustus) handleSourceClick(faustus);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Faustus A1
                </button>
                <button
                  onClick={() => {
                    const spanish = availableSources.find(s => s.id === 'spanish_tragedy_1592');
                    if (spanish) handleSourceClick(spanish);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Spanish Tragedy
                </button>
                <button
                  onClick={() => {
                    const hamlet = availableSources.find(s => s.id === 'hamlet_q2_1604');
                    if (hamlet) handleSourceClick(hamlet);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Hamlet Q2
                </button>
                <button
                  onClick={() => {
                    const kjv = availableSources.find(s => s.id === 'kjv_genesis_1611');
                    if (kjv) handleSourceClick(kjv);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  KJV Bible
                </button>
              </div>
            </div>

            {/* Source List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSources.length === 0 ? (
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
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">No sources found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => handleSourceClick(source)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-all
                      ${selectedSourceId === source.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {source.title}
                          </h4>
                          {source.edition && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {source.edition}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {source.author}
                          {source.publication_year && ` • ${source.publication_year}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {source.character_count.toLocaleString()} chars
                          </span>
                          {source.metadata.quality_score && (
                            <span className="text-xs text-gray-500">
                              Quality: {Math.round(source.metadata.quality_score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedSourceId === source.id && (
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
                      .txt, .rtf, or .doc files (Max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".txt,.rtf,.doc"
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
                        <li>Use plain text format (.txt) when possible</li>
                        <li>Remove modern editorial notes and line numbers</li>
                        <li>Keep original spelling and punctuation</li>
                        <li>Avoid texts with extensive corruption</li>
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
                        {uploadedFile.character_count.toLocaleString()} characters
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
                placeholder="Paste your Elizabethan text here..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {pastedText.length.toLocaleString()} characters
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
  onSourceSelect: PropTypes.func.isRequired,
  selectedSourceId: PropTypes.string,
};

export default SourcePicker;