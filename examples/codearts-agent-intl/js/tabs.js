/* First-class tabs layout: manual panel switch; no auto-rotate. */
(function () {
  'use strict';
  document.querySelectorAll('[data-tabs-root]').forEach(container => {
    const buttons = [...container.querySelectorAll('[data-tab-choice]')];
    const panels = [...container.querySelectorAll('[data-tab-panel]')];
    const select = button => {
      buttons.forEach(item => {
        const on = item === button;
        item.setAttribute('aria-selected', String(on));
        item.tabIndex = on ? 0 : -1;
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.tabPanel !== button.dataset.tabChoice;
      });
    };
    buttons.forEach(button => {
      button.addEventListener('click', () => select(button));
      button.addEventListener('keydown', event => {
        const index = buttons.indexOf(button);
        let next = -1;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        if (next < 0) return;
        event.preventDefault();
        select(buttons[next]);
        buttons[next].focus();
      });
    });
    if (buttons.length) select(buttons[0]);
  });
})();
