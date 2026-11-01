import type { WidgetConfig } from '../types/widget-config';

/** Host-forced visibility from `showCta()` / `hideCta()`; null follows the rules. */
export type CtaOverride = 'show' | 'hide' | null;

const DAY_MS = 86_400_000;

/**
 * Whether the CTA card renders. An open widget always hides it; `hide` beats
 * `show`; `show` bypasses the dismissal, URL and delay rules. A dismissal
 * without `dismissForDays` lasts forever.
 */
export function isCtaVisible({
  cta,
  isOpen,
  override,
  dismissedAt,
  now,
  href,
  delayElapsed,
}: {
  cta: WidgetConfig['cta'];
  isOpen: boolean;
  override: CtaOverride;
  dismissedAt: number | null;
  now: number;
  href: string;
  delayElapsed: boolean;
}): boolean {
  if (!cta || isOpen || override === 'hide') return false;
  if (override === 'show') return true;
  const dismissed =
    dismissedAt !== null &&
    (cta.dismissForDays === undefined ||
      now < dismissedAt + cta.dismissForDays * DAY_MS);
  const urlMatches = cta.urlMatch === undefined || href.includes(cta.urlMatch);
  return !dismissed && urlMatches && delayElapsed;
}
