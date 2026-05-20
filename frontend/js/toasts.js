import { $, escapeHtml } from './utils.js';

export function toast(variant, title, desc, timeout = 2800) {
  const region = $('toasts');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.dataset.variant = variant;
  const icon = variant === 'success'
    ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6" stroke="hsl(var(--success-fg))" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="hsl(var(--destructive-fg))" stroke-width="1.5" stroke-linecap="round"/></svg>';
  el.innerHTML = `
    <span class="mt-0.5">${icon}</span>
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium">${escapeHtml(title)}</div>
      ${desc ? `<div class="text-xs text-[var(--mute)] mt-0.5 truncate">${escapeHtml(desc)}</div>` : ''}
    </div>`;
  region.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, timeout);
}
