'use strict';

// Cart 08: Beyond Tokens Audio-Visual
const QuantumVisualizer = require('./QuantumVisualizer');
const terminal_background = require('./terminal_background');

const visualizer = new QuantumVisualizer({ mode: '8-bit-geometry', input: 'Silver_Spot_Price' });
visualizer.renderTo(terminal_background);
