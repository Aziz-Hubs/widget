import type { Dto } from '../api/client';
import type { WidgetConfig } from '../types/widget-config';

type Appearance = Dto['WidgetAppearanceDto'];

/**
 * The org's published look (dashboard / Companion "Widget Studio") applied
 * under the embed's own options. Code always wins, key by key, so a site that
 * sets `theme.primaryColor` keeps it while still picking up a published
 * welcome title. `liveAppearance: false` opts out entirely.
 */
export function resolveLiveAppearance(
  appearance: Appearance | null | undefined,
  config: WidgetConfig,
): WidgetConfig {
  if (!appearance || config.liveAppearance === false) return config;
  const { theme, assets, textContent, bot, humanAgent, companion } = appearance;
  // `bot.name` is required by the option's type; without one from either side
  // the org's agent name stays (useBot falls back to it).
  const botName = config.bot?.name ?? bot?.name;
  return {
    ...config,
    displayMode: config.displayMode ?? appearance.displayMode,
    initialMessages: config.initialMessages ?? appearance.initialMessages,
    initialQuestions: config.initialQuestions ?? appearance.initialQuestions,
    cssOverrides: config.cssOverrides ?? appearance.cssOverrides,
    cta: config.cta ?? appearance.cta,
    ...(bot &&
      botName !== undefined && {
        bot: {
          ...config.bot,
          name: botName,
          avatarUrl: config.bot?.avatarUrl ?? bot.avatarUrl ?? null,
        },
      }),
    // The pill (companion display mode): code wins key by key.
    ...(companion && {
      companion: {
        ...companion,
        ...config.companion,
        compact: { ...companion.compact, ...config.companion?.compact },
      },
    }),
    ...(humanAgent && {
      humanAgent: {
        ...config.humanAgent,
        avatarUrl: config.humanAgent?.avatarUrl ?? humanAgent.avatarUrl,
      },
    }),
    ...(theme && {
      theme: {
        ...config.theme,
        palette: config.theme?.palette ?? theme.palette,
        primaryColor: config.theme?.primaryColor ?? theme.primaryColor,
        ...(theme.widgetTrigger && {
          widgetTrigger: {
            ...config.theme?.widgetTrigger,
            offset: {
              ...theme.widgetTrigger.offset,
              ...config.theme?.widgetTrigger?.offset,
            },
            size: {
              ...theme.widgetTrigger.size,
              ...config.theme?.widgetTrigger?.size,
            },
          },
        }),
        ...(theme.widgetContentContainer && {
          widgetContentContainer: {
            ...theme.widgetContentContainer,
            ...config.theme?.widgetContentContainer,
          },
        }),
      },
    }),
    ...(assets && {
      assets: {
        ...config.assets,
        organizationLogo:
          config.assets?.organizationLogo ?? assets.organizationLogo,
        widgetTrigger: {
          ...assets.widgetTrigger,
          ...config.assets?.widgetTrigger,
        },
      },
    }),
    ...(textContent && {
      textContent: {
        ...config.textContent,
        welcomeScreen: {
          ...textContent.welcomeScreen,
          ...config.textContent?.welcomeScreen,
        },
        sessionsScreen: {
          ...textContent.sessionsScreen,
          ...config.textContent?.sessionsScreen,
        },
        chatScreen: {
          ...textContent.chatScreen,
          ...config.textContent?.chatScreen,
        },
      },
    }),
  };
}
