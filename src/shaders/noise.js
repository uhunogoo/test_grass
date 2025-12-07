// Three.js Transpiler r181

import * as TSL from 'three/tsl';
import { hash } from './hash';

export const noise = TSL.Fn( ( [ p ] ) => {

	const i = TSL.floor( p );
	const f = TSL.fract( p );

	// fade curve

	const u = f.mul( f ).mul( TSL.sub( 3.0, TSL.mul( 2.0, f ) ) );

	// 8 corner gradients

	const n000 = TSL.dot( hash( i.add( TSL.vec3( 0.0, 0.0, 0.0 ) ) ), f.sub( TSL.vec3( 0.0, 0.0, 0.0 ) ) );
	const n100 = TSL.dot( hash( i.add( TSL.vec3( 1.0, 0.0, 0.0 ) ) ), f.sub( TSL.vec3( 1.0, 0.0, 0.0 ) ) );
	const n010 = TSL.dot( hash( i.add( TSL.vec3( 0.0, 1.0, 0.0 ) ) ), f.sub( TSL.vec3( 0.0, 1.0, 0.0 ) ) );
	const n110 = TSL.dot( hash( i.add( TSL.vec3( 1.0, 1.0, 0.0 ) ) ), f.sub( TSL.vec3( 1.0, 1.0, 0.0 ) ) );
	const n001 = TSL.dot( hash( i.add( TSL.vec3( 0.0, 0.0, 1.0 ) ) ), f.sub( TSL.vec3( 0.0, 0.0, 1.0 ) ) );
	const n101 = TSL.dot( hash( i.add( TSL.vec3( 1.0, 0.0, 1.0 ) ) ), f.sub( TSL.vec3( 1.0, 0.0, 1.0 ) ) );
	const n011 = TSL.dot( hash( i.add( TSL.vec3( 0.0, 1.0, 1.0 ) ) ), f.sub( TSL.vec3( 0.0, 1.0, 1.0 ) ) );
	const n111 = TSL.dot( hash( i.add( TSL.vec3( 1.0, 1.0, 1.0 ) ) ), f.sub( TSL.vec3( 1.0, 1.0, 1.0 ) ) );

	// linear interpolation in 3D


	return TSL.mix( TSL.mix( TSL.mix( n000, n100, u.x ), TSL.mix( n010, n110, u.x ), u.y ), TSL.mix( TSL.mix( n001, n101, u.x ), TSL.mix( n011, n111, u.x ), u.y ), u.z );

});