// types/index.js

/**
 * @typedef {Object} Source
 * @property {string} id
 * @property {string} title
 * @property {string} author
 * @property {string} category
 * @property {number} publication_year
 * @property {string} edition
 * @property {number} character_count
 * @property {string} source_authority
 * @property {string} text
 * @property {Object} metadata
 */

/**
 * @typedef {Object} Segment
 * @property {number} id
 * @property {string} text
 * @property {string} lines
 * @property {number} letterCount
 * @property {number} startPosition
 * @property {number} endPosition
 */

/**
 * @typedef {Object} Pattern
 * @property {number} id
 * @property {number} rank
 * @property {number} segmentId
 * @property {string} segmentText
 * @property {string} decodedPattern
 * @property {string} cipherMethod
 * @property {Object} scores
 * @property {number} spoilagePct
 * @property {string[]} unusedLetters
 * @property {Object[]} entitiesDetected
 * @property {string[]} themes
 * @property {Object|null} robertaMatch
 * @property {string[]} transformationLog
 */

/**
 * @typedef {Object} AnalysisJob
 * @property {number} jobId
 * @property {string} status - 'queued' | 'processing' | 'completed' | 'failed'
 * @property {number} progress - 0-100
 * @property {number} currentSegment
 * @property {number} totalSegments
 * @property {string} startedAt
 * @property {number} estimatedTimeRemaining - milliseconds
 */

// /**
//  * @typedef {Object} SavedSession
//  * @property {string} id
//  * @property {string} name
//  * @property {string} created
//  * @property {Source} source
//  * @property {Segment[]} segments
//  * @property {Object} configuration