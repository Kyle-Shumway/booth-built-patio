import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const DesignCanvas = () => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [draggedPost, setDraggedPost] = useState(null);
  const [hoveredPost, setHoveredPost] = useState(null);
  
  const {
    posts,
    shadeArea,
    coverType,
    angle,
    mode,
    constraints,
    postConstraints,
    satelliteImageUrl,
    addPost,
    removePost,
    movePost,
    setShadeArea,
    setMode,
    getCantileverSpan,
    getRequiredPostSize,
    getConstraintViolations,
    getPostAt
  } = useStore();

  const violations = getConstraintViolations();

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid(ctx);
    
    if (constraints.enabled) {
      drawConstraintBounds(ctx);
    }
    
    if (shadeArea) {
      drawShadeArea(ctx);
    }
    
    drawPosts(ctx);
    
    if (postConstraints.enabled) {
      drawPostConstraints(ctx);
    }
    
    if (posts.length < 2) {
      drawInstructions(ctx);
    } else if (mode === 'shade' && !shadeArea) {
      drawShadeInstructions(ctx);
    }
  };

  const drawGrid = (ctx) => {
    const canvas = canvasRef.current;
    
    // Standard grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const baseGridSize = 20;
    
    for (let x = 0; x <= canvas.width; x += baseGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += baseGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Constraint grid overlay
    if (constraints.enabled && constraints.showGrid) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      
      const constraintGridSize = constraints.gridSize * 10; // Convert feet to pixels
      
      for (let x = 0; x <= canvas.width; x += constraintGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += constraintGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
    }
  };

  const drawConstraintBounds = (ctx) => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Convert feet to pixels
    const minWidthPx = constraints.minWidth * 10;
    const maxWidthPx = constraints.maxWidth * 10;
    const minHeightPx = constraints.minHeight * 10;
    const maxHeightPx = constraints.maxHeight * 10;
    
    // Draw constraint boundaries
    ctx.strokeStyle = violations.length > 0 ? '#e74c3c' : '#f39c12';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    // Maximum bounds
    const maxRect = {
      x: centerX - maxWidthPx / 2,
      y: centerY - maxHeightPx / 2,
      width: maxWidthPx,
      height: maxHeightPx
    };
    ctx.strokeRect(maxRect.x, maxRect.y, maxRect.width, maxRect.height);
    
    // Minimum bounds
    ctx.strokeStyle = violations.length > 0 ? '#e74c3c' : '#27ae60';
    const minRect = {
      x: centerX - minWidthPx / 2,
      y: centerY - minHeightPx / 2,
      width: minWidthPx,
      height: minHeightPx
    };
    ctx.strokeRect(minRect.x, minRect.y, minRect.width, minRect.height);
    
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = violations.length > 0 ? '#e74c3c' : '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Max bounds label
    ctx.fillText(
      `Max: ${constraints.maxWidth} × ${constraints.maxHeight} ft`, 
      centerX, 
      maxRect.y - 10
    );
    
    // Min bounds label
    ctx.fillText(
      `Min: ${constraints.minWidth} × ${constraints.minHeight} ft`, 
      centerX, 
      minRect.y + minRect.height + 20
    );
  };

  const drawShadeArea = (ctx) => {
    if (!shadeArea) return;
    
    // Draw shade area
    ctx.fillStyle = coverType === 'lattice' ? 
      'rgba(139, 195, 74, 0.3)' : 'rgba(96, 125, 139, 0.4)';
    ctx.fillRect(shadeArea.x, shadeArea.y, shadeArea.width, shadeArea.height);
    
    ctx.strokeStyle = coverType === 'lattice' ? 
      'rgba(139, 195, 74, 0.8)' : 'rgba(96, 125, 139, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(shadeArea.x, shadeArea.y, shadeArea.width, shadeArea.height);
    
    if (coverType === 'lattice') {
      drawLatticePattern(ctx);
    }
    
    drawCantileverLines(ctx);
    drawAngleIndicator(ctx);
  };

  const drawLatticePattern = (ctx) => {
    ctx.strokeStyle = 'rgba(139, 195, 74, 0.6)';
    ctx.lineWidth = 1;
    
    const spacing = 15;
    
    for (let i = spacing; i < shadeArea.width; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(shadeArea.x + i, shadeArea.y);
      ctx.lineTo(shadeArea.x + i, shadeArea.y + shadeArea.height);
      ctx.stroke();
    }
    
    for (let i = spacing; i < shadeArea.height; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(shadeArea.x, shadeArea.y + i);
      ctx.lineTo(shadeArea.x + shadeArea.width, shadeArea.y + i);
      ctx.stroke();
    }
  };

  const drawCantileverLines = (ctx) => {
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    posts.forEach(post => {
      const shadeLeft = shadeArea.x;
      const shadeRight = shadeArea.x + shadeArea.width;
      const shadeTop = shadeArea.y;
      const shadeBottom = shadeArea.y + shadeArea.height;
      
      let closestX = post.x;
      let closestY = post.y;
      
      if (post.x < shadeLeft) closestX = shadeLeft;
      else if (post.x > shadeRight) closestX = shadeRight;
      
      if (post.y < shadeTop) closestY = shadeTop;
      else if (post.y > shadeBottom) closestY = shadeBottom;
      
      ctx.beginPath();
      ctx.moveTo(post.x, post.y);
      ctx.lineTo(closestX, closestY);
      ctx.stroke();
    });
    
    ctx.setLineDash([]);
  };

  const drawAngleIndicator = (ctx) => {
    const centerX = shadeArea.x + shadeArea.width / 2;
    const centerY = shadeArea.y;
    const angleLength = 30;
    const angleRadians = (angle * Math.PI) / 180;
    
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + angleLength * Math.sin(angleRadians), 
               centerY - angleLength * Math.cos(angleRadians));
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, -Math.PI/2, -Math.PI/2 + angleRadians, false);
    ctx.stroke();
    
    ctx.fillStyle = '#e74c3c';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${angle}°`, centerX + 25, centerY - 20);
  };

  const drawPosts = (ctx) => {
    const postSize = getRequiredPostSize();
    
    posts.forEach((post, index) => {
      let color = '#34495e';
      if (postSize === '6x6') color = '#8e44ad';
      else if (postSize === '8x8') color = '#e74c3c';
      
      // Highlight hovered post
      if (hoveredPost && hoveredPost.id === post.id) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.strokeRect(post.x - 10, post.y - 10, 20, 20);
      }
      
      // Highlight if being dragged
      if (draggedPost && draggedPost.id === post.id) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.fillRect(post.x - 12, post.y - 12, 24, 24);
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(post.x - 8, post.y - 8, 16, 16);
      
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.strokeRect(post.x - 8, post.y - 8, 16, 16);
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(index + 1, post.x, post.y + 4);
      
      ctx.fillStyle = color;
      ctx.font = '10px Arial';
      ctx.fillText(postSize, post.x, post.y + 25);
      
      // Show remove indicator when hovered
      if (hoveredPost && hoveredPost.id === post.id) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('×', post.x + 12, post.y - 8);
      }
    });
  };

  const drawPostConstraints = (ctx) => {
    if (posts.length < 2) return;
    
    // Draw distance lines between posts
    for (let i = 0; i < posts.length - 1; i++) {
      const post1 = posts[i];
      const post2 = posts[i + 1];
      
      const distance = Math.sqrt(
        Math.pow(post2.x - post1.x, 2) + Math.pow(post2.y - post1.y, 2)
      ) * 0.1; // Convert to feet
      
      const isCorrectDistance = Math.abs(distance - postConstraints.exactDistance) <= 0.1;
      
      // Draw connection line
      ctx.strokeStyle = isCorrectDistance ? '#27ae60' : '#e74c3c';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(post1.x, post1.y);
      ctx.lineTo(post2.x, post2.y);
      ctx.stroke();
      
      // Draw distance label
      const midX = (post1.x + post2.x) / 2;
      const midY = (post1.y + post2.y) / 2;
      
      ctx.fillStyle = isCorrectDistance ? '#27ae60' : '#e74c3c';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillRect(midX - 25, midY - 8, 50, 16);
      ctx.fillStyle = 'white';
      ctx.fillText(`${distance.toFixed(1)}ft`, midX, midY + 4);
    }
    
    ctx.setLineDash([]);
    
    // Draw alignment guides
    if (postConstraints.parallelAlignment && posts.length >= 2) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      if (postConstraints.alignmentAxis === 'horizontal') {
        const y = posts[0].y;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasRef.current.width, y);
        ctx.stroke();
      } else {
        const x = posts[0].x;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasRef.current.height);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
  };

  const drawInstructions = (ctx) => {
    const canvas = canvasRef.current;
    ctx.fillStyle = 'rgba(52, 73, 94, 0.7)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click to place posts', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`(${2 - posts.length} more needed)`, canvas.width / 2, canvas.height / 2 + 15);
  };

  const drawShadeInstructions = (ctx) => {
    const canvas = canvasRef.current;
    ctx.fillStyle = 'rgba(52, 73, 94, 0.7)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Drag to create shade area', canvas.width / 2, canvas.height / 2);
  };

  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    // Check if clicking on a post
    const clickedPost = getPostAt(x, y);
    
    if (clickedPost) {
      if (event.shiftKey || event.ctrlKey) {
        // Remove post when holding Shift or Ctrl
        removePost(clickedPost.id);
        return;
      } else {
        // Start dragging post
        setDraggedPost(clickedPost);
        setIsDragging(true);
        setDragStart({ x: x - clickedPost.x, y: y - clickedPost.y });
        return;
      }
    }
    
    // Snap to grid if constraints enabled
    if (constraints.enabled && constraints.snapToGrid) {
      const gridPixels = constraints.gridSize * 10;
      x = Math.round(x / gridPixels) * gridPixels;
      y = Math.round(y / gridPixels) * gridPixels;
    }
    
    if (mode === 'post') {
      addPost(x, y);
    } else if (mode === 'shade' && posts.length >= 2) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    // Update hover state
    const hoveredPostAtMouse = getPostAt(x, y);
    setHoveredPost(hoveredPostAtMouse);
    
    if (!isDragging) return;
    
    // Handle post dragging
    if (draggedPost) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      movePost(draggedPost.id, newX, newY);
      return;
    }
    
    // Handle shade area dragging
    if (mode === 'shade') {
      // Snap to grid if constraints enabled
      if (constraints.enabled && constraints.snapToGrid) {
        const gridPixels = constraints.gridSize * 10;
        x = Math.round(x / gridPixels) * gridPixels;
        y = Math.round(y / gridPixels) * gridPixels;
      }
      
      let proposedArea = {
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width: Math.abs(x - dragStart.x),
        height: Math.abs(y - dragStart.y)
      };
      
      setShadeArea(proposedArea);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPost(null);
    setDragStart(null);
  };

  useEffect(() => {
    draw();
  }, [posts, shadeArea, coverType, angle, mode, constraints, postConstraints, violations, hoveredPost, draggedPost]);

  const getCanvasClasses = () => {
    let classes = 'design-canvas';
    if (mode === 'shade' && !draggedPost) classes += ' drag-mode';
    if (isDragging && draggedPost) classes += ' dragging-post';
    else if (isDragging) classes += ' dragging';
    if (constraints.enabled && violations.length > 0) classes += ' constraint-violation';
    if (hoveredPost) classes += ' post-hover';
    return classes;
  };

  const getInstructions = () => {
    if (mode === 'post') {
      return 'Click to place posts • Shift+Click to remove • Drag to move';
    } else {
      return posts.length < 2 ? 'Place at least 2 posts first' : 'Drag to create shade area';
    }
  };

  const getModeButtons = () => (
    <div className="mode-toggle">
      <button 
        className={`mode-btn ${mode === 'post' ? 'active' : ''}`}
        onClick={() => setMode('post')}
      >
        Post Mode
      </button>
      <button 
        className={`mode-btn ${mode === 'shade' ? 'active' : ''}`}
        onClick={() => setMode('shade')}
      >
        Shade Mode
      </button>
    </div>
  );

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className={getCanvasClasses()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div className="canvas-instructions">
        <div className="mode-instructions">{getInstructions()}</div>
        {getModeButtons()}
      </div>
    </div>
  );
};

export default DesignCanvas;