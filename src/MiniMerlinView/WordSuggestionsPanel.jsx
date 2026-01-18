// components/MiniMerlin/WordSuggestionsPanel.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Copy, Check, Filter, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Dictionary-based word finder
 * Shows all valid words from current pool
 * NO AI - pure dictionary lookup
 */
const WordSuggestionsPanel = ({ 
  sessionId, 
  currentPool,
  onGenerateSuggestions,
  suggestions,
  isLoading 
}) => {
  const [minLength, setMinLength] = useState(3);
  const [maxResults, setMaxResults] = useState(50);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('length'); // 'length' | 'alpha' | 'score'
  const [copiedWord, setCopiedWord] = useState(null);

  // Filter and sort suggestions
  const filteredSuggestions = useMemo(() => {
    if (!suggestions?.suggestions) return [];

    let filtered = suggestions.suggestions;

    // Apply search filter
    if (searchFilter) {
      const lower = searchFilter.toLowerCase();
      filtered = filtered.filter(s => 
        s.word.toLowerCase().includes(lower)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'length':
          // Longest words first (most letters used)
          if (b.word.length !== a.word.length) {
            return b.word.length - a.word.length;
          }
          return a.word.localeCompare(b.word);
        
        case 'alpha':
          return a.word.localeCompare(b.word);
        
        case 'score':
          // Higher scores first (word frequency/relevance)
          return (b.score || 0) - (a.score || 0);
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [suggestions, searchFilter, sortBy]);

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!sessionId || !currentPool) return;
    onGenerateSuggestions(sessionId, minLength, maxResults);
  }, [sessionId, currentPool, minLength, maxResults, onGenerateSuggestions]);

  // Handle copy word to scratch pad
  const handleCopy = useCallback(async (word) => {
    try {
      await navigator.clipboard.writeText(word);
      setCopiedWord(word);
      setTimeout(() => setCopiedWord(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  // Group by length for better visualization
  const groupedByLength = useMemo(() => {
    const groups = {};
    filteredSuggestions.forEach(sug => {
      const len = sug.word.length;
      if (!groups[len]) groups[len] = [];
      groups[len].push(sug);
    });
    return groups;
  }, [filteredSuggestions]);

  const lengthGroups = Object.keys(groupedByLength)
    .map(Number)
    .sort((a, b) => b - a); // Longest first

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-600" />
          Word Suggestions
        </h3>
        
        {suggestions && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            {filteredSuggestions.length} words
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Min Length
            </label>
            <input
              type="number"
              value={minLength}
              onChange={(e) => setMinLength(Math.max(2, parseInt(e.target.value) || 2))}
              min="2"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Results
            </label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(Math.max(10, parseInt(e.target.value) || 50))}
              min="10"
              max="500"
              step="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!sessionId || !currentPool || isLoading}
          className={`
            w-full px-4 py-3 rounded-lg font-semibold text-white transition-all
            flex items-center justify-center gap-2
            ${!sessionId || !currentPool || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Find Words
            </>
          )}
        </button>
      </div>

      {!currentPool && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Load source text first to generate word suggestions
          </p>
        </div>
      )}

      {suggestions && (
        <>
          {/* Search & Sort */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter words..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Sort by:</span>
              
              <button
                onClick={() => setSortBy('length')}
                className={`
                  flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-all
                  ${sortBy === 'length'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Length
              </button>
              
              <button
                onClick={() => setSortBy('alpha')}
                className={`
                  flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-all
                  ${sortBy === 'alpha'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                A-Z
              </button>
              
              <button
                onClick={() => setSortBy('score')}
                className={`
                  flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-all
                  ${sortBy === 'score'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Frequency
              </button>
            </div>
          </div>

          {/* Results - Grouped by Length */}
          {filteredSuggestions.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {lengthGroups.map(length => (
                <div key={length}>
                  <div className="sticky top-0 bg-white pb-2 mb-2 border-b border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700">
                      {length}-letter words ({groupedByLength[length].length})
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {groupedByLength[length].map((sug, idx) => (
                      <div
                        key={`${sug.word}-${idx}`}
                        className="group flex items-center justify-between p-2 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded transition-all"
                      >
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {sug.word}
                        </span>
                        
                        <button
                          onClick={() => handleCopy(sug.word)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-purple-600 transition-all"
                          title="Copy word"
                        >
                          {copiedWord === sug.word ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {searchFilter ? 'No matching words found' : 'No words found in current pool'}
              </p>
            </div>
          )}
        </>
      )}

      {!suggestions && currentPool && (
        <div className="py-8 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Click "Find Words" to see suggestions</p>
        </div>
      )}
    </div>
  );
};

export default WordSuggestionsPanel;