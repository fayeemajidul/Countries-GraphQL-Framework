import { state } from './state.js';
import { $, setText, escapeHtml, setBanner } from './utils.js';
import {
  fetchSpacex, fetchCountries,
  SPACEX_QUERY, COUNTRIES_QUERY, CONTINENTS_QUERY, COUNTRY_QUERY,
} from './api.js';
import { renderAtlas } from './atlas.js';
import { toast } from './toasts.js';
import { pickQuestion } from './questions.js';
import { resolveIso } from './utils.js';

export async function boot() {
  setBanner(null);
  setText('apiStatusTop', 'Connecting');
  try {
    const [cData, contData, sData] = await Promise.all([
      fetchCountries(COUNTRIES_QUERY),
      fetchCountries(CONTINENTS_QUERY),
      fetchSpacex(SPACEX_QUERY, { limit: 100 }),
    ]);
    state.countries = (cData?.countries || []).filter(c => c && c.name);
    state.byCode = Object.fromEntries(state.countries.map(c => [c.code, c]));
    state.continents = (contData?.continents || []).filter(c => c && c.name);
    state.launches = (sData?.launchesPast || []).filter(L => {
      const code = resolveIso(L?.rocket?.rocket?.country);
      if (code) state.launchedCodes.add(code);
      return !!code;
    });
    if (!state.countries.length) throw new Error('No countries returned.');
    setText('apiStatusTop', `${state.countries.length} countries · ${state.launches.length} launches`);
    setText('atlasTotal', state.countries.length);
    renderAtlas();
    nextRound();
  } catch (e) {
    setText('apiStatusTop', 'Offline');
    setBanner(`Couldn't load — ${escapeHtml(e.message || 'network error')}.`, 'Retry');
    $('bannerAction')?.addEventListener('click', boot);
  }
}

export function nextRound() {
  state.locked = false;
  $('cardWrap').dataset.state = 'idle';
  $('card').classList.remove('flipped');
  $('nextBtn').classList.add('hidden');
  $('skipBtn').disabled = false;
  $('skipBtn').classList.remove('hidden');

  const q = pickQuestion();
  if (!q) {
    setBanner('Not enough data loaded to generate a question.', 'Retry');
    return;
  }
  state.current = q;

  setText('launchIdx', String(state.asked + 1).padStart(3, '0'));
  setText('questionTag', formatTypeTag(q.type));
  setText('queryLabel', q.queryLabel || '');

  $('questionPromptIdle').innerHTML = q.promptHTML;
  $('questionMetaIdle').innerHTML = q.metaHTML || '';
  $('questionPromptAsk').innerHTML = q.promptHTML;
  $('questionMetaAsk').textContent = stripTags(q.promptHTML).slice(0, 80);

  setText('revealFrom', q.revealContext || '');
  paintReveal(q.revealCountry);
}

function formatTypeTag(type) {
  const map = {
    'spacex-country':     'Question · SpaceX origin',
    'country-currency':   'Question · Currency',
    'country-capital':    'Question · Capital',
    'country-continent':  'Question · Continent',
    'continent-currency': 'Question · Continent → Currency',
  };
  return map[type] || 'Question';
}

function stripTags(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

export function openQuiz() {
  if ($('cardWrap').dataset.state !== 'idle') return;
  if (!state.current) return;
  $('cardWrap').dataset.state = 'asking';
  renderOptions(state.current.options);
}

function renderOptions(options) {
  const wrap = $('options');
  wrap.innerHTML = '';
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt text-left px-4 py-3 flex items-center gap-3 w-full';
    btn.dataset.key = opt.key;
    btn.innerHTML = `
      <span class="key">${String.fromCharCode(65 + i)}</span>
      <span class="flex-1 truncate text-sm">${escapeHtml(opt.label)}</span>
      <span class="badge badge-success badge-correct">✓ Correct</span>
      <span class="badge badge-destructive badge-wrong">✗ Wrong</span>`;
    btn.addEventListener('click', (e) => { e.stopPropagation(); onAnswer(opt.key, btn); });
    wrap.appendChild(btn);
  });
}

async function onAnswer(key, btn) {
  if (state.locked) return;
  state.locked = true;
  const q = state.current;
  const correct = q.correctKey;
  const ok = key === correct;
  document.querySelectorAll('#options .opt').forEach(el => {
    if (el.dataset.key === correct) el.dataset.result = ok ? 'correct' : 'reveal';
    else if (el === btn && !ok) el.dataset.result = 'wrong';
    else el.dataset.result = 'dim';
    el.disabled = true;
  });
  state.asked += 1;
  if (ok) { state.score += 1; state.streak += 1; } else { state.streak = 0; }
  setText('score', state.score);
  setText('asked', state.asked);
  setText('streak', state.streak);
  setText('verdict', ok ? 'Correct' : 'Incorrect');

  const correctOpt = q.options.find(o => o.key === correct);
  toast(
    ok ? 'success' : 'destructive',
    ok ? 'Correct' : 'Incorrect',
    ok ? `${q.revealCountry?.emoji || ''} ${correctOpt?.label || ''}` : `Answer: ${correctOpt?.label || ''}`,
  );

  setTimeout(() => {
    $('cardWrap').dataset.state = 'answered';
    $('card').classList.add('flipped');
  }, 700);

  // Refetch the reveal country for freshness — demonstrates a live country(code) call.
  if (q.revealCountry?.code) {
    try {
      const d = await fetchCountries(COUNTRY_QUERY, { code: q.revealCountry.code });
      if (d?.country) paintReveal(d.country);
    } catch (_) { /* keep initial paint */ }
  }

  state.history.push({
    type: q.type,
    ok,
    code: q.revealCountry?.code,
    country: q.revealCountry?.name,
    mission: q.payload?.mission,
  });
  renderAtlas();

  $('skipBtn').classList.add('hidden');
  $('nextBtn').classList.remove('hidden');
  $('nextBtn').focus();
}

export function paintReveal(c) {
  if (!c) return;
  $('flag').textContent = c.emoji || '🏳️';
  setText('revealCountry', c.name || '—');
  setText('revealCapital', c.capital || '—');
  setText('revealContinent', c.continent?.name || '—');
  setText('revealCurrency', c.currency || '—');
}
