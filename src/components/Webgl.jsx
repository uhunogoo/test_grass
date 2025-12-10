import React from 'react';
import * as THREE from 'three/webgpu';

import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Components
import World from './World';

extend( THREE );

function Webgl() {
  const [ frameloop, setFrameloop ] = React.useState( "never" );

  const initRenderer = React.useCallback(async (props) => {
    const renderer = new THREE.WebGPURenderer({
      powerPreference: "high-performance",
      antialias: true,
      alpha: false,
      stencil: false,
      shadowMap: true,
      ...props
    });
    await renderer.init();
    setFrameloop("always");
    return renderer;
  }, []);

  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, height: "100vh", width: "100vw" }}
      camera={{ position: [0, 6, 10], fov: 45 }}
      frameloop={ frameloop }
      shadows
      gl={ initRenderer }
    >
      
      <color attach="background" args={["white"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 1]} intensity={1} />
      
      <World />

      <OrbitControls makeDefault />
    </Canvas>
  )
}

export default Webgl;