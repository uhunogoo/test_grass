import React from 'react';
import TestChunk from '@components/TestChunk';

function ChunkField({ 
  chunkSize = 25,
  playerChunkPosition = [0, 0], // x, z 
  radius = 2
}) {
  const allChunks = React.useMemo(() => {
    const chunks = new Map();
    const [px, pz] = playerChunkPosition;
  
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const cx = px + dx;
        const cz = pz + dz;
        const key = `${cx},${cz}`;

        let lod = "low";

        if (dx === 0 && dz === 0) {
          lod = "high";
        } else if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
          lod = "mid";
        }
        chunks.set(key, {
          key,
          position: [cx * chunkSize, 0, cz * chunkSize],
          lod
        });
      }
    }
    
    return chunks;
  }, [ playerChunkPosition, chunkSize, radius ]);
  
  return (
    <>
      {/* { Array.from(allChunks.values()).map((chunk) => (
        // console.log( chunk )
      )) } */}
      <TestChunk 
        position={[ 0, 0, 0 ]} 
        chunkSize={ 25 } 
        lodConfig={ "high" } 
      />
    </>
  )
}

export default ChunkField;