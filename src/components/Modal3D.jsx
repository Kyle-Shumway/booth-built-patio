import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { useStore } from '../store/useStore';
import PatioCover3D from './PatioCover3D';

const Modal3D = () => {
  const {
    posts,
    shadeArea,
    hide3DView,
    rotation3D,
    rotate3D,
    setRotation3D,
    getCantileverSpan,
    getRequiredPostSize,
    isStructurallySafe,
    angle
  } = useStore();

  const cantileverSpan = getCantileverSpan();
  const postSize = getRequiredPostSize();
  const isSafe = isStructurallySafe();

  if (posts.length < 2 || !shadeArea) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>3D Preview - Patio Cover Structure</h2>
            <button onClick={hide3DView} className="close-btn">&times;</button>
          </div>
          <div className="modal-body">
            <p>Please place posts and create a shade area first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && hide3DView()}>
      <div className="modal-content modal-3d">
        <div className="modal-header">
          <h2>3D Preview - Patio Cover Structure</h2>
          <button onClick={hide3DView} className="close-btn">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="canvas-3d-container">
            <Canvas
              camera={{ position: [10, 10, 10], fov: 50 }}
              style={{ background: '#f0f8ff' }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <PatioCover3D />
                <Grid 
                  args={[20, 20]} 
                  position={[0, 0, 0]} 
                  cellColor="#666666" 
                  sectionColor="#333333" 
                />
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              </Suspense>
            </Canvas>
          </div>
          
          <div className="view-controls">
            <button onClick={() => rotate3D(-15)} className="btn-secondary">
              ↻ Rotate Left
            </button>
            <button onClick={() => rotate3D(15)} className="btn-secondary">
              Rotate Right ↺
            </button>
            <button onClick={() => setRotation3D(0)} className="btn-secondary">
              Top View
            </button>
            <button onClick={() => setRotation3D(90)} className="btn-secondary">
              Side View
            </button>
          </div>
          
          <div className="view-info">
            <div className="info-item">
              <strong>Post Size:</strong> {postSize}
            </div>
            <div className="info-item">
              <strong>Cantilever:</strong> {cantileverSpan.toFixed(1)} ft
            </div>
            <div className="info-item">
              <strong>Angle:</strong> {angle}°
            </div>
            {!isSafe && (
              <div className="info-item warning">
                ⚠️ Requires Engineering Review
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal3D;