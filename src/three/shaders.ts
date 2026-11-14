// src/three/shaders.ts
// GLSL for the smoke system. Three.js ShaderMaterial (GLSL3 auto-conversion).

const SIMPLEX3 = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const fullscreenVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Bakes a 2x2 atlas of billowing smoke puffs: r = density, gb = normal.xy */
export const atlasFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
${SIMPLEX3}
float fbm(vec3 p){
  float s=0.0, a=0.5;
  for(int i=0;i<5;i++){ s+=a*snoise(p); p=p*2.02+vec3(1.7,9.2,3.1); a*=0.5; }
  return s;
}
float billow(vec3 p){
  float s=0.0, a=0.5;
  for(int i=0;i<4;i++){ s+=a*(1.0-abs(snoise(p))); p=p*2.11+vec3(4.1,2.3,7.7); a*=0.5; }
  return s;
}
float puff(vec2 q, float seed){
  float r = length(q);
  vec3 p = vec3(q*1.25, seed*3.71);
  vec3 w = vec3(fbm(p+vec3(0.0,0.0,1.7)), fbm(p+vec3(5.2,1.3,2.8)), 0.0);
  float n = fbm(p*1.5 + w*0.85);
  float b = billow(p*2.1 + w*0.7);
  float shape = 1.0 - r*(1.18 - 0.42*n);
  float d = smoothstep(0.0, 0.6, shape);
  d *= 0.42 + 0.72*b;
  d *= smoothstep(1.0, 0.78, r);
  return clamp(d, 0.0, 1.0);
}
void main(){
  vec2 cell = floor(vUv*2.0);
  vec2 lu = fract(vUv*2.0);
  float seed = cell.x + cell.y*2.0 + 1.0;
  vec2 q = lu*2.0 - 1.0;
  float d = puff(q, seed);
  float e = 3.0/512.0;
  float gx = (puff(q+vec2(e,0.0),seed) - puff(q-vec2(e,0.0),seed))/(2.0*e);
  float gy = (puff(q+vec2(0.0,e),seed) - puff(q-vec2(0.0,e),seed))/(2.0*e);
  vec3 ng = normalize(vec3(-gx*0.22, -gy*0.22, 1.0));
  float r = min(length(q), 0.999);
  vec3 ns = vec3(q, sqrt(1.0 - r*r));
  vec3 n = normalize(ns*0.55 + ng);
  gl_FragColor = vec4(d, n.x*0.5+0.5, n.y*0.5+0.5, 1.0);
}
`;

/** Tileable 2-channel value-noise fbm used to animate puff interiors */
export const warpFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
float hash(vec2 p, float s){ return fract(sin(dot(p + s*17.13, vec2(127.1,311.7)))*43758.5453); }
float pnoise(vec2 p, float P, float s){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash(mod(i,P), s);
  float b = hash(mod(i+vec2(1.0,0.0),P), s);
  float c = hash(mod(i+vec2(0.0,1.0),P), s);
  float d = hash(mod(i+vec2(1.0,1.0),P), s);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float pfbm(vec2 uv, float s){
  float sum=0.0, a=0.5, P=4.0;
  for(int i=0;i<5;i++){ sum += a*pnoise(uv*P, P, s); P*=2.0; a*=0.5; }
  return sum/0.96875;
}
void main(){
  gl_FragColor = vec4(pfbm(vUv, 0.0), pfbm(vUv, 1.0), pfbm(vUv, 2.0), 1.0);
}
`;

export const puffVert = /* glsl */ `
attribute vec3 iOffset;
attribute vec4 iData;   // scale, rotation, alpha, variant
attribute float iSeed;
uniform float uNear;
varying vec2 vUv;
varying float vAlpha;
varying float vRot;
varying float vSeed;
varying float vDepth;
varying vec2 vCell;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(iOffset, 1.0);
  mv.xy += position.xy * iData.x;
  float dist = -mv.z;
  float a = iData.z;
  a *= smoothstep(uNear, uNear + 2.6, dist);
  a *= 1.0 - smoothstep(34.0, 46.0, dist);
  vAlpha = a;
  vRot = iData.y;
  vSeed = iSeed;
  vDepth = dist;
  float v = iData.w;
  vCell = vec2(mod(v, 2.0), floor(v / 2.0)) * 0.5;
  gl_Position = projectionMatrix * mv;
}
`;

export const puffFrag = /* glsl */ `
precision highp float;
uniform sampler2D uAtlas;
uniform sampler2D uWarp;
uniform float uTime;
uniform float uInvert;
uniform vec3 uLight;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
varying float vRot;
varying float vSeed;
varying float vDepth;
varying vec2 vCell;
void main(){
  if (vAlpha < 0.002) discard;
  vec2 c = vUv - 0.5;
  float cs = cos(vRot), sn = sin(vRot);
  vec2 t = vec2(cs*c.x - sn*c.y, sn*c.x + cs*c.y);

  // slow internal turbulence: two scales of tileable flow noise
  vec2 w1 = texture2D(uWarp, t*0.55 + vec2(vSeed, uTime*0.011)).rg - 0.5;
  vec2 w2 = texture2D(uWarp, t*1.35 + vec2(uTime*0.019, vSeed*1.7)).gb - 0.5;
  vec2 tw = t + w1*0.17 + w2*0.06;

  vec2 suv = clamp(tw + 0.5, 0.004, 0.996) * 0.5 + vCell;
  vec4 s = texture2D(uAtlas, suv);
  float d = s.r;
  float a = d * vAlpha * uOpacity * smoothstep(0.5, 0.36, length(c));
  if (a < 0.002) discard;

  // normal back into screen space
  vec2 nt = s.gb*2.0 - 1.0;
  vec2 nxy = vec2(cs*nt.x + sn*nt.y, -sn*nt.x + cs*nt.y);
  vec3 n = normalize(vec3(nxy, sqrt(max(0.0, 1.0 - dot(nxy, nxy)))));
  float diff = clamp(dot(n, uLight), 0.0, 1.0);
  float top = n.y*0.5 + 0.5;
  float dens = smoothstep(0.05, 0.95, d);

  // black smoke: velvety core, softly lit billow tops, translucent edges
  float lumD = mix(0.26, 0.025, dens) + diff*0.2*(1.0 - dens*0.55) + top*0.05;
  // white smoke: bright lit faces, cool-grey self shadow
  float lumL = mix(0.58, 0.98, dens) * mix(0.62, 1.0, diff*0.75 + top*0.25);
  float lum = mix(lumD, lumL, uInvert);

  // aerial perspective: far puffs dissolve into the paper
  float fog = smoothstep(12.0, 34.0, vDepth);
  lum = mix(lum, 1.0 - uInvert, fog*0.45);
  a *= 1.0 - fog*0.35;

  gl_FragColor = vec4(vec3(lum)*a, a);
}
`;

export const compositeFrag = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
varying vec2 vUv;
void main(){
  gl_FragColor = texture2D(uTex, vUv);
}
`;

export const dustVert = /* glsl */ `
attribute vec4 aR;
attribute vec4 aS;
uniform float uTime;
uniform float uFormA;
uniform float uFormB;
uniform float uMix;
uniform float uLocalA;
uniform float uLocalB;
uniform float uIntro;
uniform float uPixel;
uniform float uAx;
uniform float uVel;
uniform float uPulse;
uniform float uCamZ;
uniform vec3 uMouse;
uniform float uMouseOn;
uniform vec2 uTilt;
varying float vAlpha;
varying float vBig;
const float PI = 3.14159265;

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c); }

vec4 form(float f, float lp){
  vec3 p = vec3(0.0);
  float a = 1.0;
  float t = uTime;
  if (f < 0.5 || (f > 7.5 && f < 8.5)) {
    float grow = f > 7.5 ? 1.08 : 1.0;
    if (aS.x < 0.6) {
      // speckle halo hugging the cloud silhouette
      float th = aR.x * 6.2831853;
      float rr = mix(0.7, 1.32, pow(aR.y, 0.6));
      float bump = 1.0 + 0.12*sin(th*5.0 + aS.y*3.0);
      p = vec3(cos(th)*4.9*rr*bump*uAx*grow, sin(th)*2.35*rr*bump + 0.25, (aR.z-0.5)*3.0);
      p.xy += vec2(sin(t*0.21 + aR.w*20.0), cos(t*0.17 + aR.z*20.0)) * 0.09;
      a = 0.85;
    } else {
      // ink spray falling from the underside
      float fall = fract(aR.y + t*(0.012 + aR.w*0.022));
      p = vec3((aR.x-0.5)*4.4*uAx*(0.55 + fall*0.7)*grow, -1.35 - fall*2.8, (aR.z-0.5)*2.0);
      a = (1.0 - fall) * smoothstep(0.0, 0.08, fall);
    }
  } else if (f < 1.5) {
    float z = mod(aR.z*48.0 + lp*78.0 + t*0.7, 48.0) - 38.0;
    p = vec3((aR.x-0.5)*18.0*max(uAx,0.7), (aR.y-0.5)*11.0, z);
    a = smoothstep(-38.0, -30.0, z) * 0.9;
  } else if (f < 2.5) {
    float s = aR.x*2.0 - 1.0;
    float off = mix(-6.5, 6.5, lp) * uAx + t*0.05;
    p = vec3(s*10.5*uAx + off, sin(s*2.3 + 1.1 + t*0.08)*0.95 + (aR.y-0.5)*2.4*(1.0-abs(s)*0.5), (aR.z-0.5)*3.0);
    a = 0.7 * (1.0 - abs(s)*0.5);
  } else if (f < 3.5) {
    vec3 dir = normalize(vec3(aR.x-0.5, (aR.y-0.5)*0.62, (aR.z-0.5)*0.5) + 1e-4);
    float sp = 0.55 + aR.w*1.5;
    float k = pow(lp, 1.2);
    p = dir * (0.6 + aS.y*1.6 + k*10.0*sp);
    p.x *= mix(1.0, uAx, 0.5);
    p.y -= k*k*1.8*aS.z;
    a = 1.0 - smoothstep(0.55, 1.0, lp)*0.8;
  } else if (f > 5.5 && f < 6.5) {
    // 3D particle cloud: fuzzy sphere that follows the scroll, then dissolves
    float th = aR.x * 6.2831853;
    float ph = acos(2.0*aR.y - 1.0);
    float rad = 2.05 * (0.74 + 0.26*pow(aR.z, 0.35));
    vec3 sp = vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th)) * rad;
    sp *= 1.0 + 0.09*sin(th*6.0 + t*0.5 + lp*9.0)*sin(ph*5.0 + t*0.3);
    float ang = lp*5.0 + t*0.09;
    sp = rotX(0.38 + uTilt.y*0.35) * rotY(ang + uTilt.x*0.5) * sp;
    float side = mix(1.0, -1.0, smoothstep(0.12, 0.62, lp));
    p = sp + vec3(side*2.7*uAx, mix(0.35, -0.2, lp), 0.0);
    float dis = smoothstep(0.6, 1.0, lp);
    vec3 dd = normalize(sp + (vec3(aR.w, aS.y, aS.z) - 0.5)*2.2);
    p += dd * dis * (1.5 + aR.w*7.0) + vec3(0.0, dis*dis*2.5*(aS.y-0.3), 0.0);
    a = 1.0 - dis*(0.55 + 0.45*aR.w);
    a *= 0.75 + 0.25*smoothstep(-rad, rad, sp.z);
  } else {
    p = vec3((aR.x-0.5)*16.0*uAx, (aR.y-0.5)*9.0, (aR.z-0.5)*6.0 - 1.0);
    p.y += sin(t*0.1 + aR.w*30.0)*0.3;
    p.x += cos(t*0.07 + aR.z*30.0)*0.3;
    if (f > 8.5) {
      float rise = fract(aR.y + t*0.025*(0.5 + aR.w));
      p.y = -4.6 + rise*5.0;
      a = (1.0 - rise);
    }
    a *= 0.5 * step(aS.x, 0.5);
  }
  return vec4(p, a);
}

void main(){
  vec4 A = form(uFormA, uLocalA);
  vec4 B = form(uFormB, uLocalB);
  float m = smoothstep(0.0, 1.0, clamp(uMix*1.4 - aS.w*0.4, 0.0, 1.0));
  vec3 p = mix(A.xyz, B.xyz, m);
  float a = mix(A.w, B.w, m);

  // swirl while morphing between formations
  float sw = sin(m*PI);
  p += vec3(sin(aR.x*40.0 + uTime*0.3), cos(aR.y*40.0 + uTime*0.25), sin(aR.z*40.0 + uTime*0.2)) * sw * 1.3;

  // intro: tiny particles bloom from the centre
  vec3 c0 = (aR.xyz - 0.5) * vec3(0.9, 0.55, 0.5) * (0.15 + uIntro*1.6);
  p = mix(c0, p, smoothstep(0.16, 0.78, uIntro + (aR.z - 0.5)*0.12));
  a *= smoothstep(0.0, 0.12, uIntro - aR.y*0.1);

  // scroll speed & navigation pulses scatter the dust
  p += normalize(p + 1e-3) * (abs(uVel)*1.3 + uPulse*2.2) * aR.w;

  // cursor wake
  vec2 mw = uMouse.xy * (uCamZ - p.z) / uCamZ;
  vec2 dm = p.xy - mw;
  float fm = exp(-dot(dm, dm)*1.1) * uMouseOn;
  p.xy += normalize(dm + 1e-4) * fm * 0.85;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = max(0.05, -mv.z);
  a *= smoothstep(0.4, 2.4, depth);
  float big = pow(aS.y, 14.0);
  vBig = big;
  vAlpha = a;
  float size = mix(1.1, 3.0, aR.w) + big*8.0;
  gl_PointSize = clamp(size * uPixel * (10.0 / depth), 1.0, 48.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const dustFrag = /* glsl */ `
precision highp float;
uniform float uInvert;
varying float vAlpha;
varying float vBig;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float e = smoothstep(0.5, 0.5 - mix(0.42, 0.12, vBig), r);
  float a = vAlpha * e;
  if (a < 0.004) discard;
  float lum = mix(0.03, 0.96, uInvert);
  gl_FragColor = vec4(vec3(lum)*a, a);
}
`;
