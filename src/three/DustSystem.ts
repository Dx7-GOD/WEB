// src/three/DustSystem.ts
// GPU ink dust: thousands of points whose formations are evaluated entirely in
// the vertex shader (no per-frame CPU work besides a handful of uniforms).
import * as THREE from 'three';
import { mulberry32 } from './noise';
import { dustFrag, dustVert } from './shaders';

export class DustSystem {
  readonly points: THREE.Points;
  readonly material: THREE.ShaderMaterial;
  private geo: THREE.BufferGeometry;
  private tilt = new THREE.Vector2();

  constructor(count: number) {
    const rnd = mulberry32(2026);
    const aR = new Float32Array(count * 4);
    const aS = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i++) {
      aR[i] = rnd();
      aS[i] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aR', new THREE.BufferAttribute(aR, 4));
    geo.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
    this.geo = geo;

    this.material = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      uniforms: {
        uTime: { value: 0 },
        uFormA: { value: 0 },
        uFormB: { value: 0 },
        uMix: { value: 0 },
        uLocalA: { value: 0 },
        uLocalB: { value: 0 },
        uIntro: { value: 0 },
        uPixel: { value: 1 },
        uAx: { value: 1 },
        uVel: { value: 0 },
        uPulse: { value: 0 },
        uCamZ: { value: 10 },
        uMouse: { value: new THREE.Vector3() },
        uMouseOn: { value: 0 },
        uTilt: { value: new THREE.Vector2() },
        uInvert: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  update(
    t: number,
    dt: number,
    cam: THREE.PerspectiveCamera,
    st: {
      formA: number; formB: number; mix: number; localA: number; localB: number;
      intro: number; theme: number; velocity: number; pulse: number;
      pointer: { x: number; y: number; active: boolean };
    },
    ax: number,
    pixel: number,
  ) {
    const u = this.material.uniforms;
    u.uTime.value = t;
    u.uFormA.value = st.formA;
    u.uFormB.value = st.formB;
    u.uMix.value = st.mix;
    u.uLocalA.value = st.localA;
    u.uLocalB.value = st.localB;
    u.uIntro.value = st.intro;
    u.uInvert.value = st.theme;
    u.uVel.value = st.velocity;
    u.uPulse.value = st.pulse;
    u.uAx.value = ax;
    u.uPixel.value = pixel;
    u.uCamZ.value = cam.position.z;
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
    (u.uMouse.value as THREE.Vector3).set(st.pointer.x * halfH * cam.aspect, st.pointer.y * halfH, 0);
    u.uMouseOn.value += ((st.pointer.active ? 1 : 0) - u.uMouseOn.value) * Math.min(1, dt * 4);
    this.tilt.lerp(new THREE.Vector2(st.pointer.x, st.pointer.y), Math.min(1, dt * 2.5));
    (u.uTilt.value as THREE.Vector2).copy(this.tilt);
  }

  dispose() {
    this.geo.dispose();
    this.material.dispose();
  }
}
