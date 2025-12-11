import React from 'react';
import TestChunk from '@components/TestChunk';
import Grass from '@components/Grass';
import useStore from '@stores/store-grass';

function ChunkField({ 
  chunkSize = 25,
  radius = 2
}) {
  const allChunks = React.useMemo(() => {
    const chunks = new Map();
    const [px, pz] = [0 ,0];
  
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
  }, [ chunkSize, radius ]);
  
  const defaultConfig = useStore( ( state ) => state.defaultConfig );
  const lodConfig = useStore( ( state ) => state.lodConfig );

  console.log( lodConfig )

  return (
    <>
      { Array.from(allChunks.values()).map((chunk) => (
        <TestChunk
          key={ `${chunk.key}-${chunk.lod}` }
          position={ chunk.position } 
          chunkSize={ chunkSize } 
          lodConfig={ chunk.lod } 
        >
          <Grass
            geometry={ lodConfig[chunk.lod].geometry }
            segments={ lodConfig[chunk.lod].segments }
            chunkSize={ chunkSize }
            patchSize={ defaultConfig.patchSize }
            width={ defaultConfig.width }
            height={ defaultConfig.height }
            worldOffset={ chunk.position }
          />
        </TestChunk>
      )) }
    </>
  )
}

export default React.memo(ChunkField);