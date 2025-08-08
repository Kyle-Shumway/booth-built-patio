import React from 'react';
import { useStore } from '../store/useStore';

const Controls = () => {
  const {
    coverType,
    angle,
    setCoverType,
    setAngle,
    clearAll,
    reset,
    show3DView
  } = useStore();

  const handleCoverTypeChange = (event) => {
    setCoverType(event.target.value);
  };

  const handleAngleChange = (event) => {
    const newAngle = parseInt(event.target.value);
    setAngle(newAngle);
  };

  return (
    <div className="controls">
      <div className="control-group">
        <h3>Cover Type</h3>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="coverType"
              value="lattice"
              checked={coverType === 'lattice'}
              onChange={handleCoverTypeChange}
            />
            Lattice Cover
          </label>
          <label>
            <input
              type="radio"
              name="coverType"
              value="aluminum"
              checked={coverType === 'aluminum'}
              onChange={handleCoverTypeChange}
            />
            Aluminum Sheet
          </label>
        </div>
      </div>
      
      <div className="control-group">
        <h3>Cover Angle</h3>
        <div className="angle-control">
          <input
            type="range"
            min="0"
            max="45"
            value={angle}
            step="1"
            onChange={handleAngleChange}
            className="angle-slider"
          />
          <span className="angle-value">{angle}°</span>
        </div>
      </div>
      
      <div className="control-group">
        <h3>Actions</h3>
        <div className="button-group">
          <button onClick={clearAll} className="btn-secondary">
            Clear All Posts
          </button>
          <button onClick={reset} className="btn-secondary">
            Reset Design
          </button>
          <button onClick={show3DView} className="btn-primary view-3d-btn">
            Generate 3D View
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;