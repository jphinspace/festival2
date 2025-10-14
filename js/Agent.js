// Agent class representing festival attendees
export class Agent {
    constructor(x, y, type = 'fan') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 100; // velocity in pixels per second
        this.vy = (Math.random() - 0.5) * 100;
        this.radius = 5;
        
        // Color based on type
        this.color = this.getColorForType(type);
    }
    
    getColorForType(type) {
        switch(type) {
            case 'fan':
                return `hsl(${Math.random() * 360}, 70%, 50%)`;
            case 'security':
                return 'yellow';
            case 'performer':
                return 'red';
            default:
                return 'blue';
        }
    }
    
    // Frame-independent update
    update(deltaTime, canvasWidth, canvasHeight) {
        // Update position based on velocity and deltaTime
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Bounce off walls
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx = -this.vx;
            this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.vy = -this.vy;
            this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
