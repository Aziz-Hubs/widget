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
  const { theme, assets, textContent } = appearance;
  return {
    ...config,
    displayMode: config.displayMode ?? appearance.displayMode,
    initialMessages: config.initialMessages ?? appearance.initialMessages,
    initialQuestions: config.initialQuestions ?? appearance.initialQuestions,
    ...(theme && {
      theme: {
        ...config.theme,
        palette: config.theme?.palette ?? theme.palette,
        primaryColor: config.theme?.primaryColor ?? theme.primaryColor,
        ...(theme.widgetTrigger?.offset && {
          widgetTrigger: {
            ...config.theme?.widgetTrigger,
            offset: {
              ...theme.widgetTrigger.offset,
              ...config.theme?.widgetTrigger?.offset,
            },
          },
        }),
      },
    }),
    ...(assets?.organizationLogo && {
      assets: {
        ...config.assets,
        organizationLogo:
          config.assets?.organizationLogo ?? assets.organizationLogo,
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
