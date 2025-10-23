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

// Setup spawn agent button
const spawnButton = document.getElementById('spawnAgent');

spawnButton.addEventListener('click', () => {
    simulation.spawnFanAgent();
});

// Setup tooltip functionality
const tooltip = document.getElementById('agentTooltip');
let currentHoveredAgents = [];
let selectedAgents = [];

canvas.addEventListener('mousemove', (e) => {
    // Disable hover tooltip when an agent is selected
    if (selectedAgents.length > 0) {
        simulation.clearHoveredAgents();
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    // Account for canvas scaling: convert from display coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const agents = simulation.getAgentAtPosition(x, y);
    
    if (agents.length > 0) {
        const agent = agents[0];
        currentHoveredAgents = [agent];
        simulation.addHoveredAgent(agent);
        updateTooltip(agent);
        tooltip.classList.add('visible');
    } else {
        currentHoveredAgents = [];
        simulation.clearHoveredAgents();
        tooltip.classList.remove('visible');
    }
});

canvas.addEventListener('mouseleave', () => {
    // Don't hide tooltip if an agent is selected
    if (selectedAgents.length === 0) {
        currentHoveredAgents = [];
        simulation.clearHoveredAgents();
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
    
    const agents = simulation.getAgentAtPosition(x, y);
    
    if (agents.length > 0) {
        const agent = agents[0];
        // Select the clicked agent
        selectedAgents = [agent];
        simulation.clearSelectedAgents();
        simulation.addSelectedAgent(agent);
        simulation.clearHoveredAgents();
        updateTooltip(agent);
        tooltip.classList.add('visible');
    } else {
        // Clear selection when clicking empty space
        selectedAgents = [];
        simulation.clearSelectedAgents();
        simulation.clearHoveredAgents();
        currentHoveredAgents = [];
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
    const hunger = agent.hunger;
    
    tooltip.innerHTML = `
        <div class="tooltip-title">Agent Information</div>
        <div class="tooltip-row"><strong>ID:</strong> ${agent.id}</div>
        <div class="tooltip-row"><strong>State:</strong> ${stateName}</div>
        <div class="tooltip-row"><strong>Location:</strong> ${location}</div>
        <div class="tooltip-row"><strong>Destination:</strong> ${destination}</div>
        <div class="tooltip-row"><strong>Speed:</strong> ${speed} px/s</div>
        <div class="tooltip-row"><strong>Direction:</strong> ${direction}°</div>
        <div class="tooltip-row"><strong>Pathfinding:</strong> ${pathfindingMode}</div>
        <div class="tooltip-row"><strong>Hunger:</strong> ${hunger}</div>
    `;
}

// Update tooltip for selected agent in real-time
function updateSelectedAgentTooltip() {
    if (selectedAgents.length > 0) {
        updateTooltip(selectedAgents[0]);
    }
    requestAnimationFrame(updateSelectedAgentTooltip);
}

// Start real-time tooltip updates
updateSelectedAgentTooltip();

// Start simulation
simulation.run();
