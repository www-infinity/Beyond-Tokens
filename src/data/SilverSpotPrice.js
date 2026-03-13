'use strict';

/**
 * SilverSpotPrice – data provider for the Silver Spot Price input source.
 *
 * Provides a simulated dataset of silver prices (USD per troy ounce) that
 * drives the QuantumVisualizer in '8-bit-geometry' mode.  In a production
 * environment this module could be swapped out for a live API call.
 */

// Simulated recent silver spot prices (USD / troy oz).
const HISTORY = [
  { date: '2026-03-06', price: 31.42 },
  { date: '2026-03-07', price: 31.78 },
  { date: '2026-03-08', price: 30.95 },
  { date: '2026-03-09', price: 31.20 },
  { date: '2026-03-10', price: 32.10 },
  { date: '2026-03-11', price: 31.65 },
  { date: '2026-03-12', price: 32.45 },
  { date: '2026-03-13', price: 32.80 },
];

/**
 * Returns the most recent silver spot price.
 * @returns {{ date: string, price: number }}
 */
function getSpotPrice() {
  return HISTORY[HISTORY.length - 1];
}

/**
 * Returns the full price history array (oldest first).
 * @returns {Array<{ date: string, price: number }>}
 */
function getHistory() {
  return [...HISTORY];
}

/**
 * Returns a normalised history array where each price is mapped to a
 * 0–1 range relative to the min/max prices in the dataset.
 * @returns {Array<{ date: string, price: number, normalised: number }>}
 */
function getNormalisedHistory() {
  const prices = HISTORY.map((e) => e.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return HISTORY.map((e) => ({
    ...e,
    normalised: (e.price - min) / range,
  }));
}

module.exports = { getSpotPrice, getHistory, getNormalisedHistory };
