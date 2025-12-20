// src/AppShell/AIEnhancementModal.jsx - CLEAN VERSION

import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAppState, ACTIONS } from '../context/AppContext';

const AIEnhancementModal = () => {
  const { state, dispatch } = useAppState();
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const isOpen = state.ui.modals?.aiEnhancement || false;
  const data = state.results.aiEnhancementResult || {};

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch({
      type: ACTIONS.TOGGLE_MODAL,
      payload: { modal: 'aiEnhancement', isOpen: false }
    });
  };

  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const outputs = data.enhanced?.outputs || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Enhanced Versions</h2>
                <p className="text-sm text-white/80">
                  {outputs.length} alternative interpretation{outputs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Original */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 mb-2">
            ORIGINAL DECODE ({data.method})
          </div>
          <p className="text-sm text-gray-900 leading-relaxed">
            {data.original}
          </p>
        </div>

        {/* Enhanced Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {outputs.map((output, index) => (
              <EnhancedCard
                key={index}
                output={output}
                index={index}
                onCopy={handleCopy}
                copied={copiedIndex === index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedCard = ({ output, index, onCopy, copied }) => {
  const confidence = Math.round(output.confidence * 100);
  const coherence = Math.round(output.coherence * 100);
  
  return (
    <div className="bg-white border-2 border-purple-200 rounded-xl p-4 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-bold flex items-center justify-center">
            {index + 1}
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Confidence: {confidence}%</span>
            <span className="mx-1">•</span>
            <span>Coherence: {coherence}%</span>
          </div>
        </div>
        
        <button
          onClick={() => onCopy(output.text, index)}
          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-purple-600" />
          )}
        </button>
      </div>

      <p className="text-gray-900 text-base leading-relaxed mb-3">
        {output.text}
      </p>

      {output.entities_found && output.entities_found.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
          {output.entities_found.map((entity, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg font-medium"
            >
              {entity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIEnhancementModal;