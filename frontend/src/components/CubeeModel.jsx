import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Lightformer } from '@react-three/drei';
import * as THREE from "three";

// Loading fallback component
const Loader = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
};

function Model() {
  const gltf = useGLTF('/cubee.glb');
  const modelRef = useRef();
  // Define rotation states
  const [rotationState, setRotationState] = useState({
    isRotating: true,
    pauseStartTime: 0,
    currentFaceIndex: 0,
    targetRotation: 0
  });

  // Define rotation angles for each face (in radians)
  const faceRotations = [
    0,              // Front face
    Math.PI/2,      // Right face
    Math.PI,        // Back face
    3*Math.PI/2     // Left face
  ];

  useEffect(() => {
    // Set all materials to have high emissive intensity to make the cube brighter
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        // Make sure the meshes receive and cast shadows
        child.castShadow = true;
        child.receiveShadow = true;
        
        // If the child has a material, ensure it's visible
        if (child.material) {
          // Increase material brightness
          child.material.roughness = 0.200;
          child.material.metalness = 1.0;
          
          // Make sure color is not black if it's a base material
          if (child.material.color && child.material.color.r === 0 && 
              child.material.color.g === 0 && child.material.color.b === 0) {
            child.material.color.set('#333333');
          }
        }
      }
    });

    // Cleanup function
    return () => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    };
  }, [gltf.scene]);

  useFrame(() => {
    if (!modelRef.current) return;

    const { isRotating, pauseStartTime, currentFaceIndex, targetRotation } = rotationState;
    
    if (isRotating) {
      // Only rotating around Y axis now
      const currentAngle = modelRef.current.rotation.y;
      
      // Calculate the distance to the target
      let distanceToTarget = Math.abs(currentAngle - targetRotation);
      
      // Handle wrapping around 2π
      if (distanceToTarget > Math.PI) {
        distanceToTarget = 2 * Math.PI - distanceToTarget;
      }
      
      // If the distance is small enough, we've reached the target
      if (distanceToTarget < 0.05) {
        // Start the pause
        setRotationState({
          isRotating: false,
          pauseStartTime: Date.now(),
          currentFaceIndex,
          targetRotation
        });
        
        // Set the exact angle to avoid small offsets
        modelRef.current.rotation.y = targetRotation;
      } else {
        // Continue rotating toward the target
        const rotationSpeed = 0.04; // Adjust speed as needed
        
        // Determine direction based on the shortest path
        const direction = ((targetRotation - currentAngle + Math.PI*3) % (Math.PI*2)) - Math.PI;
        const step = Math.sign(direction) * Math.min(Math.abs(direction), rotationSpeed);
        
        modelRef.current.rotation.y += step;
      }
    } else {
      // Check if pause time has elapsed (0.2 seconds)
      if (Date.now() - pauseStartTime > 200) {
        // Move to the next face
        const nextFaceIndex = (currentFaceIndex + 1) % faceRotations.length;
        const nextTargetRotation = faceRotations[nextFaceIndex];
        
        // Start rotating again
        setRotationState({
          isRotating: true,
          pauseStartTime: 0,
          currentFaceIndex: nextFaceIndex,
          targetRotation: nextTargetRotation
        });
      }
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={0.25}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

const CubeeModel = () => {
  return (
    <div style={{
      width: '400px',
      height: '400px',
      position: 'absolute',
      top: '40%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 2
    }}>
      <Canvas
        camera={{ position: [3, 0, 0], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          powerPreference: "high-performance", 
          antialias: true,
          outputEncoding: THREE.sRGBEncoding,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5
        }}
        shadows
      >
        <Suspense fallback={<Loader />}>
          {/* Add very bright ambient light */}
          <ambientLight intensity={2.0} color="#ffffff" />
          
          {/* Front light - very bright */}
          <directionalLight
            position={[5, 0, 0]}
            intensity={0.1}
            color="#ffffff"
          />
          
          {/* Top light */}
          <directionalLight
            position={[0, 5, 0]}
            intensity={0}
            color="#ffaa55"
          />
          
          {/* Side lights */}
          <directionalLight
            position={[0, 0, 5]}
            intensity={3}
            color="#ff8844"
          />
          
          <directionalLight
            position={[0, 0, -5]}
            intensity={3}
            color="#ff8844"
          />
          
          {/* Add an environment with emissive surfaces for reflections */}
          <Environment resolution={256}>
            <Lightformer 
              position={[10, 0, 0]}
              scale={[10, 10, 1]}
              intensity={5}
              color="#ff7700"
            />
            <Lightformer 
              position={[-10, 0, 0]}
              scale={[10, 10, 1]}
              intensity={5}
              color="#ff7700"
            />
            <Lightformer 
              position={[0, 10, 0]}
              scale={[10, 10, 1]}
              intensity={5}
              color="#ffffff"
            />
            <Lightformer 
              position={[0, -10, 0]}
              scale={[10, 10, 1]}
              intensity={5}
              color="#ff9900"
            />
            <Lightformer 
              position={[0, 0, 10]}
              scale={[10, 10, 1]}
              intensity={5}
              color="#ff7700"
            />
          </Environment>
          
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Preload the model
useGLTF.preload("/cubee.glb");

export default CubeeModel; 