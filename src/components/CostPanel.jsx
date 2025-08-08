import React from 'react';
import { useStore } from '../store/useStore';

const CostPanel = () => {
  const {
    posts,
    angle,
    constraints,
    shadeArea,
    getCosts,
    getCoverageArea,
    getCantileverSpan,
    getRequiredPostSize,
    isStructurallySafe,
    getConstraintViolations
  } = useStore();

  const costs = getCosts();
  const violations = getConstraintViolations();
  const area = getCoverageArea();
  const cantileverSpan = getCantileverSpan();
  const postSize = getRequiredPostSize();
  const isSafe = isStructurallySafe();

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  return (
    <div className="cost-panel">
      <h3>Cost Breakdown</h3>
      
      <div className="cost-details">
        <div className="cost-item">
          <span>Steel Posts:</span>
          <span>{formatCurrency(costs.posts)}</span>
        </div>
        <div className="cost-item">
          <span>Cover Material:</span>
          <span>{formatCurrency(costs.cover)}</span>
        </div>
        <div className="cost-item">
          <span>Hardware:</span>
          <span>{formatCurrency(costs.hardware)}</span>
        </div>
        <div className="cost-item">
          <span>Installation:</span>
          <span>{formatCurrency(costs.installation)}</span>
        </div>
        {costs.engineering > 0 && (
          <div className="cost-item">
            <span>Engineering:</span>
            <span>{formatCurrency(costs.engineering)}</span>
          </div>
        )}
        {costs.constraintPenalty > 0 && (
          <div className="cost-item cost-penalty">
            <span>Design Revision:</span>
            <span>{formatCurrency(costs.constraintPenalty)}</span>
          </div>
        )}
        {costs.precision > 0 && (
          <div className="cost-item cost-precision">
            <span>Precision Placement:</span>
            <span>{formatCurrency(costs.precision)}</span>
          </div>
        )}
        <div className="cost-total">
          <strong>
            <span>Total:</span>
            <span>{formatCurrency(costs.total)}</span>
          </strong>
        </div>
      </div>
      
      <div className="specifications">
        <h4>Specifications</h4>
        <div className="spec-item">
          <span>Posts:</span>
          <span>{posts.length}</span>
        </div>
        <div className="spec-item">
          <span>Coverage Area:</span>
          <span>{area.toFixed(1)} sq ft</span>
        </div>
        <div className="spec-item">
          <span>Cover Angle:</span>
          <span>{angle}°</span>
        </div>
        <div className="spec-item">
          <span>Cantilever:</span>
          <span>{cantileverSpan.toFixed(1)} ft</span>
        </div>
        <div className="spec-item">
          <span>Post Size:</span>
          <span>{postSize}</span>
        </div>
        
        {constraints.enabled && shadeArea && (
          <>
            <div className="spec-item">
              <span>Width:</span>
              <span>{(shadeArea.width * 0.1).toFixed(1)} ft</span>
            </div>
            <div className="spec-item">
              <span>Height:</span>
              <span>{(shadeArea.height * 0.1).toFixed(1)} ft</span>
            </div>
          </>
        )}
        
        {!isSafe && cantileverSpan > 0 && (
          <div className="structural-warning">
            ⚠️ Span exceeds safe limits - additional posts recommended
          </div>
        )}
        
        {violations.length > 0 && (
          <div className="constraint-warning">
            <h5>⚠️ Design Constraint Issues:</h5>
            <ul>
              {violations.slice(0, 3).map((violation, index) => (
                <li key={index}>{violation}</li>
              ))}
              {violations.length > 3 && (
                <li>...and {violations.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
        
        {constraints.enabled && (
          <div className="constraint-info">
            <h5>Active Constraints:</h5>
            <div className="constraint-summary">
              <div>Size: {constraints.minWidth}-{constraints.maxWidth} × {constraints.minHeight}-{constraints.maxHeight} ft</div>
              <div>Post Spacing: {constraints.minPostSpacing}-{constraints.maxPostSpacing} ft</div>
              {constraints.snapToGrid && (
                <div>Grid: {constraints.gridSize} ft</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostPanel;