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

export function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

// Resolve a country name (as returned by SpaceX) to an ISO-2 code.
// Tries the live Countries list first (dynamic, case-insensitive exact match),
// then falls back to the alias map for SpaceX's informal names.
export function resolveIso(name) {
  if (!name) return null;
  const k = String(name).trim().toLowerCase();
  const hit = Object.values(state.countriesByCode).find(c => c.name.toLowerCase() === k);
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

// Indicative FX (static, prototype-only — neither GraphQL endpoint exposes
// live rates). 1 USD ≈ X local currency.
const FX = {
  USD: 1, EUR: 0.92, GBP: 0.78, JPY: 155, CNY: 7.2, INR: 83, RUB: 90,
  AUD: 1.5, BRL: 5.1, ILS: 3.7, NZD: 1.65, KZT: 445, ZAR: 18.5,
};

const LOCALE_BY_CURRENCY = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', CNY: 'zh-CN',
  INR: 'en-IN', RUB: 'ru-RU', AUD: 'en-AU', BRL: 'pt-BR', ILS: 'he-IL',
  NZD: 'en-NZ', KZT: 'kk-KZ',
};

export function fmtPrice(usd, code) {
  if (!usd) return null;
  const cur = (code || 'USD').split(',')[0].trim();
  const rate = FX[cur] ?? 1;
  const v = usd * rate;
  const loc = LOCALE_BY_CURRENCY[cur] || 'en-US';
  try {
    return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${cur} ${Math.round(v).toLocaleString()}`;
  }
}

export function pickIllustration(r) {
  const n = r.name?.toLowerCase() || '';
  if (n.includes('heavy')) return 'rk-heavy';
  if (n.includes('starship') || n.includes('big falcon')) return 'rk-starship';
  if (n.includes('falcon 1') || n.includes('electron')) return 'rk-mini';
  return 'rk-classic';
}
