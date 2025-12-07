import * as TSL from 'three/tsl';

export const bezier = TSL.Fn( ( [ t, p0, p1, p2, p3 ] ) => {

	const u = TSL.sub( 1.0, t );
	const uu = u.mul( u );
	const uuu = uu.mul( u );
	const tt = t.mul( t );
	const ttt = tt.mul( t );

	return uuu.mul( p0 ).add( TSL.mul( 3.0, uu ).mul( t ).mul( p1 ) ).add( TSL.mul( 3.0, u ).mul( tt ).mul( p2 ) ).add( ttt.mul( p3 ) );

});

export const bezierGradient = TSL.Fn( ( [ t, p0, p1, p2, p3 ] ) => {

	const u = TSL.sub( 1.0, t );

	return TSL.mul( 3.0, u ).mul( u ).mul( p1.sub( p0 ) ).add( TSL.mul( 6.0, u ).mul( t ).mul( p2.sub( p1 ) ) ).add( TSL.mul( 3.0, t ).mul( t ).mul( p3.sub( p2 ) ) );

});