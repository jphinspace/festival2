import { Simulation } from './Simulation.js';

// Initialize simulation
const canvas = document.getElementById('canvas');
const simulation = new Simulation(canvas);

// Setup tick rate slider
const slider = document.getElementById('tickRateSlider');
const tickRateValue = document.getElementById('tickRateValue');

slider.addEventListener('input', (e) => {
    const rate = parseFloat(e.target.value);
    simulation.setTickRate(rate);
    const ticksPerSecond = Math.round(rate * 1000);
    tickRateValue.textContent = `${rate.toFixed(1)}x (${ticksPerSecond} ticks/s)`;
});

// Start simulation
simulation.run();
