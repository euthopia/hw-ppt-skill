(function () {
  'use strict';
  const slides = [...document.querySelectorAll('#deck > .slide')];
  const slideKeys = slides.map(slide => slide.dataset.slideId || slide.dataset.title);
  const slideSections = slides.map(slide => slide.dataset.section);
  const visibilityKey = window.DeckConfig.id + '-hidden-pages-v1';
  const hintKey = window.DeckConfig.id + '-presenter-hint-v1';
  let hiddenKeys = readHiddenKeys(), draftHidden = null;
  const hiddenIndices = keys => slideKeys.flatMap((key, index) => keys.has(key) ? [index] : []);
  const state = DeckNavigation.create(slides.map(s => Number(s.dataset.steps || 0)), hiddenIndices(hiddenKeys));
  const storageKey = window.DeckConfig.id + '-position-v1';
  const dialog = document.getElementById('overview-dialog');
  const controls = document.getElementById('controls');
  const byId = id => document.getElementById(id);
  let idleTimer, toastTimer, returnFocus;
  let pointerAtBottom = false, keyboardControls = false;
  let presenterMode = false;
  let timerStartedAt = null;
  let timerInterval = null;
  let lastSlideIndex = state.index;
  const deckEl = document.getElementById('deck');
  const prefersReducedMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  };
  const inkClearOnLeave = !!(window.DeckConfig && window.DeckConfig.presenterInk && window.DeckConfig.presenterInk.clearOnLeave);
  const ink = window.PresenterInk
    ? window.PresenterInk.create({
      slideKey: slideKeys[state.index] || String(state.index),
      clearOnLeave: inkClearOnLeave,
    })
    : null;
  const inkHost = document.createElement('div');
  inkHost.id = 'presenter-ink';
  inkHost.className = 'presenter-ink';
  inkHost.setAttribute('aria-hidden', 'true');
  const inkCanvas = document.createElement('canvas');
  inkCanvas.width = 1600;
  inkCanvas.height = 900;
  inkHost.append(inkCanvas);
  if (deckEl) deckEl.append(inkHost);
  const inkCtx = inkCanvas.getContext('2d');
  function redrawInk() {
    if (!ink || !inkCtx) return;
    inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    window.PresenterInk.paintStrokes(inkCtx, ink.getStrokes());
  }
  let toolRail = null;
  function syncInkChrome() {
    if (!ink) return;
    const mode = ink.getMode();
    const laserActive = mode === 'laser';
    const laserDot = laserActive && !prefersReducedMotion();
    document.body.classList.toggle('laser-on', laserDot);
    document.body.classList.toggle('laser-reduced', laserActive && prefersReducedMotion());
    document.body.classList.toggle('ink-pen', mode === 'pen');
    document.body.classList.toggle('ink-eraser', mode === 'eraser');
    inkHost.classList.toggle('is-drawing', mode === 'pen' || mode === 'eraser');
    if (toolRail) toolRail.refresh();
  }
  function toolToast(mode) {
    if (mode === 'laser') toast('激光笔已开启');
    else if (mode === 'pen') toast('马克笔已开启');
    else if (mode === 'eraser') toast('橡皮已开启');
    else toast('已退出演示笔');
  }
  function applyToolMode(mode) {
    if (!ink) return;
    ink.setMode(mode);
    syncInkChrome();
    if (presenterMode) refreshPresenterNotes();
    else toolToast(mode);
  }
  try { presenterMode = new URLSearchParams(location.search).get('presenter') === '1'; } catch { /* ignore */ }
  const notesPanel = document.createElement('aside');
  notesPanel.id = 'presenter-notes';
  notesPanel.className = 'presenter-notes';
  notesPanel.hidden = true;
  notesPanel.setAttribute('role', 'complementary');
  notesPanel.setAttribute('aria-label', '演示备注');
  document.body.append(notesPanel);

  const helpDialog = document.createElement('dialog');
  helpDialog.id = 'keyboard-help';
  helpDialog.className = 'keyboard-help';
  helpDialog.setAttribute('aria-modal', 'true');
  helpDialog.setAttribute('aria-labelledby', 'keyboard-help-title');
  helpDialog.innerHTML = [
    '<div class="dialog-header"><div><div class="eyebrow">SHORTCUTS</div>',
    '<h2 id="keyboard-help-title">快捷键对照</h2></div>',
    '<button type="button" class="icon-button" data-help-close aria-label="关闭快捷键对照">×</button></div>',
    '<ul class="keyboard-help-list" role="list">',
    '<li><kbd>←</kbd><kbd>→</kbd><span>翻页</span></li>',
    '<li><kbd>G</kbd><span>目录</span></li>',
    '<li><kbd>N</kbd><span>演示备注</span></li>',
    '<li><kbd>L</kbd><span>激光笔</span></li>',
    '<li><kbd>P</kbd><kbd>D</kbd><span>马克笔</span></li>',
    '<li><kbd>E</kbd><span>橡皮</span></li>',
    '<li><kbd>⇧E</kbd><span>清除本页墨迹</span></li>',
    '<li><kbd>C</kbd><span>笔色红/黑</span></li>',
    '<li><kbd>[</kbd><kbd>]</kbd><span>笔粗细</span></li>',
    '<li><kbd>T</kbd><span>演示计时</span></li>',
    '<li><kbd>F</kbd><span>全屏</span></li>',
    '<li><kbd>?</kbd><span>本对照表</span></li>',
    '<li><kbd>Esc</kbd><span>退出笔工具 / 关闭对话框</span></li>',
    '</ul>',
    '<p class="keyboard-help-tip">URL 参数：?cut=名称 分享切片；?presenter=1 打开备注。墨迹按页保存；打印/导出不显示。</p>',
  ].join('');
  document.body.append(helpDialog);
  helpDialog.querySelector('[data-help-close]').addEventListener('click', () => helpDialog.close());
  function focusableIn(el) {
    return [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true');
  }
  function trapTab(event, host) {
    if (event.key !== 'Tab') return;
    const nodes = focusableIn(host);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function openKeyboardHelp() {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    helpDialog.showModal();
    helpDialog.querySelector('[data-help-close]').focus();
  }
  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
  function ensureTimer() {
    if (timerStartedAt !== null) return;
    timerStartedAt = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (presenterMode) refreshPresenterNotes();
    }, 1000);
  }
  function toggleTimer() {
    if (timerStartedAt === null) ensureTimer();
    else {
      timerStartedAt = null;
      clearInterval(timerInterval);
      timerInterval = null;
    }
    refreshPresenterNotes();
  }

  function cutHiddenKeys() {
    try {
      const cut = new URLSearchParams(location.search).get('cut');
      const preset = cut && window.DeckConfig.cuts?.[cut];
      if (!preset || !Array.isArray(preset.hidden)) return null;
      const keys = new Set(preset.hidden.filter(key => slideKeys.includes(key)));
      return keys.size && keys.size < slides.length ? keys : null;
    } catch { return null; }
  }

  function readHiddenKeys() {
    const fromCut = cutHiddenKeys();
    if (fromCut) return fromCut;
    try {
      const saved = JSON.parse(localStorage.getItem(visibilityKey));
      if (saved?.version !== 1 || !Array.isArray(saved.hidden)) return new Set();
      const keys = new Set(saved.hidden.filter(key => typeof key === 'string' && slideKeys.includes(key)));
      return keys.size < slides.length ? keys : new Set();
    } catch { return new Set(); }
  }

  function refreshOverviewSettings() {
    const editing = draftHidden !== null;
    const choices = editing ? draftHidden : hiddenKeys;
    dialog.classList.toggle('overview-editing', editing);
    byId('overview-manage').hidden = editing;
    for (const id of ['overview-save', 'overview-cancel', 'overview-restore']) byId(id).hidden = !editing;
    byId('overview-mode-label').textContent = editing ? '勾选不演示的页面，再保存' : '点击页面直接跳转';
    byId('overview-skipped-count').textContent = String(choices.size);
    byId('overview-total-count').textContent = String(slides.length);
    byId('overview-save').disabled = choices.size === slides.length;
    byId('overview-settings-error').hidden = !editing || choices.size < slides.length;
  }

  function beginVisibilityEdit() {
    draftHidden = new Set(hiddenKeys);
    refreshThumbnails();
    dialog.querySelector('.thumbnail').focus();
  }

  function cancelVisibilityEdit() {
    draftHidden = null;
    refreshThumbnails();
    byId('overview-manage').focus();
  }

  function saveVisibilityEdit() {
    if (draftHidden === null || draftHidden.size === slides.length) return;
    hiddenKeys = new Set(draftHidden);
    let persisted = true;
    try { localStorage.setItem(visibilityKey, JSON.stringify({version:1, hidden:[...hiddenKeys]})); }
    catch { persisted = false; }
    draftHidden = null;
    state.setHidden(hiddenIndices(hiddenKeys));
    render();
    dialog.close();
    toast(persisted ? '已保存页面屏蔽设置' : '浏览器无法保存设置，本次会话仍会生效');
  }

  const chapters = window.DeckConfig.chapters;
  slides.forEach(slide => {
    if (!slide.querySelector('.slide-header')) return;
    if (slide.classList.contains('cover')) return;
    const nav = document.createElement('nav'); nav.className = 'chapter-nav'; nav.setAttribute('aria-label', '演示章节');
    chapters.forEach(chapter => {
      const first = slides.findIndex(s => s.dataset.section === chapter.section);
      if (first < 0) return;
      const link = document.createElement('a'); link.href = `#slide=${first + 1}`;
      link.dataset.chapter = chapter.section;
      const current = chapter.section === slide.dataset.section;
      link.className = current ? 'current' : ''; if (current) link.setAttribute('aria-current', 'true');
      link.textContent = chapter.label; nav.append(link);
    });
    slide.querySelector('.slide-header > span').replaceWith(nav);
  });

  function fit() {
    const rect = byId('viewport').getBoundingClientRect();
    const padding = document.fullscreenElement ? 0 : (window.innerWidth < 700 ? 12 : 36);
    const scale = Math.min((rect.width - padding) / 1600, (rect.height - padding) / 900);
    document.documentElement.style.setProperty('--scale', Math.max(.08, scale));
    const deckBottom = byId('deck').getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--controls-bottom', `${Math.max(12, innerHeight - deckBottom + 14)}px`);
    if (dialog.open) fitThumbnails();
  }
  function fitThumbnails() {
    dialog.querySelectorAll('.thumbnail-preview').forEach(preview => {
      preview.firstElementChild.style.transform = `scale(${preview.clientWidth / 1600})`;
    });
  }
  function refreshThumbnails() {
    refreshOverviewSettings();
    const grid = byId('overview-grid');
    grid.replaceChildren();
    slides.forEach((slide, index) => {
      const button = document.createElement('button');
      const editing = draftHidden !== null;
      const skipped = (editing ? draftHidden : hiddenKeys).has(slideKeys[index]);
      button.className = 'thumbnail' + (index === state.index ? ' current' : '') +
        (editing && skipped ? ' is-selected' : !editing && skipped ? ' is-skipped' : '');
      button.type = 'button';
      if (editing) button.setAttribute('aria-pressed', String(skipped));
      else if (skipped) { button.disabled = true; button.title = '已屏蔽，请在目录中恢复后演示'; }
      button.setAttribute('aria-label', `第 ${index + 1} 页：${slide.dataset.title}`);
      button.dataset.index = index;
      const preview = document.createElement('div');
      preview.className = 'thumbnail-preview';
      preview.setAttribute('aria-hidden', 'true');
      preview.inert = true;
      const clone = slide.cloneNode(true);
      window.DeckI18n?.copySource(slide, clone);
      if (window.DeckCompleteScenePreview) window.DeckCompleteScenePreview(clone);
      clone.classList.remove('active');
      clone.removeAttribute('aria-hidden');
      clone.removeAttribute('inert');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('a,button,input,textarea,select,[contenteditable]').forEach(el => el.setAttribute('tabindex', '-1'));
      preview.append(clone);
      button.append(preview);
      const caption = document.createElement('div');
      caption.className = 'thumbnail-caption';
      const indexEl = document.createElement('b');
      indexEl.textContent = String(index + 1).padStart(2, '0');
      const titleEl = document.createElement('span');
      titleEl.textContent = slide.dataset.title || '';
      caption.append(indexEl, titleEl);
      button.append(caption);
      if (editing || skipped) {
        const badge = document.createElement('span'); badge.className = 'thumbnail-selection'; badge.setAttribute('aria-hidden', 'true');
        if (editing) {
          const checkbox = document.createElement('span'); checkbox.className = 'thumbnail-selection-box';
          checkbox.textContent = skipped ? '✓' : ''; badge.append(checkbox);
        }
        if (skipped) { const label = document.createElement('span'); label.textContent = '不演示'; badge.append(label); }
        button.append(badge);
      }
      button.addEventListener('click', () => {
        if (draftHidden !== null) {
          if (draftHidden.has(slideKeys[index])) draftHidden.delete(slideKeys[index]);
          else draftHidden.add(slideKeys[index]);
          const scrollTop = dialog.scrollTop;
          refreshThumbnails();
          grid.querySelector(`[data-index="${index}"]`).focus({preventScroll:true});
          dialog.scrollTop = scrollTop;
        } else { state.jump(index); render(); dialog.close(); }
      });
      grid.append(button);
    });
    if (dialog.open) requestAnimationFrame(fitThumbnails);
  }
  function render() {
    const visible = state.visibleIndices;
    if (deckEl) {
      const dir = state.index > lastSlideIndex ? 'forward'
        : state.index < lastSlideIndex ? 'back' : 'none';
      deckEl.dataset.navDir = dir;
      lastSlideIndex = state.index;
    }
    slides.forEach((slide, index) => {
      const active = index === state.index;
      slide.classList.toggle('active', active);
      slide.classList.toggle('is-skipped', !state.isVisible(index));
      slide.classList.toggle('presentation-last', index === visible.at(-1));
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      slide.querySelectorAll('[data-reveal]').forEach(el => {
        const concealed = Number(el.dataset.reveal) > state.step;
        el.classList.toggle('is-concealed', concealed);
        el.setAttribute('aria-hidden', String(concealed));
      });
    });
    const slide = slides[state.index];
    byId('section-label').textContent = slide.dataset.section;
    const counter = byId('page-counter');
    counter.replaceChildren(
      document.createTextNode(`${String(visible.indexOf(state.index) + 1).padStart(2, '0')} `),
      Object.assign(document.createElement('span'), { textContent: `/ ${visible.length}` })
    );
    byId('progress').style.width = `${(visible.indexOf(state.index) + 1) / visible.length * 100}%`;
    byId('previous').disabled = !state.canPrevious();
    byId('next').disabled = !state.canNext();
    slides.forEach(page => page.querySelectorAll('.chapter-nav a').forEach(link => {
      const chapter = chapters.find(item => item.section === link.dataset.chapter);
      const first = slides.findIndex((_, index) => state.isVisible(index) &&
        (chapter.sections || [chapter.section]).includes(slideSections[index]));
      if (first < 0) {
        link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); link.setAttribute('tabindex', '-1');
      } else {
        link.href = `#slide=${first + 1}`; link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex');
      }
    }));
    byId('announcement').textContent = `第 ${state.index + 1} 页，共 ${slides.length} 页：${slide.dataset.title}`;
    const hash = `#slide=${state.index + 1}`;
    try { if (location.hash !== hash) history.replaceState(null, '', hash); } catch { location.hash = hash; }
    try { localStorage.setItem(storageKey, JSON.stringify({ index: state.index, step: state.step })); } catch { /* Private browsers can still present. */ }
    if (dialog.open) refreshThumbnails();
    if (ink) {
      const key = slideKeys[state.index] || String(state.index);
      if (key !== ink.getSlideKey()) {
        ink.onSlideChange(key);
        redrawInk();
      }
    }
    refreshPresenterNotes();
    document.dispatchEvent(new CustomEvent('deckpagechange', { detail: { index: state.index } }));
  }
  function refreshPresenterNotes() {
    notesPanel.hidden = !presenterMode;
    document.body.classList.toggle('presenter-mode', presenterMode);
    if (!presenterMode) { notesPanel.replaceChildren(); return; }
    if (timerStartedAt === null) ensureTimer();
    const slide = slides[state.index];
    const nextVisible = state.visibleIndices.find(index => index > state.index);
    const next = nextVisible === undefined ? null : slides[nextVisible];
    const chrome = document.createElement('div');
    chrome.className = 'presenter-notes-chrome';
    const title = document.createElement('div');
    title.className = 'presenter-notes-label';
    title.textContent = '演示备注';
    const timer = document.createElement('div');
    timer.className = 'presenter-timer';
    timer.setAttribute('aria-live', 'off');
    timer.setAttribute('aria-label', '演示计时');
    timer.textContent = formatElapsed(Date.now() - (timerStartedAt || Date.now()));
    chrome.append(title, timer);
    const body = document.createElement('p');
    body.textContent = slide.dataset.notes || '—';
    const upcoming = document.createElement('div');
    upcoming.className = 'presenter-notes-next';
    upcoming.textContent = next
      ? `下一页预告：${String(nextVisible + 1).padStart(2, '0')} ${next.dataset.title || ''}`
      : '下一页预告：—';
    const tip = document.createElement('div');
    tip.className = 'presenter-notes-tip';
    const mode = ink ? ink.getMode() : 'off';
    tip.textContent = mode === 'off'
      ? '按 N 关闭备注 · L 激光 · P 马克笔 · T 计时'
      : mode === 'laser'
        ? '激光中 · Esc 退出 · P 马克笔 · T 计时'
        : mode === 'eraser'
          ? '橡皮中 · Esc 退出 · ⇧E 清除本页'
          : '马克笔中 · Esc 退出 · C 换色 · E 橡皮';
    notesPanel.replaceChildren(chrome, body, upcoming, tip);
  }
  function move(direction) { direction > 0 ? state.next() : state.previous(); render(); wake(); }
  function openOverview() {
    returnFocus = document.activeElement;
    draftHidden = null;
    wake(); refreshThumbnails(); dialog.showModal();
    requestAnimationFrame(() => { fitThumbnails(); dialog.querySelector('.current').focus(); });
  }
  function wake(force = false) {
    clearTimeout(idleTimer);
    if (force || pointerAtBottom || (keyboardControls && controls.contains(document.activeElement))) {
      document.body.classList.add('controls-visible');
      if (force && !pointerAtBottom) idleTimer = setTimeout(() => {
        if (!(keyboardControls && controls.contains(document.activeElement))) document.body.classList.remove('controls-visible');
      }, 2600);
    } else {
      idleTimer = setTimeout(() => document.body.classList.remove('controls-visible'), 250);
    }
  }
  function toast(message) {
    byId('toast').textContent = message; byId('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => byId('toast').hidden = true, 3500);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.body.requestFullscreen) await document.body.requestFullscreen();
      else toast('当前浏览器不支持网页全屏，可使用浏览器的全屏功能。');
    } catch { toast('全屏未能开启，可使用浏览器的全屏功能。'); }
    byId('fullscreen').blur();
  }
  byId('previous').addEventListener('click', () => move(-1));
  byId('next').addEventListener('click', () => move(1));
  byId('page-counter').addEventListener('click', openOverview);
  byId('overview').addEventListener('click', openOverview);
  byId('close-overview').addEventListener('click', () => dialog.close());
  byId('overview-manage').addEventListener('click', beginVisibilityEdit);
  byId('overview-cancel').addEventListener('click', cancelVisibilityEdit);
  byId('overview-save').addEventListener('click', saveVisibilityEdit);
  byId('overview-restore').addEventListener('click', () => { if (draftHidden !== null) { draftHidden.clear(); refreshThumbnails(); byId('overview-restore').focus(); } });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('keydown', event => trapTab(event, dialog));
  helpDialog.addEventListener('keydown', event => trapTab(event, helpDialog));
  dialog.addEventListener('close', () => { draftHidden = null; refreshThumbnails(); if (returnFocus?.isConnected) returnFocus.focus(); wake(); });
  byId('fullscreen').addEventListener('click', toggleFullscreen);
  byId('previous').setAttribute('aria-keyshortcuts', 'ArrowLeft');
  byId('next').setAttribute('aria-keyshortcuts', 'ArrowRight');
  byId('overview').setAttribute('aria-haspopup', 'dialog');
  byId('overview').setAttribute('aria-controls', 'overview-dialog');
  document.addEventListener('fullscreenchange', () => { byId('fullscreen-label').textContent = document.fullscreenElement ? '退出全屏' : '全屏'; fit(); wake(); });
  document.addEventListener('pointermove', event => {
    if (ink && ink.getMode() === 'laser' && !prefersReducedMotion()) {
      document.documentElement.style.setProperty('--laser-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--laser-y', `${event.clientY}px`);
    }
    if (ink && ink.isDrawing() && deckEl) {
      const point = window.PresenterInk.mapPoint(event.clientX, event.clientY, deckEl.getBoundingClientRect());
      if (point && ink.extendStroke(point)) redrawInk();
    }
    if (event.pointerType === 'touch') return;
    keyboardControls = false;
    const deck = byId('deck').getBoundingClientRect();
    pointerAtBottom = event.clientY >= Math.min(innerHeight - 100, deck.bottom - 75);
    wake();
  });
  document.documentElement.addEventListener('pointerleave', () => { pointerAtBottom = false; wake(); });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && event.clientY >= innerHeight - 100) wake(true);
    if (!ink || !deckEl) return;
    const mode = ink.getMode();
    if (mode !== 'pen' && mode !== 'eraser') return;
    if (event.target.closest('button,a,input,textarea,select,dialog,.controls,.presenter-notes,.keyboard-help,.deck-tool-rail')) return;
    const point = window.PresenterInk.mapPoint(event.clientX, event.clientY, deckEl.getBoundingClientRect());
    if (!point) return;
    event.preventDefault();
    ink.beginStroke(point);
    redrawInk();
    try { inkCanvas.setPointerCapture(event.pointerId); } catch { /* ignore */ }
  });
  document.addEventListener('pointerup', event => {
    if (!ink || !ink.isDrawing()) return;
    ink.endStroke();
    try { inkCanvas.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
  });
  document.addEventListener('pointercancel', () => {
    if (ink && ink.isDrawing()) ink.endStroke();
  });
  document.addEventListener('focusin', () => wake());
  document.addEventListener('focusout', () => setTimeout(() => wake(), 0));
  window.addEventListener('resize', fit);
  // Observe the actual layout area: fullscreen and viewport emulation can finish
  // their layout update after the window resize event has already fired.
  if (window.ResizeObserver) new ResizeObserver(fit).observe(byId('viewport'));
  window.addEventListener('hashchange', () => { const index = DeckNavigation.parseHash(location.hash, slides.length); if (index !== null) { state.jump(index); render(); } });
  window.addEventListener('storage', event => {
    if (event.key !== visibilityKey && event.key !== null) return;
    hiddenKeys = readHiddenKeys(); state.setHidden(hiddenIndices(hiddenKeys)); render();
  });
  document.addEventListener('decklanguagechange', () => {
    if (dialog.open) refreshThumbnails();
    else refreshOverviewSettings();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !document.querySelector('dialog[open]')) {
      const wasHidden = !document.body.classList.contains('controls-visible');
      keyboardControls = true; wake(true);
      if (wasHidden) { event.preventDefault(); controls.querySelector('button:not(:disabled)').focus(); }
    }
    if (helpDialog.open && (event.key === '?' || event.key === '/')) {
      event.preventDefault();
      helpDialog.close();
      return;
    }
    if (event.key === 'Escape' && !document.querySelector('dialog[open]') && ink && ink.getMode() !== 'off') {
      event.preventDefault();
      applyToolMode('off');
      return;
    }
    if (document.querySelector("dialog[open]") || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key === ' ' && event.target.closest('button,a')) return;
    const nextKeys = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
    const previousKeys = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    if (nextKeys.includes(event.key)) { event.preventDefault(); move(1); }
    else if (previousKeys.includes(event.key)) { event.preventDefault(); move(-1); }
    else if (event.key === 'Home') { event.preventDefault(); state.jump(state.visibleIndices[0]); render(); }
    else if (event.key === 'End') { event.preventDefault(); state.jump(state.visibleIndices.at(-1)); render(); }
    else if (event.key.toLowerCase() === 'g') { event.preventDefault(); openOverview(); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
    else if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
      event.preventDefault();
      openKeyboardHelp();
    }
    else if (event.key.toLowerCase() === 'n') {
      event.preventDefault();
      presenterMode = !presenterMode;
      try {
        const url = new URL(location.href);
        if (presenterMode) url.searchParams.set('presenter', '1');
        else url.searchParams.delete('presenter');
        history.replaceState(null, '', url);
      } catch { /* ignore */ }
      if (presenterMode) ensureTimer();
      refreshPresenterNotes();
    }
    else if (event.key.toLowerCase() === 'l') {
      event.preventDefault();
      if (!ink) return;
      applyToolMode(ink.getMode() === 'laser' ? 'off' : 'laser');
    }
    else if (event.key.toLowerCase() === 'p' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      if (!ink) return;
      applyToolMode(ink.getMode() === 'pen' ? 'off' : 'pen');
    }
    else if (event.key.toLowerCase() === 'e') {
      event.preventDefault();
      if (!ink) return;
      if (event.shiftKey) {
        ink.clearCurrent();
        redrawInk();
        toast('已清除本页墨迹');
        if (presenterMode) refreshPresenterNotes();
        if (toolRail) toolRail.refresh();
      } else {
        applyToolMode(ink.getMode() === 'eraser' ? 'off' : 'eraser');
      }
    }
    else if (event.key.toLowerCase() === 'c' && ink && (ink.getMode() === 'pen' || ink.getMode() === 'eraser')) {
      event.preventDefault();
      const next = ink.cycleColor();
      toast(next === window.PresenterInk.COLORS.black ? '笔色：黑' : '笔色：红');
      if (toolRail) toolRail.refresh();
    }
    else if ((event.key === '[' || event.key === ']') && ink && (ink.getMode() === 'pen' || ink.getMode() === 'eraser')) {
      event.preventDefault();
      const width = ink.nudgePenWidth(event.key === ']' ? 1 : -1);
      toast(`笔粗：${width.toFixed(1)}`);
    }
    else if (event.key.toLowerCase() === 't') {
      event.preventDefault();
      if (!presenterMode) {
        presenterMode = true;
        try {
          const url = new URL(location.href);
          url.searchParams.set('presenter', '1');
          history.replaceState(null, '', url);
        } catch { /* ignore */ }
      }
      timerStartedAt = null;
      clearInterval(timerInterval);
      timerInterval = null;
      toggleTimer();
    }
  });
  helpDialog.addEventListener('close', () => {
    if (returnFocus?.isConnected) returnFocus.focus();
    wake();
  });
  let touchStart = null;
  byId('viewport').addEventListener('touchstart', event => {
    if (ink && (ink.getMode() === 'pen' || ink.getMode() === 'eraser')) { touchStart = null; return; }
    if (!event.target.closest('button,a,input,textarea,select,[contenteditable],video,iframe')) {
      touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
  }, { passive: true });
  byId('viewport').addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  if (window.DeckTools) {
    if (!window.DeckTools.list().length) window.DeckTools.registerDefaults();
    toolRail = window.DeckTools.mount({
      getContext: () => ({
        mode: ink ? ink.getMode() : 'off',
        color: ink ? ink.getColor() : (window.PresenterInk && window.PresenterInk.COLORS.red),
        isDrawing: !!(ink && ink.isDrawing()),
        applyMode: (mode) => applyToolMode(mode),
        cycleColor: () => {
          if (!ink) return;
          const next = ink.cycleColor();
          toast(next === window.PresenterInk.COLORS.black ? '笔色：黑' : '笔色：红');
          if (toolRail) toolRail.refresh();
        },
        clearSlide: () => {
          if (!ink) return;
          ink.clearCurrent();
          redrawInk();
          toast('已清除本页墨迹');
          if (presenterMode) refreshPresenterNotes();
          if (toolRail) toolRail.refresh();
        },
      }),
    });
  }

  syncInkChrome();
  redrawInk();

  const linkedPage = DeckNavigation.parseHash(location.hash, slides.length);
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { saved = null; }
  if (linkedPage !== null) {
    state.jump(linkedPage);
    if (state.index === linkedPage && saved?.index === linkedPage && Number.isInteger(saved.step)) state.step = Math.max(0, Math.min(saved.step, Number(slides[linkedPage].dataset.steps || 0)));
  } else if (!location.hash && saved && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < slides.length) {
    state.jump(saved.index);
    if (state.index === saved.index) state.step = Number.isInteger(saved.step) ? Math.max(0, Math.min(saved.step, Number(slides[saved.index].dataset.steps || 0))) : 0;
  }
  render(); fit(); wake();
  document.fonts.ready.then(fit);
  try {
    if (!localStorage.getItem(hintKey)) {
      localStorage.setItem(hintKey, '1');
      toast('快捷键：← → 翻页 · G 目录 · N 备注 · F 全屏 · ? 对照 · EN 语言');
    }
  } catch { /* ignore private mode */ }
})();
