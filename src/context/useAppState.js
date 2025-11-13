// context/useAppState.js

import { useContext } from 'react';
import { AppContext } from './AppContext';

/**
 * Custom hook to access app state and actions
 * Usage: const { state, dispatch, addNotification } = useAppState();
 */
export function useAppState() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  
  return context;
}

/**
 * Convenience hooks for specific state slices
 */

export function useWorkspace() {
  const { state } = useAppState();
  return state.workspace;
}

export function useAnalyze() {
  const { state } = useAppState();
  return state.analyze;
}

export function useResults() {
  const { state } = useAppState();
  return state.results;
}

export function useLibrary() {
  const { state } = useAppState();
  return state.library;
}

export function useUI() {
  const { state } = useAppState();
  return state.ui;
}

export function useSettings() {
  const { state } = useAppState();
  return state.settings;
}

export function useEntityDictionary() {
  const { state } = useAppState();
  return state.entityDictionary;
}