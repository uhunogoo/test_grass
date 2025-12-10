import useStore from '@stores/store-grass';
import GrassMaterial from '@components/Materials/GrassShaderMaterial';


function Grass({ lodConfig = "high", worldOffset = [0, 0, 0] }) {
  const { patchSize, width, height } = useStore( ( state ) => state.defaultConfig );
  const LOD = useStore( ( state ) => state.lodConfig );
  
  return (
    <group dispose={ null }>
      <mesh geometry={LOD[lodConfig].geometry} >
        <GrassMaterial 
          grassParams={[ LOD[lodConfig].segments, patchSize, width, height ]}
          worldOffset={ worldOffset }
        />
      </mesh>
    </group>
  )
}

export default Grass;
