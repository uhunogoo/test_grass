import * as TSL from 'three/tsl';

export const easeOut = TSL.Fn( ( [ x, t ] ) => {
	return TSL.sub( 1.0, TSL.pow( TSL.sub( 1.0, x ), t ) );
} );