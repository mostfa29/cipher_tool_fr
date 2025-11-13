Cipher Deciphering Tool - Frontend System Design
Design Philosophy: KISS + DRY + Lean
Core Principles:

Single-page application (SPA) with React
Maximum 8-10 major components (not hundreds)
Component reuse everywhere
Mock data layer that mirrors future API exactly
Progressive disclosure (simple by default, power features on demand)
Mobile-first responsive design


INFORMATION ARCHITECTURE
Page Structure (5 Main Views)
┌─────────────────────────────────────────────────────────────┐
│                    APP SHELL (Persistent)                   │
│  ┌────────────┬────────────┬────────────┬──────────────┐   │
│  │ Workspace  │  Analyze   │  Results   │  Library     │   │
│  │  (active)  │            │            │              │   │
│  └────────────┴────────────┴────────────┴──────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ View 1  │   │ View 2  │   │ View 3  │   │ View 4  │
    │WORKSPACE│   │ ANALYZE │   │ RESULTS │   │ LIBRARY │
    └─────────┘   └─────────┘   └─────────┘   └─────────┘
Navigation Tabs:

Workspace - Load text, prepare segments
Analyze - Configure and run analysis
Results - Browse decoded patterns
Library - Manage saved work and sources


VIEW 1: WORKSPACE (Text Loading & Preparation)
Purpose
Load texts, segment them intelligently, prepare for analysis
Layout
┌─────────────────────────────────────────────────────────────┐
│                        WORKSPACE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐│
│  │  SOURCE PICKER   │  │    TEXT DISPLAY & SEGMENTATION  ││
│  │                  │  │                                   ││
│  │  • Upload File   │  │  [Original text loads here]      ││
│  │  • Library       │  │                                   ││
│  │  • Paste Text    │  │  Line 1: To be or not to be      ││
│  │                  │  │  Line 2: That is the question    ││
│  │  Quick Select:   │  │                                   ││
│  │  ▸ Faustus A1    │  │  [Segmentation visualization]    ││
│  │  ▸ Spanish Trag  │  │                                   ││
│  │  ▸ Hamlet Q1     │  │  Segment 1: Lines 1-2 ✓          ││
│  │  ▸ KJV Bible     │  │  Segment 2: Lines 3-4 ✓          ││
│  │                  │  │                                   ││
│  └──────────────────┘  │  [Manual segment controls]       ││
│                        └─────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           SEGMENTATION OPTIONS                          ││
│  │  ○ Auto-segment: [2-line pairs ▼]                      ││
│  │  ○ Manual: Click to mark segment boundaries            ││
│  │  ○ By clause (punctuation-based)                       ││
│  │  ○ Custom: Every [5] lines                             ││
│  │                                                         ││
│  │  [Preview Segments] [Clear All] [Continue to Analysis] ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
Key Actions
1. Source Loading (3 Methods)

Upload: Drag-drop .txt files
Library: Quick-select from preloaded corpus (Marlowe, Shakespeare, Bible)
Paste: Direct text entry for quick tests

2. Intelligent Segmentation

Auto-segment: Dropdown with presets

2-line pairs (default for poetry)
Titles only (extract just title text)
First 2 lines of each section
By clause (punctuation-based)
Custom: Every N lines


Manual mode: Click between lines to create boundaries
Preview: Shows segment count, average length, letter inventory per segment

3. Edition Comparison (Power Feature)

Toggle: "Compare multiple editions"
Side-by-side display
Differences highlighted in color
Creates paired segments automatically

Component Reuse Strategy
<SourcePicker />         # Used in Workspace + Library
<TextDisplay />          # Used in Workspace + Results (to show original)
<SegmentControls />      # Used in Workspace + Analyze

VIEW 2: ANALYZE (Configuration & Execution)
Purpose
Configure cipher methods, filters, and run analysis
Layout
┌─────────────────────────────────────────────────────────────┐
│                         ANALYZE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SEGMENTS READY: 47 segments from "Faustus A1"       │  │
│  │  Total letters: 12,847 | Avg per segment: 273        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────────────┐ ┌───────────────────┐  │
│  │   CIPHER METHODS               │ │  VIEW MODE        │  │
│  │                                │ │                   │  │
│  │  ☑ Unusual Spelling (2.25%)   │ │  ⦿ Standard       │  │
│  │  ☑ Nomenclator (2.03%)        │ │     Post-1593     │  │
│  │  ☑ Anagram (0.64%)            │ │                   │  │
│  │  ☑ Caesar ROT-13 (0.35%)      │ │  ○ Juvenilia      │  │
│  │  ☐ Caesar ROT-3               │ │     Pre-1593      │  │
│  │  ☐ Caesar ROT-23              │ │                   │  │
│  │  ☐ Pig Latin (us-suffix)      │ │  ○ Alt Cipher     │  │
│  │  ☐ Pig Latin (ay-suffix)      │ │     Mode          │  │
│  │  ☐ Letter Doubling            │ │                   │  │
│  │                                │ │  ○ Show           │  │
│  │  [Select All] [Select Top 4]  │ │     Everything    │  │
│  │                                │ │                   │  │
│  └────────────────────────────────┘ └───────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  FILTERS & THRESHOLDS                                   ││
│  │                                                         ││
│  │  Spoilage Tolerance: [━━━━●━━━━━] 0-15%                ││
│  │  Quick presets: [0%] [0-5%] [5-20%] [20-40%] [40%+]    ││
│  │                                                         ││
│  │  Entity Search (optional):                              ││
│  │  [Whitgift         ▼] [+ Add Entity]                   ││
│  │                                                         ││
│  │  Word/String Search:                                    ││
│  │  Contains: [torture    ] [+ Add Word]                   ││
│  │  Must NOT contain: [           ] [+ Add Exclusion]      ││
│  │                                                         ││
│  │  Results per segment: [100 ▼]                           ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📊 ESTIMATED TIME: ~23 seconds (47 segments × 0.5s)   ││
│  │                                                         ││
│  │           [START ANALYSIS]                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
Key Actions
1. Method Selection

Checkboxes with success rates visible
Quick presets:

"Top 4" (highest success rates)
"All validated" (9 methods)
"Experimental" (research methods)


Tooltip on each method: historical context, when to use

2. View Mode Toggle (Critical Feature)

Standard Post-1593: Prioritizes Whitgift, hoohoo, Hen, de Vere
Juvenilia Pre-1593: Prioritizes Roger Manwood, Cate, classical refs
Alt Cipher Mode: No thematic bias, pure statistical scoring
Show Everything: Raw top 500, no filtering

3. Filters (Collapsible Power Features)

Spoilage slider: Visual with percentage display
Entity search: Autocomplete from entity dictionary
Word search: AND/OR logic, wildcard support
Exclusions: "Find anything BUT hoohoo"

4. Real-Time Estimation

Shows: segment count × avg time per segment
Updates when filters change
Warns if configuration might take >5 minutes

5. Progress Tracking (During Analysis)

Progress bar with percentage
Current segment indicator
Elapsed time / estimated remaining
"Pause" and "Cancel" options
Live preview: "Found 23 high-confidence results so far..."

Component Reuse
<MethodSelector />      # Reusable checkbox grid
<FilterPanel />         # Collapsible filter controls
<ProgressTracker />     # Used here + Results view for re-analysis

VIEW 3: RESULTS (Browse & Explore Decoded Patterns)
Purpose
Display decoded patterns with sorting, filtering, interactive exploration
Layout
┌─────────────────────────────────────────────────────────────┐
│                         RESULTS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ANALYSIS COMPLETE: "Faustus A1" - 47 segments       │  │
│  │  412 patterns found | 89 high-confidence (>70)       │  │
│  │  ⭐ 23 matches with Roberta's vault                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────┬──────────────────────────────────────┐ │
│  │  FILTER BAR    │  Sort: [Composite Score ▼]          │ │
│  │                │  View: [All] [>90] [>70] [>50]      │ │
│  │  Min Score:    │                                      │ │
│  │  [━━━━●━━━━━]  │  [Export CSV] [Save Session]        │ │
│  │  70+           │                                      │ │
│  │                │                                      │ │
│  │  Methods:      │                                      │ │
│  │  ☑ Anagram     │                                      │ │
│  │  ☑ Unusual Sp. │                                      │ │
│  │  ☑ Nomenclator │                                      │ │
│  │                │                                      │ │
│  │  Entities:     │                                      │ │
│  │  ☑ Whitgift    │                                      │ │
│  │  ☐ Hen         │                                      │ │
│  │  ☐ Marina      │                                      │ │
│  └────────────────┴──────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  RESULT CARD (Repeated for each pattern)               ││
│  │                                                         ││
│  │  Rank #1 | Segment 3 (Lines 5-6) | Score: 94/100      ││
│  │  Method: Anagram | Spoilage: 3.2%                      ││
│  │                                                         ││
│  │  📝 DECODED:                                            ││
│  │  "Whitgift tortured Roger Manwood anal lance lathe"    ││
│  │                                                         ││
│  │  📖 ORIGINAL SEGMENT:                                   ││
│  │  "The tragicall historie of Doctor Faustus..."         ││
│  │                                                         ││
│  │  🏷️ ENTITIES: Whitgift (98%), Roger Manwood (95%)      ││
│  │  🎯 THEMES: persecution, torture, imprisonment          ││
│  │                                                         ││
│  │  ⭐ ROBERTA MATCH: Page 47 (1987)                       ││
│  │     "Whitgift threatened Roger Manwood with prison"    ││
│  │     Similarity: 92% | [View Details]                   ││
│  │                                                         ││
│  │  📊 SCORE BREAKDOWN:                                    ││
│  │  Entity Score:     92/100 ████████████████████▌        ││
│  │  Linguistic:       87/100 ████████████████████         ││
│  │  Statistical:      96/100 █████████████████████        ││
│  │  Spoilage:         97/100 █████████████████████        ││
│  │                                                         ││
│  │  [▼ Show Transformation Log] [Export] [Flag for Review]││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Collapsible Transformation Log when expanded:]           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  TRANSFORMATION STEPS:                                  ││
│  │  1. Original: "The tragicall hiſtorie of D. Fauſtus"   ││
│  │  2. Long s normalized: "The tragicall historie..."     ││
│  │  3. Ligatures expanded: ff→ff, fi→fi                   ││
│  │  4. Letter inventory: {t:5, h:3, e:3, r:3, ...}        ││
│  │  5. Anagram generation: 847 permutations tested        ││
│  │  6. Top match: "Whitgift tortured Roger..."            ││
│  │  7. Unused letters: "i, o" (3.2% spoilage)             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Load More Results] (pagination or infinite scroll)        │
└─────────────────────────────────────────────────────────────┘
Key Actions
1. Sorting & Filtering

Sort by: Composite score, Entity score, Statistical score, Spoilage
Filter by: Score threshold, Method, Entity, Spoilage range
Quick filters: "High confidence only" (>90), "Roberta matches only"

2. Result Card Interactions

Expand/Collapse: Show/hide transformation log
Export individual: Save as text, JSON, or add to research notes
Flag for review: Mark interesting patterns for later
Compare variants: If multiple editions, show side-by-side

3. Roberta Vault Integration Display

When match found, show preview
Click to view full Roberta page
Similarity percentage
Cross-reference to other related findings

4. Interactive Score Breakdown

Visual bars for each score component
Tooltip explains scoring logic
Click to see detailed calculation

5. Batch Actions

Select multiple results (checkboxes)
Bulk export to CSV/Google Sheets
Bulk flagging
Compare selected patterns

Component Reuse
<ResultCard />          # Repeated component for each pattern
<ScoreBreakdown />      # Reused in multiple views
<TransformationLog />   # Collapsible detail component
<FilterBar />           # Similar to Analyze view filters

VIEW 4: LIBRARY (Manage Sources & Saved Sessions)
Purpose
Organize pre-loaded texts, saved analyses, research notes
Layout
┌─────────────────────────────────────────────────────────────┐
│                         LIBRARY                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┬──────────────────────────────────────┐ │
│  │  CATEGORIES    │  CORPUS SOURCES (200+ texts)         │ │
│  │                │                                       │ │
│  │  ▸ Marlowe     │  Search: [faustus          ]  [🔍]   │ │
│  │    ▪ Plays     │                                       │ │
│  │    ▪ Poetry    │  ┌─────────────────────────────────┐ │ │
│  │                │  │ Doctor Faustus A-text (1604)    │ │ │
│  │  ▸ Shakespeare │  │ 📄 12,847 characters            │ │ │
│  │    ▪ Tragedies │  │ [Quick Load] [View Metadata]    │ │ │
│  │    ▪ Comedies  │  └─────────────────────────────────┘ │ │
│  │    ▪ Histories │                                       │ │
│  │                │  ┌─────────────────────────────────┐ │ │
│  │  ▸ Spanish Tr. │  │ Doctor Faustus B-text (1616)    │ │ │
│  │                │  │ 📄 15,231 characters            │ │ │
│  │  ▸ King James  │  │ [Quick Load] [Compare with A1]  │ │ │
│  │    Bible       │  └─────────────────────────────────┘ │ │
│  │                │                                       │ │
│  │  ▸ My Uploads  │  ┌─────────────────────────────────┐ │ │
│  │  ▸ Saved       │  │ Spanish Tragedy Q1 (1592)       │ │ │
│  │    Sessions    │  │ 📄 18,492 characters            │ │ │
│  │                │  │ [Quick Load] [View Metadata]    │ │ │
│  └────────────────┤  └─────────────────────────────────┘ │ │
│                   │                                       │ │
│                   │  [Pagination: 1 2 3 ... 47]          │ │
│                   └───────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  SAVED SESSIONS                                         ││
│  │                                                         ││
│  │  Session: "Faustus Complete Analysis" (Nov 10, 2025)   ││
│  │  47 segments | 412 results | 89 high-confidence        ││
│  │  [Restore] [Export] [Delete]                           ││
│  │                                                         ││
│  │  Session: "Spanish Tragedy Titles" (Nov 8, 2025)       ││
│  │  12 segments | 87 results | 34 high-confidence         ││
│  │  [Restore] [Export] [Delete]                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
Key Actions
1. Source Management

Browse by category/author
Search across all sources
View metadata: edition, publication year, source authority
Quick-load to Workspace
Compare editions (creates paired analysis)

2. Session Management

Auto-save every analysis
Name and organize sessions
Restore previous work (segments + configuration + results)
Export session data (JSON, CSV)
Delete old sessions

3. Upload & Import

Upload new texts (.txt, .rtf, .doc)
Import previous analysis (JSON)
Batch upload multiple files

Component Reuse
<SourceCard />          # Reused for each text in library
<SessionCard />         # Reused for saved analyses
<SearchBar />           # Reused across views

GLOBAL COMPONENTS (Used Across Views)
1. App Shell
┌─────────────────────────────────────────────────────────────┐
│  [LOGO] Cipher Deciphering Tool      [Settings] [Help] [?] │
├─────────────────────────────────────────────────────────────┤
│  Workspace  |  Analyze  |  Results  |  Library              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                   [Active View Content]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
Features:

Persistent navigation
Settings modal: theme, preferences, export defaults
Help system: tooltips, documentation links
Responsive: collapses to hamburger menu on mobile

2. Settings Modal (Overlay)
GENERAL:
- Theme: Light / Dark / Auto
- Default spoilage tolerance: 15%
- Default view mode: Standard Post-1593
- Results per page: 100

EXPORT:
- Default format: CSV / JSON / Google Sheets
- Include transformation logs: Yes / No
- Auto-backup frequency: Every session / Daily / Never

ADVANCED:
- Enable experimental features
- Debug mode (shows computation times)
3. Help System

Tooltips on hover (every control)
"?" icons open contextual help
Quick-start guide (overlay tutorial)
Video tutorials (embedded or linked)
FAQ section

4. Notification System

Toast notifications for:

Analysis started
Analysis complete (with preview)
Export complete
Errors (with helpful suggestions)
Roberta matches found


Dismissible
Non-blocking


INTERACTIVE FEATURES & WORKFLOWS
Workflow 1: Quick Analysis (New User)
1. Land on WORKSPACE
2. Click "Quick Select: Faustus A1" → auto-loads
3. Accept default 2-line segmentation
4. Click "Continue to Analysis"
5. Accept default top 4 cipher methods
6. Click "Start Analysis"
7. Wait 20 seconds
8. View RESULTS automatically
9. Browse top patterns
10. Export to Google Sheets
Time to first results: ~2 minutes
Workflow 2: Power User (Edition Comparison)
1. WORKSPACE → "Compare multiple editions"
2. Select Faustus A1 + B1 → loads side-by-side
3. Differences auto-highlighted
4. Segment by "Titles only"
5. ANALYZE → Alt Cipher Mode (no thematic bias)
6. Set spoilage 0-5% (clean encoding)
7. Add entity search: "Marina" + "Cicogna"
8. Start analysis
9. RESULTS → Filter "Roberta matches only"
10. Export matching patterns
11. Compare A1 vs B1 corruption patterns
Time: ~10-15 minutes for comprehensive comparison
Workflow 3: Roberta Vault Cross-Check
1. WORKSPACE → paste mysterious segment
2. ANALYZE → standard configuration
3. Start analysis
4. RESULTS → notice "⭐ 3 Roberta matches"
5. Click first match → overlay shows:
   - Roberta's full page scan
   - Her handwritten notes
   - Cross-references to related pages
6. Click "View Network" → see entity co-occurrence graph
7. Export validated finding with Roberta citation
Workflow 4: Interactive Decode Refinement (Future Phase 2)
1. RESULTS → see "hoohoo whitgift tortured" with 8% spoilage
2. Click "Refine Encoding"
3. Modal opens with AI assistant:
   "If you change 'hoohoo' → 'hoohu', remaining letters allow:"
   - Option 1: "Roger Manwood anal lance" (0% spoilage)
   - Option 2: "Roger threatened prison death" (2%)
4. Click Option 1
5. Tool shows updated pattern
6. Save refined version
7. Original and refined both preserved

MOCK DATA STRUCTURE
Mock API Response Format (to simulate backend)
Analysis Job:
javascript{
  job_id: 12345,
  status: 'completed',
  segments_analyzed: 47,
  total_patterns: 412,
  high_confidence_count: 89,
  roberta_matches: 23,
  processing_time_ms: 23400,
  configuration: {
    source: 'Faustus A1',
    methods: ['anagram', 'unusual_spelling', 'nomenclator'],
    view_mode: 'standard',
    spoilage_max: 0.15
  }
}
Result Pattern:
javascript{
  id: 789,
  rank: 1,
  segment_id: 3,
  segment_text: 'The tragicall historie of Doctor Faustus',
  segment_lines: '5-6',
  
  decoded_pattern: 'Whitgift tortured Roger Manwood anal lance lathe',
  cipher_method: 'anagram',
  
  scores: {
    composite: 94,
    entity: 92,
    linguistic: 87,
    statistical: 96,
    spoilage: 97
  },
  
  spoilage_pct: 3.2,
  unused_letters: ['i', 'o'],
  
  entities_detected: [
    {name: 'Whitgift', confidence: 0.98, type: 'person'},
    {name: 'Roger Manwood', confidence: 0.95, type: 'person'}
  ],
  
  themes: ['persecution', 'torture', 'imprisonment'],
  
  roberta_match: {
    found: true,
    page: 47,
    year: 1987,
    roberta_decode: 'Whitgift threatened Roger Manwood with prison',
    similarity: 0.92,
    cross_refs: [156, 201, 389]
  },
  
  transformation_log: [
    'Original: "The tragicall hiſtorie of D. Fauſtus"',
    'Long s normalized: "The tragicall historie..."',
    'Ligatures expanded',
    'Letter inventory built: {t:5, h:3, e:3...}',
    'Anagram generation: 847 permutations tested',
    'Top match selected: "Whitgift tortured..."',
    'Unused letters: i, o (3.2% spoilage)'
  ]
}
Library Source:
javascript{
  id: 'faustus_a1_1604',
  title: 'Doctor Faustus A-text',
  author: 'Christopher Marlowe',
  publication_year: 1604,
  edition: 'A1',
  character_count: 12847,
  source_authority: 'Folger Shakespeare Library',
  text_preview: 'The tragicall historie...',
  metadata: {
    contains_blackletter: true,
    corruption_flags: [],
    quality_score: 0.95
  }
}
```

---

## COMPONENT HIERARCHY (Lean Structure)
```
App
├── AppShell (nav, settings, help)
│   ├── Navigation
│   ├── SettingsModal
│   └── HelpSystem
│
├── WorkspaceView
│   ├── SourcePicker
│   ├── TextDisplay
│   └── SegmentControls
│
├── AnalyzeView
│   ├── MethodSelector
│   ├── ViewModeToggle 
│   ├── FilterPanel
│   └── ProgressTracker
│
├── ResultsView
│   ├── FilterBar
│   ├── ResultCard (repeated)
│   │   ├── ScoreBreakdown
│   │   ├── TransformationLog
│   │   └── RobertaMatch
│   └── ExportControls
│
├── LibraryView
│   ├── SourceCard (repeated)
│   ├── SessionCard (repeated)
│   └── SearchBar
│
└── Shared Components
    ├── Button
    ├── Input
    ├── Dropdown
    ├── Slider
    ├── Checkbox
    ├── Card
    ├── Modal
    ├── Tooltip
    └── NotificationToast
Total: ~35-40 components (not hundreds!)

RESPONSIVE DESIGN STRATEGY
Desktop (1200px+)

Multi-column layouts
Side-by-side comparisons
All features visible

Tablet (768-1199px)

Stacked columns
Collapsible sidebars
Core features preserved

Mobile (320-767px)

Single column
Hamburger navigation
Progressive disclosure (hide advanced features by default)
Touch-friendly controls (larger buttons, sliders)


STATE MANAGEMENT
Application State (React Context or Zustand)
javascriptGlobalState {
  // Workspace
  currentSource: null,
  segments: [],
  segmentationMode: '2-line-pairs',
  
  // Analyze
  selectedMethods: ['anagram', 'unusual_spelling', 'nomenclator'],
  viewMode: 'standard',
  filters: {
    spoilageMax: 0.15,
    entitySearch: [],
    wordSearch: [],
    resultsPerSegment: 100
  },
  
  // Results
  currentJob: null,
  results: [],
  sortBy: 'composite_score',
  filterBy: {},
  
  // Library
  availableSources: [...],
  savedSessions: [...],
  
  // UI
  activeView: 'workspace',
  settings: {...},
  notifications: []
}

Mock Data Layer
javascript// api/mockApi.js

class MockAPI {
  // Simulates backend delay
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Load source text
  async getSource(sourceId) {
    await this.delay(300);
    return MOCK_SOURCES.find(s => s.id === sourceId);
  }
  
  // Submit analysis job
  async createAnalysisJob(config) {
    await this.delay(500);
    const jobId = Math.floor(Math.random() * 100000);
    
    return {
      job_id: jobId,
      status: 'queued',
      estimated_time_seconds: config.segments.length * 0.5
    };
  }
  
  // Simulate progressive analysis
  async *runAnalysis(jobId, segments, config) {
    for (let i = 0; i < segments.length; i++) {
      await this.delay(500); // Simulate processing time
      
      const progress = Math.floor(((i + 1) / segments.length) * 100);
      const results = this.generateMockResults(segments[i], config);
      
      yield {
        progress,
        current_segment: i + 1,
        total_segments: segments.length,
        results_so_far: results,
        status: 'processing'
      };
    }
    
    yield {
      progress: 100,
      status: 'completed',
      total_results: segments.length * 8.76, // avg results per segment
      high_confidence: segments.length * 1.89
    };
  }
  
  // Generate mock decoded patterns
  generateMockResults(segment, config) {
    const templates = [
      {
        pattern: 'Whitgift tortured Roger Manwood anal lance lathe',
        entities: ['Whitgift', 'Roger Manwood'],
        themes: ['persecution', 'torture'],
        scores: {composite: 94, entity: 92, linguistic: 87, statistical: 96, spoilage: 97}
      },
      {
        pattern: 'hoohoo de Vere bastard son incest scandal',
        entities: ['hoohoo', 'de Vere'],
        themes: ['royal_scandal', 'incest'],
        scores: {composite: 89, entity: 88, linguistic: 84, statistical: 92, spoilage: 93}
      },
      {
        pattern: 'Marina Cicogna Venice duke wife daughter',
        entities: ['Marina', 'Cicogna'],
        themes: ['venice', 'family'],
        scores: {composite: 87, entity: 90, linguistic: 83, statistical: 88, spoilage: 91}
      },
      {
        pattern: 'Bacon Robert poisoner hunchback sonnets editor',
        entities: ['Bacon', 'Robert'],
        themes: ['authorship', 'encoding'],
        scores: {composite: 82, entity: 85, linguistic: 79, statistical: 84, spoilage: 88}
      },
      // ... more templates
    ];
    
    // Filter by view mode
    let filtered = this.filterByViewMode(templates, config.view_mode);
    
    // Apply spoilage filter
    filtered = filtered.filter(t => 
      this.calculateSpoilage(segment, t.pattern) <= config.filters.spoilageMax
    );
    
    // Apply entity search
    if (config.filters.entitySearch.length > 0) {
      filtered = filtered.filter(t =>
        config.filters.entitySearch.some(e => t.entities.includes(e))
      );
    }
    
    // Apply word search
    if (config.filters.wordSearch.length > 0) {
      filtered = filtered.filter(t =>
        config.filters.wordSearch.every(w => 
          t.pattern.toLowerCase().includes(w.toLowerCase())
        )
      );
    }
    
    // Randomly select Roberta matches (simulate ~20% match rate)
    filtered = filtered.map(t => ({
      ...t,
      roberta_match: Math.random() < 0.2 ? this.generateRobertaMatch() : null
    }));
    
    return filtered.slice(0, config.filters.resultsPerSegment);
  }
  
  filterByViewMode(templates, mode) {
    const priorities = {
      'standard': ['Whitgift', 'hoohoo', 'Hen', 'de Vere'],
      'juvenilia': ['Roger', 'Cate', 'classical'],
      'alt_cipher': null, // no filtering
      'show_all': null
    };
    
    if (!priorities[mode]) return templates;
    
    const priorityEntities = priorities[mode];
    return templates.sort((a, b) => {
      const aScore = a.entities.filter(e => 
        priorityEntities.some(p => e.includes(p))
      ).length;
      const bScore = b.entities.filter(e => 
        priorityEntities.some(p => e.includes(p))
      ).length;
      return bScore - aScore;
    });
  }
  
  calculateSpoilage(segment, pattern) {
    // Simplified mock calculation
    const segmentLetters = segment.text.toLowerCase().replace(/[^a-z]/g, '').length;
    const patternLetters = pattern.toLowerCase().replace(/[^a-z]/g, '').length;
    const unused = segmentLetters - patternLetters;
    return (unused / segmentLetters) * 100;
  }
  
  generateRobertaMatch() {
    return {
      found: true,
      page: Math.floor(Math.random() * 600) + 1,
      year: 1975 + Math.floor(Math.random() * 45),
      roberta_decode: 'Similar pattern found by Roberta',
      similarity: 0.75 + Math.random() * 0.25,
      cross_refs: [
        Math.floor(Math.random() * 600),
        Math.floor(Math.random() * 600)
      ]
    };
  }
  
  // Get library sources
  async getLibrarySources(category = 'all') {
    await this.delay(200);
    
    if (category === 'all') return MOCK_SOURCES;
    
    return MOCK_SOURCES.filter(s => s.category === category);
  }
  
  // Save session
  async saveSession(sessionData) {
    await this.delay(300);
    
    const session = {
      id: `session_${Date.now()}`,
      name: sessionData.name || `Analysis ${new Date().toLocaleDateString()}`,
      created: new Date().toISOString(),
      ...sessionData
    };
    
    // Store in localStorage (temporary persistence)
    const sessions = JSON.parse(localStorage.getItem('saved_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('saved_sessions', JSON.stringify(sessions));
    
    return session;
  }
  
  // Load saved sessions
  async getSavedSessions() {
    await this.delay(200);
    return JSON.parse(localStorage.getItem('saved_sessions') || '[]');
  }
}

export default new MockAPI();

MOCK DATA CONSTANTS
javascript// data/mockSources.js

export const MOCK_SOURCES = [
  // MARLOWE PLAYS
  {
    id: 'faustus_a1_1604',
    title: 'Doctor Faustus A-text',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1604,
    edition: 'A1',
    character_count: 12847,
    source_authority: 'Folger Shakespeare Library',
    text: `The Tragicall History of D. Faustus.
As it hath bene Acted by the Right Honorable the Earle of Nottingham his seruants.
Written by Ch. Marklin.

Enter Faustus in his study.
Faustus. Settle thy studies Faustus, and beginne
To sound the depth of that thou wilt professe:
Hauing commenc'd, be a Diuine in shew...`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.95
    }
  },
  
  {
    id: 'faustus_b1_1616',
    title: 'Doctor Faustus B-text',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1616,
    edition: 'B1',
    character_count: 15231,
    source_authority: 'Folger Shakespeare Library',
    text: `The Tragicall History of the Life and Death of Doctor Faustus.
With new Additions.
Written by Ch. Marlin.

[Extended version with additional scenes...]`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: ['probable interpolations'],
      quality_score: 0.82
    }
  },
  
  {
    id: 'edward_ii_1594',
    title: 'Edward II',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1594,
    edition: 'Q1',
    character_count: 18942,
    source_authority: 'British Library',
    text: `The troublesome raigne and lamentable death of Edward the second, King of England...`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.91
    }
  },
  
  // SPANISH TRAGEDY
  {
    id: 'spanish_tragedy_1592',
    title: 'The Spanish Tragedy',
    author: 'Thomas Kyd (attributed)',
    category: 'spanish_tragedy',
    publication_year: 1592,
    edition: 'Q1',
    character_count: 16234,
    source_authority: 'British Library',
    text: `THE SPANISH TRAGEDIE, Containing the lamentable end of Don Horatio, and Belimperia...`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.88
    }
  },
  
  // SHAKESPEARE (sample)
  {
    id: 'hamlet_q1_1603',
    title: 'Hamlet Q1 (Bad Quarto)',
    author: 'William Shakespeare',
    category: 'shakespeare_tragedies',
    publication_year: 1603,
    edition: 'Q1',
    character_count: 14523,
    source_authority: 'Folger Shakespeare Library',
    text: `THE Tragicall Historie of HAMLET Prince of Denmarke...`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: ['memorial reconstruction suspected'],
      quality_score: 0.65
    }
  },
  
  {
    id: 'hamlet_q2_1604',
    title: 'Hamlet Q2 (Good Quarto)',
    author: 'William Shakespeare',
    category: 'shakespeare_tragedies',
    publication_year: 1604,
    edition: 'Q2',
    character_count: 28947,
    source_authority: 'Folger Shakespeare Library',
    text: `THE Tragicall Historie of HAMLET, Prince of Denmarke...`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: [],
      quality_score: 0.93
    }
  },
  
  // KING JAMES BIBLE
  {
    id: 'kjv_1611',
    title: 'King James Bible (1611)',
    author: 'Various translators',
    category: 'bible',
    publication_year: 1611,
    edition: '1st Edition',
    character_count: 3567890, // Full Bible
    source_authority: 'Cambridge University',
    text: `THE HOLY BIBLE, Conteyning the Old Testament, AND THE NEW...`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.99
    }
  },
  
  // Add more sources...
];

// Entity dictionary mock
export const MOCK_ENTITIES = [
  {
    id: 1,
    name: 'John Whitgift',
    name_variants: ['Whitgift', 'Whitgifte', 'Archbishop Whitgift'],
    entity_type: 'person',
    time_period: 'post_1583',
    biographical_data: {
      birth_year: 1530,
      death_year: 1604,
      roles: ['Archbishop of Canterbury'],
      relationships: [
        {entity: 'Hen', type: 'persecutor-victim'},
        {entity: 'Roger Manwood', type: 'persecutor-victim'}
      ]
    },
    importance_weight: 1.0,
    theme_associations: ['persecution', 'torture', 'imprisonment']
  },
  
  {
    id: 2,
    name: 'hoohoo',
    name_variants: ['hoohoo', 'hoohu', 'Elizabeth I'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1533,
      death_year: 1603,
      roles: ['Queen of England'],
      relationships: [
        {entity: 'Edward de Vere', type: 'alleged-scandal'},
        {entity: 'Leicester', type: 'rumored-relationship'}
      ]
    },
    importance_weight: 0.95,
    theme_associations: ['royal_scandal', 'incest', 'succession']
  },
  
  {
    id: 3,
    name: 'Roger Manwood',
    name_variants: ['Roger', 'Manwood', 'Sir Roger Manwood'],
    entity_type: 'person',
    time_period: 'pre_1592',
    biographical_data: {
      birth_year: 1525,
      death_year: 1592,
      roles: ['Judge', 'Baron of the Exchequer'],
      relationships: [
        {entity: 'Whitgift', type: 'victim-persecutor'}
      ]
    },
    importance_weight: 0.85,
    theme_associations: ['persecution', 'torture', 'death']
  },
  
  {
    id: 4,
    name: 'Marina Cicogna',
    name_variants: ['Marina', 'Cicogna', 'Marina Cicogna Dolfin'],
    entity_type: 'person',
    time_period: 'post_1593',
    biographical_data: {
      birth_year: 1567,
      marriage_year: 1593,
      roles: ['Noblewoman', 'Wife of Venetian Duke'],
      relationships: [
        {entity: 'Giovanni Cicogna', type: 'husband'},
        {entity: 'Christopher Marlowe', type: 'alleged-relationship'}
      ]
    },
    importance_weight: 0.80,
    theme_associations: ['venice', 'marriage', 'family', 'exile']
  },
  
  {
    id: 5,
    name: 'Edward de Vere',
    name_variants: ['de Vere', 'Oxford', 'Earl of Oxford'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1550,
      death_year: 1604,
      roles: ['Earl', 'Nobleman', 'Patron'],
      relationships: [
        {entity: 'hoohoo', type: 'alleged-scandal'}
      ]
    },
    importance_weight: 0.75,
    theme_associations: ['royal_scandal', 'authorship', 'nobility']
  },
  
  {
    id: 6,
    name: 'Francis Bacon',
    name_variants: ['Bacon', 'Francis Bacon', 'Robert'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1561,
      death_year: 1626,
      roles: ['Philosopher', 'Statesman', 'Cipher expert'],
      relationships: []
    },
    importance_weight: 0.70,
    theme_associations: ['cipher', 'encoding', 'authorship']
  },
  
  // ... more entities
];
```

---

## USER EXPERIENCE ENHANCEMENTS

### 1. Smart Defaults
- **First-time user**: Loads with tutorial overlay
- **View mode**: Defaults to "Standard Post-1593" (most common)
- **Cipher methods**: Top 4 pre-selected (highest success rates)
- **Spoilage**: 0-15% (based on research findings)
- **Results**: Sorted by composite score descending

### 2. Contextual Help
Every control has tooltip:
```
[Spoilage Tolerance] (?)
  ↓ Hover reveals:
  "Percentage of letters unused in decoded pattern.
   Lower = cleaner encoding.
   Research shows 5-12% typical for intentional encoding.
   Titles average 6.2%, body text 9.1%."
```

### 3. Visual Feedback
- **Loading states**: Skeleton screens (not spinners)
- **Progress**: Animated bar with segment count
- **Success**: Green toast notification with preview
- **Errors**: Red toast with actionable suggestion
- **Warnings**: Yellow highlight on suspicious patterns

### 4. Keyboard Shortcuts
```
Ctrl/Cmd + N: New analysis
Ctrl/Cmd + S: Save session
Ctrl/Cmd + E: Export results
Ctrl/Cmd + F: Search results
Ctrl/Cmd + 1-4: Switch views
Space: Expand/collapse result card
Esc: Close modal/overlay
```

### 5. Undo/Redo
- Segment edits: Ctrl+Z to undo last boundary change
- Filter changes: "Reset filters" button
- Analysis configuration: "Use previous settings"

---

## PERFORMANCE OPTIMIZATION

### 1. Virtual Scrolling
When displaying 412 results:
- Only render visible cards (~10-15 on screen)
- Render 5 above/below viewport (buffer)
- Total DOM nodes: ~25 (not 412)
- Smooth scrolling maintained

### 2. Lazy Loading
- Library sources: Load 50 at a time, infinite scroll
- Transformation logs: Load on expand (not pre-rendered)
- Roberta matches: Fetch detail on click (not embedded in initial load)

### 3. Debouncing
- Search inputs: 300ms delay before filtering
- Filter sliders: Update on release (not during drag)
- Auto-save: 5 seconds after last edit

### 4. Code Splitting
```
Routes:
- Workspace.lazy.js (loads on demand)
- Analyze.lazy.js
- Results.lazy.js
- Library.lazy.js

Initial bundle: ~150kb (app shell + workspace)
Subsequent views: ~30-50kb each
5. Memoization
javascript// Expensive calculations cached
const filteredResults = useMemo(() => 
  results.filter(r => r.composite_score >= minScore),
  [results, minScore]
);

// Expensive renders prevented
const ResultCard = memo(({ result }) => {
  // Only re-renders if result prop changes
});

ACCESSIBILITY (WCAG 2.1 AA)
1. Keyboard Navigation

All interactive elements focusable
Tab order logical (top-to-bottom, left-to-right)
Focus indicators visible (blue outline)
Skip links: "Skip to main content"

2. Screen Reader Support
html<button aria-label="Start analysis of 47 segments">
  Start Analysis
</button>

<div role="progressbar" aria-valuenow="47" aria-valuemin="0" aria-valuemax="100">
  47% complete
</div>

<div role="alert" aria-live="polite">
  Analysis complete: 412 patterns found
</div>
3. Color Contrast

Text: Minimum 4.5:1 ratio
Large text (18pt+): Minimum 3:1 ratio
Interactive elements: 3:1 ratio
Never rely on color alone (use icons + text)

4. Responsive Text

Minimum font size: 14px (body)
Line height: 1.5 minimum
Paragraph width: 80ch maximum
Text zoomable to 200% without horizontal scroll


TESTING STRATEGY
1. Component Tests (Jest + React Testing Library)
javascript// ResultCard.test.js
test('displays decoded pattern', () => {
  const result = {
    decoded_pattern: 'Whitgift tortured Roger',
    scores: {composite: 94}
  };
  
  render(<ResultCard result={result} />);
  
  expect(screen.getByText('Whitgift tortured Roger')).toBeInTheDocument();
  expect(screen.getByText('94')).toBeInTheDocument();
});

test('expands transformation log on click', () => {
  const result = mockResult;
  
  render(<ResultCard result={result} />);
  
  const expandButton = screen.getByText('Show Transformation Log');
  fireEvent.click(expandButton);
  
  expect(screen.getByText(/Original:/)).toBeInTheDocument();
});
2. Integration Tests
javascripttest('complete analysis workflow', async () => {
  render(<App />);
  
  // Load source
  const sourceButton = screen.getByText('Quick Select: Faustus A1');
  fireEvent.click(sourceButton);
  
  // Navigate to analyze
  const analyzeTab = screen.getByText('Analyze');
  fireEvent.click(analyzeTab);
  
  // Start analysis
  const startButton = screen.getByText('Start Analysis');
  fireEvent.click(startButton);
  
  // Wait for completion
  await waitFor(() => {
    expect(screen.getByText(/Analysis complete/)).toBeInTheDocument();
  }, {timeout: 5000});
  
  // Verify results displayed
  expect(screen.getByText(/patterns found/)).toBeInTheDocument();
});
3. Mock API Tests
javascripttest('mockAPI generates filtered results', async () => {
  const config = {
    view_mode: 'standard',
    filters: {
      spoilageMax: 0.15,
      entitySearch: ['Whitgift']
    }
  };
  
  const results = mockAPI.generateMockResults(mockSegment, config);
  
  // Should prioritize Whitgift
  expect(results[0].entities).toContain('Whitgift');
  
  // Should respect spoilage filter
  results.forEach(r => {
    const spoilage = mockAPI.calculateSpoilage(mockSegment, r.pattern);
    expect(spoilage).toBeLessThanOrEqual(15);
  });
});
```

---

## DEPLOYMENT STRATEGY

### Development
```
- Local: npm run dev (Vite dev server)
- Hot reload enabled
- Mock API active
- Source maps included
```

### Staging
```
- Hosted: Netlify/Vercel preview deployment
- Mock API still active
- Performance monitoring enabled
- User testing environment
```

### Production (Future - Phase 1 backend complete)
```
- Replace mock API with real endpoints
- Environment variable: VITE_API_URL
- Error tracking: Sentry integration
- Analytics: PostHog or similar
- CDN: Cloudflare for static assets

MIGRATION PATH (Mock → Real API)
API Adapter Pattern
javascript// api/adapter.js

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

class APIAdapter {
  constructor() {
    this.api = USE_MOCK ? mockAPI : realAPI;
  }
  
  async getSource(id) {
    return this.api.getSource(id);
  }
  
  async createAnalysisJob(config) {
    return this.api.createAnalysisJob(config);
  }
  
  // ... all methods proxy to mock or real
}

export default new APIAdapter();
Zero code changes in components when switching to real backend:
javascript// Component doesn't know if mock or real
import api from '@/api/adapter';

const results = await api.runAnalysis(jobId, segments, config);

SUMMARY: COMPLETE FEATURE SET
Core Features (Must-Have)
✅ Load texts (upload, library, paste)
✅ Intelligent segmentation (auto + manual)
✅ Configure cipher methods
✅ Filter by spoilage, entities, words
✅ View mode toggle (4 modes)
✅ Run analysis with progress tracking
✅ Browse results with sorting/filtering
✅ Score breakdown visualization
✅ Transformation log detail
✅ Export to CSV/Google Sheets
✅ Save/restore sessions
✅ Library source management
Enhanced Features (High Value)
✅ Edition comparison (side-by-side)
✅ Roberta vault match display
✅ Entity/theme clustering visualization
✅ Keyboard shortcuts
✅ Responsive mobile design
✅ Accessibility (WCAG AA)
✅ Settings persistence
✅ Contextual help system
Future Features (Phase 2+)
⏳ Interactive AI decode refinement
⏳ Real-time collaborative analysis
⏳ Historical entity network graphs
⏳ Cross-play pattern detection
⏳ Automated spoilage corruption analysis
⏳ Machine learning pattern suggestions

NEXT STEPS
Ready to build:

Confirm design approach
Clarify any feature priorities
Discuss technology stack (React + Vite + TailwindCSS?)
Begin with component library + app shell
Iterate view by view

Estimated build time: 3-4 weeks for full mock-data frontend
Let me know if you want to:

Adjust any features
Add/remove functionality
Refine specific workflows
Begin implementation