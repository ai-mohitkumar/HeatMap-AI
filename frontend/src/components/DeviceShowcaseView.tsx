import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Laptop,
  Watch,
  Tablet,
  Download,
  CheckCircle2,
  Droplets,
  Sun,
  Flame,
  ShieldAlert,
  Clock,
  Sparkles,
  MapPin,
  Activity,
  Bell,
  Send,
  ExternalLink,
  Heart,
  X,
  Plus,
  Minus,
  Calendar,
  Layers,
  Globe,
  Radio,
  ArrowUpRight,
  AlertTriangle,
  Wifi,
  Battery,
  Copy,
  Check,
  HardDrive,
  Cpu
} from 'lucide-react';
import { evaluateLocationHeat } from '../utils/indiaGeoStore';
import type { LocationPredictionResponse } from '../types';

interface DeviceShowcaseViewProps {
  onNavigateTab?: (tab: string) => void;
  customLocation?: {
    name: string;
    lat: number;
    lon: number;
    district?: string;
    state?: string;
  } | null;
  onSelectLocation?: (loc: {
    name: string;
    lat: number;
    lon: number;
    district?: string;
    state?: string;
  }) => void;
  hasPwaPrompt?: boolean;
  onTriggerPwaInstall?: () => void;
}

export interface DownloadPackageInfo {
  id: 'android' | 'ios' | 'smartwatch' | 'desktop' | 'master';
  name: string;
  subtitle: string;
  file: string;
  url: string;
  size: string;
  version: string;
  format: string;
  compatibility: string;
  sha256: string;
  badge: string;
  badgeColor: string;
  instructions: string[];
  safariTip?: string;
}

export const DOWNLOAD_PACKAGES: DownloadPackageInfo[] = [
  {
    id: 'android',
    name: 'Android Universal APK',
    subtitle: 'Google Pixel, Samsung Galaxy, OnePlus, Xiaomi',
    file: 'HeatShield-AI-v2.0-universal.apk',
    url: '/downloads/HeatShield-AI-v2.0-universal.apk',
    size: '453 KB',
    version: 'v2.0.4',
    format: 'APK (Native Signed Package)',
    compatibility: 'Android 7.0 to 15 (ARM64, ARMv7, x86_64)',
    sha256: '7c06228151b86fcd25f89ebad30c5f444f9121458c2fb4a6d19ecfdbd166a4fc',
    badge: 'Native Signed APK',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    instructions: [
      'Tap "Download APK" to save HeatShield-AI-v2.0-universal.apk (453 KB) directly to your device.',
      'Open Downloads or tap the download completion notification.',
      'If prompted with "Install unknown apps", tap Settings and enable "Allow from this source".',
      'Tap "Install" — HeatShield AI installs cleanly and opens with full offline heat safety intelligence!'
    ]
  },
  {
    id: 'ios',
    name: 'Apple iOS & iPadOS',
    subtitle: 'iPhone 11–16 Pro, iPad Pro, iPad Air, iPad Mini',
    file: 'HeatShield-AI-iOS.mobileconfig',
    url: '/downloads/HeatShield-AI-iOS.mobileconfig',
    size: '1.8 KB',
    version: 'v2.0.4',
    format: 'Apple Configuration Profile (.mobileconfig)',
    compatibility: 'iOS 15.0+, iPadOS 15.0+, macOS Monterey+',
    sha256: 'e8aabc24ce11a1a51a338596f275fbde567e8a06e11e2b1f1542966f517bf182',
    badge: 'Native WebClip Profile',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    instructions: [
      'Tap "Download iOS Profile" using Safari on your iPhone or iPad.',
      'When prompted "This website is trying to download a configuration profile", tap "Allow".',
      'Open your iPhone "Settings" app — tap "Profile Downloaded" at the top of the menu.',
      'Tap "Install" in the top-right corner. The HeatShield AI icon is added directly to your Home Screen in standalone fullscreen mode!'
    ],
    safariTip: 'Alternative 1-Tap Safari Install: Open this page in Safari -> Tap the Share button (square with up arrow) -> Select "Add to Home Screen".'
  },
  {
    id: 'smartwatch',
    name: 'Smartwatch Companion',
    subtitle: 'Wear OS 3+, Galaxy Watch 4/5/6/7, Pixel Watch 1/2/3',
    file: 'HeatShield-WearOS-Companion.apk',
    url: '/downloads/HeatShield-WearOS-Companion.apk',
    size: '12.8 KB',
    version: 'v2.0.4',
    format: 'Wear OS Native Signed APK',
    compatibility: 'Wear OS 3.0+, Galaxy Watch 4/5/6/7, Pixel Watch 1/2/3',
    sha256: 'd4312a401ad29fbcc961fd71772b1a858b4127f456f6949f5dce043e9775d714',
    badge: 'Wear OS Signed APK',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    instructions: [
      'Download HeatShield-WearOS-Companion.apk to your phone or computer.',
      'Enable "ADB Debugging" and "Wireless Debugging" in your smartwatch Developer Options.',
      'Sideload via ADB: adb install HeatShield-WearOS-Companion.apk (or via Easy Fire Tools / Wear Installer).',
      'Long-press your watch face to add the glanceable HeatShield Thermal Risk complication.'
    ]
  },
  {
    id: 'desktop',
    name: 'Desktop Command Center',
    subtitle: 'Windows 10/11, macOS, Linux',
    file: 'HeatShield-AI-Desktop-Windows.zip',
    url: '/downloads/HeatShield-AI-Desktop-Windows.zip',
    size: '453 KB',
    version: 'v2.0.4',
    format: 'Windows & macOS Standalone (.zip)',
    compatibility: 'Windows 10/11 (64-bit), macOS 12+, Linux x86_64',
    sha256: '9cafc4d09bd40cf2d1a6fd089b7e69080c622ad520f33cc769303bd9d901a5e3',
    badge: '1-Click Portable',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    instructions: [
      'Download HeatShield-AI-Desktop-Windows.zip and extract it to any folder.',
      'Double-click "HeatShield-AI.bat" (Windows) or launch "web/index.html" in Chrome/Edge.',
      'The complete offline Command Center opens locally in your browser with zero latency.',
      'Runs with all 46 pre-cached weather stations and continuous spatial IDW without internet.'
    ]
  },
  {
    id: 'master',
    name: 'Master Offline Research Suite',
    subtitle: 'University Review, Viva Defense & Disaster Planning',
    file: 'HeatShield-AI-Master-Offline-Suite.zip',
    url: '/downloads/HeatShield-AI-Master-Offline-Suite.zip',
    size: '19.2 KB',
    version: 'v2.0.4',
    format: 'Full ML, GIS & Research Bundle (.zip)',
    compatibility: 'Universal (Python 3.10+, Jupyter, Node.js)',
    sha256: '7ee44b9d7d65c39b4446a9f421929331c67b7004b0ea937b8d0de5cc0ecd283f',
    badge: 'Complete Academic Suite',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    instructions: [
      'Extract the master archive to access the full Python ML pipeline and notebooks.',
      'Includes NOAA GSOD 46-station multi-year dataset and 787 Indian districts dictionary.',
      'Contains complete research whitepaper, mathematical proofs (RQ1-RQ6), and ANOVA scripts.'
    ]
  }
];

const PRESET_LOCATIONS = [
  { name: 'Buxar, Bihar', lat: 25.5647, lon: 83.9777, desc: 'Indo-Gangetic Plain (Extreme Thermal Stress)' },
  { name: 'New Delhi', lat: 28.585, lon: 77.206, desc: 'National Capital (Urban Heat Island Corridor)' },
  { name: 'Phalodi, Rajasthan', lat: 27.13, lon: 72.36, desc: 'Thar Desert (Dry Interior Heat Regime)' },
  { name: 'Mumbai, Maharashtra', lat: 19.117, lon: 72.857, desc: 'West Coast (Severe Moisture Trap)' },
  { name: 'Kolkata, West Bengal', lat: 22.653, lon: 88.447, desc: 'East Coast (High Wet-Bulb Delta)' },
  { name: 'Chennai, Tamil Nadu', lat: 12.994, lon: 80.180, desc: 'Coromandel Coast (Tropical Maritime)' },
  { name: 'Nagpur, Maharashtra', lat: 21.092, lon: 79.067, desc: 'Central Deccan (High Radiant Flux)' },
  { name: 'Patna, Bihar', lat: 25.5941, lon: 85.1376, desc: 'East Gangetic Basin' },
];

export const DeviceShowcaseView: React.FC<DeviceShowcaseViewProps> = ({
  onNavigateTab,
  customLocation,
  onSelectLocation,
  hasPwaPrompt,
  onTriggerPwaInstall
}) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [deviceTab, setDeviceTab] = useState<'all' | 'ios' | 'android' | 'watch' | 'desktop'>('all');
  
  // Interactive iOS state
  const [waterGlasses, setWaterGlasses] = useState<number>(8);
  const [maxGlasses] = useState<number>(12);
  const [dynamicIslandExpanded, setDynamicIslandExpanded] = useState<boolean>(false);
  const [isDayPlannerOpen, setIsDayPlannerOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [assistantChat, setAssistantChat] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am HeatShield AI. Peak thermal stress today is expected between 12:00 PM and 4:00 PM. Hydrate every 25 minutes and avoid unshaded transit.' }
  ]);

  // Interactive Android state
  const [androidTab, setAndroidTab] = useState<'today' | '7days' | 'monthly' | 'insights'>('today');
  const [selectedAiChipPrompt, setSelectedAiChipPrompt] = useState<string | null>(null);

  // Watch state
  const [watchSosTriggered, setWatchSosTriggered] = useState<boolean>(false);
  const [watchWaterLogged, setWatchWaterLogged] = useState<boolean>(false);

  // Download Modal state
  const [activeDownloadModal, setActiveDownloadModal] = useState<DownloadPackageInfo | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  // Active location calculation
  const activeGeo = useMemo(() => {
    if (customLocation) {
      return {
        name: customLocation.name,
        lat: customLocation.lat,
        lon: customLocation.lon,
        desc: `${customLocation.district || ''}, ${customLocation.state || ''}`
      };
    }
    return PRESET_LOCATIONS[selectedPresetIdx];
  }, [customLocation, selectedPresetIdx]);

  // Live Continuous 4-Station IDW Heat Evaluation
  const heatData: LocationPredictionResponse = useMemo(() => {
    try {
      return evaluateLocationHeat(activeGeo.lat, activeGeo.lon);
    } catch {
      return evaluateLocationHeat(25.5647, 83.9777); // Buxar fallback
    }
  }, [activeGeo.lat, activeGeo.lon]);

  const currentTemp = Math.round(heatData.weather.temperature);
  const currentFeels = Math.round(heatData.weather.feels_like);
  const currentHumidity = Math.round(heatData.weather.humidity);
  const currentWind = Math.round(heatData.weather.wind_speed);
  const riskLevel = heatData.prediction.risk_level;
  const peakWindow = heatData.prediction.peak_window || '12:00 PM - 04:00 PM';
  const riskScore = heatData.prediction.risk_score || 88;

  // Hourly curve simulator based on current temperature
  const hourlyData = useMemo(() => {
    return [
      { time: '08:00', temp: Math.max(26, currentTemp - 7), label: 'Safe', color: '#10B981' },
      { time: '10:00', temp: Math.max(28, currentTemp - 4), label: 'Moderate', color: '#F59E0B' },
      { time: '12:00', temp: currentTemp + 1, label: 'High', color: '#F97316' },
      { time: '14:00', temp: currentTemp + 3, label: 'Extreme Peak', color: '#EF4444' },
      { time: '16:00', temp: currentTemp + 1, label: 'Very High', color: '#DC2626' },
      { time: '18:00', temp: Math.max(28, currentTemp - 3), label: 'Moderate', color: '#F59E0B' },
      { time: '20:00', temp: Math.max(26, currentTemp - 6), label: 'Safe', color: '#10B981' },
    ];
  }, [currentTemp]);

  const handleSendAssistant = () => {
    if (!assistantInput.trim()) return;
    const userMsg = assistantInput.trim();
    setAssistantChat(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAssistantInput('');

    setTimeout(() => {
      let reply = `Based on current thermal assessment in ${activeGeo.name} (${currentTemp}°C, feels like ${currentFeels}°C with ${currentHumidity}% humidity), `;
      const lower = userMsg.toLowerCase();
      if (lower.includes('run') || lower.includes('jog') || lower.includes('exercise')) {
        reply += 'the optimal outdoor workout window is early morning between 05:30 AM and 07:30 AM. Strictly avoid 11:30 AM to 04:30 PM.';
      } else if (lower.includes('water') || lower.includes('hydrate')) {
        reply += `your sweat rate is currently elevated (~850 ml/hr). We recommend drinking 250ml of electrolyte-fortified water every 20-25 minutes.`;
      } else if (lower.includes('worker') || lower.includes('labor') || lower.includes('shift')) {
        reply += `under NIOSH guidelines for ${riskLevel} heat risk, outdoor workers must adhere to a 30-minute rest per 30-minute work cycle under ventilated shade.`;
      } else {
        reply += `you are currently in a ${riskLevel} heat regime. Ensure vulnerable family members stay indoors, hydrate frequently, and reapply SPF 50+ sunscreen if outdoors.`;
      }
      setAssistantChat(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 450);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleTriggerDownload = (pkg: DownloadPackageInfo) => {
    setDownloadSuccessNotice(`Downloading ${pkg.file}...`);
    setTimeout(() => setDownloadSuccessNotice(null), 3500);
    // Create link and trigger physical download
    const link = document.createElement('a');
    link.href = pkg.url;
    link.download = pkg.file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#090F1F] text-slate-100 pb-16">
      {/* Toast Notice */}
      {downloadSuccessNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadSuccessNotice}</span>
        </div>
      )}

      {/* Top Hero Brand Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#090F1F] to-[#090F1F] border-b border-slate-800/80 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Badge & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm">
                <Smartphone className="w-3.5 h-3.5" />
                Cross-Platform Device Suite
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse" />
                Live Continuous IDW Interpolation
              </span>
            </div>

            {/* Location Selector Dropdown */}
            <div className="flex items-center gap-2 bg-[#131E3A] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs shadow-inner">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-slate-400 font-medium">Test Location:</span>
              <select
                aria-label="Simulate live location on devices"
                value={selectedPresetIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedPresetIdx(idx);
                  if (onSelectLocation) {
                    const loc = PRESET_LOCATIONS[idx];
                    onSelectLocation({
                      name: loc.name,
                      lat: loc.lat,
                      lon: loc.lon
                    });
                  }
                }}
                className="bg-transparent text-white font-bold cursor-pointer focus:outline-none pr-2"
              >
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <option key={loc.name} value={idx} className="bg-[#0B132B] text-slate-200">
                    {loc.name}
                  </option>
                ))}
              </select>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[11px]">
                {currentTemp}°C ({riskLevel})
              </span>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Know Heat. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500">Stay Ahead.</span> Stay Safe.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              HeatShield AI delivers hyper-localized, unsupervised climate intelligence right to your pocket, wrist, and desktop. High-fidelity synchronized experiences across iOS, Android, Smartwatch, and Web Command Center.
            </p>
          </div>

          {/* Device Navigation Tabs & Fast Download Button */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDeviceTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  deviceTab === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-[#131E3A] text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Devices (Side-by-Side)</span>
              </button>
              <button
                onClick={() => setDeviceTab('ios')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  deviceTab === 'ios'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-[#131E3A] text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Apple iPhone 16 Pro (iOS)</span>
              </button>
              <button
                onClick={() => setDeviceTab('android')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  deviceTab === 'android'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-[#131E3A] text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Google Pixel / Galaxy (Android)</span>
              </button>
              <button
                onClick={() => setDeviceTab('watch')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  deviceTab === 'watch'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-[#131E3A] text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Watch className="w-3.5 h-3.5" />
                <span>Apple Watch / Wear OS</span>
              </button>
              <button
                onClick={() => setDeviceTab('desktop')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  deviceTab === 'desktop'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-[#131E3A] text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>MacBook Pro (Command Center)</span>
              </button>
            </div>

            {/* Jump to Downloads Center Button */}
            <a
              href="#downloads-center"
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Packages (All Formats)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Interactive Showcase Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">

        {/* Feature Rail & Devices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Key Features Showcase (Matches Reference Layout) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                  Core Capabilities
                </h3>
              </div>

              {/* Feature 1: Personalized Heat Index */}
              <div className="group p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                      Personalized Heat Index
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Real-time microclimate calculations tailored to your exact coordinates using continuous 4-station IDW spatial interpolation and ambient humidity.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-300 font-semibold">
                      <span>0.82°C LOSOCV Accuracy</span>
                      <span>•</span>
                      <span>&lt;0.6ms Offline Cache</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2: Smart Routine Planning */}
              <div className="group p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                      Smart Routine Planning
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      AI-generated daily schedules recommending optimal morning and evening windows while avoiding dangerous peak heat ({peakWindow}).
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-blue-300 font-semibold">
                      <span>Commute &amp; Jogger Protection</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3: Hydration & Sunscreen Reminders */}
              <div className="group p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                      Hydration &amp; Sunscreen Reminders
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Dynamic water logging with automatic sweat-rate scaling and timer alerts for SPF 50+ reapplication when UV index surpasses safe thresholds.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-cyan-300 font-semibold">
                      <span>Interactive Water Glass Logger</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4: Proactive Heatwave Alerts */}
              <div className="group p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-rose-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition">
                      Proactive Heatwave Alerts &amp; SOS
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Push notifications triggered 2 hours before extreme thermal surges, with one-tap navigation to nearest air-conditioned cooling centers.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-rose-300 font-semibold">
                      <span>Instant Emergency SOS Dispatch</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action: Open Full Web Platform */}
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('home')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2"
                >
                  <span>Launch Live Command Center</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Platform Feature Matrix Compact Card */}
            <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Cloud Dependency Mode</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Every mobile and watch client includes an onboard micro-inference engine with 46 synoptic stations and 787 districts cached locally for offline rural deployment.
              </p>
            </div>
          </div>

          {/* Right Column: Devices Mockups Viewport */}
          <div className="lg:col-span-8 space-y-10">

            {/* Devices Container */}
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-10">

              {/* DEVICE 1: APPLE iPHONE 16 PRO (iOS) */}
              {(deviceTab === 'all' || deviceTab === 'ios') && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      iOS 18 • iPhone 16 Pro
                    </span>
                  </div>

                  {/* iPhone Chassis */}
                  <div className="w-[330px] sm:w-[350px] h-[700px] bg-black rounded-[50px] p-3 shadow-2xl border-[6px] border-slate-700/80 relative flex flex-col justify-between select-none overflow-hidden">
                    
                    {/* Outer Edge Glow */}
                    <div className="absolute inset-0 rounded-[44px] pointer-events-none border border-slate-600/30 shadow-inner" />

                    {/* Phone Screen Canvas */}
                    <div className="w-full h-full bg-[#0B132B] rounded-[40px] flex flex-col justify-between overflow-hidden relative border border-slate-800/80">

                      {/* Top Status Bar & Dynamic Island */}
                      <div className="pt-3 px-5 pb-1 flex flex-col items-center relative z-20 shrink-0 bg-[#0B132B]">
                        <div className="w-full flex items-center justify-between text-[11px] text-slate-300 font-semibold px-2">
                          <span>9:41</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold">5G</span>
                            <div className="w-5 h-2.5 rounded-sm border border-slate-300 p-0.5 flex items-center">
                              <div className="h-full w-4 bg-emerald-400 rounded-xs" />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Dynamic Island */}
                        <div
                          onClick={() => setDynamicIslandExpanded(!dynamicIslandExpanded)}
                          className={`mt-1 bg-black text-white rounded-full cursor-pointer transition-all duration-300 flex items-center justify-between px-3 border border-slate-800/80 shadow-md ${
                            dynamicIslandExpanded ? 'w-56 h-10 py-1' : 'w-28 h-6'
                          }`}
                        >
                          {dynamicIslandExpanded ? (
                            <div className="w-full flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                <Flame className="w-3 h-3 animate-bounce" />
                                <span>{currentTemp}°C High Heat</span>
                              </div>
                              <span className="text-slate-400">Peak {peakWindow.split('-')[0]}</span>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-between text-[9px] text-slate-400 font-mono px-1">
                              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              <span className="text-amber-400 font-bold">{currentTemp}°C</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scrollable App Body */}
                      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">

                        {/* Header Location & Notification */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-rose-400" />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <span>{activeGeo.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">Live Microclimate</div>
                            </div>
                          </div>
                          <div className="relative">
                            <button
                              aria-label="Show notification alerts"
                              className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                          </div>
                        </div>

                        {/* Hero Heat Risk Banner Card (Matches media_1789160602887.png) */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/70 via-orange-950/50 to-slate-900 p-4 border border-rose-500/40 shadow-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
                                  {riskLevel} Heat Risk
                                </span>
                              </div>
                              <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white tracking-tight">
                                  {currentTemp}°
                                </span>
                                <span className="text-xs font-semibold text-rose-200/90">
                                  Feels {currentFeels}°C
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <Flame className="w-6 h-6" />
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Peak Hours:
                            </span>
                            <span className="font-bold text-amber-300">{peakWindow}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Plan My Day & AI Assistant */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setIsDayPlannerOpen(true)}
                            className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Plan My Day</span>
                          </button>
                          <button
                            onClick={() => setIsAssistantOpen(true)}
                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>AI Assistant</span>
                          </button>
                        </div>

                        {/* Quick Interactive Widgets (Hydrate Now + Sunscreen) */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Hydrate Now Widget */}
                          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                            <div className="flex items-center justify-between text-cyan-400 mb-1">
                              <div className="flex items-center gap-1">
                                <Droplets className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase">Hydrate</span>
                              </div>
                              <span className="text-[10px] font-extrabold">
                                {waterGlasses}/{maxGlasses}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-1.5">
                              <div
                                className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${(waterGlasses / maxGlasses) * 100}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <button
                                aria-label="Decrement water count"
                                onClick={() => setWaterGlasses(prev => Math.max(0, prev - 1))}
                                className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[10px] text-slate-400">Log +250ml</span>
                              <button
                                aria-label="Increment water count"
                                onClick={() => setWaterGlasses(prev => Math.min(maxGlasses, prev + 1))}
                                className="w-6 h-6 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Sunscreen Alert Widget */}
                          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                            <div className="flex items-center gap-1 text-amber-400 mb-1">
                              <Sun className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Sunscreen</span>
                            </div>
                            <div className="text-xs font-bold text-white mt-1">Reapply in 45m</div>
                            <p className="text-[9px] text-slate-400 mt-0.5">SPF 50+ Broad Spectrum</p>
                            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-rose-300 font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>UV Index 10.4 (Extreme)</span>
                            </div>
                          </div>
                        </div>

                        {/* Today's Timeline Chart */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white">Today's Heat Progression</span>
                            <span className="text-[10px] text-slate-400">08:00 - 20:00</span>
                          </div>

                          {/* Hourly Bars */}
                          <div className="flex items-end justify-between gap-1 pt-2 h-20">
                            {hourlyData.map((hr) => (
                              <div key={hr.time} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-300">{hr.temp}°</span>
                                <div
                                  className="w-full rounded-t-md transition-all duration-300"
                                  style={{
                                    height: `${Math.max(16, (hr.temp - 24) * 3)}px`,
                                    backgroundColor: hr.color
                                  }}
                                />
                                <span className="text-[8px] text-slate-400 font-mono">{hr.time.split(':')[0]}h</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* iOS Bottom Home Indicator & Tab Bar */}
                      <div className="pt-2 pb-5 px-6 bg-[#0B132B]/95 border-t border-slate-800/80 flex items-center justify-between text-slate-400 z-20 shrink-0">
                        <div className="flex flex-col items-center text-blue-400 cursor-pointer">
                          <Smartphone className="w-4 h-4" />
                          <span className="text-[9px] font-bold mt-0.5">Home</span>
                        </div>
                        <div className="flex flex-col items-center hover:text-slate-200 cursor-pointer">
                          <Layers className="w-4 h-4" />
                          <span className="text-[9px] mt-0.5">Map</span>
                        </div>
                        <div className="flex flex-col items-center hover:text-slate-200 cursor-pointer">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[9px] mt-0.5">Routine</span>
                        </div>
                        <div className="flex flex-col items-center hover:text-slate-200 cursor-pointer">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-[9px] mt-0.5">Alerts</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* DEVICE 2: GOOGLE PIXEL / SAMSUNG GALAXY (ANDROID) */}
              {(deviceTab === 'all' || deviceTab === 'android') && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Android 15 • Material 3
                    </span>
                  </div>

                  {/* Android Chassis */}
                  <div className="w-[330px] sm:w-[350px] h-[700px] bg-black rounded-[46px] p-3 shadow-2xl border-[6px] border-slate-700/80 relative flex flex-col justify-between select-none overflow-hidden">
                    
                    {/* Outer Frame Edge */}
                    <div className="absolute inset-0 rounded-[40px] pointer-events-none border border-slate-600/30 shadow-inner" />

                    {/* Android Screen Canvas */}
                    <div className="w-full h-full bg-[#090F1F] rounded-[36px] flex flex-col justify-between overflow-hidden relative border border-slate-800/80">

                      {/* Top Status Bar with Centered Punch-Hole Camera */}
                      <div className="pt-2.5 px-5 pb-1 flex items-center justify-between text-[11px] text-slate-300 font-semibold bg-[#090F1F] z-20 shrink-0">
                        <span>12:30</span>
                        {/* Punch Hole Camera */}
                        <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 mx-auto shadow-inner" />
                        <div className="flex items-center gap-1 text-[10px]">
                          <Wifi className="w-3 h-3 text-slate-300" />
                          <Battery className="w-3 h-3 text-emerald-400" />
                        </div>
                      </div>

                      {/* Android Scrollable App Body */}
                      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">

                        {/* Material 3 Segmented Horizon Navigation Tabs */}
                        <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-semibold">
                          {(['today', '7days', 'monthly', 'insights'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setAndroidTab(tab)}
                              className={`flex-1 py-1 rounded-lg text-center capitalize transition ${
                                androidTab === tab
                                  ? 'bg-emerald-600 text-white font-bold shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tab === '7days' ? '7 Days' : tab}
                            </button>
                          ))}
                        </div>

                        {/* Android Circular Heat Index Gauge Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#131E3A] to-[#0B132B] border border-slate-800 shadow-md text-center relative overflow-hidden">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="font-bold text-white">Thermal Stress Index</span>
                            <span className="text-emerald-400 font-bold">Synced</span>
                          </div>

                          {/* Circular Gauge Representation */}
                          <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
                            {/* Ring Background */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-800"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-rose-500 transition-all duration-1000"
                                strokeDasharray="88, 100"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-white">{riskScore}</span>
                              <span className="text-[9px] font-extrabold uppercase text-rose-400">{riskLevel}</span>
                            </div>
                          </div>

                          {/* Sub Metrics Bar */}
                          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[10px]">
                            <div>
                              <div className="text-slate-400">Humidity</div>
                              <div className="font-bold text-white">{currentHumidity}%</div>
                            </div>
                            <div>
                              <div className="text-slate-400">Wind Speed</div>
                              <div className="font-bold text-white">{currentWind} km/h</div>
                            </div>
                            <div>
                              <div className="text-slate-400">Wet-Bulb</div>
                              <div className="font-bold text-rose-300">31.4°C</div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive AI Prompt Chips ("Ask HeatShield AI") */}
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ask HeatShield AI</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {[
                              '🏃 Best running time?',
                              '👵 Safe elderly walk?',
                              '👷 Worker rest cycle?',
                              '❄️ Cooling centers?'
                            ].map((chip) => (
                              <button
                                key={chip}
                                onClick={() => setSelectedAiChipPrompt(chip)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                                  selectedAiChipPrompt === chip
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {/* Display Grounded AI Answer upon Chip Click */}
                          {selectedAiChipPrompt && (
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 mt-2 animate-fadeIn">
                              <div className="font-bold text-emerald-300 mb-0.5 flex items-center justify-between">
                                <span>{selectedAiChipPrompt}</span>
                                <button
                                  aria-label="Close prompt answer"
                                  onClick={() => setSelectedAiChipPrompt(null)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-slate-300 leading-relaxed text-[10px]">
                                {selectedAiChipPrompt.includes('running') && `Safe running windows are 05:30–07:30 AM or after 19:30 PM. Heat Index exceeds 43°C between 11:30 AM and 16:30 PM.`}
                                {selectedAiChipPrompt.includes('elderly') && `High risk for elderly individuals with cardiovascular conditions. Limit exposure to <15 mins during early mornings only.`}
                                {selectedAiChipPrompt.includes('Worker') && `Under NIOSH/OSHA standards, implement a 30m work / 30m shaded rest ratio with 1 liter electrolyte hydration per hour.`}
                                {selectedAiChipPrompt.includes('Cooling') && `3 designated cooling shelters active within 2.5km of ${activeGeo.name} with air conditioning and potable water.`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Live Heatwave Micro-Map Preview */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                          <div className="flex items-center justify-between text-[11px] mb-2">
                            <span className="font-bold text-white flex items-center gap-1">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              Regional Thermal Contour
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                              Zone 4 Discovered
                            </span>
                          </div>
                          <div className="h-16 rounded-lg bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 p-2 flex items-center justify-between text-white font-extrabold text-[10px] shadow-inner">
                            <span>31°C (Highland)</span>
                            <span className="px-2 py-0.5 bg-black/60 rounded-full border border-white/20">
                              📍 {activeGeo.name.split(',')[0]} ({currentTemp}°C)
                            </span>
                            <span>45°C (Interior)</span>
                          </div>
                        </div>

                      </div>

                      {/* Material 3 Bottom Navigation Pill Bar */}
                      <div className="py-3 px-6 bg-[#0B132B] border-t border-slate-800/80 flex items-center justify-between text-slate-400 z-20 shrink-0">
                        <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 cursor-pointer">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="p-1.5 hover:text-slate-200 cursor-pointer">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="p-1.5 hover:text-slate-200 cursor-pointer">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="p-1.5 hover:text-rose-400 cursor-pointer">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* DEVICE 3: APPLE WATCH / WEAR OS COMPANION */}
              {(deviceTab === 'all' || deviceTab === 'watch') && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      watchOS &amp; Wear OS
                    </span>
                  </div>

                  {/* Watch Frame */}
                  <div className="w-[230px] h-[310px] bg-slate-850 rounded-[44px] p-3 shadow-2xl border-[5px] border-slate-700 relative flex items-center justify-center select-none">
                    {/* Digital Crown on Right */}
                    <div className="absolute -right-3.5 top-16 w-3 h-10 bg-slate-600 rounded-r-md border border-slate-500 shadow-md" />
                    {/* Action Button on Left */}
                    <div className="absolute -left-3 top-24 w-2.5 h-12 bg-orange-600 rounded-l-md border border-orange-500 shadow-md" />

                    {/* Watch OLED Screen */}
                    <div className="w-full h-full bg-black rounded-[34px] p-3 flex flex-col justify-between border border-slate-800 text-center overflow-hidden">
                      
                      {/* Watch Top Header */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                        <span className="text-amber-400 font-bold">14:32</span>
                        <div className="flex items-center gap-1 text-rose-400">
                          <Activity className="w-3 h-3 animate-pulse" />
                          <span className="text-[9px] font-bold">94 BPM</span>
                        </div>
                      </div>

                      {/* Main Big Temp Display */}
                      <div className="my-auto space-y-0.5">
                        <div className="text-4xl font-black text-white tracking-tight leading-none">
                          {currentTemp}.0°
                        </div>
                        <div className="inline-block px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider mt-1">
                          {riskLevel} HEAT
                        </div>
                        <div className="text-[9px] text-amber-300 font-semibold pt-1">
                          Peak Sun in 1h 45m
                        </div>
                      </div>

                      {/* Quick Interactive Watch Buttons */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setWatchWaterLogged(true);
                            setWaterGlasses(prev => Math.min(maxGlasses, prev + 1));
                            setTimeout(() => setWatchWaterLogged(false), 2000);
                          }}
                          className="w-full py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow transition"
                        >
                          <Droplets className="w-3 h-3" />
                          <span>{watchWaterLogged ? 'Logged +250ml!' : 'Drink 250ml Water'}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setWatchSosTriggered(true);
                            setTimeout(() => setWatchSosTriggered(false), 3000);
                          }}
                          className="w-full py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow transition"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>{watchSosTriggered ? 'SOS Sent to Dispatch!' : 'SOS Cooling Center'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* DEVICE 4: DESKTOP MACBOOK PRO (COMMAND CENTER) */}
              {(deviceTab === 'all' || deviceTab === 'desktop') && (
                <div className="w-full flex flex-col items-center mt-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Desktop Command Center • macOS &amp; Windows
                    </span>
                  </div>

                  {/* Laptop Chassis */}
                  <div className="w-full max-w-3xl flex flex-col items-center">
                    {/* Screen Frame */}
                    <div className="w-full bg-[#0B132B] rounded-t-2xl border-4 border-slate-700 p-2 shadow-2xl relative overflow-hidden">
                      {/* Camera Notch */}
                      <div className="w-24 h-3 bg-black rounded-b-lg mx-auto mb-1 border-x border-b border-slate-800" />

                      {/* Screen Content Preview */}
                      <div className="w-full h-64 sm:h-72 bg-[#090F1F] rounded-xl p-4 border border-slate-800 overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-white ml-2">
                              HeatShield AI National Intelligence Console
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            46 Stations • 787 Districts • 650,000 Villages
                          </div>
                        </div>

                        {/* Laptop Body Grid Preview */}
                        <div className="grid grid-cols-3 gap-3 my-auto">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-400">Regional Temperature</div>
                            <div className="text-2xl font-black text-amber-400">{currentTemp}°C</div>
                            <div className="text-[10px] text-rose-400 font-semibold mt-1">{riskLevel} Risk</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-400">Spatial Algorithm</div>
                            <div className="text-sm font-bold text-white">Continuous IDW</div>
                            <div className="text-[10px] text-emerald-400 font-semibold mt-1">k=4, p=2.0 (LOSOCV 0.82°C)</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-400">Unsupervised ML</div>
                            <div className="text-sm font-bold text-white">K-Means (K=4)</div>
                            <div className="text-[10px] text-purple-400 font-semibold mt-1">Silhouette: 0.428</div>
                          </div>
                        </div>

                        {/* Bottom Bar inside laptop */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                          <span>Active Focus: {activeGeo.name}</span>
                          {onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('home')}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5"
                            >
                              <span>Open Full Web Dashboard</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Laptop Bottom Wedge Base */}
                    <div className="w-[104%] h-4 bg-slate-700 rounded-b-xl border-t border-slate-600 shadow-xl relative flex items-center justify-center">
                      <div className="w-24 h-1.5 bg-slate-600 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Section 2: Store Badges & Universal Ecosystem Matrix */}
        <div className="bg-gradient-to-br from-[#0B132B] via-[#090F1F] to-[#131E3A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* Header & Download Badges */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Download className="w-3.5 h-3.5" />
                Universal Deployment
              </div>
              <h3 className="text-2xl font-black text-white">
                Available on Every Device You Rely On
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Instant synchronization across Apple iOS, Google Android, Smartwatches, and Desktop browsers.
              </p>
            </div>

            {/* Official-Style Store Badges (Genuinely Downloadable!) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* App Store Badge -> Triggers iOS Profile Download & Walkthrough Modal */}
              <button
                onClick={() => {
                  const iosPkg = DOWNLOAD_PACKAGES.find(p => p.id === 'ios');
                  if (iosPkg) {
                    handleTriggerDownload(iosPkg);
                    setActiveDownloadModal(iosPkg);
                  }
                }}
                className="flex items-center gap-3 px-4 py-2.5 bg-black hover:bg-slate-900 border border-slate-700 rounded-xl transition shadow-lg text-left group cursor-pointer"
              >
                {/* Apple Logo SVG */}
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.58-7.79-11.67-14.14-6.3-9.84-11.07-21.2-14.34-34.07-3.26-12.87-4.9-24.96-4.9-36.26 0-14.28 3.51-26.06 10.53-35.34 7.02-9.28 15.75-14.07 26.2-14.38 4.88 0 10.37 1.25 16.48 3.76 6.11 2.5 10.15 3.84 12.13 4.02 2.76-.36 7.08-1.78 12.98-4.28 5.89-2.5 11.26-3.67 16.09-3.5 11.83.67 21.36 4.7 28.58 12.1-10.45 6.34-15.54 15.1-15.28 26.27.27 8.75 3.65 16.03 10.14 21.84 6.49 5.81 14.15 9.17 22.98 10.08-2.6 7.64-5.83 15.34-9.69 23.1zm-24.58-112.5c0 6.64-2.45 13.08-7.34 18.33-5.59 6.01-12.44 9.6-20.55 9.07-.15-1.03-.23-2.07-.23-3.12 0-6.52 2.65-13.04 7.96-18.42 2.66-2.7 5.83-4.88 9.5-6.54 3.68-1.66 7.23-2.56 10.66-2.69z" />
                </svg>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Download on the</div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">App Store (iOS)</div>
                </div>
              </button>

              {/* Google Play Badge -> Triggers Android APK Download & Walkthrough Modal */}
              <button
                onClick={() => {
                  const androidPkg = DOWNLOAD_PACKAGES.find(p => p.id === 'android');
                  if (androidPkg) {
                    handleTriggerDownload(androidPkg);
                    setActiveDownloadModal(androidPkg);
                  }
                }}
                className="flex items-center gap-3 px-4 py-2.5 bg-black hover:bg-slate-900 border border-slate-700 rounded-xl transition shadow-lg text-left group cursor-pointer"
              >
                {/* Google Play SVG */}
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M3.6 1.8l10.9 10.9-10.9 10.9c-.3-.4-.5-.9-.5-1.5V3.3c0-.6.2-1.1.5-1.5z" />
                  <path fill="#FBBC05" d="M17.4 9.8l-2.9 2.9 2.9 2.9 3.5-2c1-.6 1-1.6 0-2.1l-3.5-1.7z" />
                  <path fill="#EA4335" d="M14.5 12.7L3.6 23.6c.4.3.9.4 1.4.1l12.4-7.2-2.9-3.8z" />
                  <path fill="#34A853" d="M14.5 12.7l2.9-3.8-12.4-7.2c-.5-.3-1-.2-1.4.1l10.9 10.9z" />
                </svg>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">GET IT ON</div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">Google Play (APK)</div>
                </div>
              </button>

              {/* Web Browser PWA Badge */}
              <button
                onClick={() => {
                  if (hasPwaPrompt && onTriggerPwaInstall) {
                    onTriggerPwaInstall();
                  } else {
                    const masterPkg = DOWNLOAD_PACKAGES.find(p => p.id === 'master');
                    if (masterPkg) {
                      setActiveDownloadModal(masterPkg);
                    }
                  }
                }}
                className="flex items-center gap-3 px-4 py-2.5 bg-blue-950/50 hover:bg-blue-900/50 border border-blue-500/40 rounded-xl transition shadow-lg text-left group cursor-pointer"
              >
                <Globe className="w-6 h-6 text-cyan-400" />
                <div>
                  <div className="text-[9px] text-cyan-300 uppercase tracking-wider font-semibold">
                    {hasPwaPrompt ? '1-TAP INSTALL' : 'LAUNCH ANYWHERE'}
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                    Web App (PWA)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Compatibility Grid (8 Devices) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            {[
              { label: 'iPhone', os: 'iOS 16+', icon: Smartphone, color: 'text-blue-400' },
              { label: 'iPad', os: 'iPadOS', icon: Tablet, color: 'text-indigo-400' },
              { label: 'Android Phone', os: 'Android 11+', icon: Smartphone, color: 'text-emerald-400' },
              { label: 'Android Tablet', os: 'Material 3', icon: Tablet, color: 'text-teal-400' },
              { label: 'Apple Watch', os: 'watchOS 9+', icon: Watch, color: 'text-amber-400' },
              { label: 'Wear OS', os: 'Wear OS 3+', icon: Watch, color: 'text-orange-400' },
              { label: 'Mac & Windows', os: 'Desktop PWA', icon: Laptop, color: 'text-purple-400' },
              { label: 'Web Browser', os: 'Chrome/Safari', icon: Globe, color: 'text-cyan-400' },
            ].map((dev) => {
              const Icon = dev.icon;
              return (
                <div key={dev.label} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col items-center justify-center space-y-1">
                  <Icon className={`w-5 h-5 ${dev.color}`} />
                  <div className="text-xs font-bold text-white">{dev.label}</div>
                  <div className="text-[10px] text-slate-400">{dev.os}</div>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 font-bold text-slate-300">Platform Capability</th>
                  <th className="py-2.5 text-center font-bold text-blue-400">iOS App</th>
                  <th className="py-2.5 text-center font-bold text-emerald-400">Android App</th>
                  <th className="py-2.5 text-center font-bold text-amber-400">Watch Companion</th>
                  <th className="py-2.5 text-center font-bold text-purple-400">Desktop Command Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2.5 font-medium">Instant Offline Continuous IDW</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Built-in</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Built-in</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Micro-Cache</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Full Matrix</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Push Heatwave &amp; Sunscreen Notifications</td>
                  <td className="text-center text-emerald-400 font-bold">&check; APNs</td>
                  <td className="text-center text-emerald-400 font-bold">&check; FCM</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Haptic Wrist Taps</td>
                  <td className="text-center text-slate-500">Browser Notification</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Interactive Hydration Counter</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Widget &amp; Island</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Material Card</td>
                  <td className="text-center text-emerald-400 font-bold">&check; 1-Tap Crown Log</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Sync Logger</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Emergency SOS &amp; Nearest Cooling Center</td>
                  <td className="text-center text-emerald-400 font-bold">&check; 1-Tap Routing</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Google Maps GPS</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Action Button SOS</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Full GIS Directory</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">All 650,000 Villages &amp; 787 Districts</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Cached</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Cached</td>
                  <td className="text-center text-slate-500">Top 10 Favorites</td>
                  <td className="text-center text-emerald-400 font-bold">&check; Full Directory</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Academic Research Lab &amp; VIVA Mode</td>
                  <td className="text-center text-slate-500">Simplified</td>
                  <td className="text-center text-slate-500">Simplified</td>
                  <td className="text-center text-slate-500">&mdash;</td>
                  <td className="text-center text-purple-400 font-bold">&check; Full RQ1-RQ6 Suite</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: DEDICATED UNIVERSAL DOWNLOAD HUB (ALL FORMATS)
            ───────────────────────────────────────────────────────────── */}
        <div id="downloads-center" className="scroll-mt-6 bg-[#0B132B] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                <Download className="w-3.5 h-3.5" />
                <span>Production Release Packages</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Universal Download Center
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Genuinely downloadable offline binaries, configuration profiles, watch apps, and standalone packages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">Build Version:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#131E3A] border border-slate-700 text-amber-300 font-mono font-bold text-xs">
                v2.0.4-RELEASE
              </span>
            </div>
          </div>

          {/* Download Packages Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOWNLOAD_PACKAGES.map((pkg) => {
              const Icon = pkg.id === 'android' ? Smartphone : (pkg.id === 'ios' ? Smartphone : (pkg.id === 'smartwatch' ? Watch : (pkg.id === 'desktop' ? Laptop : Layers)));
              return (
                <div
                  key={pkg.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 group-hover:bg-slate-750 transition">
                        <Icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${pkg.badgeColor}`}>
                        {pkg.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {pkg.subtitle}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Format:</span>
                        <span className="font-semibold text-slate-200">{pkg.format}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>File Size:</span>
                        <span className="font-bold text-emerald-400">{pkg.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Compatibility:</span>
                        <span className="font-mono text-slate-300 truncate max-w-[150px]">{pkg.compatibility.split('(')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    {/* Direct Physical Download Button */}
                    <button
                      onClick={() => handleTriggerDownload(pkg)}
                      className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {pkg.file.split('.').pop()?.toUpperCase()}</span>
                      <span className="text-[10px] text-blue-200">({pkg.size})</span>
                    </button>

                    {/* Open Guide & Verify Modal */}
                    <button
                      onClick={() => setActiveDownloadModal(pkg)}
                      className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-[11px] rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Cpu className="w-3 h-3 text-slate-400" />
                      <span>Installation Steps &amp; SHA-256</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Offline Assurance Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">100% Offline-Resilient Micro-Inference Engine</span>
                <span className="text-slate-400 text-[11px]">
                  All downloaded binaries include pre-bundled weights, 46 synoptic stations, and the 787 districts dictionary.
                </span>
              </div>
            </div>
            <a
              href="/downloads/downloads-manifest.json"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#131E3A] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-semibold transition flex items-center gap-1.5 shrink-0"
            >
              <span>View Manifest (JSON)</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: INTERACTIVE DOWNLOAD & INSTALLATION ONBOARDING
          ───────────────────────────────────────────────────────────── */}
      {activeDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-700 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              aria-label="Close download modal"
              onClick={() => setActiveDownloadModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{activeDownloadModal.name}</h3>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${activeDownloadModal.badgeColor}`}>
                    {activeDownloadModal.version}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filename: <code className="text-amber-300 font-mono">{activeDownloadModal.file}</code> ({activeDownloadModal.size})
                </p>
              </div>
            </div>

            {/* Direct Action Download Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Target Package Ready</div>
                <div className="text-[11px] text-slate-400">{activeDownloadModal.compatibility}</div>
              </div>
              <button
                onClick={() => handleTriggerDownload(activeDownloadModal)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Now</span>
              </button>
            </div>

            {/* Step-by-Step Installation Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Installation Walkthrough:
              </h4>
              <div className="space-y-2 text-xs">
                {activeDownloadModal.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
              {activeDownloadModal.safariTip && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2 mt-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{activeDownloadModal.safariTip}</span>
                </div>
              )}
            </div>

            {/* SHA-256 Checksum Verification */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 Checksum Integrity:
                </span>
                <button
                  onClick={() => handleCopyHash(activeDownloadModal.sha256)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                </button>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 text-[10px] font-mono text-slate-300 break-all select-all border border-slate-800">
                {activeDownloadModal.sha256}
              </div>
            </div>

            {/* Modal Bottom Button */}
            <button
              onClick={() => setActiveDownloadModal(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Interactive "Plan My Day" Routine Planner */}
      {isDayPlannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              aria-label="Close routine planner modal"
              onClick={() => setIsDayPlannerOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">AI-Optimized Daily Routine</h3>
            </div>
            <p className="text-xs text-slate-300">
              Personalized schedule for <strong>{activeGeo.name}</strong> ({currentTemp}°C, {riskLevel} Risk).
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">06:00 - 08:30 AM</span>
                <div>
                  <div className="font-bold text-white">Optimal Outdoor Window</div>
                  <div className="text-slate-300 text-[11px]">Safe for running, grocery runs, outdoor manual labor, and commuting.</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">08:30 - 11:30 AM</span>
                <div>
                  <div className="font-bold text-white">Pre-Peak Transition</div>
                  <div className="text-slate-300 text-[11px]">Apply SPF 50+ sunscreen. Drink 500ml water before leaving home.</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">12:00 - 04:00 PM</span>
                <div>
                  <div className="font-bold text-rose-300">STRICT PEAK LOCKOUT</div>
                  <div className="text-slate-300 text-[11px]">Severe radiant heat flux ({currentTemp}°C to {currentTemp + 3}°C). Stay indoors in ventilated spaces.</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">06:00 - 09:00 PM</span>
                <div>
                  <div className="font-bold text-white">Evening Cooldown</div>
                  <div className="text-slate-300 text-[11px]">Safe for brief walks. Rehydrate to recover daytime fluid deficit.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDayPlannerOpen(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Interactive AI Assistant Drawer */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-700 rounded-2xl w-full max-w-lg h-[520px] flex flex-col justify-between p-5 shadow-2xl relative">
            <button
              aria-label="Close AI assistant modal"
              onClick={() => setIsAssistantOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">HeatShield Mobile AI Assistant</h3>
                <p className="text-[10px] text-slate-400">Grounded in NOAA GSOD &amp; NIOSH Biometeorology</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar text-xs">
              {assistantChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAssistant()}
                placeholder="Ask about routine, hydration, worker safety..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                aria-label="Send message"
                onClick={handleSendAssistant}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
