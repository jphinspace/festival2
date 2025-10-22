import { Simulation } from './Simulation.js';

// Initialize simulation
const canvas = document.getElementById('canvas');
const simulation = new Simulation(canvas);

// Expose simulation globally for debugging
window.simulation = simulation;

// Setup tick rate slider
const slider = document.getElementById('tickRateSlider');
const tickRateValue = document.getElementById('tickRateValue');

slider.addEventListener('input', (e) => {
    const rate = parseFloat(e.target.value);
    simulation.setTickRate(rate);
    const ticksPerSecond = Math.round(rate * 1000);
    tickRateValue.textContent = `${rate.toFixed(1)}x (${ticksPerSecond} ticks/s)`;
});

// Setup pause button
const pauseButton = document.getElementById('pauseButton');

pauseButton.addEventListener('click', () => {
    const isPaused = !simulation.isPaused();
    simulation.setPaused(isPaused);
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

// Setup destination toggle button
const toggleButton = document.getElementById('toggleDestinations');

toggleButton.addEventListener('click', () => {
    const isShowing = simulation.toggleDestinations();
    toggleButton.textContent = isShowing ? 'Hide Destinations' : 'Show Destinations';
});

// Setup metrics toggle button
const metricsButton = document.getElementById('toggleMetrics');

metricsButton.addEventListener('click', () => {
    const isShowing = simulation.toggleMetrics();
    metricsButton.textContent = isShowing ? 'Hide Metrics' : 'Show Metrics';
});

// Setup spawn agent button
const spawnButton = document.getElementById('spawnAgent');

spawnButton.addEventListener('click', () => {
    simulation.spawnFanAgent();
});

// Setup tooltip functionality
const tooltip = document.getElementById('agentTooltip');
let currentHoveredAgent = null;
let selectedAgent = null;

canvas.addEventListener('mousemove', (e) => {
    // Disable hover tooltip when an agent is selected
    if (selectedAgent) {
        simulation.setHoveredAgent(null);
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    // Account for canvas scaling: convert from display coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const agent = simulation.getAgentAtPosition(x, y);
    
    if (agent) {
        currentHoveredAgent = agent;
        simulation.setHoveredAgent(agent);
        updateTooltip(agent);
        tooltip.classList.add('visible');
    } else {
        currentHoveredAgent = null;
        simulation.setHoveredAgent(null);
        tooltip.classList.remove('visible');
    }
});

canvas.addEventListener('mouseleave', () => {
    // Don't hide tooltip if an agent is selected
    if (!selectedAgent) {
        currentHoveredAgent = null;
        simulation.setHoveredAgent(null);
        tooltip.classList.remove('visible');
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Account for canvas scaling: convert from display coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const agent = simulation.getAgentAtPosition(x, y);
    
    if (agent) {
        // Select the clicked agent
        selectedAgent = agent;
        simulation.setSelectedAgent(agent);
        simulation.setHoveredAgent(null);
        updateTooltip(agent);
        tooltip.classList.add('visible');
    } else {
        // Clear selection when clicking empty space
        selectedAgent = null;
        simulation.setSelectedAgent(null);
        simulation.setHoveredAgent(null);
        currentHoveredAgent = null;
        tooltip.classList.remove('visible');
    }
});

function updateTooltip(agent) {
    const stateName = agent.state.getName();
    const location = `(${Math.round(agent.x)}, ${Math.round(agent.y)})`;
    const destination = `(${Math.round(agent.destinationX)}, ${Math.round(agent.destinationY)})`;
    const speed = agent.getSpeed().toFixed(2);
    const direction = agent.getDirection();
    const pathfindingMode = agent.getPathfindingMode().toUpperCase();
    
    tooltip.innerHTML = `
        <div class="tooltip-title">Agent Information</div>
        <div class="tooltip-row"><strong>State:</strong> ${stateName}</div>
        <div class="tooltip-row"><strong>Location:</strong> ${location}</div>
        <div class="tooltip-row"><strong>Destination:</strong> ${destination}</div>
        <div class="tooltip-row"><strong>Speed:</strong> ${speed} px/s</div>
        <div class="tooltip-row"><strong>Direction:</strong> ${direction}°</div>
        <div class="tooltip-row"><strong>Pathfinding:</strong> ${pathfindingMode}</div>
    `;
}

// Update tooltip for selected agent in real-time
function updateSelectedAgentTooltip() {
    if (selectedAgent) {
        updateTooltip(selectedAgent);
    }
    requestAnimationFrame(updateSelectedAgentTooltip);
}

// Start real-time tooltip updates
updateSelectedAgentTooltip();

// Start simulation
simulation.run();
