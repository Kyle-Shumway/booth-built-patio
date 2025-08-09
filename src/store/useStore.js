import { create } from 'zustand';

const CANTILEVER_LIMITS = {
  '4x4': 8,
  '6x6': 12,
  '8x8': 16
};

const PRICES = {
  steelPost4x4: 150,
  steelPost6x6: 250,
  steelPost8x8: 380,
  latticePerSqFt: 12,
  aluminumPerSqFt: 18,
  hardwareBase: 75,
  installationPerSqFt: 8,
  engineeringFee: 500
};

export const useStore = create((set, get) => ({
  // State
  posts: [],
  shadeArea: null,
  coverType: 'lattice',
  angle: 15,
  postExtension: 6, // inches - how much post extends above the frame
  mode: 'post', // 'post' or 'shade'
  show3D: false,
  rotation3D: 30,

  // Address and satellite overlay
  address: '',
  coordinates: null, // { lat, lng }
  satelliteImageUrl: null,

  // Constraints
  constraints: {
    enabled: false,
    minWidth: 8, // feet
    maxWidth: 30, // feet
    minHeight: 8, // feet
    maxHeight: 20, // feet
    minPostSpacing: 6, // feet
    maxPostSpacing: 20, // feet
    showGrid: true,
    snapToGrid: false,
    gridSize: 1 // feet
  },

  // Post constraints
  postConstraints: {
    enabled: false,
    exactDistance: 6, // feet
    parallelAlignment: false,
    alignmentAxis: 'horizontal', // 'horizontal' or 'vertical'
    precisionPlacement: false
  },

  // Actions
  addPost: (x, y) => {
    const { constraints, posts } = get();
    
    // Snap to grid if enabled
    if (constraints.enabled && constraints.snapToGrid) {
      const gridPixels = constraints.gridSize * 10;
      x = Math.round(x / gridPixels) * gridPixels;
      y = Math.round(y / gridPixels) * gridPixels;
    }

    // Check minimum post spacing constraint
    if (constraints.enabled && posts.length > 0) {
      const minSpacingPixels = constraints.minPostSpacing * 10;
      const tooClose = posts.some(post => {
        const distance = Math.sqrt(
          Math.pow(post.x - x, 2) + Math.pow(post.y - y, 2)
        );
        return distance < minSpacingPixels;
      });
      
      if (tooClose) {
        return; // Don't add post if too close to existing ones
      }
    }

    set((state) => {
      const newPosts = [...state.posts, { x, y, id: Date.now() }];
      return {
        posts: newPosts,
        mode: newPosts.length >= 2 ? 'shade' : 'post'
      };
    });
  },

  removePost: (id) => {
    set((state) => {
      const newPosts = state.posts.filter(post => post.id !== id);
      return {
        posts: newPosts,
        shadeArea: newPosts.length < 2 ? null : state.shadeArea,
        mode: newPosts.length < 2 ? 'post' : state.mode
      };
    });
  },

  // Post constraint methods
  setPostConstraints: (newConstraints) => set((state) => ({
    postConstraints: { ...state.postConstraints, ...newConstraints }
  })),

  togglePostConstraints: () => set((state) => ({
    postConstraints: { ...state.postConstraints, enabled: !state.postConstraints.enabled }
  })),

  movePost: (id, x, y) => {
    const { constraints, postConstraints } = get();
    
    // Snap to grid if enabled
    if (constraints.enabled && constraints.snapToGrid) {
      const gridPixels = constraints.gridSize * 10;
      x = Math.round(x / gridPixels) * gridPixels;
      y = Math.round(y / gridPixels) * gridPixels;
    }

    set((state) => ({
      posts: state.posts.map(post => 
        post.id === id ? { ...post, x, y } : post
      )
    }));

    // Apply post constraints after move
    if (postConstraints.enabled) {
      get().applyPostConstraints();
    }
  },

  applyPostConstraints: () => {
    const { posts, postConstraints } = get();
    if (!postConstraints.enabled || posts.length < 2) return;

    let constrainedPosts = [...posts];

    // Apply exact distance constraint
    if (postConstraints.exactDistance > 0) {
      const targetDistancePx = postConstraints.exactDistance * 10;
      
      // For each pair of posts, adjust to exact distance
      for (let i = 0; i < constrainedPosts.length - 1; i++) {
        const post1 = constrainedPosts[i];
        const post2 = constrainedPosts[i + 1];
        
        const currentDistance = Math.sqrt(
          Math.pow(post2.x - post1.x, 2) + Math.pow(post2.y - post1.y, 2)
        );
        
        if (Math.abs(currentDistance - targetDistancePx) > 1) {
          // Calculate direction vector
          const dx = post2.x - post1.x;
          const dy = post2.y - post1.y;
          const angle = Math.atan2(dy, dx);
          
          // Place post2 at exact distance from post1
          constrainedPosts[i + 1] = {
            ...post2,
            x: post1.x + targetDistancePx * Math.cos(angle),
            y: post1.y + targetDistancePx * Math.sin(angle)
          };
        }
      }
    }

    // Apply parallel alignment constraint
    if (postConstraints.parallelAlignment && constrainedPosts.length >= 2) {
      const firstPost = constrainedPosts[0];
      
      if (postConstraints.alignmentAxis === 'horizontal') {
        // Align all posts to same Y coordinate as first post
        constrainedPosts = constrainedPosts.map((post, index) => 
          index === 0 ? post : { ...post, y: firstPost.y }
        );
      } else {
        // Align all posts to same X coordinate as first post
        constrainedPosts = constrainedPosts.map((post, index) => 
          index === 0 ? post : { ...post, x: firstPost.x }
        );
      }
    }

    set({ posts: constrainedPosts });
  },

  getPostAt: (x, y, tolerance = 15) => {
    const { posts } = get();
    return posts.find(post => {
      const distance = Math.sqrt(
        Math.pow(post.x - x, 2) + Math.pow(post.y - y, 2)
      );
      return distance <= tolerance;
    });
  },

  setShadeArea: (area) => {
    const { constraints } = get();
    if (!constraints.enabled || !area) {
      set({ shadeArea: area });
      return;
    }

    // Convert pixels to feet for validation
    const widthFt = area.width * 0.1;
    const heightFt = area.height * 0.1;

    // Enforce constraints
    let constrainedArea = { ...area };
    
    if (widthFt > constraints.maxWidth) {
      constrainedArea.width = constraints.maxWidth * 10; // Convert back to pixels
    }
    if (widthFt < constraints.minWidth) {
      constrainedArea.width = constraints.minWidth * 10;
    }
    if (heightFt > constraints.maxHeight) {
      constrainedArea.height = constraints.maxHeight * 10;
    }
    if (heightFt < constraints.minHeight) {
      constrainedArea.height = constraints.minHeight * 10;
    }

    // Snap to grid if enabled
    if (constraints.snapToGrid) {
      const gridPixels = constraints.gridSize * 10;
      constrainedArea.x = Math.round(constrainedArea.x / gridPixels) * gridPixels;
      constrainedArea.y = Math.round(constrainedArea.y / gridPixels) * gridPixels;
      constrainedArea.width = Math.round(constrainedArea.width / gridPixels) * gridPixels;
      constrainedArea.height = Math.round(constrainedArea.height / gridPixels) * gridPixels;
    }

    set({ shadeArea: constrainedArea });
  },

  setConstraints: (newConstraints) => set((state) => ({
    constraints: { ...state.constraints, ...newConstraints }
  })),

  toggleConstraints: () => set((state) => ({
    constraints: { ...state.constraints, enabled: !state.constraints.enabled }
  })),

  setCoverType: (type) => set({ coverType: type }),

  setAngle: (angle) => set({ angle }),

  setPostExtension: (extension) => set({ postExtension: extension }),

  // Address and satellite actions
  setAddress: (address) => set({ address }),
  setCoordinates: (coordinates) => set({ coordinates }),
  setSatelliteImageUrl: (url) => set({ satelliteImageUrl: url }),

  // Geocode address and fetch satellite image using free services
  geocodeAddress: async (address) => {
    const state = get();
    set({ address });

    try {
      // Use Nominatim (OpenStreetMap) for free geocoding
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'BoothBuiltPatioDesigner/1.0'
        }
      });
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        throw new Error('Address not found');
      }

      const coordinates = {
        lat: parseFloat(geocodeData[0].lat),
        lng: parseFloat(geocodeData[0].lon)
      };
      set({ coordinates });

      // Generate satellite tile URL using Esri World Imagery (free)
      const zoom = 18; // Good zoom for property level
      const tileX = Math.floor(((coordinates.lng + 180) / 360) * Math.pow(2, zoom));
      const tileY = Math.floor((1 - Math.log(Math.tan((coordinates.lat * Math.PI) / 180) + 1 / Math.cos((coordinates.lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
      
      // Use multiple tiles for better coverage
      const tileUrls = [];
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          tileUrls.push(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY + y}/${tileX + x}`);
        }
      }
      
      // Use the center tile for now
      const satelliteUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;
      set({ satelliteImageUrl: satelliteUrl });

    } catch (error) {
      console.error('Error geocoding address:', error);
      set({ coordinates: null, satelliteImageUrl: null });
    }
  },

  setMode: (mode) => set({ mode }),

  toggleMode: () => set((state) => ({ 
    mode: state.mode === 'post' ? 'shade' : 'post' 
  })),

  show3DView: () => set({ show3D: true }),
  hide3DView: () => set({ show3D: false }),

  setRotation3D: (rotation) => set({ rotation3D: rotation }),
  rotate3D: (delta) => set((state) => ({ rotation3D: state.rotation3D + delta })),

  clearAll: () => set({
    posts: [],
    shadeArea: null,
    mode: 'post'
  }),

  reset: () => set({
    posts: [],
    shadeArea: null,
    coverType: 'lattice',
    angle: 15,
    mode: 'post',
    show3D: false,
    rotation3D: 30
  }),

  // Apply constraints to all posts
  constrainAllPosts: () => {
    const { posts, postConstraints } = get();
    if (!postConstraints.enabled || posts.length < 2) return;

    // Sort posts by x-coordinate for consistent ordering
    const sortedPosts = [...posts].sort((a, b) => a.x - b.x);
    
    if (postConstraints.exactDistance > 0) {
      const spacing = postConstraints.exactDistance * 10; // Convert to pixels
      const startX = sortedPosts[0].x;
      const y = postConstraints.parallelAlignment 
        ? sortedPosts[0].y 
        : sortedPosts[0].y;

      const constrainedPosts = sortedPosts.map((post, index) => ({
        ...post,
        x: startX + (index * spacing),
        y: postConstraints.parallelAlignment && postConstraints.alignmentAxis === 'horizontal' 
          ? sortedPosts[0].y 
          : post.y
      }));

      set({ posts: constrainedPosts });
    }
  },

  // Constraint validation methods
  getConstraintViolations: () => {
    const { constraints, shadeArea, posts } = get();
    if (!constraints.enabled || !shadeArea) return [];

    const violations = [];
    const widthFt = shadeArea.width * 0.1;
    const heightFt = shadeArea.height * 0.1;

    if (widthFt > constraints.maxWidth) {
      violations.push(`Width ${widthFt.toFixed(1)}ft exceeds maximum ${constraints.maxWidth}ft`);
    }
    if (widthFt < constraints.minWidth) {
      violations.push(`Width ${widthFt.toFixed(1)}ft below minimum ${constraints.minWidth}ft`);
    }
    if (heightFt > constraints.maxHeight) {
      violations.push(`Height ${heightFt.toFixed(1)}ft exceeds maximum ${constraints.maxHeight}ft`);
    }
    if (heightFt < constraints.minHeight) {
      violations.push(`Height ${heightFt.toFixed(1)}ft below minimum ${constraints.minHeight}ft`);
    }

    // Check post spacing
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const distance = Math.sqrt(
          Math.pow(posts[i].x - posts[j].x, 2) + 
          Math.pow(posts[i].y - posts[j].y, 2)
        ) * 0.1; // Convert to feet
        
        if (distance < constraints.minPostSpacing) {
          violations.push(`Posts ${i + 1} and ${j + 1} are ${distance.toFixed(1)}ft apart (min: ${constraints.minPostSpacing}ft)`);
        }
        if (distance > constraints.maxPostSpacing) {
          violations.push(`Posts ${i + 1} and ${j + 1} are ${distance.toFixed(1)}ft apart (max: ${constraints.maxPostSpacing}ft)`);
        }
      }
    }

    return violations;
  },

  // Computed values
  getCantileverSpan: () => {
    const { posts, shadeArea } = get();
    if (!shadeArea || posts.length < 2) return 0;

    let maxCantilever = 0;
    posts.forEach(post => {
      const leftDistance = Math.abs(post.x - shadeArea.x);
      const rightDistance = Math.abs(post.x - (shadeArea.x + shadeArea.width));
      const topDistance = Math.abs(post.y - shadeArea.y);
      const bottomDistance = Math.abs(post.y - (shadeArea.y + shadeArea.height));
      
      const postMaxCantilever = Math.max(leftDistance, rightDistance, topDistance, bottomDistance);
      maxCantilever = Math.max(maxCantilever, postMaxCantilever);
    });

    return maxCantilever * 0.1; // Convert pixels to feet
  },

  getRequiredPostSize: () => {
    const cantileverSpan = get().getCantileverSpan();
    
    if (cantileverSpan <= CANTILEVER_LIMITS['4x4']) return '4x4';
    else if (cantileverSpan <= CANTILEVER_LIMITS['6x6']) return '6x6';
    else return '8x8';
  },

  isStructurallySafe: () => {
    const cantileverSpan = get().getCantileverSpan();
    return cantileverSpan <= CANTILEVER_LIMITS['8x8'];
  },

  getCoverageArea: () => {
    const { shadeArea } = get();
    if (!shadeArea) return 0;
    
    const width = shadeArea.width * 0.1;
    const height = shadeArea.height * 0.1;
    return width * height;
  },

  getCosts: () => {
    const state = get();
    const area = state.getCoverageArea();
    const postCount = state.posts.length;
    const postSize = state.getRequiredPostSize();
    const cantileverSpan = state.getCantileverSpan();

    let postCost;
    switch(postSize) {
      case '4x4': postCost = postCount * PRICES.steelPost4x4; break;
      case '6x6': postCost = postCount * PRICES.steelPost6x6; break;
      case '8x8': postCost = postCount * PRICES.steelPost8x8; break;
      default: postCost = 0;
    }

    const coverRate = state.coverType === 'lattice' ? 
      PRICES.latticePerSqFt : PRICES.aluminumPerSqFt;
    const coverCost = area * coverRate;
    const hardwareCost = PRICES.hardwareBase + (postCount * 25);
    const installCost = area * PRICES.installationPerSqFt;
    const engineeringCost = cantileverSpan > 10 ? PRICES.engineeringFee : 0;

    // Add constraint penalty if violations exist
    const violations = state.getConstraintViolations();
    const constraintPenalty = violations.length > 0 ? 200 : 0;
    
    // Add precision placement fee
    const precisionFee = state.postConstraints.enabled ? 150 : 0;

    return {
      posts: postCost,
      cover: coverCost,
      hardware: hardwareCost,
      installation: installCost,
      engineering: engineeringCost,
      constraintPenalty,
      precision: precisionFee,
      total: postCost + coverCost + hardwareCost + installCost + engineeringCost + constraintPenalty + precisionFee
    };
  }
}));