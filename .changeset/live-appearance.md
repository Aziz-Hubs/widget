---
'@opencx/widget-core': minor
'@opencx/widget-react-headless': minor
'@opencx/widget-react': minor
'@opencx/widget': minor
---

The widget applies the look published in the dashboard (Widget Studio) under the options you pass in code, so published changes reach React installs without a code change. Options set in code always win, key by key. Set `liveAppearance: false` to keep the look fully in code.

New `cta` option: a teaser card above the launcher (popover bubble or companion pill) while the widget is closed. It has a title, body, avatars, buttons that open the chat, ask a question, prefill the composer or open a link, and an optional inline composer that starts a fresh chat. Visitors can dismiss it (remembered for `dismissForDays`, or forever), and `showAfterSeconds` / `urlMatch` decide when it appears. `WidgetRef.showCta()` / `hideCta()` force it, and the `cta/*` component names style it through `cssOverrides`. A `cta` published in the dashboard applies too, along with the published custom CSS, bot name and avatar, human agent avatar, launcher icons and size, and chat window corners, shadow and outline.
