# 001 - Decouple scroll progress from React rendering

- **Status**: DONE
- **Commit**: unborn (repository has no commits)
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files, about 45 lines

## Problem

`src/main.jsx:215` stores scroll progress in React state and creates a new state object on every animation frame. That rerenders the entire `App` tree while scrolling. `src/main.jsx:1133` then writes an inheritable custom property on `document.documentElement`, forcing style recalculation through the page.

```jsx
// src/main.jsx:215 - current
function usePagePosition() {
  const [state, setState] = useState({ active: 'top', progress: 0, scrolled: false });

  // ...
  setState({
    active,
    progress: Math.min(scrollTop / maxScroll, 1),
    scrolled: scrollTop > 24,
  });
}

// src/main.jsx:1133 - current
useEffect(() => {
  document.documentElement.style.setProperty('--scroll-progress', pagePosition.progress);
}, [pagePosition.progress]);
```

```css
/* src/styles.css:247 - current */
transform: scaleX(var(--scroll-progress));
```

## Target

Keep only `active` and `scrolled` in React state, and call `setState` only when either value changes. Update the progress bar's own compositor transform directly from the existing scroll `requestAnimationFrame` callback.

```jsx
// target shape
function usePagePosition(progressRef) {
  const [state, setState] = useState({ active: 'top', scrolled: false });
  const stateRef = useRef(state);

  // inside update()
  const progress = Math.min(scrollTop / maxScroll, 1);
  if (progressRef.current) {
    progressRef.current.style.transform = `scaleX(${progress})`;
  }

  const nextState = { active, scrolled: scrollTop > 24 };
  if (
    nextState.active !== stateRef.current.active ||
    nextState.scrolled !== stateRef.current.scrolled
  ) {
    stateRef.current = nextState;
    setState(nextState);
  }
}
```

`Navigation` must receive `progressRef` and attach it to `.scroll-progress span`. `App` must create the ref before calling `usePagePosition(progressRef)`. Remove the root custom-property effect and remove `--scroll-progress` from `:root`.

```css
/* target */
.scroll-progress span {
  transform: scaleX(0);
  transform-origin: left center;
  will-change: transform;
}
```

## Repo conventions to follow

- Keep the existing passive scroll listener and one-frame scheduling pattern at `src/main.jsx:239`.
- Keep the existing `--ease-out`, `--ease-in-out`, and `--ease-drawer` tokens in `src/styles.css:28` unchanged.
- Use refs for frame-rate visual updates; existing components already use refs for focus and timers.

## Steps

1. Change `usePagePosition` in `src/main.jsx` to accept `progressRef`, remove `progress` from state, write only the progress span transform per frame, and guard React state updates with `stateRef`.
2. Add a `progressRef` prop to `Navigation` and attach it to the progress `<span>`.
3. Create `progressRef` in `App`, pass it to both `usePagePosition` and `Navigation`, and delete the `--scroll-progress` effect.
4. In `src/styles.css`, remove the root `--scroll-progress` declaration and initialize the progress span with `scaleX(0)` plus `will-change: transform`.

## Boundaries

- Do NOT change section IDs or active-section threshold behavior.
- Do NOT add a scroll animation library or a new dependency.
- Do NOT move progress updates to React context or state.
- If the named hook or progress markup has drifted, STOP and report instead of improvising.

## Verification

- **Mechanical**: run `npm run build`; it must exit 0 with no Vite errors.
- **Feel check**: continuously scroll from top to contact and confirm:
  - the 3px progress bar tracks every frame without jumps;
  - active navigation still updates at the same section boundaries;
  - React DevTools Profiler no longer shows `App` committing every scroll frame;
  - mobile scrolling remains responsive while glass surfaces are visible.
- **Done when**: scroll progress is updated directly on one DOM element and React state changes only at nav/scrolled boundaries.
