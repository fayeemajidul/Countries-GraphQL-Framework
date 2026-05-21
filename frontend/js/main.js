import { state } from './state.js';
import { $ } from './utils.js';
import { boot, showModal, showToast } from './store.js';

$('closeModal').addEventListener('click', () => showModal(false));
$('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') showModal(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') showModal(false);
});

$('openCart').addEventListener('click', () => {
  if (!state.cart.length) {
    showToast('Cart is empty — buy a rocket to get started');
    return;
  }
  showToast(`${state.cart.length} rocket${state.cart.length > 1 ? 's' : ''} purchased · ready for liftoff`);
});

boot();
