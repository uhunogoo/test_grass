import * as TSL from 'three/tsl';

export const rotateY = TSL.Fn( ( [ angle ] ) => {

	const s = TSL.sin( angle );
	const c = TSL.cos( angle );

	return TSL.mat3( TSL.vec3( c, 0.0, s ), TSL.vec3( 0.0, 1.0, 0.0 ), TSL.vec3( s.negate(), 0.0, c ) );

});

export const rotateAxis = TSL.Fn( ( [ axis, angle ] ) => {

	const s = TSL.sin( angle );
	const c = TSL.cos( angle );
	const oc = TSL.sub( 1.0, c );

	return TSL.mat3( TSL.vec3( c.add( oc.mul( axis.x ).mul( axis.x ) ), oc.mul( axis.x ).mul( axis.y ).add( s.mul( axis.z ) ), oc.mul( axis.x ).mul( axis.z ).sub( s.mul( axis.y ) ) ), TSL.vec3( oc.mul( axis.x ).mul( axis.y ).sub( s.mul( axis.z ) ), c.add( oc.mul( axis.y ).mul( axis.y ) ), oc.mul( axis.y ).mul( axis.z ).add( s.mul( axis.x ) ) ), TSL.vec3( oc.mul( axis.x ).mul( axis.z ).add( s.mul( axis.y ) ), oc.mul( axis.y ).mul( axis.z ).sub( s.mul( axis.x ) ), c.add( oc.mul( axis.z ).mul( axis.z ) ) ) );

});
