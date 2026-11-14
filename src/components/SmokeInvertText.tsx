// src/components/SmokeInvertText.tsx
// High-performance typography component supporting:
// 1. Dynamic smoke text inversion via hardware-accelerated difference blending
// 2. Character-by-character and word-by-word reveal transitions
// 3. Smooth cursor proximity micro-displacement (spring physics)
// 4. Subtle hover letter-spacing expansion
import React, { useEffect, useRef, useState } from 'react';
import { device } from '../lib/store';

interface SmokeInvertTextProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  children: React.ReactNode;
  className?: string;
  splitWords?: boolean;
  splitChars?: boolean;
  displacement?: boolean;
  invert?: boolean;
  style?: React.CSSProperties;
}

export const SmokeInvertText: React.FC<SmokeInvertTextProps> = ({
  as: Component = 'div',
  children,
  className = '',
  splitWords = false,
  splitChars = false,
  displacement = true,
  invert = true,
  style = {},
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Subtle cursor proximity micro-displacement
  useEffect(() => {
    if (!displacement || device.coarse || device.reduced) return;
    const el = containerRef.current;
    if (!el) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const maxDist = Math.max(rect.width, rect.height) * 0.85;

      if (dist < maxDist) {
        const factor = (1 - dist / maxDist) ** 2 * 6; // max 6px subtle displacement
        targetX = (dx / dist) * factor;
        targetY = (dy / dist) * factor;
      } else {
        targetX = 0;
        targetY = 0;
      }
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    const tick = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      if (Math.abs(currentX) > 0.01 || Math.abs(currentY) > 0.01 || targetX !== 0) {
        setOffset({ x: currentX, y: currentY });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [displacement]);

  const baseStyle: React.CSSProperties = {
    ...style,
    transform:
      displacement && (offset.x !== 0 || offset.y !== 0)
        ? `translate3d(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px, 0)`
        : style.transform,
  };

  const invertClasses = invert ? 'smoke-invert' : '';

  // Simple string splitting for character-by-character reveals
  if (typeof children === 'string' && (splitChars || splitWords)) {
    if (splitChars) {
      const chars = Array.from(children);
      return (
        <Component
          ref={containerRef as any}
          className={`${invertClasses} ${className} inline-block select-none transition-transform duration-300 ease-out`}
          style={baseStyle}
        >
          {chars.map((char, i) => (
            <span
              key={i}
              className="inline-block transition-[transform,letter-spacing,opacity] duration-300 hover:scale-105"
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </Component>
      );
    }

    if (splitWords) {
      const words = children.split(' ');
      return (
        <Component
          ref={containerRef as any}
          className={`${invertClasses} ${className} inline-block select-none transition-transform duration-300 ease-out`}
          style={baseStyle}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block mr-[0.25em] transition-[transform,opacity] duration-300 hover:-translate-y-0.5"
            >
              {word}
            </span>
          ))}
        </Component>
      );
    }
  }

  return (
    <Component
      ref={containerRef as any}
      className={`${invertClasses} ${className} select-none transition-transform duration-300 ease-out`}
      style={baseStyle}
    >
      {children}
    </Component>
  );
};
