// components/MiniMerlin/FungibleVariantsPanel.jsx

import React, { useMemo, useCallback } from 'react';
import { Shuffle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

/**
 * Shows fungible letter variants for copy/paste
 * Rules:
 * - U/V are fungible
 * - UU/W are fungible
 * - VV/W are fungible
 * - BUT: U+V cannot become W (need UU or VV)
 * - I/J: I can be I or J, but J can only be J
 */
const FungibleVariantsPanel = ({ currentPool }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Generate all fungible variants
  const variants = useMemo(() => {
    if (!currentPool) return [];

    const results = [];
    const upperPool = currentPool.toUpperCase();

    // Helper to check if we can make W from letters
    const canMakeW = (str, startIdx) => {
      const next = str[startIdx + 1];
      const curr = str[startIdx];
      
      // Check for UU -> W
      if (curr === 'U' && next === 'U') {
        return { canReplace: true, type: 'UU', length: 2 };
      }
      // Check for VV -> W
      if (curr === 'V' && next === 'V') {
        return { canReplace: true, type: 'VV', length: 2 };
      }
      
      return { canReplace: false };
    };

    // Generate U/V variants
    const generateUVVariants = (str) => {
      const variants = new Set([str]);
      
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        
        if (char === 'U' || char === 'V') {
          // Swap U <-> V
          const newVariants = [];
          for (const variant of variants) {
            const swapped = variant.substring(0, i) + 
                          (variant[i] === 'U' ? 'V' : 'U') + 
                          variant.substring(i + 1);
            newVariants.push(swapped);
          }
          newVariants.forEach(v => variants.add(v));
        }
        
        // Check for UU/VV -> W conversion
        const wCheck = canMakeW(str, i);
        if (wCheck.canReplace) {
          const newVariants = [];
          for (const variant of variants) {
            // Only convert if the pair still exists in this variant
            if (variant[i] === variant[i + 1] && 
                (variant[i] === 'U' || variant[i] === 'V')) {
              const withW = variant.substring(0, i) + 'W' + 
                          variant.substring(i + wCheck.length);
              newVariants.push(withW);
            }
          }
          newVariants.forEach(v => variants.add(v));
        }
      }
      
      return Array.from(variants);
    };

    // Generate I/J variants
    const generateIJVariants = (str) => {
      const variants = new Set([str]);
      
      for (let i = 0; i < str.length; i++) {
        if (str[i] === 'I') {
          // I can become J
          const newVariants = [];
          for (const variant of variants) {
            if (variant[i] === 'I') {
              const withJ = variant.substring(0, i) + 'J' + variant.substring(i + 1);
              newVariants.push(withJ);
            }
          }
          newVariants.forEach(v => variants.add(v));
        }
        // J cannot become I, only stays as J
      }
      
      return Array.from(variants);
    };

    // Start with base pool
    let currentVariants = [upperPool];

    // Apply U/V/W transformations
    const uvVariants = [];
    for (const variant of currentVariants) {
      uvVariants.push(...generateUVVariants(variant));
    }
    currentVariants = [...new Set(uvVariants)];

    // Apply I/J transformations
    const ijVariants = [];
    for (const variant of currentVariants) {
      ijVariants.push(...generateIJVariants(variant));
    }
    currentVariants = [...new Set(ijVariants)];

    // Limit to reasonable number and sort
    return currentVariants
      .sort()
      .slice(0, 50) // Limit to 50 variants max
      .map((variant, idx) => ({
        id: idx,
        text: variant,
        changes: describeChanges(upperPool, variant)
      }));
  }, [currentPool]);

  // Describe what changed
  const describeChanges = (original, variant) => {
    const changes = [];
    
    if (variant.includes('W') && !original.includes('W')) {
      changes.push('UU/VV→W');
    }
    if (variant.includes('V') && !original.includes('V')) {
      changes.push('U→V');
    }
    if (variant.includes('U') && original.replace(/U/g, '').length !== variant.replace(/U/g, '').length) {
      changes.push('V→U');
    }
    if (variant.includes('J') && !original.includes('J')) {
      changes.push('I→J');
    }
    
    return changes.length > 0 ? changes.join(', ') : 'Original';
  };

  // Handle copy
  const handleCopy = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  if (!currentPool || currentPool.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Shuffle className="w-5 h-5 text-purple-600" />
          Pool Iterations
        </h3>
        <p className="text-sm text-gray-500 text-center py-8">
          No letters in current pool
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-purple-600" />
          Pool Iterations
        </h3>
        <span className="text-xs text-gray-600">
          {variants.length} variant{variants.length !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        All valid spelling variations with fungible letters (U/V, UU/VV/W, I/J)
      </p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {variants.map((variant, idx) => (
          <div
            key={variant.id}
            className="group p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-gray-900 break-all mb-1">
                  {variant.text}
                </div>
                <div className="text-xs text-gray-500">
                  {variant.changes}
                </div>
              </div>
              
              <button
                onClick={() => handleCopy(variant.text, idx)}
                className="flex-shrink-0 p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded transition-all"
                title="Copy to clipboard"
              >
                {copiedIndex === idx ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FungibleVariantsPanel;