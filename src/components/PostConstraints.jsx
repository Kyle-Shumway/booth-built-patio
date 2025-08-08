import React from 'react';
import { useStore } from '../store/useStore';

const PostConstraints = () => {
  const {
    posts,
    postConstraints,
    setPostConstraints,
    togglePostConstraints,
    constrainAllPosts,
    applyPostConstraints
  } = useStore();

  const handleConstraintChange = (field, value) => {
    const numValue = field.includes('enabled') || field.includes('parallel') || field.includes('precision') 
      ? value 
      : parseFloat(value);
    
    setPostConstraints({ [field]: numValue });
    
    // Auto-apply constraints when changed
    if (postConstraints.enabled && posts.length >= 2) {
      setTimeout(() => applyPostConstraints(), 100);
    }
  };

  const handleToggle = () => {
    togglePostConstraints();
    
    // Apply constraints when enabled
    if (!postConstraints.enabled && posts.length >= 2) {
      setTimeout(() => applyPostConstraints(), 100);
    }
  };

  const handleApplyConstraints = () => {
    constrainAllPosts();
  };

  const getPostSpacings = () => {
    if (posts.length < 2) return [];
    
    const spacings = [];
    for (let i = 0; i < posts.length - 1; i++) {
      const distance = Math.sqrt(
        Math.pow(posts[i + 1].x - posts[i].x, 2) + 
        Math.pow(posts[i + 1].y - posts[i].y, 2)
      ) * 0.1; // Convert to feet
      spacings.push(distance);
    }
    return spacings;
  };

  const spacings = getPostSpacings();

  return (
    <div className="post-constraints-panel">
      <div className="constraint-header">
        <h3>Post Positioning</h3>
        <label className="constraint-toggle">
          <input
            type="checkbox"
            checked={postConstraints.enabled}
            onChange={handleToggle}
          />
          <span className="toggle-label">Enable Precision</span>
        </label>
      </div>

      {postConstraints.enabled && (
        <div className="constraint-controls">
          <div className="constraint-section">
            <h4>Distance Control</h4>
            <div className="constraint-group">
              <div className="constraint-field">
                <label>Exact Distance (ft)</label>
                <input
                  type="number"
                  min="4"
                  max="30"
                  step="0.5"
                  value={postConstraints.exactDistance}
                  onChange={(e) => handleConstraintChange('exactDistance', e.target.value)}
                />
              </div>
              <div className="constraint-actions">
                <button 
                  onClick={handleApplyConstraints}
                  className="btn-primary apply-btn"
                  disabled={posts.length < 2}
                >
                  Apply Spacing
                </button>
              </div>
            </div>
          </div>

          <div className="constraint-section">
            <h4>Alignment</h4>
            <div className="constraint-checkboxes">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={postConstraints.parallelAlignment}
                  onChange={(e) => handleConstraintChange('parallelAlignment', e.target.checked)}
                />
                Parallel Alignment
              </label>
            </div>
            
            {postConstraints.parallelAlignment && (
              <div className="alignment-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="alignmentAxis"
                    value="horizontal"
                    checked={postConstraints.alignmentAxis === 'horizontal'}
                    onChange={(e) => handleConstraintChange('alignmentAxis', e.target.value)}
                  />
                  Horizontal Row
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="alignmentAxis"
                    value="vertical"
                    checked={postConstraints.alignmentAxis === 'vertical'}
                    onChange={(e) => handleConstraintChange('alignmentAxis', e.target.value)}
                  />
                  Vertical Column
                </label>
              </div>
            )}
          </div>

          {posts.length >= 2 && (
            <div className="constraint-section">
              <h4>Current Measurements</h4>
              <div className="measurements">
                {spacings.map((spacing, index) => (
                  <div key={index} className="measurement-item">
                    <span>Posts {index + 1}-{index + 2}:</span>
                    <span className={Math.abs(spacing - postConstraints.exactDistance) > 0.1 ? 'measurement-off' : 'measurement-good'}>
                      {spacing.toFixed(1)} ft
                    </span>
                  </div>
                ))}
                
                {postConstraints.exactDistance > 0 && (
                  <div className="measurement-target">
                    Target: {postConstraints.exactDistance} ft
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="constraint-info">
            <div className="info-note">
              💡 <strong>Tips:</strong>
            </div>
            <ul className="tip-list">
              <li>Click posts to remove them</li>
              <li>Drag posts to reposition</li>
              <li>Constraints auto-apply when enabled</li>
              <li>Precision placement adds $150 fee</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostConstraints;