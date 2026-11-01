import { log } from '@opencx/widget-core';
import React from 'react';
import {
  useContact,
  useWidget,
  useWidgetRouter,
  useWidgetTrigger,
} from '@opencx/widget-react-headless';

export type WidgetRef = {
  /** Open the widget on a fresh conversation, optionally sending its first message. */
  newChat: (options?: { message?: string }) => Promise<void>;
  /** Show the `cta` card now, past its dismissal, URL and delay rules. */
  showCta: () => void;
  /** Hide the `cta` card until `showCta()` or a reload. */
  hideCta: () => void;
};

export function WidgetImperativeHandler({
  widgetRef,
}: {
  widgetRef: React.Ref<WidgetRef>;
}) {
  const { contactState } = useContact();
  const { setIsOpen } = useWidgetTrigger();
  const { toChatScreen } = useWidgetRouter();
  const { ctaOverride } = useWidget().widgetCtx;

  React.useImperativeHandle(
    widgetRef,
    () => ({
      newChat: async (options) => {
        if (!contactState.contact?.token) {
          log.warn('cannot start a new chat: contact not yet initialized');
          return;
        }
        setIsOpen(true);
        // Companion navigation selects an independent runtime synchronously;
        // React may not have rendered its hooks yet, so send to that runtime.
        const conversation = toChatScreen();
        if (conversation && options?.message) {
          await conversation.messageCtx.sendMessage({
            content: options.message,
          });
        }
      },
      showCta: () => ctaOverride.set('show'),
      hideCta: () => ctaOverride.set('hide'),
    }),
    [contactState, setIsOpen, toChatScreen, ctaOverride],
  );

  return null;
}
