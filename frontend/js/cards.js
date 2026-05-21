// Render functions for the rocket grid tiles and the detail modal body.
// Pure HTML-string builders — store.js owns event wiring after innerHTML.

import { escapeHtml, fmtPrice, pickIllustration } from './utils.js';

export function card(r) {
  const cur = (r.country?.currency || 'USD').split(',')[0].trim();
  const price = fmtPrice(r.cost_per_launch, cur) || '—';
  const priceUSD = fmtPrice(r.cost_per_launch, 'USD');
  const isHero = r.missions.length >= 50;
  const isNew = (new Date(r.first_flight || 0).getFullYear() >= 2020);

  return `
    <article class="product pop">
      <div class="product-img cursor-pointer" data-detail="${r.id}">
        <svg width="180" height="180" viewBox="0 0 160 220" style="color: hsl(var(--foreground) / .85);">
          <use href="#${pickIllustration(r)}"/>
        </svg>
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          ${isHero ? '<span class="badge badge-best">Bestseller</span>' : ''}
          ${(!isHero && isNew) ? '<span class="badge badge-sponsor">New release</span>' : ''}
        </div>
        <div class="absolute bottom-3 right-3 mono text-[10px] text-[var(--mute)] tracking-widest uppercase">${r.country?.emoji || ''} ${escapeHtml(r.country?.code || '')}</div>
      </div>
      <div class="p-4 flex-1 flex flex-col gap-2">
        <h3 class="serif text-2xl leading-tight cursor-pointer" data-detail="${r.id}">${escapeHtml(r.name)}</h3>
        <div class="mono text-[11px] text-[var(--mute)] tracking-widest uppercase">
          <span class="text-[var(--ink)]">${r.success_rate_pct ?? '—'}%</span> success · <span class="text-[var(--ink)]">${r.missions.length}</span> missions
        </div>
        <p class="text-sm text-[var(--mute)] line-clamp-2">${escapeHtml(r.description || 'No description.')}</p>

        <div class="mt-1 flex items-baseline gap-2 flex-wrap">
          <span class="serif text-3xl leading-none">${escapeHtml(price)}</span>
          ${cur !== 'USD' && priceUSD ? `<span class="mono text-[11px] text-[var(--mute)]">≈ ${escapeHtml(priceUSD)}</span>` : ''}
        </div>

        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--mute)]">
          <span>From <span class="text-[var(--ink)]">${escapeHtml(r.country?.name || '—')}</span></span>
          <span>Paid in <span class="mono text-[var(--ink)]">${escapeHtml(cur)}</span></span>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button class="btn btn-cart flex-1" data-cart="${r.id}">Buy now</button>
          <button class="btn btn-ghost" data-detail="${r.id}">Details</button>
        </div>
      </div>
    </article>`;
}

export function renderDetailBody(r) {
  const cur = (r.country?.currency || 'USD').split(',')[0].trim();
  const price = fmtPrice(r.cost_per_launch, cur) || '—';
  const priceUSD = fmtPrice(r.cost_per_launch, 'USD');
  const successful = r.missions.filter(m => m.launch_success).length;
  const failed = r.missions.filter(m => m.launch_success === false).length;

  return `
    <!-- Hero -->
    <div class="flex items-start gap-5 flex-wrap">
      <div class="product-img rounded-lg flex-shrink-0" style="width: 200px; aspect-ratio: 4/3; position:relative;">
        <svg width="160" height="160" viewBox="0 0 160 220" style="position:absolute; inset:0; margin:auto; color: hsl(var(--foreground));">
          <use href="#${pickIllustration(r)}"/>
        </svg>
      </div>
      <div class="flex-1 min-w-[220px]">
        <h2 id="modalTitle" class="serif text-4xl leading-tight tracking-tight">${escapeHtml(r.name)}</h2>
        <div class="mono text-[11px] text-[var(--mute)] tracking-widest uppercase mt-1">
          <span class="text-[var(--ink)]">${r.success_rate_pct ?? '—'}%</span> success · <span class="text-[var(--ink)]">${r.missions.length}</span> missions${successful || failed ? ` · ${successful} ok${failed ? ` / ${failed} failed` : ''}` : ''}
        </div>
        <div class="mt-4 flex items-baseline gap-2 flex-wrap">
          <span class="serif text-4xl leading-none">${escapeHtml(price)}</span>
          ${cur !== 'USD' && priceUSD ? `<span class="mono text-xs text-[var(--mute)]">≈ ${escapeHtml(priceUSD)}</span>` : ''}
        </div>
        <button class="btn btn-cart mt-4 w-full sm:w-auto" data-cart-modal="${r.id}">Buy now</button>
      </div>
    </div>

    <!-- Middle: live spec sheet (SpaceX) -->
    <div class="mt-7 rounded-lg border" style="border-color: hsl(var(--border));">
      <div class="px-5 py-3 border-b flex items-center justify-between" style="border-color: hsl(var(--border));">
        <div class="mono text-[10px] tracking-widest uppercase text-[var(--mute)]">Specifications</div>
        <div class="mono text-[10px] tracking-widest uppercase glow-token">spacex.rockets</div>
      </div>
      <div class="px-5 py-4">
        <h4 class="mono text-[10px] uppercase tracking-widest text-[var(--mute)] mb-1">Origin</h4>
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl leading-none">${r.country?.emoji || '🏳️'}</span>
          <div class="text-sm">
            <div class="font-medium">${escapeHtml(r.country?.name || '—')}</div>
            <div class="mono text-[11px] text-[var(--mute)]">${escapeHtml(r.country?.continent?.name || '')}${r.country?.capital ? ` · capital ${escapeHtml(r.country.capital)}` : ''}</div>
          </div>
        </div>

        <h4 class="mono text-[10px] uppercase tracking-widest text-[var(--mute)] mb-1">Description</h4>
        <p class="text-sm text-[var(--mute)] leading-relaxed mb-5">${escapeHtml(r.description || 'No description on record.')}</p>

        <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4 text-sm">
          <div><dt class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">First flight</dt><dd class="mt-0.5">${escapeHtml(r.first_flight || '—')}</dd></div>
          <div><dt class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Height</dt><dd class="mt-0.5">${r.height?.meters != null ? r.height.meters + ' m' : '—'}</dd></div>
          <div><dt class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Diameter</dt><dd class="mt-0.5">${r.diameter?.meters != null ? r.diameter.meters + ' m' : '—'}</dd></div>
          <div><dt class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Mass</dt><dd class="mt-0.5">${r.mass?.kg != null ? Math.round(r.mass.kg).toLocaleString() + ' kg' : '—'}</dd></div>
          <div><dt class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Stages</dt><dd class="mt-0.5">${r.stages ?? '—'}</dd></div>
          <div><dt class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Boosters</dt><dd class="mt-0.5">${r.boosters ?? '—'}</dd></div>
        </dl>
      </div>
    </div>

    <!-- Also available in (Countries, live re-fetch) -->
    <div class="mt-6 rounded-lg border" style="border-color: hsl(var(--border));">
      <div class="px-5 py-3 border-b flex items-center justify-between" style="border-color: hsl(var(--border));">
        <div class="mono text-[10px] tracking-widest uppercase text-[var(--mute)]">Also available in</div>
        <div class="mono text-[10px] tracking-widest uppercase glow-token">countries.country</div>
      </div>
      <div id="soldIn" class="px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="skel h-10 w-10 rounded-full"></div>
          <div class="flex-1 space-y-1"><div class="skel h-3 w-32"></div><div class="skel h-3 w-48"></div></div>
        </div>
      </div>
    </div>
  `;
}

export function renderSoldIn(rocket, country) {
  const cur = (country.currency || 'USD').split(',')[0].trim();
  const altPrice = fmtPrice(rocket.cost_per_launch, cur) || '—';
  return `
    <div class="flex items-start gap-4 flex-wrap">
      <span class="text-4xl leading-none">${country.emoji || '🏳️'}</span>
      <div class="flex-1 min-w-[180px]">
        <div class="serif text-xl leading-none">${escapeHtml(country.name)}</div>
        <div class="mono text-[11px] text-[var(--mute)] mt-1">${escapeHtml(country.continent?.name || '')}${country.capital ? ` · capital ${escapeHtml(country.capital)}` : ''} · pays in <span class="text-[var(--ink)]">${escapeHtml(cur)}</span></div>
        ${country.languages?.length ? `<div class="mono text-[11px] text-[var(--mute)] mt-0.5">Speaks ${country.languages.slice(0, 3).map(l => escapeHtml(l.name)).join(', ')}</div>` : ''}
      </div>
      <div class="text-right">
        <div class="mono text-[10px] uppercase tracking-widest text-[var(--mute)]">Local price</div>
        <div class="serif text-2xl mt-0.5">${escapeHtml(altPrice)}</div>
      </div>
    </div>`;
}
