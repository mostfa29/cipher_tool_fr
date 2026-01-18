// components/MiniMerlin/ScratchPad.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Edit3, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

/**
 * Interactive scratch pad with real-time letter validation
 * Blocks letters not in current pool
 * Updates current pool as user types
 */
const ScratchPad = ({ 
  currentPool, 
  onScratchChange,
  sessionId 
}) => {
  const [scratchText, setScratchText] = useState('');
  const [error, setError] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Validate if a character can be typed
  const canUseCharacter = useCallback((char, currentScratchText) => {
    // Allow punctuation and spaces
    if (!/[a-zA-Z]/.test(char)) {
      return true;
    }

    // Count how many times this letter has been used
    const upperChar = char.toUpperCase();
    const usedCount = (currentScratchText.match(new RegExp(upperChar, 'gi')) || []).length;
    
    // Count how many times it appears in original pool
    const poolCount = (currentPool.match(new RegExp(upperChar, 'gi')) || []).length;
    
    return usedCount < poolCount;
  }, [currentPool]);

  // Extract only letters from scratch text
  const extractLetters = useCallback((text) => {
    return text.replace(/[^a-zA-Z]/g, '');
  }, []);

  // Handle text change with validation
  const handleChange = useCallback((e) => {
    const newText = e.target.value;
    const oldText = scratchText;
    
    // If text is being deleted or is empty, always allow
    if (newText.length <= oldText.length || newText === '') {
      setScratchText(newText);
      setError('');
      onScratchChange(extractLetters(newText));
      return;
    }

    // Find the new character(s) added
    const diff = newText.slice(oldText.length);
    
    // Validate each new character
    let validText = oldText;
    let hasError = false;
    let errorChar = '';

    for (const char of diff) {
      if (canUseCharacter(char, extractLetters(validText))) {
        validText += char;
      } else if (/[a-zA-Z]/.test(char)) {
        hasError = true;
        errorChar = char.toUpperCase();
        break;
      } else {
        // Allow non-letters
        validText += char;
      }
    }

    if (hasError) {
      setError(`Letter "${errorChar}" not available in current pool`);
      // Don't update text, block the input
      return;
    }

    setScratchText(validText);
    setError('');
    onScratchChange(extractLetters(validText));
  }, [scratchText, canUseCharacter, extractLetters, onScratchChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    setScratchText('');
    setError('');
    onScratchChange('');
  }, [onScratchChange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const letters = extractLetters(scratchText);
    const remaining = currentPool.length - letters.length;
    const percentUsed = currentPool.length > 0 
      ? Math.round((letters.length / currentPool.length) * 100)
      : 0;

    return {
      lettersUsed: letters.length,
      lettersRemaining: remaining,
      percentUsed,
      totalLetters: currentPool.length
    };
  }, [scratchText, currentPool, extractLetters]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-purple-600" />
          Scratch Pad
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-600">
            <span className="font-semibold">{stats.lettersUsed}</span>
            <span className="mx-1">/</span>
            <span className="font-semibold">{stats.totalLetters}</span>
            <span className="ml-1">letters</span>
            <span className="ml-2 text-purple-600 font-bold">
              ({stats.percentUsed}%)
            </span>
          </div>
          
          {scratchText && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-600 hover:text-red-600 font-medium flex items-center gap-1"
              title="Clear scratch pad"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={scratchText}
        onChange={handleChange}
        placeholder="Type your anagram solution here...

You can use punctuation and spaces freely.
Only letters in the current pool can be typed."
        className={`
          w-full h-48 px-4 py-3 border-2 rounded-lg transition-all font-mono text-base resize-none
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
            : 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
          }
        `}
      />

      {/* Status messages */}
      <div className="mt-3 space-y-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}
        
        {!error && scratchText && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">
                Valid - {stats.lettersRemaining} letters remaining
              </p>
              {stats.lettersRemaining === 0 && (
                <p className="text-xs text-green-700 mt-1">
                  ✓ Perfect match! All letters used.
                </p>
              )}
            </div>
          </div>
        )}

        {!scratchText && (
          <p className="text-xs text-gray-500 text-center">
            Type letters from the current pool to build your anagram
          </p>
        )}
      </div>
    </div>
  );
};

export default ScratchPad;