import React from 'react';

interface HeatShieldLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const HeatShieldLogo: React.FC<HeatShieldLogoProps> = ({
  size = 'md',
  showTagline = true,
  showText = true,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: { w: 30, h: 30 },
    md: { w: 38, h: 38 },
    lg: { w: 48, h: 48 }
  };

  const { w, h } = iconSizes[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Dynamic Emblem: Shield (Protection) + Sun (Heat) + Leaf (Health) */}
      <div
        style={{ width: w, height: h }}
        className="relative shrink-0 flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-[#1B2845] via-[#10182E] to-[#0A1128] border border-slate-700/80 shadow-md overflow-hidden group"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)] transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Thermal to ecological cooling gradient: Red/Amber -> Emerald */}
            <linearGradient id="shieldHeatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <linearGradient id="sunGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* 1. Shield Outline (Protection) */}
          <path
            d="M50 8 C68 18, 88 16, 90 34 C90 62, 68 84, 50 94 C32 84, 10 62, 10 34 C12 16, 32 18, 50 8 Z"
            fill="url(#shieldHeatGradient)"
            fillOpacity="0.18"
            stroke="url(#shieldHeatGradient)"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* 2. Radiant Sun (Heat) */}
          <circle cx="50" cy="38" r="14" fill="url(#sunGlowGradient)" />
          {/* Sun Rays */}
          <g stroke="url(#sunGlowGradient)" strokeWidth="3" strokeLinecap="round">
            <line x1="50" y1="17" x2="50" y2="21" />
            <line x1="50" y1="55" x2="50" y2="59" />
            <line x1="29" y1="38" x2="33" y2="38" />
            <line x1="67" y1="38" x2="71" y2="38" />
            <line x1="35" y1="23" x2="38" y2="26" />
            <line x1="62" y1="50" x2="65" y2="53" />
            <line x1="65" y1="23" x2="62" y2="26" />
            <line x1="38" y1="50" x2="35" y2="53" />
          </g>

          {/* 3. Curved Leaf (Health & Ecological Cooling) */}
          <path
            d="M50 48 C50 68, 66 76, 68 80 C56 82, 38 74, 38 60 C38 52, 45 49, 50 48 Z"
            fill="url(#leafGradient)"
            fillOpacity="0.92"
          />
          {/* Leaf Central Vein */}
          <path
            d="M50 48 Q46 66 66 78"
            stroke="#ECFDF5"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight text-white ${
                size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg'
              }`}
            >
              HeatShield
            </span>
            <span
              className={`font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent ${
                size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg'
              }`}
            >
              AI
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
              Know Heat. Stay Ahead. Stay Safe.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
