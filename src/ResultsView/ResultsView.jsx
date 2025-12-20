// src/ResultsView/ResultsView.jsx - CLEAN REDESIGN

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
  Sparkles
} from 'lucide-react';

const ResultsView = () => {
  const { state, dispatch, exportResults } = useAppState();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedWork, setSelectedWork] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Get all patterns
  const allPatterns = state.results.patterns || [];
  
  // Group patterns by work
  const patternsByWork = useMemo(() => {
    const grouped = {};
    
    allPatterns.forEach(pattern => {
      const author = pattern.metadata?.author || 'Unknown Author';
      const work = pattern.metadata?.work_title || 'Unknown Work';
      const key = `${author}|||${work}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          author,
          work,
          patterns: []
        };
      }
      
      grouped[key].patterns.push(pattern);
    });
    
    return grouped;
  }, [allPatterns]);

  // Get unique authors and works for filters
  const authors = useMemo(() => {
    const unique = new Set(allPatterns.map(p => p.metadata?.author).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [allPatterns]);

  const works = useMemo(() => {
    if (selectedAuthor === 'all') {
      const unique = new Set(allPatterns.map(p => p.metadata?.work_title).filter(Boolean));
      return ['all', ...Array.from(unique)];
    }
    
    const unique = new Set(
      allPatterns
        .filter(p => p.metadata?.author === selectedAuthor)
        .map(p => p.metadata?.work_title)
        .filter(Boolean)
    );
    return ['all', ...Array.from(unique)];
  }, [allPatterns, selectedAuthor]);

  // Apply filters
  const filteredWorks = useMemo(() => {
    let filtered = { ...patternsByWork };
    
    // Filter by author
    if (selectedAuthor !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, data]) => data.author === selectedAuthor)
      );
    }
    
    // Filter by work
    if (selectedWork !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, data]) => data.work === selectedWork)
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = Object.fromEntries(
        Object.entries(filtered).map(([key, data]) => {
          const matchingPatterns = data.patterns.filter(pattern => {
            const candidates = pattern.decoding_results?.top_decodings || [];
            return candidates.some(c => 
              (c.decoded_preview || '').toLowerCase().includes(query)
            );
          });
          return [key, { ...data, patterns: matchingPatterns }];
        }).filter(([key, data]) => data.patterns.length > 0)
      );
    }
    
    // Filter by score
    if (minScore > 0) {
      filtered = Object.fromEntries(
        Object.entries(filtered).map(([key, data]) => {
          const matchingPatterns = data.patterns.filter(pattern => 
            (pattern.anomaly_detection?.anomaly_score || 0) >= minScore
          );
          return [key, { ...data, patterns: matchingPatterns }];
        }).filter(([key, data]) => data.patterns.length > 0)
      );
    }
    
    return filtered;
  }, [patternsByWork, selectedAuthor, selectedWork, searchQuery, minScore]);

  // Stats
  const stats = useMemo(() => {
    const workCount = Object.keys(filteredWorks).length;
    const segmentCount = Object.values(filteredWorks).reduce(
      (sum, work) => sum + work.patterns.length, 
      0
    );
    const highScoreCount = Object.values(filteredWorks).reduce(
      (sum, work) => sum + work.patterns.filter(
        p => (p.anomaly_detection?.anomaly_score || 0) >= 7
      ).length,
      0
    );
    
    return { workCount, segmentCount, highScoreCount };
  }, [filteredWorks]);

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAuthor('all');
    setSelectedWork('all');
    setMinScore(0);
  };

  const hasActiveFilters = searchQuery || 
                          selectedAuthor !== 'all' || 
                          selectedWork !== 'all' || 
                          minScore > 0;

  if (allPatterns.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header 
        stats={stats}
        totalSegments={allPatterns.length}
        onExport={exportResults}
      />

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
          selectedAuthor={selectedAuthor}
          setSelectedAuthor={setSelectedAuthor}
          selectedWork={selectedWork}
          setSelectedWork={setSelectedWork}
          minScore={minScore}
          setMinScore={setMinScore}
        />
      )}

      {/* Results */}
      {stats.segmentCount === 0 ? (
        <NoResultsFound onClear={handleClearFilters} />
      ) : (
        <ResultsList works={filteredWorks} />
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header = ({ stats, totalSegments, onExport }) => {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
        <div className="flex items-center gap-6 text-sm">
          <StatBadge
            icon={FileText}
            label="Works"
            value={stats.workCount}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatBadge
            icon={TrendingUp}
            label="Segments"
            value={stats.segmentCount}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <StatBadge
            icon={CheckCircle2}
            label="High Score"
            value={stats.highScoreCount}
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>
      </div>

      <button
        onClick={() => onExport('json')}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export Results
      </button>
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
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decoded text..."
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

        {/* Filter Toggle */}
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

        {/* Clear Filters */}
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
  selectedAuthor,
  setSelectedAuthor,
  selectedWork,
  setSelectedWork,
  minScore,
  setMinScore
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Author Filter */}
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

        {/* Work Filter */}
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

        {/* Score Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Min Anomaly Score: {minScore}
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
            <span>0 (All)</span>
            <span>10 (Highest)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsList = ({ works }) => {
  return (
    <div className="space-y-8">
      {Object.entries(works).map(([key, data]) => (
        <WorkSection
          key={key}
          author={data.author}
          work={data.work}
          patterns={data.patterns}
        />
      ))}
    </div>
  );
};

const WorkSection = ({ author, work, patterns }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const highScoreCount = patterns.filter(
    p => (p.anomaly_detection?.anomaly_score || 0) >= 7
  ).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Work Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors flex items-center justify-between"
      >
        <div className="text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{work}</h2>
          <p className="text-sm text-gray-600">
            by {author} • {patterns.length} segment{patterns.length !== 1 ? 's' : ''}
            {highScoreCount > 0 && (
              <span className="ml-2 text-green-600 font-semibold">
                • {highScoreCount} high score
              </span>
            )}
          </p>
        </div>
        
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isCollapsed ? '-rotate-90' : ''
          }`}
        />
      </button>

      {/* Segments */}
      {!isCollapsed && (
        <div className="p-6 space-y-6 bg-gray-50">
          {patterns.map((pattern, idx) => (
            <ResultCard key={pattern.id || idx} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyState = () => {
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
          onClick={() => window.location.href = '#workspace'}
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