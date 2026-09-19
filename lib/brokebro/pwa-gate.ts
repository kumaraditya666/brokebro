/**
 * Pure install-prompt gating (tested). The component adds the browser event +
 * timing on top. Never spams: requires engagement, honors 30-day dismissal.
 */
export function shouldShowInstall(o: {
  standalone: boolean;
  dismissedAt: number | null;
  visits: number;
  txns: number;
  promptable: boolean; // beforeinstallprompt captured (Android/desktop)
  ios?: boolean; // iOS gets the manual guide instead
}): boolean {
  if (o.standalone) return false;
  if (o.dismissedAt && Date.now() - o.dismissedAt < 30 * 24 * 3600 * 1000) return false;
  if (o.visits < 3 && o.txns < 3) return false;
  if (o.promptable) return true;
  return !!o.ios;
}
