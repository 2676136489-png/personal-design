# 002 - Make project pointer motion direct and compositor-only

- **Status**: DONE
- **Commit**: unborn (repository has no commits)
- **Severity**: HIGH
- **Category**: Performance / Physicality
- **Estimated scope**: 2 files, about 95 lines

## Problem

`src/main.jsx:551` reads layout, queries media state, and writes four inheritable CSS variables on every raw pointer event. Those parent variables recalculate styles for the card subtree. The fixed 180ms transform transition also trails behind continuous pointer input. The card transform competes with the later `[data-reveal]` transform rule.

```jsx
// src/main.jsx:551 - current
const handlePointerMove = (event) => {
  const card = cardRef.current;
  if (!card || event.pointerType === 'touch') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  card.style.setProperty('--pointer-x', `${x * 100}%`);
  card.style.setProperty('--pointer-y', `${y * 100}%`);
  card.style.setProperty('--tilt-x', `${(0.5 - y) * 2.4}deg`);
  card.style.setProperty('--tilt-y', `${(x - 0.5) * 2.4}deg`);
};
```

```css
/* src/styles.css:1021 - current */
.project-card {
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  --pointer-x: 50%;
  --pointer-y: 50%;
  transform: perspective(1100px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transition:
    border-color 180ms var(--ease-out),
    box-shadow 220ms var(--ease-out),
    transform 180ms var(--ease-out);
}
```

## Target

Move the interactive transform to `.project-card-button`, leaving the article transform exclusively for reveal motion. Cache the card rect on pointer enter. Pointer events update only target values; a single `requestAnimationFrame` loop updates direct `transform` values on the button and a dedicated glint element.

Use two independent critically damped springs for X and Y:

```js
const response = 0.3;
const dampingRatio = 1;
const omega = (2 * Math.PI) / response;
const stiffness = omega * omega;
const damping = 2 * dampingRatio * omega;

velocity += (-stiffness * (current - target) - damping * velocity) * dt;
current += velocity * dt;
```

Clamp `dt` to `1 / 30` seconds after tab stalls. Cap rotation at the existing 2.4 degree range. Stop the loop when both axes are within `0.0005` of target and velocities are below `0.0005`. On pointer leave, retarget both axes to `0.5`; the spring must continue from its current values without restarting. Do not use a fixed-duration transition for pointer-driven transforms.

Add a real `.project-glint` span inside `.project-card-button`. It is a 220px square at top-left and moves with `translate3d(xPx - 110px, yPx - 110px, 0)`, so no `left`/`top` layout animation is used. Fade it with `opacity 160ms var(--ease-out)`.

Skip the effect for touch pointers, `prefers-reduced-motion: reduce`, or `:root[data-motion="off"]`. Keep the glint opacity feedback but keep card rotation at zero in those modes.

## Repo conventions to follow

- Reuse `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` from `src/styles.css:28` for the glint fade.
- Keep hover styling under `@media (hover: hover) and (pointer: fine)` as at `src/styles.css:2080`.
- Preserve the current 2.4 degree maximum and `perspective(1100px)` visual strength.

## Steps

1. Add refs for the button surface, glint, animation frame, and spring state in `ProjectCard`.
2. Add an unmount cleanup effect that cancels the pending animation frame.
3. Replace per-move layout and custom-property writes with `pointerenter`, `pointermove`, and `pointerleave` handlers that cache bounds, update targets, and ensure one spring loop is running.
4. Attach `surfaceRef` to `.project-card-button` and add a ref-backed `.project-glint` span inside the button.
5. Remove tilt/pointer custom properties, article transform, and article transform transition from `.project-card`.
6. Add the perspective transform to `.project-card-button`; add the compositor-positioned glint CSS; replace `.project-card:hover::after` with `.project-card:hover .project-glint`.
7. Update reduced-motion selectors to target `.project-card-button` instead of the article where applicable.

## Boundaries

- Do NOT add Motion, Framer Motion, or another dependency.
- Do NOT change project card sizing, grid placement, copy, images, or click behavior.
- Do NOT animate `left`, `top`, width, height, filter, or parent CSS variables.
- Do NOT apply tilt to touch input.
- If reveal motion still writes transform to the button after the edit, STOP and report the conflict.

## Verification

- **Mechanical**: run `npm run build`; it must exit 0. Search `src` and confirm no `--pointer-x`, `--pointer-y`, `--tilt-x`, or `--tilt-y` remains.
- **Feel check**: move the pointer rapidly in circles over every project-card size and confirm:
  - the highlight remains under the pointer without a 180ms trailing queue;
  - the card settles continuously to neutral when the pointer exits;
  - re-entering during settle retargets from the current visible angle with no jump;
  - touch emulation and reduced-motion mode show no rotation;
  - Performance panel shows at most one animation-frame callback per display frame and no repeated layout read on pointer move.
- **Done when**: pointer motion writes only direct `transform`/`opacity` on dedicated elements and remains interruptible.
