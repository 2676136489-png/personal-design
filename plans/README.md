# Motion improvement plans

Audit baseline: `unborn (repository has no commits)`.

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | Decouple scroll progress from React rendering | HIGH | DONE |
| 002 | Make project pointer motion direct and compositor-only | HIGH | DONE |
| 003 | Complete and unify project sheet transitions | HIGH | DONE |
| 004 | Preserve feedback in reduced-motion modes | MEDIUM | DONE |
| 005 | Add a complete toast lifecycle | MEDIUM | DONE |
| 006 | Remove navigation layout animation | MEDIUM | DONE |

## Recommended execution order

1. `001-decouple-scroll-rendering.md`
2. `006-remove-nav-layout-animation.md`
3. `002-smooth-project-pointer.md`
4. `003-complete-project-sheet-transitions.md`
5. `005-add-toast-exit.md`
6. `004-preserve-reduced-motion-feedback.md`

Plan 004 depends on the final project-card target from plan 002 and the sheet/toast closing states from plans 003 and 005. All other plans are independent. Run `npm run build` after each plan and complete the feel checks after the full set is applied.
