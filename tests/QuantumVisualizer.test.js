'use strict';

const QuantumVisualizer = require('../src/QuantumVisualizer');
const { TerminalBackground } = require('../src/terminal_background');

/* Helper: build a mock terminal_background that captures written output */
function mockTarget() {
  const buf = [];
  return {
    buf,
    write: (text) => buf.push(text),
    clear: () => buf.push('[CLEAR]'),
    hideCursor: () => buf.push('[HIDE_CURSOR]'),
    showCursor: () => buf.push('[SHOW_CURSOR]'),
    reset: () => buf.push('[RESET]'),
    get width() {
      return 80;
    },
    get height() {
      return 24;
    },
    output: () => buf.join(''),
  };
}

/* ── Constructor ─────────────────────────────────────────────────────────── */

describe('QuantumVisualizer – constructor', () => {
  test('creates an instance with valid mode and input', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    expect(v.mode).toBe('8-bit-geometry');
    expect(v.input).toBe('Silver_Spot_Price');
  });

  test('throws TypeError when mode is missing', () => {
    expect(() => new QuantumVisualizer({ input: 'Silver_Spot_Price' })).toThrow(TypeError);
  });

  test('throws TypeError when input is missing', () => {
    expect(() => new QuantumVisualizer({ mode: '8-bit-geometry' })).toThrow(TypeError);
  });

  test('throws RangeError for an unsupported mode', () => {
    expect(() =>
      new QuantumVisualizer({ mode: 'unknown-mode', input: 'Silver_Spot_Price' })
    ).toThrow(RangeError);
  });

  test('throws RangeError for an unsupported input', () => {
    expect(() =>
      new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Unknown_Source' })
    ).toThrow(RangeError);
  });
});

/* ── renderTo ────────────────────────────────────────────────────────────── */

describe('QuantumVisualizer – renderTo', () => {
  test('calls write() on the provided target', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    const target = mockTarget();
    v.renderTo(target);
    expect(target.buf.length).toBeGreaterThan(0);
  });

  test('output contains the Silver Spot Price label', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    const target = mockTarget();
    v.renderTo(target);
    expect(target.output()).toMatch(/SILVER_SPOT_PRICE/i);
  });

  test('output contains the mode label', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    const target = mockTarget();
    v.renderTo(target);
    expect(target.output()).toMatch(/8-BIT-GEOMETRY/i);
  });

  test('output contains a dollar-sign price value', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    const target = mockTarget();
    v.renderTo(target);
    expect(target.output()).toMatch(/\$\d+\.\d{2}/);
  });

  test('clears the target before rendering', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    const target = mockTarget();
    v.renderTo(target);
    expect(target.buf).toContain('[CLEAR]');
  });

  test('restores the cursor after rendering', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    const target = mockTarget();
    v.renderTo(target);
    expect(target.buf).toContain('[SHOW_CURSOR]');
  });

  test('throws TypeError when target has no write() method', () => {
    const v = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
    expect(() => v.renderTo({})).toThrow(TypeError);
    expect(() => v.renderTo(null)).toThrow(TypeError);
  });
});

/* ── TerminalBackground ──────────────────────────────────────────────────── */

describe('TerminalBackground', () => {
  test('write() delegates to the underlying stream', () => {
    const chunks = [];
    const stream = { write: (s) => chunks.push(s), columns: 80, rows: 24 };
    const bg = new TerminalBackground(stream);
    bg.write('hello');
    expect(chunks).toContain('hello');
  });

  test('width and height fall back to 80×24 when stream has no TTY dimensions', () => {
    const stream = { write: () => {} };
    const bg = new TerminalBackground(stream);
    expect(bg.width).toBe(80);
    expect(bg.height).toBe(24);
  });

  test('writeAt includes cursor-movement escape sequence', () => {
    const chunks = [];
    const stream = { write: (s) => chunks.push(s), columns: 80, rows: 24 };
    const bg = new TerminalBackground(stream);
    bg.writeAt(5, 3, 'X');
    const output = chunks.join('');
    // Should contain ESC [ row ; col H
    expect(output).toMatch(/\x1b\[\d+;\d+H/);
    expect(output).toContain('X');
  });
});

/* ── SilverSpotPrice data provider ──────────────────────────────────────── */

describe('SilverSpotPrice', () => {
  const SilverSpotPrice = require('../src/data/SilverSpotPrice');

  test('getSpotPrice returns an object with date and price', () => {
    const sp = SilverSpotPrice.getSpotPrice();
    expect(sp).toHaveProperty('date');
    expect(sp).toHaveProperty('price');
    expect(typeof sp.price).toBe('number');
  });

  test('getHistory returns an array of price records', () => {
    const history = SilverSpotPrice.getHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    history.forEach((record) => {
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('price');
    });
  });

  test('getNormalisedHistory returns normalised values between 0 and 1', () => {
    const history = SilverSpotPrice.getNormalisedHistory();
    history.forEach(({ normalised }) => {
      expect(normalised).toBeGreaterThanOrEqual(0);
      expect(normalised).toBeLessThanOrEqual(1);
    });
  });

  test('getHistory returns a copy – mutations do not affect the source', () => {
    const h1 = SilverSpotPrice.getHistory();
    h1.push({ date: '9999-01-01', price: 9999 });
    const h2 = SilverSpotPrice.getHistory();
    expect(h2).not.toContainEqual({ date: '9999-01-01', price: 9999 });
  });
});
