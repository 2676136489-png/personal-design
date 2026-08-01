# 005 - Add a complete toast lifecycle

- **Status**: DONE
- **Commit**: unborn (repository has no commits)
- **Severity**: MEDIUM
- **Category**: Interruptibility / Physicality
- **Estimated scope**: 2 files, about 35 lines

## Problem

The toast has a `@starting-style` but no transition declaration, then `App` unmounts it at 2600ms. It therefore appears and disappears abruptly instead of completing a restrained entrance and exit.

```jsx
// src/main.jsx:1089 - current
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast liquid-glass" role="status" key={toast.id}>
      // ...
    </div>
  );
}

// src/main.jsx:1150 - current
useEffect(() => {
  if (!toast) return undefined;
  const timer = window.setTimeout(() => setToast(null), 2600);
  return () => window.clearTimeout(timer);
}, [toast]);
```

```css
/* src/styles.css:2010 - current */
.toast {
  transform: translateX(-50%);
}
```

## Target

Make `Toast` own its visual lifecycle. For each new `toast.id`, reset closing to false, wait 2400ms, set `data-closing="true"`, then call the stable state setter after another 180ms. Pass `setToast` directly as `onDismiss` so effect dependencies remain stable. Remove the timer effect from `App`.

```css
/* target */
.toast {
  opacity: 1;
  transform: translateX(-50%);
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out);
}

.toast[data-closing="true"] {
  opacity: 0;
  transform: translateX(-50%) translateY(8px) scale(0.98);
}
```

Keep the current `@starting-style` entrance of `translateY(14px) scale(0.96)`. In reduced-motion modes, plan 004 overrides transform and retains only the 160ms opacity cross-fade.

## Repo conventions to follow

- Reuse the existing `--ease-out` token.
- Keep the current `role="status"`, visual styling, message copy, and 2600ms approximate dwell.
- Continue keying visual content by `toast.id` so a new notification restarts its own lifecycle.

## Steps

1. Change `Toast` to accept `onDismiss`, add `closing` state, and add an effect keyed by `toast?.id` and the stable dismiss setter.
2. In that effect, reset closing, schedule close state at 2400ms, schedule `onDismiss(null)` at 2580ms, and clear both timers on cleanup.
3. Set `data-closing={closing}` on the toast element.
4. Delete the toast timeout effect from `App` and render `<Toast toast={toast} onDismiss={setToast} />`.
5. Add explicit 180ms opacity/transform transitions and the closing target in `src/styles.css`.

## Boundaries

- Do NOT stack multiple toasts or change notification copy.
- Do NOT add keyframes or a toast dependency.
- Do NOT let a stale timer dismiss a newer toast.
- Do NOT remove `role="status"`.

## Verification

- **Mechanical**: run `npm run build`; it must exit 0.
- **Feel check**: trigger copy and share notifications repeatedly. Confirm:
  - each new toast enters from the starting style;
  - it remains readable for roughly 2.4 seconds;
  - it completes an 180ms exit before unmounting;
  - triggering a second toast cancels timers from the first;
  - reduced-motion mode uses opacity only.
- **Done when**: no toast is mounted or unmounted without a corresponding visible transition state.
