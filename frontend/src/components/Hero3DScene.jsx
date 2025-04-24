import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// 3D Model Component
const Model = () => {
  const { scene } = useGLTF("/colored_coins.glb");
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
    <primitive ref={modelRef} object={scene} scale={0.5} position={[-0.2, 0, 0]} />
  );
};

// Main Canvas Component
const Hero3DScene = () => {
  return (
    <div className="canvas-container" style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 70 }}
        dpr={[1, 2]}
        gl={{ 
          powerPreference: "high-performance", 
          antialias: true,
          outputEncoding: 'sRGB',
          toneMapping: 'ACESFilmic',
          toneMappingExposure: 1.5
        }}
        style={{ background: "#000" }}
      >
        {/* Ambient base light */}
        <ambientLight intensity={2} />

        {/* Spotlight from above navbar */}
      

        {/* Directional & point lights for glow */}
        <directionalLight position={[0, 5, 5]} intensity={3} />
        <directionalLight
          position={[-5, 2, 5]}
          intensity={0.5}
          color="#ffffff"
        />
        <pointLight
          position={[5, -2, 5]}
          intensity={1.2}
          color="#ff9900"
        />

        {/* 3D Model */}
        <Model />


        {/* Controls */}
        <OrbitControls enableZoom={false} enablePan={false} />

        {/* Postprocessing: Bloom */}
        <EffectComposer>
          <Bloom
            intensity={1.2}
            kernelSize={3}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

// Preload the model
useGLTF.preload("/colored_coins.glb");

export default Hero3DScene;
