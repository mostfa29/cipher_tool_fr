// LibraryView/SearchBar.jsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';

const SearchBar = ({
  placeholder = 'Search authors and works...',
  autoFocus = false,
  size = 'medium', // 'small' | 'medium' | 'large'
  context = 'library', // 'library' | 'results' | 'general'
}) => {
  const { state, dispatch } = useAppState();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Get search value from appropriate state location based on context
  const searchValue = useMemo(() => {
    switch (context) {
      case 'library':
        return state.library.searchQuery || '';
      case 'results':
        return state.results.searchQuery || '';
      default:
        return '';
    }
  }, [context, state.library.searchQuery, state.results.searchQuery]);

  // Generate suggestions based on context
  const suggestions = useMemo(() => {
    if (!searchValue || searchValue.length < 2) return [];

    const query = searchValue.toLowerCase();
    const results = [];

    if (context === 'library') {
      // Search authors
      const authors = state.library.authors || [];
      authors.forEach(author => {
        if (author.name.toLowerCase().includes(query)) {
          results.push({
            type: 'author',
            text: author.name,
            description: `${author.work_count} works`,
            icon: '👤',
            meta: 'Author',
            data: author,
          });
        }
      });

      // Search works
      const works = state.library.availableWorks || [];
      works.forEach(work => {
        if (work.title.toLowerCase().includes(query) || 
            work.author?.toLowerCase().includes(query)) {
          results.push({
            type: 'work',
            text: work.title,
            description: `by ${work.author}`,
            icon: '📄',
            meta: 'Work',
            data: work,
          });
        }
      });

      // Limit to 10 results
      return results.slice(0, 10);
    }

    if (context === 'results') {
      // Search in decoded patterns
      const patterns = state.results.patterns || [];
      patterns.forEach(pattern => {
        const decodedText = pattern.decoded_pattern || pattern.best_candidate?.decoded_text || '';
        if (decodedText.toLowerCase().includes(query)) {
          results.push({
            type: 'pattern',
            text: decodedText.substring(0, 60) + (decodedText.length > 60 ? '...' : ''),
            description: `Segment ${pattern.section_name || pattern.segment_id}`,
            icon: '🔍',
            meta: `Score: ${Math.round(pattern.scores?.composite || pattern.composite_score || 0)}`,
            data: pattern,
          });
        }
      });

      return results.slice(0, 10);
    }

    return [];
  }, [searchValue, context, state.library.authors, state.library.availableWorks, state.results.patterns]);

  const isSearching = state.ui.isLoading?.search || false;
  const resultCount = suggestions.length;

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle value change
  const handleChange = (value) => {
    switch (context) {
      case 'library':
        dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: value });
        break;
      case 'results':
        dispatch({ 
          type: ACTIONS.UPDATE_RESULT_FILTERS, 
          payload: { searchQuery: value } 
        });
        break;
      default:
        break;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(searchValue);
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
          handleSearch(searchValue);
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

  // Handle search execution
  const handleSearch = (query) => {
    if (!query) return;

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: `Searching for "${query}"...`,
        duration: 2000,
      },
    });

    // Context-specific search actions
    if (context === 'library') {
      // Filter the library view based on search
      dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: query });
    } else if (context === 'results') {
      // Apply search filter to results
      dispatch({
        type: ACTIONS.UPDATE_RESULT_FILTERS,
        payload: { searchQuery: query },
      });
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const newValue = suggestion.text;
    handleChange(newValue);
    
    // Take action based on suggestion type
    if (suggestion.type === 'author') {
      dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: suggestion.data.folder_name });
    } else if (suggestion.type === 'work') {
      // Navigate to workspace with this work
      dispatch({ type: ACTIONS.SET_SELECTED_WORK, payload: suggestion.data });
      dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
    } else if (suggestion.type === 'pattern') {
      // View pattern details
      dispatch({ type: ACTIONS.VIEW_PATTERN_DETAILS, payload: suggestion.data });
    }
    
    setSelectedSuggestionIndex(-1);
    inputRef.current?.blur();
  };

  // Handle clear
  const handleClear = () => {
    handleChange('');
    setSelectedSuggestionIndex(-1);
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
        <div className={`absolute left-3 text-gray-400`}>
          {isSearching ? (
            <svg className={`animate-spin ${sizeClasses.icon}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className={sizeClasses.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => handleChange(e.target.value)}
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
          {resultCount > 0 && searchValue && (
            <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
              {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Clear Button */}
          {searchValue && !isSearching && (
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
          <button
            onClick={() => handleSearch(searchValue)}
            disabled={isSearching || !searchValue}
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
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
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
              const { text, description, icon, meta } = suggestion;

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
                          {searchValue ? (
                            <>
                              {text.split(new RegExp(`(${searchValue})`, 'gi')).map((part, i) => (
                                part.toLowerCase() === searchValue.toLowerCase() ? (
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
      {isFocused && searchValue && searchValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs mt-0.5">Try different keywords</p>
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
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  context: PropTypes.oneOf(['library', 'results', 'general']),
};

export default SearchBar;