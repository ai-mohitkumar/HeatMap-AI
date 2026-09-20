/**
 * HeatShield AI — Universal Telephony & Direct Dialer Engine
 * Handles direct native phone dialing across mobile devices, PWAs, Android/iOS WebViews,
 * and desktop browsers with sanitized tel: URIs and automatic fallbacks.
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
 * Directly opens the mobile device's native calling/dialer app with the specified number.
 * Uses a multi-tiered approach:
 * 1. Sanitizes the phone number into standard tel: protocol.
 * 2. Navigates `window.location.href` to trigger the system intent.
 * 3. Fallback to programmatic anchor element click.
 */
export function initiatePhoneCall(rawPhone: string, event?: { stopPropagation?: () => void; preventDefault?: () => void }): boolean {
  if (event) {
    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  }

  const cleaned = cleanPhoneNumber(rawPhone);
  if (!cleaned) {
    console.warn('[PhoneCall] Cannot initiate call: empty or invalid phone number:', rawPhone);
    return false;
  }

  const telUri = `tel:${cleaned}`;

  try {
    // Primary mechanism for mobile browsers, PWAs, Android Chrome and iOS Safari:
    // Direct location assignment opens the system dialer with the phone number pre-filled.
    window.location.href = telUri;
    return true;
  } catch (err) {
    console.warn('[PhoneCall] window.location.href failed, attempting anchor dispatch:', err);
    try {
      const anchor = document.createElement('a');
      anchor.href = telUri;
      anchor.rel = 'noopener';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
      }, 300);
      return true;
    } catch (fallbackErr) {
      console.error('[PhoneCall] Failed to open calling app:', fallbackErr);
      return false;
    }
  }
}
