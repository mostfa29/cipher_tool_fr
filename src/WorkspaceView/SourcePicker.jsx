// components/SourcePicker.jsx

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Search, ChevronRight, ChevronLeft, Upload, FileText, Check, X, Info, Loader } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const TABS = {
  LIBRARY: 'library',
  UPLOAD: 'upload',
  PASTE: 'paste'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['.txt', 'text/plain'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const SourcePicker = ({ onSourceSelect, selectedSourceId, compact = false }) => {
  const { state, dispatch, selectAuthor, loadWork, addNotification } = useAppState();
  const { authors, selectedAuthor, availableWorks } = state.library;
  
  const [activeTab, setActiveTab] = useState(TABS.LIBRARY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthorFolder, setSelectedAuthorFolder] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pasteData, setPasteData] = useState({ title: '', text: '' });

  // Filter authors and works based on search query
  const { filteredAuthors, filteredWorks } = useFilteredSources(
    authors,
    availableWorks,
    searchQuery
  );

  // ============================================================================
  // LIBRARY HANDLERS
  // ============================================================================
  const handleAuthorSelect = useCallback(async (authorFolder) => {
    setSelectedAuthorFolder(authorFolder);
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'works', value: true } });
    
    try {
      await selectAuthor(authorFolder);
    } catch (error) {
      addNotification('error', `Failed to load works: ${error.message}`);
    }
  }, [selectAuthor, dispatch, addNotification]);

  const handleWorkSelect = useCallback(async (work) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'work', value: true } });
    
    try {
      await loadWork(work.author_folder, work.id);
      onSourceSelect?.(work);
    } catch (error) {
      addNotification('error', `Failed to load work: ${error.message}`);
    }
  }, [loadWork, dispatch, addNotification, onSourceSelect]);

  const handleBackToAuthors = useCallback(() => {
    setSelectedAuthorFolder(null);
    setSearchQuery('');
    dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: [] });
  }, [dispatch]);

  // ============================================================================
  // UPLOAD HANDLERS
  // ============================================================================
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidType = ACCEPTED_FILE_TYPES.some(type => 
      file.type === type || file.name.endsWith(type)
    );
    
    if (!isValidType) {
      addNotification('error', 'Please upload a .txt file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      addNotification('error', 'File too large. Maximum size is 10MB');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      const source = createSourceFromText(
        text,
        file.name.replace(/\.[^/.]+$/, ''),
        'User Upload',
        {
          uploaded_at: new Date().toISOString(),
          original_filename: file.name,
        }
      );

      setUploadedFile(source);
      addNotification('success', `File "${file.name}" loaded successfully`);
    };

    reader.onerror = () => {
      addNotification('error', 'Failed to read file');
    };

    reader.readAsText(file);
  }, [addNotification]);

  const handleUploadedFileSelect = useCallback(() => {
    if (uploadedFile) {
      dispatch({ type: ACTIONS.SET_ACTIVE_SOURCE, payload: uploadedFile });
      onSourceSelect?.(uploadedFile);
    }
  }, [uploadedFile, dispatch, onSourceSelect]);

  const handleClearUpload = useCallback(() => {
    setUploadedFile(null);
  }, []);

  // ============================================================================
  // PASTE HANDLERS
  // ============================================================================
  const handlePasteSubmit = useCallback(() => {
    if (!pasteData.text.trim()) {
      addNotification('error', 'Please paste some text');
      return;
    }

    const source = createSourceFromText(
      pasteData.text,
      pasteData.title.trim() || 'Pasted Text',
      'User Input',
      {
        pasted_at: new Date().toISOString(),
      }
    );

    dispatch({ type: ACTIONS.SET_ACTIVE_SOURCE, payload: source });
    onSourceSelect?.(source);
    addNotification('success', 'Text loaded successfully');
    
    // Reset form
    setPasteData({ title: '', text: '' });
  }, [pasteData, dispatch, onSourceSelect, addNotification]);

  const handlePasteChange = useCallback((field, value) => {
    setPasteData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (compact) {
    return (
      <CompactView
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedAuthorFolder={selectedAuthorFolder}
        filteredAuthors={filteredAuthors}
        filteredWorks={filteredWorks}
        onAuthorSelect={handleAuthorSelect}
        onWorkSelect={handleWorkSelect}
        onBackToAuthors={handleBackToAuthors}
        selectedSourceId={selectedSourceId}
        isLoadingWorks={state.ui.isLoading?.works}
        isLoadingWork={state.ui.isLoading?.work}
      />
    );
  }

  return (
    <FullView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedAuthorFolder={selectedAuthorFolder}
      filteredAuthors={filteredAuthors}
      filteredWorks={filteredWorks}
      onAuthorSelect={handleAuthorSelect}
      onWorkSelect={handleWorkSelect}
      onBackToAuthors={handleBackToAuthors}
      selectedSourceId={selectedSourceId}
      uploadedFile={uploadedFile}
      onFileUpload={handleFileUpload}
      onUploadedFileSelect={handleUploadedFileSelect}
      onClearUpload={handleClearUpload}
      pasteData={pasteData}
      onPasteChange={handlePasteChange}
      onPasteSubmit={handlePasteSubmit}
      isLoadingAuthors={state.ui.isLoading?.authors}
      isLoadingWorks={state.ui.isLoading?.works}
      isLoadingWork={state.ui.isLoading?.work}
      authors={authors}
    />
  );
};

// ============================================================================
// COMPACT VIEW
// ============================================================================
const CompactView = ({
  searchQuery,
  onSearchChange,
  selectedAuthorFolder,
  filteredAuthors,
  filteredWorks,
  onAuthorSelect,
  onWorkSelect,
  onBackToAuthors,
  selectedSourceId,
  isLoadingWorks,
  isLoadingWork
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-600" />
        Source Library
      </h3>
    </div>

    <div className="p-3">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search..."
        compact
      />
    </div>

    <div className="max-h-96 overflow-y-auto">
      {!selectedAuthorFolder ? (
        <AuthorList
          authors={filteredAuthors}
          onSelect={onAuthorSelect}
          compact
        />
      ) : (
        <>
          <button
            onClick={onBackToAuthors}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200 flex items-center gap-2"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">Back to Authors</span>
          </button>
          
          {isLoadingWorks ? (
            <LoadingState message="Loading works..." compact />
          ) : (
            <WorkList
              works={filteredWorks}
              onSelect={onWorkSelect}
              selectedId={selectedSourceId}
              isLoadingWork={isLoadingWork}
              compact
            />
          )}
        </>
      )}
    </div>
  </div>
);

// ============================================================================
// FULL VIEW
// ============================================================================
const FullView = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedAuthorFolder,
  filteredAuthors,
  filteredWorks,
  onAuthorSelect,
  onWorkSelect,
  onBackToAuthors,
  selectedSourceId,
  uploadedFile,
  onFileUpload,
  onUploadedFileSelect,
  onClearUpload,
  pasteData,
  onPasteChange,
  onPasteSubmit,
  isLoadingAuthors,
  isLoadingWorks,
  isLoadingWork,
  authors
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Select Source Text
      </h3>
      <p className="text-sm text-gray-600 mt-1">
        Choose from corpus library, upload a file, or paste text
      </p>
    </div>

    <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />

    <div className="p-6">
      {activeTab === TABS.LIBRARY && (
        <LibraryTab
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedAuthorFolder={selectedAuthorFolder}
          filteredAuthors={filteredAuthors}
          filteredWorks={filteredWorks}
          onAuthorSelect={onAuthorSelect}
          onWorkSelect={onWorkSelect}
          onBackToAuthors={onBackToAuthors}
          selectedSourceId={selectedSourceId}
          isLoadingAuthors={isLoadingAuthors}
          isLoadingWorks={isLoadingWorks}
          isLoadingWork={isLoadingWork}
          authors={authors}
        />
      )}

      {activeTab === TABS.UPLOAD && (
        <UploadTab
          uploadedFile={uploadedFile}
          onFileUpload={onFileUpload}
          onUploadedFileSelect={onUploadedFileSelect}
          onClearUpload={onClearUpload}
        />
      )}

      {activeTab === TABS.PASTE && (
        <PasteTab
          pasteData={pasteData}
          onPasteChange={onPasteChange}
          onPasteSubmit={onPasteSubmit}
        />
      )}
    </div>
  </div>
);

// ============================================================================
// TAB NAVIGATION
// ============================================================================
const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="border-b border-gray-200 bg-gray-50">
    <div className="flex">
      <TabButton
        active={activeTab === TABS.LIBRARY}
        onClick={() => onTabChange(TABS.LIBRARY)}
        icon="📚"
        label="Corpus Library"
      />
      <TabButton
        active={activeTab === TABS.UPLOAD}
        onClick={() => onTabChange(TABS.UPLOAD)}
        icon="📤"
        label="Upload File"
      />
      <TabButton
        active={activeTab === TABS.PASTE}
        onClick={() => onTabChange(TABS.PASTE)}
        icon="📋"
        label="Paste Text"
      />
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 px-6 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2
      ${active
        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }
    `}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

// ============================================================================
// LIBRARY TAB
// ============================================================================
const LibraryTab = ({
  searchQuery,
  onSearchChange,
  selectedAuthorFolder,
  filteredAuthors,
  filteredWorks,
  onAuthorSelect,
  onWorkSelect,
  onBackToAuthors,
  selectedSourceId,
  isLoadingAuthors,
  isLoadingWorks,
  isLoadingWork,
  authors
}) => (
  <div className="space-y-4">
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder={selectedAuthorFolder ? "Search works..." : "Search authors..."}
    />

    {selectedAuthorFolder && (
      <Breadcrumb
        onBackClick={onBackToAuthors}
        currentAuthor={authors?.find(a => a.folder_name === selectedAuthorFolder)?.name || selectedAuthorFolder}
      />
    )}

    <div className="max-h-[500px] overflow-y-auto space-y-2">
      {!selectedAuthorFolder ? (
        isLoadingAuthors ? (
          <LoadingState message="Loading authors..." />
        ) : filteredAuthors.length === 0 ? (
          <EmptyState message="No authors found" icon="📚" />
        ) : (
          <AuthorList
            authors={filteredAuthors}
            onSelect={onAuthorSelect}
          />
        )
      ) : (
        isLoadingWorks ? (
          <LoadingState message="Loading works..." />
        ) : filteredWorks.length === 0 ? (
          <EmptyState message="No works found" icon="📖" />
        ) : (
          <WorkList
            works={filteredWorks}
            onSelect={onWorkSelect}
            selectedId={selectedSourceId}
            isLoadingWork={isLoadingWork}
          />
        )
      )}
    </div>
  </div>
);

// ============================================================================
// UPLOAD TAB
// ============================================================================
const UploadTab = ({ uploadedFile, onFileUpload, onUploadedFileSelect, onClearUpload }) => (
  <div className="space-y-4">
    {!uploadedFile ? (
      <>
        <UploadDropzone onFileUpload={onFileUpload} />
        <UploadInstructions />
      </>
    ) : (
      <UploadSuccess
        file={uploadedFile}
        onClear={onClearUpload}
        onUse={onUploadedFileSelect}
      />
    )}
  </div>
);

const UploadDropzone = ({ onFileUpload }) => (
  <label className="block cursor-pointer">
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all">
      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p className="text-base font-semibold text-gray-900 mb-2">
        Click to upload or drag and drop
      </p>
      <p className="text-sm text-gray-500">
        Plain text files (.txt) • Maximum 10MB
      </p>
    </div>
    <input
      type="file"
      accept=".txt,text/plain"
      onChange={onFileUpload}
      className="hidden"
    />
  </label>
);

const UploadInstructions = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
    <div className="flex gap-3">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-blue-900 mb-2">💡 Tips for best results:</p>
        <ul className="text-blue-800 space-y-1.5 list-disc list-inside">
          <li>Use plain text format (.txt)</li>
          <li>Remove modern editorial notes and line numbers</li>
          <li>Keep original spelling and punctuation</li>
          <li>One line per line of verse/prose</li>
        </ul>
      </div>
    </div>
  </div>
);

const UploadSuccess = ({ file, onClear, onUse }) => (
  <div className="space-y-4">
    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-green-900 mb-1">File loaded successfully!</h4>
          <p className="text-sm font-medium text-green-800">{file.title}</p>
          <p className="text-xs text-green-700 mt-2">
            {file.line_count.toLocaleString()} lines • {file.text.length.toLocaleString()} characters
          </p>
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        onClick={onClear}
        className="flex-1 px-5 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
      >
        Upload Different File
      </button>
      <button
        onClick={onUse}
        className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all"
      >
        Use This File →
      </button>
    </div>
  </div>
);

// ============================================================================
// PASTE TAB
// ============================================================================
const PasteTab = ({ pasteData, onPasteChange, onPasteSubmit }) => {
  const lineCount = pasteData.text.split('\n').length;
  const charCount = pasteData.text.length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Title <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={pasteData.title}
          onChange={(e) => onPasteChange('title', e.target.value)}
          placeholder="e.g., Sonnet 18"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Text <span className="text-red-500">*</span>
        </label>
        <textarea
          value={pasteData.text}
          onChange={(e) => onPasteChange('text', e.target.value)}
          placeholder="Paste your text here (one line per line of verse/prose)..."
          rows={14}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none transition-all"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {lineCount.toLocaleString()} lines • {charCount.toLocaleString()} characters
          </p>
          {pasteData.text && (
            <button
              onClick={() => onPasteChange('text', '')}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onPasteSubmit}
        disabled={!pasteData.text.trim()}
        className={`
          w-full px-6 py-3 text-sm font-bold rounded-xl transition-all
          ${pasteData.text.trim()
            ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-[1.02]'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }
        `}
      >
        Load Pasted Text →
      </button>
    </div>
  );
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
const SearchInput = ({ value, onChange, placeholder, compact = false }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
        ${compact ? 'px-3 py-2 pl-9 text-xs' : 'px-4 py-3 pl-11 text-sm'}
      `}
    />
    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
  </div>
);

const Breadcrumb = ({ onBackClick, currentAuthor }) => (
  <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
    <button
      onClick={onBackClick}
      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      Authors
    </button>
    <ChevronRight className="w-4 h-4 text-gray-400" />
    <span className="text-gray-900 font-medium">{currentAuthor}</span>
  </div>
);

const AuthorList = ({ authors, onSelect, compact = false }) => (
  <div className={compact ? 'divide-y divide-gray-100' : 'space-y-2'}>
    {authors.map(author => (
      <AuthorCard
        key={author.folder_name}
        author={author}
        onSelect={onSelect}
        compact={compact}
      />
    ))}
  </div>
);

const AuthorCard = ({ author, onSelect, compact }) => (
  <button
    onClick={() => onSelect(author.folder_name)}
    className={`
      w-full text-left transition-all
      ${compact
        ? 'px-3 py-2.5 hover:bg-blue-50'
        : 'p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
      }
    `}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          {author.name}
        </h4>
        <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'} mt-0.5`}>
          {author.work_count} {author.work_count === 1 ? 'work' : 'works'}
        </p>
      </div>
      <ChevronRight className={`text-gray-400 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
    </div>
  </button>
);

const WorkList = ({ works, onSelect, selectedId, isLoadingWork, compact = false }) => (
  <div className={compact ? 'divide-y divide-gray-100' : 'space-y-2'}>
    {works.map(work => (
      <WorkCard
        key={work.id}
        work={work}
        onSelect={onSelect}
        isSelected={selectedId === work.id}
        isLoading={isLoadingWork}
        compact={compact}
      />
    ))}
  </div>
);

const WorkCard = ({ work, onSelect, isSelected, isLoading, compact }) => (
  <button
    onClick={() => onSelect(work)}
    disabled={isLoading}
    className={`
      w-full text-left transition-all
      ${isSelected
        ? compact
          ? 'bg-blue-50 border-l-4 border-blue-500'
          : 'border-2 border-blue-500 bg-blue-50 ring-2 ring-blue-200 rounded-xl'
        : compact
          ? 'hover:bg-gray-50'
          : 'border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl'
      }
      ${isLoading ? 'opacity-50 cursor-wait' : ''}
      ${compact ? 'px-3 py-2.5' : 'p-4'}
    `}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
          {work.title}
        </h4>
        <p className={`text-gray-600 mt-0.5 ${compact ? 'text-xs' : 'text-xs'}`}>
          {work.author} • {work.date}
        </p>
        <div className={`flex items-center gap-3 ${compact ? 'mt-1' : 'mt-2'}`}>
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
            {work.line_count.toLocaleString()} lines
          </span>
          {work.has_segmentation && (
            <span className={`text-green-600 font-semibold ${compact ? 'text-xs' : 'text-xs'}`}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
      {isSelected && (
        <Check className={`text-blue-600 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
      )}
    </div>
  </button>
);

const LoadingState = ({ message, compact = false }) => (
  <div className={`text-center ${compact ? 'py-8' : 'py-16'}`}>
    <Loader className={`animate-spin text-blue-600 mx-auto ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
    <p className={`text-gray-500 mt-3 ${compact ? 'text-xs' : 'text-sm'}`}>{message}</p>
  </div>
);

const EmptyState = ({ message, icon }) => (
  <div className="text-center py-12">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

// ============================================================================
// UTILITIES
// ============================================================================
const useFilteredSources = (authors, works, query) => {
  return useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return {
        filteredAuthors: authors || [],
        filteredWorks: works || []
      };
    }

    return {
      filteredAuthors: (authors || []).filter(author =>
        author.name.toLowerCase().includes(normalizedQuery)
      ),
      filteredWorks: (works || []).filter(work =>
        work.title.toLowerCase().includes(normalizedQuery) ||
        work.author.toLowerCase().includes(normalizedQuery) ||
        work.date.includes(normalizedQuery)
      )
    };
  }, [authors, works, query]);
};

const createSourceFromText = (text, title, author, metadata) => {
  const lines = text.split('\n');
  const timestamp = Date.now();
  
  return {
    id: `user_${timestamp}`,
    title,
    author,
    author_folder: 'user_uploads',
    date: new Date().toISOString().split('T')[0],
    text,
    lines,
    line_count: lines.length,
    metadata: {
      ...metadata,
      created_at: new Date().toISOString()
    }
  };
};

// ============================================================================
// PROP TYPES
// ============================================================================
SourcePicker.propTypes = {
  onSourceSelect: PropTypes.func,
  selectedSourceId: PropTypes.string,
  compact: PropTypes.bool,
};

export default SourcePicker;