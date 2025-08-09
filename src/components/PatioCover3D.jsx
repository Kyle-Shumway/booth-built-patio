import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

const PatioCover3D = () => {
  const { posts, shadeArea, coverType, angle, postExtension, getRequiredPostSize } = useStore();
  
  const postSize = getRequiredPostSize();
  
  // Convert 2D canvas coordinates to 3D world coordinates
  const convertTo3D = (x, y) => [
    (x - 300) * 0.02, // Scale and center X
    0,                // Y is always 0 (ground level)
    (y - 200) * 0.02  // Scale and center Z
  ];

  const posts3D = useMemo(() => {
    return posts.map(post => convertTo3D(post.x, post.y));
  }, [posts]);

  const pergolaStructure = useMemo(() => {
    if (!shadeArea || posts.length < 4) return null;
    
    const posts3DPositions = posts.map(post => convertTo3D(post.x, post.y));
    const baseFrameHeight = 2; // Standard pergola height at low end
    
    // Calculate shade area bounds for slope calculation
    const shadeCorners = [
      convertTo3D(shadeArea.x, shadeArea.y),
      convertTo3D(shadeArea.x + shadeArea.width, shadeArea.y),
      convertTo3D(shadeArea.x + shadeArea.width, shadeArea.y + shadeArea.height),
      convertTo3D(shadeArea.x, shadeArea.y + shadeArea.height)
    ];
    
    const shadeWidth = Math.abs(shadeArea.width * 0.02);
    const shadeDepth = Math.abs(shadeArea.height * 0.02);
    const shadeCenter = [
      (shadeArea.x + shadeArea.width/2 - 300) * 0.02,
      0, // Will be calculated based on angle
      (shadeArea.y + shadeArea.height/2 - 200) * 0.02
    ];
    
    // Determine slope direction - let's slope along the Z axis (depth)
    const minZ = Math.min(...shadeCorners.map(c => c[2]));
    const maxZ = Math.max(...shadeCorners.map(c => c[2]));
    const slopeDistance = maxZ - minZ;
    const heightDifference = Math.tan(angle * Math.PI / 180) * slopeDistance;
    
    // Calculate height for each post based on its Z position
    const postsWithHeights = posts3DPositions.map(postPos => {
      const zRatio = (postPos[2] - minZ) / slopeDistance;
      const postHeight = baseFrameHeight + (heightDifference * zRatio);
      return {
        position: postPos,
        frameHeight: postHeight
      };
    });
    
    return {
      posts: postsWithHeights,
      baseFrameHeight,
      heightDifference,
      slopeDirection: { minZ, maxZ, slopeDistance },
      shadeArea: {
        corners: shadeCorners,
        width: shadeWidth,
        depth: shadeDepth,
        center: [
          shadeCenter[0],
          baseFrameHeight + (heightDifference / 2), // Average height at center
          shadeCenter[2]
        ]
      }
    };
  }, [shadeArea, angle, posts]);

  // Get post color based on size
  const getPostColor = () => {
    switch(postSize) {
      case '4x4': return '#34495e';
      case '6x6': return '#8e44ad';
      case '8x8': return '#e74c3c';
      default: return '#34495e';
    }
  };

  // Get cover material properties
  const getCoverMaterial = () => {
    if (coverType === 'lattice') {
      return {
        color: '#8BC34A',
        opacity: 0.7,
        transparent: true
      };
    } else {
      return {
        color: '#607D8B',
        opacity: 0.8,
        transparent: true,
        metalness: 0.5,
        roughness: 0.3
      };
    }
  };

  return (
    <group>
      {/* Posts extending through frame */}
      {(pergolaStructure ? pergolaStructure.posts : posts3D.map(pos => ({ position: pos, frameHeight: 2 }))).map((postData, index) => {
        const frameHeight = postData.frameHeight;
        const postExtensionMeters = postExtension * 0.0254; // Convert inches to meters
        const totalPostHeight = frameHeight + postExtensionMeters;
        
        return (
          <group key={index} position={postData.position}>
            {/* Main post from ground to above frame */}
            <mesh position={[0, totalPostHeight / 2, 0]}>
              <boxGeometry args={[0.2, totalPostHeight, 0.2]} />
              <meshStandardMaterial color={getPostColor()} />
            </mesh>
            
            {/* Post foundation (buried part) */}
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 1]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          </group>
        );
      })}


      {/* Pergola Structure */}
      {pergolaStructure && posts.length >= 4 && (
        <group>
          {/* Main support beams running lengthwise and sitting on post tops */}
          <group>
            {pergolaStructure.posts.length >= 4 && (
              <>
                {/* Create 2 main support beams that run the length (depth) and sit on posts */}
                {Array.from({ length: 2 }, (_, beamIndex) => {
                  // Position beams at left and right sides of shade area
                  const beamXRatio = beamIndex; // 0 for left beam, 1 for right beam  
                  const beamX = pergolaStructure.shadeArea.center[0] - pergolaStructure.shadeArea.width/2 + (beamXRatio * pergolaStructure.shadeArea.width);
                  
                  // Calculate start and end points along the depth (following the slope)
                  const startZ = pergolaStructure.shadeArea.corners[0][2];
                  const endZ = pergolaStructure.shadeArea.corners[2][2];
                  const centerZ = (startZ + endZ) / 2;
                  
                  // Calculate heights at start and end positions
                  const { minZ, slopeDistance } = pergolaStructure.slopeDirection;
                  const startZRatio = (startZ - minZ) / slopeDistance;
                  const endZRatio = (endZ - minZ) / slopeDistance;
                  const startHeight = pergolaStructure.baseFrameHeight + (pergolaStructure.heightDifference * startZRatio);
                  const endHeight = pergolaStructure.baseFrameHeight + (pergolaStructure.heightDifference * endZRatio);
                  const centerHeight = (startHeight + endHeight) / 2;
                  
                  // Calculate beam length and rotation
                  const beamLength = Math.sqrt(
                    Math.pow(pergolaStructure.shadeArea.depth, 2) + 
                    Math.pow(pergolaStructure.heightDifference, 2)
                  );
                  const beamAngle = Math.atan2(pergolaStructure.heightDifference, pergolaStructure.shadeArea.depth);
                  
                  return (
                    <mesh 
                      key={`main-beam-${beamIndex}`}
                      position={[beamX, centerHeight, centerZ]}
                      rotation={[beamAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.12, beamLength]} />
                      <meshStandardMaterial color={getPostColor()} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>

          {/* Rafters spanning across angled beams */}
          <group>
            {pergolaStructure.shadeArea && (
              <>
                {/* Calculate rafter positions across the shade area, following the slope */}
                {Array.from({ length: Math.floor(pergolaStructure.shadeArea.depth / 0.4) + 1 }, (_, i) => {
                  const rafterZ = pergolaStructure.shadeArea.corners[0][2] + (i * 0.4);
                  
                  // Calculate the height at this Z position based on the slope
                  const { minZ, maxZ, slopeDistance } = pergolaStructure.slopeDirection;
                  const zRatio = (rafterZ - minZ) / slopeDistance;
                  const rafterHeight = pergolaStructure.baseFrameHeight + (pergolaStructure.heightDifference * zRatio) + 0.05;
                  
                  return (
                    <mesh 
                      key={`rafter-${i}`}
                      position={[
                        pergolaStructure.shadeArea.center[0],
                        rafterHeight,
                        rafterZ
                      ]}
                      rotation={[0, 0, 0]} // Rafters are level, sitting on angled beams
                    >
                      <boxGeometry args={[pergolaStructure.shadeArea.width, 0.08, 0.12]} />
                      <meshStandardMaterial color={getPostColor()} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>

          {/* Shade cover on top of angled rafters */}
          {pergolaStructure.shadeArea && (
            <group>
              {coverType === 'lattice' ? (
                // Lattice: slats following the angled structure
                <group>
                  {/* Vertical lattice slats (span width, follow same angle as structure) */}
                  {Array.from({ length: Math.floor(pergolaStructure.shadeArea.width * 4) + 1 }, (_, i) => {
                    const xPos = pergolaStructure.shadeArea.center[0] - pergolaStructure.shadeArea.width/2 + (i * pergolaStructure.shadeArea.width / Math.floor(pergolaStructure.shadeArea.width * 4));
                    
                    // Use the same angle calculation as the structure
                    const { minZ, maxZ, slopeDistance } = pergolaStructure.slopeDirection;
                    const startZ = pergolaStructure.shadeArea.corners[0][2];
                    const endZ = pergolaStructure.shadeArea.corners[2][2];
                    const centerZ = (startZ + endZ) / 2;
                    
                    // Calculate center height at this Z position
                    const zRatio = (centerZ - minZ) / slopeDistance;
                    const centerHeight = pergolaStructure.baseFrameHeight + (pergolaStructure.heightDifference * zRatio) + 0.15;
                    
                    const slatLength = Math.sqrt(
                      Math.pow(pergolaStructure.shadeArea.depth, 2) + 
                      Math.pow(pergolaStructure.heightDifference, 2)
                    );
                    
                    // Use negative angle to match the structural slope direction
                    const slatAngle = -Math.atan2(pergolaStructure.heightDifference, pergolaStructure.shadeArea.depth);
                    
                    return (
                      <mesh 
                        key={`lattice-v-${i}`} 
                        position={[xPos, centerHeight, centerZ]}
                        rotation={[slatAngle, 0, 0]}
                      >
                        <boxGeometry args={[0.03, 0.03, slatLength]} />
                        <meshStandardMaterial color="#689F38" />
                      </mesh>
                    );
                  })}
                  
                  {/* Horizontal lattice slats (level, at varying heights) */}
                  {Array.from({ length: Math.floor(pergolaStructure.shadeArea.depth * 4) + 1 }, (_, i) => {
                    const slatZ = pergolaStructure.shadeArea.corners[0][2] + (i * pergolaStructure.shadeArea.depth / Math.floor(pergolaStructure.shadeArea.depth * 4));
                    
                    // Calculate height at this Z position
                    const { minZ, maxZ, slopeDistance } = pergolaStructure.slopeDirection;
                    const zRatio = (slatZ - minZ) / slopeDistance;
                    const slatHeight = pergolaStructure.baseFrameHeight + (pergolaStructure.heightDifference * zRatio) + 0.18;
                    
                    return (
                      <mesh 
                        key={`lattice-h-${i}`} 
                        position={[
                          pergolaStructure.shadeArea.center[0], 
                          slatHeight,
                          slatZ
                        ]}
                      >
                        <boxGeometry args={[pergolaStructure.shadeArea.width, 0.03, 0.03]} />
                        <meshStandardMaterial color="#689F38" />
                      </mesh>
                    );
                  })}
                </group>
              ) : (
                // Aluminum: angled solid surface matching structural slope
                <mesh 
                  position={[
                    pergolaStructure.shadeArea.center[0],
                    pergolaStructure.baseFrameHeight + (pergolaStructure.heightDifference / 2) + 0.15,
                    pergolaStructure.shadeArea.center[2]
                  ]}
                  rotation={[
                    -Math.atan2(pergolaStructure.heightDifference, pergolaStructure.shadeArea.depth),
                    0,
                    0
                  ]}
                >
                  <planeGeometry args={[
                    pergolaStructure.shadeArea.width, 
                    Math.sqrt(
                      Math.pow(pergolaStructure.shadeArea.depth, 2) + 
                      Math.pow(pergolaStructure.heightDifference, 2)
                    )
                  ]} />
                  <meshStandardMaterial {...getCoverMaterial()} side={2} />
                </mesh>
              )}
            </group>
          )}
        </group>
      )}
    </group>
  );
};

export default PatioCover3D;