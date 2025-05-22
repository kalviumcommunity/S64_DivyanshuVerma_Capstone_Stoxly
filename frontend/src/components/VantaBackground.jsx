import { useEffect, useRef } from 'react';

const VantaBackground = () => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    if (vantaRef.current && !vantaEffect.current && window.VANTA && window.VANTA.DOTS) {
      vantaEffect.current = window.VANTA.DOTS({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x3b82f6,
        color2: 0x0,
        backgroundColor: 0x0,
        size: 3.00,
        spacing: 40.00,
        speed: 1.50
      });
    }

    return () => {
      if (vantaEffect.current) {
        try {
          vantaEffect.current.destroy();
        } catch (e) {}
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default VantaBackground; 