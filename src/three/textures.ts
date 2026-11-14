// src/three/textures.ts
// One-off GPU bakes: smoke puff atlas (with normals) and tileable flow noise.
import * as THREE from 'three';
import { atlasFrag, fullscreenVert, warpFrag } from './shaders';

function bake(gl: THREE.WebGLRenderer, frag: string, size: number, mip: boolean, wrap: THREE.Wrapping) {
  const rt = new THREE.WebGLRenderTarget(size, size, {
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    magFilter: THREE.LinearFilter,
    minFilter: mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
    generateMipmaps: mip,
    wrapS: wrap,
    wrapT: wrap,
    depthBuffer: false,
  });
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({ vertexShader: fullscreenVert, fragmentShader: frag, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(quad);
  const prev = gl.getRenderTarget();
  gl.setRenderTarget(rt);
  gl.render(scene, cam);
  gl.setRenderTarget(prev);
  quad.geometry.dispose();
  mat.dispose();
  return rt;
}

export function bakeSmokeTextures(gl: THREE.WebGLRenderer, low: boolean) {
  const atlas = bake(gl, atlasFrag, low ? 512 : 1024, true, THREE.ClampToEdgeWrapping);
  const warp = bake(gl, warpFrag, 256, false, THREE.RepeatWrapping);
  return { atlas, warp };
}
