// src/ResultsView/ResultCard.jsx - FIXED WITH DETAILED DEBUGGING

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import { useAppState, ACTIONS } from '../context/AppContext';

const ResultCard = ({ pattern }) => {
  const { dispatch } = useAppState();
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // LOG EVERYTHING
  console.log('🔍 RAW PATTERN RECEIVED:', pattern);
  console.log('🔍 PATTERN TYPE:', typeof pattern);
  console.log('🔍 PATTERN KEYS:', Object.keys(pattern));
  
  // Check segment_info specifically
  if (pattern.segment_info) {
    console.log('✅ Has segment_info:', pattern.segment_info);
    console.log('✅ segment_info.text:', pattern.segment_info.text);
    console.log('✅ segment_info.text type:', typeof pattern.segment_info.text);
    console.log('✅ segment_info.text length:', pattern.segment_info.text?.length);
  } else {
    console.log('❌ NO segment_info found');
  }
  
  // Extract segment info - EXACT field names from your JSON
  const segmentInfo = pattern.segment_info || {};
  
  // Log segmentInfo extraction
  console.log('📦 Extracted segmentInfo:', segmentInfo);
  console.log('📦 segmentInfo.text:', segmentInfo.text);
  
  const segmentName = segmentInfo.name || 
                     pattern.segment_name ||
                     pattern.section_name || 
                     `Segment ${(segmentInfo.index || 0) + 1}`;
  
  // EXACT extraction as per your JSON structure
  const originalText = segmentInfo.text || 
                      pattern.text ||
                      pattern.original_text ||
                      (segmentInfo.lines && segmentInfo.lines.length > 0 
                        ? segmentInfo.lines.join('\n') 
                        : '');

  console.log('📝 Final originalText:', originalText);
  console.log('📝 originalText length:', originalText?.length);
  console.log('📝 originalText is truthy:', !!originalText);

  const startLine = segmentInfo.start_line !== undefined ? segmentInfo.start_line + 1 : null;
  const endLine = segmentInfo.end_line !== undefined ? segmentInfo.end_line + 1 : null;

  // Get all candidates
  const decodingResults = pattern.decoding_results || {};
  const allCandidates = decodingResults.top_decodings || 
                       pattern.candidates || 
                       pattern.credible_candidates || 
                       [];

  console.log('🎯 All candidates:', allCandidates.length);

  const viableCandidates = allCandidates.filter(candidate => {
    const text = candidate.decoded_preview || 
                candidate.decoded_text || 
                candidate.text || 
                '';
    return text.trim().length > 0;
  });

  const displayCandidates = showAllCandidates 
    ? viableCandidates 
    : viableCandidates.slice(0, 5);

  // Get anomaly detection info
  const anomalyDetection = pattern.anomaly_detection || {};
  const anomalyScore = anomalyDetection.anomaly_score || 0;
  const classification = anomalyDetection.classification || 'UNKNOWN';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">


      {/* Segment Header */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{segmentName}</h3>
              
              {startLine && endLine && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium">
                  Lines {startLine}-{endLine}
                </span>
              )}
              
              {classification && (
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  classification === 'ANOMALOUS' ? 'bg-red-100 text-red-700' :
                  classification === 'SUSPICIOUS' ? 'bg-yellow-100 text-yellow-700' :
                  classification === 'NORMAL' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {classification}
                </span>
              )}
            </div>

            {/* Original Text Display */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  📄 Original Segment Text
                </div>
                {!originalText && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                    NOT FOUND
                  </span>
                )}
              </div>
              
              {originalText ? (
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <p className="text-sm text-gray-900 leading-relaxed font-serif whitespace-pre-wrap">
                    {originalText.length > 300 ? (
                      <>
                        {originalText.substring(0, 300)}
                        <details className="inline">
                          <summary className="text-blue-600 cursor-pointer hover:text-blue-700 ml-1 font-sans">
                            ...read more
                          </summary>
                          <span className="block mt-2">{originalText.substring(300)}</span>
                        </details>
                      </>
                    ) : (
                      originalText
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800 text-sm font-semibold mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Original segment text not available</span>
                  </div>
                  <div className="text-xs text-red-700 space-y-1">
                    <div>• Checked: segment_info.text = {pattern.segment_info?.text ? `"${pattern.segment_info.text}"` : 'null'}</div>
                    <div>• Checked: pattern.text = {pattern.text ? `"${pattern.text}"` : 'null'}</div>
                    <div>• Checked: pattern.original_text = {pattern.original_text ? `"${pattern.original_text}"` : 'null'}</div>
                    <div>• Checked: segment_info.lines = {segmentInfo.lines ? `[${segmentInfo.lines.length} lines]` : 'null'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Anomaly Score */}
          <div className="flex-shrink-0">
            <div className={`text-center px-4 py-2 rounded-lg border-2 ${
              anomalyScore >= 7 ? 'bg-red-50 border-red-300' :
              anomalyScore >= 4 ? 'bg-yellow-50 border-yellow-300' :
              'bg-blue-50 border-blue-300'
            }`}>
              <div className={`text-xs font-semibold mb-1 ${
                anomalyScore >= 7 ? 'text-red-600' :
                anomalyScore >= 4 ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                Anomaly
              </div>
              <div className={`text-2xl font-bold ${
                anomalyScore >= 7 ? 'text-red-700' :
                anomalyScore >= 4 ? 'text-yellow-700' :
                'text-blue-700'
              }`}>
                {anomalyScore.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Metrics */}
      {(anomalyDetection.ioc !== undefined || 
        anomalyDetection.entropy !== undefined || 
        anomalyDetection.chi_squared !== undefined) && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            {anomalyDetection.ioc !== undefined && (
              <MetricBadge
                label="IoC"
                value={anomalyDetection.ioc.toFixed(4)}
                tooltip="Index of Coincidence"
              />
            )}
            {anomalyDetection.entropy !== undefined && (
              <MetricBadge
                label="Entropy"
                value={anomalyDetection.entropy.toFixed(2)}
                tooltip="Shannon Entropy"
              />
            )}
            {anomalyDetection.chi_squared !== undefined && (
              <MetricBadge
                label="Chi²"
                value={anomalyDetection.chi_squared.toFixed(1)}
                tooltip="Chi-Squared Score"
              />
            )}
          </div>
        </div>
      )}

      {/* Candidates Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            Decoded Candidates ({viableCandidates.length})
            {allCandidates.length > viableCandidates.length && (
              <span className="text-xs text-gray-500 font-normal">
                ({allCandidates.length - viableCandidates.length} filtered out)
              </span>
            )}
          </h4>
          
          <div className="flex items-center gap-2">
            {viableCandidates.length > 5 && (
              <button
                onClick={() => setShowAllCandidates(!showAllCandidates)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {showAllCandidates ? (
                  <>Show top 5 <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Show all {viableCandidates.length} <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              {showDebug ? 'Hide' : 'Show'} Full JSON
            </button>
          </div>
        </div>

        {showDebug && (
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(pattern, null, 2)}
            </pre>
          </div>
        )}

        {viableCandidates.length === 0 ? (
          <NoCandidatesFound 
            anomalyScore={anomalyScore}
            classification={classification}
            hasRawCandidates={allCandidates.length > 0}
          />
        ) : (
          <div className="space-y-3">
            {displayCandidates.map((candidate, idx) => (
              <CandidateRow
                key={idx}
                candidate={candidate}
                rank={idx + 1}
                isTop={idx === 0}
                segmentId={segmentInfo.id || pattern.id}
                dispatch={dispatch}
              />
            ))}
          </div>
        )}
      </div>

      {pattern.cipher_detection && (
        <CipherDetectionInfo detection={pattern.cipher_detection} />
      )}
    </div>
  );
};

// ... rest of the components remain the same (MetricBadge, NoCandidatesFound, etc.)

const MetricBadge = ({ label, value, tooltip }) => {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200" title={tooltip}>
      <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
};

const NoCandidatesFound = ({ anomalyScore, classification, hasRawCandidates }) => {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      
      {hasRawCandidates ? (
        <>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            All Candidates Filtered Out
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Found candidates but they were filtered as gibberish.
          </p>
        </>
      ) : (
        <>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            No Decoding Attempts
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            {anomalyScore < 2 ? (
              <>Segment classified as <strong>{classification}</strong> - may not need decoding.</>
            ) : (
              <>No decoding attempts returned by backend.</>
            )}
          </p>
        </>
      )}
      
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium">Anomaly:</span> {anomalyScore.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">Class:</span> {classification}
        </div>
      </div>
    </div>
  );
};

const CipherDetectionInfo = ({ detection }) => {
  if (!detection || !detection.methods_detected?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Cipher Methods Detected:</h4>
      <div className="flex flex-wrap gap-1.5">
        {detection.methods_detected.slice(0, 5).map((method, idx) => (
          <span
            key={idx}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium"
          >
            {method}
          </span>
        ))}
        {detection.methods_detected.length > 5 && (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            +{detection.methods_detected.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
};

const CandidateRow = ({ candidate, rank, isTop, segmentId, dispatch }) => {
  const [enhancing, setEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  const decodedText = candidate.decoded_preview || 
                     candidate.decoded_text || 
                     candidate.text || 
                     '';
  
  const method = candidate.method || 'Unknown Method';
  const confidence = Math.round((candidate.confidence || 0) * 100);
  
  const hasEnhancement = candidate.enhanced_text && 
                        candidate.enhanced_text !== decodedText;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hasEnhancement ? candidate.enhanced_text : decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnhance = async () => {
    setEnhancing(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decoded_text: decodedText,
          mode: 'standard',
          max_suggestions: 5
        })
      });

      const result = await response.json();
      
      dispatch({
        type: ACTIONS.SET_AI_ENHANCEMENT_RESULT,
        payload: {
          segmentId,
          candidateRank: rank,
          original: decodedText,
          enhanced: result,
          method
        }
      });

      dispatch({
        type: ACTIONS.TOGGLE_MODAL,
        payload: { modal: 'aiEnhancement', isOpen: true }
      });

    } catch (error) {
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: 'Enhancement failed: ' + error.message
        }
      });
    } finally {
      setEnhancing(false);
    }
  };

  const confidenceColor = 
    confidence >= 80 ? 'bg-green-100 text-green-700 border-green-300' :
    confidence >= 60 ? 'bg-blue-100 text-blue-700 border-blue-300' :
    confidence >= 40 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
    'bg-gray-100 text-gray-600 border-gray-300';

  return (
    <div className={`relative rounded-lg p-4 ${
      isTop 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300' 
        : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="absolute -top-2 -left-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
          isTop 
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' 
            : 'bg-white text-gray-700 border-2 border-gray-300'
        }`}>
          {rank}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 mb-3 ml-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-600">{method}</span>
            {hasEnhancement && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Enhanced
              </span>
            )}
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full border-2 font-bold text-sm ${confidenceColor}`}>
          {confidence}%
        </div>
      </div>

      <div className="mb-3 ml-6">
        <p className="text-gray-900 text-base leading-relaxed">
          {hasEnhancement ? candidate.enhanced_text : decodedText}
        </p>
        {hasEnhancement && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Show original decode
            </summary>
            <p className="text-sm text-gray-600 mt-1 italic">{decodedText}</p>
          </details>
        )}
      </div>

      <div className="flex items-center gap-2 ml-6">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>

        <button
          onClick={handleEnhance}
          disabled={enhancing}
          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-md text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enhancing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Enhance with AI
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultCard;