/**
 * DeckTools — extensible presenter tool registry + hover rail UI.
 * Wire actions through mount({ getContext }); keep PresenterInk as the ink engine.
 */
(function (global) {
  'use strict';

  const registry = [];
  const COLLAPSE_MS = 280;
  const ICONS = Object.freeze({
    laser: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.2 4.4l4.4 4.4-11 11H4.2v-4.4l11-11z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13.4 6.2l4.4 4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 14.2l5.6-5.6 5.8 5.8-3.4 3.4H8.2L6.2 14.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4.5 19.2h15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    color: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.2" fill="currentColor" opacity=".92"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5v11M6.5 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  });

  function sortTools(list) {
    return list.slice().sort((a, b) => {
      const ao = Number(a.order);
      const bo = Number(b.order);
      if (ao !== bo) return (Number.isFinite(ao) ? ao : 1000) - (Number.isFinite(bo) ? bo : 1000);
      return String(a.id).localeCompare(String(b.id));
    });
  }

  function register(tool) {
    if (!tool || !tool.id) throw new Error('DeckTools.register requires { id }');
    const id = String(tool.id);
    const existing = registry.findIndex((entry) => entry.id === id);
    const entry = {
      id,
      order: tool.order == null ? 100 : Number(tool.order),
      label: tool.label || id,
      title: tool.title || tool.label || id,
      icon: tool.icon || 'plus',
      disabled: !!tool.disabled,
      placeholder: !!tool.placeholder,
      active: typeof tool.active === 'function' ? tool.active : () => false,
      invoke: typeof tool.invoke === 'function' ? tool.invoke : null,
    };
    if (existing >= 0) registry[existing] = entry;
    else registry.push(entry);
    return entry;
  }

  function unregister(id) {
    const idx = registry.findIndex((entry) => entry.id === id);
    if (idx < 0) return false;
    registry.splice(idx, 1);
    return true;
  }

  function list() {
    return sortTools(registry);
  }

  function clearRegistry() {
    registry.length = 0;
  }

  function registerDefaults() {
    register({
      id: 'laser',
      order: 10,
      label: '激光笔',
      title: '激光笔 · L',
      icon: 'laser',
      active: (ctx) => ctx && ctx.mode === 'laser',
      invoke: (ctx) => {
        if (!ctx || !ctx.applyMode) return;
        ctx.applyMode(ctx.mode === 'laser' ? 'off' : 'laser');
      },
    });
    register({
      id: 'pen',
      order: 20,
      label: '马克笔',
      title: '马克笔 · P',
      icon: 'pen',
      active: (ctx) => ctx && ctx.mode === 'pen',
      invoke: (ctx) => {
        if (!ctx || !ctx.applyMode) return;
        ctx.applyMode(ctx.mode === 'pen' ? 'off' : 'pen');
      },
    });
    register({
      id: 'eraser',
      order: 30,
      label: '橡皮',
      title: '橡皮 · E',
      icon: 'eraser',
      active: (ctx) => ctx && ctx.mode === 'eraser',
      invoke: (ctx) => {
        if (!ctx || !ctx.applyMode) return;
        ctx.applyMode(ctx.mode === 'eraser' ? 'off' : 'eraser');
      },
    });
    register({
      id: 'clear',
      order: 40,
      label: '清除本页墨迹',
      title: '清除本页墨迹 · ⇧E',
      icon: 'clear',
      active: () => false,
      invoke: (ctx) => {
        if (ctx && typeof ctx.clearSlide === 'function') ctx.clearSlide();
      },
    });
    register({
      id: 'color',
      order: 50,
      label: '笔色红/黑',
      title: '笔色红/黑 · C',
      icon: 'color',
      active: (ctx) => !!(ctx && (ctx.mode === 'pen' || ctx.mode === 'eraser')),
      invoke: (ctx) => {
        if (ctx && typeof ctx.cycleColor === 'function') ctx.cycleColor();
      },
    });
    register({
      id: 'more',
      order: 90,
      label: '更多工具',
      title: '更多工具 · 即将推出',
      icon: 'plus',
      disabled: true,
      placeholder: true,
      active: () => false,
      invoke: null,
    });
  }

  function iconMarkup(name) {
    return ICONS[name] || ICONS.plus;
  }

  function mount(options) {
    const opts = options || {};
    const doc = opts.document || (typeof document !== 'undefined' ? document : null);
    if (!doc || !doc.body) return null;
    if (!registry.length) registerDefaults();

    const getContext = typeof opts.getContext === 'function' ? opts.getContext : () => ({});
    let collapseTimer = null;
    let pinned = false;
    let expanded = false;

    const root = doc.createElement('aside');
    root.id = 'deck-tool-rail';
    root.className = 'deck-tool-rail';
    root.setAttribute('aria-label', '演示工具');
    root.innerHTML = [
      '<button type="button" class="deck-tool-rail__handle" aria-expanded="false" aria-controls="deck-tool-rail-list" title="演示工具">',
      '<span class="deck-tool-rail__grip" aria-hidden="true"></span>',
      '<span class="sr-only">演示工具</span>',
      '</button>',
      '<div class="deck-tool-rail__panel" id="deck-tool-rail-list">',
      '<div class="deck-tool-rail__fade deck-tool-rail__fade--top" aria-hidden="true"></div>',
      '<div class="deck-tool-rail__scroll" role="toolbar" aria-orientation="vertical" aria-label="演示工具"></div>',
      '<div class="deck-tool-rail__fade deck-tool-rail__fade--bottom" aria-hidden="true"></div>',
      '</div>',
    ].join('');

    const handle = root.querySelector('.deck-tool-rail__handle');
    const scroll = root.querySelector('.deck-tool-rail__scroll');
    const host = opts.host || doc.body;
    host.append(root);

    function setExpanded(next) {
      expanded = !!next;
      root.classList.toggle('is-expanded', expanded);
      root.classList.toggle('is-pinned', pinned);
      handle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    function scheduleCollapse() {
      clearTimeout(collapseTimer);
      if (pinned) return;
      collapseTimer = setTimeout(() => {
        const ctx = getContext() || {};
        if (ctx.isDrawing) return;
        if (root.contains(doc.activeElement)) return;
        setExpanded(false);
      }, COLLAPSE_MS);
    }

    function expandNow() {
      clearTimeout(collapseTimer);
      setExpanded(true);
    }

    function refresh() {
      const ctx = getContext() || {};
      const tools = list();
      scroll.replaceChildren();
      for (const tool of tools) {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'deck-tool-btn';
        btn.dataset.toolId = tool.id;
        if (tool.placeholder) btn.classList.add('is-placeholder');
        btn.disabled = !!tool.disabled;
        const title = tool.title || tool.label;
        btn.title = title;
        btn.setAttribute('aria-label', tool.label || title);
        if (tool.active(ctx)) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.setAttribute('aria-pressed', 'false');
        }
        if (tool.id === 'color' && ctx.color) {
          btn.style.setProperty('--tool-swatch', ctx.color);
          btn.classList.add('deck-tool-btn--swatch');
        }
        const glyph = doc.createElement('span');
        glyph.className = 'deck-tool-btn__icon';
        glyph.innerHTML = iconMarkup(tool.icon);
        btn.append(glyph);
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (tool.disabled || !tool.invoke) return;
          tool.invoke(getContext() || {});
          refresh();
        });
        scroll.append(btn);
      }
      root.classList.toggle('has-overflow', scroll.scrollHeight > scroll.clientHeight + 2);
    }

    handle.addEventListener('click', (event) => {
      event.preventDefault();
      const coarse = (() => {
        try { return window.matchMedia('(pointer: coarse)').matches; } catch { return false; }
      })();
      if (coarse || event.detail === 0) {
        pinned = !pinned;
        setExpanded(pinned || true);
        if (!pinned) scheduleCollapse();
      } else if (!expanded) {
        expandNow();
      }
    });

    root.addEventListener('pointerenter', () => {
      const ctx = getContext() || {};
      if (ctx.isDrawing) return;
      expandNow();
    });
    root.addEventListener('pointerleave', () => {
      if (pinned) return;
      scheduleCollapse();
    });
    root.addEventListener('focusin', expandNow);
    root.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!root.contains(doc.activeElement)) scheduleCollapse();
      }, 0);
    });
    scroll.addEventListener('scroll', () => {
      root.classList.toggle('has-overflow', scroll.scrollHeight > scroll.clientHeight + 2);
    }, { passive: true });

    refresh();
    setExpanded(false);

    return {
      root,
      refresh,
      expand: expandNow,
      collapse: () => { pinned = false; setExpanded(false); },
      pin: (value) => { pinned = !!value; setExpanded(pinned || expanded); },
      isExpanded: () => expanded,
      isPinned: () => pinned,
      destroy: () => {
        clearTimeout(collapseTimer);
        root.remove();
      },
    };
  }

  global.DeckTools = {
    ICONS,
    COLLAPSE_MS,
    register,
    unregister,
    list,
    clearRegistry,
    registerDefaults,
    mount,
    iconMarkup,
  };
})(globalThis);
