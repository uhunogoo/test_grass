import * as THREE from 'three/webgpu';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { calculateIndices } from '@lib/utils';

export default create( subscribeWithSelector( ( set ) => {
  const baseCount = 32 * 1024;
  const patchSize = 25;
  const geometry = new THREE.InstancedBufferGeometry();
  const lodConfig = {
    high: {
      segments: 6,
      count: baseCount,
    },
    mid: {
      segments: 4,
      count: baseCount / 2,
    },
    low: {
      segments: 2,
      count: baseCount / 4,
    }
  }

  for (const lod in lodConfig) {
    const config = lodConfig[lod];
    const vertices = (config.segments + 1) * 2;
    const computedIndices = calculateIndices(config.segments, vertices);
    const currentGeometry = geometry.clone();
    currentGeometry.computeVertexNormals()

    // Set up geometry
    currentGeometry.instanceCount = config.count;
    currentGeometry.setIndex(computedIndices);
    
    // Create positions based on vertices
    const positions = new Float32Array( vertices * 3 );
    currentGeometry.setAttribute('position', new THREE.BufferAttribute( positions, 3 ));

    currentGeometry.boundingSphere = new THREE.Sphere( 
      new THREE.Vector3(), 
      1 + patchSize * 2
    );

    config.geometry = currentGeometry;
    config.vertices = vertices;
  }
  
  return {
    defaultConfig: {
      patchSize,
      width: 0.2,
      height: 2,
      baseCount,
    },
    lodConfig,
  }
}) );