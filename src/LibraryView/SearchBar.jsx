// src/LibraryView/SearchBar.jsx
// Intelligent search bar with context-aware suggestions and keyboard navigation

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAppState, ACTIONS } from '../context/AppContext';
import { Search, X, ArrowRight, Loader } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIG = {
  small: {
    container: 'h-9',
    input: 'text-sm px-3',
    icon: 'w-4 h-4',
    button: 'p-1.5',
  },
  medium: {
    container: 'h-10',
    input: 'text-sm px-4',
    icon: 'w-5 h-5',
    button: 'p-2',
  },
  large: {
    container: 'h-12',
    input: 'text-base px-5',
    icon: 'w-6 h-6',
    button: 'p-3',
  },
};

const SUGGESTION_TYPES = {
  author: { icon: '👤', meta: 'Author' },
  work: { icon: '📄', meta: 'Work' },
  pattern: { icon: '🔍', meta: 'Pattern' },
};

const MIN_SEARCH_LENGTH = 2;
const MAX_SUGGESTIONS = 10;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SearchBar = ({
  placeholder = 'Search authors and works...',
  autoFocus = false,
  size = 'medium',
  context = 'library',
}) => {
  const { state, dispatch } = useAppState();
  
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Get search value and suggestions
  const searchValue = useSearchValue(context, state);
  const suggestions = useSuggestions(searchValue, context, state);
  const isSearching = state.ui.isLoading?.search || false;

  // Size configuration
  const sizeClasses = useMemo(() => SIZE_CONFIG[size] || SIZE_CONFIG.medium, [size]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Scroll selected suggestion into view
  useScrollSelectedIntoView(selectedSuggestionIndex, suggestionsRef);

  // Event handlers
  const handleChange = useHandleChange(context, dispatch);
  const handleKeyDown = useHandleKeyDown(
    suggestions,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    searchValue,
    inputRef,
    handleChange,
    dispatch,
    context
  );
  const handleSuggestionClick = useHandleSuggestionClick(
    handleChange,
    setSelectedSuggestionIndex,
    dispatch,
    inputRef
  );
  const handleClear = useHandleClear(handleChange, setSelectedSuggestionIndex, inputRef);
  const handleSearch = useHandleSearch(searchValue, context, dispatch);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsFocused(false), 200);
  }, []);

  return (
    <div className="relative w-full">
      <SearchInput
        inputRef={inputRef}
        searchValue={searchValue}
        isSearching={isSearching}
        isFocused={isFocused}
        sizeClasses={sizeClasses}
        placeholder={placeholder}
        suggestionCount={suggestions.length}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClear={handleClear}
        onSearch={handleSearch}
      />

      {isFocused && suggestions.length > 0 && (
        <>
          <SuggestionBackdrop onClose={() => setIsFocused(false)} />
          <SuggestionsList
            suggestionsRef={suggestionsRef}
            suggestions={suggestions}
            selectedIndex={selectedSuggestionIndex}
            searchValue={searchValue}
            onSuggestionClick={handleSuggestionClick}
          />
          <KeyboardHints />
        </>
      )}

      {isFocused && searchValue && searchValue.length >= MIN_SEARCH_LENGTH && suggestions.length === 0 && (
        <NoResultsMessage />
      )}
    </div>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useSearchValue(context, state) {
  return useMemo(() => {
    switch (context) {
      case 'library': return state.library.searchQuery || '';
      case 'results': return state.results.searchQuery || '';
      default: return '';
    }
  }, [context, state.library.searchQuery, state.results.searchQuery]);
}

function useSuggestions(searchValue, context, state) {
  return useMemo(() => {
    if (!searchValue || searchValue.length < MIN_SEARCH_LENGTH) return [];

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
            icon: SUGGESTION_TYPES.author.icon,
            meta: SUGGESTION_TYPES.author.meta,
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
            icon: SUGGESTION_TYPES.work.icon,
            meta: SUGGESTION_TYPES.work.meta,
            data: work,
          });
        }
      });
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
            icon: SUGGESTION_TYPES.pattern.icon,
            meta: `Score: ${Math.round(pattern.scores?.composite || pattern.composite_score || 0)}`,
            data: pattern,
          });
        }
      });
    }

    return results.slice(0, MAX_SUGGESTIONS);
  }, [searchValue, context, state.library.authors, state.library.availableWorks, state.results.patterns]);
}

function useHandleChange(context, dispatch) {
  return useCallback((value) => {
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
  }, [context, dispatch]);
}

function useHandleKeyDown(
  suggestions,
  selectedSuggestionIndex,
  setSelectedSuggestionIndex,
  searchValue,
  inputRef,
  handleChange,
  dispatch,
  context
) {
  return useCallback((e) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(searchValue, context, dispatch);
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
          handleSuggestionClick(suggestions[selectedSuggestionIndex], handleChange, setSelectedSuggestionIndex, dispatch, inputRef);
        } else {
          handleSearch(searchValue, context, dispatch);
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
  }, [suggestions, selectedSuggestionIndex, searchValue, context, dispatch, handleChange, inputRef, setSelectedSuggestionIndex]);
}

function useHandleSuggestionClick(handleChange, setSelectedSuggestionIndex, dispatch, inputRef) {
  return useCallback((suggestion) => {
    const newValue = suggestion.text;
    handleChange(newValue);
    
    if (suggestion.type === 'author') {
      dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: suggestion.data.folder_name });
    } else if (suggestion.type === 'work') {
      dispatch({ type: ACTIONS.SET_SELECTED_WORK, payload: suggestion.data });
      dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
    } else if (suggestion.type === 'pattern') {
      dispatch({ type: ACTIONS.VIEW_PATTERN_DETAILS, payload: suggestion.data });
    }
    
    setSelectedSuggestionIndex(-1);
    inputRef.current?.blur();
  }, [handleChange, setSelectedSuggestionIndex, dispatch, inputRef]);
}

function useHandleClear(handleChange, setSelectedSuggestionIndex, inputRef) {
  return useCallback(() => {
    handleChange('');
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [handleChange, setSelectedSuggestionIndex, inputRef]);
}

function useHandleSearch(searchValue, context, dispatch) {
  return useCallback(() => {
    if (!searchValue) return;

    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        type: 'info',
        message: `Searching for "${searchValue}"...`,
        duration: 2000,
      },
    });

    if (context === 'library') {
      dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: searchValue });
    } else if (context === 'results') {
      dispatch({
        type: ACTIONS.UPDATE_RESULT_FILTERS,
        payload: { searchQuery: searchValue },
      });
    }
  }, [searchValue, context, dispatch]);
}

function useScrollSelectedIntoView(selectedIndex, suggestionsRef) {
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function handleSearch(searchValue, context, dispatch) {
  if (!searchValue) return;

  dispatch({
    type: ACTIONS.ADD_NOTIFICATION,
    payload: {
      type: 'info',
      message: `Searching for "${searchValue}"...`,
      duration: 2000,
    },
  });

  if (context === 'library') {
    dispatch({ type: ACTIONS.SET_LIBRARY_SEARCH, payload: searchValue });
  } else if (context === 'results') {
    dispatch({
      type: ACTIONS.UPDATE_RESULT_FILTERS,
      payload: { searchQuery: searchValue },
    });
  }
}

function handleSuggestionClick(suggestion, handleChange, setSelectedSuggestionIndex, dispatch, inputRef) {
  const newValue = suggestion.text;
  handleChange(newValue);
  
  if (suggestion.type === 'author') {
    dispatch({ type: ACTIONS.SET_SELECTED_AUTHOR, payload: suggestion.data.folder_name });
  } else if (suggestion.type === 'work') {
    dispatch({ type: ACTIONS.SET_SELECTED_WORK, payload: suggestion.data });
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: 'workspace' });
  } else if (suggestion.type === 'pattern') {
    dispatch({ type: ACTIONS.VIEW_PATTERN_DETAILS, payload: suggestion.data });
  }
  
  setSelectedSuggestionIndex(-1);
  inputRef.current?.blur();
}

function highlightMatch(text, searchValue) {
  if (!searchValue) return text;
  
  const parts = text.split(new RegExp(`(${searchValue})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === searchValue.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SearchInput = ({
  inputRef,
  searchValue,
  isSearching,
  isFocused,
  sizeClasses,
  placeholder,
  suggestionCount,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onClear,
  onSearch,
}) => (
  <div className={`relative flex items-center ${sizeClasses.container} bg-white border-2 rounded-lg transition-all ${
    isFocused 
      ? 'border-blue-500 ring-2 ring-blue-100' 
      : 'border-gray-300 hover:border-gray-400'
  }`}>
    <SearchIcon isSearching={isSearching} sizeClasses={sizeClasses} />
    
    <input
      ref={inputRef}
      type="text"
      value={searchValue}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full ${sizeClasses.input} pl-10 pr-20 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400`}
    />

    <RightActions
      searchValue={searchValue}
      isSearching={isSearching}
      suggestionCount={suggestionCount}
      sizeClasses={sizeClasses}
      onClear={onClear}
      onSearch={onSearch}
    />
  </div>
);

const SearchIcon = ({ isSearching, sizeClasses }) => (
  <div className="absolute left-3 text-gray-400">
    {isSearching ? (
      <Loader className={`${sizeClasses.icon} animate-spin`} />
    ) : (
      <Search className={sizeClasses.icon} />
    )}
  </div>
);

const RightActions = ({ searchValue, isSearching, suggestionCount, sizeClasses, onClear, onSearch }) => (
  <div className="absolute right-2 flex items-center gap-1">
    {suggestionCount > 0 && searchValue && (
      <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
        {suggestionCount} result{suggestionCount !== 1 ? 's' : ''}
      </span>
    )}

    {searchValue && !isSearching && (
      <button
        onClick={onClear}
        className={`${sizeClasses.button} text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors`}
        title="Clear search"
      >
        <X className={sizeClasses.icon} />
      </button>
    )}

    <button
      onClick={onSearch}
      disabled={isSearching || !searchValue}
      className={`${sizeClasses.button} text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
      title="Search"
    >
      <ArrowRight className={sizeClasses.icon} />
    </button>
  </div>
);

const SuggestionBackdrop = ({ onClose }) => (
  <div className="fixed inset-0 z-10 md:hidden" onClick={onClose} />
);

const SuggestionsList = ({
  suggestionsRef,
  suggestions,
  selectedIndex,
  searchValue,
  onSuggestionClick,
}) => (
  <div
    ref={suggestionsRef}
    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto"
  >
    {suggestions.map((suggestion, index) => (
      <SuggestionItem
        key={index}
        suggestion={suggestion}
        isSelected={selectedIndex === index}
        searchValue={searchValue}
        onClick={() => onSuggestionClick(suggestion)}
      />
    ))}
  </div>
);

const SuggestionItem = ({ suggestion, isSelected, searchValue, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2.5 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
      isSelected
        ? 'bg-blue-50 text-blue-900'
        : 'hover:bg-gray-50 text-gray-900'
    }`}
  >
    <div className="flex items-center gap-3">
      {suggestion.icon && (
        <div className="flex-shrink-0 text-gray-400">
          <span className="text-lg">{suggestion.icon}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {highlightMatch(suggestion.text, searchValue)}
          </span>
          {suggestion.meta && (
            <span className="text-xs text-gray-500">{suggestion.meta}</span>
          )}
        </div>
        {suggestion.description && (
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {suggestion.description}
          </p>
        )}
      </div>

      {isSelected && (
        <div className="flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </button>
);

const KeyboardHints = () => (
  <div className="absolute top-full left-0 right-0 mt-1 px-4 py-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
    <div className="flex items-center gap-4">
      <KeyboardHint keys={['↑', '↓']} action="to navigate" />
      <KeyboardHint keys={['Enter']} action="to select" />
      <KeyboardHint keys={['Esc']} action="to dismiss" />
    </div>
  </div>
);

const KeyboardHint = ({ keys, action }) => (
  <span>
    {keys.map((key, index) => (
      <kbd key={index} className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs ml-1">
        {key}
      </kbd>
    ))}
    {' '}{action}
  </span>
);

const NoResultsMessage = () => (
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
);

// ============================================================================
// PROP TYPES
// ============================================================================

SearchBar.propTypes = {
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  context: PropTypes.oneOf(['library', 'results', 'general']),
};

export default SearchBar;