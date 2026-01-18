// components/MiniMerlin/SourceTextInput.jsx

import React, { useState, useCallback, useMemo } from 'react';
import { FileText, Zap, AlertCircle } from 'lucide-react';

/**
 * Source text input with automatic letter extraction
 * Strips punctuation and extracts letters for the pool
 */
const SourceTextInput = ({ onLoadText, isLoading }) => {
  const [sourceText, setSourceText] = useState('');
  const [validationError, setValidationError] = useState('');

  // Extract letters from source text
  const extractLetters = useCallback((text) => {
    // Remove all non-letter characters
    const letters = text.replace(/[^a-zA-Z]/g, '');
    return letters;
  }, []);

  // Validate source text
  const validateText = useCallback((text) => {
    if (!text.trim()) {
      return 'Please enter source text';
    }
    
    const letters = extractLetters(text);
    if (letters.length === 0) {
      return 'No letters found in source text';
    }
    
    if (letters.length > 10000) {
      return 'Source text too long (max 10,000 letters)';
    }
    
    return null;
  }, [extractLetters]);

  // Handle text load
  const handleLoad = useCallback(() => {
    const error = validateText(sourceText);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError('');
    const letters = extractLetters(sourceText);
    onLoadText(sourceText, letters);
  }, [sourceText, validateText, extractLetters, onLoadText]);

  // Handle text change
  const handleTextChange = useCallback((e) => {
    setSourceText(e.target.value);
    setValidationError('');
  }, []);

  // Preview letter count
  const letterCount = useMemo(() => {
    return extractLetters(sourceText).length;
  }, [sourceText, extractLetters]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Source Text
        </h3>
        
        {letterCount > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{letterCount}</span> letters
          </div>
        )}
      </div>

      <textarea
        value={sourceText}
        onChange={handleTextChange}
        placeholder="Paste your source text here (e.g., 'In the beginning God created the Heauen, and the Earth.')

Punctuation will be automatically removed."
        className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-mono text-sm resize-none"
        disabled={isLoading}
      />

      {validationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{validationError}</p>
        </div>
      )}

      <button
        onClick={handleLoad}
        disabled={!sourceText.trim() || isLoading}
        className={`
          w-full mt-4 px-6 py-3 rounded-lg font-semibold text-white transition-all
          flex items-center justify-center gap-2
          ${!sourceText.trim() || isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md'
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Load into Pool
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 mt-2 text-center">
        All punctuation, spaces, and numbers will be stripped
      </p>
    </div>
  );
};

export default SourceTextInput;