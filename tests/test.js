// Node unit tests for Chess Clock BD logic (js/logic.js, js/i18n.js).
// Run: node tests/test.js — exits non-zero on any failure.
const assert = require('node:assert');
const { ChessClock, formatMs, validCustomMinutes } = require('../js/logic.js');
const { STR, toBnDigits } = require('../js/i18n.js');

let n = 0;
function ok(name, fn) { fn(); n++; console.log('ok - ' + name); }

// formatMs
ok('format 10:00', () => assert.strictEqual(formatMs(600000), '10:00'));
ok('format 1:01', () => assert.strictEqual(formatMs(61000), '1:01'));
ok('format 1:00 boundary', () => assert.strictEqual(formatMs(60000), '1:00'));
ok('format 59.9 under a minute', () => assert.strictEqual(formatMs(59999), '59.9'));
ok('format 9.5', () => assert.strictEqual(formatMs(9500), '9.5'));
ok('format 0.0', () => assert.strictEqual(formatMs(0), '0.0'));
ok('format clamps negative', () => assert.strictEqual(formatMs(-500), '0.0'));

// validCustomMinutes
ok('custom 1 and 180 valid', () => { assert.strictEqual(validCustomMinutes(1), true); assert.strictEqual(validCustomMinutes(180), true); });
ok('custom 0, 181, 2.5, abc invalid', () => {
  assert.strictEqual(validCustomMinutes(0), false);
  assert.strictEqual(validCustomMinutes(181), false);
  assert.strictEqual(validCustomMinutes(2.5), false);
  assert.strictEqual(validCustomMinutes('abc'), false);
});

// basic game flow, 5+0
ok('start gives White the move', () => {
  const c = new ChessClock(5, 0);
  assert.strictEqual(c.start(), true);
  assert.strictEqual(c.turn, 'white');
  assert.strictEqual(c.running, true);
});
ok('tick 60s then press switches turn, 0 increment', () => {
  const c = new ChessClock(5, 0);
  c.start(); c.tick(60000);
  assert.strictEqual(c.whiteMs, 240000);
  assert.strictEqual(c.press('white'), true);
  assert.strictEqual(c.turn, 'black');
  assert.strictEqual(c.moves.white, 1);
  assert.strictEqual(c.whiteMs, 240000);
  c.tick(30000);
  assert.strictEqual(c.blackMs, 270000);
});
ok('pressing the wrong side is rejected', () => {
  const c = new ChessClock(5, 0);
  c.start();
  assert.strictEqual(c.press('black'), false);
  assert.strictEqual(c.turn, 'white');
  assert.strictEqual(c.moves.black, 0);
});
ok('pause freezes the clock', () => {
  const c = new ChessClock(5, 0);
  c.start(); c.pause();
  c.tick(60000);
  assert.strictEqual(c.whiteMs, 300000);
  assert.strictEqual(c.start(), true); // resume keeps White to move
  assert.strictEqual(c.turn, 'white');
});

// Fischer increment: 1 min + 2 sec
ok('increment banks on press', () => {
  const c = new ChessClock(1, 2);
  c.start(); c.tick(10000);
  assert.strictEqual(c.whiteMs, 50000);
  assert.strictEqual(c.press('white'), true);
  assert.strictEqual(c.whiteMs, 52000);
  assert.strictEqual(c.turn, 'black');
});

// flag / win
ok('flag at zero names the other side winner', () => {
  const c = new ChessClock(1, 0);
  c.start();
  assert.strictEqual(c.tick(60000), 'white');
  assert.strictEqual(c.flagged, 'white');
  assert.strictEqual(c.winner(), 'black');
  assert.strictEqual(c.running, false);
  assert.strictEqual(c.whiteMs, 0);
  assert.strictEqual(c.tick(5000), null); // frozen after flag
  assert.strictEqual(c.press('black'), false);
  assert.strictEqual(c.start(), false);
});
ok('reset restores both clocks and clears flag', () => {
  const c = new ChessClock(1, 0);
  c.start(); c.tick(60000);
  assert.strictEqual(c.flagged, 'white');
  c.reset(5, 3);
  assert.strictEqual(c.flagged, null);
  assert.strictEqual(c.whiteMs, 300000);
  assert.strictEqual(c.blackMs, 300000);
  assert.strictEqual(c.incrementMs, 3000);
  assert.strictEqual(c.turn, null);
  assert.strictEqual(c.moves.white, 0);
});

// i18n
ok('EN and BN share the same keys', () => {
  const en = Object.keys(STR.en).sort();
  const bn = Object.keys(STR.bn).sort();
  assert.deepStrictEqual(bn, en);
});
ok('Bengali digits convert', () => assert.strictEqual(toBnDigits('123'), '১২৩'));
ok('BN status strings present', () => {
  assert.ok(STR.bn.statusWins.indexOf('{side}') !== -1);
  assert.ok(STR.bn.title.length > 0);
});

console.log(n + '/' + n + ' unit checks passed');
