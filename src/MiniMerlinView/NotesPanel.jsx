// components/MiniMerlin/NotesPanel.jsx

import React, { useState, useCallback, useMemo } from 'react';
import { FileText, Plus, Trash2, Clock, Tag, Edit2, Save, X, Search } from 'lucide-react';

/**
 * Research notes panel with tagging and search
 * Allows users to track promising words, patterns, and insights
 */
const NotesPanel = ({ 
  sessionId,
  notes,
  onAddNote,
  onDeleteNote,
  onUpdateNote 
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filterTag, setFilterTag] = useState(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter notes by search and tag
  const filteredNotes = useMemo(() => {
    let filtered = notes || [];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.text.toLowerCase().includes(lower) ||
        (note.tags || []).some(tag => tag.toLowerCase().includes(lower))
      );
    }

    if (filterTag) {
      filtered = filtered.filter(note =>
        (note.tags || []).includes(filterTag)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [notes, searchTerm, filterTag]);

  // Handle add note
  const handleAddNote = useCallback(() => {
    if (!newNoteText.trim()) return;

    const tags = newNoteTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onAddNote(sessionId, newNoteText, tags.length > 0 ? tags : null);

    setNewNoteText('');
    setNewNoteTags('');
  }, [sessionId, newNoteText, newNoteTags, onAddNote]);

  // Handle start edit
  const handleStartEdit = useCallback((note) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (!editText.trim()) return;
    
    onUpdateNote(sessionId, editingNoteId, editText);
    setEditingNoteId(null);
    setEditText('');
  }, [sessionId, editingNoteId, editText, onUpdateNote]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditText('');
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Research Notes
        </h3>
        
        {notes && notes.length > 0 && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            {filteredNotes.length} / {notes.length}
          </span>
        )}
      </div>

      {/* Add Note Form */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Add a note about promising words, patterns, or insights..."
          className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-sm"
        />
        
        <div className="flex items-center gap-2 mt-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={newNoteTags}
            onChange={(e) => setNewNoteTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
          />
        </div>
        
        <button
          onClick={handleAddNote}
          disabled={!newNoteText.trim()}
          className={`
            w-full mt-3 px-4 py-2 rounded-lg font-semibold text-sm transition-all
            ${!newNoteText.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }
          `}
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Add Note
        </button>
      </div>

      {/* Search & Filter */}
      {notes && notes.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
            />
          </div>
          
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600 font-semibold">Filter:</span>
              <button
                onClick={() => setFilterTag(null)}
                className={`
                  px-2 py-1 rounded text-xs font-semibold transition-all
                  ${!filterTag
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`
                    px-2 py-1 rounded text-xs font-semibold transition-all
                    ${filterTag === tag
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 transition-all group"
            >
              {editingNoteId === note.id ? (
                // Edit mode
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all"
                    >
                      <Save className="w-3 h-3 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-400 transition-all"
                    >
                      <X className="w-3 h-3 inline mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-900 flex-1 whitespace-pre-wrap">
                      {note.text}
                    </p>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(sessionId, note.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {note.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(note.timestamp)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="py-8 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No notes match your search</p>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No notes yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add notes to track promising words and patterns
          </p>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;