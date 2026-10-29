// ChessClock — DOM-free two-player chess clock logic (Fischer increment).
// Used verbatim by the web UI (js/app.js) and by the Node unit tests.
// Time is kept in integer milliseconds; increment is added to the side
// that presses its clock, exactly as in over-the-board play.
(function (root) {
  'use strict';

  function ChessClock(minutes, incrementSec) {
    this.minutes = minutes;
    this.incrementMs = Math.max(0, Math.round((incrementSec || 0) * 1000));
    this.reset(minutes, incrementSec);
  }

  ChessClock.prototype.reset = function (minutes, incrementSec) {
    if (minutes !== undefined) this.minutes = minutes;
    if (incrementSec !== undefined) this.incrementMs = Math.max(0, Math.round(incrementSec * 1000));
    var start = Math.round(this.minutes * 60000);
    this.whiteMs = start;
    this.blackMs = start;
    this.turn = null;      // 'white' | 'black' | null (not started)
    this.running = false;
    this.flagged = null;   // side whose time ran out, or null
    this.moves = { white: 0, black: 0 };
  };

  // Begin (or resume) the game. First start always gives White the move.
  ChessClock.prototype.start = function () {
    if (this.flagged || this.running) return false;
    if (this.turn === null) this.turn = 'white';
    this.running = true;
    return true;
  };

  ChessClock.prototype.pause = function () {
    if (!this.running) return false;
    this.running = false;
    return true;
  };

  // Advance the active side's clock by dtMs. Returns the flagged side or null.
  ChessClock.prototype.tick = function (dtMs) {
    if (!this.running || this.flagged || this.turn === null) return null;
    if (this.turn === 'white') this.whiteMs -= dtMs; else this.blackMs -= dtMs;
    var remaining = this.turn === 'white' ? this.whiteMs : this.blackMs;
    if (remaining <= 0) {
      if (this.turn === 'white') this.whiteMs = 0; else this.blackMs = 0;
      this.flagged = this.turn;
      this.running = false;
      return this.flagged;
    }
    return null;
  };

  // The side whose clock is running presses it after moving: that side
  // banks the increment and the turn passes to the opponent.
  ChessClock.prototype.press = function (side) {
    if (!this.running || this.flagged || this.turn !== side) return false;
    if (side === 'white') this.whiteMs += this.incrementMs;
    else this.blackMs += this.incrementMs;
    this.moves[side] += 1;
    this.turn = side === 'white' ? 'black' : 'white';
    return true;
  };

  ChessClock.prototype.winner = function () {
    if (!this.flagged) return null;
    return this.flagged === 'white' ? 'black' : 'white';
  };

  ChessClock.prototype.timeLeft = function (side) {
    return side === 'white' ? this.whiteMs : this.blackMs;
  };

  // Display format: M:SS at 60s+, otherwise S.t (tenths) for endgame precision.
  function formatMs(ms) {
    if (ms < 0) ms = 0;
    if (ms >= 60000) {
      var m = Math.floor(ms / 60000);
      var s = Math.floor((ms % 60000) / 1000);
      return m + ':' + (s < 10 ? '0' + s : '' + s);
    }
    var whole = Math.floor(ms / 1000);
    var tenths = Math.floor((ms % 1000) / 100);
    return whole + '.' + tenths;
  }

  function validCustomMinutes(v) {
    var n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 180;
  }

  root.ChessClock = ChessClock;
  root.formatMs = formatMs;
  root.validCustomMinutes = validCustomMinutes;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChessClock: ChessClock, formatMs: formatMs, validCustomMinutes: validCustomMinutes };
  }
})(typeof window !== 'undefined' ? window : globalThis);
