/**
 * HeatShield AI — Browser & Native Notification Service
 * Manages Web Notifications API, permissions, and system emergency alerts.
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
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.savePreferences({ enabled: true });
        this.triggerTestNotification(
          '🔔 HeatShield AI Notifications Active',
          'You will now receive real-time meteorological warnings, peak heat risk alerts, and emergency advisories.'
        );
      }
      return result as NotificationPermissionStatus;
    } catch (err) {
      console.error('[NotificationService] Permission request error:', err);
      return this.getPermission();
    }
  }

  /**
   * Dispatch a local notification if granted and preferences allow
   */
  sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    const prefs = this.getPreferences();
    if (!prefs.enabled) return false;

    try {
      const defaultIcon = '/favicon.ico';
      const notification = new Notification(title, {
        icon: defaultIcon,
        badge: defaultIcon,
        silent: !prefs.sound,
        ...options
      } as any);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (e) {
      console.warn('[NotificationService] Notification dispatch error:', e);
      return false;
    }
  }

  /**
   * Dispatches an immediate test notification
   */
  triggerTestNotification(title?: string, body?: string): boolean {
    return this.sendNotification(
      title || '☀️ HeatShield AI Test Alert',
      {
        body: body || 'Real-time biometeorological monitoring is functioning normally. Stay hydrated!',
        tag: 'heatshield-test-' + Date.now(),
        requireInteraction: false
      }
    );
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
    if (!this.isSupported() || Notification.permission !== 'granted') return;

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
