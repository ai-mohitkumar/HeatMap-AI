import { useState, useEffect } from 'react';

export type DisplayMode = 'auto' | 'mobile' | 'desktop';

export interface ResponsiveState {
  isMobile: boolean;
  viewportWidth: number;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

export function useResponsiveMode(breakpoint = 768): ResponsiveState {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('heatshield_display_mode');
      if (saved === 'mobile' || saved === 'desktop') return saved;
    }
    return 'auto';
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setDisplayMode = (mode: DisplayMode) => {
    setDisplayModeState(mode);
    if (typeof window !== 'undefined') {
      if (mode === 'auto') {
        localStorage.removeItem('heatshield_display_mode');
      } else {
        localStorage.setItem('heatshield_display_mode', mode);
      }
    }
  };

  const isMobile =
    displayMode === 'mobile'
      ? true
      : displayMode === 'desktop'
      ? false
      : windowWidth < breakpoint;

  return {
    isMobile,
    viewportWidth: windowWidth,
    displayMode,
    setDisplayMode
  };
}
