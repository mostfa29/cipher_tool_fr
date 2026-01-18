import React, { useState, useEffect } from 'react';
import { 
  FileText, Trash2, FolderOpen, Calendar, Hash, 
  CheckCircle, Clock, Plus, Search, Filter, X,
  Download, Archive, Tag
} from 'lucide-react';
import { useAppState } from '../context/AppContext';

const SessionsManager = () => {
  const {
    listMiniMerlinSessions,
    deleteMiniMerlinSession,
    getMiniMerlinSession,
    exportMiniMerlinSession,
    addNotification
  } = useAppState();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'name', 'sentences'
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await listMiniMerlinSessions();
      setSessions(result.sessions || []);
    } catch (error) {
      addNotification('error', 'Failed to load sessions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;

    try {
      await deleteMiniMerlinSession(sessionId);
      await loadSessions();
      addNotification('success', 'Session deleted');
      
      if (selectedSession?.session_id === sessionId) {
        setSelectedSession(null);
        setShowDetails(false);
      }
    } catch (error) {
      addNotification('error', 'Failed to delete session: ' + error.message);
    }
  };

  const handleExportSession = async (sessionId, format = 'csv') => {
    try {
      await exportMiniMerlinSession(sessionId, format);
      addNotification('success', `Session exported as ${format.toUpperCase()}`);
    } catch (error) {
      addNotification('error', 'Export failed: ' + error.message);
    }
  };

  const handleViewDetails = async (sessionId) => {
    try {
      const result = await getMiniMerlinSession(sessionId);
      setSelectedSession(result.session);
      setShowDetails(true);
    } catch (error) {
      addNotification('error', 'Failed to load session details: ' + error.message);
    }
  };

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesText = session.original_text_preview?.toLowerCase().includes(search);
        const matchesSentence = session.sentences?.some(s => 
          s.name?.toLowerCase().includes(search) || 
          s.original_text?.toLowerCase().includes(search)
        );
        if (!matchesText && !matchesSentence) return false;
      }

      // Status filter
      if (filterStatus === 'active') {
        return session.sentences?.some(s => !s.solutions || s.solutions.length === 0);
      } else if (filterStatus === 'completed') {
        return session.sentences?.every(s => s.solutions && s.solutions.length > 0);
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at);
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'sentences':
          return (b.sentences?.length || 0) - (a.sentences?.length || 0);
        default:
          return 0;
      }
    });

  const getSessionStatus = (session) => {
    const sentences = session.sentences || [];
    const totalSentences = sentences.length;
    const solvedSentences = sentences.filter(s => s.solutions && s.solutions.length > 0).length;

    if (totalSentences === 0) return { status: 'empty', text: 'Empty', color: 'text-gray-400' };
    if (solvedSentences === totalSentences) return { status: 'completed', text: 'Completed', color: 'text-green-400' };
    if (solvedSentences > 0) return { status: 'in_progress', text: 'In Progress', color: 'text-yellow-400' };
    return { status: 'active', text: 'Active', color: 'text-blue-400' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Archive className="w-8 h-8 text-purple-400" />
                Session Manager
              </h1>
              <p className="text-purple-300 mt-1">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Sessions</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="name">Name</option>
              <option value="sentences">Most Sentences</option>
            </select>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            <p className="text-purple-300 mt-4">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
            <p className="text-purple-300 text-lg">No sessions found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => {
              const status = getSessionStatus(session);
              const sentences = session.sentences || [];
              const totalSentences = sentences.length;
              const solvedSentences = sentences.filter(s => s.solutions && s.solutions.length > 0).length;

              return (
                <div
                  key={session.session_id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all p-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white truncate">
                        {session.name || `Session ${session.session_id.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                        {totalSentences > 0 && (
                          <span className="text-xs text-purple-400">
                            {solvedSentences}/{totalSentences} solved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  {session.original_text_preview && (
                    <div className="mb-3 p-2 bg-black/20 rounded text-xs text-purple-200 font-mono truncate">
                      {session.original_text_preview}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-xs">
                      <div className="text-purple-400">Sentences</div>
                      <div className="text-white font-semibold">{totalSentences}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-purple-400">Notes</div>
                      <div className="text-white font-semibold">{session.notes_count || 0}</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-purple-400 mb-3 space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created: {new Date(session.created_at).toLocaleDateString()}
                    </div>
                    {session.updated_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated: {new Date(session.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(session.session_id)}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => handleExportSession(session.session_id, 'csv')}
                      className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors"
                      title="Export CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.session_id)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedSession.name || `Session ${selectedSession.session_id.slice(0, 8)}`}
                    </h2>
                    <p className="text-purple-300 text-sm mt-1">
                      {selectedSession.sentences?.length || 0} sentence{selectedSession.sentences?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedSession(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Session Info */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Session Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-purple-400">Created</div>
                      <div className="text-white">{new Date(selectedSession.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-purple-400">Last Updated</div>
                      <div className="text-white">{new Date(selectedSession.updated_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-purple-400">Total Notes</div>
                      <div className="text-white">{selectedSession.notes?.length || 0}</div>
                    </div>
                    <div>
                      <div className="text-purple-400">Session ID</div>
                      <div className="text-white font-mono text-xs">{selectedSession.session_id}</div>
                    </div>
                  </div>
                </div>

                {/* Sentences */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Sentences</h3>
                  {selectedSession.sentences?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSession.sentences.map((sentence) => (
                        <div
                          key={sentence.id}
                          className="p-4 bg-white/5 rounded-lg border border-purple-500/20"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{sentence.name}</h4>
                              <div className="text-xs text-purple-400 mt-1">
                                {sentence.pool_size} letters • {sentence.spoilage?.toFixed(1) || 0}% spoilage
                              </div>
                            </div>
                            {sentence.solutions && sentence.solutions.length > 0 && (
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">{sentence.solutions.length} solution{sentence.solutions.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                          {/* Original Text */}
                          <div className="mb-2">
                            <div className="text-xs text-purple-400 mb-1">Original Text:</div>
                            <div className="p-2 bg-black/20 rounded text-sm text-purple-200 font-mono">
                              {sentence.original_text}
                            </div>
                          </div>

                          {/* Scratch Pad */}
                          {sentence.scratch_pad && (
                            <div className="mb-2">
                              <div className="text-xs text-purple-400 mb-1">Scratch Pad:</div>
                              <div className="p-2 bg-black/20 rounded text-sm text-white font-mono">
                                {sentence.scratch_pad}
                              </div>
                            </div>
                          )}

                          {/* Solutions */}
                          {sentence.solutions && sentence.solutions.length > 0 && (
                            <div>
                              <div className="text-xs text-purple-400 mb-1">Solutions:</div>
                              <div className="space-y-2">
                                {sentence.solutions.map((solution) => (
                                  <div
                                    key={solution.id}
                                    className="p-2 bg-green-500/10 border border-green-500/20 rounded"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 font-mono text-sm text-white">
                                        {solution.text}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                                          {solution.type}
                                        </span>
                                        <span className="text-green-400">
                                          {solution.spoilage?.toFixed(1) || 0}% spoilage
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes for this sentence */}
                          {sentence.notes && sentence.notes.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-purple-400 mb-1">Notes:</div>
                              <div className="space-y-1">
                                {sentence.notes.map((note) => (
                                  <div
                                    key={note.id}
                                    className="text-xs text-purple-200 p-2 bg-black/20 rounded"
                                  >
                                    {note.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-purple-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No sentences in this session</p>
                    </div>
                  )}
                </div>

                {/* Global Notes */}
                {selectedSession.notes && selectedSession.notes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Session Notes</h3>
                    <div className="space-y-2">
                      {selectedSession.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-white/5 rounded-lg text-sm text-purple-200"
                        >
                          {note.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-purple-500/20 flex gap-3">
                <button
                  onClick={() => handleExportSession(selectedSession.session_id, 'csv')}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportSession(selectedSession.session_id, 'json')}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this session?')) {
                      handleDeleteSession(selectedSession.session_id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsManager;