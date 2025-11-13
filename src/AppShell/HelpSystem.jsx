// components/HelpSystem.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const HelpSystem = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchContent(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchContent = (query) => {
    const lowerQuery = query.toLowerCase();
    const results = [];

    Object.entries(helpContent).forEach(([tabId, tab]) => {
      tab.sections.forEach((section) => {
        if (
          section.title.toLowerCase().includes(lowerQuery) ||
          section.content.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            tabId,
            tabTitle: tab.title,
            sectionTitle: section.title,
            content: section.content,
          });
        }
      });
    });

    return results;
  };

  const handleSearchResultClick = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!isOpen) return null;

  const currentContent = helpContent[activeTab];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 id="help-title" className="text-xl font-semibold text-gray-900">
                Help & Documentation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help topics..."
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result.tabId)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {result.sectionTitle}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        in {result.tabTitle}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <nav className="p-4 space-y-1">
                {Object.entries(helpContent).map(([tabId, tab]) => (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${
                        activeTab === tabId
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="text-sm">{tab.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">{currentContent.icon}</span>
                  {currentContent.title}
                </h3>

                <div className="space-y-6">
                  {currentContent.sections.map((section, index) => (
                    <section key={index} className="pb-6 border-b border-gray-200 last:border-b-0">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {section.title}
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-600">
                        {section.content.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.steps && (
                        <ol className="mt-4 space-y-3">
                          {section.steps.map((step, sIndex) => (
                            <li key={sIndex} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                                {sIndex + 1}
                              </span>
                              <span className="text-gray-700 pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}

                      {section.tips && (
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex gap-2">
                            <svg
                              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                            <div className="text-sm text-amber-800">
                              <p className="font-medium mb-1">💡 Tips:</p>
                              <ul className="space-y-1 list-disc list-inside">
                                {section.tips.map((tip, tIndex) => (
                                  <li key={tIndex}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {section.shortcuts && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            ⌨️ Keyboard Shortcuts:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {section.shortcuts.map((shortcut, scIndex) => (
                              <div
                                key={scIndex}
                                className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                              >
                                <span className="text-sm text-gray-600">{shortcut.action}</span>
                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
                                  {shortcut.keys}
                                </kbd>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Need more help?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact Support
              </a>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

HelpSystem.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Help Content
const helpContent = {
  'getting-started': {
    title: 'Getting Started',
    icon: '🚀',
    sections: [
      {
        title: 'Welcome to Cipher Deciphering Tool',
        content:
          'This tool helps you analyze Elizabethan texts for hidden cipher patterns using proven Renaissance cryptographic methods. Based on Roberta\'s research, it detects systematic encoding in works attributed to Marlowe, Shakespeare, and their contemporaries.',
      },
      {
        title: 'Quick Start Guide',
        content: 'Follow these steps to run your first analysis:',
        steps: [
          'Navigate to the Workspace tab',
          'Load a text (upload, select from library, or paste)',
          'Choose how to segment the text (default: 2-line pairs)',
          'Click "Continue to Analysis"',
          'Select cipher methods (default: top 4 methods)',
          'Click "Start Analysis"',
          'Browse results in the Results tab',
        ],
      },
      {
        title: 'Understanding the Interface',
        content:
          'The tool has four main views: Workspace (load texts), Analyze (configure analysis), Results (browse patterns), and Library (manage sources). Navigation is always available at the top of the screen.',
      },
    ],
  },

  workspace: {
    title: 'Workspace',
    icon: '📝',
    sections: [
      {
        title: 'Loading Source Texts',
        content:
          'You can load texts in three ways: upload a file (.txt), select from the pre-loaded library of Elizabethan texts, or paste text directly. The library includes major works by Marlowe, Shakespeare, and contemporaries.',
        tips: [
          'Use library sources for the most reliable results',
          'Uploaded texts should be plain text format',
          'Remove modern editorial notes before analysis',
        ],
      },
      {
        title: 'Text Segmentation',
        content:
          'Segmentation divides your text into analyzable chunks. Different types of encoding work best with different segment sizes.',
        steps: [
          'Choose a segmentation mode (2-line pairs, titles, first 2 lines, by clause, or custom)',
          'Preview the segments to verify they make sense',
          'Adjust if needed - you can manually mark boundaries',
          'Each segment will be analyzed independently',
        ],
        tips: [
          '2-line pairs work well for poetry and plays',
          'Title-only mode is fastest for initial exploration',
          'For prose, try clause-based segmentation',
        ],
      },
      {
        title: 'Edition Comparison',
        content:
          'Enable comparison mode to analyze multiple editions side-by-side. This reveals how textual corruption affects cipher detection. Differences between editions are automatically highlighted.',
        tips: [
          'Compare "bad" quartos with "good" quartos',
          'Look for patterns that survive textual corruption',
          'Use to identify intentional vs. accidental variants',
        ],
      },
    ],
  },

  analyze: {
    title: 'Analyze',
    icon: '🔍',
    sections: [
      {
        title: 'Cipher Methods',
        content:
          'The tool supports 9 validated cipher methods from the Renaissance period. Each method has a different success rate based on corpus analysis. The top 4 methods (Unusual Spelling, Nomenclator, Anagram, Caesar ROT-13) account for 75% of high-confidence findings.',
        tips: [
          'Start with "Top 4" for fastest results',
          'Enable all methods for comprehensive analysis',
          'Experimental methods are slower but may find rare patterns',
        ],
      },
      {
        title: 'View Modes',
        content:
          'View modes filter results based on thematic priorities:\n\nStandard Post-1593: Prioritizes Whitgift, hoohoo, Hen, de Vere (most common for mature work)\n\nJuvenilia Pre-1593: Prioritizes Roger Manwood, Cate, classical references (early work)\n\nAlt Cipher Mode: No thematic bias, pure statistical scoring\n\nShow Everything: Raw top 500 results with no filtering',
        tips: [
          'Use Standard for plays and late poetry',
          'Use Juvenilia for Ovid translations and early work',
          'Use Alt Cipher when exploring unknown texts',
        ],
      },
      {
        title: 'Filters & Thresholds',
        content:
          'Spoilage tolerance controls how much "unused" letters are acceptable. Lower spoilage indicates cleaner encoding. Research shows 5-12% is typical for intentional encoding.',
        steps: [
          'Set spoilage tolerance (0-40%)',
          'Add entity search to find specific people',
          'Add word search to find specific themes',
          'Use exclusions to filter out unwanted patterns',
        ],
        tips: [
          'Titles average 6.2% spoilage',
          'Body text averages 9.1% spoilage',
          'Very low spoilage (<3%) may indicate cherry-picking',
        ],
      },
      {
        title: 'Running Analysis',
        content:
          'Analysis processes each segment through selected cipher methods. Progress is shown in real-time. Typical analysis takes 20-60 seconds depending on segment count and methods selected.',
        shortcuts: [
          { action: 'Start analysis', keys: 'Enter' },
          { action: 'Pause', keys: 'Space' },
          { action: 'Cancel', keys: 'Esc' },
        ],
      },
    ],
  },

  results: {
    title: 'Results',
    icon: '📊',
    sections: [
      {
        title: 'Understanding Results',
        content:
          'Each result shows a decoded pattern with multiple scoring dimensions. Composite score (0-100) combines entity recognition, linguistic coherence, statistical significance, and spoilage quality. Scores above 70 are considered high-confidence.',
      },
      {
        title: 'Score Breakdown',
        content:
          'Entity Score: How well entities match historical figures\n\nLinguistic Score: Grammatical coherence and semantic meaning\n\nStatistical Score: Letter frequency and distribution patterns\n\nSpoilage Score: Percentage of letters successfully used',
        tips: [
          'Focus on patterns with composite scores >70',
          'High entity scores suggest historical references',
          'Low spoilage with high scores indicates strong encoding',
        ],
      },

      {
        title: 'Transformation Log',
        content:
          'Expand any result to see the step-by-step transformation from original text to decoded pattern. This shows normalization (long s, ligatures), letter inventory, permutation count, and final matching.',
      },
      {
        title: 'Sorting & Filtering',
        content:
          'Results can be sorted by any score dimension. Filter by minimum score, cipher method or detected entities. Use quick filters for common views like "High confidence only".',
        shortcuts: [
          { action: 'Expand result', keys: 'Space' },
          { action: 'Next result', keys: '↓' },
          { action: 'Previous result', keys: '↑' },
          { action: 'Search results', keys: 'Ctrl+F' },
        ],
      },
      {
        title: 'Exporting Results',
        content:
          'Export results to CSV, JSON, or Google Sheets. Options include transformation logs and score breakdowns. Selected patterns can be batch exported. Use exports for further analysis in spreadsheet software.',
      },
    ],
  },

  library: {
    title: 'Library',
    icon: '📚',
    sections: [
      {
        title: 'Source Library',
        content:
          'The library contains 200+ pre-loaded Elizabethan texts including Marlowe plays and poetry, Shakespeare quartos, Spanish Tragedy, King James Bible, and other period works. Sources are organized by author and category.',
        tips: [
          'Use search to quickly find texts',
          'Compare different editions of the same work',
          'Metadata shows source authority and quality scores',
        ],
      },
      {
        title: 'Saved Sessions',
        content:
          'Every analysis is automatically saved as a session. Sessions preserve your source text, segmentation, configuration, and results. Restore any session to continue working or export historical data.',
        steps: [
          'Sessions save automatically after each analysis',
          'Click "Restore" to load a previous session',
          'Export sessions to backup your work',
          'Delete old sessions to free up storage',
        ],
      },
      {
        title: 'Uploading Custom Texts',
        content:
          'Upload your own texts for analysis. Supported formats include .txt, .rtf, and .doc. Remove modern editorial content for best results. Large files may take longer to process.',
      },
    ],
  },

  'keyboard-shortcuts': {
    title: 'Keyboard Shortcuts',
    icon: '⌨️',
    sections: [
      {
        title: 'Global Shortcuts',
        shortcuts: [
          { action: 'Workspace', keys: 'Ctrl+1' },
          { action: 'Analyze', keys: 'Ctrl+2' },
          { action: 'Results', keys: 'Ctrl+3' },
          { action: 'Library', keys: 'Ctrl+4' },
          { action: 'Settings', keys: 'Ctrl+,' },
          { action: 'Help', keys: 'F1' },
          { action: 'Save session', keys: 'Ctrl+S' },
          { action: 'New analysis', keys: 'Ctrl+N' },
        ],
      },
      {
        title: 'Results View',
        shortcuts: [
          { action: 'Expand/collapse', keys: 'Space' },
          { action: 'Next result', keys: '↓' },
          { action: 'Previous result', keys: '↑' },
          { action: 'Search', keys: 'Ctrl+F' },
          { action: 'Export', keys: 'Ctrl+E' },
        ],
      },
      {
        title: 'Analysis',
        shortcuts: [
          { action: 'Start', keys: 'Enter' },
          { action: 'Pause', keys: 'Space' },
          { action: 'Cancel', keys: 'Esc' },
        ],
      },
    ],
  },

  faq: {
    title: 'FAQ',
    icon: '❓',
    sections: [
      {
        title: 'What is cipher deciphering?',
        content:
          'Cipher deciphering detects hidden messages encoded in literary texts using Renaissance cryptographic methods. This research, pioneered by Roberta, suggests Marlowe systematically encoded autobiographical and historical information in his works.',
      },
      {
        title: 'How accurate are the results?',
        content:
          'High-confidence results (composite score >70) have been validated against Roberta\'s 45 years of manual research. The tool uses statistical methods to avoid false positives. Always verify interesting patterns by checking transformation logs.',
      },
      {
        title: 'What is spoilage?',
        content:
          'Spoilage is the percentage of letters in the original segment that couldn\'t be used in the decoded pattern. Lower spoilage suggests more systematic encoding. Research shows 5-12% is typical for intentional ciphers, while random anagrams average 30-40%.',
      },
      {
        title: 'Why do some analyses take longer?',
        content:
          'Processing time depends on: number of segments, cipher methods selected, and filter complexity. Large texts with all methods enabled may take 5-10 minutes. Use "Top 4" methods for faster results.',
      },
      {
        title: 'Can I analyze modern texts?',
        content:
          'The tool is optimized for Elizabethan English and Renaissance cipher methods. Modern texts will produce results but are unlikely to show systematic encoding patterns. Entity recognition is calibrated for 16th-17th century historical figures.',
      },

    ],
  },

  troubleshooting: {
    title: 'Troubleshooting',
    icon: '🔧',
    sections: [
      {
        title: 'No results found',
        content:
          'If analysis completes but finds no patterns, try: lowering spoilage tolerance, enabling more cipher methods, using different segmentation, or removing entity/word filters. Some texts may not contain systematic encoding.',
      },
      {
        title: 'Analysis is very slow',
        content:
          'Reduce segment count by using title-only mode, select fewer cipher methods (use "Top 4"), or increase spoilage tolerance to reduce computation. You can also analyze sections of long texts separately.',
      },
      {
        title: 'Results seem random',
        content:
          'Very high spoilage (>20%), low composite scores (<50), or lack of entity matches suggest random anagrams rather than systematic encoding. Focus on high-confidence results and look for patterns across multiple segments.',
      },
      {
        title: 'Can\'t load a text',
        content:
          'Ensure files are plain text format (.txt). Remove special characters, formatting, and editorial notes. Very large files (>1MB) may timeout - try analyzing sections separately.',
      },
      {
        title: 'Settings not saving',
        content:
          'Check browser localStorage is enabled. Clear browser cache if settings appear corrupted. Settings are stored locally and won\'t sync across devices.',
      },
    ],
  },
};

export default HelpSystem;