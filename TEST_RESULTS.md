# Chess Clock BD — Test Results (2026-10-29, run #170)

## Unit tests — 19/19 passed, 0 repairs

`node tests/test.js` — DOM-free `js/logic.js` tested exactly as shipped:

- `formatMs`: 600000→"10:00", 61000→"1:01", 60000→"1:00", 59999→"59.9",
  9500→"9.5", 0→"0.0", negative clamped to "0.0".
- `validCustomMinutes`: 1 and 180 valid; 0, 181, 2.5, "abc" invalid.
- Flow (5+0): start gives White the move; tick 60s → White 240000;
  press White → turn Black, moves White 1, White time unchanged at 0 increment.
- Wrong-side press rejected with turn unchanged.
- Pause freezes the clock; resume keeps the same side to move.
- Increment (1+2): tick 10s → 50000; press White → 52000 (2s banked).
- Flag: tick 60s on 1+0 → flagged White, winner Black, clock frozen,
  further ticks/presses/starts rejected.
- Reset restores both clocks, clears flag, applies new control (5+3).
- i18n: EN and BN key sets identical; `toBnDigits("123")` = "১২৩".

## Headless-Chrome smoke — 20/20 passed, 0 repairs

`node tests/smoke.js` (raw CDP, /opt/meta-chromium/chrome, file://):

- Title, both clocks at 5:00, initial status mentions White, 0 console errors.
- Start → White ticks (not 5:00 after ~1.6s), White panel active, button reads Pause.
- Press White → Black active, White moves "1 moves".
- Pause → status "Paused", Black clock frozen across 1.2s.
- Reset → both 5:00, moves 0/0.
- Preset 1 → both 1:00; custom 0 → inline error, clocks unchanged;
  custom 10 → both 10:00.
- BN toggle → document title contains "দাবা", White label "সাদা".
- 390px emulated mobile: scrollWidth ≤ 390 (no horizontal overflow).
- 0 console/page errors across the whole run.

## Notes

- No network requests by design (no CDN, no fonts, no analytics).
- Sound path is best-effort (WebAudio guarded with try/catch) and was not
  asserted headlessly; the flag banner is the authoritative signal.
