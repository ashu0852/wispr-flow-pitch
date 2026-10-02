const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = {get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }};

/* Top bar gets a hairline once you scroll */
addEventListener('scroll', () => $('.bar').classList.toggle('scrolled', scrollY > 8), {passive: true});

/* =========================================================
   Spider-Man: wanders into empty space, and talks you through the page
   ========================================================= */
const LINES = {
  hello: "Hi Tanay! I'm Spider-Man. Follow me, and I'll show you Ashutosh's growth plan!",
  today: "First, the starting point. People love Flow. The money leaks after the download.",
  game: "Quick game! Zap the filler words, just like Flow does.",
  route: "Here's the whole route. Six stops. Stick with me!",
  s1: "Stop one! What Ashutosh noticed as a paying user.",
  s2: "Stop two! Two leaks. Flip the cards to see the fix.",
  s3: "Stop three! India. Tons of downloads, tiny revenue.",
  s4: "Stop four! LinkedIn. Where your buyers type all day.",
  s5: "Stop five! The math. Flip the switches and watch the money move!",
  s6: "Stop six! The whole first year, from week one to month twelve.",
  proof: "Why him? He's grown this kind of thing before.",
  interview: "Interview time! Pick a question, any question.",
  gaps: "The honest bit. What he hasn't done yet.",
  close: "That's the whole route! Your move, Tanay.",
  win: "Spotless! That's the job. Find the friction, and zap it!",
  allon: "Everything on! That's the whole plan, in dollars.",
  fun1: "He dictated seventy thousand nine hundred words in four months. I counted!",
  fun2: "A hundred and thirty four words a minute. I can barely keep up!",
  fun3: "He found the referral leak by testing it on himself. Sneaky!",
  fun4: "Psst. The math is at stop five. That's the good stuff.",
};
const FUN = ['fun1', 'fun2', 'fun3', 'fun4'];
const buddy = $('#buddy'), bubble = $('#bubble'), face = $('.b-face'), webA = $('#webA'), webB = $('#webB'), splats = $('#splats');
const BAR = 64;
// Spider-Man's size comes from CSS (bigger on desktop). The web-shooter hand is the pivot for every swing.
let W = buddy.offsetWidth, H = buddy.offsetHeight;
const facingLeft = () => face.classList.contains('left');
// Wrist (0, 25), rotated -166° from the shoulder at (65, 49).
const hand = () => ({x: (facingLeft() ? .28952 : .71048) * W, y: .20619 * H});
const setPivot = () => { const h = hand(); buddy.style.transformOrigin = `${h.x}px ${h.y}px`; };
const B = {x: innerWidth - W - 20, y: innerHeight - H - 30, rot: 0, rv: 0, sway: 0, flight: null, moving: false, talking: false, lastScroll: 0, token: 0};
setPivot();

/* --- my own voice (recordings in media/me/, buttons appear only when a file exists) --- */
const ME = {};
let meAudio = null;
const meBusy = () => meAudio && !meAudio.paused;
async function probe(name) { try { return (await fetch(`media/me/${name}.m4a`, {method: 'HEAD'})).ok; } catch { return false; } }
['intro', 'close', ...Array.from({length: 8}, (_, i) => 'q' + i)].forEach(async n => {
  ME[n] = await probe(n);
  const b = $(`.me-play[data-clip="${n}"]`);
  if (b && ME[n]) b.hidden = false;
});
function playMe(name, btn) {
  stopVoice();
  if (meAudio) meAudio.pause();
  $$('.me-play.playing').forEach(b => b.classList.remove('playing'));
  meAudio = new Audio(`media/me/${name}.m4a`);
  if (btn) { btn.classList.add('playing'); meAudio.onended = meAudio.onpause = () => btn.classList.remove('playing'); }
  meAudio.play().catch(() => {});
}
$$('.me-play').forEach(b => b.onclick = () => { if (b.classList.contains('playing')) { meAudio.pause(); return; } playMe(b.dataset.clip, b); });

/* --- Spider-Man's voice --- */
const voice = {on: (store.get('spiderManVoice') ?? store.get('blipVoice')) !== 'off', unlocked: false, audio: null};
const sndBtn = $('#snd');
const paintSnd = () => { sndBtn.setAttribute('aria-pressed', voice.on); sndBtn.querySelector('span').textContent = voice.on ? "Spider-Man's voice on" : "Spider-Man's voice off"; };
paintSnd();
let ttsVoice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  const want = ['Google US English', 'Samantha (Enhanced)', 'Ava (Premium)', 'Ava (Enhanced)', 'Samantha', 'Karen', 'Moira', 'Tessa'];
  ttsVoice = want.map(n => vs.find(v => v.name === n)).find(Boolean) || vs[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function stopVoice() {
  if (voice.audio) { voice.audio.pause(); voice.audio = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function talkOn() { B.talking = true; buddy.classList.add('talk'); }
function talkOff(hideIn = 1400) {
  buddy.classList.remove('talk');
  clearTimeout(B.hide);
  B.hide = setTimeout(() => { bubble.classList.remove('show'); B.talking = false; }, hideIn);
}
// Recorded clips live in media/blip/<key>.m4a. If one is missing, the browser's own voice reads the line, pitched up.
function voiceLine(key, text) {
  if (!voice.on || !voice.unlocked || meBusy()) return false;
  stopVoice();
  let fell = false;
  const fallback = () => {
    if (fell || !('speechSynthesis' in window)) return; fell = true;
    const u = new SpeechSynthesisUtterance(text);
    if (ttsVoice) u.voice = ttsVoice;
    u.pitch = 1.6; u.rate = 1.1;
    u.onstart = talkOn; u.onend = () => talkOff(); u.onerror = () => talkOff();
    speechSynthesis.speak(u);
  };
  const a = new Audio(`media/blip/${key}.m4a`);
  voice.audio = a;
  a.onplay = talkOn;
  a.onended = () => talkOff();
  a.onerror = fallback;
  a.play().catch(fallback);
  return true;
}
function say(key, {voiced = true} = {}) {
  const text = LINES[key] || key;
  buddy.classList.remove('wave'); void buddy.offsetWidth; buddy.classList.add('wave');
  setTimeout(() => buddy.classList.remove('wave'), 1300);
  bubble.textContent = text;
  bubble.classList.add('show');
  placeBubble();
  clearTimeout(B.hide);
  if (!(voiced && voiceLine(key, text))) {
    talkOn();
    B.hide = setTimeout(() => { buddy.classList.remove('talk'); bubble.classList.remove('show'); B.talking = false; }, 2400 + text.length * 40);
  }
}
// Browsers only allow sound after the visitor touches the page.
addEventListener('pointerdown', () => { voice.unlocked = true; }, {once: true, capture: true});
addEventListener('keydown', () => { voice.unlocked = true; }, {once: true, capture: true});
sndBtn.onclick = () => {
  voice.on = !voice.on; voice.unlocked = true;
  store.set('spiderManVoice', voice.on ? 'on' : 'off'); paintSnd();
  if (voice.on) say(B.section || 'hello'); else stopVoice();
};

/* --- click for a swing and a fun fact --- */
let funI = 0;
buddy.onclick = () => {
  voice.unlocked = true;
  swingTo(pickSpot('far'));
  say(FUN[funI++ % FUN.length]);
};

/* --- finding empty space --- */
const BLOCK = 'a,button,input,svg,img,video,audio,canvas,label,output,summary,i,b,em,span,p,h1,h2,h3,li,blockquote,figcaption,small,strong,dd,dt,s,ol,ul,figure,details';
function emptyAt(x, y) {
  const el = document.elementsFromPoint(x, y).find(e => !e.closest('#buddy,#bubble,#rail,#webs') && !e.classList.contains('spark'));
  if (!el || el.closest('.bar,footer')) return false;
  if (/^(SECTION|MAIN|BODY|HTML)$/.test(el.tagName)) return true;
  if (el.matches(BLOCK)) return false;
  if ([...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return false;
  for (let n = el; n && n.tagName !== 'SECTION' && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none') return false;
  }
  return true;
}
function boxEmpty(x, y) {
  const m = 6, pts = [[x + W / 2, y + H / 2], [x + W / 2, y + m], [x + m, y + H * .45], [x + W - m, y + H * .45], [x + m * 3, y + H - m], [x + W - m * 3, y + H - m], [x + W / 2, y + H - m]];
  return pts.every(([px, py]) => emptyAt(px, py));
}
const wideRail = matchMedia('(min-width: 1200px)');
function spots() {
  const out = [], step = innerWidth < 700 ? 30 : 48;
  const x0 = wideRail.matches ? 64 : 10, top = BAR + 14, bottom = innerHeight - H - 14;
  for (let y = top; y <= bottom; y += step)
    for (let x = x0; x <= innerWidth - W - 10; x += step)
      if (boxEmpty(x, y)) out.push({x, y});
  return out;
}
function pickSpot(mode) {
  const s = spots();
  if (!s.length) return {x: innerWidth - W * .45, y: innerHeight - H - 18}; // no room: peek in from the edge
  const d = p => Math.hypot(p.x - B.x, p.y - B.y);
  if (mode === 'near') return s.sort((a, b) => d(a) - d(b))[0];
  // Zig-zag across the screen, so every move is a proper swing
  const otherSide = s.filter(p => (p.x + W / 2 > innerWidth / 2) !== (B.x + W / 2 > innerWidth / 2));
  const band = (otherSide.length ? otherSide : s).filter(p => p.y > innerHeight * .2 && p.y < innerHeight * .85);
  const pool = band.length ? band : (otherSide.length ? otherSide : s);
  return pool[Math.floor(Math.random() * pool.length)];
}

/* --- webs --- */
// Draw a web from the anchor to the hand. Sag > 0 gives a slack strand while it's still flying.
function drawWeb(ax, ay, hx, hy, sag = 0) {
  const mx = (ax + hx) / 2, my = (ay + hy) / 2, dx = hx - ax, dy = hy - ay, len = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / len * sag, cy = my + dx / len * sag;
  webA.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`);
  webB.setAttribute('d', `M${(ax + 1.4).toFixed(1)} ${ay.toFixed(1)} Q${(cx + 2).toFixed(1)} ${(cy + 1).toFixed(1)} ${(hx + 1.2).toFixed(1)} ${hy.toFixed(1)}`);
  webA.classList.add('on'); webB.classList.add('on');
}
const webOff = () => { webA.classList.remove('on'); webB.classList.remove('on'); };
function splat(x, y, small = false) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'), r = small ? 7 : 11;
  g.setAttribute('class', small ? 'splat thwip' : 'splat');
  g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  g.innerHTML = Array.from({length: 8}, (_, i) => { const a = i / 8 * Math.PI * 2; return `<line x1="0" y1="0" x2="${(Math.cos(a) * r).toFixed(1)}" y2="${(Math.sin(a) * r).toFixed(1)}"/>`; }).join('') + `<circle r="${r * .45}"/><circle r="${r * .8}"/>`;
  splats.appendChild(g);
  setTimeout(() => g.remove(), 900);
}
/* --- motion --- */
function render() {
  buddy.style.transform = `translate(${B.x}px, ${B.y}px) rotate(${B.rot.toFixed(2)}deg)`;
  if (bubble.classList.contains('show')) placeBubble();
}
function placeBubble() {
  const bw = bubble.offsetWidth, bh = bubble.offsetHeight, right = B.x + W / 2 > innerWidth / 2;
  const left = right ? B.x - bw - 6 : B.x + W + 6;
  bubble.style.left = clamp(left, 8, innerWidth - bw - 8) + 'px';
  bubble.style.top = clamp(B.y + H * .1, BAR + 8, innerHeight - bh - 8) + 'px';
  bubble.classList.toggle('r', right);
}
const smooth = p => p * p * p * (p * (p * 6 - 15) + 10);
const rig = Object.fromEntries(['b-body', 'upper-body', 'legL', 'legR', 'kneeL', 'kneeR', 'footL', 'footR', 'armL', 'armR'].map(c => [c, buddy.querySelector('.' + c)]));
// Read the animated wrist so the strand stays attached during turns and arm transitions.
function wrist() {
  const p = new DOMPoint(0, 25).matrixTransform(rig.armR.getScreenCTM());
  return {x: p.x, y: p.y};
}
function landingPose(amount) {
  const depth = 20 * amount;
  rig['b-body'].style.transform = `translateY(${depth}px)`;
  rig['upper-body'].style.transform = `rotate(${-5 * amount}deg)`;
  for (const [side, sign] of [['L', 1], ['R', -1]]) {
    // Two 18-unit bones reach the same floor while the hips sit down and rise.
    const dx = 36 * Math.sin(7 * Math.PI / 180) + 8 * amount;
    const dy = 36 * Math.cos(7 * Math.PI / 180) - depth;
    const bend = Math.acos(clamp(Math.hypot(dx, dy) / 36, 0, 1));
    const thigh = sign * (Math.atan2(dx, dy) + bend) * 180 / Math.PI;
    const knee = -sign * 2 * bend * 180 / Math.PI;
    rig['leg' + side].style.transform = `rotate(${thigh}deg)`;
    rig['knee' + side].style.transform = `rotate(${knee}deg)`;
    rig['foot' + side].style.transform = `rotate(${-thigh - knee}deg)`;
    rig['arm' + side].style.transform = `rotate(${sign * (14 + 24 * amount)}deg)`;
  }
}
function resetLanding() {
  Object.values(rig).forEach(el => el.style.removeProperty('transform'));
}
// Each flight finishes its landing before another can start; repeated input cannot snap a pose.
function swingTo({x, y}) {
  if (B.flight) return B.flight;
  const S = {x: B.x, y: B.y, rot: B.rot}, dx = x - S.x, dy = y - S.y, dist = Math.hypot(dx, dy);
  if (reduce || dist < 3) { B.x = x; B.y = y; B.rot = 0; render(); webOff(); return Promise.resolve(); }
  if (Math.abs(dx) > 4) { face.classList.toggle('left', dx < 0); setPivot(); }
  const h = hand();
  const A = {x: S.x + dx / 2 + h.x, y: Math.max(BAR + 2, Math.min(S.y, y) + h.y - 120 - Math.abs(dx) * .12)};
  const dip = Math.min(125, Math.abs(dx) * .18, Math.max(0, innerHeight - H - 10 - Math.max(S.y, y)));
  const aim = 280, shoot = 170, duration = clamp(750 + dist * .65, 850, 1600), landing = 1120;
  B.moving = true; B.hanging = false; B.rv = 0; B.sway = 0;
  buddy.classList.remove('land', 'hang', 'wave', 'release');
  buddy.classList.add('shoot');
  bubble.classList.remove('show');
  const flight = new Promise(resolve => {
    const start = performance.now();
    let fired = false, attached = false, landed = false;
    const step = now => {
      const elapsed = now - start;
      if (elapsed < aim) { B.anim = requestAnimationFrame(step); return; }
      if (!fired) { fired = true; const w = wrist(); splat(w.x, w.y, true); }
      if (elapsed < aim + shoot) {
        const k = smooth((elapsed - aim) / shoot), w = wrist();
        drawWeb(w.x + (A.x - w.x) * k, w.y + (A.y - w.y) * k, w.x, w.y, 10 * (1 - k));
      } else if (elapsed < aim + shoot + duration) {
        if (!attached) { attached = true; splat(A.x, A.y); buddy.classList.add('swing'); }
        const p = (elapsed - aim - shoot) / duration, e = smooth(p), arc = Math.sin(Math.PI * e);
        B.x = S.x + dx * e;
        B.y = S.y + dy * e + dip * arc;
        // Ease into the lean and unwind before contact, with no rotation jump at release.
        const lean = clamp(Math.atan2(A.x - B.x - h.x, B.y + h.y - A.y) * 180 / Math.PI, -55, 55);
        B.rot = S.rot * (1 - smooth(clamp(p * 4, 0, 1))) + lean * arc;
        buddy.style.setProperty('--swing-arm', `${14 + 61 * arc}deg`);
        buddy.style.setProperty('--swing-leg-l', `${7 + 31 * arc}deg`);
        buddy.style.setProperty('--swing-leg-r', `${-7 + 25 * arc}deg`);
        render();
        if (p < .72) { const w = wrist(); drawWeb(A.x, A.y, w.x, w.y); }
        else { buddy.classList.add('release'); webOff(); }
      } else {
        if (!landed) {
          landed = true; B.x = x; B.y = y; B.rot = 0;
          buddy.classList.remove('swing', 'shoot', 'release'); buddy.classList.add('land');
          webOff(); render();
        }
        const p = clamp((elapsed - aim - shoot - duration) / landing, 0, 1);
        // Absorb the impact, sit low for a beat, then push through the feet to stand.
        const crouch = p < .18 ? smooth(p / .18) : p < .36 ? 1 : 1 - smooth((p - .36) / .64);
        landingPose(crouch);
        if (p === 1) {
          resetLanding(); buddy.classList.remove('land');
          B.moving = false; B.flight = null;
          resolve(); return;
        }
      }
      B.anim = requestAnimationFrame(step);
    };
    B.anim = requestAnimationFrame(step);
  });
  B.flight = flight;
  return flight;
}
// Time-based damping makes the resting and scrolling motion consistent across refresh rates.
let physicsTime = performance.now();
(function physics(now) {
  const dt = Math.min((now - physicsTime) / 1000, .032); physicsTime = now;
  if (!B.moving) {
    B.sway *= Math.exp(-7 * dt);
    B.rv += ((B.sway - B.rot) * 65 - B.rv * 15) * dt;
    B.rot += B.rv * dt;
    if (Math.abs(B.rv) > .01 || Math.abs(B.rot) > .01) render();
    if (B.hanging) { const w = wrist(); drawWeb(B.x + hand().x, BAR, w.x, w.y); }
  }
  requestAnimationFrame(physics);
})(physicsTime);
render();

// Wait until the page stops scrolling, so Spider-Man judges the space it will actually stand in.
async function settled() { while (performance.now() - B.lastScroll < 140) await sleep(40); }
async function goTo(mode) {
  await settled();
  await swingTo(pickSpot(mode));
  await settled();
  if (!boxEmpty(B.x, B.y)) await swingTo(pickSpot('near'));
}

// Talk when a new section reaches the middle of the screen: swing to open space first, then speak.
let ready = false;
const sayIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting || !ready || B.section === e.target.dataset.say) return;
  B.section = e.target.dataset.say;
  const key = B.section;
  goTo('far').then(() => { if (B.section !== key) return; say(key); });
}), {rootMargin: '-45% 0px -45% 0px'});
$$('[data-say]').forEach(s => sayIO.observe(s));
setTimeout(async () => {
  ready = true; B.section = 'hello';
  await goTo('far');
  say('hello');
  if (!voice.unlocked && voice.on) setTimeout(() => { if (!voice.unlocked) { bubble.textContent = 'Tap me to hear my voice!'; bubble.classList.add('show'); placeBubble(); clearTimeout(B.hide); B.hide = setTimeout(() => bubble.classList.remove('show'), 4000); } }, 6000);
}, reduce ? 300 : 1800);

// Scrolling: Spider-Man hangs from a web and sways with your scroll speed, then swings clear the moment you stop.
let scrollT = 0, lastY = scrollY;
addEventListener('scroll', () => {
  const dv = scrollY - lastY; lastY = scrollY;
  B.lastScroll = performance.now();
  if (!B.moving && !reduce) {
    B.hanging = true; buddy.classList.add('hang');
    B.sway = clamp(B.sway - dv * .6, -38, 38);
  }
  clearTimeout(scrollT);
  scrollT = setTimeout(() => {
    B.hanging = false; buddy.classList.remove('hang');
    if (!B.moving) { webOff(); if (!boxEmpty(B.x, B.y)) goTo('near'); }
  }, 140);
}, {passive: true});
// Content can slide in after Spider-Man lands (reveal animations), so keep checking.
setInterval(() => {
  if (B.moving || B.hanging || document.hidden || performance.now() - B.lastScroll < 300) return;
  if (!boxEmpty(B.x, B.y)) goTo('near');
}, 1000);
// Every few seconds, swing somewhere new.
if (!reduce) setInterval(() => {
  if (B.moving || B.talking || document.hidden || performance.now() - B.lastScroll < 900) return;
  goTo('far');
}, 6500);
addEventListener('resize', () => { W = buddy.offsetWidth; H = buddy.offsetHeight; setPivot(); B.x = clamp(B.x, 8, innerWidth - W - 8); B.y = clamp(B.y, BAR + 8, innerHeight - H - 8); render(); measureRail(); });

/* --- progress rail (desktop) --- */
const stops = $$('[data-stop]');
$('#railStops').innerHTML = stops.map(s => `<span class="r-stop" data-n="${s.dataset.stop}">${s.dataset.stop}</span>`).join('');
const railDots = $$('.r-stop');
let maxScroll = 1;
function measureRail() {
  maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  stops.forEach((s, i) => {
    const f = clamp((s.offsetTop - innerHeight * .35) / maxScroll, 0, 1);
    railDots[i].style.top = (f * 100) + '%';
    railDots[i].dataset.f = f;
  });
  paintRail();
}
function paintRail() {
  const p = Math.min(1, scrollY / maxScroll);
  $('#railFill').style.transform = `scaleY(${p})`;
  railDots.forEach(d => d.classList.toggle('done', p >= +d.dataset.f - .002));
}
addEventListener('scroll', () => requestAnimationFrame(paintRail), {passive: true});
new ResizeObserver(measureRail).observe(document.body);
railDots.forEach((d, i) => { d.onclick = () => stops[i].scrollIntoView({behavior: 'smooth'}); });

/* =========================================================
   Hero: the banner is dictated, then cleaned up
   ========================================================= */
const HERO = ['so um this is Ashutosh Singh, uh, your like upcoming head of growth', 'Ashutosh Singh, your upcoming Head of Growth.'];
const DLINES = [
  ['so um the Hinglish test, uh, ships Monday', 'The Hinglish test ships Monday.'],
  ['UPI retries are, uh, down, no wait, live', 'UPI retries are live.'],
  ['okay so like India revenue is, um, up this week', 'India revenue is up this week.'],
];
const raw = $('#raw'), clean = $('#clean'), dTag = $('#dTag');
const strike = r => esc(r).replace('down, no wait,', '<s>down, no wait,</s>').replace(/\b(okay so|so um|um|uh|like)\b,?/g, '<s>$&</s>');
const showH1 = () => $$('#h1 .w').forEach((w, i) => setTimeout(() => w.classList.add('on'), reduce ? 0 : i * 110));
async function speakLine([r, c], wordMs = 100) {
  clean.textContent = ''; dTag.textContent = 'You say'; dTag.classList.remove('done');
  const words = r.split(' ');
  for (let i = 1; i <= words.length; i++) { raw.textContent = words.slice(0, i).join(' '); await sleep(wordMs); }
  await sleep(450);
  raw.innerHTML = strike(r);
  await sleep(800);
  raw.textContent = ''; dTag.textContent = 'Flow types'; dTag.classList.add('done');
  return c;
}
async function typeClean(c) { for (let i = 1; i <= c.length; i++) { clean.textContent = c.slice(0, i); await sleep(26); } }
async function hero() {
  if (reduce) { showH1(); clean.textContent = HERO[1]; dTag.textContent = 'Flow types'; return; }
  setTimeout(showH1, 4500); // safety net
  const c = await speakLine(HERO, 85);
  showH1();
  await typeClean(c);
  await sleep(3200);
  for (let n = 0; ; n = (n + 1) % DLINES.length) { await typeClean(await speakLine(DLINES[n])); await sleep(2800); }
}
hero();

const USAGE = [['Jan', 10.3], ['Feb', 4.4], ['Mar', 16.3], ['Apr', 39.9]];
$('#bars').innerHTML = USAGE.map(([m, k], i) =>
  `<div class="bar-col ${m === 'Apr' ? 'peak' : ''}" title="${k}K words"><i style="--h:${k / 39.9 * 100}%;--d:${i * 120}ms"></i><span>${m}</span></div>`).join('');

/* ---------- Number glide ---------- */
function glide(el, to, {from = 0, dur = 1400, fmt = v => Math.round(v).toLocaleString('en-US')} = {}) {
  if (reduce) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Reveal system ---------- */
const groups = [
  '.hero-copy > .intro', '.hero-copy > .actions', '.sec-head > *', '.stat', '.chapter h2', '.chapter .body', '.kicker', '.stop-tag',
  '.pull', '.notes article', '.leak', '.moves li', '.hedge', '.post', '.weeks', '.chat', '.chips', '.stops li', '.fact',
  '.gaps article', '.close h2', '.close p', '.sentence', '.ns', '.model', '.rank-card', '.assume', '.score'
];
groups.forEach(sel => $$(sel).forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${(i % 4) * 90}ms`); }));
const onView = (el, fn, threshold = .25) => {
  if (!el) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), {threshold});
  io.observe(el);
};
$$('.reveal').forEach(el => onView(el, t => t.classList.add('in'), .12));
onView($('#bars'), t => t.classList.add('in'));
onView($('.recap-big span'), t => glide(t, 70900, {dur: 1600}));
$$('.stat').forEach(s => onView(s, t => { t.classList.add('shown'); const b = t.querySelector('.s-num b'); glide(b, +b.dataset.count, {fmt: v => Math.round(v) + b.dataset.suffix}); }, .4));
$$('.fact b[data-to]').forEach(b => onView(b, t => glide(t, +t.dataset.to, {dur: 1500, fmt: v => (t.dataset.pre || '') + v.toFixed(+t.dataset.dec || 0) + t.dataset.suf}), .5));
onView($('#gap'), t => t.classList.add('in'), .4);

/* ---------- Game: zap the filler words ---------- */
const SENTENCE = '{So} {um} I think we should {uh} {like} {basically} ship the {you know} Hinglish test on Monday.';
let zapped = 0;
const totalFill = (SENTENCE.match(/\{/g) || []).length;
$('#sentence').innerHTML = SENTENCE.replace(/\{([^}]+)\}|(\S+)/g, (m, f, w) =>
  f ? `<button type="button" class="filler" aria-label="Zap the filler word ${esc(f)}">${esc(f)}</button> ` : `<span class="word">${esc(w)}</span> `);
function zap(btn) {
  if (btn.classList.contains('zapped')) return;
  btn.classList.add('zapped');
  btn.disabled = true;
  if (!reduce) {
    const r = btn.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('i');
      p.className = 'spark';
      const a = (i / 10) * Math.PI * 2;
      p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--x:${Math.cos(a) * 46}px;--y:${Math.sin(a) * 46}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }
  zapped++;
  $('#zapCount').textContent = `${zapped} of ${totalFill} zapped`;
  if (zapped === totalFill) { $('#sentence').classList.add('clean'); $('#game').classList.add('won'); say('win'); }
}
$$('.filler').forEach(b => b.onclick = () => zap(b));
$('#zapAll').onclick = async () => { for (const b of $$('.filler:not(.zapped)')) { zap(b); await sleep(200); } };

/* ---------- The route: a traveler walks the road ---------- */
const road = $('#road'), roadPath = $('#roadPath'), traveler = $('#traveler'), stopLis = $$('.stops li');
onView(road, t => t.classList.add('in'), .3);
const roadLen = roadPath.getTotalLength();
let roadT0 = null;
function travel(t) {
  if (roadT0 === null) roadT0 = t;
  const p = ((t - roadT0) / 14000) % 1;
  const pt = roadPath.getPointAtLength(p * roadLen);
  const svg = road.querySelector('svg').getBoundingClientRect();
  traveler.style.transform = `translate(${pt.x / 1200 * svg.width}px, ${pt.y / 120 * svg.height}px)`;
  stopLis.forEach((li, i) => li.classList.toggle('lit', Math.abs(pt.x - (100 + i * 200)) < 60));
  requestAnimationFrame(travel);
}
if (!reduce) onView(road, () => requestAnimationFrame(travel), .1);

/* ---------- Before / after toggles ---------- */
function setView(target, v) {
  target.dataset.v = v;
  $$(`.ab[data-target="#${target.id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
  if (target.id === 'leak1') animMonths();
  if (target.id === 'leak2') renderUPI();
}
$$('.ab').forEach(ab => {
  const target = $(ab.dataset.target);
  ab.querySelectorAll('button').forEach(b => b.onclick = () => { target.dataset.touched = 1; setView(target, b.dataset.v); });
});
['#devices', '#leak1', '#leak2'].forEach((sel, i) => onView($(sel), t => setTimeout(() => { if (!t.dataset.touched) setView(t, 'fix'); }, 4500 + i * 700), .5));

const MONTHS = 'JFMAMJJASOND'.split('');
$('#months').innerHTML = MONTHS.map((m, i) => `<i style="--d:${i * 90}ms"><span>${m}</span></i>`).join('');
function animMonths() { const m = $('#months'); m.classList.remove('in'); void m.offsetWidth; m.classList.add('in'); }
onView($('#months'), animMonths, .6);
const UPI = {
  now: [['Mandate set', 'ok'], ['Mandate fails', 'bad'], ['Pro lapses', 'off']],
  fix: [['Mandate fails', 'bad'], ['Retry + WhatsApp link', 'ok'], ['Pro keeps running', 'ok']],
};
function renderUPI() {
  const v = $('#leak2').dataset.v, el = $('#upi');
  el.classList.remove('in');
  el.innerHTML = UPI[v].map(([t, c], i) => (i ? `<span class="u-line ${c}" style="--d:${i * 520 - 260}ms"></span>` : '') + `<span class="u-step ${c}" style="--d:${i * 520}ms">${t}</span>`).join('');
  void el.offsetWidth; el.classList.add('in');
}
renderUPI();
onView($('#upi'), renderUPI, .6);

/* ---------- Voice note player ---------- */
const audio = $('#voiceNote'), wave = $('#npWave'), playBtn = $('#play');
const NBARS = 46;
const heights = Array.from({length: NBARS}, (_, i) => 30 + Math.round(60 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * .45))));
wave.innerHTML = heights.map(h => `<i style="height:${h}%"></i>`).join('');
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const PLAY = 'M8 5v14l11-7z', PAUSE = 'M7 5h4v14H7zM13 5h4v14h-4z';
function paint() {
  const p = audio.duration ? audio.currentTime / audio.duration : 0;
  $$('#npWave i').forEach((b, i) => b.classList.toggle('on', i / NBARS < p));
  $('#npTime').textContent = fmtTime(audio.duration && !audio.paused ? audio.currentTime : (audio.duration || 11));
}
playBtn.onclick = () => { stopVoice(); audio.paused ? audio.play() : audio.pause(); };
audio.onplay = () => { $('#playIcon').setAttribute('d', PAUSE); playBtn.setAttribute('aria-label', 'Pause the voice note'); };
audio.onpause = audio.onended = () => { $('#playIcon').setAttribute('d', PLAY); playBtn.setAttribute('aria-label', 'Play the voice note'); paint(); };
audio.ontimeupdate = paint;
audio.onloadedmetadata = paint;
wave.onclick = e => { if (!audio.duration) return; const r = wave.getBoundingClientRect(); audio.currentTime = (e.clientX - r.left) / r.width * audio.duration; if (audio.paused) audio.play(); };

/* =========================================================
   The growth model: one month of new installs, bets switched on or off
   ========================================================= */
const DIALS = [
  {id: 'inst', label: 'New installs a month', note: 'Public: 2.5M in 7 months', min: 100, max: 800, v: 360, unit: 'K'},
  {id: 'india', label: "India's share of installs", note: 'Public', min: 0, max: 40, v: 14, unit: '%'},
  {id: 'actG', label: 'Week-1 activation, outside India', note: 'My estimate', min: 20, max: 90, v: 55, unit: '%'},
  {id: 'actI', label: 'Week-1 activation, India', note: 'My estimate', min: 10, max: 90, v: 40, unit: '%'},
  {id: 'convG', label: 'Paid conversion, outside India', note: 'Public, about 19%', min: 2, max: 35, v: 19, unit: '%'},
  {id: 'convI', label: 'Paid conversion, India', note: 'My estimate, fits ~2% of revenue', min: 1, max: 35, v: 7, unit: '%'},
];
const ARPU_G = 12, ARPU_I = 3.4, KEEP = .7;
const BETS = [
  {id: 'xdev', t: 'Cross-device welcome back', fx: '+2 pts activation, every market', weeks: 1, conf: 'High', apply: m => { m.actI += 2; m.actG += 2; }},
  {id: 'ref', t: 'Referral rewards for real use', fx: '+0.5 pt paid conversion outside India', weeks: 1, conf: 'Medium', apply: m => { m.convG += .5; }},
  {id: 'upi', t: 'UPI retries and a grace period', fx: '+3 pts India paid conversion', weeks: 2, conf: 'High', apply: m => { m.convI += 3; }},
  {id: 'wa', t: 'Hinglish first dictation in WhatsApp', fx: '+12 pts India activation', weeks: 4, conf: 'Medium', apply: m => { m.actI += 12; }},
  {id: 'recap', t: 'Shareable monthly recap card', fx: '+3% installs from sharing', weeks: 2, conf: 'Medium', apply: m => { m.mult *= 1.03; }},
  {id: 'li', t: '100 LinkedIn operator-creators', fx: '+20K installs a month outside India', weeks: 6, conf: 'Medium', apply: m => { m.extraG += 20000; }},
  {id: 'campus', t: '50-college ambassador program', fx: '+10K India installs a month', weeks: 6, conf: 'Low', apply: m => { m.extraI += 10000; }},
];
$('#dials').innerHTML = DIALS.map(d => `<div class="slider"><label for="m-${d.id}">${d.label}<small>${d.note}</small></label><output id="m-${d.id}-o">${d.v}${d.unit}</output><input type="range" id="m-${d.id}" min="${d.min}" max="${d.max}" step="1" value="${d.v}"></div>`).join('');
$('#bets').innerHTML = BETS.map(b => `<button type="button" class="bet" data-id="${b.id}" aria-pressed="false"><span class="sw"></span><span class="bet-txt"><b>${b.t}</b><small>${b.fx}</small></span><span class="bet-meta"><em class="bet-val" id="v-${b.id}"></em><small>${b.weeks} wk · ${b.conf}</small></span></button>`).join('');
const dial = id => +$('#m-' + id).value;
function run(on) {
  const m = {inst: dial('inst') * 1000, india: dial('india'), actG: dial('actG'), actI: dial('actI'), convG: dial('convG'), convI: dial('convI'), extraG: 0, extraI: 0, mult: 1};
  BETS.filter(b => on.includes(b.id)).forEach(b => b.apply(m));
  const iI = m.inst * m.india / 100 * m.mult + m.extraI, gI = m.inst * (1 - m.india / 100) * m.mult + m.extraG;
  const aI = iI * clamp(m.actI, 0, 100) / 100, aG = gI * clamp(m.actG, 0, 100) / 100;
  const pI = aI * clamp(m.convI, 0, 100) / 100, pG = aG * clamp(m.convG, 0, 100) / 100;
  const mrrI = pI * ARPU_I, mrr = mrrI + pG * ARPU_G;
  // A year of monthly cohorts, each still 70% paying at month 12 (public retention)
  return {inst: iI + gI, act: aI + aG, paid: pI + pG, yearly: mrr * 12 * 12 * KEEP, india: mrr ? mrrI / mrr : 0};
}
const usd = n => { const a = Math.abs(n); return (n < 0 ? '−' : '') + (a >= 1e6 ? '$' + (a / 1e6).toFixed(1) + 'M' : '$' + Math.round(a / 1e3) + 'K'); };
const k = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.round(n / 1e3) + 'K';
let shownBig = 0, shownIndia = 0;
function renderModel() {
  DIALS.forEach(d => {
    const el = $('#m-' + d.id);
    el.style.setProperty('--p', ((el.value - d.min) / (d.max - d.min) * 100) + '%');
    $(`#m-${d.id}-o`).textContent = el.value + d.unit;
  });
  const on = $$('.bet[aria-pressed=true]').map(b => b.dataset.id);
  const base = run([]), now = run(on);
  // Each bet on its own, against the baseline
  const solo = BETS.map(b => ({...b, gain: run([b.id]).yearly - base.yearly}));
  solo.forEach(b => { $('#v-' + b.id).textContent = '+' + usd(b.gain) + '/yr'; });
  const gain = now.yearly - base.yearly;
  glide($('#oBig'), gain, {from: shownBig, dur: 800, fmt: v => (v >= 0 ? '+' : '') + usd(v)});
  shownBig = gain;
  $('#oSub').innerHTML = on.length
    ? `New revenue from a year of sign-ups goes from <b>${usd(base.yearly)}</b> to <b>${usd(now.yearly)}</b>, up ${Math.round(gain / base.yearly * 100)}%.`
    : `Baseline: a year of sign-ups adds about <b>${usd(base.yearly)}</b> in revenue. Switch on a bet.`;
  const rows = [['Installs a month', base.inst, now.inst], ['Activated in week one', base.act, now.act], ['New payers a month', base.paid, now.paid]];
  $('#funnel').innerHTML = rows.map(([l, b, n], i) => `<div class="f-row"><span>${l}</span><i style="--w:${Math.max(4, n / now.inst * 100)}%"></i><b>${k(n)}</b><small class="${n > b + 1 ? 'up' : ''}">${n > b + 1 ? '+' + k(n - b) : '·'}</small></div>`).join('');
  const ind = now.india * 100;
  glide($('#oIndia'), ind, {from: shownIndia, dur: 700, fmt: v => v.toFixed(1) + '%'});
  shownIndia = ind;
  $('#oIndiaBar').style.transform = `scaleX(${Math.min(1, ind / Math.max(.1, dial('india')))})`;
  const ranked = [...solo].sort((a, b) => b.gain / b.weeks - a.gain / a.weeks);
  const top = Math.max(...ranked.map(b => b.gain / b.weeks));
  $('#ranked').innerHTML = ranked.map((b, i) => `<li class="${on.includes(b.id) ? 'on' : ''}"><span class="r-n">${i + 1}</span><span class="r-t">${b.t}<small>${usd(b.gain)} a year · ${b.weeks} week${b.weeks > 1 ? 's' : ''} · ${b.conf} confidence</small></span><span class="r-bar"><i style="--w:${b.gain / b.weeks / top * 100}%"></i></span><b>${usd(b.gain / b.weeks)}<small>a year, per week of work</small></b></li>`).join('');
}
$$('.bet').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); renderModel(); });
$$('#dials input').forEach(i => i.addEventListener('input', renderModel));
$('#allOn').onclick = () => { $$('.bet').forEach(b => b.setAttribute('aria-pressed', 'true')); renderModel(); say('allon'); };
$('#allOff').onclick = () => { $$('.bet').forEach(b => b.setAttribute('aria-pressed', 'false')); renderModel(); };
renderModel();

/* ---------- First 30 days ---------- */
const WEEKS = [
  {theme: 'Listen and instrument',
   do: ['Sit in every growth review, and on five support and sales calls.',
        'Read 200 reviews and tickets, India Play Store included.',
        'Rebuild the funnel from raw events: install, first dictation, day-7 dictation, paid.',
        'Replace every estimate in my model with your real numbers.'],
   ships: 'The cross-device "welcome back", live as an A/B test.',
   metric: 'Day-7 dictation for existing users on a new device.',
   get: 'My model, rebuilt on your data, with the three biggest drop-offs.'},
  {theme: 'Plug the leaks',
   do: ['UPI: mandate retries, a one-tap WhatsApp pay link, and a 7-day grace period.',
        'Referrals: one reward per device, paid after the friend really dictates.',
        'Audit attribution across Meta, Google, Apple and LinkedIn.',
        'Agree on one definition of "activated user".'],
   ships: 'UPI retries and the new referral rules.',
   metric: 'Mandate success rate, and India involuntary churn.',
   get: 'A leak dashboard we review every Monday.'},
  {theme: 'Launch two bets',
   do: ['India: Hinglish first dictation inside WhatsApp, with a holdout group.',
        'LinkedIn: the spoken-post pilot with 10 operator-creators on Dub links.',
        'Campus: shortlist 50 colleges and sign the first 10 ambassadors.',
        'Write each test\'s success bar down before it starts.'],
   ships: 'Two experiments live, with their bars set in advance.',
   metric: 'India week-1 activation, and cost per activated install by creator.',
   get: 'A weekly experiment log anyone on the team can read.'},
  {theme: 'Decide and commit',
   do: ['Read every result against the bar set in week 3.',
        'Kill, keep or scale each bet. No "let\'s run it longer".',
        'Re-rank the seven bets by real dollars per week of work.',
        'Turn it into the day-90 plan: budget by channel and team asks.'],
   ships: 'A written memo: what changed, why, what we fund next.',
   metric: 'New monthly revenue from India, and payback by channel.',
   get: 'An honest section on where I was wrong.'},
];
const WEEK_MS = 8000;
let week = 0, weekAuto = true, weekTimer = 0;
$('#weekTabs').innerHTML = WEEKS.map((w, i) => `<button type="button" role="tab" id="wk${i}" aria-selected="false" data-i="${i}"><small>Week ${i + 1}</small><b>${w.theme}</b><span class="tab-timer"><i></i></span></button>`).join('');
function showWeek(i) {
  week = i;
  const w = WEEKS[i];
  $$('#weekTabs button').forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.classList.toggle('past', j < i); b.classList.remove('timing'); });
  const tab = $('#wk' + i);
  if (weekAuto && !reduce) { void tab.offsetWidth; tab.classList.add('timing'); }
  $('#weekPanel').setAttribute('aria-labelledby', 'wk' + i);
  $('#weekFill').style.transform = `scaleX(${(i + 1) / WEEKS.length})`;
  $('#weekBlip').style.left = `${(i + 1) / WEEKS.length * 100}%`;
  $('#weekPanel').innerHTML = `
    <div class="wp-do"><p class="wp-k">Week ${i + 1} · What I do</p><h3>${esc(w.theme)}</h3><ul>${w.do.map((d, j) => `<li style="--d:${j * 120}ms">${esc(d)}</li>`).join('')}</ul></div>
    <div class="wp-out">
      <div class="tile ships" style="--d:200ms"><span>Ships</span><p>${esc(w.ships)}</p></div>
      <div class="tile metric" style="--d:320ms"><span>Number I own</span><p>${esc(w.metric)}</p></div>
      <div class="tile get" style="--d:440ms"><span>What you get</span><p>${esc(w.get)}</p></div>
    </div>`;
  clearTimeout(weekTimer);
  if (weekAuto && !reduce) weekTimer = setTimeout(() => showWeek((week + 1) % WEEKS.length), WEEK_MS);
}
$$('#weekTabs button').forEach(b => b.onclick = () => { weekAuto = false; showWeek(+b.dataset.i); });
$('#weekTabs').addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  weekAuto = false; const n = (week + (e.key === 'ArrowRight' ? 1 : WEEKS.length - 1)) % WEEKS.length;
  showWeek(n); $('#wk' + n).focus();
});
weekAuto = false; showWeek(0); weekAuto = true;
onView($('.weeks'), () => { if (weekAuto) showWeek(0); }, .4);

/* ---------- Interview: pick a question ---------- */
const QA = [
  {q: 'Why should we hire you?',
   a: "I already behave like your best user and your growth hire at once. I was #1 in my Wispr Flow cohort in April. I found two revenue leaks as a customer, sized seven bets in dollars on this page, and I live in your fastest-growing market."},
  {q: "What's the biggest number on this page?",
   a: "India. It's 14% of your downloads and about 2% of revenue. Fixing UPI payments and getting the first dictation to happen in WhatsApp are, in my model, the two highest-return weeks of work you have."},
  {q: 'What leaks did you find?',
   a: 'Two. Twelve email addresses get anyone a year of Pro through referrals, and two people can share one account at once. And my UPI Autopay mandate failed twice, so Pro quietly lapsed. Both are small fixes: one reward per device, and mandate retries with a grace period.'},
  {q: 'How sure are you about the model?',
   a: "The inputs that are public are solid: downloads, India's share, 19% free-to-paid, 70% retention. Activation and each bet's effect are my estimates, and the page says so. Week one is replacing every estimate with your real data."},
  {q: 'Why LinkedIn?',
   a: 'Your buyers are knowledge workers, and that is where they type. You run about 60 LinkedIn ads a month against 900 on Google. The play is a spoken-post format, creators paid on activated installs, and a code per placement.'},
  {q: 'What are your gaps?',
   a: "I haven't run millions a month in paid media, and I haven't led a team of senior specialists. I'd own the decisions, meaning what to fund, what to cut and what each dollar should prove, and lean on your paid leads for platform depth."},
  {q: 'How will we know it worked?',
   a: "The day-90 scoreboard on this page. India's share of new revenue roughly doubled, UPI mandate success above 95%, and 20K activated installs a month from LinkedIn creators. I set each bar before the test starts."},
  {q: 'Where are you based?',
   a: "India. Your posting says you sponsor H-1B and O-1. Until then, I'm on the ground in your #2 market."},
];
$('#chips').innerHTML = QA.map((x, i) => `<button type="button" data-i="${i}">${esc(x.q)}</button>`).join('');
const askedSet = new Set();
let chatBusy = false;
async function ask(i) {
  if (chatBusy) return;
  chatBusy = true;
  const chat = $('#chat'), {q, a} = QA[i];
  $(`#chips button[data-i="${i}"]`).classList.add('used');
  askedSet.add(i);
  $('#asked').textContent = askedSet.size === QA.length ? 'All 8 answered. Now you have to email me.' : `${askedSet.size} of ${QA.length} answered`;
  chat.insertAdjacentHTML('beforeend', `<div class="msg q"><p>${esc(q)}</p></div>`);
  chat.insertAdjacentHTML('beforeend', `<div class="msg a"><span class="who">AS</span><p><span class="dots"><i></i><i></i><i></i></span></p></div>`);
  const p = chat.lastElementChild.querySelector('p');
  if (ME['q' + i]) { playMe('q' + i); chat.lastElementChild.insertAdjacentHTML('beforeend', '<span class="mine">In my voice</span>'); }
  chat.scrollTo({top: chat.scrollHeight, behavior: reduce ? 'auto' : 'smooth'});
  await sleep(reduce ? 0 : 650);
  if (reduce) p.textContent = a;
  else for (let n = 1; n <= a.length; n++) { p.textContent = a.slice(0, n); if (n % 12 === 0) chat.scrollTop = chat.scrollHeight; await sleep(9); }
  chat.scrollTop = chat.scrollHeight;
  chatBusy = false;
}
$$('#chips button').forEach(b => b.onclick = () => ask(+b.dataset.i));

measureRail();
