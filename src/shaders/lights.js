// Three.js Transpiler r181

import * as TSL from 'three/tsl';

export const lemberLight = TSL.Fn( ( [ normal, viewDir, lightDir, lightColour ] ) => {

	const wrap = TSL.float( 24.5 );
	const ambient = TSL.float( 0.3 );
	const dotNL = TSL.clamp( TSL.dot( normal, lightDir ).add( wrap ).div( TSL.add( 1.0, wrap ) ) );
	const lighting = TSL.vec3( dotNL );
	const backlight = TSL.clamp( TSL.dot( viewDir, lightDir.negate() ).add( wrap ).div( TSL.add( 1.0, wrap ) ) );
	const scatter = TSL.vec3( TSL.pow( backlight, 2.0 ) );
	lighting.addAssign( scatter );
	lighting.mulAssign( lightColour );
	lighting.mulAssign( TSL.sub( 1.0, ambient ) );

	return lighting.add( TSL.vec3( ambient ) );

});

export const hemiLight = TSL.Fn( ( [ normal, groundColor, skyColor ] ) => {

	const hemi = TSL.mul( 0.5, normal.y ).add( 0.5 );

	return TSL.mix( groundColor, skyColor, hemi );

});

export const phongSpecular = TSL.Fn( ( [ normal, lightDir, viewDir ] ) => {

	const dotNL = TSL.saturation( TSL.dot( normal, lightDir ) );
	const r = TSL.normalize( TSL.reflect( lightDir.negate(), normal ) );
	const phongValue = TSL.max( 0.0, TSL.dot( viewDir, r ) );
	phongValue.assign( TSL.pow( phongValue, 32.0 ) );
	const specular = dotNL.mul( TSL.vec3( phongValue ) );

	return specular;

});