import { calculateNextWaypoint } from './Pathfinding.js';
import { FoodStall } from './FoodStall.js';

/**
 * Calculate the probability of transitioning to MovingToFoodStallState based on hunger
 * @param {number} hunger - The agent's current hunger level
 * @returns {number} Probability as a decimal (0 to 0.5)
 */
export function calculateFoodStallTransitionProbability(hunger) {
    if (hunger <= 50) {
        return 0;
    }
    // 1% for every 1 hunger above 50, capped at 50%
    const probability = Math.min((hunger - 50) * 0.01, 0.5);
    return probability;
}

/**
 * Check if agent should transition to food stall based on hunger
 * @param {number} hunger - The agent's current hunger level
 * @returns {boolean} Whether to transition to food stall
 */
export function shouldTransitionToFoodStall(hunger) {
    const probability = calculateFoodStallTransitionProbability(hunger);
    return Math.random() < probability;
}

/**
 * Get all food stall regions from obstacles
 * Each food stall has a left and right region adjacent to it
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @returns {Array<{bounds: Object, stallId: number, side: string}>} Array of region descriptors
 */
export function getFoodStallRegions(obstacles) {
    const regions = [];
    const agentDiameter = 10; // agent radius = 5, diameter = 10
    const regionWidth = agentDiameter;
    
    for (const obstacle of obstacles) {
        if (obstacle instanceof FoodStall) {
            const bounds = obstacle.getBounds();
            const height = bounds.bottom - bounds.top;
            const centerY = (bounds.top + bounds.bottom) / 2;
            
            // Left region
            regions.push({
                bounds: {
                    left: bounds.left - regionWidth,
                    right: bounds.left,
                    top: bounds.top,
                    bottom: bounds.bottom
                },
                stallId: obstacle.id,
                side: 'left'
            });
            
            // Right region
            regions.push({
                bounds: {
                    left: bounds.right,
                    right: bounds.right + regionWidth,
                    top: bounds.top,
                    bottom: bounds.bottom
                },
                stallId: obstacle.id,
                side: 'right'
            });
        }
    }
    
    return regions;
}

/**
 * Choose a random food stall region
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @returns {Object|null} Random region or null if no regions found
 */
export function chooseRandomFoodStallRegion(obstacles) {
    const regions = getFoodStallRegions(obstacles);
    
    if (regions.length === 0) {
        return null;
    }
    
    // Random selection (d8 for 8 regions: 4 stalls × 2 sides)
    const randomIndex = Math.floor(Math.random() * regions.length);
    return regions[randomIndex];
}

/**
 * Get a random destination within a food stall region
 * @param {Object} region - Region descriptor with bounds
 * @returns {Object} Destination coordinates {x, y}
 */
export function getDestinationInRegion(region) {
    const bounds = region.bounds;
    const x = bounds.left + Math.random() * (bounds.right - bounds.left);
    const y = bounds.top + Math.random() * (bounds.bottom - bounds.top);
    return { x, y };
}

// Base state class for agent state machine
export class AgentState {
    constructor() {
        // Timers that can be set up by subclasses
        this.timers = new Map();
    }
    
    /**
     * Register a timer that fires at regular intervals
     * @param {string} name - Timer name
     * @param {number} interval - Interval in ticks (1000 ticks = 1 second)
     * @param {Function} callback - Function to call when timer fires
     */
    addTimer(name, interval, callback) {
        this.timers.set(name, {
            interval: interval,
            elapsed: 0,
            callback: callback
        });
    }
    
    /**
     * Remove a timer
     * @param {string} name - Timer name
     */
    removeTimer(name) {
        this.timers.delete(name);
    }
    
    /**
     * Update all timers and fire callbacks when they expire
     * @param {Agent} agent - The agent
     * @param {number} deltaTime - Time elapsed in seconds
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {Array<Obstacle>} obstacles - Array of obstacles
     */
    updateTimers(agent, deltaTime, canvasWidth, canvasHeight, obstacles) {
        const ticksElapsed = deltaTime * 1000;
        
        for (const [name, timer] of this.timers) {
            timer.elapsed += ticksElapsed;
            
            // Fire callback for each complete interval
            while (timer.elapsed >= timer.interval) {
                timer.callback(agent, canvasWidth, canvasHeight, obstacles);
                timer.elapsed -= timer.interval;
            }
        }
    }
    
    /**
     * Called when the agent enters this state
     * @param {Agent} agent - The agent entering this state
     * @param {number} canvasWidth - Canvas width for initialization
     * @param {number} canvasHeight - Canvas height for initialization
     * @param {Array<Obstacle>} obstacles - Array of obstacles for pathfinding
     */
    enter(agent, canvasWidth, canvasHeight, obstacles = []) {
        // Override in subclasses
    }
    
    /**
     * Called every frame while in this state
     * @param {Agent} agent - The agent to update
     * @param {number} deltaTime - Time elapsed in seconds
     * @param {number} canvasWidth - Canvas width for boundary checking
     * @param {number} canvasHeight - Canvas height for boundary checking
     * @param {Array<Obstacle>} obstacles - Array of obstacles for pathfinding
     */
    update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
        // Update timers first
        this.updateTimers(agent, deltaTime, canvasWidth, canvasHeight, obstacles);
        
        // Override in subclasses for additional behavior
    }
    
    /**
     * Called when the agent exits this state
     * @param {Agent} agent - The agent exiting this state
     */
    exit(agent) {
        // Override in subclasses
    }
    
    /**
     * Returns the name of this state for debugging/testing
     * @returns {string} The state name
     */
    getName() {
        return this.constructor.name;
    }
    
    /**
     * Returns the color for this state
     * @param {Agent} agent - The agent to get color for
     * @returns {string} The color string (magenta indicates unimplemented state)
     */
    getColor(agent) {
        return 'magenta'; // Default: magenta for easy bug visibility
    }
}

// Idle state - agent remains stationary
export class IdleState extends AgentState {
    constructor() {
        super();
    }
    
    enter(agent, canvasWidth, canvasHeight, obstacles = []) {
        agent.idleTimer = 1000;
        agent.destinationX = agent.x;
        agent.destinationY = agent.y;
        // Reset pathfinding state when entering idle
        agent.pathState = {};
        
        // Set up combined hunger and food stall check timer
        this.addTimer('hungerAndFoodStallCheck', 1000, (agent, canvasWidth, canvasHeight) => {
            // Increment hunger
            agent.hunger++;
            
            // Check if should transition to food stall
            if (shouldTransitionToFoodStall(agent.hunger)) {
                agent.transitionTo(new MovingToFoodStallState(), canvasWidth, canvasHeight);
            }
        });
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
        // Store current state to detect transitions
        const initialState = agent.state;
        
        // Update timers first (handles hunger and food stall checks)
        super.update(agent, deltaTime, canvasWidth, canvasHeight, obstacles);
        
        // If state changed during timer processing, don't continue with idle logic
        if (agent.state !== initialState) {
            return;
        }
        
        // Decrement idle timer (deltaTime is in seconds, but timer is in ticks at 1000 ticks/sec)
        const ticksElapsed = deltaTime * 1000;
        agent.idleTimer -= ticksElapsed;
        
        // Check if timer expired
        if (agent.idleTimer <= 0) {
            // Ensure timer is exactly 0 if it went negative
            if (agent.idleTimer < 0) {
                agent.idleTimer = 0;
            }
            // Transition to MOVING
            agent.transitionTo(new MovingState(), canvasWidth, canvasHeight);
        }
    }
    
    getColor(agent) {
        return '#8B0000'; // Dark red for idle state
    }
}

// Moving state - agent moves toward destination using pathfinding
export class MovingState extends AgentState {
    constructor() {
        super();
    }
    
    enter(agent, canvasWidth, canvasHeight, obstacles = []) {
        agent.idleTimer = 0;
        agent.chooseRandomDestination(canvasWidth, canvasHeight, obstacles);
        // Reset pathfinding state for new destination
        agent.pathState = {};
        
        // Set up hunger timer (increment only, no food stall transition in MovingState)
        this.addTimer('hungerIncrement', 1000, (agent, canvasWidth, canvasHeight) => {
            // Increment hunger only - MovingState cannot transition to food stall
            agent.hunger++;
        });
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
        // Store current state to detect transitions
        const initialState = agent.state;
        
        // Update timers first (handles hunger and food stall checks)
        super.update(agent, deltaTime, canvasWidth, canvasHeight, obstacles);
        
        // If state changed during timer processing, don't continue with movement logic
        if (agent.state !== initialState) {
            return;
        }
        
        // Calculate distance to destination
        const dx = agent.destinationX - agent.x;
        const dy = agent.destinationY - agent.y;
        const distanceToDestination = Math.sqrt(dx * dx + dy * dy);
        
        // Check if reached destination (within 5 units)
        if (distanceToDestination <= 5) {
            // Transition to IDLE
            agent.transitionTo(new IdleState(), canvasWidth, canvasHeight);
        } else {
            // Use pathfinding to get next waypoint
            const waypoint = calculateNextWaypoint(
                agent.x,
                agent.y,
                agent.destinationX,
                agent.destinationY,
                obstacles,
                agent.radius,
                agent.pathState
            );
            
            // Calculate direction to waypoint
            const waypointDx = waypoint.x - agent.x;
            const waypointDy = waypoint.y - agent.y;
            const waypointDist = Math.sqrt(waypointDx * waypointDx + waypointDy * waypointDy);
            
            // Move towards waypoint
            const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy);
            if (speed > 0 && waypointDist > 0) {
                // Normalize direction and apply velocity
                const dirX = waypointDx / waypointDist;
                const dirY = waypointDy / waypointDist;
                agent.x += dirX * speed * deltaTime;
                agent.y += dirY * speed * deltaTime;
            }
        }
    }
    
    getColor(agent) {
        return agent.color; // Use agent's type color when moving
    }
}

// Moving to food stall state - agent moves toward a food stall region
export class MovingToFoodStallState extends AgentState {
    constructor() {
        super();
    }
    
    enter(agent, canvasWidth, canvasHeight, obstacles = []) {
        agent.idleTimer = 0;
        
        // Choose a random food stall region
        const region = chooseRandomFoodStallRegion(obstacles);
        
        if (region) {
            // Set destination to a random point within the region
            const destination = getDestinationInRegion(region);
            agent.destinationX = destination.x;
            agent.destinationY = destination.y;
        } else {
            // Fallback: choose random destination if no food stalls found
            agent.chooseRandomDestination(canvasWidth, canvasHeight, obstacles);
        }
        
        // Reset pathfinding state for new destination
        agent.pathState = {};
        
        // No hunger increment while eating - agent is focused on getting food
        // No food stall transition check - agent is already going to food
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
        // Update timers (none set up, but call super for consistency)
        super.update(agent, deltaTime, canvasWidth, canvasHeight, obstacles);
        
        // Calculate distance to destination
        const dx = agent.destinationX - agent.x;
        const dy = agent.destinationY - agent.y;
        const distanceToDestination = Math.sqrt(dx * dx + dy * dy);
        
        // Check if reached destination (within 5 units)
        if (distanceToDestination <= 5) {
            // Reset hunger to 0
            agent.hunger = 0;
            agent.totalTicks = 0;
            
            // Transition to IDLE
            agent.transitionTo(new IdleState(), canvasWidth, canvasHeight);
        } else {
            // Use pathfinding to get next waypoint
            const waypoint = calculateNextWaypoint(
                agent.x,
                agent.y,
                agent.destinationX,
                agent.destinationY,
                obstacles,
                agent.radius,
                agent.pathState
            );
            
            // Calculate direction to waypoint
            const waypointDx = waypoint.x - agent.x;
            const waypointDy = waypoint.y - agent.y;
            const waypointDist = Math.sqrt(waypointDx * waypointDx + waypointDy * waypointDy);
            
            // Move towards waypoint
            const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy);
            if (speed > 0 && waypointDist > 0) {
                // Normalize direction and apply velocity
                const dirX = waypointDx / waypointDist;
                const dirY = waypointDy / waypointDist;
                agent.x += dirX * speed * deltaTime;
                agent.y += dirY * speed * deltaTime;
            }
        }
    }
    
    getColor(agent) {
        return '#00FF00'; // Green for moving to food stall
    }
}
