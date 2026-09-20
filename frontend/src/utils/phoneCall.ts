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
 * Uses an Android-WebView-safe, cross-platform architecture:
 * 1. Cancels any default link navigation so Android WebView doesn't misinterpret "tel:112" as "http://tel:112/".
 * 2. Uses an Android Intent URL (intent://...#Intent;action=android.intent.action.DIAL) to directly fire the phone app.
 * 3. Uses a hidden 1px iframe to dispatch the tel: protocol without navigating the parent window.
 * 4. Fallback to programmatic anchor dispatch with target="_system".
 */
export function initiatePhoneCall(
  rawPhone: string,
  event?: { stopPropagation?: () => void; preventDefault?: () => void }
): boolean {
  if (event) {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
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
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');

  // 1. Android Intent dispatch (Gold standard for Android WebViews & Chrome:
  // Directly fires android.intent.action.DIAL so WebView never treats "tel:112" as host:port http://tel:112/)
  if (isAndroid) {
    try {
      const intentUri = `intent://${cleaned}#Intent;scheme=tel;action=android.intent.action.DIAL;end`;
      const intentAnchor = document.createElement('a');
      intentAnchor.href = intentUri;
      intentAnchor.target = '_system';
      intentAnchor.style.display = 'none';
      document.body.appendChild(intentAnchor);
      intentAnchor.click();
      setTimeout(() => {
        try {
          document.body.removeChild(intentAnchor);
        } catch {}
      }, 500);
      return true;
    } catch (intentErr) {
      console.warn('[PhoneCall] Android intent dispatch fallback:', intentErr);
    }
  }

  // 2. Safe Hidden Iframe dispatch (Universal for iOS Safari & Android:
  // Setting an invisible subframe src NEVER navigates the top window and never triggers net::ERR_CLEARTEXT_NOT_PERMITTED)
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = telUri;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 1500);
    return true;
  } catch (iframeErr) {
    console.warn('[PhoneCall] Iframe dispatch error:', iframeErr);
  }

  // 3. Fallback programmatic anchor dispatch with target="_system" / "_top"
  try {
    const anchor = document.createElement('a');
    anchor.href = telUri;
    anchor.target = '_system';
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      try {
        document.body.removeChild(anchor);
      } catch {}
    }, 500);
    return true;
  } catch (fallbackErr) {
    console.error('[PhoneCall] Failed to open calling app:', fallbackErr);
    return false;
  }
}
