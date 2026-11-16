/* Declarative calculator: radio groups + numeric inputs; safe arithmetic exprs only. */
(function () {
  'use strict';

  const IDENT = /^[a-z][a-z0-9_]*$/;
  const TOKEN = /\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|[a-z][a-z0-9_]*|[+\-*/()])\s*/y;

  function safeEval(expr, env) {
    if (typeof expr !== 'string' || !expr.trim()) throw new Error('empty expr');
    const tokens = [];
    let pos = 0;
    TOKEN.lastIndex = 0;
    while (pos < expr.length) {
      TOKEN.lastIndex = pos;
      const m = TOKEN.exec(expr);
      if (!m || m.index !== pos) throw new Error('bad token');
      tokens.push(m[1]);
      pos = TOKEN.lastIndex;
    }
    let i = 0;
    const peek = () => tokens[i];
    const take = (expected) => {
      const tok = tokens[i++];
      if (expected != null && tok !== expected) throw new Error('expected ' + expected);
      if (tok == null) throw new Error('unexpected end');
      return tok;
    };
    const parseExpr = () => {
      let value = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = take();
        const rhs = parseTerm();
        value = op === '+' ? value + rhs : value - rhs;
      }
      return value;
    };
    const parseTerm = () => {
      let value = parseFactor();
      while (peek() === '*' || peek() === '/') {
        const op = take();
        const rhs = parseFactor();
        if (op === '*') value *= rhs;
        else {
          if (rhs === 0) throw new Error('div zero');
          value /= rhs;
        }
      }
      return value;
    };
    const parseFactor = () => {
      const tok = peek();
      if (tok === '(') {
        take('(');
        const value = parseExpr();
        take(')');
        return value;
      }
      if (tok === '+' || tok === '-') {
        const sign = take();
        const value = parseFactor();
        return sign === '+' ? value : -value;
      }
      take();
      if (IDENT.test(tok)) {
        if (!(tok in env)) throw new Error('unknown ' + tok);
        return Number(env[tok]);
      }
      return Number(tok);
    };
    const value = parseExpr();
    if (i !== tokens.length) throw new Error('trailing');
    return value;
  }

  function formatValue(value, kind, currency) {
    if (kind === 'currency') {
      const prefix = currency ? currency + ' ' : '';
      return prefix + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
    return String(Number(value.toPrecision(6)));
  }

  function mount(root) {
    const currency = root.dataset.calculatorCurrency || '';
    const sync = () => {
      const env = {};
      root.querySelectorAll('input[type="radio"][data-calc-group]:checked').forEach((radio) => {
        try {
          const vars = JSON.parse(radio.dataset.calcVars || '{}');
          Object.entries(vars).forEach(([key, val]) => {
            env[key] = Number(val);
          });
        } catch (_) {
          /* ignore malformed option payload */
        }
      });
      root.querySelectorAll('input[data-calc-input]').forEach((input) => {
        const id = input.dataset.calcInput;
        const num = Number(input.value);
        env[id] = Number.isFinite(num) ? num : 0;
      });
      root.querySelectorAll('[data-calc-result]').forEach((card) => {
        const expr = card.dataset.calcExpr || '0';
        const format = card.dataset.calcFormat || 'number';
        const target = card.querySelector('[data-calc-value]');
        if (!target) return;
        try {
          target.textContent = formatValue(safeEval(expr, env), format, currency);
        } catch (_) {
          target.textContent = '—';
        }
      });
    };
    root.addEventListener('change', sync);
    root.addEventListener('input', sync);
    sync();
  }

  document.querySelectorAll('[data-calculator-root]').forEach((root) => {
    try {
      const cfg = JSON.parse(root.dataset.calculatorConfig || '{}');
      if (cfg.currency) root.dataset.calculatorCurrency = String(cfg.currency);
    } catch (_) {
      /* keep defaults */
    }
    mount(root);
  });
})();
