import { Capacitor } from '@capacitor/core';
import { Investment } from '../types';

/**
 * Thin wrapper around @capacitor/local-notifications.
 * - Android 13+ requires the POST_NOTIFICATIONS runtime permission (requested here).
 * - Android 12+/14+ restrict exact alarms; since due-date reminders are not
 *   to-the-minute critical, we deliberately use ordinary (inexact) scheduling,
 *   which survives Doze/battery optimisation far better than exact alarms.
 * - Call rescheduleAll() from an App.appStateChange/launch handler, since
 *   OEMs (Xiaomi/Realme/Samsung) can silently clear scheduled notifications.
 * No-ops safely in the browser dev preview.
 */

const EVENING_REVIEW_ID = 90000;
const DUE_ID_BASE = 100000; // + a stable offset derived from investment id hash

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 5000;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

export async function scheduleEveningReviewReminder(hour = 20, minute = 30): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id: EVENING_REVIEW_ID }] });
  await LocalNotifications.schedule({
    notifications: [{
      id: EVENING_REVIEW_ID,
      title: 'Evening Review',
      body: 'Gratitude, accountability mirror, and tomorrow’s plan — 5 minutes.',
      schedule: { on: { hour, minute }, allowWhileIdle: true, repeats: true },
    }],
  });
}

export async function scheduleInvestmentDueReminders(investments: Investment[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const enabled = investments.filter((i) => i.notifyEnabled && i.dueDay);
  const toCancel = enabled.flatMap((i) => {
    const base = DUE_ID_BASE + hashId(i.id);
    return [{ id: base }, { id: base + 1 }];
  });
  if (toCancel.length) await LocalNotifications.cancel({ notifications: toCancel });

  const notifications = enabled.flatMap((i) => {
    const base = DUE_ID_BASE + hashId(i.id);
    const day = Math.max(1, Math.min(28, i.dueDay!));
    const fiveDaysBefore = ((day - 5 - 1 + 28) % 28) + 1;
    return [
      {
        id: base,
        title: `Due in 5 days: ${i.name}`,
        body: `${i.type} · ₹${i.amount.toLocaleString('en-IN')} due on the ${day}${ordinal(day)}`,
        schedule: { on: { day: fiveDaysBefore, hour: 9, minute: 0 }, allowWhileIdle: true, repeats: true },
      },
      {
        id: base + 1,
        title: `Due tomorrow: ${i.name}`,
        body: `${i.type} · ₹${i.amount.toLocaleString('en-IN')} due on the ${day}${ordinal(day)}`,
        schedule: { on: { day: Math.max(1, day - 1), hour: 9, minute: 0 }, allowWhileIdle: true, repeats: true },
      },
    ];
  });
  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

function ordinal(n: number): string {
  if (n % 10 === 1 && n !== 11) return 'st';
  if (n % 10 === 2 && n !== 12) return 'nd';
  if (n % 10 === 3 && n !== 13) return 'rd';
  return 'th';
}

/** Call once on app launch (and whenever notification settings/investments change). */
export async function rescheduleAllNotifications(investments: Investment[], eveningReviewEnabled: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  if (eveningReviewEnabled) await scheduleEveningReviewReminder();
  await scheduleInvestmentDueReminders(investments);
}
