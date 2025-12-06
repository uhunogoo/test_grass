import React from 'react';

// Helpers
// import { range } from '@lib/utils';

// Components
import Grass from '@components/Grass';

/**
 * Props:
 * - position: [x,y,z] center of chunk
 * - seed (optional) for deterministic placement
 * - lodConfig: string // high, mid, low
 * - range: { high: 20, mid: 60, low: 200 } distances (in world units) where each LOD is active
 */

const details = { 
  high: 4,
  mid: 2,
  low: 1
}

function TestChunk({ position, chunkSize = 6, lodConfig }) {
  return (
    <group dispose={ null } position={ position } >
      <mesh>
        <octahedronGeometry args={[ 4, details[lodConfig] ]} />
        <meshBasicMaterial />
      </mesh>

      <Grass lodConfig={ lodConfig } worldOffset={ position } patchSize={ chunkSize } />
    </group>
  )
}

export default TestChunk;
