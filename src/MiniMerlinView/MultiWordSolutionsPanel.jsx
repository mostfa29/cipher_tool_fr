// components/MiniMerlin/MultiWordSolutionsPanel.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { TrendingUp, Copy, Check, AlertCircle, Sparkles } from 'lucide-react';

/**
 * Multi-word combination finder
 * Finds combinations that use maximum letters with minimal spoilage
 * Sorted by: 0% spoilage first, then ascending spoilage
 * Words within solution sorted by length (longest first)
 */
const MultiWordSolutionsPanel = ({ 
  sessionId,
  currentPool,
  onGenerateSolutions,
  solutions,
  isLoading 
}) => {
  const [maxWords, setMaxWords] = useState(5);
  const [maxResults, setMaxResults] = useState(30);
  const [copiedSolution, setCopiedSolution] = useState(null);

  // Sort solutions by spoilage (0% first, then ascending)
  const sortedSolutions = useMemo(() => {
    if (!solutions?.solutions) return [];

    return [...solutions.solutions].sort((a, b) => {
      // Primary sort: spoilage (ascending - 0% first)
      if (a.spoilage !== b.spoilage) {
        return a.spoilage - b.spoilage;
      }
      
      // Secondary sort: word count (fewer words preferred)
      if (a.word_count !== b.word_count) {
        return a.word_count - b.word_count;
      }
      
      // Tertiary sort: total score (higher better)
      return (b.total_score || 0) - (a.total_score || 0);
    });
  }, [solutions]);

  // Group by spoilage level
  const groupedBySpoilage = useMemo(() => {
    const groups = {
      perfect: [], // 0% spoilage
      minimal: [], // 1-5% spoilage
      low: [],     // 6-15% spoilage
      medium: [],  // 16-30% spoilage
      high: []     // 31%+ spoilage
    };

    sortedSolutions.forEach(sol => {
      if (sol.spoilage === 0) {
        groups.perfect.push(sol);
      } else if (sol.spoilage <= 5) {
        groups.minimal.push(sol);
      } else if (sol.spoilage <= 15) {
        groups.low.push(sol);
      } else if (sol.spoilage <= 30) {
        groups.medium.push(sol);
      } else {
        groups.high.push(sol);
      }
    });

    return groups;
  }, [sortedSolutions]);

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!sessionId || !currentPool) return;
    onGenerateSolutions(sessionId, maxWords, maxResults);
  }, [sessionId, currentPool, maxWords, maxResults, onGenerateSolutions]);

  // Handle copy solution
  const handleCopy = useCallback(async (solution) => {
    try {
      const text = solution.words.join(' ');
      await navigator.clipboard.writeText(text);
      setCopiedSolution(text);
      setTimeout(() => setCopiedSolution(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  // Render solution card
  const renderSolution = (solution, index) => {
    const solutionText = solution.words.join(' ');
    const isCopied = copiedSolution === solutionText;
    
    // Determine spoilage color
    let spoilageColor = 'gray';
    if (solution.spoilage === 0) spoilageColor = 'green';
    else if (solution.spoilage <= 5) spoilageColor = 'blue';
    else if (solution.spoilage <= 15) spoilageColor = 'yellow';
    else if (solution.spoilage <= 30) spoilageColor = 'orange';
    else spoilageColor = 'red';

    return (
      <div
        key={`${solutionText}-${index}`}
        className={`
          group p-4 border-2 rounded-lg transition-all
          ${solution.spoilage === 0
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:border-green-400'
            : 'bg-white hover:bg-purple-50 border-gray-200 hover:border-purple-300'
          }
        `}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            {/* Words (sorted by length, longest first) */}
            <div className="font-mono text-base font-bold text-gray-900 mb-2 leading-relaxed">
              {[...solution.words]
                .sort((a, b) => b.length - a.length)
                .join(' ')}
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-gray-600">
                <span className="font-semibold">{solution.word_count}</span> words
              </span>
              
              <span className="text-gray-400">•</span>
              
              <span className={`font-semibold text-${spoilageColor}-700`}>
                {solution.spoilage}% spoilage
              </span>
              
              {solution.spoilage === 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Perfect match!
                  </span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleCopy(solution)}
            className="flex-shrink-0 p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
            title="Copy solution"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Spoilage letters if any */}
        {solution.spoilage_letters && solution.spoilage_letters.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-600">Unused: </span>
            <span className="text-xs font-mono font-semibold text-gray-700">
              {solution.spoilage_letters.join('')}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Multi-Word Solutions
        </h3>
        
        {solutions && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            {sortedSolutions.length} solutions
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Words
            </label>
            <input
              type="number"
              value={maxWords}
              onChange={(e) => setMaxWords(Math.max(2, Math.min(10, parseInt(e.target.value) || 5)))}
              min="2"
              max="10"
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
              onChange={(e) => setMaxResults(Math.max(10, Math.min(100, parseInt(e.target.value) || 30)))}
              min="10"
              max="100"
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
              Finding Solutions...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Find Solutions
            </>
          )}
        </button>
      </div>

      {!currentPool && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Load source text first to generate solutions
          </p>
        </div>
      )}

      {solutions && (
        <div className="space-y-4 max-h-[700px] overflow-y-auto">
          {/* Perfect matches (0% spoilage) */}
          {groupedBySpoilage.perfect.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-bold text-green-700">
                  Perfect Matches ({groupedBySpoilage.perfect.length})
                </h4>
              </div>
              <div className="space-y-2">
                {groupedBySpoilage.perfect.map((sol, idx) => renderSolution(sol, idx))}
              </div>
            </div>
          )}

          {/* Minimal spoilage (1-5%) */}
          {groupedBySpoilage.minimal.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-blue-700 mb-3">
                Minimal Spoilage 1-5% ({groupedBySpoilage.minimal.length})
              </h4>
              <div className="space-y-2">
                {groupedBySpoilage.minimal.map((sol, idx) => renderSolution(sol, idx))}
              </div>
            </div>
          )}

          {/* Low spoilage (6-15%) */}
          {groupedBySpoilage.low.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-yellow-700 mb-3">
                Low Spoilage 6-15% ({groupedBySpoilage.low.length})
              </h4>
              <div className="space-y-2">
                {groupedBySpoilage.low.map((sol, idx) => renderSolution(sol, idx))}
              </div>
            </div>
          )}

          {/* Medium spoilage (16-30%) */}
          {groupedBySpoilage.medium.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-orange-700 mb-3">
                Medium Spoilage 16-30% ({groupedBySpoilage.medium.length})
              </h4>
              <div className="space-y-2">
                {groupedBySpoilage.medium.map((sol, idx) => renderSolution(sol, idx))}
              </div>
            </div>
          )}

          {/* High spoilage (31%+) */}
          {groupedBySpoilage.high.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-red-700 mb-3">
                High Spoilage 31%+ ({groupedBySpoilage.high.length})
              </h4>
              <div className="space-y-2">
                {groupedBySpoilage.high.map((sol, idx) => renderSolution(sol, idx))}
              </div>
            </div>
          )}

          {sortedSolutions.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No solutions found</p>
            </div>
          )}
        </div>
      )}

      {!solutions && currentPool && (
        <div className="py-8 text-center text-gray-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Click "Find Solutions" to see multi-word combinations</p>
        </div>
      )}
    </div>
  );
};

export default MultiWordSolutionsPanel;