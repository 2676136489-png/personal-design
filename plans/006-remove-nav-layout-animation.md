# 006 - Remove navigation layout animation

- **Status**: DONE
- **Commit**: unborn (repository has no commits)
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 file, under 10 lines

## Problem

The fixed glass navigation animates `min-height` from 66px to 58px after scrolling 24px. Height animation triggers layout and paint while the page is already handling scroll and backdrop-filter composition.

```css
/* src/styles.css:258 - current */
.nav-shell {
  min-height: 66px;
  transition:
    min-height 220ms var(--ease-out),
    box-shadow 220ms var(--ease-out),
    background-color 220ms var(--ease-out);
}

.site-header[data-scrolled="true"] .nav-shell {
  min-height: 58px;
  box-shadow: /* ... */;
}
```

## Target

Keep the navigation at a stable 66px minimum height. Preserve the scroll-state shadow and background-color transitions, which do not change layout.

```css
/* target */
.nav-shell {
  min-height: 66px;
  transition:
    box-shadow 220ms var(--ease-out),
    background-color 220ms var(--ease-out);
}

.site-header[data-scrolled="true"] .nav-shell {
  box-shadow: /* existing value unchanged */;
}
```

## Repo conventions to follow

- Reuse the existing 220ms `--ease-out` transition values.
- Keep the current glass, spacing, grid, and fixed positioning.

## Steps

1. Remove only `min-height 220ms var(--ease-out)` from the `.nav-shell` transition list.
2. Remove only `min-height: 58px` from the scrolled selector.
3. Preserve every existing shadow and background declaration.

## Boundaries

- Do NOT change navigation dimensions, padding, breakpoints, links, or mobile dock.
- Do NOT replace the height animation with width, padding, margin, top, or left animation.
- Do NOT alter the scroll threshold in JavaScript.

## Verification

- **Mechanical**: run `npm run build`; it must exit 0. Search transition declarations and confirm the nav no longer transitions a layout property.
- **Feel check**: slowly cross the 24px scroll threshold in both directions and confirm:
  - text and controls do not shift vertically;
  - the shadow still eases in and out over 220ms;
  - no content beneath the fixed header jumps.
- **Done when**: scrolled navigation feedback uses visual styling without animating layout.
