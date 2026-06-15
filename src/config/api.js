// Single source of truth for the API base URL.
//
// In development (vite dev):
//   import.meta.env.DEV === true  →  use http://localhost:4000 directly.
//   The Vite dev server proxies /api/* to :4000, but explicit origin avoids
//   any edge-case mismatch.
//
// In production (vite build / npm run build):
//   import.meta.env.DEV === false  →  empty string.
//   All fetch calls become relative (/api/auth/login, etc.) and are resolved
//   against the current origin — which is the production domain served by
//   Nginx/Express.  No localhost reference survives in the bundle.

export const API = import.meta.env.DEV
  ? 'http://localhost:4000'
  : ''

// Debug log — visible in browser DevTools console.
// Confirms at runtime which base URL is active.
console.log(
  `%c[Lunarae] API base: ${API || '(relative — same-origin)'}`,
  'color:#e9ba4c;font-weight:bold'
)
