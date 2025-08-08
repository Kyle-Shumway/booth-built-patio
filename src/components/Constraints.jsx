import React from 'react';
import { useStore } from '../store/useStore';

const Constraints = () => {
  const {
    constraints,
    setConstraints,
    toggleConstraints,
    getConstraintViolations
  } = useStore();

  const violations = getConstraintViolations();

  const handleConstraintChange = (field, value) => {
    const numValue = field.includes('enabled') || field.includes('show') || field.includes('snap') 
      ? value 
      : parseFloat(value);
    
    setConstraints({ [field]: numValue });
  };

  const handleToggle = () => {
    toggleConstraints();
  };

  return (
    <div className="constraints-panel">
      <div className="constraint-header">
        <h3>Design Constraints</h3>
        <label className="constraint-toggle">
          <input
            type="checkbox"
            checked={constraints.enabled}
            onChange={handleToggle}
          />
          <span className="toggle-label">Enable Constraints</span>
        </label>
      </div>

      {constraints.enabled && (
        <div className="constraint-controls">
          <div className="constraint-section">
            <h4>Shade Area Limits</h4>
            <div className="constraint-group">
              <div className="constraint-field">
                <label>Min Width (ft)</label>
                <input
                  type="number"
                  min="4"
                  max="50"
                  step="0.5"
                  value={constraints.minWidth}
                  onChange={(e) => handleConstraintChange('minWidth', e.target.value)}
                />
              </div>
              <div className="constraint-field">
                <label>Max Width (ft)</label>
                <input
                  type="number"
                  min="8"
                  max="60"
                  step="0.5"
                  value={constraints.maxWidth}
                  onChange={(e) => handleConstraintChange('maxWidth', e.target.value)}
                />
              </div>
            </div>
            
            <div className="constraint-group">
              <div className="constraint-field">
                <label>Min Height (ft)</label>
                <input
                  type="number"
                  min="4"
                  max="50"
                  step="0.5"
                  value={constraints.minHeight}
                  onChange={(e) => handleConstraintChange('minHeight', e.target.value)}
                />
              </div>
              <div className="constraint-field">
                <label>Max Height (ft)</label>
                <input
                  type="number"
                  min="8"
                  max="40"
                  step="0.5"
                  value={constraints.maxHeight}
                  onChange={(e) => handleConstraintChange('maxHeight', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="constraint-section">
            <h4>Post Spacing</h4>
            <div className="constraint-group">
              <div className="constraint-field">
                <label>Min Spacing (ft)</label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  step="0.5"
                  value={constraints.minPostSpacing}
                  onChange={(e) => handleConstraintChange('minPostSpacing', e.target.value)}
                />
              </div>
              <div className="constraint-field">
                <label>Max Spacing (ft)</label>
                <input
                  type="number"
                  min="10"
                  max="30"
                  step="0.5"
                  value={constraints.maxPostSpacing}
                  onChange={(e) => handleConstraintChange('maxPostSpacing', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="constraint-section">
            <h4>Grid Settings</h4>
            <div className="constraint-group">
              <div className="constraint-field">
                <label>Grid Size (ft)</label>
                <input
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={constraints.gridSize}
                  onChange={(e) => handleConstraintChange('gridSize', e.target.value)}
                />
              </div>
            </div>
            
            <div className="constraint-checkboxes">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={constraints.showGrid}
                  onChange={(e) => handleConstraintChange('showGrid', e.target.checked)}
                />
                Show Grid
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={constraints.snapToGrid}
                  onChange={(e) => handleConstraintChange('snapToGrid', e.target.checked)}
                />
                Snap to Grid
              </label>
            </div>
          </div>

          {violations.length > 0 && (
            <div className="constraint-violations">
              <h4>⚠️ Constraint Violations</h4>
              <ul>
                {violations.map((violation, index) => (
                  <li key={index}>{violation}</li>
                ))}
              </ul>
              <div className="violation-note">
                * $200 design revision fee applies for constraint violations
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Constraints;