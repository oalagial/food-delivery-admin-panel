// Central config for environment-aware values
// Vite exposes env vars via `import.meta.env`. Prefix custom vars with `VITE_`.
export const API_BASE = (import.meta.env.VITE_API_BASE as string)

export const IS_PROD = (import.meta.env.MODE === 'production')

// Local backend base URL for LAN-only requests
export const LOCAL_BACKEND = (import.meta.env.VITE_LOCAL_BACKEND as string | undefined)

export default { API_BASE, IS_PROD, LOCAL_BACKEND }
