import React from 'react';
import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';
import {  useTexture } from '@react-three/drei';

import { hash21 } from '@shaders/hash21';
import { hash } from '@shaders/hash';
import { easeOut } from '@shaders/easeFunctions';
import { bezier, bezierGradient } from '@shaders/bezier';
import { noise } from '@shaders/noise';
import { rotateAxis, rotateY } from '@shaders/rotation';
import { hemiLight, lemberLight, phongSpecular } from '@shaders/lights';

function GrassMaterial({ worldOffset = [0, 0, 0], grassParams = [1, 1, 1, 1] }) {
  const material = React.useRef( null );
  const tileDataTexture = useTexture('./tileTexture.png');
  const { nodes, uniforms } = React.useMemo(() => {
    const uniforms = {
      tileDataTexture: tileDataTexture,
      grassParams: new THREE.Vector4(...grassParams),
      worldOffset: new THREE.Vector3(...worldOffset),
      resolution: new THREE.Vector2(1, 1)
    };

    // Varyings
    const vWorldPosition = TSL.varying( TSL.vec3() );
    const vColor = TSL.varying( TSL.vec3() );
    const vNormal = TSL.varying( TSL.vec3() );
    const vGrassData = TSL.varying( TSL.vec4() );
    
    // Colors
    const BASE_COLOR = TSL.vec3( 0.1, 0.4, 0.04 );
    const TIP_COLOR = TSL.vec3( 0.5, 0.7, 0.3 );

    const computeVertices = TSL.Fn( () => {
      // Default values
      const PI = TSL.float( Math.PI );
      const position = TSL.positionLocal;
      const index = TSL.vertexIndex;
      
      // Params
      const grass_segments = TSL.int( uniforms.grassParams.x );
      const grass_vertices = TSL.int( TSL.add( grass_segments, 1 ).mul(2) );
      const patch_size = TSL.float( uniforms.grassParams.y );
      const grass_width = TSL.float( uniforms.grassParams.z );
      const grass_height = TSL.float( uniforms.grassParams.w );

      // Figure out grass offset
      const hashedInstanceID = hash21( TSL.float( TSL.instanceIndex ) ).mul(2.0).sub(1.0);
      const grassOffset = TSL.mul(
        TSL.vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y),
        patch_size
      );

      const grassBladeWorldPos = TSL.mul(
        TSL.modelWorldMatrix,
        TSL.vec4(grassOffset, 1.0)
      ).xyz;
      const hashVal = hash( grassBladeWorldPos );

      // Grass rotation
      const angle = TSL.remap( hashVal.x, -1.0, 1.0, PI.negate(), PI );

      // UV
      const tileUV = TSL.sub(
        TSL.vec2( grassBladeWorldPos.x.negate(), grassBladeWorldPos.z ),
        TSL.vec2( uniforms.worldOffset.x, uniforms.worldOffset.z )
      ).xy;
      const tileData = TSL.texture( 
        uniforms.tileDataTexture,
        TSL.div(tileUV, patch_size).mul(0.5).add(0.5)
      );

      // Tile settings
      const stiffness = TSL.mul( tileData.x, 0.5 ).oneMinus();
      const tileGrassHeight = TSL.remap( tileData.x.oneMinus(), 0.0, 1.0, 1.0, 1.2 );

      // Figure out vertexID, > GRASS_VERTICES is other side
      const vertFB_ID = index.mod( grass_vertices.mul( 2 ) );
      const vertID = vertFB_ID.mod( grass_vertices );

      // 0 = left, 1 = right
      const xTest = TSL.int( vertID.bitAnd(1) );
      const zTest = TSL.select( 
        vertFB_ID.greaterThanEqual( grass_vertices ), 
        1, 
        -1 
      );

      const xSide = TSL.float( xTest );
      const zSide = TSL.float( zTest );
      const heightPercent = TSL.float( 
        TSL.div(
          TSL.float( TSL.sub(vertID, xTest) ),
          TSL.float( grass_segments ).mul(2.0)
        )
      );
      const height = TSL.mul(grass_height, tileGrassHeight);
      const width = TSL.mul(
        grass_width,
        easeOut(heightPercent.oneMinus(), 4.0).mul( tileGrassHeight )
      );
      
      // Calculate verticex position
      let vX = TSL.mul( TSL.sub(xSide, 0.5), width );
      let vY = TSL.mul( heightPercent, height );
      let vZ = TSL.float( 0.0 );

      // calculate lean factor
      const windStrangth = noise(
        TSL.vec3(
          TSL.mul( grassBladeWorldPos.xz, 0.1 ),
          0.0
        ).add( TSL.time.mul( 0.4 ) )
      );
      const windAngle = 0.0;
      const windAxis = TSL.vec3( TSL.cos(windAngle), 0.0, TSL.sin(windAngle) );
      const windLeanAngle = windStrangth.mul(1.5).mul(heightPercent).mul( stiffness );

      const randomLeanAnimation = noise(
        TSL.vec3(
          grassBladeWorldPos.xz,
          TSL.time.mul(1.5)
        )
      ).mul( TSL.add( windStrangth.mul(0.5), 0.125 ) );
      const leanFactor = TSL.add(
        TSL.remap( hashVal.y, -1.0, 1.0, -0.5, 0.5 ),
        randomLeanAnimation.x
      );

      // Add bezier curve
      const p0 = TSL.vec3( 0.0, 0.0, 0.0 );
      const p1 = TSL.vec3( 0.0, 0.33, 0.0 );
      const p2 = TSL.vec3( 0.0, 0.66, 0.0 );
      const p3 = TSL.vec3( 0.0, TSL.cos(leanFactor), TSL.sin(leanFactor) );
      const curve = bezier( heightPercent, p0, p1, p2, p3 );
      
      // Calculate normal
      const curveGradient = bezierGradient( heightPercent, p0, p1, p2, p3 );
      const curveRot90 = TSL.mat2(0.0, 1.0, -1.0, 0.0).mul( TSL.mul(zSide, -1.0) );

      // Add curve to position
      vY = height.mul( curve.y );
      vZ = height.mul( curve.z );

      // Direction from plane to camera
      const toCamera = TSL.normalize(TSL.sub(TSL.cameraPosition, grassBladeWorldPos));

      // --- ROTATION AROUND Y (make plane face camera horizontally only) ---
      const camAngle = TSL.atan(toCamera.x, toCamera.z);
      const calculatedAngle = camAngle.add(- Math.PI * 0.5);
      const s = TSL.sin(calculatedAngle);
      const c = TSL.cos(calculatedAngle);

      const rotY = TSL.mat3(
        c, 0.0, s.negate(),
        0.0, 1.0, 0.0,
        s, 0.0,  c
      );

      // Generate grass matrix
      const grassMatrix = TSL.mul(
        TSL.mat3( rotateAxis( windAxis, windLeanAngle ) ),
        TSL.mat3( rotateY(angle) ).mul(rotY)
      );

      const grassLocalPosition = TSL.mul( grassMatrix, TSL.vec3( vX, vY, vZ ) ).add( grassOffset );
      let grassLocalNormal = TSL.mul( grassMatrix, TSL.vec3( 0.0, curveRot90.mul( curveGradient.yz ) ) );

      // Blend normals
      const distanceBlend = TSL.smoothstep( 0.0, 10.0, TSL.distance( TSL.cameraPosition, grassBladeWorldPos ) );
      grassLocalNormal = TSL.mix( grassLocalNormal, TSL.vec3( 0.0, 1.0, 0.0 ), distanceBlend.mul(0.5) );
      grassLocalNormal = TSL.normalize( grassLocalNormal );

      // View thikness
      const worldPosition = TSL.mul( TSL.modelWorldMatrix, TSL.vec4( grassLocalPosition, 1.0 ) );
      let mvPosition = worldPosition;
      const viewDir = TSL.normalize( TSL.sub( TSL.cameraPosition, grassBladeWorldPos ) );
      const grassFaceNormal = TSL.mul(
        grassMatrix,
        TSL.vec3( 0.0, 0.0, zSide.negate() )
      );
      
      const viewDotNormal = TSL.clamp( TSL.dot( grassFaceNormal, viewDir ), 0.0, 1.0 );
      const viewSpaceThiknessFactor = TSL.mul(
        easeOut( viewDotNormal.oneMinus(), 4.0 ),
        TSL.smoothstep( 0.0, 100.212, viewDotNormal )
      );

      mvPosition.x.addAssign( viewSpaceThiknessFactor.mul( TSL.sub( xSide, 0.5 ).mul( width ).mul( 0.5 ).mul( zSide.negate()) ) ) 

      // Calculate position
      const x = position.x.assign( mvPosition.x );
      const y = position.y.assign( mvPosition.y );
      const z = position.z.assign( mvPosition.z );

      const finalPosition = TSL.vec3( x, y, z );
      
      // Varyings
      vNormal.assign( TSL.mul(TSL.modelWorldMatrix, TSL.vec4(grassLocalNormal, 0.0)).xyz );
      const c1 = TSL.mix(BASE_COLOR, TIP_COLOR, heightPercent);
      const c2 = TSL.mix(TSL.vec3(0.6, 0.6, 0.4), TSL.vec3(0.88, 0.87, 0.52), heightPercent);
      const noiseVal = noise( grassBladeWorldPos.mul( 0.05 ) );
      vColor.assign(
        TSL.mix(c1, c2, TSL.smoothstep(-1.0, 1.0, noiseVal) )
      );
      vWorldPosition.assign(worldPosition.xyz);
      vGrassData.assign(
        TSL.vec4(vX, heightPercent, 0.0, 0.0)
      );

      return finalPosition;
    })();

    // TSL fragment shader
    const colorNode = TSL.Fn(() => {
      // const uv = TSL.uv();
      const grassX = vGrassData.x;
      const grassY = vGrassData.y;
      const normal = TSL.normalize( vNormal );
      const viewDir = TSL.normalize( TSL.sub( TSL.cameraPosition, vWorldPosition ) );


      const baseColor = TSL.mix(
        vColor.mul(0.75),
        vColor,
        TSL.smoothstep( 0.125, 0.0, TSL.abs( grassX ) )
      );

      // calculate hemi light
      const c1 = TSL.vec3(1.0, 1.0, 0.75);
      const c2 = TSL.vec3(0.5, 0.5, 0.25);
      const ambientLight = hemiLight( normal, c2, c1 );

      // Directional light
      const lightDir = TSL.normalize( TSL.vec3( 1.0, 2.5, 1.0 ) );
      const lightColour = TSL.vec3(1.0, 0.94, 0.88);
      const diffuseLight = lemberLight(normal, viewDir, lightDir, lightColour);

      // Specular
      const specular = phongSpecular(normal, lightDir, viewDir);

      // Fake AO
      const ao = TSL.remap(TSL.pow(grassY, 2.0), 0.0, 1.0, 0.25, 1.0);
      const lighting = TSL.mul(diffuseLight, 0.5).add( TSL.mul(ambientLight, 0.5) );

      const color = baseColor.mul(lighting).add( specular.mul(0.25) );
      color.mulAssign( ao );
      // color.mulAssign( TSL.pow( color, TSL.vec3( TSL.float(1.0).div( 2.2 ) ) ) );
      return color;
    })();

    return {
      nodes: {
        colorNode: colorNode,
        positionNode: computeVertices,
        side: THREE.FrontSide,
        // toneMapped: false,
        // wireframe: true,
      },
      uniforms,
    };
  }, [ tileDataTexture, grassParams, worldOffset ]);

  return (
    <meshStandardNodeMaterial 
      ref={ material } 
      { ...nodes }
    />
  )
}

export default GrassMaterial;
