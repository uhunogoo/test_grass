import * as TSL from 'three/tsl';

const murmurHash21 = TSL.Fn( ([ src_immutable ]) => {

	const src = src_immutable.toVar();
	const M = TSL.uint( 0x5bd1e995 );
	const h = TSL.uvec2( 1190494759, 2147483647 );
	src.mulAssign( M );
	src.bitXorAssign( src.shiftRight( 24 ) );
	h.x.mulAssign( M );
	h.x.bitXorAssign( src );
	h.y.mulAssign( M );
	h.y.bitXorAssign( src );
	h.x.bitXorAssign( h.x.shiftRight( 13 ) );
	h.x.mulAssign( M );
	h.x.bitXorAssign( h.x.shiftRight( 15 ) );
	h.y.bitXorAssign( h.y.shiftRight( 13 ) );
	h.y.mulAssign( M );
	h.y.bitXorAssign( h.y.shiftRight( 15 ) );

	return h;
});

export const hash21 = TSL.Fn( ([ src ]) => {

	const h = murmurHash21( TSL.floatBitsToUint( src ) );

	return TSL.uintBitsToFloat( h.bitAnd( 0x007fffff ).bitOr( 0x3f800000 ) ).sub( 1.0 );

});