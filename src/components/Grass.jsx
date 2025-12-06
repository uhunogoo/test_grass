// import React from 'react';
import * as THREE from 'three/webgpu';
import GrassMaterial from '@components/Materials/GrassShaderMaterial';
import React from 'react';

const COUNT = 32 * 1024;
const SEGMENTS = 6;
const VERTICES = (SEGMENTS + 1) * 2;
const PATCHE_SIZE = 25;
const WIDTH = 0.1;
const HEIGHT = 2.5;

const LOD_CONFIG = {
  high: {
    segments: 6,
    count: COUNT,
  },
  mid: {
    segments: 4,
    count: COUNT / 2,
  },
  low: {
    segments: 2,
    count: COUNT / 4,
  }
}

function Grass({ lodConfig = "high", worldOffset = [0, 0, 0], patchSize = PATCHE_SIZE }) {
  const grassParams = React.useMemo(() => {
    const config = LOD_CONFIG[lodConfig];
    return {
      segments: config.segments,
      patchSize: patchSize,
      vertices: (config.segments + 1) * 2,
      count: config.count,
      width: WIDTH,
      height: HEIGHT
    };
  }, [ lodConfig, patchSize]);
  
  return (
    <group dispose={ null }>
      <BladeOfGrass grassParams={ grassParams } worldOffset={ worldOffset } />
    </group>
  )
}

function BladeOfGrass({ grassParams = {}, ...delegated }) {
  const { segments, vertices, patchSize, count, width, height } = grassParams;
  const geometry = React.useMemo(() => {
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
    
    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = count;
    geo.setIndex(indices);

    const vertexCount = vertices * 2;
    // console.log(vertexCount, indices.length);
    // Create storage buffer for positions (will be computed)
    const vertexPositions = new Float32Array(vertexCount * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(vertexPositions, 3));

    geo.boundingSphere = new THREE.Sphere( 
      new THREE.Vector3(), 
      1 + patchSize * 2
    );
    return geo;
  }, [ segments, vertices, count, patchSize ]);

  return (
    <mesh geometry={geometry} >
      <GrassMaterial 
        grassParams={[ segments, patchSize, width, height ]}
        vertexCount={ vertices * 2 }
        positionsArray={ geometry.attributes.position }
        {...delegated}
      />
    </mesh>
  )
}

export default Grass;
