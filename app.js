(function() {
  'use strict';

  document.documentElement.classList.add('js');
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motionPreference.matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* Top bar gets a hairline and blur once you scroll */
  addEventListener('scroll', () => {
    const bar = $('.bar');
    if (bar) bar.classList.toggle('scrolled', scrollY > 12);
  }, {passive: true});

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
    if (!raw || !clean || !dTag) return c;
    clean.textContent = ''; dTag.textContent = 'You say'; dTag.classList.remove('done');
    const words = r.split(' ');
    for (let i = 1; i <= words.length; i++) { 
      raw.textContent = words.slice(0, i).join(' '); 
      await sleep(wordMs); 
    }
    await sleep(450);
    raw.innerHTML = strike(r);
    await sleep(800);
    raw.textContent = ''; dTag.textContent = 'Flow types'; dTag.classList.add('done');
    return c;
  }

  async function typeClean(c) {
    if (!clean) return;
    for (let i = 1; i <= c.length; i++) { 
      clean.textContent = c.slice(0, i); 
      await sleep(26); 
    } 
  }

  async function hero() {
    if (reduce) { 
      showH1(); 
      if (clean) clean.textContent = HERO[1]; 
      if (dTag) { dTag.textContent = 'Flow types'; dTag.classList.add('done'); }
      return; 
    }
    showH1();
    const c = await speakLine(HERO, 85);
    showH1();
    await typeClean(c);
    await sleep(3200);
    for (let n = 0; ; n = (n + 1) % DLINES.length) {
      while (reduce || document.hidden) await sleep(500);
      await typeClean(await speakLine(DLINES[n])); 
      await sleep(2800); 
    }
  }
  hero();

  // Usage monthly bars
  const USAGE = [['Jan', 10.3], ['Feb', 4.4], ['Mar', 16.3], ['Apr', 39.9]];
  const barsEl = $('#bars');
  if (barsEl) {
    barsEl.innerHTML = USAGE.map(([m, k], i) =>
      `<div class="bar-col ${m === 'Apr' ? 'peak' : ''}" title="${k}K words"><i style="--h:${k / 39.9 * 100}%;--d:${i * 120}ms"></i><span>${m}</span></div>`).join('');
  }

  /* ---------- Number glide ---------- */
  function glide(el, to, {from = 0, dur = 1400, fmt = v => Math.round(v).toLocaleString('en-US')} = {}) {
    if (!el) return;
    cancelAnimationFrame(el._glide);
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) el._glide = requestAnimationFrame(step);
    };
    el._glide = requestAnimationFrame(step);
  }

  /* ---------- Reveal system ---------- */
  const groups = [
    '.hero-copy > .intro', '.hero-copy > .actions', '.sec-head > *', '.stat', '.chapter h2', '.chapter .body', '.kicker', '.stop-tag',
    '.pull', '.notes article', '.leak', '.moves li', '.hedge', '.post', '.weeks', '.chat', '.chips', '.fact',
    '.gaps article', '.close h2', '.close p', '.ns', '.model', '.rank-card', '.assume', '.score', '.route-card'
  ];
  groups.forEach(sel => $$(sel).forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${(i % 4) * 90}ms`); }));
  const onView = (el, fn, threshold = .25) => {
    if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), {threshold: 0, rootMargin: '0px 0px -24px 0px'});
    io.observe(el);
  };
  $$('.reveal').forEach(el => onView(el, t => t.classList.add('in'), .12));
  if (barsEl) onView(barsEl, t => t.classList.add('in'));
  const recapSpan = $('.recap-big span');
  if (recapSpan) onView(recapSpan, t => glide(t, 70900, {dur: 1600}));
  $$('.stat').forEach(s => onView(s, t => { t.classList.add('shown'); const b = t.querySelector('.s-num b'); if (b) glide(b, +b.dataset.count, {fmt: v => Math.round(v) + b.dataset.suffix}); }, .4));
  $$('.fact b[data-to]').forEach(b => onView(b, t => glide(t, +t.dataset.to, {dur: 1500, fmt: v => (t.dataset.pre || '') + v.toFixed(+t.dataset.dec || 0) + t.dataset.suf}), .5));
  const gapEl = $('#gap');
  if (gapEl) onView(gapEl, t => t.classList.add('in'), .4);

  /* ---------- Before / after toggles ---------- */
  function setView(target, v) {
    if (!target) return;
    target.dataset.v = v;
    $$(`.ab[data-target="#${target.id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
    if (target.id === 'leak1') animMonths();
    if (target.id === 'leak2') renderUPI();
  }
  $$('.ab').forEach(ab => {
    const target = $(ab.dataset.target);
    if (!target) return;
    ab.querySelectorAll('button').forEach(b => b.onclick = () => { target.dataset.touched = 1; setView(target, b.dataset.v); });
  });
  ['#devices', '#leak1', '#leak2'].forEach((sel, i) => {
    const el = $(sel);
    if (el) onView(el, t => setTimeout(() => { if (!t.dataset.touched) setView(t, 'fix'); }, 4500 + i * 700), .5);
  });

  const MONTHS = 'JFMAMJJASOND'.split('');
  const monthsEl = $('#months');
  if (monthsEl) {
    monthsEl.innerHTML = MONTHS.map((m, i) => `<i style="--d:${i * 90}ms"><span>${m}</span></i>`).join('');
  }
  function animMonths() { 
    const m = $('#months'); 
    if (!m) return;
    m.classList.remove('in'); void m.offsetWidth; m.classList.add('in'); 
  }
  if (monthsEl) onView(monthsEl, animMonths, .6);

  const UPI = {
    now: [['Mandate set', 'ok'], ['Mandate fails', 'bad'], ['Pro lapses', 'off']],
    fix: [['Mandate fails', 'bad'], ['Retry + WhatsApp link', 'ok'], ['Pro keeps running', 'ok']],
  };
  function renderUPI() {
    const leak2 = $('#leak2'), el = $('#upi');
    if (!leak2 || !el) return;
    const v = leak2.dataset.v;
    el.classList.remove('in');
    el.innerHTML = UPI[v].map(([t, c], i) => (i ? `<span class="u-line ${c}" style="--d:${i * 520 - 260}ms"></span>` : '') + `<span class="u-step ${c}" style="--d:${i * 520}ms">${t}</span>`).join('');
    void el.offsetWidth; el.classList.add('in');
  }
  renderUPI();
  const upiEl = $('#upi');
  if (upiEl) onView(upiEl, renderUPI, .6);

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

  const dialsEl = $('#dials');
  if (dialsEl) {
    dialsEl.innerHTML = DIALS.map(d => `<div class="slider"><label for="m-${d.id}">${d.label}<small>${d.note}</small></label><output id="m-${d.id}-o">${d.v}${d.unit}</output><input type="range" id="m-${d.id}" min="${d.min}" max="${d.max}" step="1" value="${d.v}"></div>`).join('');
  }

  const betsEl = $('#bets');
  if (betsEl) {
    betsEl.innerHTML = BETS.map(b => `<button type="button" class="bet" data-id="${b.id}" aria-pressed="false"><span class="sw"></span><span class="bet-txt"><b>${b.t}</b><small>${b.fx}</small></span><span class="bet-meta"><em class="bet-val" id="v-${b.id}"></em><small>${b.weeks} wk · ${b.conf}</small></span></button>`).join('');
  }

  const dial = id => {
    const el = $('#m-' + id);
    return el ? +el.value : 0;
  };

  function run(on) {
    const m = {inst: dial('inst') * 1000, india: dial('india'), actG: dial('actG'), actI: dial('actI'), convG: dial('convG'), convI: dial('convI'), extraG: 0, extraI: 0, mult: 1};
    BETS.filter(b => on.includes(b.id)).forEach(b => b.apply(m));
    const iI = m.inst * m.india / 100 * m.mult + m.extraI, gI = m.inst * (1 - m.india / 100) * m.mult + m.extraG;
    const aI = iI * clamp(m.actI, 0, 100) / 100, aG = gI * clamp(m.actG, 0, 100) / 100;
    const pI = aI * clamp(m.convI, 0, 100) / 100, pG = aG * clamp(m.convG, 0, 100) / 100;
    const mrrI = pI * ARPU_I, mrr = mrrI + pG * ARPU_G;
    return {inst: iI + gI, act: aI + aG, paid: pI + pG, yearly: mrr * 12 * 12 * KEEP, india: mrr ? mrrI / mrr : 0};
  }

  const usd = n => { const a = Math.abs(n); return (n < 0 ? '−' : '') + (a >= 1e6 ? '$' + (a / 1e6).toFixed(1) + 'M' : '$' + Math.round(a / 1e3) + 'K'); };
  const k = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.round(n / 1e3) + 'K';
  let shownBig = 0, shownIndia = 0;

  function renderModel() {
    DIALS.forEach(d => {
      const el = $('#m-' + d.id);
      if (!el) return;
      el.style.setProperty('--p', ((el.value - d.min) / (d.max - d.min) * 100) + '%');
      const out = $(`#m-${d.id}-o`);
      if (out) out.textContent = el.value + d.unit;
    });
    const on = $$('.bet[aria-pressed=true]').map(b => b.dataset.id);
    const base = run([]), now = run(on);
    const solo = BETS.map(b => ({...b, gain: run([b.id]).yearly - base.yearly}));
    solo.forEach(b => { 
      const vEl = $('#v-' + b.id);
      if (vEl) vEl.textContent = '+' + usd(b.gain) + '/yr'; 
    });
    const gain = now.yearly - base.yearly;
    glide($('#oBig'), gain, {from: shownBig, dur: 800, fmt: v => (v >= 0 ? '+' : '') + usd(v)});
    shownBig = gain;
    const oSub = $('#oSub');
    if (oSub) {
      oSub.innerHTML = on.length
        ? `New revenue from a year of sign-ups goes from <b>${usd(base.yearly)}</b> to <b>${usd(now.yearly)}</b>, up ${Math.round(gain / base.yearly * 100)}%.`
        : `Baseline: a year of sign-ups adds about <b>${usd(base.yearly)}</b> in revenue. Switch on a bet.`;
    }
    const rows = [['Installs a month', base.inst, now.inst], ['Activated in week one', base.act, now.act], ['New payers a month', base.paid, now.paid]];
    const funnelEl = $('#funnel');
    if (funnelEl) {
      funnelEl.innerHTML = rows.map(([l, b, n]) => `<div class="f-row"><span>${l}</span><i style="--w:${Math.max(4, n / now.inst * 100)}%"></i><b>${k(n)}</b><small class="${n > b + 1 ? 'up' : ''}">${n > b + 1 ? '+' + k(n - b) : '·'}</small></div>`).join('');
    }
    const ind = now.india * 100;
    glide($('#oIndia'), ind, {from: shownIndia, dur: 700, fmt: v => v.toFixed(1) + '%'});
    shownIndia = ind;
    const oIndiaBar = $('#oIndiaBar');
    if (oIndiaBar) {
      oIndiaBar.style.transform = `scaleX(${Math.min(1, ind / Math.max(.1, dial('india')))})`;
    }
    const ranked = [...solo].sort((a, b) => b.gain / b.weeks - a.gain / a.weeks);
    const top = Math.max(...ranked.map(b => b.gain / b.weeks));
    const rankedEl = $('#ranked');
    if (rankedEl) {
      rankedEl.innerHTML = ranked.map((b, i) => `<li class="${on.includes(b.id) ? 'on' : ''}"><span class="r-n">${i + 1}</span><span class="r-t">${b.t}<small>${usd(b.gain)} a year · ${b.weeks} week${b.weeks > 1 ? 's' : ''} · ${b.conf} confidence</small></span><span class="r-bar"><i style="--w:${b.gain / b.weeks / top * 100}%"></i></span><b>${usd(b.gain / b.weeks)}<small>a year, per week of work</small></b></li>`).join('');
    }
  }

  $$('.bet').forEach(b => b.onclick = () => { 
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); 
    renderModel(); 
  });
  $$('#dials input').forEach(i => i.addEventListener('input', renderModel));
  const allOnBtn = $('#allOn'), allOffBtn = $('#allOff');
  if (allOnBtn) allOnBtn.onclick = () => { $$('.bet').forEach(b => b.setAttribute('aria-pressed', 'true')); renderModel(); };
  if (allOffBtn) allOffBtn.onclick = () => { $$('.bet').forEach(b => b.setAttribute('aria-pressed', 'false')); renderModel(); };
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
  const weekTabsEl = $('#weekTabs');
  if (weekTabsEl) {
    weekTabsEl.innerHTML = WEEKS.map((w, i) => `<button type="button" role="tab" id="wk${i}" aria-selected="false" aria-controls="weekPanel" tabindex="-1" data-i="${i}"><small>Week ${i + 1}</small><b>${w.theme}</b><span class="tab-timer"><i></i></span></button>`).join('');
  }

  function showWeek(i) {
    week = i;
    const w = WEEKS[i];
    $$('#weekTabs button').forEach((b, j) => { 
      b.setAttribute('aria-selected', j === i); 
      b.tabIndex = j === i ? 0 : -1; 
      b.classList.toggle('past', j < i); 
      b.classList.remove('timing'); 
    });
    const tab = $('#wk' + i);
    if (tab && weekAuto && !reduce) { void tab.offsetWidth; tab.classList.add('timing'); }
    const panel = $('#weekPanel');
    if (panel) {
      panel.setAttribute('aria-labelledby', 'wk' + i);
      panel.innerHTML = `
        <div class="wp-do"><p class="wp-k">Week ${i + 1} · What I do</p><h3>${esc(w.theme)}</h3><ul>${w.do.map((d, j) => `<li style="--d:${j * 120}ms">${esc(d)}</li>`).join('')}</ul></div>
        <div class="wp-out">
          <div class="tile ships" style="--d:200ms"><span>Ships</span><p>${esc(w.ships)}</p></div>
          <div class="tile metric" style="--d:320ms"><span>Number I own</span><p>${esc(w.metric)}</p></div>
          <div class="tile get" style="--d:440ms"><span>What you get</span><p>${esc(w.get)}</p></div>
        </div>`;
    }
    const fill = $('#weekFill'), blip = $('#weekBlip');
    if (fill) fill.style.transform = `scaleX(${(i + 1) / WEEKS.length})`;
    if (blip) blip.style.left = `${(i + 1) / WEEKS.length * 100}%`;
    clearTimeout(weekTimer);
    if (weekAuto && !reduce) weekTimer = setTimeout(() => showWeek((week + 1) % WEEKS.length), WEEK_MS);
  }

  $$('#weekTabs button').forEach(b => b.onclick = () => { weekAuto = false; showWeek(+b.dataset.i); });
  if (weekTabsEl) {
    weekTabsEl.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      weekAuto = false; 
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? WEEKS.length - 1 : (week + (e.key === 'ArrowRight' ? 1 : WEEKS.length - 1)) % WEEKS.length;
      showWeek(n); 
      const targetTab = $('#wk' + n);
      if (targetTab) targetTab.focus();
    });
  }
  weekAuto = false; showWeek(0); weekAuto = true;
  const weeksEl = $('.weeks');
  if (weeksEl) onView(weeksEl, () => { if (weekAuto) showWeek(0); }, .4);

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

  const chipsEl = $('#chips');
  if (chipsEl) {
    chipsEl.innerHTML = QA.map((x, i) => `<button type="button" data-i="${i}">${esc(x.q)}</button>`).join('');
  }
  const askedSet = new Set();
  let chatBusy = false;

  async function ask(i) {
    if (chatBusy) return;
    chatBusy = true;
    const chat = $('#chat'), {q, a} = QA[i];
    const chipBtn = $(`#chips button[data-i="${i}"]`);
    if (chipBtn) chipBtn.classList.add('used');
    askedSet.add(i);
    const askedEl = $('#asked');
    if (askedEl) {
      askedEl.textContent = askedSet.size === QA.length ? 'All 8 answered. Now let’s talk directly.' : `${askedSet.size} of ${QA.length} answered`;
    }
    chat.insertAdjacentHTML('beforeend', `<div class="msg q"><p>${esc(q)}</p></div>`);
    chat.insertAdjacentHTML('beforeend', `<div class="msg a"><span class="who">AS</span><p><span class="dots"><i></i><i></i><i></i></span></p></div>`);
    const p = chat.lastElementChild.querySelector('p');
    chat.scrollTo({top: chat.scrollHeight, behavior: reduce ? 'auto' : 'smooth'});
    await sleep(reduce ? 0 : 650);
    if (reduce) {
      p.textContent = a;
    } else {
      for (let n = 1; n <= a.length; n++) { 
        p.textContent = a.slice(0, n); 
        if (n % 12 === 0) chat.scrollTop = chat.scrollHeight; 
        await sleep(9); 
      }
    }
    chat.scrollTop = chat.scrollHeight;
    chatBusy = false;
  }

  $$('#chips button').forEach(b => b.onclick = () => ask(+b.dataset.i));

  /* Motion toggle */
  const motionToggle = $('#motionToggle');
  function setMotion(paused) {
    reduce = paused;
    document.documentElement.classList.toggle('reduced-motion', paused);
    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.textContent = paused ? 'Resume animations' : 'Pause animations';
    }
    if (paused) {
      clearTimeout(weekTimer);
      $$('.reveal').forEach(el => el.classList.add('in')); 
      showH1();
    }
  }
  if (motionToggle) motionToggle.onclick = () => setMotion(!reduce);
  motionPreference.addEventListener('change', e => setMotion(e.matches));
  setMotion(reduce);

})();
