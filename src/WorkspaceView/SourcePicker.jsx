// components/SourcePicker.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Upload, 
  FileText, 
  Check, 
  X, 
  Info, 
  Loader,
  BookOpen,
  Library,
  FolderOpen,
  Star,
  Clock,
  Filter,
  Download,
  Hash,
  Percent,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const TABS = {
  LIBRARY: 'library',
  UPLOAD: 'upload',
  PASTE: 'paste',
  RECENT: 'recent'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['.txt', 'text/plain'];
const RECENT_WORKS_KEY = 'merlin_recent_works';
const MAX_RECENT_WORKS = 10;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const SourcePicker = ({ onSourceSelect, selectedSourceId, compact = false }) => {
  const { 
    state, 
    dispatch, 
    selectAuthor, 
    loadWork, 
    addNotification,
    uploadWorkFile,
    getAuthorsForUpload
  } = useAppState();
  
  const { authors, selectedAuthor, availableWorks } = state.library;
  
  const [activeTab, setActiveTab] = useState(TABS.LIBRARY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthorFolder, setSelectedAuthorFolder] = useState(null);
  const [pasteData, setPasteData] = useState({ title: '', text: '' });
  const [recentWorks, setRecentWorks] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    dateRange: 'all',
    hasSegmentation: 'all',
    minLines: 0
  });

  // Load recent works from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_WORKS_KEY);
      if (stored) {
        setRecentWorks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent works:', error);
    }
  }, []);

  // Save to recent works
  const addToRecentWorks = useCallback((work) => {
    try {
      const updated = [
        { ...work, accessed_at: Date.now() },
        ...recentWorks.filter(w => w.id !== work.id)
      ].slice(0, MAX_RECENT_WORKS);
      
      setRecentWorks(updated);
      localStorage.setItem(RECENT_WORKS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent work:', error);
    }
  }, [recentWorks]);

  // Filter authors and works based on search and filters
  const { filteredAuthors, filteredWorks } = useFilteredSources(
    authors,
    availableWorks,
    searchQuery,
    filterOptions
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
    // Check if a specific edition was selected
    const selectedEdition = work.selectedEdition || null;
    
    await loadWork(
      work.author_folder, 
      work.id,
      selectedEdition
    );
    
    addToRecentWorks(work);
    onSourceSelect?.(work);
  } catch (error) {
    addNotification('error', `Failed to load work: ${error.message}`);
  }
}, [loadWork, dispatch, addNotification, onSourceSelect, addToRecentWorks, uploadWorkFile]);

  const handleBackToAuthors = useCallback(() => {
    setSelectedAuthorFolder(null);
    setSearchQuery('');
    dispatch({ type: ACTIONS.SET_AVAILABLE_WORKS, payload: [] });
  }, [dispatch]);

  // ============================================================================
  // UPLOAD HANDLERS
  // ============================================================================
const handleFileUpload = useCallback(async (file, uploadMetadata) => {
  if (!file) return;

  const isValidType = ACCEPTED_FILE_TYPES.some(type => 
    file.type === type || file.name.endsWith(type)
  );
  
  if (!isValidType) {
    addNotification('error', 'Please upload a .txt file');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    addNotification('error', 'File too large. Maximum size is 10MB');
    return;
  }

  dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'upload', value: true } });

  try {
    const result = await uploadWorkFile(file, {
      authorFolder: uploadMetadata.authorFolder,
      workTitle: uploadMetadata.workTitle,
      date: uploadMetadata.date || 'Unknown',
      isNewAuthor: uploadMetadata.isNewAuthor || false
    });

    if (result) {
      addNotification('success', `Successfully uploaded "${uploadMetadata.workTitle}"`);
      
      // Switch to Library tab to see the uploaded work
      setActiveTab(TABS.LIBRARY);
      
      // If uploaded to existing author, refresh that author's works
      if (!uploadMetadata.isNewAuthor && selectedAuthorFolder === uploadMetadata.authorFolder) {
        await selectAuthor(uploadMetadata.authorFolder);
      }
      
      // If new author, refresh authors list and select it
      if (uploadMetadata.isNewAuthor) {
        setSelectedAuthorFolder(uploadMetadata.authorFolder);
        await selectAuthor(uploadMetadata.authorFolder);
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    addNotification('error', `Upload failed: ${error.message}`);
  } finally {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'upload', value: false } });
  }
}, [uploadWorkFile, addNotification, dispatch, selectedAuthorFolder, selectAuthor, setActiveTab]);




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
  // FILTER HANDLERS
  // ============================================================================
  const handleFilterChange = useCallback((key, value) => {
    setFilterOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterOptions({
      dateRange: 'all',
      hasSegmentation: 'all',
      minLines: 0
    });
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
    // REMOVE THIS LINE: uploadedFile={uploadedFile}
    onFileUpload={handleFileUpload}
    // REMOVE THESE LINES:
    // onUploadedFileSelect={handleUploadedFileSelect}
    // onClearUpload={handleClearUpload}
    pasteData={pasteData}
    onPasteChange={handlePasteChange}
    onPasteSubmit={handlePasteSubmit}
    recentWorks={recentWorks}
    filterOptions={filterOptions}
    onFilterChange={handleFilterChange}
    onClearFilters={clearFilters}
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
        <Library className="w-4 h-4 text-blue-600" />
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
  // REMOVE: uploadedFile,
  onFileUpload,
  // REMOVE: onUploadedFileSelect,
  // REMOVE: onClearUpload,
  pasteData,
  onPasteChange,
  onPasteSubmit,
  recentWorks,
  filterOptions,
  onFilterChange,
  onClearFilters,
  isLoadingAuthors,
  isLoadingWorks,
  isLoadingWork,
  authors
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Select Source Text
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose from corpus library, recent works, upload, or paste text
          </p>
        </div>
      </div>
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
          filterOptions={filterOptions}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          isLoadingAuthors={isLoadingAuthors}
          isLoadingWorks={isLoadingWorks}
          isLoadingWork={isLoadingWork}
          authors={authors}
        />
      )}

      {activeTab === TABS.RECENT && (
        <RecentTab
          recentWorks={recentWorks}
          onWorkSelect={onWorkSelect}
          selectedSourceId={selectedSourceId}
          isLoadingWork={isLoadingWork}
        />
      )}

      {activeTab === TABS.UPLOAD && (
    <UploadTab
      onFileUpload={onFileUpload}
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
    <div className="flex overflow-x-auto">
      <TabButton
        active={activeTab === TABS.LIBRARY}
        onClick={() => onTabChange(TABS.LIBRARY)}
        icon={<Library className="w-4 h-4" />}
        label="Corpus Library"
      />
      <TabButton
        active={activeTab === TABS.RECENT}
        onClick={() => onTabChange(TABS.RECENT)}
        icon={<Clock className="w-4 h-4" />}
        label="Recent"
      />
      <TabButton
        active={activeTab === TABS.UPLOAD}
        onClick={() => onTabChange(TABS.UPLOAD)}
        icon={<Upload className="w-4 h-4" />}
        label="Upload"
      />
      <TabButton
        active={activeTab === TABS.PASTE}
        onClick={() => onTabChange(TABS.PASTE)}
        icon={<FileText className="w-4 h-4" />}
        label="Paste"
      />
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 min-w-[120px] px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2
      ${active
        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }
    `}
  >
    {icon}
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
  filterOptions,
  onFilterChange,
  onClearFilters,
  isLoadingAuthors,
  isLoadingWorks,
  isLoadingWork,
  authors
}) => (
  <div className="space-y-4">
    <div className="flex gap-3">
      <div className="flex-1">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={selectedAuthorFolder ? "Search works..." : "Search authors..."}
        />
      </div>
      {selectedAuthorFolder && (
        <FilterPanel
          filterOptions={filterOptions}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      )}
    </div>

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
          <EmptyState message="No authors found" icon={<Library className="w-12 h-12 text-gray-300" />} />
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
          <EmptyState 
            message={searchQuery ? "No works match your search" : "No works found"} 
            icon={<FileText className="w-12 h-12 text-gray-300" />} 
          />
        ) : (
          <>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-gray-500 font-medium">
                {filteredWorks.length} {filteredWorks.length === 1 ? 'work' : 'works'}
              </span>
              {(filterOptions.dateRange !== 'all' || filterOptions.hasSegmentation !== 'all' || filterOptions.minLines > 0) && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
            <WorkList
              works={filteredWorks}
              onSelect={onWorkSelect}
              selectedId={selectedSourceId}
              isLoadingWork={isLoadingWork}
            />
          </>
        )
      )}
    </div>
  </div>
);

// ============================================================================
// FILTER PANEL
// ============================================================================
const FilterPanel = ({ filterOptions, onFilterChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasActiveFilters = filterOptions.dateRange !== 'all' || 
                          filterOptions.hasSegmentation !== 'all' || 
                          filterOptions.minLines > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-semibold
          ${hasActiveFilters 
            ? 'border-blue-500 bg-blue-50 text-blue-700' 
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            •
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border-2 border-gray-200 shadow-xl z-20 p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filterOptions.dateRange}
                onChange={(e) => onFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All periods</option>
                <option value="1500s">1500-1599</option>
                <option value="1600s">1600-1699</option>
                <option value="1700s">1700-1799</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Segmentation Status
              </label>
              <select
                value={filterOptions.hasSegmentation}
                onChange={(e) => onFilterChange('hasSegmentation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All works</option>
                <option value="yes">Has saved segmentation</option>
                <option value="no">No segmentation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Minimum Lines: {filterOptions.minLines}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={filterOptions.minLines}
                onChange={(e) => onFilterChange('minLines', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  onClearFilters();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// RECENT TAB
// ============================================================================
const RecentTab = ({ recentWorks, onWorkSelect, selectedSourceId, isLoadingWork }) => (
  <div className="space-y-4">
    {recentWorks.length === 0 ? (
      <div className="text-center py-16">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-gray-500 mb-2">No recent works</p>
        <p className="text-xs text-gray-400">
          Works you open will appear here for quick access
        </p>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {recentWorks.length} recent {recentWorks.length === 1 ? 'work' : 'works'}
          </p>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          <WorkList
            works={recentWorks}
            onSelect={onWorkSelect}
            selectedId={selectedSourceId}
            isLoadingWork={isLoadingWork}
            showAccessTime
          />
        </div>
      </>
    )}
  </div>
);

// ============================================================================
// UPLOAD TAB
// ============================================================================
const UploadTab = ({ onFileUpload }) => {
  const [uploadForm, setUploadForm] = useState({
    file: null,
    authorFolder: '',
    workTitle: '',
    date: '',
    isNewAuthor: false,
    newAuthorName: ''
  });
  
  const { getAuthorsForUpload } = useAppState();
  const [authorOptions, setAuthorOptions] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(false);

  // Load author options
  useEffect(() => {
    const loadAuthors = async () => {
      setLoadingAuthors(true);
      try {
        const authors = await getAuthorsForUpload();
        setAuthorOptions(authors);
      } catch (error) {
        console.error('Failed to load authors:', error);
      } finally {
        setLoadingAuthors(false);
      }
    };
    loadAuthors();
  }, [getAuthorsForUpload]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        // Auto-extract work title from filename
        workTitle: prev.workTitle || file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleSubmit = () => {
    if (!uploadForm.file) {
      return;
    }

    const metadata = {
      authorFolder: uploadForm.isNewAuthor 
        ? uploadForm.newAuthorName.replace(/\s+/g, '_')
        : uploadForm.authorFolder,
      workTitle: uploadForm.workTitle,
      date: uploadForm.date || new Date().getFullYear().toString(),
      isNewAuthor: uploadForm.isNewAuthor
    };

    onFileUpload(uploadForm.file, metadata);
  };

  const isValid = uploadForm.file && 
                  uploadForm.workTitle && 
                  (uploadForm.isNewAuthor ? uploadForm.newAuthorName : uploadForm.authorFolder);

  return (
    <div className="space-y-4">
      {/* File Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select File <span className="text-red-500">*</span>
        </label>
        <label className="block cursor-pointer">
          <div className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${uploadForm.file 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
            }
          `}>
            {uploadForm.file ? (
              <>
                <Check className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {uploadForm.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadForm.file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Click to upload
                </p>
                <p className="text-xs text-gray-500">
                  Plain text files (.txt) • Max 10MB
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {uploadForm.file && (
        <>
          {/* Author Selection */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={uploadForm.isNewAuthor}
                onChange={(e) => setUploadForm(prev => ({
                  ...prev,
                  isNewAuthor: e.target.checked,
                  authorFolder: '',
                  newAuthorName: ''
                }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Create new author
              </span>
            </label>

            {uploadForm.isNewAuthor ? (
              <input
                type="text"
                value={uploadForm.newAuthorName}
                onChange={(e) => setUploadForm(prev => ({
                  ...prev,
                  newAuthorName: e.target.value
                }))}
                placeholder="Enter author name (e.g., Christopher Marlowe)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={uploadForm.authorFolder}
                onChange={(e) => setUploadForm(prev => ({
                  ...prev,
                  authorFolder: e.target.value
                }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                disabled={loadingAuthors}
              >
                <option value="">Select existing author...</option>
                {authorOptions.map(author => (
                  <option key={author.value} value={author.value}>
                    {author.label} ({author.workCount} works)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Work Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Work Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={uploadForm.workTitle}
              onChange={(e) => setUploadForm(prev => ({
                ...prev,
                workTitle: e.target.value
              }))}
              placeholder="e.g., Doctor Faustus"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Publication Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={uploadForm.date}
              onChange={(e) => setUploadForm(prev => ({
                ...prev,
                date: e.target.value
              }))}
              placeholder="e.g., 1604"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`
              w-full px-6 py-3 text-sm font-bold rounded-xl transition-all
              ${isValid
                ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }
            `}
          >
            Upload to Corpus
          </button>
        </>
      )}

      <UploadInstructions />
    </div>
  );
};

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
          <li>Ensure consistent formatting throughout</li>
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
  const isValid = pasteData.text.trim().length > 0;

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
          placeholder="e.g., Sonnet 18, Doctor Faustus Title Page..."
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
          placeholder="Paste your text here (one line per line of verse/prose)...&#10;&#10;Example:&#10;The Tragicall History of Doctor Faustus&#10;By Christopher Marlowe&#10;Printed in London, 1604"
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
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Pasted text is temporary. For permanent storage, upload a file or use corpus library.
          </p>
        </div>
      </div>

      <button
        onClick={onPasteSubmit}
        disabled={!isValid}
        className={`
          w-full px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
          ${isValid
            ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-[1.02]'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }
        `}
      >
        {isValid ? (
          <>
            Load Pasted Text
            <ChevronRight className="w-4 h-4" />
          </>
        ) : (
          'Enter text to continue'
        )}
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
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    )}
  </div>
);

const Breadcrumb = ({ onBackClick, currentAuthor }) => (
  <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
    <button
      onClick={onBackClick}
      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      All Authors
    </button>
    <ChevronRight className="w-4 h-4 text-gray-400" />
    <span className="text-gray-900 font-medium truncate">{currentAuthor}</span>
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
      w-full text-left transition-all group
      ${compact
        ? 'px-3 py-2.5 hover:bg-blue-50'
        : 'p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
      }
    `}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center`}>
          <FolderOpen className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {author.name}
          </h4>
          <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'} mt-0.5`}>
            {author.work_count} {author.work_count === 1 ? 'work' : 'works'}
          </p>
        </div>
      </div>
      <ChevronRight className={`text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
    </div>
  </button>
);

const WorkList = ({ works, onSelect, selectedId, isLoadingWork, compact = false, showAccessTime = false }) => (
  <div className={compact ? 'divide-y divide-gray-100' : 'space-y-2'}>
    {works.map(work => (
      <WorkCard
        key={work.id}
        work={work}
        onSelect={onSelect}
        isSelected={selectedId === work.id}
        isLoading={isLoadingWork}
        compact={compact}
        showAccessTime={showAccessTime}
      />
    ))}
  </div>
);

const WorkCard = ({ work, onSelect, isSelected, isLoading, compact, showAccessTime }) => {
  const [showEditions, setShowEditions] = useState(false);
  const [editions, setEditions] = useState([]);
  const [loadingEditions, setLoadingEditions] = useState(false);
  const { api, addNotification } = useAppState(); // FIXED: Added this line
  
  const accessTime = showAccessTime && work.accessed_at 
    ? formatRelativeTime(work.accessed_at)
    : null;

  // Load editions when expanding
  const handleToggleEditions = async (e) => {
    e.stopPropagation();
    
    if (!showEditions && editions.length === 0) {
      setLoadingEditions(true);
      try {
        // Call API to get all editions of this work
        const response = await api.getWorkEditions(work.author_folder, work.id);
        setEditions(response.editions || []);
      } catch (error) {
        console.error('Failed to load editions:', error);
        addNotification('error', 'Failed to load editions: ' + error.message);
        setEditions([]);
      } finally {
        setLoadingEditions(false);
      }
    }
    
    setShowEditions(!showEditions);
  };

  const hasMultipleEditions = work.edition_count && work.edition_count > 1;

  return (
    <div className={`
      ${compact ? '' : 'rounded-xl'}
      ${isSelected && !compact ? 'ring-2 ring-blue-200' : ''}
    `}>
      <button
        onClick={() => onSelect(work)}
        disabled={isLoading}
        className={`
          w-full text-left transition-all group
          ${isSelected
            ? compact
              ? 'bg-blue-50 border-l-4 border-blue-500'
              : 'border-2 border-blue-500 bg-blue-50 rounded-xl shadow-sm'
            : compact
              ? 'hover:bg-gray-50'
              : 'border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          ${compact ? 'px-3 py-2.5' : 'p-4'}
          ${showEditions && !compact ? 'rounded-b-none border-b-0' : ''}
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h4 className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'} ${!compact && 'line-clamp-2'}`}>
                {work.title}
              </h4>
              {work.has_segmentation && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                  ✓
                </span>
              )}
              {hasMultipleEditions && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {work.edition_count}
                </span>
              )}
            </div>
            <p className={`text-gray-600 mt-0.5 ${compact ? 'text-xs' : 'text-xs'}`}>
              {work.author} • {work.date}
            </p>
            <div className={`flex items-center gap-3 flex-wrap ${compact ? 'mt-1' : 'mt-2'}`}>
              <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
                {work.line_count?.toLocaleString() || '0'} lines
              </span>
              {accessTime && (
                <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-xs'}`}>
                  • {accessTime}
                </span>
              )}
              {hasMultipleEditions && (
                <button
                  onClick={handleToggleEditions}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                >
                  {showEditions ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Hide editions
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      View {work.edition_count} editions
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {isSelected && !isLoading && (
            <Check className={`text-blue-600 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          )}
          {isLoading && isSelected && (
            <Loader className={`animate-spin text-blue-600 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          )}
        </div>
      </button>

      {/* Editions Panel */}
      {showEditions && !compact && (
        <div className="border-2 border-t-0 border-blue-500 rounded-b-xl bg-gradient-to-b from-blue-50 to-white p-4">
          {loadingEditions ? (
            <div className="text-center py-4">
              <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading editions...</p>
            </div>
          ) : editions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">No additional editions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Available Editions ({editions.length})
                </h5>
              </div>
              
              {editions.map((edition, idx) => (
                <EditionCard
                  key={edition.id}
                  edition={edition}
                  index={idx}
                  totalEditions={editions.length}
                  onSelect={() => onSelect({ ...work, selectedEdition: edition })}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const EditionCard = ({ edition, index, totalEditions, onSelect, isLoading }) => {
  const editionColors = [
    { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', dot: 'bg-blue-500' },
    { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', dot: 'bg-purple-500' },
    { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-900', dot: 'bg-pink-500' },
    { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', dot: 'bg-amber-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', dot: 'bg-emerald-500' },
  ];
  
  const color = editionColors[index % editionColors.length];
  
  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={`
        w-full text-left p-3 rounded-lg border-2 transition-all
        ${color.bg} ${color.border} hover:shadow-md hover:scale-[1.02]
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Edition Number Badge */}
          <div className={`flex-shrink-0 w-8 h-8 ${color.dot} rounded-full flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{index + 1}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Date and Primary Badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold text-sm ${color.text}`}>
                {edition.date || `Edition ${index + 1}`}
              </span>
              {edition.isPrimary && (
                <span className="px-2 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold rounded">
                  PRIMARY
                </span>
              )}
              {edition.has_segmentation && (
                <span className="px-2 py-0.5 bg-green-100 border border-green-300 text-green-800 text-xs font-bold rounded">
                  ✓ SAVED
                </span>
              )}
            </div>
            
            {/* Edition Details */}
            <div className="space-y-1">
              {edition.estc_id && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{edition.estc_id}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{edition.line_count?.toLocaleString() || '0'} lines</span>
                </div>
                
                {edition.variance_from_primary !== undefined && (
                  <div className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    <span>{edition.variance_from_primary.toFixed(1)}% variance</span>
                  </div>
                )}
              </div>
              
              {/* Quality Indicators */}
              {edition.quality_score !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-white rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${color.dot}`}
                      style={{ width: `${edition.quality_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    {edition.quality_score}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Select Button */}
        <div className="flex-shrink-0">
          <div className={`
            px-3 py-1.5 rounded-lg font-semibold text-xs transition-all
            ${color.bg} border-2 ${color.border} ${color.text} hover:shadow-md
          `}>
            Select
          </div>
        </div>
      </div>
    </button>
  );
};

const LoadingState = ({ message, compact = false }) => (
  <div className={`text-center ${compact ? 'py-8' : 'py-16'}`}>
    <Loader className={`animate-spin text-blue-600 mx-auto ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
    <p className={`text-gray-500 mt-3 ${compact ? 'text-xs' : 'text-sm'} font-medium`}>{message}</p>
  </div>
);

const EmptyState = ({ message, icon }) => (
  <div className="text-center py-12">
    <div className="flex justify-center mb-4">
      {icon}
    </div>
    <p className="text-sm text-gray-500 font-medium">{message}</p>
  </div>
);

// ============================================================================
// UTILITIES
// ============================================================================
const useFilteredSources = (authors, works, query, filterOptions) => {
  return useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    
    let filteredAuthors = authors || [];
    let filteredWorks = works || [];

    // Apply search query
    if (normalizedQuery) {
      filteredAuthors = filteredAuthors.filter(author =>
        author.name.toLowerCase().includes(normalizedQuery)
      );
      
      filteredWorks = filteredWorks.filter(work =>
        work.title.toLowerCase().includes(normalizedQuery) ||
        work.author.toLowerCase().includes(normalizedQuery) ||
        work.date.includes(normalizedQuery)
      );
    }

    // Apply filters to works
    if (filterOptions) {
      // Date range filter
      if (filterOptions.dateRange !== 'all') {
        const century = filterOptions.dateRange;
        const startYear = parseInt(century.substring(0, 4));
        const endYear = startYear + 99;
        
        filteredWorks = filteredWorks.filter(work => {
          const workYear = parseInt(work.date);
          return !isNaN(workYear) && workYear >= startYear && workYear <= endYear;
        });
      }

      // Segmentation filter
      if (filterOptions.hasSegmentation === 'yes') {
        filteredWorks = filteredWorks.filter(work => work.has_segmentation);
      } else if (filterOptions.hasSegmentation === 'no') {
        filteredWorks = filteredWorks.filter(work => !work.has_segmentation);
      }

      // Minimum lines filter
      if (filterOptions.minLines > 0) {
        filteredWorks = filteredWorks.filter(work => 
          (work.line_count || 0) >= filterOptions.minLines
        );
      }
    }

    return {
      filteredAuthors,
      filteredWorks
    };
  }, [authors, works, query, filterOptions]);
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

const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
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