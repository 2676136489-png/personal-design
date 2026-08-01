# 003 - Complete and unify project sheet transitions

- **Status**: DONE
- **Commit**: unborn (repository has no commits)
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 2 files, about 35 lines

## Problem

The sheet has a 240ms CSS exit but is unmounted after 180ms. Escape bypasses the closing state and unmounts immediately, so the same surface exits differently depending on how it is dismissed.

```jsx
// src/main.jsx:918 - current
const requestClose = () => {
  if (closing) return;
  setClosing(true);
  closeTimerRef.current = window.setTimeout(onClose, 180);
};

// src/main.jsx:1137 - current
const handleShortcut = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    setCommandOpen((value) => !value);
  }
  if (event.key === 'Escape') setSelectedProject(null);
};
```

```css
/* src/styles.css:1762 - current */
.project-sheet {
  transform: translateX(0);
  transition: transform 240ms var(--ease-drawer);
}
```

## Target

Define `PROJECT_SHEET_DURATION = 240` beside the component and use it for normal close timing. Use 160ms when either `prefers-reduced-motion: reduce` matches or `:root[data-motion="off"]` is active. Every dismissal path must call the same guarded `requestClose` function.

Use a `closingRef` guard so repeated close actions cannot schedule multiple timers. Bind Escape inside `ProjectSheet` while a project is open, call `preventDefault()`, and route through `requestClose`. Remove the project-closing Escape line from `App`; retain the `Ctrl/Cmd+K` shortcut.

The existing CSS target remains:

```css
.project-sheet {
  transform: translateX(0);
  transition: transform 240ms var(--ease-drawer);
}

.sheet-backdrop[data-closing="true"] .project-sheet {
  transform: translateX(100%);
}
```

On mobile, preserve the existing vertical `translateY(100%)` close direction.

## Repo conventions to follow

- Keep `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` from `src/styles.css:30`.
- Keep backdrop fade at 180ms for normal motion; the faster backdrop and slower sheet produce the intended asymmetric response.
- Continue restoring previous focus and managing `body[data-overlay-open]` in the existing effect.

## Steps

1. Add `PROJECT_SHEET_DURATION = 240` near `ProjectSheet` and a `closingRef` inside it.
2. Define one `requestClose` path that checks `closingRef`, sets both closing state/ref, chooses 240ms or 160ms from current motion preferences, and then calls `onClose`.
3. In the project-open effect, reset closing state/ref, bind Escape to `requestClose`, and remove that listener during cleanup.
4. Keep overlay click and close button routed through `requestClose`.
5. Remove only `if (event.key === 'Escape') setSelectedProject(null);` from the `App` shortcut effect.
6. Verify mobile CSS still exits downward and normal desktop CSS exits rightward; do not change those directions.

## Boundaries

- Do NOT change sheet markup, content, width, focus target, or scroll behavior.
- Do NOT introduce a second Escape listener in `App`.
- Do NOT shorten the normal sheet transform below 240ms.
- If another overlay owns Escape at the same time, ensure the topmost overlay handles it and STOP if event ownership is ambiguous.

## Verification

- **Mechanical**: run `npm run build`; it must exit 0.
- **Feel check**: open a project and dismiss via close button, backdrop, and Escape. Confirm:
  - all three exits finish instead of disappearing at 180ms;
  - pressing Escape repeatedly schedules only one close;
  - pressing close during the entrance retargets from the current visible position;
  - focus returns to the opener after unmount;
  - desktop exits right and mobile exits down.
- **Done when**: no code path can directly unmount an open project sheet before its selected transition completes.
