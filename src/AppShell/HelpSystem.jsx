import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const HelpSystem = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

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

          <div className="flex flex-1 overflow-hidden">
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
{/* 
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
                      )} */}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
          'Select a text from Library, Upload a file, or Paste text',
          'Text automatically segments into 3-line pairs (or customize in Full Editor)',
          'Review segment statistics in the right sidebar',
          'Click "Proceed to Analysis" when ready',
          'Configure cipher methods and filters in Analyze tab',
          'Click "Start Analysis"',
          'View results in the Results tab',
        ],
      },
      {
        title: 'Understanding the Interface',
        content:
          'The tool has four main views accessible from the top navigation: Workspace (load & segment texts), Analyze (configure & run analysis), Results (browse patterns), and Library (manage sources). The interface is fully responsive and works on desktop, tablet, and mobile devices.',
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
          'You can load texts in three ways using the tabbed interface: Library (pre-loaded Elizabethan texts including Marlowe, Shakespeare, Spanish Tragedy, and KJV Bible), Upload (your own .txt, .rtf, or .doc files), or Paste (copy text directly into the tool).',
        tips: [
          'Use Quick Select buttons for instant access to popular texts',
          'Search library by title, author, or edition',
          'Filter by category to find specific types of works',
          'Uploaded files must be under 10MB',
        ],
      },
      {
        title: 'Automatic Segmentation',
        content:
          'When you load a text, it\'s automatically segmented into 3-line pairs ready for analysis. You can see segment statistics in the right sidebar including total count, valid segments, invalid segments, and validity percentage.',
        tips: [
          'Valid segments must have 50-1000 letters (updated from 20 minimum)',
          'Quick Actions in sidebar for fast re-segmentation',
          'Segments are saved automatically - no need to manually save',
        ],
      },
      {
        title: 'Split View vs Full Editor',
        content:
          'The Workspace offers two layouts: Split View (integrated experience with source picker, text display, and quick stats) and Full Editor (advanced segmentation tool with complete control). Toggle between them using the buttons in the header.',
        steps: [
          'Start in Split View to quickly load and preview text',
          'Use Quick Actions for rapid 3-line segmentation',
          'Switch to Full Editor for custom segmentation',
          'Full Editor offers 5 modes: by lines, by letters, by punctuation, by sentences, or manual',
        ],
      },
      {
        title: 'Full Editor - Advanced Segmentation',
        content:
          'The Full Editor provides powerful tools for precise text segmentation including automated modes, manual boundary control, merge mode, text selection segmentation, and real-time validation with quality scoring.',
        tips: [
          'Select text with cursor to create custom segments',
          'Click segment headers to select them',
          'Hover between lines to add/remove boundaries',
          'Use Merge Mode to combine multiple consecutive segments',
          'Undo/Redo support (Ctrl+Z / Ctrl+Y)',
          'Export segments to JSON for backup',
        ],
      },
      {
        title: 'Segmentation Modes',
        content:
          'Lines: Fixed number of lines per segment (1-10)\n\nLetters: Target letter count with optional auto-balancing (50-500)\n\nPunctuation: Splits at sentence endings (. ! ? ; :)\n\nSentences: Groups by sentence count (1-5)\n\nManual: Complete control - click to add/remove boundaries',
      },
      {
        title: 'Validation & Quality',
        content:
          'Each segment shows real-time validation status. Green = valid (50-1000 letters), Yellow = too short (<50 letters), Red = too long (>1000 letters). Quality score (0-100%) measures how close to ideal length (100 letters). Statistics show average quality across all segments.',
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
          'The tool supports 9 validated cipher methods from the Renaissance period. Each method has different success rates based on corpus analysis. Top 4 methods (Unusual Spelling, Nomenclator, Anagram, Caesar ROT-13) account for 75% of high-confidence findings.',
        tips: [
          'Start with "Top 4" for fastest results',
          'Enable all methods for comprehensive analysis',
          'Experimental methods may find rare patterns but take longer',
        ],
      },
      {
        title: 'View Modes',
        content:
          'View modes filter results based on thematic priorities:\n\nStandard Post-1593: Prioritizes Whitgift, hoohoo, Hen, de Vere (most common for mature work)\n\nJuvenilia Pre-1593: Prioritizes Roger Manwood, Cate, classical references (early work)\n\nAlt Cipher Mode: No thematic bias, pure statistical scoring\n\nShow Everything: Raw top results with no filtering',
        tips: [
          'Use Standard for plays and late poetry',
          'Use Juvenilia for Ovid translations and early work',
          'Use Alt Cipher when exploring unknown texts',
        ],
      },
      {
        title: 'Filters & Thresholds',
        content:
          'Spoilage tolerance controls unused letters percentage. Lower spoilage indicates cleaner encoding. Research shows 5-12% is typical for intentional encoding. Use entity search to find specific historical figures. Add word search to find thematic content. Set minimum composite score to filter low-quality results (70+ is high confidence).',
        tips: [
          'Typical spoilage: 5-20%',
          'Very low spoilage (<3%) may indicate cherry-picking',
          'Results per segment affects processing time (default: 100)',
        ],
      },
      {
        title: 'Running Analysis',
        content:
          'Analysis processes each valid segment through selected cipher methods. Progress shown in real-time with current segment, progress percentage, results found so far, and high-confidence count. Typical analysis: 20-60 seconds depending on segment count and methods.',
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
          'Each result shows a decoded pattern with multiple scoring dimensions. Composite score (0-100) combines entity recognition, linguistic coherence, statistical significance, and spoilage quality. Scores above 70 are high-confidence. Results display in cards with expandable details.',
      },
      {
        title: 'Score Breakdown',
        content:
          'Entity Score: Match quality with historical figures\n\nLinguistic Score: Grammatical coherence and semantic meaning\n\nStatistical Score: Letter frequency and distribution patterns\n\nSpoilage Score: Percentage of letters successfully used',
        tips: [
          'Focus on composite scores >70',
          'High entity scores suggest historical references',
          'Low spoilage + high scores = strong encoding',
        ],
      },
      {
        title: 'Result Cards',
        content:
          'Each result card shows the decoded pattern, composite score with visual indicator, segment information, spoilage percentage, detected entities, cipher method used, and expandable transformation log. Select multiple results using checkboxes for batch operations.',
      },
      {
        title: 'Filtering & Sorting',
        content:
          'Filter bar above results allows filtering by minimum score, cipher method, detected entities, and quick filters (high confidence only, low spoilage, specific themes). Sort results by any score dimension. Search within results using Ctrl+F.',
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
          'Export controls in header allow exporting to CSV, JSON, or copying to clipboard. Options include: all results or selected only, include transformation logs, include score breakdowns, and include segment text. Use exports for further analysis in spreadsheet software.',
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
          'The library contains 200+ pre-loaded Elizabethan texts organized by category: Marlowe Plays, Marlowe Poetry, Spanish Tragedy, Shakespeare Tragedies, Shakespeare Histories, Shakespeare Poetry, King James Bible, Other Poetry, Prose Works. Use search and category filters to find specific texts.',
        tips: [
          'Quick Select buttons for popular texts',
          'Search by title, author, or edition',
          'Each source shows character count and quality score',
        ],
      },
      {
        title: 'Source Management',
        content:
          'Each source card shows title, author, publication year, edition info, character count, and quality score (if available). Click a source to load it in Workspace. Sources are read-only but you can upload your own texts.',
      },
      {
        title: 'User Uploads',
        content:
          'Uploaded texts are stored in the "My Uploads" category. They persist in browser storage and can be used like library sources. Upload supports .txt, .rtf, and .doc files up to 10MB. Pasted texts also appear here.',
        tips: [
          'Remove modern editorial notes before upload',
          'Keep original spelling and punctuation',
          'Avoid texts with extensive corruption',
        ],
      },
    ],
  },

  // 'keyboard-shortcuts': {
  //   title: 'Keyboard Shortcuts',
  //   icon: '⌨️',
  //   sections: [
  //     {
  //       title: 'Global Shortcuts',
  //       shortcuts: [
  //         { action: 'Workspace', keys: 'Ctrl+1' },
  //         { action: 'Analyze', keys: 'Ctrl+2' },
  //         { action: 'Results', keys: 'Ctrl+3' },
  //         { action: 'Library', keys: 'Ctrl+4' },
  //         { action: 'Help', keys: 'F1' },
  //         { action: 'Toggle layout', keys: 'Ctrl+L' },
  //       ],
  //     },
  //     {
  //       title: 'Full Editor',
  //       shortcuts: [
  //         { action: 'Undo', keys: 'Ctrl+Z' },
  //         { action: 'Redo', keys: 'Ctrl+Y' },
  //         { action: 'Back to split view', keys: 'Esc' },
  //       ],
  //     },
  //     {
  //       title: 'Results View',
  //       shortcuts: [
  //         { action: 'Expand/collapse', keys: 'Space' },
  //         { action: 'Next result', keys: '↓' },
  //         { action: 'Previous result', keys: '↑' },
  //         { action: 'Search', keys: 'Ctrl+F' },
  //       ],
  //     },
  //     {
  //       title: 'Analysis',
  //       shortcuts: [
  //         { action: 'Start', keys: 'Enter' },
  //         { action: 'Pause', keys: 'Space' },
  //         { action: 'Cancel', keys: 'Esc' },
  //       ],
  //     },
  //   ],
  // },

  faq: {
    title: 'FAQ',
    icon: '❓',
    sections: [
      {
        title: 'What is cipher deciphering?',
        content:
          'Cipher deciphering detects hidden messages encoded in literary texts using Renaissance cryptographic methods. This research, pioneered by Roberta, suggests Marlowe systematically encoded autobiographical and historical information in his works and possibly others attributed to Shakespeare.',
      },
      {
        title: 'How accurate are the results?',
        content:
          'High-confidence results (composite score >70) have been validated against 45 years of manual research. The tool uses statistical methods to avoid false positives. Always verify interesting patterns by checking transformation logs and understanding the cipher method used.',
      },
      {
        title: 'What makes a segment valid?',
        content:
          'Valid segments have 50-1000 letters. This range was updated from the original 20 minimum to improve quality. Segments outside this range are flagged as invalid and excluded from analysis. The Full Editor shows real-time validation for all segments.',
      },
      {
        title: 'What is spoilage?',
        content:
          'Spoilage is the percentage of letters that couldn\'t be used in the decoded pattern. Lower spoilage suggests more systematic encoding. Research shows 5-12% is typical for intentional ciphers, while random anagrams average 30-40%. Very low spoilage (<3%) may indicate cherry-picking.',
      },
      {
        title: 'Why use different view modes?',
        content:
          'View modes prioritize different thematic content. Standard Post-1593 focuses on mature work themes (Whitgift, court figures). Juvenilia Pre-1593 focuses on early work (Roger Manwood, classical references). Alt Cipher uses pure statistical scoring. Show Everything displays raw results.',
      },
      {
        title: 'Can I analyze modern texts?',
        content:
          'The tool is optimized for Elizabethan English and Renaissance cipher methods. Modern texts will produce results but are unlikely to show systematic encoding patterns. Entity recognition is calibrated for 16th-17th century historical figures.',
      },
      {
        title: 'How do I create custom segments?',
        content:
          'Use the Full Editor (click "Open Full Editor" in Workspace). You can: select text with cursor to create segments, use automated modes (lines, letters, punctuation, sentences), manually click between lines to add/remove boundaries, or use Merge Mode to combine segments.',
      },
    ],
  },

  troubleshooting: {
    title: 'Troubleshooting',
    icon: '🔧',
    sections: [
      {
        title: 'No segments appearing',
        content:
          'If you load a text but see no segments: Check that text actually loaded (view character count). Segments auto-generate on load. If missing, use Quick Actions "Quick Segment (3 lines)" in sidebar. For custom segmentation, open Full Editor.',
      },
      {
        title: 'All segments invalid',
        content:
          'If all segments show as invalid: Check segment lengths - must be 50-1000 letters. Short texts may need fewer lines per segment. Long poetic lines may need more lines. Use Full Editor to adjust segmentation mode or manually create boundaries.',
      },
      {
        title: 'Analysis takes too long',
        content:
          'To speed up analysis: Reduce segment count using Quick Actions. Select fewer cipher methods (use "Top 4"). Increase spoilage tolerance. Lower "Results Per Segment" in filters. Analyze sections of long texts separately.',
      },
      {
        title: 'Results seem random',
        content:
          'Random-looking results may indicate: Very high spoilage (>20%), Low composite scores (<50), No entity matches, Inconsistent patterns across segments. Focus on high-confidence results and look for patterns across multiple segments.',
      },
      {
        title: 'Can\'t switch to Full Editor',
        content:
          'If Full Editor button doesn\'t work: Ensure text is fully loaded. Check browser console for errors. Try reloading the page. If problem persists, use Quick Actions in sidebar for basic segmentation.',
      },
      {
        title: 'Lost my segments',
        content:
          'Segments are saved automatically when you navigate away from Workspace. If segments seem lost: Return to Workspace. Check if correct source is selected. Segments regenerate if missing. For custom segments, you may need to recreate them in Full Editor.',
      },
    ],
  },
};

export default HelpSystem;