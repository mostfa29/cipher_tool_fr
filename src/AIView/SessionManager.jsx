import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Plus, Clock, FileText, Layers } from 'lucide-react';
import { useAppState } from '../context/AppContext';

const SessionManager = () => {
  const { 
    state, 
    createSession, 
    loadSession, 
    listSessions, 
    deleteSession,
    addNotification 
  } = useAppState();
  
  const [sessions, setSessions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionNotes, setNewSessionNotes] = useState('');

  useEffect(() => {
    loadSessionList();
  }, []);

  const loadSessionList = async () => {
    try {
      const sessionList = await listSessions();
      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      addNotification('error', 'Please enter a session name');
      return;
    }

    try {
      await createSession(newSessionName, newSessionNotes);
      setNewSessionName('');
      setNewSessionNotes('');
      setIsCreating(false);
      loadSessionList();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleLoadSession = async (sessionId) => {
    try {
      await loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this session?')) return;
    
    try {
      await deleteSession(sessionId);
      loadSessionList();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Research Sessions</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-white border-2 border-blue-200 rounded-xl">
          <h3 className="font-bold mb-3">Create New Session</h3>
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Session name..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg mb-3"
          />
          <textarea
            value={newSessionNotes}
            onChange={(e) => setNewSessionNotes(e.target.value)}
            placeholder="Notes (optional)..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg mb-3"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Save
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {sessions.map(session => (
          <div key={session.session_id} className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{session.name}</h3>
                <p className="text-sm text-gray-600">{session.work_title} by {session.author}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span><Layers className="w-3 h-3 inline mr-1" />{session.segment_count} segments</span>
                  <span><FileText className="w-3 h-3 inline mr-1" />{session.pattern_count} patterns</span>
                  <span><Clock className="w-3 h-3 inline mr-1" />{new Date(session.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadSession(session.session_id)}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSession(session.session_id)}
                  className="px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionManager;