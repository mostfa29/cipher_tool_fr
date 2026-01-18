// components/MiniMerlin/LetterPoolManager.jsx

import React, { useMemo } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

/**
 * Manages the letter pool display with fungible letter tracking
 * Shows original pool, used letters, and remaining letters
 */
const LetterPoolManager = ({ originalPool, usedLetters, spoilage }) => {
  // Count letter frequencies in original pool
  const poolCounts = useMemo(() => {
    const counts = {};
    for (const char of originalPool.toUpperCase()) {
      if (/[A-Z]/.test(char)) {
        counts[char] = (counts[char] || 0) + 1;
      }
    }
    return counts;
  }, [originalPool]);

  // Count letters used in scratch pad
  const usedCounts = useMemo(() => {
    const counts = {};
    for (const char of usedLetters.toUpperCase()) {
      if (/[A-Z]/.test(char)) {
        counts[char] = (counts[char] || 0) + 1;
      }
    }
    return counts;
  }, [usedLetters]);

  // Calculate remaining letters for current pool
  const remainingCounts = useMemo(() => {
    const remaining = { ...poolCounts };
    for (const [letter, count] of Object.entries(usedCounts)) {
      remaining[letter] = (remaining[letter] || 0) - count;
    }
    return remaining;
  }, [poolCounts, usedCounts]);

  // Get current pool as string (sorted alphabetically)
  const currentPool = useMemo(() => {
    const letters = [];
    for (const [letter, count] of Object.entries(remainingCounts)) {
      for (let i = 0; i < count; i++) {
        letters.push(letter);
      }
    }
    return letters.sort().join('');
  }, [remainingCounts]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Letter Pool
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-xs text-blue-700 font-medium">Original: </span>
            <span className="text-sm font-bold text-blue-900">{originalPool.length}</span>
          </div>
          
          <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-xs text-green-700 font-medium">Remaining: </span>
            <span className="text-sm font-bold text-green-900">{currentPool.length}</span>
          </div>
          
          {spoilage > 0 && (
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-xs text-amber-700 font-medium">Spoilage: </span>
              <span className="text-sm font-bold text-amber-900">{spoilage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Letter frequency grid */}
      <div className="grid grid-cols-13 gap-1 mb-4">
        {alphabet.map(letter => {
          const total = poolCounts[letter] || 0;
          const used = usedCounts[letter] || 0;
          const remaining = remainingCounts[letter] || 0;
          
          return (
            <div
              key={letter}
              className={`
                p-1.5 rounded text-center text-xs font-mono transition-all
                ${total === 0 
                  ? 'bg-gray-100 text-gray-400' 
                  : remaining === 0
                    ? 'bg-red-100 text-red-800 border border-red-300 font-bold'
                    : remaining < total
                      ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                      : 'bg-green-100 text-green-900 border border-green-300'
                }
              `}
              title={`${letter}: ${remaining}/${total} remaining`}
            >
              <div className="font-bold">{letter}</div>
              {total > 0 && (
                <div className="text-[10px]">{remaining}/{total}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current pool display (for copy/paste) */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-700">
            Current Pool (sorted)
          </label>
          <button
            onClick={() => navigator.clipboard.writeText(currentPool)}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Copy
          </button>
        </div>
        <div className="font-mono text-sm text-gray-900 break-all">
          {currentPool || <span className="text-gray-400 italic">Empty</span>}
        </div>
      </div>
    </div>
  );
};

export default LetterPoolManager;