import { describe, expect, it } from 'vitest';
import { resolveLiveAppearance } from '../../context/resolve-live-appearance';
import type { Dto } from '../../api/client';
import type { WidgetConfig } from '../../types/widget-config';

const published: Dto['WidgetAppearanceDto'] = {
  displayMode: 'popover',
  theme: {
    primaryColor: '#0f766e',
    palette: 'slate',
    widgetTrigger: { offset: { bottom: 24, left: 20, right: 'initial' } },
  },
  assets: { organizationLogo: 'https://cdn.example.com/logo.png' },
  textContent: {
    welcomeScreen: { title: 'Hi, we are Acme', description: 'Ask us anything.' },
    chatScreen: { headerTitle: 'Support' },
  },
  initialMessages: ['Welcome back!'],
  initialQuestions: ['Where is my order?'],
};

const base: WidgetConfig = { token: 'org-token' };

describe('resolveLiveAppearance', () => {
  it('applies the published look to a token-only embed', () => {
    const resolved = resolveLiveAppearance(published, base);
    expect(resolved).toMatchObject({ ...published, token: 'org-token' });
  });

  it('lets every option set in code win, key by key', () => {
    const config: WidgetConfig = {
      ...base,
      displayMode: 'companion',
      theme: { primaryColor: '#111111', widgetTrigger: { offset: { bottom: 80 } } },
      textContent: { welcomeScreen: { title: 'From code' } },
      initialQuestions: ['Code question'],
    };
    const resolved = resolveLiveAppearance(published, config);
    expect(resolved.displayMode).toBe('companion');
    expect(resolved.theme?.primaryColor).toBe('#111111');
    // Keys code left alone still come from the published look.
    expect(resolved.theme?.palette).toBe('slate');
    expect(resolved.theme?.widgetTrigger?.offset).toEqual({ bottom: 80, left: 20, right: 'initial' });
    expect(resolved.textContent?.welcomeScreen).toEqual({
      title: 'From code',
      description: 'Ask us anything.',
    });
    expect(resolved.initialQuestions).toEqual(['Code question']);
    expect(resolved.initialMessages).toEqual(['Welcome back!']);
    expect(resolved.assets?.organizationLogo).toBe('https://cdn.example.com/logo.png');
  });

  it('never touches the token, user or other code-owned options', () => {
    const config: WidgetConfig = { ...base, user: { token: 'contact' }, apiUrl: 'https://eu.example.test' };
    const resolved = resolveLiveAppearance(published, config);
    expect(resolved.token).toBe('org-token');
    expect(resolved.user).toEqual({ token: 'contact' });
    expect(resolved.apiUrl).toBe('https://eu.example.test');
  });

  it('returns the options untouched with no published look or when opted out', () => {
    expect(resolveLiveAppearance(null, base)).toBe(base);
    expect(resolveLiveAppearance(undefined, base)).toBe(base);
    const optedOut: WidgetConfig = { ...base, liveAppearance: false };
    expect(resolveLiveAppearance(published, optedOut)).toBe(optedOut);
  });
});
