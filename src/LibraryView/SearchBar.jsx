// components/SearchBar.jsx

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const SearchBar = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search patterns...',
  suggestions = [],
  showSuggestions = false,
  isSearching = false,
  resultCount = null,
  autoFocus = false,
  size = 'medium', // 'small' | 'medium' | 'large'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch?.(value);
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          onSearch?.(value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const newValue = typeof suggestion === 'string' ? suggestion : suggestion.text;
    onChange?.(newValue);
    onSearch?.(newValue);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.blur();
  };

  // Handle clear
  const handleClear = () => {
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'h-9',
          input: 'text-sm px-3',
          icon: 'w-4 h-4',
          button: 'p-1.5',
        };
      case 'large':
        return {
          container: 'h-12',
          input: 'text-base px-5',
          icon: 'w-6 h-6',
          button: 'p-3',
        };
      default: // medium
        return {
          container: 'h-10',
          input: 'text-sm px-4',
          icon: 'w-5 h-5',
          button: 'p-2',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedSuggestionIndex]);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className={`
        relative flex items-center ${sizeClasses.container}
        bg-white border-2 rounded-lg transition-all
        ${isFocused 
          ? 'border-blue-500 ring-2 ring-blue-100' 
          : 'border-gray-300 hover:border-gray-400'
        }
      `}>
        {/* Search Icon */}
        <div className={`absolute left-3 text-gray-400 ${sizeClasses.icon}`}>
          {isSearching ? (
            <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setSelectedSuggestionIndex(-1);
          }}
          onBlur={() => {
            // Delay to allow suggestion clicks
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={placeholder}
          className={`
            w-full ${sizeClasses.input} pl-10 pr-20
            bg-transparent border-0 outline-none
            text-gray-900 placeholder-gray-400
          `}
        />

        {/* Right Actions */}
        <div className="absolute right-2 flex items-center gap-1">
          {/* Result Count */}
          {resultCount !== null && value && (
            <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
              {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Clear Button */}
          {value && !isSearching && (
            <button
              onClick={handleClear}
              className={`
                ${sizeClasses.button}
                text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors
              `}
              title="Clear search"
            >
              <svg className={sizeClasses.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Search Button */}
          {onSearch && (
            <button
              onClick={() => onSearch(value)}
              disabled={isSearching || !value}
              className={`
                ${sizeClasses.button}
                text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors
                disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed
              `}
              title="Search"
            >
              <svg className={sizeClasses.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && suggestions.length > 0 && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-10 md:hidden"
            onClick={() => setIsFocused(false)}
          />
          
          {/* Suggestions List */}
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => {
              const isString = typeof suggestion === 'string';
              const text = isString ? suggestion : suggestion.text;
              const description = isString ? null : suggestion.description;
              const icon = isString ? null : suggestion.icon;
              const meta = isString ? null : suggestion.meta;

              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    w-full px-4 py-2.5 text-left border-b border-gray-100 last:border-b-0 transition-colors
                    ${selectedSuggestionIndex === index
                      ? 'bg-blue-50 text-blue-900'
                      : 'hover:bg-gray-50 text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    {icon && (
                      <div className="flex-shrink-0 text-gray-400">
                        {typeof icon === 'string' ? (
                          <span className="text-lg">{icon}</span>
                        ) : (
                          icon
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Highlight matching text */}
                        <span className="text-sm font-medium truncate">
                          {value ? (
                            <>
                              {text.split(new RegExp(`(${value})`, 'gi')).map((part, i) => (
                                part.toLowerCase() === value.toLowerCase() ? (
                                  <mark key={i} className="bg-yellow-200 text-gray-900">
                                    {part}
                                  </mark>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              ))}
                            </>
                          ) : (
                            text
                          )}
                        </span>

                        {/* Meta info */}
                        {meta && (
                          <span className="text-xs text-gray-500">
                            {meta}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {description && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {selectedSuggestionIndex === index && (
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* No Results Message */}
      {showSuggestions && isFocused && value && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs mt-0.5">Try different keywords or filters</p>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 px-4 py-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs ml-1">↓</kbd>
                {' '}to navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd>
                {' '}to select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Esc</kbd>
                {' '}to dismiss
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onClear: PropTypes.func,
  placeholder: PropTypes.string,
  suggestions: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        description: PropTypes.string,
        icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        meta: PropTypes.string,
      }),
    ])
  ),
  showSuggestions: PropTypes.bool,
  isSearching: PropTypes.bool,
  resultCount: PropTypes.number,
  autoFocus: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default SearchBar;