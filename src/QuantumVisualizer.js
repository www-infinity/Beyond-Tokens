'use strict';

/**
 * QuantumVisualizer – Cart 08: Beyond Tokens Audio-Visual
 *
 * Renders an 8-bit-geometry audio-visual representation of a given input
 * data source to a terminal background surface.
 *
 * Usage:
 *   const visualizer = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
 *   visualizer.renderTo(terminal_background);
 */

const SilverSpotPrice = require('./data/SilverSpotPrice');

/* Supported modes --------------------------------------------------------- */
const MODES = {
  '8-bit-geometry': render8BitGeometry,
};

/* Supported input sources ------------------------------------------------- */
const DATA_SOURCES = {
  Silver_Spot_Price: () => SilverSpotPrice.getNormalisedHistory(),
};

/* 8-bit colour palette constants ------------------------------------------ */
const COLOR = {
  HEADER_FG: 226,   // bright yellow
  HEADER_BG: 235,   // dark grey
  TITLE_FG: 51,     // cyan
  UP_FG: 82,        // bright green
  DOWN_FG: 196,     // bright red
  NEUTRAL_FG: 250,  // light grey
  BORDER_FG: 240,   // medium grey
  CHART_FG: 214,    // orange-gold (silver irony)
  LABEL_FG: 255,    // white
  PRICE_FG: 220,    // gold
};

/* Unicode block elements for 8-bit geometry ------------------------------- */
const BLOCKS = {
  full: '█',
  upper: '▀',
  lower: '▄',
  light: '░',
  medium: '▒',
  dark: '▓',
  hline: '─',
  vline: '│',
  corner_tl: '┌',
  corner_tr: '┐',
  corner_bl: '└',
  corner_br: '┘',
  diamond: '◆',
  dot: '·',
};

/* -------------------------------------------------------------------------
 * Geometry primitives
 * ---------------------------------------------------------------------- */

/**
 * Returns an ASCII/Unicode hollow rectangle (as an array of strings, one
 * per row) using box-drawing characters.
 * @param {number} width   inner content width (chars)
 * @param {number} height  inner content height (rows)
 * @param {string} title   optional title inserted in the top border
 * @returns {string[]}
 */
function makeBox(width, height, title = '') {
  const innerW = Math.max(width, title.length + 2);
  const top = title
    ? BLOCKS.corner_tl +
      BLOCKS.hline +
      title +
      BLOCKS.hline.repeat(innerW - title.length) +
      BLOCKS.corner_tr
    : BLOCKS.corner_tl + BLOCKS.hline.repeat(innerW + 2) + BLOCKS.corner_tr;

  const mid = BLOCKS.vline + ' '.repeat(innerW + 2) + BLOCKS.vline;
  const bottom = BLOCKS.corner_bl + BLOCKS.hline.repeat(innerW + 2) + BLOCKS.corner_br;

  const rows = [top];
  for (let r = 0; r < height; r++) rows.push(mid);
  rows.push(bottom);
  return rows;
}

/**
 * Build a horizontal bar-chart row.
 * @param {number} value        normalised value 0-1
 * @param {number} maxWidth     maximum bar width in characters
 * @param {string} fillChar     character to use for the filled portion
 * @returns {string}
 */
function makeBar(value, maxWidth, fillChar = BLOCKS.full) {
  const filled = Math.round(value * maxWidth);
  return fillChar.repeat(filled) + BLOCKS.light.repeat(maxWidth - filled);
}

/**
 * Generate a simple 8-bit diamond shape of the given radius (chars).
 * @param {number} radius
 * @returns {string[]}  array of rows
 */
function makeDiamond(radius) {
  const rows = [];
  for (let r = -radius; r <= radius; r++) {
    const half = radius - Math.abs(r);
    const pad = ' '.repeat(radius - half);
    const inner = half > 0 ? ' '.repeat(2 * half - 1) : '';
    const line =
      half === 0
        ? pad + BLOCKS.diamond + pad
        : pad + BLOCKS.diamond + inner + BLOCKS.diamond + pad;
    rows.push(line);
  }
  return rows;
}

/* -------------------------------------------------------------------------
 * Render function: 8-bit-geometry mode
 * ---------------------------------------------------------------------- */

/**
 * @param {object[]} dataPoints  normalised history from a data source
 * @param {object}   target      terminal_background instance
 */
function render8BitGeometry(dataPoints, target) {
  const W = target.width;
  const { ANSI } = require('./terminal_background');

  target.clear();
  target.hideCursor();

  /* ── Title bar ─────────────────────────────────────────────────────── */
  const titleText = ' ◆  BEYOND TOKENS  ◆  Cart 08: Audio-Visual  ◆ ';
  const paddedTitle =
    titleText.length < W
      ? titleText + ' '.repeat(W - titleText.length)
      : titleText.slice(0, W);

  target.write(
    ANSI.bg256(COLOR.HEADER_BG) +
      ANSI.fg256(COLOR.HEADER_FG) +
      ANSI.bold +
      paddedTitle +
      ANSI.reset +
      '\n'
  );

  /* ── Input source label ─────────────────────────────────────────────── */
  const latest = dataPoints[dataPoints.length - 1];
  const prev = dataPoints[dataPoints.length - 2] || latest;
  const trend = latest.price >= prev.price ? '▲' : '▼';
  const trendColor = latest.price >= prev.price ? COLOR.UP_FG : COLOR.DOWN_FG;

  target.write(
    '\n' +
      ANSI.fg256(COLOR.TITLE_FG) +
      '  MODE: 8-BIT-GEOMETRY  │  INPUT: SILVER_SPOT_PRICE\n' +
      ANSI.reset
  );

  target.write(
    ANSI.fg256(COLOR.LABEL_FG) +
      '  Silver Spot Price: ' +
      ANSI.fg256(COLOR.PRICE_FG) +
      ANSI.bold +
      `$${latest.price.toFixed(2)} / troy oz  ` +
      ANSI.fg256(trendColor) +
      trend +
      ANSI.reset +
      `  (${latest.date})\n\n`
  );

  /* ── Price bar chart ──────────────────────────────────────────────────  */
  const chartWidth = Math.min(W - 20, 50);
  const boxTitle = ' PRICE HISTORY ';

  target.write(
    ANSI.fg256(COLOR.BORDER_FG) +
      BLOCKS.corner_tl +
      BLOCKS.hline +
      boxTitle +
      BLOCKS.hline.repeat(chartWidth - boxTitle.length + 1) +
      BLOCKS.corner_tr +
      ANSI.reset +
      '\n'
  );

  dataPoints.forEach(({ date, price, normalised }) => {
    const bar = makeBar(normalised, chartWidth, BLOCKS.full);
    const barColor =
      price >= prev.price ? COLOR.UP_FG : price < prev.price ? COLOR.DOWN_FG : COLOR.NEUTRAL_FG;

    target.write(
      ANSI.fg256(COLOR.BORDER_FG) +
        BLOCKS.vline +
        ANSI.reset +
        ' ' +
        ANSI.fg256(COLOR.LABEL_FG) +
        date +
        ' ' +
        ANSI.fg256(barColor) +
        bar.slice(0, Math.max(0, chartWidth - date.length - 9)) +
        ANSI.fg256(COLOR.PRICE_FG) +
        ` $${price.toFixed(2)}` +
        ANSI.fg256(COLOR.BORDER_FG) +
        BLOCKS.vline +
        ANSI.reset +
        '\n'
    );
  });

  target.write(
    ANSI.fg256(COLOR.BORDER_FG) +
      BLOCKS.corner_bl +
      BLOCKS.hline.repeat(chartWidth + 1) +
      BLOCKS.corner_br +
      ANSI.reset +
      '\n'
  );

  /* ── Geometric accent: diamond keyed to latest normalised price ──────── */
  const diamondRadius = Math.max(1, Math.round(latest.normalised * 4) + 1);
  const diamond = makeDiamond(diamondRadius);

  target.write('\n');
  diamond.forEach((row) => {
    target.write(
      '  ' +
        ANSI.fg256(COLOR.CHART_FG) +
        row +
        ANSI.reset +
        '\n'
    );
  });

  /* ── Footer ─────────────────────────────────────────────────────────── */
  target.write(
    '\n' +
      ANSI.fg256(COLOR.BORDER_FG) +
      '  ' +
      BLOCKS.hline.repeat(Math.min(W - 4, 60)) +
      ANSI.reset +
      '\n'
  );
  target.write(
    ANSI.fg256(COLOR.NEUTRAL_FG) +
      '  QuantumVisualizer v1.0  │  8-bit-geometry  │  Beyond Tokens\n' +
      ANSI.reset
  );

  target.showCursor();
}

/* -------------------------------------------------------------------------
 * QuantumVisualizer class
 * ---------------------------------------------------------------------- */

class QuantumVisualizer {
  /**
   * @param {object} options
   * @param {string} options.mode   Rendering mode. Supported: '8-bit-geometry'
   * @param {string} options.input  Data source identifier. Supported: 'Silver_Spot_Price'
   */
  constructor({ mode, input }) {
    if (!mode) throw new TypeError('QuantumVisualizer: options.mode is required');
    if (!input) throw new TypeError('QuantumVisualizer: options.input is required');

    if (!MODES[mode]) {
      throw new RangeError(
        `QuantumVisualizer: unsupported mode "${mode}". Supported modes: ${Object.keys(MODES).join(', ')}`
      );
    }
    if (!DATA_SOURCES[input]) {
      throw new RangeError(
        `QuantumVisualizer: unsupported input "${input}". Supported inputs: ${Object.keys(DATA_SOURCES).join(', ')}`
      );
    }

    this.mode = mode;
    this.input = input;
  }

  /**
   * Fetch data from the configured input source, then render using the
   * configured mode to the given terminal_background surface.
   *
   * @param {object} target  A terminal_background instance (or compatible object
   *                         with write(), clear(), hideCursor(), showCursor()).
   */
  renderTo(target) {
    if (!target || typeof target.write !== 'function') {
      throw new TypeError(
        'QuantumVisualizer.renderTo: target must be a terminal_background object with a write() method'
      );
    }

    const dataPoints = DATA_SOURCES[this.input]();
    MODES[this.mode](dataPoints, target);
  }
}

module.exports = QuantumVisualizer;
