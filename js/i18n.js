// EN / বাংলা strings for Chess Clock BD. Rendered via textContent (no HTML
// injection); Bengali digits are applied by the digits() helper in app.js.
(function (root) {
  'use strict';
  var STR = {
    en: {
      title: 'Chess Clock BD',
      subtitle: 'Two-player chess clock with Fischer increment — for over-the-board games',
      white: 'White',
      black: 'Black',
      moves: 'moves',
      start: 'Start',
      pause: 'Pause',
      reset: 'Reset',
      timeControl: 'Time control',
      minutes: 'minutes',
      increment: 'Increment (sec/move)',
      custom: 'Custom minutes',
      apply: 'Apply',
      sound: 'Sound on flag',
      statusNotStarted: 'Press Start — White moves first',
      statusTurn: '{side} to move',
      statusPaused: 'Paused — {side} to move',
      statusWins: '{side} wins on time!',
      statusDrawNote: '',
      customError: 'Enter whole minutes from 1 to 180.',
      presetNote: 'Presets set both clocks. Changing the time control resets the game.',
      footer: 'Free, fully offline tool. No account, no data leaves your device. Verify time controls with your tournament rules before rated play.',
      langBtn: 'বাংলা'
    },
    bn: {
      title: 'দাবা ঘড়ি বিডি',
      subtitle: 'ফিশার ইনক্রিমেন্টসহ দুই খেলোয়াড়ের দাবা ঘড়ি — বোর্ডের খেলার জন্য',
      white: 'সাদা',
      black: 'কালো',
      moves: 'চাল',
      start: 'শুরু',
      pause: 'বিরতি',
      reset: 'রিসেট',
      timeControl: 'সময় নিয়ন্ত্রণ',
      minutes: 'মিনিট',
      increment: 'ইনক্রিমেন্ট (সেকেন্ড/চাল)',
      custom: 'নিজের মতো মিনিট',
      apply: 'প্রয়োগ',
      sound: 'ফ্ল্যাগে শব্দ',
      statusNotStarted: 'শুরু চাপুন — সাদা প্রথমে চালবে',
      statusTurn: '{side} চালবে',
      statusPaused: 'বিরতি — {side} চালবে',
      statusWins: '{side} সময় শেষে জিতেছে!',
      statusDrawNote: '',
      customError: '১ থেকে ১৮০-এর মধ্যে পূর্ণ মিনিট লিখুন।',
      presetNote: 'প্রিসেট দুটি ঘড়িতেই বসে। সময় নিয়ন্ত্রণ বদলালে খেলা রিসেট হয়।',
      footer: 'বিনামূল্যের সম্পূর্ণ অফলাইন টুল। কোনো অ্যাকাউন্ট লাগে না, কোনো তথ্য ডিভাইসের বাইরে যায় না। রেটেড খেলার আগে টুর্নামেন্টের নিয়ম মিলিয়ে নিন।',
      langBtn: 'English'
    }
  };
  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBnDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[Number(d)]; });
  }
  root.ChessClockI18n = { STR: STR, toBnDigits: toBnDigits };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STR: STR, toBnDigits: toBnDigits };
  }
})(typeof window !== 'undefined' ? window : globalThis);
