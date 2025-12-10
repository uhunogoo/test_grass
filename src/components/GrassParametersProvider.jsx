import React from 'react';
import * as THREE from 'three/webgpu';

export const GrassParametersContext = React.createContext(); 

const GEOMETRY = new THREE.InstancedBufferGeometry();
const COUNT = 32 * 1024;
const SEGMENTS = 6;
const VERTICES = (SEGMENTS + 1) * 2;
const PATCHE_SIZE = 25;
const WIDTH = 0.2;
const HEIGHT = 2;

const LOD_CONFIG = {
  high: {
    segments: 6,
    count: COUNT,
  },
  mid: {
    segments: 4,
    count: COUNT / 4,
  },
  low: {
    segments: 2,
    count: COUNT / 2,
  }
}

function GrassParametersProvider({ children }) {
  const grassParams = React.useMemo(() => {
    const config = LOD_CONFIG;
    let params = {};
    for (const key in config) {
      const segments = config[key].segments;
      const patchSize = PATCHE_SIZE;
      const vertices = VERTICES;
      const count = config[key].count;
      const width = WIDTH;
      const height = HEIGHT;

      // Create indices
      const indices = [];
      for (let i = 0; i < segments; i++) {
        const vi = i * 2;
        
        indices[i*12 + 0] = vi + 0;
        indices[i*12 + 1] = vi + 1;
        indices[i*12 + 2] = vi + 2;
  
        indices[i*12 + 3] = vi + 2;
        indices[i*12 + 4] = vi + 1;
        indices[i*12 + 5] = vi + 3;
  
        const fi = vertices + vi;
  
        indices[i*12 + 6] = fi + 2;
        indices[i*12 + 7] = fi + 1;
        indices[i*12 + 8] = fi + 0;
  
        indices[i*12 + 9] = fi + 3;
        indices[i*12 + 10] = fi + 1;
        indices[i*12 + 11] = fi + 2;
      }
      
      const geo = GEOMETRY.clone();
      geo.instanceCount = count;
      geo.setIndex(indices);
      
      // Create positions based on vertices
      const positions = new Float32Array( vertices * 3 );
      geo.setAttribute('position', new THREE.BufferAttribute( positions, 3 ));
  
      // geo.boundingSphere = new THREE.Sphere( 
      //   new THREE.Vector3(), 
      //   1 + patchSize * 2
      // );
      return geo;
    }
    
    return params;
  }, []);
    
    return {
      segments: config.segments,
      patchSize: patchSize,
      vertices: (config.segments + 1) * 2,
      count: config.count,
      width: WIDTH,
      height: HEIGHT
    };
  }, []);

  return (
    <>
      { children }
    </>
  )
}