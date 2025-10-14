/**
 * Pathfinding utility for agents to navigate around obstacles
 * Implements Hybrid Bug + Bounded A* (Fixed Expansion Lite) algorithm
 * 
 * Bug mode: Agent moves straight toward goal unless blocked
 * A* mode: When blocked, performs bounded A* search (max 300 expansions) 
 *          to find detour, then switches back to Bug mode when line of sight restored
 */

/**
 * Calculate Euclidean distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Euclidean distance
 */
export function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert coordinates to grid key for A* search
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} gridSize - Grid cell size
 * @returns {string} Grid key
 */
export function getGridKey(x, y, gridSize) {
    return `${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`;
}

/**
 * Check if a position is valid (not colliding with obstacles)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array<Obstacle>} obstacles - Array of obstacles
 * @param {number} agentRadius - Agent radius for collision checking
 * @returns {boolean} True if position is valid
 */
export function isPositionValid(x, y, obstacles, agentRadius) {
    for (const obstacle of obstacles) {
        if (obstacle.collidesWith(x, y, agentRadius)) {
            return false;
        }
    }
    return true;
}

/**
 * Reconstruct path from A* search results
 * @param {Object} currentNode - Current node that reached the goal
 * @param {Map} cameFrom - Map of nodes to their predecessors
 * @param {number} goalX - Goal X coordinate
 * @param {number} goalY - Goal Y coordinate
 * @returns {Array<{x: number, y: number}>} Reconstructed path
 */
export function reconstructPath(currentNode, cameFrom, goalX, goalY) {
    const path = [];
    let pathKey = currentNode.key;
    let pathNode = currentNode;
    
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
    const distance = calculateDistance(x1, y1, x2, y2);
    
    if (distance === 0) {
        return true;
    }
    
    // Sample at regular intervals (every 2 pixels)
    const steps = Math.ceil(distance / 2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    
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
        }
        // Blocked - switch to A* mode to find detour
        agentPathState.mode = 'astar';
        agentPathState.path = findBoundedPath(currentX, currentY, goalX, goalY, obstacles, agentRadius);
        agentPathState.pathIndex = 0;
        // Fall through to astar mode handling
    }
    
    // A* mode: follow computed path (also handles fall-through from bug mode)
    // If we've reached the end of the path, switch back to bug mode
    if (agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length) {
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
    const distToWaypoint = calculateDistance(currentX, currentY, nextWaypoint.x, nextWaypoint.y);
    
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
export function findBoundedPath(startX, startY, goalX, goalY, obstacles, agentRadius) {
    const MAX_EXPANSIONS = 300;
    const GRID_SIZE = 10; // Grid cell size for discretization
    
    // Helper to calculate heuristic (Euclidean distance to goal)
    const heuristic = (x, y) => calculateDistance(x, y, goalX, goalY);
    
    // Initialize open and closed sets
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = getGridKey(startX, startY, GRID_SIZE);
    openSet.push({ x: startX, y: startY, key: startKey });
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY));
    
    let expansions = 0;
    
    while (openSet.length > 0 && expansions < MAX_EXPANSIONS) {
        // Get node with lowest fScore
        openSet.sort((a, b) => fScore.get(a.key) - fScore.get(b.key));
        const current = openSet.shift();
        
        expansions++;
        closedSet.add(current.key);
        
        // Check if we reached the goal (within grid cell)
        const distToGoal = calculateDistance(current.x, current.y, goalX, goalY);
        if (distToGoal < GRID_SIZE * 2) {
            // Reconstruct path
            return reconstructPath(current, cameFrom, goalX, goalY);
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
            const neighborKey = getGridKey(neighborX, neighborY, GRID_SIZE);
            
            // Skip if already explored
            if (closedSet.has(neighborKey)) {
                continue;
            }
            
            // Skip if invalid position
            if (!isPositionValid(neighborX, neighborY, obstacles, agentRadius)) {
                continue;
            }
            
            // Calculate tentative gScore
            const moveCost = calculateDistance(0, 0, dir.dx, dir.dy);
            const currentGScore = gScore.get(current.key);
            // currentGScore is guaranteed to exist for nodes we're exploring
            const tentativeGScore = currentGScore + moveCost;
            
            // Check if this path is better (neighbor not yet scored means Infinity)
            const currentNeighborScore = gScore.get(neighborKey);
            if (currentNeighborScore === undefined || tentativeGScore < currentNeighborScore) {
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
