// src/components/AeroBrand.tsx
// Exact vector reproduction and pixel mark matching the original AERO brand identity.
import React from 'react';
import brandMeta from '../brand-meta.json';

interface WordmarkProps {
  className?: string;
  fill?: string;
}

export const AeroWordmark: React.FC<WordmarkProps> = ({ className = 'h-7 w-auto', fill = 'currentColor' }) => {
  const { pxWidth, pxHeight, path } = brandMeta.wordmark;
  return (
    <svg
      viewBox={`0 0 ${pxWidth} ${pxHeight}`}
      className={`inline-block select-none overflow-visible ${className}`}
      aria-label="AERO"
      role="img"
    >
      <path d={path} fill={fill} />
    </svg>
  );
};

interface LogoCloudProps {
  className?: string;
  wordmarkClassName?: string;
}

export const AeroCloudLogo: React.FC<LogoCloudProps> = ({
  className = 'w-full max-w-[620px]',
  wordmarkClassName = '',
}) => {
  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Cloud formation from supplied master artwork */}
      <img
        src="/brand/aero-cloud.png"
        alt=""
        aria-hidden="true"
        className="w-full h-auto block select-none pointer-events-none drop-shadow-2xl"
      />
      {/* Pixel wordmark in exact center matching original anchor coordinates */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: 'translate(0.5%, -3%)',
        }}
      >
        <AeroWordmark
          fill="#ffffff"
          className={`w-[36%] max-w-[360px] h-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] ${wordmarkClassName}`}
        />
      </div>
    </div>
  );
};
