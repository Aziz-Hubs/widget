import { describe, expect, it } from 'vitest';
import { isCtaVisible } from '../utils/cta-visibility';

const DAY = 86_400_000;
const now = 1_000 * DAY;
const shown = {
  cta: { title: 'Questions?' },
  isOpen: false,
  override: null,
  dismissedAt: null,
  now,
  href: 'https://shop.example/pricing',
  delayElapsed: true,
} as const;

describe('isCtaVisible', () => {
  it('shows a configured card on a closed widget', () => {
    expect(isCtaVisible(shown)).toBe(true);
  });

  it('hides without a card or while the widget is open, even when forced', () => {
    expect(isCtaVisible({ ...shown, cta: undefined, override: 'show' })).toBe(
      false,
    );
    expect(isCtaVisible({ ...shown, isOpen: true, override: 'show' })).toBe(
      false,
    );
  });

  it('keeps a dismissal forever without dismissForDays', () => {
    expect(isCtaVisible({ ...shown, dismissedAt: now - 365 * DAY })).toBe(
      false,
    );
  });

  it('brings the card back once dismissForDays has elapsed', () => {
    const cta = { title: 'Questions?', dismissForDays: 7 };
    expect(isCtaVisible({ ...shown, cta, dismissedAt: now - 6 * DAY })).toBe(
      false,
    );
    expect(isCtaVisible({ ...shown, cta, dismissedAt: now - 8 * DAY })).toBe(
      true,
    );
  });

  it('honors urlMatch as a substring of the page URL', () => {
    const cta = { title: 'Questions?', urlMatch: '/pricing' };
    expect(isCtaVisible({ ...shown, cta })).toBe(true);
    expect(
      isCtaVisible({ ...shown, cta, href: 'https://shop.example/blog' }),
    ).toBe(false);
  });

  it('waits for showAfterSeconds', () => {
    expect(isCtaVisible({ ...shown, delayElapsed: false })).toBe(false);
  });

  it('lets showCta bypass the rules and hideCta beat everything', () => {
    const blocked = {
      ...shown,
      dismissedAt: now,
      delayElapsed: false,
      href: 'x',
    };
    expect(
      isCtaVisible({ ...blocked, cta: { title: 't', urlMatch: 'y' } }),
    ).toBe(false);
    expect(
      isCtaVisible({
        ...blocked,
        cta: { title: 't', urlMatch: 'y' },
        override: 'show',
      }),
    ).toBe(true);
    expect(isCtaVisible({ ...shown, override: 'hide' })).toBe(false);
  });
});
