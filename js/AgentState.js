// Base state class for agent state machine
export class AgentState {
    /**
     * Called when the agent enters this state
     * @param {Agent} agent - The agent entering this state
     * @param {number} canvasWidth - Canvas width for initialization
     * @param {number} canvasHeight - Canvas height for initialization
     */
    enter(agent, canvasWidth, canvasHeight) {
        // Override in subclasses
    }
    
    /**
     * Called every frame while in this state
     * @param {Agent} agent - The agent to update
     * @param {number} deltaTime - Time elapsed in seconds
     * @param {number} canvasWidth - Canvas width for boundary checking
     * @param {number} canvasHeight - Canvas height for boundary checking
     */
    update(agent, deltaTime, canvasWidth, canvasHeight) {
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
     * Returns the default color for this state
     * @param {Agent} agent - The agent to get color for
     * @returns {string|null} The color string, or null to use agent's type color
     */
    getColor(agent) {
        return null; // Default: use agent's type color
    }
}

// Idle state - agent remains stationary
export class IdleState extends AgentState {
    enter(agent, canvasWidth, canvasHeight) {
        agent.idleTimer = 1000;
        agent.destinationX = agent.x;
        agent.destinationY = agent.y;
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight) {
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

// Moving state - agent moves toward destination
export class MovingState extends AgentState {
    enter(agent, canvasWidth, canvasHeight) {
        agent.idleTimer = 0;
        agent.chooseRandomDestination(canvasWidth, canvasHeight);
    }
    
    update(agent, deltaTime, canvasWidth, canvasHeight) {
        // Calculate distance to destination
        const dx = agent.destinationX - agent.x;
        const dy = agent.destinationY - agent.y;
        const distanceToDestination = Math.sqrt(dx * dx + dy * dy);
        
        // Check if reached destination (within 5 units)
        if (distanceToDestination <= 5) {
            // Transition to IDLE
            agent.transitionTo(new IdleState(), canvasWidth, canvasHeight);
        } else {
            // Continue moving towards destination
            const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy);
            if (speed > 0 && distanceToDestination > 0) {
                // Normalize direction and apply velocity
                const dirX = dx / distanceToDestination;
                const dirY = dy / distanceToDestination;
                agent.x += dirX * speed * deltaTime;
                agent.y += dirY * speed * deltaTime;
            }
        }
    }
}
