// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9351;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/cc-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result ? r.result.result.value : undefined;
  };
  await send('Page.enable', {});
  await send('Runtime.enable', {});
  await send('Page.navigate', { url: FILE });
  await poll(async () => (await ev('!!document.getElementById("clockWhite")')), 10000);

  const timeOf = (id) => ev(`document.querySelector('#${id} .time').textContent`);
  const movesOf = (id) => ev(`document.querySelector('#${id} .moves').textContent`);

  check('title is Chess Clock BD', (await ev('document.title')).indexOf('Chess Clock BD') === 0);
  check('both clocks start at 5:00', (await timeOf('clockWhite')) === '5:00' && (await timeOf('clockBlack')) === '5:00');
  check('initial status mentions White', (await ev('document.getElementById("status").textContent')).indexOf('White') !== -1);
  check('no console/page errors on load', pageErrors.length === 0, pageErrors.join(' | '));

  // Start -> White ticks down
  await ev('document.getElementById("startPauseBtn").click()');
  await wait(1600);
  const whiteAfter = await timeOf('clockWhite');
  check('white clock ticks after Start (was 5:00)', whiteAfter !== '5:00', 'got ' + whiteAfter);
  check('white panel is active', (await ev('document.getElementById("clockWhite").className')).indexOf('active') !== -1);
  check('pause button label shown while running', (await ev('document.getElementById("startPauseBtn").textContent')) === 'Pause');

  // Press White -> Black to move, White move count 1
  await ev('document.getElementById("clockWhite").click()');
  await wait(200);
  check('pressing White switches to Black', (await ev('document.getElementById("clockBlack").className')).indexOf('active') !== -1);
  check('white move count is 1', (await movesOf('clockWhite')) === '1 moves');

  // Pause -> status Paused, clock frozen
  await ev('document.getElementById("startPauseBtn").click()');
  await wait(200);
  const blackPaused = await timeOf('clockBlack');
  await wait(1200);
  check('paused status shown', (await ev('document.getElementById("status").textContent')).indexOf('Paused') !== -1);
  check('black clock frozen while paused', (await timeOf('clockBlack')) === blackPaused, 'was ' + blackPaused);

  // Reset -> both 5:00, moves 0
  await ev('document.getElementById("resetBtn").click()');
  await wait(200);
  check('reset restores 5:00 both sides', (await timeOf('clockWhite')) === '5:00' && (await timeOf('clockBlack')) === '5:00');
  check('reset clears move counts', (await movesOf('clockWhite')) === '0 moves' && (await movesOf('clockBlack')) === '0 moves');

  // Preset 1 minute
  await ev('document.querySelector(\'.preset-btn[data-min="1"]\').click()');
  await wait(200);
  check('preset 1 sets both clocks to 1:00', (await timeOf('clockWhite')) === '1:00' && (await timeOf('clockBlack')) === '1:00');

  // Custom invalid then valid
  await ev(`document.getElementById('customInput').value='0';
    document.getElementById('applyBtn').click();`);
  await wait(200);
  check('custom 0 shows inline error, clocks unchanged', (await ev('document.getElementById("customError").style.display')) === 'block' && (await timeOf('clockWhite')) === '1:00');
  await ev(`document.getElementById('customInput').value='10';
    document.getElementById('applyBtn').click();`);
  await wait(200);
  check('custom 10 sets both clocks to 10:00', (await timeOf('clockWhite')) === '10:00' && (await timeOf('clockBlack')) === '10:00');

  // Language toggle -> Bengali title
  await ev('document.getElementById("langBtn").click()');
  await wait(200);
  check('BN toggle changes title to Bengali', (await ev('document.title')).indexOf('দাবা') !== -1, await ev('document.title'));
  check('BN toggle changes white label', (await ev('document.querySelector("#clockWhite .side-name").textContent')) === 'সাদা');

  // 390px mobile: no horizontal overflow
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(300);
  check('390px no horizontal overflow', (await ev('document.documentElement.scrollWidth')) <= 390, 'scrollWidth=' + (await ev('document.documentElement.scrollWidth')));

  check('no console/page errors during smoke', pageErrors.length === 0, pageErrors.join(' | '));

  ws.close();
  chrome.kill();
  console.log(failures === 0 ? 'SMOKE GREEN' : 'SMOKE FAILURES: ' + failures);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.log('SMOKE HARNESS ERROR: ' + e.message); process.exit(2); });
