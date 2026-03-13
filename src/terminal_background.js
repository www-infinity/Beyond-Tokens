'use strict';

/**
 * terminal_background – the rendering surface that QuantumVisualizer writes to.
 *
 * Wraps process.stdout and provides helpers for ANSI colour, cursor movement,
 * and full-screen clearing so the visualizer can paint without managing raw
 * escape sequences itself.
 *
 * This module exports a ready-to-use singleton so callers can write:
 *   const terminal_background = require('./terminal_background');
 *   visualizer.renderTo(terminal_background);
 */

/* ANSI escape helpers ---------------------------------------------------- */
const ESC = '\x1b[';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  clearScreen: '\x1b[2J',
  homePos: '\x1b[H',

  /**
   * Move the cursor to 1-based (col, row).
   * @param {number} col
   * @param {number} row
   * @returns {string}
   */
  moveTo: (col, row) => `${ESC}${row};${col}H`,

  /**
   * Select a 256-colour foreground.
   * @param {number} code  0-255
   * @returns {string}
   */
  fg256: (code) => `${ESC}38;5;${code}m`,

  /**
   * Select a 256-colour background.
   * @param {number} code  0-255
   * @returns {string}
   */
  bg256: (code) => `${ESC}48;5;${code}m`,
};

/* TerminalBackground class ------------------------------------------------ */

class TerminalBackground {
  constructor(stream) {
    this._stream = stream || process.stdout;
  }

  /** Terminal column count (defaults to 80 if stdout is not a TTY). */
  get width() {
    return this._stream.columns || 80;
  }

  /** Terminal row count (defaults to 24 if stdout is not a TTY). */
  get height() {
    return this._stream.rows || 24;
  }

  /** Write a raw string to the terminal. */
  write(text) {
    this._stream.write(text);
  }

  /** Clear the entire screen and move the cursor to the top-left. */
  clear() {
    this.write(ANSI.clearScreen + ANSI.homePos);
  }

  /** Hide the blinking cursor while the visualizer is running. */
  hideCursor() {
    this.write(ANSI.hideCursor);
  }

  /** Restore the cursor on exit. */
  showCursor() {
    this.write(ANSI.showCursor);
  }

  /** Reset all ANSI colour/style attributes. */
  reset() {
    this.write(ANSI.reset);
  }

  /**
   * Move the cursor to a 1-based (col, row) position then write text.
   * @param {number} col
   * @param {number} row
   * @param {string} text
   */
  writeAt(col, row, text) {
    this.write(ANSI.moveTo(col, row) + text);
  }

  /**
   * Write text in a 256-colour foreground.
   * @param {number} colorCode  0-255
   * @param {string} text
   */
  writeColor(colorCode, text) {
    this.write(ANSI.fg256(colorCode) + text + ANSI.reset);
  }

  /**
   * Write text at a specific position with a 256-colour foreground.
   * @param {number} col
   * @param {number} row
   * @param {number} colorCode  0-255
   * @param {string} text
   */
  writeColorAt(col, row, colorCode, text) {
    this.write(ANSI.moveTo(col, row) + ANSI.fg256(colorCode) + text + ANSI.reset);
  }
}

/* Export singleton -------------------------------------------------------- */
module.exports = new TerminalBackground();

/* Also export the class and ANSI helpers for testing / advanced use */
module.exports.TerminalBackground = TerminalBackground;
module.exports.ANSI = ANSI;
