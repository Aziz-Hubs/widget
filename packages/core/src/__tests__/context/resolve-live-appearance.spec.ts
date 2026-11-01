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
    welcomeScreen: {
      title: 'Hi, we are Acme',
      description: 'Ask us anything.',
    },
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
      theme: {
        primaryColor: '#111111',
        widgetTrigger: { offset: { bottom: 80 } },
      },
      textContent: { welcomeScreen: { title: 'From code' } },
      initialQuestions: ['Code question'],
    };
    const resolved = resolveLiveAppearance(published, config);
    expect(resolved.displayMode).toBe('companion');
    expect(resolved.theme?.primaryColor).toBe('#111111');
    // Keys code left alone still come from the published look.
    expect(resolved.theme?.palette).toBe('slate');
    expect(resolved.theme?.widgetTrigger?.offset).toEqual({
      bottom: 80,
      left: 20,
      right: 'initial',
    });
    expect(resolved.textContent?.welcomeScreen).toEqual({
      title: 'From code',
      description: 'Ask us anything.',
    });
    expect(resolved.initialQuestions).toEqual(['Code question']);
    expect(resolved.initialMessages).toEqual(['Welcome back!']);
    expect(resolved.assets?.organizationLogo).toBe(
      'https://cdn.example.com/logo.png',
    );
  });

  it('lays the studio keys under code: code wins key by key, published fills gaps', () => {
    const studio: Dto['WidgetAppearanceDto'] = {
      cssOverrides: '[data-component="cta/root"]{color:red}',
      cta: { title: 'Published CTA', dismissForDays: 7 },
      bot: { name: 'Ava', avatarUrl: 'https://cdn.example.com/ava.png' },
      humanAgent: { avatarUrl: 'https://cdn.example.com/human.png' },
      assets: {
        widgetTrigger: {
          openIcon: 'https://cdn.example.com/open.svg',
          closeIcon: 'https://cdn.example.com/close.svg',
        },
      },
      theme: {
        widgetTrigger: { size: { button: 64, icon: 28 } },
        widgetContentContainer: {
          borderRadius: '24px',
          boxShadow: '0 0 0 red',
          outline: '1px solid',
          outlineColor: 'blue',
        },
      },
    };

    const filled = resolveLiveAppearance(studio, base);
    expect(filled.cssOverrides).toBe(studio.cssOverrides);
    expect(filled.cta).toEqual(studio.cta);
    expect(filled.bot).toEqual({
      name: 'Ava',
      avatarUrl: 'https://cdn.example.com/ava.png',
    });
    expect(filled.humanAgent?.avatarUrl).toBe(
      'https://cdn.example.com/human.png',
    );
    expect(filled.assets?.widgetTrigger).toEqual(studio.assets?.widgetTrigger);
    expect(filled.theme?.widgetTrigger?.size).toEqual({ button: 64, icon: 28 });
    expect(filled.theme?.widgetContentContainer).toEqual(
      studio.theme?.widgetContentContainer,
    );

    const code: WidgetConfig = {
      ...base,
      cssOverrides: '.mine{}',
      cta: { title: 'Code CTA' },
      bot: { name: 'Codey', avatarUrl: null },
      humanAgent: { avatarUrl: 'https://code.example/human.png' },
      assets: { widgetTrigger: { openIcon: 'https://code.example/open.svg' } },
      theme: {
        widgetTrigger: { size: { icon: 20 } },
        widgetContentContainer: { borderRadius: '8px' },
      },
    };
    const resolved = resolveLiveAppearance(studio, code);
    // Whole-value keys: code's string / object wins outright.
    expect(resolved.cssOverrides).toBe('.mine{}');
    expect(resolved.cta).toEqual({ title: 'Code CTA' });
    // Key-by-key: code's keys win, published fills the rest.
    expect(resolved.bot).toEqual({
      name: 'Codey',
      avatarUrl: 'https://cdn.example.com/ava.png',
    });
    expect(resolved.humanAgent?.avatarUrl).toBe(
      'https://code.example/human.png',
    );
    expect(resolved.assets?.widgetTrigger).toEqual({
      openIcon: 'https://code.example/open.svg',
      closeIcon: 'https://cdn.example.com/close.svg',
    });
    expect(resolved.theme?.widgetTrigger?.size).toEqual({
      button: 64,
      icon: 20,
    });
    expect(resolved.theme?.widgetContentContainer).toEqual({
      borderRadius: '8px',
      boxShadow: '0 0 0 red',
      outline: '1px solid',
      outlineColor: 'blue',
    });
  });

  it('styles the pill from the published look, code winning key by key', () => {
    const resolved = resolveLiveAppearance(
      {
        displayMode: 'companion',
        companion: {
          pillBackground: '#100F0E',
          pillLabel: 'Ask Maya',
          bubbles: true,
          compact: { borderRadius: 24, maxWidth: 420 },
        },
      },
      {
        ...base,
        companion: {
          pillLabel: 'Ask us',
          compact: { maxWidth: 400 },
          layouts: ['sidebar'],
        },
      },
    );
    expect(resolved.companion).toEqual({
      pillBackground: '#100F0E',
      pillLabel: 'Ask us',
      bubbles: true,
      layouts: ['sidebar'],
      compact: { borderRadius: 24, maxWidth: 400 },
    });
    // Positive control: without code options the published pill applies as-is.
    expect(
      resolveLiveAppearance({ companion: { pillLabel: 'Ask Maya' } }, base)
        .companion?.pillLabel,
    ).toBe('Ask Maya');
  });

  it('never touches the token, user or other code-owned options', () => {
    const config: WidgetConfig = {
      ...base,
      user: { token: 'contact' },
      apiUrl: 'https://eu.example.test',
    };
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
