// src/components/Navigation.tsx
// Minimal monochromatic navigation modeled after Vape.gg with dynamic theme blending.
import React, { useEffect, useState } from 'react';
import { scrollToTarget, subscribeUi, UiState } from '../lib/scroll';
import { AeroWordmark } from './AeroBrand';
import { MagnetButton } from './Interactive';

export const Navigation: React.FC = () => {
  const [ui, setUi] = useState<UiState>({ navTheme: 'light', active: '', scrolled: false });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    return subscribeUi(setUi);
  }, []);

  const isDark = ui.navTheme === 'dark';

  const navItems = [
    { label: 'Overview', target: '#hero' },
    { label: 'Pillars', target: '#tunnel' },
    { label: 'Philosophy', target: '#architecture' },
    { label: 'Visuals', target: '#showcase' },
    { label: 'Modules', target: '#features' },
    { label: 'Client UI', target: '#specifications' },
    { label: 'Access', target: '#pricing' },
  ];

  const handleNav = (target: string) => {
    setMobileOpen(false);
    scrollToTarget(target);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-40 transition-colors duration-500 ease-out ${
          ui.scrolled
            ? isDark
              ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/10'
              : 'bg-[#ffffff]/80 backdrop-blur-md border-b border-black/10'
            : 'bg-transparent'
        } ${isDark ? 'text-white' : 'text-[#050505]'}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo brand */}
          <button
            onClick={() => handleNav('#hero')}
            className="flex items-center gap-3 group focus-visible:outline-none"
            aria-label="AERO Home"
          >
            <AeroWordmark
              className="h-6 w-auto transition-transform duration-300 group-hover:scale-105"
              fill={isDark ? '#ffffff' : '#050505'}
            />
            <span className="font-mono text-[10px] tracking-widest uppercase opacity-40 px-1.5 py-0.5 border border-current rounded-none">
              v2.8
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[12px] uppercase font-mono tracking-widest">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item.target)}
                className="relative py-2 opacity-70 hover:opacity-100 transition-all duration-300 group tracking-widest"
              >
                <span className="inline-block transition-transform duration-300 group-hover:-translate-y-0.5">
                  {item.label}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-current transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => handleNav('#pricing')}
              className="text-[12px] uppercase font-mono tracking-widest opacity-70 hover:opacity-100 px-3 py-2"
            >
              Log In
            </button>
            <MagnetButton
              onClick={() => handleNav('#pricing')}
              className={`text-[11px] font-mono tracking-widest uppercase px-5 py-2.5 transition-all duration-300 ${
                isDark
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              Get Started
            </MagnetButton>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 focus-visible:outline-none"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-[2px] bg-current transition-transform duration-300 ${
                mobileOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`w-6 h-[2px] bg-current transition-opacity duration-300 ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`w-6 h-[2px] bg-current transition-transform duration-300 ${
                mobileOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-30 bg-black text-white flex flex-col justify-center px-10 transition-transform duration-500 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6 text-xl font-mono uppercase tracking-widest">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.target)}
              className="text-left py-2 border-b border-white/10 hover:pl-4 transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleNav('#pricing')}
            className="mt-6 w-full py-4 bg-white text-black text-center text-sm tracking-widest font-bold"
          >
            GET STARTED — ACCESS
          </button>
        </div>
      </div>
    </>
  );
};
