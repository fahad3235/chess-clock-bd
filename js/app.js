// Chess Clock BD — UI wiring. Game state lives in ChessClock (js/logic.js);
// this file only renders, handles input, and persists settings (not the game).
(function () {
  'use strict';
  var SETTINGS_KEY = 'chessclockbd.settings.v1';
  var PRESETS = [1, 3, 5, 10, 15, 30];

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && validCustomMinutes(s.minutes)) {
          return { minutes: Number(s.minutes), increment: [0, 1, 2, 3, 5, 10].indexOf(Number(s.increment)) !== -1 ? Number(s.increment) : 0, lang: s.lang === 'bn' ? 'bn' : 'en', sound: s.sound !== false };
        }
      }
    } catch (e) { /* corrupted settings: fall through to defaults */ }
    return { minutes: 5, increment: 0, lang: 'en', sound: true };
  }

  var settings = loadSettings();
  var clock = new ChessClock(settings.minutes, settings.increment);
  var timerId = null;
  var lastTick = 0;

  var $ = function (id) { return document.getElementById(id); };
  var t = function () { return ChessClockI18n.STR[settings.lang]; };
  var digits = function (s) { return settings.lang === 'bn' ? ChessClockI18n.toBnDigits(s) : String(s); };
  var sideName = function (side) { return side === 'white' ? t().white : t().black; };

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* private mode: ignore */ }
  }

  function beepFlag() {
    if (!settings.sound) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      [0, 0.35, 0.7].forEach(function (delay) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 880;
        osc.connect(gain); gain.connect(ctx.destination);
        var start = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        osc.start(start); osc.stop(start + 0.32);
      });
    } catch (e) { /* audio unavailable: flag banner still shows */ }
  }

  function statusText() {
    if (clock.flagged) return t().statusWins.replace('{side}', sideName(clock.winner()));
    if (clock.turn === null) return t().statusNotStarted;
    var s = t().statusTurn.replace('{side}', sideName(clock.turn));
    if (!clock.running) s = t().statusPaused.replace('{side}', sideName(clock.turn));
    return s;
  }

  function render() {
    var white = $('clockWhite'), black = $('clockBlack');
    white.querySelector('.time').textContent = digits(formatMs(clock.whiteMs));
    black.querySelector('.time').textContent = digits(formatMs(clock.blackMs));
    white.querySelector('.moves').textContent = digits(clock.moves.white) + ' ' + t().moves;
    black.querySelector('.moves').textContent = digits(clock.moves.black) + ' ' + t().moves;
    white.querySelector('.side-name').textContent = t().white;
    black.querySelector('.side-name').textContent = t().black;
    white.classList.toggle('active', clock.running && clock.turn === 'white');
    black.classList.toggle('active', clock.running && clock.turn === 'black');
    white.classList.toggle('flagged', clock.flagged === 'white');
    black.classList.toggle('flagged', clock.flagged === 'black');
    $('status').textContent = statusText();
    $('startPauseBtn').textContent = clock.running ? t().pause : t().start;
    $('startPauseBtn').disabled = !!clock.flagged;
    $('resetBtn').textContent = t().reset;
    $('langBtn').textContent = t().langBtn;
    $('timeControlLabel').textContent = t().timeControl;
    $('incrementLabel').textContent = t().increment;
    $('customLabel').textContent = t().custom;
    $('applyBtn').textContent = t().apply;
    $('soundLabel').textContent = t().sound;
    $('presetNote').textContent = t().presetNote;
    $('footerText').textContent = t().footer;
    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      var m = Number(btn.getAttribute('data-min'));
      btn.textContent = digits(m) + ' ' + t().minutes;
      btn.classList.toggle('selected', m === settings.minutes);
      btn.setAttribute('aria-pressed', m === settings.minutes ? 'true' : 'false');
    });
    $('title').textContent = t().title;
    $('subtitle').textContent = t().subtitle;
    document.title = t().title;
  }

  function stopTicker() {
    if (timerId !== null) { clearInterval(timerId); timerId = null; }
  }

  function startTicker() {
    stopTicker();
    lastTick = Date.now();
    timerId = setInterval(function () {
      var now = Date.now();
      var dt = now - lastTick;
      lastTick = now;
      var flagged = clock.tick(dt);
      if (flagged) { stopTicker(); beepFlag(); }
      render();
    }, 100);
  }

  function setTimeControl(minutes, incrementSec) {
    settings.minutes = minutes;
    if (incrementSec !== undefined) settings.increment = incrementSec;
    clock.reset(settings.minutes, settings.increment);
    stopTicker();
    saveSettings();
    render();
  }

  function init() {
    var presetsEl = $('presets');
    PRESETS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-btn';
      b.setAttribute('data-min', String(m));
      b.addEventListener('click', function () { setTimeControl(m, settings.increment); });
      presetsEl.appendChild(b);
    });
    var incSel = $('incrementSel');
    [0, 1, 2, 3, 5, 10].forEach(function (v) {
      var o = document.createElement('option');
      o.value = String(v);
      o.textContent = String(v);
      incSel.appendChild(o);
    });
    incSel.value = String(settings.increment);
    incSel.addEventListener('change', function () { setTimeControl(settings.minutes, Number(incSel.value)); });
    $('customInput').value = String(settings.minutes);
    $('soundCheck').checked = settings.sound;
    $('soundCheck').addEventListener('change', function () { settings.sound = $('soundCheck').checked; saveSettings(); });

    $('applyBtn').addEventListener('click', function () {
      var v = $('customInput').value.trim();
      var err = $('customError');
      if (!validCustomMinutes(v)) {
        err.textContent = t().customError;
        err.style.display = 'block';
        return;
      }
      err.style.display = 'none';
      setTimeControl(Number(v), settings.increment);
    });
    $('customInput').addEventListener('input', function () { $('customError').style.display = 'none'; });

    $('startPauseBtn').addEventListener('click', function () {
      if (clock.running) { clock.pause(); stopTicker(); }
      else if (clock.start()) { startTicker(); }
      render();
    });
    $('resetBtn').addEventListener('click', function () {
      clock.reset(settings.minutes, settings.increment);
      stopTicker();
      render();
    });
    $('clockWhite').addEventListener('click', function () { if (clock.press('white')) render(); });
    $('clockBlack').addEventListener('click', function () { if (clock.press('black')) render(); });
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && clock.running && clock.turn) {
        e.preventDefault();
        if (clock.press(clock.turn)) render();
      }
    });
    $('langBtn').addEventListener('click', function () {
      settings.lang = settings.lang === 'en' ? 'bn' : 'en';
      saveSettings();
      render();
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
