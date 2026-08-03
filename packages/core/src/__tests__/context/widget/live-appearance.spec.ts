import '../../api-caller.mock';

import { ApiCaller } from '../../../api/api-caller';
import { WidgetCtx } from '../../../context/widget.ctx';
import type { WidgetConfig } from '../../../types/widget-config';

const EXTERNAL_CONFIG = {
  org: { id: 'org-id', name: 'Org' },
  sessionsPollingIntervalSeconds: 60,
  sessionPollingIntervalSeconds: 10,
  modes: [],
  appearance: null,
};

suite('live appearance', () => {
  test('deeply applies appearance without mutating inline presentation options', async () => {
    const inlineConfig = {
      token: 'inline-token',
      theme: {
        primaryColor: '#111111',
        screens: {
          chat: { width: '700px', height: '640px' },
        },
      },
    };
    const data = {
      ...EXTERNAL_CONFIG,
      appearance: {
        theme: {
          primaryColor: '#2255ff',
          widgetContentContainer: { borderRadius: '20px' },
        },
      },
    };
    vi.mocked(
      ApiCaller.prototype.getExternalWidgetConfig,
    ).mockResolvedValueOnce({
      response: new Response(),
      data,
    });

    const widgetCtx = await WidgetCtx.initialize({ config: inlineConfig });

    expect(widgetCtx.config.theme).toEqual({
      primaryColor: '#2255ff',
      screens: {
        chat: { width: '700px', height: '640px' },
      },
      widgetContentContainer: { borderRadius: '20px' },
    });
    expect(inlineConfig.theme).toEqual({
      primaryColor: '#111111',
      screens: {
        chat: { width: '700px', height: '640px' },
      },
    });
  });

  test('only lets saved presentation fields override embed-owned behavior', async () => {
    const onNavigateToChat = vi.fn();
    const onSessionCreated = vi.fn();
    const onMessageReceived = vi.fn();
    const inlineConfig: WidgetConfig = {
      token: 'inline-token',
      apiUrl: 'https://customer-proxy.example.com',
      language: 'fr',
      isOpen: true,
      openAfterNSeconds: 5,
      collectUserData: true,
      prefillUserData: { name: 'Inline visitor' },
      extraDataCollectionFields: ['Account ID'],
      user: { token: 'visitor-token', externalId: 'workspace-id' },
      router: { chatScreenOnly: true },
      hooks: { onNavigateToChat, onSessionCreated, onMessageReceived },
      oneOpenSessionAllowed: true,
      headers: { 'x-customer': 'inline' },
      queryParams: { account: '123' },
      bodyProperties: { plan: 'pro' },
      context: { page: 'checkout' },
      messageCustomData: { source: 'widget' },
      sessionCustomData: { source: 'website' },
      inline: true,
      disableLiveAppearance: false,
      disableSendingWhenAwaitingAIReply: false,
      cssOverrides: '.inline { color: red; }',
    };
    const data = {
      ...EXTERNAL_CONFIG,
      appearance: {
        token: 'server-token',
        language: 'de',
        isOpen: false,
        openAfterNSeconds: 60,
        collectUserData: false,
        prefillUserData: { name: 'Server visitor' },
        extraDataCollectionFields: ['Server field'],
        user: { token: 'server-visitor-token' },
        router: { chatScreenOnly: false },
        hooks: {},
        oneOpenSessionAllowed: false,
        headers: { authorization: 'server' },
        queryParams: { account: 'server' },
        bodyProperties: { plan: 'server' },
        context: { page: 'server' },
        messageCustomData: { source: 'server' },
        sessionCustomData: { source: 'server' },
        inline: false,
        disableLiveAppearance: true,
        disableSendingWhenAwaitingAIReply: true,
        apiUrl: 'https://attacker.example.com',
        cssOverrides: '.server { color: blue; }',
      },
    };
    vi.mocked(
      ApiCaller.prototype.getExternalWidgetConfig,
    ).mockResolvedValueOnce({
      response: new Response(),
      data,
    });

    const widgetCtx = await WidgetCtx.initialize({ config: inlineConfig });

    expect(widgetCtx.config).toMatchObject({
      token: 'inline-token',
      apiUrl: 'https://customer-proxy.example.com',
      language: 'fr',
      isOpen: true,
      openAfterNSeconds: 5,
      collectUserData: true,
      prefillUserData: { name: 'Inline visitor' },
      extraDataCollectionFields: ['Account ID'],
      user: { token: 'visitor-token', externalId: 'workspace-id' },
      router: { chatScreenOnly: true },
      hooks: { onNavigateToChat, onSessionCreated, onMessageReceived },
      oneOpenSessionAllowed: true,
      headers: { 'x-customer': 'inline' },
      queryParams: { account: '123' },
      bodyProperties: { plan: 'pro' },
      context: { page: 'checkout' },
      messageCustomData: { source: 'widget' },
      sessionCustomData: { source: 'website' },
      inline: true,
      disableLiveAppearance: false,
      disableSendingWhenAwaitingAIReply: false,
      cssOverrides: '.server { color: blue; }',
    });
  });

  test('applies every supported presentation field and replaces arrays', async () => {
    const inlineConfig: WidgetConfig = {
      token: 'inline-token',
      bot: { name: 'Inline bot', avatarUrl: '/inline-bot.png' },
      humanAgent: { name: 'Inline agent', avatarUrl: '/inline-agent.png' },
      disableTooltips: false,
      assets: {
        organizationLogo: '/inline-logo.png',
        widgetTrigger: { openIcon: '/inline-open.svg' },
      },
      chatBannerItems: [{ message: 'Inline banner' }],
      initialMessages: ['Inline greeting'],
      advancedInitialMessages: [{ message: 'Inline advanced greeting' }],
      initialQuestions: ['Inline question'],
      initialQuestionsPosition: 'above-chat-input',
      chatFooterItems: [{ message: 'Inline footer' }],
      textContent: {
        welcomeScreen: {
          title: 'Inline title',
          description: 'Inline description',
        },
      },
      anchorTarget: '_top',
      thisWasHelpfulOrNot: { enabled: false },
      timestamps: { perMessageGroup: { enabled: false } },
      accessibility: { widgetTriggerButton: { label: 'Inline label' } },
    };
    const data = {
      ...EXTERNAL_CONFIG,
      appearance: {
        bot: { name: 'Saved bot' },
        humanAgent: { name: 'Saved agent' },
        disableTooltips: true,
        assets: {
          organizationLogo: '/saved-logo.png',
          widgetTrigger: { closeIcon: '/saved-close.svg' },
        },
        chatBannerItems: [{ message: 'Saved banner', persistent: true }],
        initialMessages: ['Saved greeting'],
        advancedInitialMessages: [
          { message: 'Saved advanced greeting', persistent: true },
        ],
        initialQuestions: ['Saved question'],
        initialQuestionsPosition: 'below-initial-messages',
        chatFooterItems: [
          { message: 'Saved footer', showWhenSessionIsOpen: false },
        ],
        textContent: {
          welcomeScreen: { title: 'Saved title' },
          chatScreen: { headerTitle: 'Saved chat' },
        },
        anchorTarget: '_blank',
        thisWasHelpfulOrNot: { enabled: true },
        timestamps: { perMessageGroup: { enabled: true } },
        accessibility: { widgetTriggerButton: { label: 'Saved label' } },
      },
    };
    vi.mocked(
      ApiCaller.prototype.getExternalWidgetConfig,
    ).mockResolvedValueOnce({
      response: new Response(),
      data,
    });

    const widgetCtx = await WidgetCtx.initialize({ config: inlineConfig });

    expect(widgetCtx.config).toMatchObject({
      bot: { name: 'Saved bot', avatarUrl: '/inline-bot.png' },
      humanAgent: { name: 'Saved agent', avatarUrl: '/inline-agent.png' },
      disableTooltips: true,
      assets: {
        organizationLogo: '/saved-logo.png',
        widgetTrigger: {
          openIcon: '/inline-open.svg',
          closeIcon: '/saved-close.svg',
        },
      },
      chatBannerItems: [{ message: 'Saved banner', persistent: true }],
      initialMessages: ['Saved greeting'],
      advancedInitialMessages: [
        { message: 'Saved advanced greeting', persistent: true },
      ],
      initialQuestions: ['Saved question'],
      initialQuestionsPosition: 'below-initial-messages',
      chatFooterItems: [
        { message: 'Saved footer', showWhenSessionIsOpen: false },
      ],
      textContent: {
        welcomeScreen: {
          title: 'Saved title',
          description: 'Inline description',
        },
        chatScreen: { headerTitle: 'Saved chat' },
      },
      anchorTarget: '_blank',
      thisWasHelpfulOrNot: { enabled: true },
      timestamps: { perMessageGroup: { enabled: true } },
      accessibility: { widgetTriggerButton: { label: 'Saved label' } },
    });
  });

  test('blocks prototype-pollution keys at every merged object level', async () => {
    const inlineConfig: WidgetConfig = {
      token: 'inline-token',
      theme: {
        primaryColor: '#111111',
        screens: { chat: { width: '700px' } },
      },
    };
    const pollutionKeys = {
      ['__proto__']: { polluted: true },
      constructor: { polluted: true },
      prototype: { polluted: true },
    };
    const data = {
      ...EXTERNAL_CONFIG,
      appearance: {
        theme: {
          primaryColor: '#2255ff',
          ...pollutionKeys,
          screens: pollutionKeys,
        },
      },
    };
    vi.mocked(
      ApiCaller.prototype.getExternalWidgetConfig,
    ).mockResolvedValueOnce({
      response: new Response(),
      data,
    });

    const widgetCtx = await WidgetCtx.initialize({ config: inlineConfig });
    const resolvedTheme = widgetCtx.config.theme;
    const resolvedScreens = resolvedTheme?.screens;

    expect(resolvedTheme?.primaryColor).toBe('#2255ff');
    expect(Object.getPrototypeOf(resolvedTheme)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(resolvedScreens)).toBe(Object.prototype);
    for (const key of ['constructor', 'prototype']) {
      expect(Object.prototype.hasOwnProperty.call(resolvedTheme, key)).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(resolvedScreens, key)).toBe(
        false,
      );
    }
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  test('skips only live appearance when the inline config opts out', async () => {
    const inlineConfig = {
      token: 'inline-token',
      disableLiveAppearance: true,
      theme: { primaryColor: '#111111' },
    };
    const data = {
      ...EXTERNAL_CONFIG,
      org: { id: 'saved-org-id', name: 'Saved org' },
      modes: [{ id: 'saved-mode-id', name: 'Saved mode', slug: null }],
      appearance: { theme: { primaryColor: '#2255ff' } },
    };
    vi.mocked(
      ApiCaller.prototype.getExternalWidgetConfig,
    ).mockResolvedValueOnce({
      response: new Response(),
      data,
    });

    const widgetCtx = await WidgetCtx.initialize({ config: inlineConfig });

    expect(widgetCtx.config.theme).toEqual({ primaryColor: '#111111' });
    expect(widgetCtx.org).toEqual({ id: 'saved-org-id', name: 'Saved org' });
    expect(widgetCtx.modes).toEqual([
      { id: 'saved-mode-id', name: 'Saved mode', slug: null },
    ]);
  });
});
