// Global Language Map
// Only zh-tw (default, unprefixed) and en (/en/) are published (ADR-0005)
export const langMap = {
  'en': ['en-US'],
  'zh-tw': ['zh-TW'],
} as const

// Supported Languages
export type Language = keyof typeof langMap
