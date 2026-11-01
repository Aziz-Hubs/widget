import { ArrowUpIcon, XIcon } from 'lucide-react';
import React from 'react';
import { isCtaVisible, log, type WidgetConfig } from '@opencx/widget-core';
import {
  useConfig,
  useContact,
  useDisplayMode,
  useHostLocation,
  usePrimitiveState,
  useWidget,
  useWidgetRouter,
  useWidgetTrigger,
} from '@opencx/widget-react-headless';
import { CompanionFrame } from './companion/CompanionFrame';
import { PILL_SIZE } from './companion/companion-geometry';
import { buildFrameHtml, FrameDocument } from './components/FrameDocument';
import { cn } from './components/lib/utils/cn';
import { useTheme } from './hooks/useTheme';
import { useTranslation } from './hooks/useTranslation';
import { dc } from './utils/data-component';

type Cta = NonNullable<WidgetConfig['cta']>;
type CtaButton = NonNullable<Cta['buttons']>[number];

/**
 * The CTA teaser card's content and actions. Visibility, placement and the
 * dismissal record live in `CtaLauncherCard`.
 */
export function CtaCard({
  cta,
  onDismiss,
}: {
  cta: Cta;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const { contactState } = useContact();
  const { setIsOpen } = useWidgetTrigger();
  const { toChatScreen } = useWidgetRouter();
  const [draft, setDraft] = React.useState('');

  /** A fresh chat with `message` sent (or left in the composer), as `WidgetRef.newChat`. */
  const startChat = (message: string, send: boolean) => {
    if (!contactState.contact?.token) {
      log.warn('cannot start a chat from the CTA: contact not yet initialized');
      return;
    }
    setIsOpen(true);
    const conversation = toChatScreen();
    if (!conversation) return;
    if (send) void conversation.messageCtx.sendMessage({ content: message });
    else conversation.messageCtx.draftState.setPartial({ text: message });
  };

  const onButton = (button: CtaButton) => {
    switch (button.action) {
      case 'open-chat':
        setIsOpen(true);
        return;
      case 'ask':
      case 'prefill':
        if (button.message) startChat(button.message, button.action === 'ask');
        else setIsOpen(true);
        return;
      case 'url':
        if (button.url) window.open(button.url, '_blank', 'noopener');
        return;
    }
  };

  return (
    <div
      {...dc('cta/root')}
      className={cn(
        'relative flex flex-col rounded-2xl border border-black/5 p-4',
        'bg-background text-foreground',
        'shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)]',
      )}
    >
      <button
        {...dc('cta/dismiss')}
        type="button"
        aria-label={t('dialog_close')}
        onClick={onDismiss}
        className="absolute end-2 top-2 cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
      >
        <XIcon className="size-4" />
      </button>

      <p
        {...dc('cta/title')}
        className="m-0 pe-6 text-base font-bold leading-snug"
      >
        {cta.title}
      </p>

      {cta.body && (
        <p
          {...dc('cta/body')}
          className="m-0 mt-1 text-sm leading-normal text-muted-foreground"
        >
          {cta.body}
        </p>
      )}

      {!!cta.avatarUrls?.length && (
        <div {...dc('cta/avatars')} className="mt-2.5 flex -space-x-2.5">
          {cta.avatarUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt=""
              className="size-8 rounded-full border-2 border-background object-cover"
            />
          ))}
        </div>
      )}

      {!!cta.buttons?.length && (
        <div {...dc('cta/buttons')} className="mt-3.5 flex flex-col gap-2">
          {cta.buttons.map((button, index) => {
            const variant = button.variant ?? 'primary';
            return (
              <button
                key={index}
                {...dc('cta/btn')}
                type="button"
                data-variant={variant}
                onClick={() => onButton(button)}
                className={cn(
                  'cursor-pointer rounded-xl px-4 py-2.5 text-sm transition-opacity hover:opacity-90',
                  variant === 'primary'
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'bg-secondary font-medium text-secondary-foreground',
                )}
              >
                {button.text}
              </button>
            );
          })}
        </div>
      )}

      {cta.composer && (
        <form
          {...dc('cta/composer')}
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text) return;
            startChat(text, true);
            setDraft('');
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              cta.composer.placeholder ?? t('write_a_message_placeholder')
            }
            className="min-w-0 flex-1 rounded-full border border-transparent bg-secondary px-3.5 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            aria-label={t('send_message')}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </form>
      )}
    </div>
  );
}

const initialContent = buildFrameHtml({ transparent: true });
/** Room inside the frame so the card's shadow is not clipped. */
const SHADOW_ROOM = 16;
const GAP_ABOVE_LAUNCHER = 12;

/**
 * Places the CTA card above the launcher (popover bubble or companion pill) in
 * its own style-isolated frame while the widget is closed.
 */
export function CtaLauncherCard() {
  const { cta } = useConfig();
  const { widgetCtx } = useWidget();
  const { isOpen } = useWidgetTrigger();
  const displayMode = useDisplayMode();
  const href = useHostLocation();
  const { theme, triggerSide } = useTheme();
  const override = usePrimitiveState(widgetCtx.ctaOverride);
  const storageCtx = widgetCtx.storageCtx;

  // Unknown until storage answers, so a dismissed card never flashes.
  const [dismissedAt, setDismissedAt] = React.useState<
    number | null | 'loading'
  >(storageCtx ? 'loading' : null);
  React.useEffect(() => {
    if (!storageCtx) return;
    storageCtx
      .getCtaDismissedAt()
      .then(setDismissedAt)
      .catch((e: unknown) => {
        log.warn('could not read the CTA dismissal', e);
        setDismissedAt(null);
      });
  }, [storageCtx]);

  const showAfterSeconds = cta?.showAfterSeconds ?? 0;
  const [delayElapsed, setDelayElapsed] = React.useState(showAfterSeconds <= 0);
  React.useEffect(() => {
    if (showAfterSeconds <= 0) return;
    const timer = setTimeout(
      () => setDelayElapsed(true),
      showAfterSeconds * 1000,
    );
    return () => clearTimeout(timer);
  }, [showAfterSeconds]);

  const [height, setHeight] = React.useState(0);
  const observerRef = React.useRef<ResizeObserver | null>(null);
  const measureRef = React.useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    setHeight(el.offsetHeight);
    observerRef.current = observer;
  }, []);

  const visible =
    dismissedAt !== 'loading' &&
    isCtaVisible({
      cta,
      isOpen,
      override,
      dismissedAt,
      now: Date.now(),
      href,
      delayElapsed,
    });
  if (!cta || !visible) return null;

  const dismiss = () => {
    const now = Date.now();
    setDismissedAt(now);
    if (override === 'show') widgetCtx.ctaOverride.set(null);
    storageCtx?.setCtaDismissedAt(now).catch((e: unknown) => {
      log.warn('could not persist the CTA dismissal', e);
    });
  };

  const companion = displayMode === 'companion';
  const launcherHeight = companion
    ? PILL_SIZE
    : theme.widgetTrigger.size.button;
  const bottom =
    theme.widgetTrigger.offset.bottom +
    launcherHeight +
    GAP_ABOVE_LAUNCHER -
    SHADOW_ROOM;
  const sideOffset = theme.widgetTrigger.offset[triggerSide];
  const placement: React.CSSProperties = companion
    ? // ponytail: centered on the resting pill; a pill the visitor dragged
      // sideways keeps the card centered.
      { left: '50%', transform: 'translateX(-50%)' }
    : {
        [triggerSide]:
          typeof sideOffset === 'number'
            ? sideOffset - SHADOW_ROOM
            : sideOffset,
      };

  return (
    <CompanionFrame
      title="OpenCX Chat CTA"
      initialContent={initialContent}
      style={{
        ...placement,
        position: 'fixed',
        bottom,
        zIndex: theme.widgetTrigger.zIndex,
        width: `min(${360 + SHADOW_ROOM * 2}px, 100vw)`,
        height: height || 0,
        border: 0,
        background: 'transparent',
      }}
    >
      <FrameDocument style={{ overflow: 'visible' }}>
        <div ref={measureRef} style={{ padding: SHADOW_ROOM }}>
          <CtaCard cta={cta} onDismiss={dismiss} />
        </div>
      </FrameDocument>
    </CompanionFrame>
  );
}
