/* Declarative compare-board: preset chips switch SSR panels; no math engine. */
(function () {
  'use strict';
  document.querySelectorAll('[data-compare-board]').forEach(container => {
    const buttons = [...container.querySelectorAll('[data-compare-choice]')];
    const panels = [...container.querySelectorAll('[data-compare-panel]')];
    const select = button => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      panels.forEach(panel => {
        panel.hidden = panel.dataset.comparePanel !== button.dataset.compareChoice;
      });
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    if (buttons.length) select(buttons[0]);
  });
})();
