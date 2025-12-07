import * as TSL from 'three/tsl';

export const hash = TSL.Fn( ([ p ]) => {

	const q = TSL.vec3( TSL.dot( p, TSL.vec3( 127.1, 311.7, 419.2 ) ), TSL.dot( p, TSL.vec3( 269.5, 183.3, 371.9 ) ), TSL.dot( p, TSL.vec3( 419.2, 371.9, 127.1 ) ) );

	return TSL.float( -1.0 ).add( TSL.mul( 2.0, TSL.fract( TSL.sin( q ).mul( 43758.5453 ) ) ) );

});