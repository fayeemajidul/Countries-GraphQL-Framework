import { state } from './state.js';
import { $, setText, escapeHtml, fmtDate, resolveIso } from './utils.js';
import { fetchCountries, COUNTRY_QUERY } from './api.js';

export async function openDialog(code) {
  const c = state.byCode[code];
  if (!c) return;
  fillDialog(c);
  $('dialog').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Refetch for freshest data — chains Countries API live.
  try {
    const d = await fetchCountries(COUNTRY_QUERY, { code });
    if (d?.country) fillDialog(d.country);
  } catch (_) { /* ignore — initial paint is sufficient */ }
}

export function fillDialog(c) {
  $('dlgFlag').textContent = c.emoji || '🏳️';
  setText('dlgName', c.name || '—');
  setText('dlgSubtitle', `${c.code} · ${c.continent?.name || '—'}`);
  setText('dlgCapital', c.capital || '—');
  setText('dlgContinent', c.continent?.name || '—');
  setText('dlgCurrency', c.currency || '—');
  setText('dlgLanguages', (c.languages || []).map(l => l.name).slice(0, 5).join(', ') || '—');
  const launches = state.launches.filter(L => resolveIso(L?.rocket?.rocket?.country) === c.code);
  const block = $('dlgLaunchBlock');
  if (launches.length) {
    block.classList.remove('hidden');
    $('dlgLaunchList').innerHTML = launches.slice(0, 6).map(L => `
      <div class="flex items-baseline justify-between gap-3 py-1 border-b last:border-0" style="border-color: hsl(var(--border));">
        <span class="truncate">${escapeHtml(L.mission_name)}</span>
        <span class="mono text-[11px] text-[var(--mute)] whitespace-nowrap">${fmtDate(L.launch_date_utc)}</span>
      </div>`).join('') + (launches.length > 6 ? `<div class="mono text-[11px] text-[var(--mute)] pt-1">+${launches.length - 6} more</div>` : '');
  } else {
    block.classList.add('hidden');
  }
}

export function closeDialog() {
  $('dialog').classList.add('hidden');
  document.body.style.overflow = '';
}
