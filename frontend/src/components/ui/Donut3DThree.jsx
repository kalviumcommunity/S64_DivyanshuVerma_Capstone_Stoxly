import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function DonutMesh({ gain, loss, donutGroupRef, shouldReset, setShouldReset }) {
  const [animatedGainAngle, setAnimatedGainAngle] = useState(0);
  const [animatedLossAngle, setAnimatedLossAngle] = useState(0);

  const total = Math.abs(gain) + Math.abs(loss);
  const targetGainAngle = (Math.abs(gain) / (total || 1)) * Math.PI * 2;
  const targetLossAngle = Math.PI * 2 - targetGainAngle;

  // Animate the angles smoothly
  useFrame(() => {
    setAnimatedGainAngle(prev => {
      if (Math.abs(prev - targetGainAngle) < 0.01) return targetGainAngle;
      return prev + (targetGainAngle - prev) * 0.15;
    });
    setAnimatedLossAngle(prev => {
      if (Math.abs(prev - targetLossAngle) < 0.01) return targetLossAngle;
      return prev + (targetLossAngle - prev) * 0.15;
    });

    // Animate the donut back to its original rotation after user interaction
    if (shouldReset && donutGroupRef.current) {
      donutGroupRef.current.rotation.x += (-donutGroupRef.current.rotation.x) * 0.1;
      donutGroupRef.current.rotation.y += (-donutGroupRef.current.rotation.y) * 0.1;
      donutGroupRef.current.rotation.z += (-donutGroupRef.current.rotation.z) * 0.1;
      if (
        Math.abs(donutGroupRef.current.rotation.x) < 0.01 &&
        Math.abs(donutGroupRef.current.rotation.y) < 0.01 &&
        Math.abs(donutGroupRef.current.rotation.z) < 0.01
      ) {
        donutGroupRef.current.rotation.x = 0;
        donutGroupRef.current.rotation.y = 0;
        donutGroupRef.current.rotation.z = 0;
        setShouldReset(false);
      }
    }
  });

  // When data changes, update the angles immediately if total is 0
  useEffect(() => {
    if (total === 0) {
      setAnimatedGainAngle(0);
      setAnimatedLossAngle(0);
    }
  }, [gain, loss, total]);

  // Make the donut slimmer by reducing the tube radius
  const mainRadius = 1.1;
  const tubeRadius = 0.28; // slimmer
  const gainGeometry = new THREE.TorusGeometry(mainRadius, tubeRadius, 32, 100, animatedGainAngle);
  const lossGeometry = new THREE.TorusGeometry(mainRadius, tubeRadius, 32, 100, animatedLossAngle);

  return (
    <group ref={donutGroupRef}>
      {/* Gain segment */}
      <mesh geometry={gainGeometry} position={[0, 0, 0]}>
        <meshStandardMaterial color="#00ff00" emissive="#1aff1a" metalness={0.7} roughness={0.18} />
      </mesh>
      {/* Loss segment (rotated to start after gain) */}
      <mesh geometry={lossGeometry} position={[0, 0, 0]} rotation={[0, 0, animatedGainAngle]}>
        <meshStandardMaterial color="#ff4c4c" emissive="#ff1a1a" metalness={0.7} roughness={0.18} />
      </mesh>
    </group>
  );
}

const Donut3DThree = ({ gain, loss }) => {
  const donutGroupRef = useRef();
  const controlsRef = useRef();
  const [shouldReset, setShouldReset] = useState(false);

  // Handler for when user stops interacting
  const handleEnd = () => {
    setShouldReset(true);
  };

  return (
    <div style={{ width: 130, height: 130 }}>
      <Canvas camera={{ position: [0, 0, 4.5] }} style={{ background: 'transparent' }}>
        {/* Modern lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 5]} intensity={1.3} color="#ffffff" />
        <directionalLight position={[-2, -4, -5]} intensity={0.5} color="#00ffcc" />
        <pointLight position={[0, 0, 6]} intensity={0.3} color="#ffffff" />
        <DonutMesh gain={gain} loss={loss} donutGroupRef={donutGroupRef} shouldReset={shouldReset} setShouldReset={setShouldReset} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          onEnd={handleEnd}
        />
      </Canvas>
    </div>
  );
};

export default Donut3DThree; 