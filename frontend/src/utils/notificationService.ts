/**
 * HeatShield AI — Browser & Native Notification Service
 * Manages Web Notifications API, ServiceWorker notifications, permissions, and system emergency alerts.
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

const LAST_ALERT_KEY = 'heatshield_last_notified_ts';
const PREFS_KEY = 'heatshield_notification_prefs';
const MIN_NOTIFICATION_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes debounce

export interface NotificationPreferences {
  enabled: boolean;
  highRiskAlerts: boolean;
  extremeHeatAlerts: boolean;
  dailyPeakWindowReminder: boolean;
  sound: boolean;
}

export interface InAppToastPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  timestamp: number;
}

export const defaultNotificationPrefs: NotificationPreferences = {
  enabled: true,
  highRiskAlerts: true,
  extremeHeatAlerts: true,
  dailyPeakWindowReminder: true,
  sound: true
};

class NotificationService {
  /**
   * Check if browser Notification API is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission state
   */
  getPermission(): NotificationPermissionStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Load user notification preferences from localStorage
   */
  getPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        return { ...defaultNotificationPrefs, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to read preferences from localStorage:', e);
    }
    return defaultNotificationPrefs;
  }

  /**
   * Save user notification preferences to localStorage
   */
  savePreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
    const updated = { ...this.getPreferences(), ...prefs };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[NotificationService] Failed to save preferences to localStorage:', e);
    }
    return updated;
  }

  /**
   * Play an alert chime via Web Audio API without needing external audio files
   */
  playAlertChime(isEmergency: boolean = false): void {
    const prefs = this.getPreferences();
    if (!prefs.sound || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (isEmergency) {
        // High-urgency two-tone alert
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(587.33, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Gentle confirmation chime (chord C5 - E5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.35);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
      }
    } catch (e) {
      // AudioContext could be blocked by autoplay policies until gesture
    }
  }

  /**
   * Broadcast an in-app visual toast banner
   */
  dispatchInAppAlert(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'danger' | 'success' = 'info'
  ): void {
    if (typeof window === 'undefined') return;
    const detail: InAppToastPayload = {
      id: 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title,
      message,
      type,
      timestamp: Date.now()
    };
    window.dispatchEvent(new CustomEvent('heatshield:toast', { detail }));
  }

  /**
   * Request notification permission from user with rich feedback
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      this.dispatchInAppAlert(
        'Notifications Unsupported',
        'Your current browser does not support Web Push notifications. In-app alerts will be displayed on screen.',
        'info'
      );
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.savePreferences({ enabled: true });
        this.playAlertChime(false);
        this.dispatchInAppAlert(
          '🔔 Heat Alerts Activated',
          'Real-time meteorological warnings, peak heat advisories, and emergency alerts are now active.',
          'success'
        );
        this.triggerTestNotification(
          '🔔 HeatShield AI Notifications Active',
          'You will now receive instant alerts when heat index in your location reaches high danger levels.'
        );
      } else if (result === 'denied') {
        this.dispatchInAppAlert(
          '⚠️ Browser Notifications Blocked',
          'Push notifications are blocked in your browser site settings. In-app emergency alerts will remain active on your screen.',
          'warning'
        );
      }
      return result as NotificationPermissionStatus;
    } catch (err) {
      console.error('[NotificationService] Permission request error:', err);
      return this.getPermission();
    }
  }

  /**
   * Dispatch a local notification using Service Worker or Notification API fallback
   */
  sendNotification(title: string, options?: NotificationOptions): boolean {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return false;

    const isEmergency = options?.tag?.includes('heat-alert') || title.toLowerCase().includes('extreme');
    this.playAlertChime(isEmergency);

    const defaultIcon = '/favicon.svg';
    const notifOptions: NotificationOptions = {
      icon: defaultIcon,
      badge: defaultIcon,
      silent: !prefs.sound,
      ...options
    };

    // 1. Try ServiceWorker registration first (required for Chrome Android / PWA mobile)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && reg.showNotification) {
            return reg.showNotification(title, notifOptions as any);
          }
        })
        .catch((swErr) => {
          console.warn('[NotificationService] SW showNotification error:', swErr);
        });
    }

    // 2. Try Notification constructor (desktop browsers)
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, notifOptions as any);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (e) {
        // Mobile browsers throw Illegal Constructor for new Notification()
      }
    }

    // 3. Always dispatch in-app alert banner
    this.dispatchInAppAlert(
      title,
      options?.body || 'Stay hydrated and monitor local heat conditions.',
      isEmergency ? 'danger' : 'info'
    );

    return true;
  }

  /**
   * Dispatches an immediate test notification
   */
  triggerTestNotification(title?: string, body?: string): boolean {
    const testTitle = title || '☀️ HeatShield AI Test Alert';
    const testBody = body || 'Real-time biometeorological monitoring is functioning normally. Stay hydrated!';
    
    this.sendNotification(testTitle, {
      body: testBody,
      tag: 'heatshield-test-' + Date.now(),
      requireInteraction: false
    });

    return true;
  }

  /**
   * Checks conditions and dispatches heatwave alerts with interval debouncing
   */
  checkAndNotifyHeatRisk(
    locationName: string,
    tempC: number,
    feelsLikeC: number,
    riskLevel: string,
    peakWindow: string = '12:30 PM – 3:30 PM'
  ): void {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return;

    const isHighOrExtreme = riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('extreme');
    const isVeryHot = tempC >= 40 || feelsLikeC >= 42;

    if (!isHighOrExtreme && !isVeryHot) return;

    // Check debounce time
    try {
      const lastNotified = Number(localStorage.getItem(LAST_ALERT_KEY) || 0);
      const now = Date.now();
      if (now - lastNotified < MIN_NOTIFICATION_INTERVAL_MS) {
        return; // Debounced
      }
      localStorage.setItem(LAST_ALERT_KEY, String(now));
    } catch (e) {}

    const title = isVeryHot
      ? `🚨 EXTREME HEAT ALERT: ${locationName}`
      : `⚠️ HIGH HEAT RISK: ${locationName}`;

    const body = `Ambient ${tempC.toFixed(1)}°C (Feels like ${feelsLikeC.toFixed(1)}°C). Peak risk window: ${peakWindow}. Stay hydrated and avoid direct sun.`;

    this.sendNotification(title, {
      body,
      tag: 'heatshield-heat-alert',
      requireInteraction: true
    });
  }
}

export const notificationService = new NotificationService();
