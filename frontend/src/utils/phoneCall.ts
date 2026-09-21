/**
 * HeatShield AI — Universal Telephony & Direct Dialer Engine
 * Handles direct native phone dialing, SMS dispatch, and WhatsApp sharing across
 * mobile devices, PWAs (standalone app mode), Android/iOS WebViews, and desktop browsers.
 */

export interface EmergencyHelplineContact {
  id: string;
  name: string;
  number: string;
  category: 'medical' | 'police' | 'disaster' | 'civic';
  description: string;
  color: string;
}

export const NATIONAL_EMERGENCY_HELPLINES: EmergencyHelplineContact[] = [
  {
    id: 'ambulance',
    name: 'Ambulance & Medical Emergency',
    number: '108',
    category: 'medical',
    description: 'Immediate heat stroke, collapse, dehydration & emergency hospital transport',
    color: '#EF4444'
  },
  {
    id: 'national_emergency',
    name: 'National Emergency Response (All-in-One)',
    number: '112',
    category: 'police',
    description: 'Unified national emergency helpline (Police, Fire, Ambulance, Rescue)',
    color: '#F97316'
  },
  {
    id: 'ndma',
    name: 'NDMA Disaster Management Control',
    number: '1078',
    category: 'disaster',
    description: 'National Disaster Management Authority control room & heatwave coordination',
    color: '#3B82F6'
  },
  {
    id: 'state_relief',
    name: 'State Relief Commissioner',
    number: '1070',
    category: 'disaster',
    description: 'State disaster emergency operations & district heat mitigation',
    color: '#6366F1'
  },
  {
    id: 'health_advisory',
    name: 'National Health Helpline',
    number: '104',
    category: 'medical',
    description: '24x7 medical consultation, heat illness symptoms advice & doctor triage',
    color: '#10B981'
  },
  {
    id: 'senior_citizens',
    name: 'Elderly & Senior Citizens Helpline',
    number: '14567',
    category: 'civic',
    description: 'Elderly welfare checks, heat rescue support & critical care assistance',
    color: '#EC4899'
  }
];

/**
 * Sanitizes phone numbers by stripping non-dialable formatting,
 * preserving leading '+' and numeric digits.
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Check if current runtime is iOS (iPhone, iPad, iPod)
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  );
}

/**
 * Directly triggers the native calling/dialer app with the specified number.
 * 
 * Works seamlessly in:
 * - PWA Standalone Mode (installed on Android/iOS Home Screen)
 * - Android Chrome, Firefox, Samsung Internet
 * - iOS Safari & WebKit WebViews
 * - Hybrid WebViews (TWA, Cordova, Capacitor)
 * - Desktop browsers (hands off to system dialer or FaceTime)
 */
export function initiatePhoneCall(
  rawPhone: string,
  event?: { stopPropagation?: () => void; preventDefault?: () => void }
): boolean {
  if (event) {
    try {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    } catch {}
  }

  const cleaned = cleanPhoneNumber(rawPhone);
  if (!cleaned) {
    console.warn('[PhoneCall] Cannot initiate call: empty or invalid phone number:', rawPhone);
    return false;
  }

  const telUri = `tel:${cleaned}`;

  try {
    // 1. Primary mechanism: Top-level location assignment triggers the native dialer
    // without navigating the PWA or browser away from the application.
    window.location.href = telUri;
    return true;
  } catch (err) {
    console.warn('[PhoneCall] window.location.href failed, trying fallback link:', err);
  }

  try {
    // 2. Fallback mechanism: dynamic programmatic anchor click
    const link = document.createElement('a');
    link.href = telUri;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 500);
    return true;
  } catch (fallbackErr) {
    console.error('[PhoneCall] All calling dispatch mechanisms failed:', fallbackErr);
    return false;
  }
}

/**
 * Dispatches an SMS message.
 * Correctly accounts for iOS vs Android RFC format differences:
 * - iOS Safari/PWA requires &body= or ;body=
 * - Android & desktop browsers require ?body=
 */
export function initiateEmergencySms(
  message: string,
  recipientPhone?: string,
  event?: { stopPropagation?: () => void; preventDefault?: () => void }
): boolean {
  if (event) {
    try {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    } catch {}
  }

  const cleanRecipient = recipientPhone ? cleanPhoneNumber(recipientPhone) : '';
  const isIOS = isIOSDevice();
  const encodedBody = encodeURIComponent(message);

  // iOS syntax: sms:[number]&body=[message]
  // Android syntax: sms:[number]?body=[message]
  let smsUri: string;
  if (cleanRecipient) {
    smsUri = isIOS ? `sms:${cleanRecipient}&body=${encodedBody}` : `sms:${cleanRecipient}?body=${encodedBody}`;
  } else {
    smsUri = isIOS ? `sms:&body=${encodedBody}` : `sms:?body=${encodedBody}`;
  }

  try {
    window.location.href = smsUri;
    return true;
  } catch (err) {
    console.warn('[SMS] Direct window.location failed, trying anchor:', err);
  }

  try {
    const link = document.createElement('a');
    link.href = smsUri;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 500);
    return true;
  } catch (fallbackErr) {
    console.error('[SMS] Failed to open messaging app:', fallbackErr);
    return false;
  }
}

/**
 * Dispatches an emergency message via WhatsApp (native app intent or web fallback).
 */
export function initiateWhatsAppShare(
  message: string,
  recipientPhone?: string,
  event?: { stopPropagation?: () => void; preventDefault?: () => void }
): boolean {
  if (event) {
    try {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    } catch {}
  }

  const cleanRecipient = recipientPhone ? cleanPhoneNumber(recipientPhone).replace(/^\+/, '') : '';
  const encodedBody = encodeURIComponent(message);

  const waUrl = cleanRecipient
    ? `https://wa.me/${cleanRecipient}?text=${encodedBody}`
    : `https://wa.me/?text=${encodedBody}`;

  try {
    // On mobile and PWA, setting location opens the installed WhatsApp app directly
    const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
    return true;
  } catch (err) {
    console.warn('[WhatsApp] Opening WhatsApp via window failed:', err);
    try {
      window.location.href = waUrl;
      return true;
    } catch {
      return false;
    }
  }
}
