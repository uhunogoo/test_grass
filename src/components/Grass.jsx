import GrassMaterial from '@components/Materials/GrassShaderMaterial';

function Grass({ geometry, segments, patchSize, width, height, worldOffset = [0, 0, 0] }) {
  return (
    <group dispose={ null }>
      <mesh geometry={ geometry } >
        <GrassMaterial 
          grassParams={[ segments, patchSize, width, height ]}
          worldOffset={ worldOffset }
        />
      </mesh>
    </group>
  )
}

export default Grass;
