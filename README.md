# Booth Built Patio Cover Designer

An interactive web tool for designing custom patio covers with real-time pricing and 3D visualization.

## Features

### Core Functionality
- **Interactive Design Canvas**: Click to place posts, drag to create shade areas
- **Cantilever Engineering**: Smart post sizing based on span requirements
- **Real-time Cost Calculator**: Instant pricing updates for materials and installation
- **3D Visualization**: Immersive Three.js powered 3D preview

### Technical Features
- **Two Versions**: 
  - Vanilla JavaScript (lightweight)
  - React + Three.js (advanced)
- **Responsive Design**: Works on desktop and mobile
- **State Management**: Zustand for React version
- **Modern 3D Graphics**: React Three Fiber with realistic materials

## Quick Start

### Vanilla Version
```bash
# Open index.html in any web browser
open index.html
```

### React Version
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

### React Components
```
App.jsx                 # Main application
├── Header.jsx         # Title and description
├── DesignCanvas.jsx   # 2D design interface
├── Controls.jsx       # User input controls
├── CostPanel.jsx      # Cost breakdown display
├── Modal3D.jsx        # 3D visualization modal
└── PatioCover3D.jsx   # Three.js 3D scene
```

### State Management (Zustand)
```javascript
useStore.js            # Central state store
├── posts[]            # Post positions
├── shadeArea{}        # Shade coverage area
├── coverType          # Lattice or aluminum
├── angle              # Cover angle (0-45°)
└── computed values    # Costs, spans, safety
```

## Engineering Specifications

### Cantilever Limits
- **4x4 Posts**: Up to 8ft cantilever ($150 each)
- **6x6 Posts**: Up to 12ft cantilever ($250 each)  
- **8x8 Posts**: Up to 16ft cantilever ($380 each)

### Cost Structure
- **Lattice Cover**: $12/sq ft
- **Aluminum Sheet**: $18/sq ft
- **Hardware**: $75 base + $25/post
- **Installation**: $8/sq ft
- **Engineering Fee**: $500 (spans >10ft)

## Browser Support
- Modern browsers with Canvas 2D support
- WebGL support for 3D visualization
- ES6+ JavaScript features

## Development

### Adding Features
1. **New Controls**: Add to `Controls.jsx` and update store
2. **Cost Changes**: Modify pricing in `useStore.js`
3. **3D Elements**: Extend `PatioCover3D.jsx` with Three.js meshes
4. **Validation**: Add safety checks to store computed values

### Performance
- Canvas rendering optimized for 60fps
- Three.js scene uses efficient geometries
- Zustand provides minimal re-renders
- Lazy loading for 3D components

## Deployment
- **Static Hosting**: Deploy built files to any CDN
- **Vite Build**: Optimized production bundles
- **No Backend Required**: Fully client-side application