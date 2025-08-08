import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

const PatioCover3D = () => {
  const { posts, shadeArea, coverType, angle, getRequiredPostSize } = useStore();
  
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

  const shadeArea3D = useMemo(() => {
    if (!shadeArea) return null;
    
    const corners = [
      convertTo3D(shadeArea.x, shadeArea.y),
      convertTo3D(shadeArea.x + shadeArea.width, shadeArea.y),
      convertTo3D(shadeArea.x + shadeArea.width, shadeArea.y + shadeArea.height),
      convertTo3D(shadeArea.x, shadeArea.y + shadeArea.height)
    ];
    
    return {
      corners,
      center: [
        (corners[0][0] + corners[2][0]) / 2,
        2 + Math.sin(angle * Math.PI / 180) * 0.5, // Height varies with angle
        (corners[0][2] + corners[2][2]) / 2
      ],
      width: Math.abs(corners[1][0] - corners[0][0]),
      depth: Math.abs(corners[2][2] - corners[0][2])
    };
  }, [shadeArea, angle]);

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
      {/* Ground Posts */}
      {posts3D.map((position, index) => (
        <group key={index} position={position}>
          {/* Post */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.2, 2, 0.2]} />
            <meshStandardMaterial color={getPostColor()} />
          </mesh>
          
          {/* Post Number Label */}
          <mesh position={[0, 2.3, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* Post foundation (buried part) */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
        </group>
      ))}

      {/* Shade Cover */}
      {shadeArea3D && (
        <group>
          {/* Main cover surface */}
          <mesh position={shadeArea3D.center}>
            <planeGeometry args={[shadeArea3D.width, shadeArea3D.depth]} />
            <meshStandardMaterial {...getCoverMaterial()} side={2} />
          </mesh>
          
          {/* Lattice pattern overlay */}
          {coverType === 'lattice' && (
            <group position={shadeArea3D.center}>
              {/* Vertical slats */}
              {Array.from({ length: Math.floor(shadeArea3D.width * 10) }, (_, i) => (
                <mesh 
                  key={`v-${i}`} 
                  position={[
                    -shadeArea3D.width/2 + (i * 0.1), 
                    0.02, 
                    0
                  ]}
                >
                  <boxGeometry args={[0.02, 0.02, shadeArea3D.depth]} />
                  <meshStandardMaterial color="#689F38" />
                </mesh>
              ))}
              
              {/* Horizontal slats */}
              {Array.from({ length: Math.floor(shadeArea3D.depth * 10) }, (_, i) => (
                <mesh 
                  key={`h-${i}`} 
                  position={[
                    0, 
                    0.01, 
                    -shadeArea3D.depth/2 + (i * 0.1)
                  ]}
                >
                  <boxGeometry args={[shadeArea3D.width, 0.02, 0.02]} />
                  <meshStandardMaterial color="#689F38" />
                </mesh>
              ))}
            </group>
          )}
          
          {/* Support beams from posts to cover */}
          {posts3D.map((postPos, index) => {
            const beamEnd = [
              postPos[0],
              shadeArea3D.center[1],
              postPos[2]
            ];
            
            const beamLength = Math.sqrt(
              Math.pow(beamEnd[0] - postPos[0], 2) + 
              Math.pow(beamEnd[1] - (postPos[1] + 2), 2) + 
              Math.pow(beamEnd[2] - postPos[2], 2)
            );
            
            const midPoint = [
              (postPos[0] + beamEnd[0]) / 2,
              (postPos[1] + 2 + beamEnd[1]) / 2,
              (postPos[2] + beamEnd[2]) / 2
            ];
            
            return (
              <mesh key={`beam-${index}`} position={midPoint}>
                <cylinderGeometry args={[0.05, 0.05, beamLength]} />
                <meshStandardMaterial color={getPostColor()} />
              </mesh>
            );
          })}
          
          {/* Frame around the cover */}
          <group position={shadeArea3D.center}>
            {/* Front edge */}
            <mesh position={[0, 0.03, -shadeArea3D.depth/2]}>
              <boxGeometry args={[shadeArea3D.width, 0.1, 0.05]} />
              <meshStandardMaterial color={getPostColor()} />
            </mesh>
            
            {/* Back edge */}
            <mesh position={[0, 0.03, shadeArea3D.depth/2]}>
              <boxGeometry args={[shadeArea3D.width, 0.1, 0.05]} />
              <meshStandardMaterial color={getPostColor()} />
            </mesh>
            
            {/* Left edge */}
            <mesh position={[-shadeArea3D.width/2, 0.03, 0]}>
              <boxGeometry args={[0.05, 0.1, shadeArea3D.depth]} />
              <meshStandardMaterial color={getPostColor()} />
            </mesh>
            
            {/* Right edge */}
            <mesh position={[shadeArea3D.width/2, 0.03, 0]}>
              <boxGeometry args={[0.05, 0.1, shadeArea3D.depth]} />
              <meshStandardMaterial color={getPostColor()} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};

export default PatioCover3D;