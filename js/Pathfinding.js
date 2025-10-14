/**
 * Pathfinding utility for agents to navigate around obstacles
 * Implements Hybrid Bug + Bounded A* (Fixed Expansion Lite) algorithm
 * 
 * Bug mode: Agent moves straight toward goal unless blocked
 * A* mode: When blocked, performs bounded A* search (max 300 expansions) 
 *          to find detour, then switches back to Bug mode when line of sight restored
 */

/**
 * Check if there's a clear line of sight between two points (no obstacles)
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} agentRadius - Agent radius for collision checking
 * @returns {boolean} True if line of sight is clear
 */
export function hasLineOfSight(x1, y1, x2, y2, obstacles, agentRadius) {
    // Sample points along the line
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
        return true;
    }
    
    // Sample at regular intervals (every 2 pixels)
    const steps = Math.ceil(distance / 2);
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;
        
        // Check if this point collides with any obstacle
        for (const obstacle of obstacles) {
            if (obstacle.collidesWith(x, y, agentRadius)) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Calculate the next position for an agent using Hybrid Bug + Bounded A* pathfinding
 * @param {number} currentX - Current agent X position
 * @param {number} currentY - Current agent Y position
 * @param {number} goalX - Goal X position
 * @param {number} goalY - Goal Y position
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} agentRadius - Agent radius for collision checking
 * @param {Object} agentPathState - Agent's pathfinding state (should be persistent)
 * @returns {{x: number, y: number, mode: string}} Next waypoint and current mode
 */
export function calculateNextWaypoint(currentX, currentY, goalX, goalY, obstacles, agentRadius, agentPathState) {
    // Initialize agent path state if needed
    if (!agentPathState.mode) {
        agentPathState.mode = 'bug'; // Start in bug mode
        agentPathState.path = [];
        agentPathState.pathIndex = 0;
    }
    
    // Bug mode: try to go straight to goal
    if (agentPathState.mode === 'bug') {
        if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
            // Clear path - go straight to goal
            return { x: goalX, y: goalY, mode: 'bug' };
        } else {
            // Blocked - switch to A* mode to find detour
            agentPathState.mode = 'astar';
            agentPathState.path = findBoundedPath(currentX, currentY, goalX, goalY, obstacles, agentRadius);
            agentPathState.pathIndex = 0;
        }
    }
    
    // A* mode: follow computed path
    if (agentPathState.mode === 'astar') {
        // If we've reached the end of the path, switch back to bug mode
        if (!agentPathState.path || agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length) {
            agentPathState.mode = 'bug';
            agentPathState.path = [];
            agentPathState.pathIndex = 0;
            return { x: goalX, y: goalY, mode: 'bug' };
        }
        
        // Check if we have line of sight to goal - if so, switch back to bug mode
        if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
            agentPathState.mode = 'bug';
            agentPathState.path = [];
            agentPathState.pathIndex = 0;
            return { x: goalX, y: goalY, mode: 'bug' };
        }
        
        // Follow the path
        const nextWaypoint = agentPathState.path[agentPathState.pathIndex];
        
        // If we're close to the current waypoint, advance to next
        const dx = nextWaypoint.x - currentX;
        const dy = nextWaypoint.y - currentY;
        const distToWaypoint = Math.sqrt(dx * dx + dy * dy);
        
        if (distToWaypoint < 5) {
            agentPathState.pathIndex++;
            if (agentPathState.pathIndex >= agentPathState.path.length) {
                // Reached end of path
                agentPathState.mode = 'bug';
                agentPathState.path = [];
                agentPathState.pathIndex = 0;
                return { x: goalX, y: goalY, mode: 'bug' };
            }
            return agentPathState.path[agentPathState.pathIndex];
        }
        
        return { ...nextWaypoint, mode: 'astar' };
    }
    
    // Fallback
    return { x: goalX, y: goalY, mode: 'bug' };
}

/**
 * Find a path using bounded A* search (max 300 expansions)
 * @param {number} startX - Start X position
 * @param {number} startY - Start Y position
 * @param {number} goalX - Goal X position
 * @param {number} goalY - Goal Y position
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} agentRadius - Agent radius for collision checking
 * @returns {Array<{x: number, y: number}>} Path waypoints (empty if no path found)
 */
function findBoundedPath(startX, startY, goalX, goalY, obstacles, agentRadius) {
    const MAX_EXPANSIONS = 300;
    const GRID_SIZE = 10; // Grid cell size for discretization
    
    // Helper to get grid key
    const getKey = (x, y) => `${Math.floor(x / GRID_SIZE)},${Math.floor(y / GRID_SIZE)}`;
    
    // Helper to calculate heuristic (Euclidean distance)
    const heuristic = (x, y) => {
        const dx = goalX - x;
        const dy = goalY - y;
        return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Helper to check if position is valid (not in obstacle)
    const isValid = (x, y) => {
        for (const obstacle of obstacles) {
            if (obstacle.collidesWith(x, y, agentRadius)) {
                return false;
            }
        }
        return true;
    };
    
    // Initialize open and closed sets
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = getKey(startX, startY);
    openSet.push({ x: startX, y: startY, key: startKey });
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY));
    
    let expansions = 0;
    
    while (openSet.length > 0 && expansions < MAX_EXPANSIONS) {
        // Get node with lowest fScore
        openSet.sort((a, b) => (fScore.get(a.key) || Infinity) - (fScore.get(b.key) || Infinity));
        const current = openSet.shift();
        
        if (!current) {
            break;
        }
        
        expansions++;
        closedSet.add(current.key);
        
        // Check if we reached the goal (within grid cell)
        const distToGoal = Math.sqrt(
            (current.x - goalX) * (current.x - goalX) + 
            (current.y - goalY) * (current.y - goalY)
        );
        if (distToGoal < GRID_SIZE * 2) {
            // Reconstruct path
            const path = [];
            let pathKey = current.key;
            let pathNode = current;
            
            while (cameFrom.has(pathKey)) {
                path.unshift({ x: pathNode.x, y: pathNode.y });
                const prev = cameFrom.get(pathKey);
                pathKey = prev.key;
                pathNode = prev;
            }
            
            // Add goal as final waypoint
            if (path.length > 0) {
                path.push({ x: goalX, y: goalY });
            }
            
            return path;
        }
        
        // Explore neighbors (8-directional)
        const directions = [
            { dx: GRID_SIZE, dy: 0 },
            { dx: -GRID_SIZE, dy: 0 },
            { dx: 0, dy: GRID_SIZE },
            { dx: 0, dy: -GRID_SIZE },
            { dx: GRID_SIZE, dy: GRID_SIZE },
            { dx: GRID_SIZE, dy: -GRID_SIZE },
            { dx: -GRID_SIZE, dy: GRID_SIZE },
            { dx: -GRID_SIZE, dy: -GRID_SIZE }
        ];
        
        for (const dir of directions) {
            const neighborX = current.x + dir.dx;
            const neighborY = current.y + dir.dy;
            const neighborKey = getKey(neighborX, neighborY);
            
            // Skip if already explored
            if (closedSet.has(neighborKey)) {
                continue;
            }
            
            // Skip if invalid position
            if (!isValid(neighborX, neighborY)) {
                continue;
            }
            
            // Calculate tentative gScore
            const moveCost = Math.sqrt(dir.dx * dir.dx + dir.dy * dir.dy);
            const tentativeGScore = (gScore.get(current.key) || Infinity) + moveCost;
            
            // Check if this path is better
            if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, { x: current.x, y: current.y, key: current.key });
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(neighborX, neighborY));
                
                // Add to open set if not already there
                const alreadyInOpen = openSet.some(node => node.key === neighborKey);
                if (!alreadyInOpen) {
                    openSet.push({ x: neighborX, y: neighborY, key: neighborKey });
                }
            }
        }
    }
    
    // No path found within expansion limit - return empty path
    return [];
}
