import React, { useState, useMemo } from 'react';
import { useAppState, ACTIONS } from '../context/AppContext';
import ResultCard from './ResultCard';
import { 
  Search, 
  Filter, 
  Download, 
  X, 
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Sparkles,
  BookOpen,
  Calendar,
  GitCompare,
  List
} from 'lucide-react';

const ResultsView = () => {
  const { state, dispatch, exportResults } = useAppState();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedWork, setSelectedWork] = useState('all');
  const [selectedEditionDate, setSelectedEditionDate] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  console.log('📊 ResultsView - Raw state:', state.results);

  // Get the actual results data
const resultsData = useMemo(() => {
  console.log('📊 Raw state.results:', state.results);
  
  // Check if we have patterns array
  if (state.results?.patterns && Array.isArray(state.results.patterns)) {
    console.log('✅ Found patterns array:', state.results.patterns.length);
    return state.results.patterns;
  }
  
  console.log('❌ No patterns found');
  return null;
}, [state.results]);

  console.log('📦 ResultsData:', resultsData);

  // Detect if multi-edition
const isMultiEdition = useMemo(() => {
  if (!resultsData || !Array.isArray(resultsData)) return false;
  
  // Check if any pattern has edition metadata
  const hasEditionData = resultsData.some(pattern => 
    pattern.metadata?.edition_id || pattern.metadata?.edition_date
  );
  
  console.log('🔍 Is multi-edition?', hasEditionData);
  return hasEditionData;
}, [resultsData]);

  // Build works structure from results
const worksByAuthor = useMemo(() => {
  if (!resultsData || !Array.isArray(resultsData)) {
    console.log('⚠️ No results data or not an array');
    return {};
  }

  const grouped = {};

  resultsData.forEach(pattern => {
    const author = pattern.metadata?.author || 'Unknown Author';
    const workTitle = pattern.metadata?.work_title || 'Unknown Work';
    const editionId = pattern.metadata?.edition_id || 'single';
    const editionDate = pattern.metadata?.edition_date || null;

    // Initialize author
    if (!grouped[author]) {
      grouped[author] = {};
    }

    // Initialize work
    if (!grouped[author][workTitle]) {
      grouped[author][workTitle] = {
        work: workTitle,
        author: author,
        editions: {}
      };
    }

    // Initialize edition
    if (!grouped[author][workTitle].editions[editionId]) {
      grouped[author][workTitle].editions[editionId] = {
        edition_id: editionId,
        date: editionDate,
        segments: []
      };
    }

    // Add pattern as a segment
    // Add pattern as a segment - INCLUDE ALL CANDIDATES
grouped[author][workTitle].editions[editionId].segments.push({
  segment_id: pattern.segment_id,
  segment_info: pattern.segment_info,
  section_name: pattern.section_name,           // ✅ ADD: preserve section name
  candidates: pattern.candidates || [],         // ✅ ADD: all candidates (10)
  best_candidate: pattern.best_candidate,       // ✅ KEEP: top result
  credible_candidates: pattern.credible_candidates, // ✅ KEEP: high conf
  decode_results: pattern.decode_results || {   // ✅ ADD: full decode_results
    final_ranking: pattern.candidates || [],    // ✅ USE: all candidates
    segment: pattern.original_text,
    method_results: pattern.decode_results?.method_results || {}
  }
});
  });

  console.log('✅ Grouped worksByAuthor:', grouped);
  return grouped;
}, [resultsData]);

  console.log('📋 Final worksByAuthor:', worksByAuthor);

  // Get unique authors for filter
  const authors = useMemo(() => {
    const authorList = Object.keys(worksByAuthor);
    console.log('👥 Authors:', authorList);
    return ['all', ...authorList];
  }, [worksByAuthor]);

  // Get works for selected author
  const works = useMemo(() => {
    if (selectedAuthor === 'all') {
      const allWorks = new Set();
      Object.values(worksByAuthor).forEach(authorWorks => {
        Object.keys(authorWorks).forEach(work => allWorks.add(work));
      });
      return ['all', ...Array.from(allWorks)];
    }
    
    const authorWorks = worksByAuthor[selectedAuthor] || {};
    return ['all', ...Object.keys(authorWorks)];
  }, [worksByAuthor, selectedAuthor]);

  // Get edition dates
  const editionDates = useMemo(() => {
    const dates = new Set();
    
    Object.values(worksByAuthor).forEach(authorWorks => {
      Object.values(authorWorks).forEach(work => {
        Object.values(work.editions).forEach(edition => {
          if (edition.date) dates.add(edition.date);
        });
      });
    });
    
    return ['all', ...Array.from(dates).sort()];
  }, [worksByAuthor]);

  // Apply filters
  const filteredWorks = useMemo(() => {
    let filtered = JSON.parse(JSON.stringify(worksByAuthor));
    
    console.log('🔍 Applying filters...');
    console.log('  Author:', selectedAuthor);
    console.log('  Work:', selectedWork);
    console.log('  Date:', selectedEditionDate);
    console.log('  MinScore:', minScore);
    console.log('  Search:', searchQuery);

    // Filter by author
    if (selectedAuthor !== 'all') {
      filtered = { [selectedAuthor]: filtered[selectedAuthor] || {} };
    }
    
    // Filter by work
    if (selectedWork !== 'all') {
      Object.keys(filtered).forEach(author => {
        filtered[author] = Object.fromEntries(
          Object.entries(filtered[author]).filter(([work]) => work === selectedWork)
        );
      });
    }
    
    // Filter by edition date
    if (selectedEditionDate !== 'all') {
      Object.keys(filtered).forEach(author => {
        Object.keys(filtered[author]).forEach(work => {
          const workData = filtered[author][work];
          workData.editions = Object.fromEntries(
            Object.entries(workData.editions).filter(([_, edition]) => 
              edition.date === selectedEditionDate
            )
          );
        });
      });
    }
    
    // Filter by search query and confidence score
    if (searchQuery || minScore > 0) {
      const query = searchQuery.toLowerCase();
      
      Object.keys(filtered).forEach(author => {
        Object.keys(filtered[author]).forEach(work => {
          const workData = filtered[author][work];
          
          Object.keys(workData.editions).forEach(editionId => {
            const edition = workData.editions[editionId];
            
            if (!edition.segments || edition.segments.length === 0) {
              return;
            }

            edition.segments = edition.segments.filter(segment => {
              const finalRanking = segment.decode_results?.final_ranking || [];
              
              // Check confidence threshold
              if (minScore > 0) {
                const maxConfidence = Math.max(0, ...finalRanking.map(r => r.confidence || 0));
                if (maxConfidence < (minScore * 10)) {
                  return false;
                }
              }
              
              // Check search query
              if (query) {
                const matchesQuery = finalRanking.some(result => {
                  // Check decoded message
                  if (result.decoded_message?.toLowerCase().includes(query)) {
                    return true;
                  }
                  
                  // Check entities
                  if (result.entities && Array.isArray(result.entities)) {
                    return result.entities.some(entity => {
                      const entityName = typeof entity === 'string' 
                        ? entity 
                        : entity.entity || entity.name || '';
                      return entityName.toLowerCase().includes(query);
                    });
                  }
                  
                  return false;
                });
                
                if (!matchesQuery) {
                  return false;
                }
              }
              
              return true;
            });
          });
        });
      });
    }
    
    // Remove empty editions and works
    Object.keys(filtered).forEach(author => {
      Object.keys(filtered[author]).forEach(work => {
        const workData = filtered[author][work];
        workData.editions = Object.fromEntries(
          Object.entries(workData.editions).filter(([_, edition]) => 
            edition.segments && edition.segments.length > 0
          )
        );
        
        if (Object.keys(workData.editions).length === 0) {
          delete filtered[author][work];
        }
      });
      
      if (Object.keys(filtered[author]).length === 0) {
        delete filtered[author];
      }
    });
    
    console.log('✅ Filtered works:', filtered);
    return filtered;
  }, [worksByAuthor, selectedAuthor, selectedWork, selectedEditionDate, searchQuery, minScore]);

  // Calculate stats
  const stats = useMemo(() => {
  let workCount = 0;
  let editionCount = 0;
  let segmentCount = 0;
  let totalDecodingsCount = 0;  // ✅ NEW: Total decodings
  let highScoreCount = 0;
  
  Object.values(filteredWorks).forEach(authorWorks => {
    Object.values(authorWorks).forEach(work => {
      workCount++;
      editionCount += Object.keys(work.editions).length;
      
      Object.values(work.editions).forEach(edition => {
        if (!edition.segments) return;
        
        segmentCount += edition.segments.length;
        
        edition.segments.forEach(segment => {
          const finalRanking = segment.decode_results?.final_ranking || [];
          
          // ✅ Count ALL decodings
          totalDecodingsCount += finalRanking.length;
          
          // ✅ Count high confidence decodings (not segments)
          const highConfDecodings = finalRanking.filter(d => (d.confidence || 0) >= 70);
          highScoreCount += highConfDecodings.length;
        });
      });
    });
  });
  
  console.log('📊 Stats:', { 
    workCount, 
    editionCount, 
    segmentCount, 
    totalDecodingsCount,  // ✅ NEW
    highScoreCount 
  });
  
  return { 
    workCount, 
    editionCount, 
    segmentCount, 
    totalDecodingsCount,  // ✅ NEW
    highScoreCount 
  };
}, [filteredWorks]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAuthor('all');
    setSelectedWork('all');
    setSelectedEditionDate('all');
    setMinScore(0);
  };

  const hasActiveFilters = searchQuery || 
                          selectedAuthor !== 'all' || 
                          selectedWork !== 'all' ||
                          selectedEditionDate !== 'all' ||
                          minScore > 0;

  // Check if we have any results
  if (!resultsData) {
    return <EmptyState />;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-2xl">
      <div className="space-y-6">
        {/* Header */}
        <Header 
          stats={stats}
          exportResults={exportResults}
          isMultiEdition={isMultiEdition}
        />

        {/* Multi-Edition Notice */}
        {isMultiEdition && stats.editionCount > 1 && (
          <MultiEditionNotice editionCount={stats.editionCount} />
        )}

        {/* Search & Filters */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {showFilters && (
          <FilterPanel
            authors={authors}
            works={works}
            editionDates={editionDates}
            selectedAuthor={selectedAuthor}
            setSelectedAuthor={setSelectedAuthor}
            selectedWork={selectedWork}
            setSelectedWork={setSelectedWork}
            selectedEditionDate={selectedEditionDate}
            setSelectedEditionDate={setSelectedEditionDate}
            minScore={minScore}
            setMinScore={setMinScore}
            isMultiEdition={isMultiEdition}
          />
        )}

        {/* Results */}
        {stats.segmentCount === 0 ? (
          <NoResultsFound onClear={handleClearFilters} />
        ) : (
          <ResultsList works={filteredWorks} />
        )}
      </div>
    </div>
  );
};

// Helper function
const extractDateFromId = (editionId) => {
  if (!editionId) return null;
  const match = editionId.match(/(\d{4})/);
  return match ? match[1] : null;
};

const Header = ({ stats, exportResults, isMultiEdition }) => {
  const { state, uploadResultToDrive } = useAppState();
  const [exportFormat, setExportFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await exportResults(exportFormat);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleDriveUpload = async () => {
    const resultId = state.results.lastJobId;
    
    if (!resultId) {
      alert('No result to upload. Please run an analysis first.');
      return;
    }
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      console.log('📤 Uploading result to Drive:', resultId);
      
      const result = await uploadResultToDrive(resultId);
      
      if (result?.status === 'uploaded') {
        setUploadStatus({
          type: 'success',
          message: 'Uploaded to Drive!',
          link: result.drive_upload?.view_link
        });
      } else if (result?.status === 'already_uploaded') {
        setUploadStatus({
          type: 'info',
          message: 'Already in Drive',
          link: result.drive_upload?.view_link
        });
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Upload failed (saved locally)'
        });
      }
      
      setTimeout(() => setUploadStatus(null), 5000);
      
    } catch (error) {
      console.error('Drive upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Upload failed'
      });
      
      setTimeout(() => setUploadStatus(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          {isMultiEdition && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold flex items-center gap-1">
              <GitCompare className="w-4 h-4" />
              Multi-Edition
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <StatBadge
            icon={FileText}
            label="Works"
            value={stats.workCount}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          
          {isMultiEdition && (
            <StatBadge
              icon={BookOpen}
              label="Editions"
              value={stats.editionCount}
              color="text-purple-600"
              bg="bg-purple-50"
            />
          )}
          
          <StatBadge
            icon={TrendingUp}
            label="Segments"
            value={stats.segmentCount}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          
          <StatBadge
            icon={List}
            label="Total Decodings"
            value={stats.totalDecodingsCount}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          
          <StatBadge
            icon={CheckCircle2}
            label="High Confidence"
            value={stats.highScoreCount}
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleDriveUpload}
            disabled={isUploading || !state.results.lastJobId}
            className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
              isUploading
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:from-green-700 hover:to-emerald-700'
            } ${!state.results.lastJobId ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!state.results.lastJobId ? 'No results to upload' : 'Upload to Google Drive'}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload to Drive
              </>
            )}
          </button>
          
          {uploadStatus && (
            <div className={`text-xs font-medium flex items-center gap-1 ${
              uploadStatus.type === 'success' ? 'text-green-600' :
              uploadStatus.type === 'info' ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {uploadStatus.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
              {uploadStatus.type === 'info' && <AlertCircle className="w-3 h-3" />}
              {uploadStatus.type === 'error' && <X className="w-3 h-3" />}
              <span>{uploadStatus.message}</span>
              {uploadStatus.link && (
                <a
                  href={uploadStatus.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline ml-1"
                >
                  View
                </a>
              )}
            </div>
          )}
        </div>

        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isExporting}
        >
          <option value="excel">Excel (.xlsx)</option>
          <option value="json">JSON (.json)</option>
        </select>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 ${
            isExporting
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          }`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Results
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color, bg }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${bg} rounded-lg`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
};

// ============================================================================
// MULTI-EDITION NOTICE
// ============================================================================

const MultiEditionNotice = ({ editionCount }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <GitCompare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Multi-Edition Analysis</h3>
          <p className="text-sm text-gray-600">
            Analyzing {editionCount} edition{editionCount !== 1 ? 's' : ''} across different time periods
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FILTER COMPONENTS
// ============================================================================

const FilterBar = ({ 
  searchQuery, 
  setSearchQuery, 
  showFilters, 
  setShowFilters,
  hasActiveFilters,
  onClearFilters 
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decoded text or entities..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const FilterPanel = ({
  authors,
  works,
  editionDates,
  selectedAuthor,
  setSelectedAuthor,
  selectedWork,
  setSelectedWork,
  selectedEditionDate,
  setSelectedEditionDate,
  minScore,
  setMinScore,
  isMultiEdition
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
      <div className={`grid grid-cols-1 gap-6 ${isMultiEdition ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Author
          </label>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {authors.map(author => (
              <option key={author} value={author}>
                {author === 'all' ? 'All Authors' : author}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Work
          </label>
          <select
            value={selectedWork}
            onChange={(e) => setSelectedWork(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={selectedAuthor === 'all'}
          >
            {works.map(work => (
              <option key={work} value={work}>
                {work === 'all' ? 'All Works' : work}
              </option>
            ))}
          </select>
        </div>

        {isMultiEdition && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Edition Date
            </label>
            <select
              value={selectedEditionDate}
              onChange={(e) => setSelectedEditionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {editionDates.map(date => (
                <option key={date} value={date}>
                  {date === 'all' ? 'All Editions' : date}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Min Confidence: {minScore * 10}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RESULTS LIST
// ============================================================================

const ResultsList = ({ works }) => {
  console.log('📜 ResultsList rendering with works:', works);
  
  return (
    <div className="space-y-8">
      {Object.entries(works).map(([author, authorWorks]) => (
        <div key={author}>
          {console.log(authorWorks)}
          {Object.entries(authorWorks).map(([workTitle, workData]) => (
            <ResultCard key={`${author}-${workTitle}`} work={workData} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// EMPTY STATE & NO RESULTS
// ============================================================================

const EmptyState = () => {
  const { dispatch } = useAppState();
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Results Yet</h2>
        <p className="text-gray-600 mb-6">
          Run an analysis on a text to see decoded patterns here.
        </p>
        <button
          onClick={() => dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' })}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold inline-flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Start New Analysis
        </button>
      </div>
    </div>
  );
};

const NoResultsFound = ({ onClear }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Matches Found</h3>
      <p className="text-gray-600 mb-6">
        Try adjusting your filters or search query
      </p>
      <button
        onClick={onClear}
        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default ResultsView;