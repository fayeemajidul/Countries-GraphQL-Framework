import { NAME_TO_ISO2 } from './data/country-aliases.js';
import { state } from './state.js';

export const $ = (id) => document.getElementById(id);

export const setText = (id, v) => {
  const el = $(id);
  if (el) el.textContent = v;
};

export function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

// Resolve a country name (as returned by SpaceX) to an ISO-2 code.
// Tries the live Countries list first (dynamic), then falls back to the
// small alias map for SpaceX's informal names.
export function resolveIso(name) {
  if (!name) return null;
  const k = String(name).trim().toLowerCase();
  const hit = state.countries.find(c => c.name.toLowerCase() === k);
  if (hit) return hit.code;
  if (NAME_TO_ISO2[k]) return NAME_TO_ISO2[k];
  return null;
}

export function setBanner(msg, action) {
  const b = $('banner');
  if (!b) return;
  if (!msg) {
    b.classList.add('hidden');
    b.innerHTML = '';
    return;
  }
  b.innerHTML = `<div>${msg}</div>` + (action ? `<button id="bannerAction" class="btn">${action}</button>` : '');
  b.classList.remove('hidden');
}
