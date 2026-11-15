(function (global) {
  'use strict';

  const MODES = Object.freeze(['off', 'laser', 'pen', 'eraser']);
  const COLORS = Object.freeze({ red: '#C7000B', black: '#1A1A1A' });
  const WIDTH_MIN = 1.5;
  const WIDTH_MAX = 16;
  const WIDTH_DEFAULT = 3.5;
  const ERASER_DEFAULT = 28;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function mapPoint(clientX, clientY, rect, designW, designH) {
    const w = designW == null ? 1600 : designW;
    const h = designH == null ? 900 : designH;
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;
    const x = ((clientX - rect.left) / rect.width) * w;
    const y = ((clientY - rect.top) / rect.height) * h;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }

  function create(options) {
    const opts = options || {};
    let mode = 'off';
    let color = opts.color || COLORS.red;
    let penWidth = clamp(Number(opts.penWidth) || WIDTH_DEFAULT, WIDTH_MIN, WIDTH_MAX);
    let eraserWidth = Math.max(8, Number(opts.eraserWidth) || ERASER_DEFAULT);
    const clearOnLeave = !!opts.clearOnLeave;
    const strokesBySlide = new Map();
    let currentSlideKey = opts.slideKey || '';
    let drawing = false;
    let currentStroke = null;

    function ensure(key) {
      const k = key == null ? currentSlideKey : key;
      if (!strokesBySlide.has(k)) strokesBySlide.set(k, []);
      return strokesBySlide.get(k);
    }

    function getMode() { return mode; }

    function setMode(next) {
      if (!MODES.includes(next)) return mode;
      mode = next;
      if (mode !== 'pen' && mode !== 'eraser') {
        drawing = false;
        currentStroke = null;
      }
      return mode;
    }

    function toggleLaser() { return setMode(mode === 'laser' ? 'off' : 'laser'); }
    function togglePen() { return setMode(mode === 'pen' ? 'off' : 'pen'); }
    function toggleEraser() { return setMode(mode === 'eraser' ? 'off' : 'eraser'); }
    function exitTool() { return setMode('off'); }

    function getColor() { return color; }
    function cycleColor() {
      color = color === COLORS.red ? COLORS.black : COLORS.red;
      return color;
    }
    function setColor(next) {
      if (next === COLORS.red || next === COLORS.black || next === 'red' || next === 'black') {
        color = next === 'black' || next === COLORS.black ? COLORS.black : COLORS.red;
      }
      return color;
    }

    function getPenWidth() { return penWidth; }
    function setPenWidth(w) {
      penWidth = clamp(Number(w) || WIDTH_DEFAULT, WIDTH_MIN, WIDTH_MAX);
      return penWidth;
    }
    function nudgePenWidth(delta) {
      return setPenWidth(penWidth + (Number(delta) || 0));
    }
    function getEraserWidth() { return eraserWidth; }

    function getStrokes(key) {
      return (strokesBySlide.get(key == null ? currentSlideKey : key) || []).slice();
    }

    function clearCurrent() {
      strokesBySlide.set(currentSlideKey, []);
      drawing = false;
      currentStroke = null;
      return true;
    }

    function clearAll() {
      strokesBySlide.clear();
      drawing = false;
      currentStroke = null;
      return true;
    }

    function onSlideChange(nextKey) {
      if (clearOnLeave && currentSlideKey) strokesBySlide.set(currentSlideKey, []);
      currentSlideKey = nextKey == null ? '' : String(nextKey);
      drawing = false;
      currentStroke = null;
      return currentSlideKey;
    }

    function beginStroke(point) {
      if (mode !== 'pen' && mode !== 'eraser') return null;
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
      drawing = true;
      currentStroke = {
        tool: mode === 'eraser' ? 'eraser' : 'pen',
        color: mode === 'eraser' ? null : color,
        width: mode === 'eraser' ? eraserWidth : penWidth,
        points: [{ x: point.x, y: point.y }],
      };
      ensure().push(currentStroke);
      return currentStroke;
    }

    function extendStroke(point) {
      if (!drawing || !currentStroke || !point) return null;
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
      currentStroke.points.push({ x: point.x, y: point.y });
      return currentStroke;
    }

    function endStroke() {
      drawing = false;
      const stroke = currentStroke;
      currentStroke = null;
      return stroke;
    }

    function isDrawing() { return drawing; }
    function getSlideKey() { return currentSlideKey; }

    return {
      getMode, setMode, toggleLaser, togglePen, toggleEraser, exitTool,
      getColor, setColor, cycleColor,
      getPenWidth, setPenWidth, nudgePenWidth, getEraserWidth,
      getStrokes, clearCurrent, clearAll, onSlideChange,
      beginStroke, extendStroke, endStroke, isDrawing, getSlideKey,
      clearOnLeave,
    };
  }

  function paintStrokes(ctx, strokes) {
    if (!ctx || !Array.isArray(strokes)) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      const pts = stroke.points || [];
      if (!pts.length) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (pts.length === 1) {
        ctx.lineTo(pts[0].x + 0.01, pts[0].y);
      }
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.width || ERASER_DEFAULT;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color || COLORS.red;
        ctx.lineWidth = stroke.width || WIDTH_DEFAULT;
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  global.PresenterInk = {
    MODES, COLORS, WIDTH_MIN, WIDTH_MAX, WIDTH_DEFAULT, ERASER_DEFAULT,
    mapPoint, create, paintStrokes,
  };
})(globalThis);
