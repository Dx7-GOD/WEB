// src/components/Interactive.tsx
import React, { useEffect, useRef, useState } from 'react';
import { device } from '../lib/store';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (device.coarse || device.reduced) return;
    document.documentElement.classList.add('has-cursor');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let animId = 0;

    const onPointerMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      setActive(true);

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = !!target.closest('button, a, [data-hover], .smoke-invert, input, select');
        setHovered(isInteractive);
      }
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (device.coarse || device.reduced) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Precision center dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-current mix-blend-difference pointer-events-none transition-transform duration-100 ease-out ${
          clicked ? 'scale-50' : hovered ? 'scale-150' : 'scale-100'
        }`}
      />
      {/* Outer reactive ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 -ml-5 -mt-5 rounded-full border border-current mix-blend-difference pointer-events-none transition-[width,height,transform,opacity] duration-200 ease-out ${
          hovered
            ? 'w-14 h-14 -ml-7 -mt-7 border-white opacity-80 scale-100'
            : clicked
            ? 'w-8 h-8 -ml-4 -mt-4 opacity-100 scale-90'
            : 'w-10 h-10 -ml-5 -mt-5 opacity-40 scale-100'
        }`}
      />
    </div>
  );
};

interface MagnetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magnetic?: boolean;
}

export const MagnetButton: React.FC<MagnetButtonProps> = ({
  children,
  magnetic = true,
  className = '',
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = btnRef.current;
    if (!el || !magnetic || device.coarse) return;

    let x = 0;
    let y = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Gentle, luxurious magnetic displacement
      x = (e.clientX - cx) * 0.28;
      y = (e.clientY - cy) * 0.28;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.02)`;
    };

    const onMouseLeave = () => {
      el.style.transform = `translate3d(0, 0, 0) scale(1)`;
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [magnetic]);

  return (
    <button
      ref={btnRef}
      className={`relative inline-flex items-center justify-center transition-all duration-300 ease-out active:scale-95 group overflow-hidden ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
};
