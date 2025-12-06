import React from 'react';
import * as THREE from 'three/webgpu';

import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Components
import World from './World';

extend( THREE );

function Webgl() {
  const [ frameloop, setFrameloop ] = React.useState( "never" );

  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, height: "100vh", width: "100vw" }}
      camera={{ position: [4, 4, 0], fov: 45 }}
      frameloop={ frameloop }
      shadows
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(props);
        await renderer.init().then(() => {
          setFrameloop("always");
        });
        
        return renderer;
      }}
    >
      
      <color attach="background" args={["white"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 1]} intensity={1} />
      
      <World />

      <OrbitControls />
    </Canvas>
  )
}

export default Webgl;