import React from 'react';
import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial, useTexture } from '@react-three/drei';
import { hash21 } from '../../shaders/hash21';
import { hash } from '../../shaders/hash';
import { easeOut } from '../../shaders/easeFunctions';
import { bezier, bezierGradient } from '../../shaders/bezier';
import { noise } from '../../shaders/noise';
import { rotateAxis, rotateY } from '../../shaders/rotation';
import { hemiLight, lemberLight, phongSpecular } from '../../shaders/lights';

const GrassShaderMaterial = shaderMaterial(
  {
    worldOffset: new THREE.Vector3(0, 0, 0),
    tileDataTexture: null,
    grassParams: new THREE.Vector4(1, 1, 1, 1),
    time: 0,
    resolution: new THREE.Vector2(1, 1) 
  },
  // vertex shader
  /*glsl*/`
    uniform vec4 grassParams;
    uniform float time;
    uniform vec3 worldOffset;
    uniform sampler2D tileDataTexture;

    varying vec2 vUv;
    varying vec3 vColor;
    varying vec4 vGrassData;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    uvec2 murmurHash21(uint src) {
      const uint M = 0x5bd1e995u;

      uvec2 h = uvec2(1190494759u, 2147483647u);

      src *= M;
      src ^= src >> 24u;

      h.x *= M;
      h.x ^= src;

      h.y *= M;
      h.y ^= src;

      h.x ^= h.x >> 13u;
      h.x *= M;
      h.x ^= h.x >> 15u;

      h.y ^= h.y >> 13u;
      h.y *= M;
      h.y ^= h.y >> 15u;

      return h;
    }

    vec2 hash21(float src) {
      uvec2 h = murmurHash21(floatBitsToUint(src));
      return uintBitsToFloat((h & 0x007fffffu) | 0x3f800000u) - 1.0;
    }
    vec3 hash( vec3 p ) {
      vec3 q = vec3( 
        dot(p, vec3(127.1, 311.7, 419.2)), 
        dot(p, vec3(269.5, 183.3, 371.9)), 
        dot(p, vec3(419.2, 371.9, 127.1)) );
      return -1.0 + 2.0 * fract(sin(q)*43758.5453);
    }

    mat3 rotateY(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat3(
        vec3(c, 0.0, s),
        vec3(0.0, 1.0, 0.0),
        vec3(-s, 0.0, c)
      );
    }
    
    mat3 rotateAxis(vec3 axis, float angle) {
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      return mat3(
        vec3(c + oc * axis.x * axis.x, oc * axis.x * axis.y + s * axis.z, oc * axis.x * axis.z - s * axis.y),
        vec3(oc * axis.x * axis.y - s * axis.z, c + oc * axis.y * axis.y, oc * axis.y * axis.z + s * axis.x),
        vec3(oc * axis.x * axis.z + s * axis.y, oc * axis.y * axis.z - s * axis.x, c + oc * axis.z * axis.z)
      );
    }

    float easeOut(float x, float t) {
      return 1.0 - pow(1.0 - x, t);
    }
    vec3 bezier(float t, vec3 p0, vec3 p1, vec3 p2, vec3 p3) {
      float u = 1.0 - t;
      float uu = u * u;
      float uuu = uu * u;
      float tt = t * t;
      float ttt = tt * t;

      return 
          uuu * p0 +
          3.0 * uu * t * p1 +
          3.0 * u * tt * p2 +
          ttt * p3;
    }
    
    vec3 bezierGradient(float t, vec3 p0, vec3 p1, vec3 p2, vec3 p3) {
      float u = 1.0 - t;
      return 
          3.0 * u * u * (p1 - p0) +
          6.0 * u * t * (p2 - p1) +
          3.0 * t * t * (p3 - p2);
    }

    float inverseLerp(float v, float minValue, float maxValue) {
      return (v - minValue) / (maxValue - minValue);
    }
    
    float remap(float value, float fromMin, float fromMax, float toMin, float toMax) {
      float t = inverseLerp(value, fromMin, fromMax);
      return mix(toMin, toMax, t);
    }
    float noise(in vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);

      // fade curve
      vec3 u = f * f * (3.0 - 2.0 * f);

      // 8 corner gradients
      float n000 = dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0));
      float n100 = dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
      float n010 = dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
      float n110 = dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));

      float n001 = dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
      float n101 = dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
      float n011 = dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
      float n111 = dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));

      // linear interpolation in 3D
      return mix(
          mix(
              mix(n000, n100, u.x),
              mix(n010, n110, u.x),
              u.y
          ),
          mix(
              mix(n001, n101, u.x),
              mix(n011, n111, u.x),
              u.y
          ),
          u.z
      );
    }
      float saturation( float x ) {
      return clamp(x, 0.0, 1.0);
    }

    const vec3 BASE_COLOR = vec3( 0.1, 0.4, 0.04 );
    const vec3 TIP_COLOR = vec3( 0.5, 0.7, 0.3 );
    
    void main() {
      // get params
      int SEGMENTS = int(grassParams.x);
      int VERTICES = (SEGMENTS + 1) * 2;
      float PATCH_SIZE = grassParams.y;
      float WIDTH = grassParams.z;
      float HEIGHT = grassParams.w;

      // Figure out grass offset
      vec2 hashedInstanceID = hash21(float( gl_InstanceID )) * 2.0 - 1.0;
      vec3 grassOffset = vec3( hashedInstanceID.x, 0.0, hashedInstanceID.y ) * PATCH_SIZE;
      
      vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
      vec3 hashVal = hash( grassBladeWorldPos );

      // Grass rotation
      const float PI = 3.14159265358979323846;
      float angle = remap( hashVal.x, -1.0, 1.0, -PI, PI );

      vec2 tileUV = vec2(-grassBladeWorldPos.x, grassBladeWorldPos.z);
      tileUV -= worldOffset.xz;
      vec4 tileData = texture2D(tileDataTexture, tileUV / PATCH_SIZE * 0.5 + 0.5);

      // Stiffness
      float stiffness = 1.0 - tileData.x * 0.5;
      float tileGrassHeight = 1.0 - tileData.x;
      tileGrassHeight = remap(tileGrassHeight, 0.0, 1.0, 1.0, 1.2);

      // Figure out vertex id, > grass vertices is other side
      int vertFB_ID = gl_VertexID % (VERTICES * 2);
      int vertID = vertFB_ID % VERTICES;

      // 0 = left, 1 = right
      int xTest = vertID & 0x1;
      int zTest = (vertFB_ID >= VERTICES) ? 1 : -1;

      float xSide = float(xTest);
      float zSide = float(zTest);
      float heightPercent = float(vertID - xTest) / (float( SEGMENTS ) * 2.0);
      float height = HEIGHT * tileGrassHeight;
      float width = WIDTH * easeOut(1.0 - heightPercent, 4.0) * tileGrassHeight;

      // Calculate the vertex position
      float x = (xSide - 0.5) * width;
      float y = heightPercent * height;
      float z = 0.0;

      // Calculate lean factor
      float windStrangth = noise(vec3(grassBladeWorldPos.xz * 0.05, 0.0) + time * 0.4);
      float windAngle = 0.0;
      vec3 windAxis = vec3( cos(windAngle), 0.0, sin(windAngle) );
      float windLeanAngle = windStrangth * 1.5 * heightPercent * stiffness;

      float randomLeanAnimation = noise(vec3( grassBladeWorldPos.xz, time * 1.5 )) * ( windStrangth * 0.5 + 0.125);
      float leanFactor = remap(hashVal.y, -1.0, 1.0, -0.5, 0.5) + randomLeanAnimation;

      // Add bezier curve
      vec3 p0 = vec3( 0.0 );
      vec3 p1 = vec3( 0.0, 0.33, 0.0 );
      vec3 p2 = vec3( 0.0, 0.66, 0.0 );
      vec3 p3 = vec3( 0.0, cos(leanFactor), sin(leanFactor) );
      vec3 curve = bezier(heightPercent, p0, p1, p2, p3);

      // Calculate normal
      vec3 curveGradient = bezierGradient(heightPercent, p0, p1, p2, p3);
      mat2 curveRot90 = mat2(0.0, 1.0, -1.0, 0.0) * -zSide;
      
      // Apply curve
      y = curve.y * height;
      z = curve.z * height;

      // Generate grass matrix
      mat3 grassMatrix =  rotateAxis(windAxis, windLeanAngle) * rotateY(angle);

      vec3 grasslocalPosition = grassMatrix * vec3( x, y, z ) + grassOffset;
      vec3 grassLocalNormal = grassMatrix * vec3( 0.0, curveRot90 * curveGradient.yz );

      // Blend normal
      float distanceBlend = smoothstep(0.0, 10.0, distance(cameraPosition, grassBladeWorldPos));
      grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend * 0.5);
      grassLocalNormal = normalize(grassLocalNormal);

      // View thikness
      vec4 mvPosition = modelViewMatrix * vec4(grasslocalPosition, 1.0);
      vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
      vec3 grassFaceNormal = (grassMatrix * vec3(0.0, 0.0, -zSide));
      float viewDotNormal = saturation(dot( grassFaceNormal, viewDir ));
      float viewSpaceThiknessFactor = easeOut( 1.0 - viewDotNormal, 4.0 ) * smoothstep(0.0, 0.2, viewDotNormal);

      mvPosition.x += viewSpaceThiknessFactor * (xSide - 0.5) * width * 0.5 * -zSide;

      gl_Position = projectionMatrix * mvPosition;
      
      // Varyings
      vUv = uv;
      vNormal = normalize(( modelMatrix * vec4(grassLocalNormal, 0.0) ).xyz);

      vec3 c1 = mix(BASE_COLOR, TIP_COLOR, heightPercent);
      vec3 c2 = mix( vec3(0.6,0.6, 0.4), vec3(0.88, 0.87, 0.52), heightPercent );
      float noiseVal = noise( grassBladeWorldPos * 0.1 );
      vColor = mix(c1, c2, smoothstep(-1.0, 1.0, noiseVal));
      
      vWorldPosition = (modelMatrix * vec4(grasslocalPosition, 1.0)).xyz;
      vGrassData = vec4( x, heightPercent, 0.0, 0.0 );
    }
  `,
  // fragment shader
  /*glsl*/`
    uniform float time;
    varying vec2 vUv;
    varying vec3 vColor;
    varying vec4 vGrassData;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    float saturation( float x ) {
      return clamp(x, 0.0, 1.0);
    }
    
    float inverseLerp(float v, float minValue, float maxValue) {
      return (v - minValue) / (maxValue - minValue);
    }
    
    float remap(float value, float fromMin, float fromMax, float toMin, float toMax) {
      float t = inverseLerp(value, fromMin, fromMax);
      return mix(toMin, toMax, t);
    }

    vec3 lemberLight(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColour) {
      float wrap = 24.5;
      float ambient = 0.3;
      float dotNL = saturation( (dot(normal, lightDir) + wrap) / (1.0 + wrap) );
      vec3 lighting = vec3(dotNL);

      float backlight = saturation((dot(viewDir, -lightDir) + wrap) / (1.0 + wrap));
      vec3 scatter = vec3(pow(backlight, 2.0));
      
      lighting += scatter;
      lighting *= lightColour;
      lighting *= (1.0 - ambient);

      return lighting + vec3(ambient);
    }

    vec3 hemiLight(vec3 normal, vec3 groundColor, vec3 skyColor) {
      float hemi = 0.5 * normal.y + 0.5;
      return mix(groundColor, skyColor, hemi);
    }

    vec3 phongSpecular( vec3 normal, vec3 lightDir, vec3 viewDir ) {
      float dotNL = saturation(dot( normal, lightDir ));
      vec3 r = normalize(reflect(-lightDir, normal));
      float phongValue = max(0.0, dot( viewDir, r ));
      phongValue = pow(phongValue, 32.0);

      vec3 specular = dotNL * vec3(phongValue);
      return specular;
    }

    void main() {
      float grassX = vGrassData.x;
      float grassY = vGrassData.y;
      vec3 normal = normalize( vNormal );
      vec3 viewDir = normalize( cameraPosition - vWorldPosition );


      vec3 baseColor = mix( 
        vColor * 0.75, 
        vColor, 
        smoothstep(0.125, 0.0, abs( grassX )) 
      );
      
      // calculate hemi light
      vec3 c1 = vec3(1.0, 1.0, 0.75);
      vec3 c2 = vec3(0.5, 0.5, 0.25);
      vec3 ambientLight = hemiLight(normal, c2, c1);
      
      // Directional light
      vec3 lightDir = normalize( vec3( 1.0, 2.5, 1.0 ) );
      vec3 lightColour = vec3(1.0, 0.94, 0.88);
      vec3 diffuseLight = lemberLight(normal, viewDir, lightDir, lightColour);

      // Specular
      vec3 specular = phongSpecular(normal, lightDir, viewDir);

      // Fake AO
      float ao = remap(pow(grassY, 2.0), 0.0, 1.0, 0.25, 1.0);
      vec3 lighting = diffuseLight * 0.5 + ambientLight * 0.5;
      
      vec3 colour = baseColor * lighting + specular * 0.25;
      colour *= ao;

      // gl_FragColor = vec4(pow(colour, vec3(1.0 / 2.2)), 1.0);
      gl_FragColor = vec4(colour, 1.0);
    }
  `
)

// declaratively
// extend({ GrassShaderMaterial });

function GrassMaterial({ worldOffset = [0, 0, 0], grassParams = [1, 1, 1, 1], positionsArray = [], vertexCount = 0, ...delegated}) {
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
      const curveRot90 = TSL.mat2(0.0, 1.0, -1.0, 0.0).mul( zSide.negate() );

      // Add curve to position
      vY = height.mul( curve.y );
      vZ = height.mul( curve.z );

      // Generate grass matrix
      const grassMatrix = TSL.mul(
        TSL.mat3( rotateAxis( windAxis, windLeanAngle ) ),
        TSL.mat3( rotateY(angle) )
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
      color.mulAssign( TSL.pow( color, TSL.vec3( TSL.float(1.0).div( 2.2 ) ) ) );
      return color;
    })();

    return {
      nodes: {
        colorNode: colorNode,
        positionNode: computeVertices,
        side: THREE.FrontSide,
        toneMapped: false,
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
