import { state } from './state.js';
import { $, setText, fmtDate, shuffle, escapeHtml, resolveIso, setBanner } from './utils.js';
import { fetchSpacex, fetchCountries, SPACEX_QUERY, COUNTRIES_QUERY, COUNTRY_QUERY } from './api.js';
import { renderAtlas } from './atlas.js';
import { toast } from './toasts.js';

export async function boot() {
  setBanner(null);
  setText('apiStatusTop', 'Connecting');
  try {
    const [cData, sData] = await Promise.all([
      fetchCountries(COUNTRIES_QUERY),
      fetchSpacex(SPACEX_QUERY, { limit: 100 }),
    ]);
    state.countries = (cData?.countries || []).filter(c => c && c.name);
    state.byCode = Object.fromEntries(state.countries.map(c => [c.code, c]));
    state.launches = (sData?.launchesPast || []).filter(L => {
      const code = resolveIso(L?.rocket?.rocket?.country);
      if (code) state.launchedCodes.add(code);
      return !!code;
    });
    if (!state.launches.length) throw new Error('No mappable launches.');
    setText('apiStatusTop', `${state.launches.length} launches indexed`);
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

  const recent = new Set(state.history.slice(-10).map(h => h.mission));
  const pool = state.launches.filter(L => !recent.has(L.mission_name));
  const launch = (pool.length ? pool : state.launches)[Math.floor(Math.random() * (pool.length || state.launches.length))];
  const code = resolveIso(launch?.rocket?.rocket?.country);
  const correct = state.byCode[code];
  if (!correct) {
    state.launches = state.launches.filter(L => L !== launch);
    return nextRound();
  }

  const sameCont = state.countries.filter(c => c.code !== correct.code && c.continent?.name === correct.continent?.name);
  const others = state.countries.filter(c => c.code !== correct.code);
  const distractors = shuffle([...shuffle(sameCont).slice(0, 2), ...shuffle(others).slice(0, 4)])
    .filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  state.current = { launch, country: correct, correctCode: correct.code, options };

  const dateStr = fmtDate(launch.launch_date_utc);
  const siteStr = launch.launch_site?.site_name_long || launch.launch_site?.site_name || '—';
  setText('launchIdx', String(state.asked + 1).padStart(3, '0'));
  setText('missionName', launch.mission_name || 'Untitled');
  setText('rocketName', launch.rocket?.rocket_name || '—');
  setText('launchDate', dateStr);
  setText('launchSite', siteStr);
  setText('quizMission', launch.mission_name || 'Untitled');
  setText('quizMeta', `${launch.rocket?.rocket_name || '—'} · ${dateStr} · ${siteStr}`);
  setText('revealFrom', `${launch.mission_name || ''} · ${launch.rocket?.rocket_name || ''}`);
  paintReveal(correct);
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
  options.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt text-left px-4 py-3 flex items-center gap-3 w-full';
    btn.dataset.code = c.code;
    btn.innerHTML = `
      <span class="key">${String.fromCharCode(65 + i)}</span>
      <span class="flex-1 truncate text-sm">${escapeHtml(c.name)}</span>
      <span class="badge badge-success badge-correct">✓ Correct</span>
      <span class="badge badge-destructive badge-wrong">✗ Wrong</span>`;
    btn.addEventListener('click', (e) => { e.stopPropagation(); onAnswer(c.code, btn); });
    wrap.appendChild(btn);
  });
}

async function onAnswer(code, btn) {
  if (state.locked) return;
  state.locked = true;
  const correct = state.current.correctCode;
  const ok = code === correct;
  document.querySelectorAll('#options .opt').forEach(el => {
    if (el.dataset.code === correct) el.dataset.result = ok ? 'correct' : 'reveal';
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

  const country = state.current.country;
  toast(
    ok ? 'success' : 'destructive',
    ok ? 'Correct' : 'Incorrect',
    ok ? `${country.emoji || ''} ${country.name}` : `Answer: ${country.emoji || ''} ${country.name}`
  );

  setTimeout(() => {
    $('cardWrap').dataset.state = 'answered';
    $('card').classList.add('flipped');
  }, 700);

  try {
    const d = await fetchCountries(COUNTRY_QUERY, { code: country.code });
    if (d?.country) paintReveal(d.country);
  } catch (_) { /* keep initial paint */ }

  state.history.push({ mission: state.current.launch.mission_name, ok, code: country.code, country: country.name });
  renderAtlas();

  $('skipBtn').classList.add('hidden');
  $('nextBtn').classList.remove('hidden');
  $('nextBtn').focus();
}

export function paintReveal(c) {
  $('flag').textContent = c.emoji || '🏳️';
  setText('revealCountry', c.name || '—');
  setText('revealCapital', c.capital || '—');
  setText('revealContinent', c.continent?.name || '—');
  setText('revealCurrency', c.currency || '—');
}
