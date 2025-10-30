/**
 * OverlapPrevention.js
 * 
 * Handles agent overlap detection and anti-overlap velocity vector calculation.
 * Agents that overlap with other agents receive an additional velocity vector
 * that pushes them away from overlapping agents.
 */

// Constants
const OVERLAP_FORCE_MULTIPLIER = 10; // Multiplier for overlap magnitude to make effect noticeable
const POSITION_TOLERANCE = 0.001; // Tolerance for detecting agents at exact same position

/**
 * Detects if two agents overlap (their circles intersect)
 * @param {Agent} agent1 - First agent
 * @param {Agent} agent2 - Second agent
 * @returns {boolean} True if agents overlap
 */
export function detectOverlap(agent1, agent2) {
    const dx = agent2.x - agent1.x;
    const dy = agent2.y - agent1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadii = agent1.radius + agent2.radius;
    return distance < combinedRadii;
}

/**
 * Calculates the amount of overlap between two agents
 * @param {Agent} agent1 - First agent
 * @param {Agent} agent2 - Second agent
 * @returns {number} Amount of overlap in pixels (0 if no overlap)
 */
export function calculateOverlapAmount(agent1, agent2) {
    const dx = agent2.x - agent1.x;
    const dy = agent2.y - agent1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadii = agent1.radius + agent2.radius;
    const overlap = combinedRadii - distance;
    return Math.max(0, overlap);
}

/**
 * Calculates anti-overlap velocity vector from one agent towards another
 * The vector points away from the overlapping agent, with magnitude proportional to overlap
 * @param {Agent} fromAgent - Agent experiencing the overlap
 * @param {Agent} toAgent - Agent causing the overlap
 * @returns {{vx: number, vy: number}} Velocity vector components
 */
export function calculateAntiOverlapVector(fromAgent, toAgent) {
    const dx = toAgent.x - fromAgent.x;
    const dy = toAgent.y - fromAgent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Special case: agents at exact same position
    if (distance === 0) {
        return { vx: 0, vy: 0 };
    }
    
    const overlap = calculateOverlapAmount(fromAgent, toAgent);
    
    if (overlap === 0) {
        return { vx: 0, vy: 0 };
    }
    
    // Direction away from the other agent (opposite direction)
    const dirX = -dx / distance;
    const dirY = -dy / distance;
    
    // Magnitude proportional to overlap amount
    // Using a multiplier to make the effect more noticeable
    const magnitude = overlap * OVERLAP_FORCE_MULTIPLIER;
    
    return {
        vx: dirX * magnitude,
        vy: dirY * magnitude
    };
}

/**
 * Handles the special case where two agents are at the exact same position
 * Moves the second agent one pixel to the right
 * @param {Agent} agent1 - First agent
 * @param {Agent} agent2 - Second agent to be moved
 */
export function handleCompleteOverlap(agent1, agent2) {
    const dx = agent2.x - agent1.x;
    const dy = agent2.y - agent1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if agents are at exact same position (within floating point tolerance)
    if (distance < POSITION_TOLERANCE) {
        agent2.x += 1;
    }
}

/**
 * Calculates combined anti-overlap velocity vector for an agent
 * considering all other agents it overlaps with
 * @param {Agent} agent - Agent to calculate vector for
 * @param {Array<Agent>} allAgents - All agents in the simulation
 * @returns {{vx: number, vy: number}} Combined anti-overlap velocity vector
 */
export function calculateCombinedAntiOverlapVector(agent, allAgents) {
    let totalVx = 0;
    let totalVy = 0;
    
    for (const otherAgent of allAgents) {
        // Skip self
        if (otherAgent.id === agent.id) {
            continue;
        }
        
        // Handle complete overlap special case
        handleCompleteOverlap(agent, otherAgent);
        
        // Check for overlap
        if (detectOverlap(agent, otherAgent)) {
            const vector = calculateAntiOverlapVector(agent, otherAgent);
            totalVx += vector.vx;
            totalVy += vector.vy;
        }
    }
    
    return { vx: totalVx, vy: totalVy };
}

/**
 * Checks if applying a velocity component would cause the agent to collide with an obstacle
 * @param {Agent} agent - Agent to check
 * @param {number} vx - X component of velocity to test
 * @param {number} vy - Y component of velocity to test
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} deltaTime - Time step for simulation
 * @returns {{capX: boolean, capY: boolean}} Which components should be capped
 */
export function checkObstacleCollision(agent, vx, vy, obstacles, deltaTime) {
    // Test position after applying velocity
    const testX = agent.x + vx * deltaTime;
    const testY = agent.y + vy * deltaTime;
    
    let capX = false;
    let capY = false;
    
    for (const obstacle of obstacles) {
        // Check if test position would collide
        if (obstacle.collidesWith(testX, testY, agent.radius)) {
            // Check X component separately
            const testXOnly = agent.x + vx * deltaTime;
            if (obstacle.collidesWith(testXOnly, agent.y, agent.radius)) {
                capX = true;
            }
            
            // Check Y component separately
            const testYOnly = agent.y + vy * deltaTime;
            if (obstacle.collidesWith(agent.x, testYOnly, agent.radius)) {
                capY = true;
            }
        }
    }
    
    return { capX, capY };
}

/**
 * Applies hard cap to anti-overlap velocity components that would cause obstacle collision
 * @param {Agent} agent - Agent to apply capping to
 * @param {{vx: number, vy: number}} antiOverlapVector - Anti-overlap velocity vector
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} deltaTime - Time step for simulation
 * @returns {{vx: number, vy: number}} Capped velocity vector
 */
export function capAntiOverlapVector(agent, antiOverlapVector, obstacles, deltaTime) {
    const collision = checkObstacleCollision(
        agent,
        antiOverlapVector.vx,
        antiOverlapVector.vy,
        obstacles,
        deltaTime
    );
    
    return {
        vx: collision.capX ? 0 : antiOverlapVector.vx,
        vy: collision.capY ? 0 : antiOverlapVector.vy
    };
}

/**
 * Calculates the final anti-overlap velocity vector for an agent,
 * including overlap detection, vector combination, and obstacle collision capping
 * @param {Agent} agent - Agent to calculate vector for
 * @param {Array<Agent>} allAgents - All agents in the simulation
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} deltaTime - Time step for simulation
 * @returns {{vx: number, vy: number}} Final anti-overlap velocity vector
 */
export function calculateFinalAntiOverlapVector(agent, allAgents, obstacles, deltaTime) {
    // Calculate combined vector from all overlapping agents
    const combinedVector = calculateCombinedAntiOverlapVector(agent, allAgents);
    
    // Apply obstacle collision capping
    const cappedVector = capAntiOverlapVector(agent, combinedVector, obstacles, deltaTime);
    
    return cappedVector;
}
