// Central config for environment-aware values
// Vite exposes env vars via `import.meta.env`. Prefix custom vars with `VITE_`.
export const API_BASE = (import.meta.env.VITE_API_BASE as string)

export const IS_PROD = (import.meta.env.MODE === 'production')

export default { API_BASE, IS_PROD }
