import { calculateNextWaypoint } from './Pathfinding.js';

// Base state class for agent state machine
export class AgentState {
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
        // Override in subclasses
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
    enter(agent, canvasWidth, canvasHeight, obstacles = []) {
        agent.idleTimer = 1000;
        agent.destinationX = agent.x;
        agent.destinationY = agent.y;
        // Reset pathfinding state when entering idle
        agent.pathState = {};
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
        // Decrement timer (deltaTime is in seconds, but timer is in ticks at 1000 ticks/sec)
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
    enter(agent, canvasWidth, canvasHeight, obstacles = []) {
        agent.idleTimer = 0;
        agent.chooseRandomDestination(canvasWidth, canvasHeight, obstacles);
        // Reset pathfinding state for new destination
        agent.pathState = {};
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
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
