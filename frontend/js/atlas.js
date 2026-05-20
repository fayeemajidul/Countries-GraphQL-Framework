import { state } from './state.js';
import { $, setText, shuffle, escapeHtml } from './utils.js';
import { openDialog } from './dialog.js';

function pickAtlasSample() {
  // Launched countries get priority — they're the ones the quiz could ask about.
  const launched = state.countries.filter(c => state.launchedCodes.has(c.code));
  const others = shuffle(state.countries.filter(c => !state.launchedCodes.has(c.code)));
  return [...launched, ...others].slice(0, 25);
}

export function renderAtlas() {
  const grid = $('atlas-grid');
  if (!grid || !state.countries.length) return;
  if (!state.atlasSample) state.atlasSample = pickAtlasSample();
  const sample = state.atlasSample;
  setText('atlasShown', sample.length);
  grid.innerHTML = sample.map(c => {
    const launched = state.launchedCodes.has(c.code);
    return `
      <button class="pill" data-code="${c.code}" title="${escapeHtml(c.name)}">
        <span class="pflag">${c.emoji || '🏳️'}</span>
        <span class="pname">${escapeHtml(c.name)}</span>
        ${launched ? '<span class="pdot" aria-label="SpaceX origin"></span>' : ''}
      </button>`;
  }).join('');
  grid.querySelectorAll('.pill').forEach(b => {
    b.addEventListener('click', () => openDialog(b.dataset.code));
  });
}

export function reshuffleAtlas() {
  state.atlasSample = pickAtlasSample();
  renderAtlas();
}
