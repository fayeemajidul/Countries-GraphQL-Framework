import { state } from './state.js';
import { $, setText } from './utils.js';
import { boot, nextRound, openQuiz } from './quiz.js';
import { reshuffleAtlas } from './atlas.js';
import { closeDialog } from './dialog.js';

$('card').addEventListener('click', (e) => {
  if (e.target.closest('.opt')) return;
  openQuiz();
});

$('card').addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    openQuiz();
  }
});

$('nextBtn').addEventListener('click', nextRound);

$('skipBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  state.streak = 0;
  setText('streak', 0);
  nextRound();
});

$('atlasShuffle').addEventListener('click', reshuffleAtlas);

document.querySelectorAll('[data-dialog-close]').forEach(el => el.addEventListener('click', closeDialog));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('dialog').classList.contains('hidden')) {
    closeDialog();
    return;
  }
  if (e.target.matches('input')) return;
  if (e.key === 'Enter' && !$('nextBtn').classList.contains('hidden')) {
    $('nextBtn').click();
    return;
  }
  if (state.locked || $('cardWrap').dataset.state !== 'asking') return;
  const idx = ['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].indexOf(e.key);
  if (idx >= 0) {
    document.querySelectorAll('#options .opt')[idx % 4]?.click();
  }
});

boot();
