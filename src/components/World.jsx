import { useControls } from 'leva';

// Components
import ChunkField from '@components/ChunkField';

function World() {
  const { playerPosition } = useControls('playerPosition', {
    playerPosition: { value: [0, 0], min: 0, max: 100, step: 5 }
  });
  return (
    <>
      <ChunkField playerPosition={ playerPosition } radius={ 1 } />
    </>
  )
}

export default World;