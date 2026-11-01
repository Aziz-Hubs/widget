import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetConfig } from '@opencx/widget-core';
import { CtaCard } from '../CtaCard';

const open = vi.fn();
const navigate = vi.fn();
const contact: { token: string | undefined } = { token: 'visitor' };
vi.mock('@opencx/widget-react-headless', () => ({
  useConfig: () => ({ token: 'org' }),
  useDocumentDir: () => ({ dir: 'ltr' }),
  useContact: () => ({ contactState: { contact: { token: contact.token } } }),
  useWidgetRouter: () => ({ toChatScreen: navigate }),
  useWidgetTrigger: () => ({ setIsOpen: open }),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const cta: NonNullable<WidgetConfig['cta']> = {
  title: 'Questions?',
  body: 'We reply in minutes.',
  buttons: [
    { text: 'Chat', action: 'open-chat' },
    { text: 'Earnings?', action: 'ask', message: 'How do earnings work?' },
    { text: 'Draft', action: 'prefill', message: 'I need help with' },
    {
      text: 'Docs',
      action: 'url',
      url: 'https://docs.example',
      variant: 'secondary',
    },
  ],
  composer: { placeholder: 'Write…' },
};

describe('CTA card', () => {
  let container: HTMLDivElement;
  let root: Root;
  const send = vi.fn();
  const draft = { setPartial: vi.fn() };
  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    contact.token = 'visitor';
    navigate.mockReturnValue({
      messageCtx: { sendMessage: send, draftState: draft },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<CtaCard cta={cta} onDismiss={onDismiss} />));
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const button = (text: string) =>
    Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[data-component="cta/btn"]',
      ),
    ).find((b) => b.textContent === text);

  it('renders the content with styleable component names', () => {
    expect(
      container.querySelector('[data-component="cta/title"]')?.textContent,
    ).toBe('Questions?');
    expect(
      container.querySelector('[data-component="cta/body"]')?.textContent,
    ).toBe('We reply in minutes.');
    expect(button('Docs')?.dataset.variant).toBe('secondary');
    expect(button('Chat')?.dataset.variant).toBe('primary');
  });

  it('open-chat only opens the widget', () => {
    act(() => button('Chat')?.click());
    expect(open).toHaveBeenCalledWith(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ask opens a fresh chat and sends the message', () => {
    act(() => button('Earnings?')?.click());
    expect(open).toHaveBeenCalledWith(true);
    expect(send).toHaveBeenCalledExactlyOnceWith({
      content: 'How do earnings work?',
    });
    expect(draft.setPartial).not.toHaveBeenCalled();
  });

  it('prefill opens a fresh chat with the message in the composer, unsent', () => {
    act(() => button('Draft')?.click());
    expect(draft.setPartial).toHaveBeenCalledExactlyOnceWith({
      text: 'I need help with',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('url opens a new tab without touching the widget', () => {
    const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    act(() => button('Docs')?.click());
    expect(windowOpen).toHaveBeenCalledWith(
      'https://docs.example',
      '_blank',
      'noopener',
    );
    expect(open).not.toHaveBeenCalled();
  });

  it('sends what the visitor typed into a fresh chat; blank input sends nothing', () => {
    const form = container.querySelector<HTMLFormElement>(
      '[data-component="cta/composer"]',
    );
    const input = form?.querySelector('input');
    act(() => form?.requestSubmit());
    expect(send).not.toHaveBeenCalled();

    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    act(() => {
      setValue?.call(input, '  Hello there  ');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => form?.requestSubmit());
    expect(send).toHaveBeenCalledExactlyOnceWith({ content: 'Hello there' });
    expect(input?.value).toBe('');
  });

  it('does not start a chat before the contact exists', () => {
    contact.token = undefined;
    act(() =>
      root.render(<CtaCard key="no-contact" cta={cta} onDismiss={onDismiss} />),
    );
    act(() => button('Earnings?')?.click());
    expect(navigate).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('reports the dismiss X', () => {
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[data-component="cta/dismiss"]')
        ?.click(),
    );
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
