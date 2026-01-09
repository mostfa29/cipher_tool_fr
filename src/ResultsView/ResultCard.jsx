import React, { useState } from 'react';
import { 
  ChevronDown, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  User,
  BookOpen,
  Hash,
  TrendingUp,
  Calendar,
  Star,
  Award,
  FileText,
  Zap,
  List,
  Eye,
  Info
} from 'lucide-react';

const ResultCard = ({ work }) => {
  const [expandedEditions, setExpandedEditions] = useState(new Set());
  const [expandedSegments, setExpandedSegments] = useState(new Set());

  // Extract all editions with valid segments
  const editions = Object.entries(work.editions || {})
    .filter(([_, edition]) => edition.segments && edition.segments.length > 0)
    .map(([editionId, edition]) => ({
      id: editionId,
      ...edition,
      date: edition.date || edition.edition_date || null
    }))
    .sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });

  const toggleEdition = (editionId) => {
    const newExpanded = new Set(expandedEditions);
    if (newExpanded.has(editionId)) {
      newExpanded.delete(editionId);
    } else {
      newExpanded.add(editionId);
    }
    setExpandedEditions(newExpanded);
  };

  const toggleSegment = (segmentKey) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(segmentKey)) {
      newExpanded.delete(segmentKey);
    } else {
      newExpanded.add(segmentKey);
    }
    setExpandedSegments(newExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 overflow-hidden">
      {/* Work Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{work.work}</h2>
            <div className="flex items-center gap-3 text-indigo-100">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{work.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">{editions.length} editions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editions List */}
      <div className="divide-y-2 divide-gray-200">
        {editions.map((edition, editionIdx) => (
          <EditionSection
            key={edition.id}
            edition={edition}
            editionIdx={editionIdx}
            isExpanded={expandedEditions.has(edition.id)}
            onToggle={() => toggleEdition(edition.id)}
            expandedSegments={expandedSegments}
            onToggleSegment={toggleSegment}
          />
        ))}
      </div>
    </div>
  );
};

const EditionSection = ({ 
  edition, 
  editionIdx, 
  isExpanded, 
  onToggle, 
  expandedSegments, 
  onToggleSegment
}) => {
  const totalSegments = edition.segments?.length || 0;
  
  // Count total decodings from the actual data structure
  const totalDecodingsCount = edition.segments?.reduce((sum, seg) => {
    // Check multiple possible locations for candidates
    const candidates = seg.candidates || 
                      seg.decode_results?.final_ranking || 
                      [];
    return sum + candidates.length;
  }, 0) || 0;

  // Count high confidence decodings
  const highConfidenceCount = edition.segments?.reduce((sum, seg) => {
    const candidates = seg.candidates || 
                      seg.decode_results?.final_ranking || 
                      [];
    const highConf = candidates.filter(d => (d.confidence || 0) >= 70);
    return sum + highConf.length;
  }, 0) || 0;

  return (
    <div className="bg-gray-50">
      {/* Edition Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            editionIdx === 0 
              ? 'bg-amber-500 text-white shadow-lg' 
              : 'bg-blue-500 text-white'
          }`}>
            {editionIdx + 1}
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {edition.edition_name || edition.edition_id || 'Unknown Edition'}
              </h3>
              {edition.date && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {edition.date}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-semibold">{totalSegments} segments</span>
              <span className="text-purple-600 font-semibold">
                {totalDecodingsCount} total decodings
              </span>
              <span className="text-green-600 font-semibold">
                {highConfidenceCount} high confidence
              </span>
            </div>
          </div>
        </div>

        <ChevronDown 
          className={`w-6 h-6 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Segments */}
      {isExpanded && (
        <div className="px-6 pb-4 space-y-3">
          {edition.segments.map((segment, segmentIdx) => (
            <SegmentCard
              key={segment.segment_id}
              segment={segment}
              segmentIdx={segmentIdx}
              editionDate={edition.date}
              editionId={edition.id}
              isExpanded={expandedSegments.has(`${edition.id}-${segment.segment_id}`)}
              onToggle={() => onToggleSegment(`${edition.id}-${segment.segment_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SegmentCard = ({ 
  segment, 
  segmentIdx, 
  editionDate, 
  editionId,
  isExpanded, 
  onToggle
}) => {
  // Get ALL candidates from the data structure
  const allCandidates = segment.candidates || 
                       segment.decode_results?.final_ranking || 
                       [];
  
  const topResult = allCandidates[0] || {};
  const confidence = topResult.confidence || 0;
  const entities = topResult.entities || [];
  
  // Get method results for metadata
  const methodResults = segment.decode_results?.method_results || {};

  // Group candidates by method
  const candidatesByMethod = allCandidates.reduce((acc, candidate) => {
    const method = candidate.method || 'Unknown';
    if (!acc[method]) {
      acc[method] = [];
    }
    acc[method].push(candidate);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Segment Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-bold text-gray-900">
                {segment.segment_info?.name || segment.section_name || `Segment ${segmentIdx + 1}`}
              </h4>
              
              <ConfidenceBadge confidence={confidence} />
              
              {editionDate && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {editionDate}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {segment.segment_id}
              </span>
              <span className="font-semibold text-purple-600">
                {allCandidates.length} total decodings
              </span>
              {entities.length > 0 && (
                <span className="font-semibold text-green-600">
                  {entities.length} entities
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ChevronDown 
              className={`w-5 h-5 text-gray-600 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Top Result Preview */}
      {topResult.decoded_message && (
        <div className="px-4 py-3 bg-purple-50/50 border-b border-gray-200">
          <div className="flex items-start gap-2">
            <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-700">
                  TOP: {topResult.method}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                  Rank #{topResult.rank || 1}
                </span>
              </div>
              
              <p className="text-sm text-gray-900 leading-relaxed font-medium">
                {topResult.decoded_message}
              </p>

              {entities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entities.slice(0, 5).map((entity, idx) => {
                    const entityName = typeof entity === 'string' 
                      ? entity 
                      : entity.entity || entity.name || String(entity);
                    
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
                      >
                        {entityName}
                      </span>
                    );
                  })}
                  {entities.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      +{entities.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Content - ALL CANDIDATES */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4 bg-gray-50">
          {/* Original Text */}
          {(segment.segment_info?.segment_text_preview || segment.decode_results?.segment) && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Original Text
              </h5>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm text-gray-800 font-mono leading-relaxed">
                  {segment.segment_info?.segment_text_preview || segment.decode_results?.segment}
                </p>
              </div>
            </div>
          )}

          {/* Method Results Summary */}
          {Object.keys(methodResults).length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Methods Applied
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(methodResults).map(([method, result]) => {
                  const candidateCount = result.ai_qualified?.length || result.raw_candidates?.length || 0;
                  const status = result.status || 'UNKNOWN';
                  
                  return (
                    <div key={method} className="p-2 bg-white rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700 truncate">
                          {method}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          status === 'SUCCESS' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {candidateCount} candidates
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ALL DECODINGS - Grouped by Method */}
          <div>
            <h5 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              <List className="w-3 h-3" />
              All Decodings ({allCandidates.length})
            </h5>

            <div className="space-y-3">
              {Object.entries(candidatesByMethod).map(([method, candidates]) => (
                <div key={method} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                  {/* Method Header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">
                        {method}
                      </span>
                      <span className="text-xs text-gray-600 font-semibold">
                        {candidates.length} result{candidates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* All Candidates for this Method */}
                  <div className="divide-y divide-gray-200">
                    {candidates.map((candidate, idx) => (
                      <CandidateItem
                        key={idx}
                        candidate={candidate}
                        isTop={candidate.rank === 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Context (if available) */}
          {topResult.historical_context && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Historical Context
              </h5>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {topResult.historical_context}
                </p>
              </div>
            </div>
          )}

          {/* Academic Analysis (if available) */}
          {topResult.academic_analysis && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Award className="w-3 h-3" />
                Academic Analysis
              </h5>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {topResult.academic_analysis}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CandidateItem = ({ candidate, isTop }) => {
  const confidence = candidate.confidence || 0;
  const entities = candidate.entities || [];
  const rank = candidate.rank || 0;
  
  return (
    <div className={`p-3 ${isTop ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : 'bg-white hover:bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isTop 
              ? 'bg-amber-500 text-white shadow-sm' 
              : rank <= 3
              ? 'bg-blue-500 text-white'
              : rank <= 5
              ? 'bg-indigo-400 text-white'
              : 'bg-gray-300 text-gray-700'
          }`}>
            {rank}
          </span>
          {isTop && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          )}
        </div>
        <ConfidenceBadge confidence={confidence} small />
      </div>

      <p className="text-sm text-gray-900 leading-relaxed mb-2 pl-9">
        {candidate.decoded_message || 'No message'}
      </p>

      {entities.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-9 mb-2">
          {entities.slice(0, 5).map((entity, idx) => {
            const entityName = typeof entity === 'string' 
              ? entity 
              : entity.entity || entity.name || String(entity);
            
            return (
              <span
                key={idx}
                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
              >
                {entityName}
              </span>
            );
          })}
          {entities.length > 5 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              +{entities.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* AI Scores if available */}
      {(candidate.historical_plausibility || candidate.thematic_relevance || candidate.ai_confidence) && (
        <div className="flex flex-wrap gap-2 pl-9 text-xs text-gray-600">
          {candidate.ai_confidence && (
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              AI: {candidate.ai_confidence}%
            </span>
          )}
          {candidate.historical_plausibility && (
            <span>Historical: {candidate.historical_plausibility}%</span>
          )}
          {candidate.thematic_relevance && (
            <span>Thematic: {candidate.thematic_relevance}%</span>
          )}
        </div>
      )}
    </div>
  );
};

const ConfidenceBadge = ({ confidence, small = false }) => {
  const getColor = () => {
    if (confidence >= 70) return 'bg-green-100 text-green-700 border-green-300';
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const Icon = confidence >= 70 ? CheckCircle : AlertTriangle;

  return (
    <div className={`flex items-center gap-1 ${small ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full border ${getColor()}`}>
      <Icon className={small ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className={`${small ? 'text-xs' : 'text-sm'} font-bold`}>
        {Math.round(confidence)}%
      </span>
    </div>
  );
};

export default ResultCard;