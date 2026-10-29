# Chess Clock BD

A free, fully offline bilingual (English / বাংলা) two-player chess clock for
over-the-board games. Tap your own clock after you move, just like a physical
chess clock — no account, no network, no data leaves your device.

## Features

- **Two alternating clocks** — White moves first; tap your clock (or press
  `Space`) after your move to hand the turn to your opponent.
- **Time controls** — Presets (1, 3, 5, 10, 15, 30 minutes) plus a custom
  1–180 minute control with inline validation.
- **Fischer increment** — Optional 0–10 seconds added per move, banked when
  you press your clock.
- **Move counters** — Each side's completed moves are shown under its clock.
- **Flag detection** — When a side runs out of time, that side's panel is
  flagged red and the winner ("X wins on time!") is announced, with an
  optional sound (toggleable, WebAudio beep).
- **Pause / resume / reset** — Pause freezes the running clock exactly.
- **Bilingual + mobile** — EN/বাংলা toggle (persisted, with Bengali digits)
  and a stacked 390px mobile layout with large tap targets.
- **Settings persist** — Time control, increment, language, and sound choice
  are saved in localStorage. The game itself is not persisted: a reload
  starts a fresh game at the saved time control.

## Display format

- 60 seconds or more: `M:SS` (e.g. `5:00`, `1:01`)
- Under 60 seconds: `S.t` tenths (e.g. `9.5`) for endgame precision

## Stack

Vanilla HTML / CSS / JavaScript. No frameworks, no build step, no CDN, no
network requests. Game logic is DOM-free in `js/logic.js` so it is unit-tested
exactly as shipped.

## Prerequisites

Any modern browser. For tests: Node.js 18+ and a Chromium binary for the
headless smoke test (defaults to `/opt/meta-chromium/chrome` on this VM;
edit `tests/smoke.js` if yours lives elsewhere).

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Tests

```sh
node tests/test.js    # 19 unit checks: clock logic, increment, flag, format, i18n
node tests/smoke.js   # 20 headless-Chrome checks: ticking, switching, pause,
                      # reset, presets, custom validation, BN toggle, 390px
```

## Deployment

Static site — any static host works, including GitHub Pages (deploy from
`main`, root). No environment variables, no secrets, no backend.

## Limitations

- This is a casual-play clock, not a FIDE-certified device: it does not
  implement delay (Bronstein/USCF) modes, only Fischer increment, and it has
  no move counter-based time controls (e.g. "40 moves in 90 minutes").
- The clock runs in the browser tab; switching tabs may throttle timers
  slightly (the ticker measures real elapsed time, so drift is corrected on
  each tick, but a background tab can still pause visibly).
- Flag sound requires a browser with WebAudio and a prior user gesture
  (pressing Start counts); if audio is unavailable, the flag banner still
  shows.
- Verify the time control against your tournament's rules before rated play.

## Status

MVP complete and tested (see `TEST_RESULTS.md`). Suggestions welcome via
GitHub issues.
