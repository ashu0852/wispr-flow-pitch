// Browser checks for reflow, silent navigation, core interactions, and CSP enforcement.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium, webkit} = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.m4a':'audio/mp4'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html'));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  const size=fs.statSync(file).size, headers={'Content-Type': mime[path.extname(file)] || 'text/plain', 'Accept-Ranges':'bytes'};
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
  if (range) {
    const start=Number(range[1]), end=range[2] ? Math.min(Number(range[2]),size-1) : size-1;
    res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
    fs.createReadStream(file,{start,end}).pipe(res);
  } else { res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(file).pipe(res); }
});
const sizes = [
  [320,568], [390,844], [768,1024], [1024,640], [1280,720], [1366,768], [1440,900],
  [1600,900], [1708,960], [1800,1125], [2400,1350], // 80% laptop zoom / wide screens
  [1093,614], [911,512], [683,384], [455,256] // 125%, 150%, 200%, 300% on a 1366×768 viewport
];
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}/`;
  const engine = process.env.TEST_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({headless:true, ...(engine === chromium && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  try {
    for (const [width, height] of sizes) {
      const page = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'});
      const errors = [], failed = [], external = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if(r.status() >= 400) failed.push(r.url()); });
      page.on('request', r => { if(!r.url().startsWith(base) && !r.url().startsWith('data:')) external.push(r.url()); });
      await page.goto(base); await page.evaluate(() => document.fonts.ready);
      await page.locator('.bet').first().waitFor();
      const layout = await page.evaluate(() => {
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
        const overflowing = [...document.querySelectorAll('main p,main h1,main h2,main h3,main button,.out,.bet,.fact,.stat,.f-row,.ns-top,.sr')]
          .filter(visible).filter(el => el.scrollWidth > el.clientWidth + 3).map(el => el.className || el.tagName);
        const brokenAnchors = [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash);
        return {overflow:document.documentElement.scrollWidth > innerWidth, overflowing, brokenAnchors, silent:!document.querySelector('#snd,#bubble,.me-play'), tabs:document.querySelectorAll('[role=tab][tabindex="0"]').length};
      });
      assert.equal(layout.overflow, false, `${width}×${height}: page overflow`);
      assert.deepEqual(layout.overflowing, [], `${width}×${height}: inner overflow`);
      assert.deepEqual(layout.brokenAnchors, []); assert.equal(layout.silent, true); assert.equal(layout.tabs, 1);
      assert.deepEqual(errors, []); assert.deepEqual(failed, []); assert.deepEqual(external, []);
      await page.close();
    }
    console.log(`PASS ${engine.name()}: ${sizes.length} viewport/zoom-equivalent layouts, local assets, anchors, no runtime errors`);
    const page = await browser.newPage({viewport:{width:1366,height:768}, reducedMotion:'reduce'});
    await page.goto(base);
    await page.locator('#zapAll').click();
    await page.waitForFunction(() => document.querySelector('#game').classList.contains('won'));
    assert.equal(await page.locator('.filler:disabled').count(), 6);
    await page.locator('.ab[data-target="#devices"] [data-v="fix"]').click();
    assert.equal(await page.locator('#devices').getAttribute('data-v'), 'fix');
    await page.locator('#allOn').click();
    assert.equal(await page.locator('.bet[aria-pressed=true]').count(), 7);
    assert.notEqual(await page.locator('#oBig').textContent(), '+$0K');
    await page.locator('#allOff').click();
    assert.equal(await page.locator('#oBig').textContent(), '+$0K');
    await page.locator('.assume summary').click();
    for (const value of ['0','40']) {
      await page.locator('#m-india').fill(value); await page.locator('#m-india').dispatchEvent('input');
      assert.equal(/NaN|Infinity/.test(await page.locator('#math').innerText()), false);
    }
    await page.locator('#wk0').focus(); await page.keyboard.press('End');
    assert.equal(await page.locator('#wk3').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home'); assert.equal(await page.locator('#wk0').getAttribute('aria-selected'), 'true');
    for (let i=0;i<8;i++) {
      await page.locator(`#chips button[data-i="${i}"]`).click();
      await page.waitForFunction(n => document.querySelectorAll('#chat .msg.a').length === n+2 && !document.querySelector('#chat .dots'), i);
    }
    assert.equal(await page.locator('#chat .msg.q').count(), 8);
    await page.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8'));
    const a11y = await page.evaluate(async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)})));
    assert.deepEqual(a11y, [], 'Accessibility violations');
    console.log('PASS calculator, all interview answers, keyboard tabs, game, and automated WCAG checks');
    // Verify policy enforcement with a harmless injected inline script and event handler.
    const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.ok(policy.includes("script-src 'self'")); assert.ok(!policy.includes("script-src 'self' 'unsafe-inline'"));
    await page.evaluate(() => {
      const script = document.createElement('script'); script.textContent='window.__injectedScriptRan=true'; document.body.appendChild(script);
      const button=document.createElement('button'); button.setAttribute('onclick','window.__injectedHandlerRan=true');document.body.appendChild(button);button.click();button.remove();script.remove();
    });
    assert.equal(await page.evaluate(() => Boolean(window.__injectedScriptRan || window.__injectedHandlerRan)), false);
    console.log('PASS CSP blocks inline script and event-handler injection');
    await page.close();
    const motion = await browser.newPage({viewport:{width:1800,height:1000}});
    const motionErrors=[];motion.on('pageerror',e=>motionErrors.push(e.message));
    await motion.goto(base);
    await motion.waitForFunction(() => document.querySelector('#buddy').classList.contains('land'));
    await motion.waitForFunction(() => !document.querySelector('#buddy').classList.contains('land'));
    await motion.locator('#buddy').click();
    await motion.waitForFunction(() => window.scrollY > 100);
    await motion.setViewportSize({width:390,height:844});
    await motion.waitForTimeout(350);
    await motion.locator('#motionToggle').click();
    await motion.waitForTimeout(100);
    assert.equal(await motion.locator('#motionToggle').getAttribute('aria-pressed'), 'true');
    assert.equal(await motion.locator('#buddy').evaluate(el => el.matches('.shoot,.swing,.land')), false);
    assert.deepEqual(motionErrors, []);
    await motion.close();
    for (const width of [390,1366,1800]) {
      const scrolling = await browser.newPage({viewport:{width,height:900}});
      await scrolling.goto(base);
      const result = await scrolling.evaluate(() => new Promise(resolve => {
        const failures=[], positions=[], start=performance.now();let lastScroll=0, webFrames=0;
        function sample(now) {
          if(now-start>300 && now-lastScroll>90){window.scrollBy({top:100,behavior:'instant'});lastScroll=now;}
          const buddy=document.querySelector('#buddy'), r=buddy.getBoundingClientRect(), css=getComputedStyle(buddy);
          if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)<.99)failures.push('hidden');
          if(r.left < -1 || r.right > innerWidth+1 || r.top < 63 || r.bottom > innerHeight+1)failures.push('offscreen');
          if(document.querySelector('#webA').classList.contains('on'))webFrames++;
          positions.push([r.x,r.y]);
          if(now-start<4200)requestAnimationFrame(sample);else resolve({failures,webFrames,travel:Math.max(...positions.map(p=>p[0]))-Math.min(...positions.map(p=>p[0]))});
        }requestAnimationFrame(sample);
      }));
      assert.deepEqual(result.failures, [], `${width}: guide must stay visible and on screen throughout scrolling`);
      assert.ok(result.webFrames > 0, `${width}: scroll must trigger a web shot`);
      assert.ok(result.travel > 10, `${width}: guide must move during scrolling`);
      assert.equal(await scrolling.locator('audio,.note-player,#voiceNote').count(),0);
      await scrolling.close();
    }
    console.log('PASS continuous-scroll guide visibility, web shots, and movement on mobile and laptops');
    const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(base);
    assert.ok(await noJS.locator('h1').isVisible());assert.ok(await noJS.locator('noscript').isVisible());await noJS.close();
    console.log('PASS silent guide landing/navigation, resize, pause, and no-JavaScript fallback');
  } finally { await browser.close();server.close(); }
})().catch(error => { console.error(error); server.close();process.exitCode=1; });
