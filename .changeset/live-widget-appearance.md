---
'@opencx/widget-core': minor
'@opencx/widget-react-headless': minor
'@opencx/widget-react': minor
'@opencx/widget': minor
---

Load the organization's saved live appearance during widget initialization.
Presentation fields are allowlisted and deep-merged while authentication,
visitor identity, request configuration, routing, hooks, and other embed-owned
behavior remain unchanged. Set `disableLiveAppearance` for code-owned previews
that must keep their inline presentation options.
