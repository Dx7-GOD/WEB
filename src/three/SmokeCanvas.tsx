// src/three/SmokeCanvas.tsx
// Two-layer WebGL rendering pipeline:
// 1. SceneBack (background smoke puffs + thousands of dust points) renders into a
//    fixed WebGL canvas behind the HTML content (z-index 0).
// 2. SceneFront (foreground soft wisps) renders into a second fixed WebGL canvas
//    above the HTML content (z-index 40, pointer-events none).
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { device, scene } from '../lib/store';
import { DustSystem } from './DustSystem';
import { PuffSystem } from './PuffSystem';
import { bakeSmokeTextures } from './textures';

export const SmokeCanvas: React.FC = () => {
  const backRef = useRef<HTMLCanvasElement | null>(null);
  const frontRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cBack = backRef.current;
    const cFront = frontRef.current;
    if (!cBack || !cFront) return;

    let destroyed = false;
    let animId = 0;

    // Renderer options
    const pixelRatio = Math.min(window.devicePixelRatio || 1, device.low ? 1.25 : 1.75);

    const glBack = new THREE.WebGLRenderer({
      canvas: cBack,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    glBack.setPixelRatio(pixelRatio);
    glBack.toneMapping = THREE.NoToneMapping;

    const glFront = new THREE.WebGLRenderer({
      canvas: cFront,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    glFront.setPixelRatio(pixelRatio);
    glFront.toneMapping = THREE.NoToneMapping;

    const { atlas, warp } = bakeSmokeTextures(glBack, device.low);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const sBack = new THREE.Scene();
    const sFront = new THREE.Scene();

    // Particle counts
    const backPuffCount = device.low ? 160 : 340;
    const frontPuffCount = device.low ? 30 : 64;
    const dustCount = device.low ? 3500 : 9000;

    const puffsBack = new PuffSystem(backPuffCount, 'back', atlas.texture, warp.texture);
    const puffsFront = new PuffSystem(frontPuffCount, 'front', atlas.texture, warp.texture);
    const dust = new DustSystem(dustCount);

    sBack.add(puffsBack.mesh);
    sBack.add(dust.points);
    sFront.add(puffsFront.mesh);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      glBack.setSize(w, h, false);
      glFront.setSize(w, h, false);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let lastTime = performance.now();
    let totalTime = 0;

    const clockTick = () => {
      if (destroyed) return;
      const now = performance.now();
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      totalTime += dt;

      const aspect = camera.aspect;
      const ax = Math.min(1.4, Math.max(0.7, aspect / (16 / 9)));

      // Subtle parallax on camera
      const p = scene.pointer;
      const camTargetX = p.active ? p.x * 0.45 : 0;
      const camTargetY = p.active ? p.y * 0.35 : 0;
      camera.position.x += (camTargetX - camera.position.x) * Math.min(1, dt * 3.5);
      camera.position.y += (camTargetY - camera.position.y) * Math.min(1, dt * 3.5);
      camera.lookAt(0, 0, 0);

      // Updates
      puffsBack.update(dt, totalTime, camera, scene, ax);
      puffsFront.update(dt, totalTime, camera, scene, ax);
      dust.update(totalTime, dt, camera, scene, ax, pixelRatio);

      // Render both viewports
      glBack.render(sBack, camera);
      glFront.render(sFront, camera);

      if (!scene.ready) scene.ready = true;

      animId = requestAnimationFrame(clockTick);
    };

    animId = requestAnimationFrame(clockTick);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      puffsBack.dispose();
      puffsFront.dispose();
      dust.dispose();
      atlas.dispose();
      warp.dispose();
      glBack.dispose();
      glFront.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={backRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />
      <canvas
        ref={frontRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-40"
      />
    </>
  );
};
