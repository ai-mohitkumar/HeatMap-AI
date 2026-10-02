import React from 'react';
import { Sun, Moon, Eye, RotateCcw, X, Sparkles, Sliders } from 'lucide-react';
import { useBrightness } from '../../utils/useBrightness';

interface BrightnessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrightnessModal: React.FC<BrightnessModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    setPreset,
    setCustomBrightness,
    setCustomContrast,
    resetToStandard
  } = useBrightness();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0F172E] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl z-50 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Sun className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Display &amp; Sunlight Boost</span>
                {settings.activePreset === 'outdoor' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-black">
                    Active Glare Boost
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Optimize visibility for outdoor heat patrols or night comfort
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close brightness menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Outdoor Sunlight Preset */}
          <button
            onClick={() => setPreset('outdoor')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
              settings.activePreset === 'outdoor'
                ? 'bg-gradient-to-br from-amber-500/25 to-orange-500/20 border-amber-400 text-white shadow-lg shadow-amber-950/40 ring-2 ring-amber-400/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className={`w-5 h-5 ${settings.activePreset === 'outdoor' ? 'text-amber-400' : 'text-slate-400'}`} />
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-black block">Outdoor Glare</span>
              <span className="text-[10px] opacity-75 block mt-0.5">130% Brightness</span>
            </div>
          </button>

          {/* Standard Balanced Preset */}
          <button
            onClick={() => setPreset('standard')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
              settings.activePreset === 'standard'
                ? 'bg-gradient-to-br from-blue-500/25 to-indigo-500/20 border-blue-400 text-white shadow-lg shadow-blue-950/40 ring-2 ring-blue-400/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Eye className={`w-5 h-5 ${settings.activePreset === 'standard' ? 'text-blue-400' : 'text-slate-400'}`} />
            <div>
              <span className="text-xs font-black block">Standard</span>
              <span className="text-[10px] opacity-75 block mt-0.5">100% Balanced</span>
            </div>
          </button>

          {/* Night Comfort Preset */}
          <button
            onClick={() => setPreset('night')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
              settings.activePreset === 'night'
                ? 'bg-gradient-to-br from-purple-500/25 to-indigo-500/20 border-purple-400 text-white shadow-lg shadow-purple-950/40 ring-2 ring-purple-400/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Moon className={`w-5 h-5 ${settings.activePreset === 'night' ? 'text-purple-400' : 'text-slate-400'}`} />
            <div>
              <span className="text-xs font-black block">Night Comfort</span>
              <span className="text-[10px] opacity-75 block mt-0.5">75% Low Glare</span>
            </div>
          </button>
        </div>

        {/* Sliders Container */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Fine-Tune Luminance</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{settings.brightness}%</span>
          </div>

          <div>
            <input
              type="range"
              min={50}
              max={150}
              step={1}
              value={settings.brightness}
              onChange={(e) => setCustomBrightness(Number(e.target.value))}
              aria-label="Fine-tune luminance brightness"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Dim (50%)</span>
              <span>Default (100%)</span>
              <span>Sunlight Boost (150%)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-bold">Contrast Boost</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.contrast}%</span>
            </div>
            <input
              type="range"
              min={75}
              max={140}
              step={1}
              value={settings.contrast}
              onChange={(e) => setCustomContrast(Number(e.target.value))}
              aria-label="Fine-tune contrast boost"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Soft (75%)</span>
              <span>100%</span>
              <span>High Contrast (140%)</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={resetToStandard}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-950/50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
