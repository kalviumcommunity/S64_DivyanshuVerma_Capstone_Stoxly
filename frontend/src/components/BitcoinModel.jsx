import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
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

// 3D Model Component
const Model = () => {
  const { scene } = useGLTF("/bitcoin_final.glb");
  const modelRef = useRef();

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.003;
    }
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={2.6} 
      position={[0, 15, -70]} 
      rotation={[0.2, 0, 0]}
    />
  );
};

// Main Canvas Component
const BitcoinModel = () => {
  return (
    <div style={{ 
      position: 'absolute',
      width: '600px',
      height: '800px',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -40%)',
      zIndex: 1,
      pointerEvents: 'none',
      overflow: 'visible',
    }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          powerPreference: "high-performance", 
          antialias: true,
          outputEncoding: THREE.sRGBEncoding,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<Loader />}>
          {/* Ambient base light */}
          <ambientLight intensity={1.5} />

          {/* Directional & point lights for glow */}
          <directionalLight position={[0, 5, 5]} intensity={6} />

          {/* 3D Model */}
          <Model />

          {/* Postprocessing: Bloom */}
          <EffectComposer>
            <Bloom
              intensity={1.5}
              kernelSize={2}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.025}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};


// Preload the model
useGLTF.preload("/bitcoin_final.glb");

export default BitcoinModel; 