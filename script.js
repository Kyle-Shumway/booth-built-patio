class PatioCoverDesigner {
    constructor() {
        this.canvas = document.getElementById('designCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas3d = document.getElementById('canvas3d');
        this.ctx3d = this.canvas3d.getContext('2d');
        
        this.posts = [];
        this.shadeArea = null;
        this.coverType = 'lattice';
        this.angle = 15;
        this.mode = 'post'; // 'post' or 'shade'
        this.isDragging = false;
        this.dragStart = null;
        this.rotation3d = 30;
        
        // Cantilever limits based on research
        this.cantileverLimits = {
            '4x4': 8, // 8 feet max cantilever
            '6x6': 12, // 12 feet max cantilever
            '8x8': 16  // 16 feet max cantilever
        };
        
        this.prices = {
            steelPost4x4: 150,
            steelPost6x6: 250,
            steelPost8x8: 380,
            latticePerSqFt: 12,
            aluminumPerSqFt: 18,
            hardwareBase: 75,
            installationPerSqFt: 8,
            engineeringFee: 500
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.draw();
    }
    
    setupEventListeners() {
        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Mode toggle
        document.getElementById('postMode').addEventListener('click', () => this.setMode('post'));
        document.getElementById('shadeMode').addEventListener('click', () => this.setMode('shade'));
        
        // Cover type
        document.querySelectorAll('input[name="coverType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.coverType = e.target.value;
                this.updateDisplay();
                this.draw();
            });
        });
        
        // Angle slider
        const angleSlider = document.getElementById('angleSlider');
        angleSlider.addEventListener('input', (e) => {
            this.angle = parseInt(e.target.value);
            document.getElementById('angleValue').textContent = `${this.angle}°`;
            document.getElementById('specAngle').textContent = `${this.angle}°`;
            this.updateDisplay();
            this.draw();
        });
        
        // Action buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('view3dBtn').addEventListener('click', () => this.show3DView());
        
        // 3D Modal controls
        document.querySelector('.close-btn').addEventListener('click', () => this.hide3DView());
        document.getElementById('rotateLeft').addEventListener('click', () => this.rotate3D(-15));
        document.getElementById('rotateRight').addEventListener('click', () => this.rotate3D(15));
        document.getElementById('topView').addEventListener('click', () => this.set3DView(0));
        document.getElementById('sideView').addEventListener('click', () => this.set3DView(90));
        
        // Close modal on outside click
        document.getElementById('modal3d').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal3d')) {
                this.hide3DView();
            }
        });
    }
    
    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Mode').classList.add('active');
        
        this.canvas.className = mode === 'shade' ? 'drag-mode' : '';
        
        const instructions = document.getElementById('modeInstructions');
        if (mode === 'post') {
            instructions.textContent = 'Click to place posts (minimum 2 required)';
        } else {
            instructions.textContent = this.posts.length < 2 ? 
                'Place at least 2 posts first' : 'Drag to create shade area';
        }
    }
    
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (this.mode === 'post') {
            this.addPost(x, y);
        } else if (this.mode === 'shade' && this.posts.length >= 2) {
            this.isDragging = true;
            this.dragStart = { x, y };
            this.canvas.classList.add('dragging');
        }
    }
    
    handleMouseMove(event) {
        if (!this.isDragging || this.mode !== 'shade') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.shadeArea = {
            x: Math.min(this.dragStart.x, x),
            y: Math.min(this.dragStart.y, y),
            width: Math.abs(x - this.dragStart.x),
            height: Math.abs(y - this.dragStart.y)
        };
        
        this.updateDisplay();
        this.draw();
    }
    
    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.classList.remove('dragging');
        }
    }
    
    addPost(x, y) {
        this.posts.push({ x, y });
        this.updateDisplay();
        this.draw();
        
        if (this.posts.length >= 2) {
            this.setMode('shade');
        }
    }
    
    calculateCantileverSpan() {
        if (!this.shadeArea || this.posts.length < 2) return 0;
        
        // Calculate the maximum distance from any post to the shade area edges
        let maxCantilever = 0;
        
        this.posts.forEach(post => {
            const leftDistance = Math.abs(post.x - this.shadeArea.x);
            const rightDistance = Math.abs(post.x - (this.shadeArea.x + this.shadeArea.width));
            const topDistance = Math.abs(post.y - this.shadeArea.y);
            const bottomDistance = Math.abs(post.y - (this.shadeArea.y + this.shadeArea.height));
            
            const postMaxCantilever = Math.max(leftDistance, rightDistance, topDistance, bottomDistance);
            maxCantilever = Math.max(maxCantilever, postMaxCantilever);
        });
        
        // Convert pixels to feet (assuming 1 pixel = 0.1 feet for realistic scaling)
        return maxCantilever * 0.1;
    }
    
    getRequiredPostSize() {
        const cantileverSpan = this.calculateCantileverSpan();
        
        if (cantileverSpan <= this.cantileverLimits['4x4']) {
            return '4x4';
        } else if (cantileverSpan <= this.cantileverLimits['6x6']) {
            return '6x6';
        } else {
            return '8x8';
        }
    }
    
    isStructurallySafe() {
        const cantileverSpan = this.calculateCantileverSpan();
        return cantileverSpan <= this.cantileverLimits['8x8'];
    }
    
    calculateCoverageArea() {
        if (!this.shadeArea) return 0;
        
        // Convert pixels to feet
        const width = this.shadeArea.width * 0.1;
        const height = this.shadeArea.height * 0.1;
        
        return width * height;
    }
    
    calculateCosts() {
        const area = this.calculateCoverageArea();
        const postCount = this.posts.length;
        const postSize = this.getRequiredPostSize();
        const cantileverSpan = this.calculateCantileverSpan();
        
        let postCost;
        switch(postSize) {
            case '4x4': postCost = postCount * this.prices.steelPost4x4; break;
            case '6x6': postCost = postCount * this.prices.steelPost6x6; break;
            case '8x8': postCost = postCount * this.prices.steelPost8x8; break;
        }
        
        const coverRate = this.coverType === 'lattice' ? 
            this.prices.latticePerSqFt : this.prices.aluminumPerSqFt;
        const coverCost = area * coverRate;
        const hardwareCost = this.prices.hardwareBase + (postCount * 25);
        const installCost = area * this.prices.installationPerSqFt;
        
        // Add engineering fee for large cantilevers
        const engineeringCost = cantileverSpan > 10 ? this.prices.engineeringFee : 0;
        
        return {
            posts: postCost,
            cover: coverCost,
            hardware: hardwareCost,
            installation: installCost,
            engineering: engineeringCost,
            total: postCost + coverCost + hardwareCost + installCost + engineeringCost
        };
    }
    
    updateDisplay() {
        const costs = this.calculateCosts();
        const area = this.calculateCoverageArea();
        const cantileverSpan = this.calculateCantileverSpan();
        const postSize = this.getRequiredPostSize();
        const isSafe = this.isStructurallySafe();
        
        document.getElementById('postCost').textContent = `$${costs.posts.toFixed(2)}`;
        document.getElementById('coverCost').textContent = `$${costs.cover.toFixed(2)}`;
        document.getElementById('hardwareCost').textContent = `$${costs.hardware.toFixed(2)}`;
        document.getElementById('installCost').textContent = `$${costs.installation.toFixed(2)}`;
        document.getElementById('totalCost').textContent = `$${costs.total.toFixed(2)}`;
        
        document.getElementById('postCount').textContent = this.posts.length;
        document.getElementById('coverageArea').textContent = `${area.toFixed(1)} sq ft`;
        document.getElementById('cantileverSpan').textContent = `${cantileverSpan.toFixed(1)} ft`;
        document.getElementById('postSize').textContent = postSize;
        
        // Show/hide structural warning
        const warning = document.getElementById('structuralWarning');
        if (!isSafe && cantileverSpan > 0) {
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
        
        // Update cost breakdown with engineering if needed
        if (costs.engineering > 0) {
            let engineeringItem = document.getElementById('engineeringCost');
            if (!engineeringItem) {
                engineeringItem = document.createElement('div');
                engineeringItem.className = 'cost-item';
                engineeringItem.id = 'engineeringCost';
                engineeringItem.innerHTML = '<span>Engineering:</span><span>$0.00</span>';
                document.querySelector('.cost-total').before(engineeringItem);
            }
            engineeringItem.querySelector('span:last-child').textContent = `$${costs.engineering.toFixed(2)}`;
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        if (this.shadeArea) {
            this.drawShadeArea();
        }
        
        this.drawPosts();
        
        if (this.posts.length < 2) {
            this.drawInstructions();
        } else if (this.mode === 'shade' && !this.shadeArea) {
            this.drawShadeInstructions();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        const gridSize = 20;
        
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawShadeArea() {
        if (!this.shadeArea) return;
        
        // Draw shade area
        this.ctx.fillStyle = this.coverType === 'lattice' ? 
            'rgba(139, 195, 74, 0.3)' : 'rgba(96, 125, 139, 0.4)';
        this.ctx.fillRect(this.shadeArea.x, this.shadeArea.y, this.shadeArea.width, this.shadeArea.height);
        
        this.ctx.strokeStyle = this.coverType === 'lattice' ? 
            'rgba(139, 195, 74, 0.8)' : 'rgba(96, 125, 139, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.shadeArea.x, this.shadeArea.y, this.shadeArea.width, this.shadeArea.height);
        
        if (this.coverType === 'lattice') {
            this.drawLatticePattern();
        }
        
        // Draw cantilever lines from posts to shade area
        this.drawCantileverLines();
        
        // Draw angle indicator
        this.drawAngleIndicator();
    }
    
    drawLatticePattern() {
        this.ctx.strokeStyle = 'rgba(139, 195, 74, 0.6)';
        this.ctx.lineWidth = 1;
        
        const spacing = 15;
        
        for (let i = spacing; i < this.shadeArea.width; i += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.shadeArea.x + i, this.shadeArea.y);
            this.ctx.lineTo(this.shadeArea.x + i, this.shadeArea.y + this.shadeArea.height);
            this.ctx.stroke();
        }
        
        for (let i = spacing; i < this.shadeArea.height; i += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.shadeArea.x, this.shadeArea.y + i);
            this.ctx.lineTo(this.shadeArea.x + this.shadeArea.width, this.shadeArea.y + i);
            this.ctx.stroke();
        }
    }
    
    drawCantileverLines() {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        this.posts.forEach(post => {
            // Draw lines from post to shade area edges to show cantilever
            const shadeLeft = this.shadeArea.x;
            const shadeRight = this.shadeArea.x + this.shadeArea.width;
            const shadeTop = this.shadeArea.y;
            const shadeBottom = this.shadeArea.y + this.shadeArea.height;
            
            // Draw to closest edge
            let closestX = post.x;
            let closestY = post.y;
            
            if (post.x < shadeLeft) closestX = shadeLeft;
            else if (post.x > shadeRight) closestX = shadeRight;
            
            if (post.y < shadeTop) closestY = shadeTop;
            else if (post.y > shadeBottom) closestY = shadeBottom;
            
            this.ctx.beginPath();
            this.ctx.moveTo(post.x, post.y);
            this.ctx.lineTo(closestX, closestY);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }
    
    drawAngleIndicator() {
        const centerX = this.shadeArea.x + this.shadeArea.width / 2;
        const centerY = this.shadeArea.y;
        const angleLength = 30;
        const angleRadians = (this.angle * Math.PI) / 180;
        
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + angleLength * Math.sin(angleRadians), 
                       centerY - angleLength * Math.cos(angleRadians));
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15, -Math.PI/2, -Math.PI/2 + angleRadians, false);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.angle}°`, centerX + 25, centerY - 20);
    }
    
    drawPosts() {
        const postSize = this.getRequiredPostSize();
        
        this.posts.forEach((post, index) => {
            // Different colors based on post size
            let color = '#34495e';
            if (postSize === '6x6') color = '#8e44ad';
            else if (postSize === '8x8') color = '#e74c3c';
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(post.x - 8, post.y - 8, 16, 16);
            
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(post.x - 8, post.y - 8, 16, 16);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(index + 1, post.x, post.y + 4);
            
            this.ctx.fillStyle = color;
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`${postSize}`, post.x, post.y + 25);
        });
    }
    
    drawInstructions() {
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.7)';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click to place posts', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.fillText(`(${2 - this.posts.length} more needed)`, this.canvas.width / 2, this.canvas.height / 2 + 15);
    }
    
    drawShadeInstructions() {
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.7)';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Drag to create shade area', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    show3DView() {
        if (this.posts.length < 2 || !this.shadeArea) {
            alert('Please place posts and create a shade area first.');
            return;
        }
        
        document.getElementById('modal3d').style.display = 'flex';
        this.draw3D();
    }
    
    hide3DView() {
        document.getElementById('modal3d').style.display = 'none';
    }
    
    rotate3D(angle) {
        this.rotation3d += angle;
        this.draw3D();
    }
    
    set3DView(angle) {
        this.rotation3d = angle;
        this.draw3D();
    }
    
    draw3D() {
        if (!this.canvas3d || !this.ctx3d) return;
        
        this.ctx3d.clearRect(0, 0, this.canvas3d.width, this.canvas3d.height);
        
        const centerX = this.canvas3d.width / 2;
        const centerY = this.canvas3d.height / 2;
        const scale = 0.5;
        
        // Transform coordinates based on rotation
        const cos = Math.cos(this.rotation3d * Math.PI / 180);
        const sin = Math.sin(this.rotation3d * Math.PI / 180);
        
        // Draw ground plane
        this.ctx3d.fillStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx3d.fillRect(50, centerY + 50, 500, 100);
        
        // Draw posts in 3D
        this.posts.forEach((post, index) => {
            const postHeight = 100;
            const x3d = centerX + (post.x - 300) * scale * cos;
            const y3d = centerY + (post.y - 200) * scale * sin + 50;
            const z3d = postHeight;
            
            // Draw post
            this.ctx3d.fillStyle = '#34495e';
            this.ctx3d.fillRect(x3d - 4, y3d - z3d, 8, z3d);
            
            // Post number
            this.ctx3d.fillStyle = 'white';
            this.ctx3d.font = '12px Arial';
            this.ctx3d.textAlign = 'center';
            this.ctx3d.fillText(index + 1, x3d, y3d - z3d - 5);
        });
        
        // Draw shade cover in 3D
        if (this.shadeArea) {
            const shadeHeight = 90 - Math.sin(this.angle * Math.PI / 180) * 20;
            
            const corners = [
                { x: this.shadeArea.x, y: this.shadeArea.y },
                { x: this.shadeArea.x + this.shadeArea.width, y: this.shadeArea.y },
                { x: this.shadeArea.x + this.shadeArea.width, y: this.shadeArea.y + this.shadeArea.height },
                { x: this.shadeArea.x, y: this.shadeArea.y + this.shadeArea.height }
            ];
            
            const corners3d = corners.map(corner => ({
                x: centerX + (corner.x - 300) * scale * cos,
                y: centerY + (corner.y - 200) * scale * sin + 50 - shadeHeight,
                z: shadeHeight
            }));
            
            // Draw shade cover
            this.ctx3d.fillStyle = this.coverType === 'lattice' ? 
                'rgba(139, 195, 74, 0.6)' : 'rgba(96, 125, 139, 0.6)';
            
            this.ctx3d.beginPath();
            this.ctx3d.moveTo(corners3d[0].x, corners3d[0].y);
            corners3d.forEach(corner => this.ctx3d.lineTo(corner.x, corner.y));
            this.ctx3d.closePath();
            this.ctx3d.fill();
            
            this.ctx3d.strokeStyle = '#2c3e50';
            this.ctx3d.lineWidth = 2;
            this.ctx3d.stroke();
        }
        
        // Add labels
        this.ctx3d.fillStyle = '#2c3e50';
        this.ctx3d.font = '14px Arial';
        this.ctx3d.textAlign = 'left';
        this.ctx3d.fillText(`Post Size: ${this.getRequiredPostSize()}`, 10, 25);
        this.ctx3d.fillText(`Cantilever: ${this.calculateCantileverSpan().toFixed(1)} ft`, 10, 45);
        this.ctx3d.fillText(`Angle: ${this.angle}°`, 10, 65);
        
        if (!this.isStructurallySafe()) {
            this.ctx3d.fillStyle = '#e74c3c';
            this.ctx3d.fillText('⚠️ Requires Engineering Review', 10, 85);
        }
    }
    
    clearAll() {
        this.posts = [];
        this.shadeArea = null;
        this.setMode('post');
        this.updateDisplay();
        this.draw();
    }
    
    reset() {
        this.posts = [];
        this.shadeArea = null;
        this.coverType = 'lattice';
        this.angle = 15;
        this.setMode('post');
        
        document.querySelector('input[value="lattice"]').checked = true;
        document.getElementById('angleSlider').value = 15;
        document.getElementById('angleValue').textContent = '15°';
        
        this.updateDisplay();
        this.draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PatioCoverDesigner();
});