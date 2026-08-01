# 004 - Preserve feedback in reduced-motion modes

- **Status**: DONE
- **Commit**: unborn (repository has no commits)
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 2 files, about 60 lines

## Problem

Both reduced-motion paths set every animation and transition to 1ms. This removes useful opacity, color, focus, switch, and selection feedback instead of replacing vestibular movement with a gentler equivalent.

```css
/* src/styles.css:2823 - current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}

:root[data-motion="off"] *,
:root[data-motion="off"] *::before,
:root[data-motion="off"] *::after {
  scroll-behavior: auto !important;
  animation-duration: 1ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 1ms !important;
}
```

## Target

Remove the universal duration overrides. Keep short opacity/color feedback and remove only spatial motion:

```css
/* target behavior for both OS preference and in-app motion off */
html,
:root[data-motion="off"] {
  scroll-behavior: auto;
}

[data-reveal] {
  opacity: 1;
  transform: none;
  transition: none;
}

.project-card-button {
  transform: none !important;
}

.project-sheet {
  transform: none !important;
  transition: opacity 160ms var(--ease-out);
}

.sheet-backdrop[data-closing="true"] .project-sheet,
.toast[data-closing="true"] {
  opacity: 0;
}

.toast {
  transform: translateX(-50%);
  transition: opacity 160ms var(--ease-out);
}
```

Express the target twice: once inside `@media (prefers-reduced-motion: reduce)` and once prefixed by `:root[data-motion="off"]`. Keep existing background, border, color, and opacity transitions for buttons and selection controls. The project sheet and toast may cross-fade for 160ms but must not slide or scale.

In `handleNavigate`, smooth-scroll only when the in-app motion setting is on and the OS preference does not request reduction.

## Repo conventions to follow

- Reuse `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- The existing `prefers-reduced-transparency` block is independent; leave it intact.
- Existing hover movement is already gated by `(hover: hover) and (pointer: fine)` and should remain there.

## Steps

1. Delete the wildcard reduced-motion duration overrides in `src/styles.css`.
2. Add explicit no-spatial-motion rules for reveals, project tilt, project sheet, toast, large hover transforms, and smooth scrolling under OS reduced motion.
3. Add equivalent explicit selectors under `:root[data-motion="off"]` without suppressing color/background/border/opacity feedback.
4. Ensure project sheet and toast use 160ms opacity-only exits in both reduced modes.
5. Update `handleNavigate` in `src/main.jsx` to require both `motion === true` and no OS reduced-motion match before selecting `behavior: 'smooth'`.
6. Confirm the pointer handler from plan 002 checks both reduced-motion signals before starting its spring.

## Boundaries

- Do NOT modify `prefers-reduced-transparency` behavior.
- Do NOT remove focus, hover color, pressed-state, selection, or switch-state feedback.
- Do NOT leave any wildcard `transition-duration: 1ms` rule.
- Do NOT add keyframes.

## Verification

- **Mechanical**: run `npm run build`; it must exit 0. Search for `transition-duration: 1ms`; expected result is no matches.
- **Feel check**: test both DevTools reduced-motion emulation and the in-app motion toggle. Confirm:
  - reveals appear without translation;
  - project cards do not tilt;
  - sheets and toasts cross-fade for 160ms without sliding/scaling;
  - button and segmented-control color feedback remains visible;
  - navigation jumps rather than smooth-scrolls.
- **Done when**: reduced-motion users retain state-change comprehension without viewport-scale movement.
