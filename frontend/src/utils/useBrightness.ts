import { useState, useEffect, useCallback } from 'react';

export type BrightnessPreset = 'outdoor' | 'standard' | 'night' | 'custom';

export interface BrightnessSettings {
  brightness: number; // 50 to 150
  contrast: number;   // 75 to 140
  saturation: number; // 80 to 130
  activePreset: BrightnessPreset;
}

const STORAGE_KEY = 'heatshield_brightness_config';

const PRESETS: Record<Exclude<BrightnessPreset, 'custom'>, Omit<BrightnessSettings, 'activePreset'>> = {
  outdoor: {
    brightness: 130,
    contrast: 125,
    saturation: 115
  },
  standard: {
    brightness: 100,
    contrast: 100,
    saturation: 100
  },
  night: {
    brightness: 75,
    contrast: 90,
    saturation: 95
  }
};

const getDefaultSettings = (): BrightnessSettings => {
  if (typeof window === 'undefined') {
    return { ...PRESETS.standard, activePreset: 'standard' };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[useBrightness] Failed to read settings from localStorage:', e);
  }
  return { ...PRESETS.standard, activePreset: 'standard' };
};

const applyFilterToDOM = (settings: BrightnessSettings) => {
  if (typeof document === 'undefined') return;
  const isDefault =
    settings.brightness === 100 &&
    settings.contrast === 100 &&
    settings.saturation === 100;

  if (isDefault) {
    document.documentElement.style.filter = 'none';
  } else {
    document.documentElement.style.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  }
};

export const useBrightness = () => {
  const [settings, setSettings] = useState<BrightnessSettings>(getDefaultSettings);

  const updateSettings = useCallback((newSettings: BrightnessSettings) => {
    setSettings(newSettings);
    applyFilterToDOM(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      window.dispatchEvent(new CustomEvent('heatshield:brightness_changed', { detail: newSettings }));
    } catch (e) {}
  }, []);

  const setPreset = useCallback((preset: Exclude<BrightnessPreset, 'custom'>) => {
    const target = PRESETS[preset];
    updateSettings({
      ...target,
      activePreset: preset
    });
  }, [updateSettings]);

  const setCustomBrightness = useCallback((val: number) => {
    const clamped = Math.max(50, Math.min(150, Math.round(val)));
    setSettings((prev) => {
      const updated: BrightnessSettings = {
        ...prev,
        brightness: clamped,
        activePreset: 'custom'
      };
      applyFilterToDOM(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const setCustomContrast = useCallback((val: number) => {
    const clamped = Math.max(75, Math.min(140, Math.round(val)));
    setSettings((prev) => {
      const updated: BrightnessSettings = {
        ...prev,
        contrast: clamped,
        activePreset: 'custom'
      };
      applyFilterToDOM(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const resetToStandard = useCallback(() => {
    setPreset('standard');
  }, [setPreset]);

  // Initial mount application & sync across components
  useEffect(() => {
    applyFilterToDOM(settings);

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<BrightnessSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        applyFilterToDOM(customEvent.detail);
      }
    };

    window.addEventListener('heatshield:brightness_changed', handleSync);
    return () => {
      window.removeEventListener('heatshield:brightness_changed', handleSync);
    };
  }, []);

  return {
    settings,
    setPreset,
    setCustomBrightness,
    setCustomContrast,
    resetToStandard,
    isOutdoorBoost: settings.activePreset === 'outdoor' || settings.brightness > 115
  };
};
