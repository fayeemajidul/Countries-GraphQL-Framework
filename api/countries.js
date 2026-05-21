// Vercel deployment shim.
// Vercel auto-deploys serverless functions only from files under `/api/` at
// the project root — this is a framework convention and cannot be moved.
// The real handler lives in /backend/api/countries.js; this file re-exports
// its default so production keeps working without touching deployment.
export { default } from '../backend/api/countries.js';
