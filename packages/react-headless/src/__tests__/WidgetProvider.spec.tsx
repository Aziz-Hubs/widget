import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { WidgetConfig } from '@opencx/widget-core';
import { WidgetProvider, useWidget } from '../WidgetProvider';

test('provides the config resolved by WidgetCtx', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const inlineConfig: WidgetConfig = {
    token: 'inline-token',
    theme: {
      primaryColor: '#111111',
      screens: { chat: { width: '700px' } },
    },
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            org: { id: 'org-id', name: 'Org' },
            sessionsPollingIntervalSeconds: 60,
            sessionPollingIntervalSeconds: 10,
            modes: [],
            appearance: {
              theme: {
                primaryColor: '#2255ff',
                widgetContentContainer: { borderRadius: '20px' },
              },
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    ),
  );

  let providedConfig: WidgetConfig | null = null;
  function ConfigProbe() {
    providedConfig = useWidget().config;
    return null;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <WidgetProvider
        options={inlineConfig}
        components={[{ key: 'fallback', component: () => null }]}
      >
        <ConfigProbe />
      </WidgetProvider>,
    );
  });
  await act(async () => {
    await vi.waitUntil(() => providedConfig !== null);
  });

  expect(providedConfig).toMatchObject({
    token: 'inline-token',
    theme: {
      primaryColor: '#2255ff',
      screens: { chat: { width: '700px' } },
      widgetContentContainer: { borderRadius: '20px' },
    },
  });

  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
