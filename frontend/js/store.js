// Orchestrates the rocketship marketplace: parallel-fetches both GraphQL
// endpoints at boot, joins rockets to their origin country + mission history,
// renders the grid, opens the detail modal (with a live Countries re-fetch),
// and handles the decorative cart.

import { state } from './state.js';
import { $, setText, setBanner, escapeHtml, resolveIso } from './utils.js';
import {
  fetchSpacex, fetchCountries,
  ROCKETS_QUERY, LAUNCHES_QUERY, COUNTRIES_QUERY, COUNTRY_QUERY,
} from './api.js';
import { card, renderDetailBody, renderSoldIn } from './cards.js';

export async function boot() {
  setBanner(null);
  try {
    const [rData, lData, cData] = await Promise.all([
      fetchSpacex(ROCKETS_QUERY),
      fetchSpacex(LAUNCHES_QUERY),
      fetchCountries(COUNTRIES_QUERY),
    ]);

    const countries = (cData?.countries || []).filter(c => c && c.name);
    state.countriesByCode = Object.fromEntries(countries.map(c => [c.code, c]));

    // Group launches by rocket name
    const launchesByRocket = {};
    (lData?.launchesPast || []).forEach(L => {
      const k = L?.rocket?.rocket_name;
      if (!k) return;
      (launchesByRocket[k] = launchesByRocket[k] || []).push(L);
    });

    // Hydrate rockets with country + missions (the SpaceX × Countries join)
    state.rockets = (rData?.rockets || []).map(r => {
      const code = resolveIso(r.country);
      const country = code ? state.countriesByCode[code] : null;
      const missions = launchesByRocket[r.name] || [];
      return { ...r, code, country, missions };
    });

    if (!state.rockets.length) throw new Error('No rockets returned.');
    render();
  } catch (e) {
    setBanner(`Couldn't load — ${escapeHtml(e.message || 'network error')}.`, 'Retry');
    $('bannerAction')?.addEventListener('click', boot);
  }
}

export function render() {
  setText('resultCount', state.rockets.length);
  $('empty').classList.toggle('hidden', state.rockets.length > 0);

  if (!state.rockets.length) {
    $('grid').innerHTML = '';
    return;
  }

  $('grid').innerHTML = state.rockets.map(card).join('');

  $('grid').querySelectorAll('[data-detail]').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.detail));
  });
  $('grid').querySelectorAll('[data-cart]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(el.dataset.cart);
    });
  });
}

export async function openDetail(id) {
  const r = state.rockets.find(x => x.id === id);
  if (!r) return;

  // Pick a random country that isn't the rocket's origin and has a currency
  const candidates = Object.values(state.countriesByCode).filter(c => c && c.code !== r.code && c.currency);
  const randomCountry = candidates[Math.floor(Math.random() * candidates.length)];

  $('modalBody').innerHTML = renderDetailBody(r);
  $('modalBody').querySelector('[data-cart-modal]')?.addEventListener('click', (e) => {
    addToCart(e.currentTarget.dataset.cartModal);
  });
  showModal(true);

  // Live re-fetch the random country from the Countries GraphQL API
  if (randomCountry) {
    try {
      const d = await fetchCountries(COUNTRY_QUERY, { code: randomCountry.code });
      const c = d?.country || randomCountry;
      $('soldIn').innerHTML = renderSoldIn(r, c);
    } catch (e) {
      $('soldIn').innerHTML = `<div class="mono text-[11px] text-[var(--mute)]">Couldn't reach Countries API — ${escapeHtml(e.message || '')}.</div>`;
    }
  } else {
    $('soldIn').innerHTML = `<div class="mono text-[11px] text-[var(--mute)]">No alternate market available.</div>`;
  }
}

export function showModal(show) {
  $('modalOverlay').classList.toggle('show', show);
  $('modalOverlay').setAttribute('aria-hidden', String(!show));
  document.body.style.overflow = show ? 'hidden' : '';
}

export function addToCart(id) {
  const r = state.rockets.find(x => x.id === id);
  if (!r) return;
  state.cart.push(id);
  setText('cartCount', state.cart.length);
  showToast(`🚀 Congratulations — you purchased a ${r.name}!`);
}

let toastTimer;
export function showToast(msg) {
  const el = $('toast');
  el.querySelector('span').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}
