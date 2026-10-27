// Analytics for zumerlab.com and its subsites (/orbit, /orbit/kit, /zumly).
// Every page loads it in its <head>:  <script async src="/zumerlab.js"></script>
//
// - Google Analytics 4.
// - Visitors in Europe (EEA, UK, Switzerland) get a cookie banner and nothing
//   loads until they accept. Everyone else is measured from the first visit.
//   The choice is stored once for the whole domain.
// - Events: link_click, ui_click, demo_interact, code_edit, copy_text,
//   scroll_depth, plus whatever a page sends with zumerlab.track(name, params)
//   (the Zumly pages send zoom_view).
// - <span data-cookie-settings hidden><a href="#">Cookies</a></span> reopens
//   the banner; it is shown to visitors in Europe only. The hidden attribute
//   goes on a plain wrapper, since site CSS like `a { display: block }` beats it.
(() => {
  const GA_ID = 'G-XL52CBETDH';
  const KEY = 'zumerlab-consent'; // 'granted' or 'denied'

  // EU, EEA, UK and Switzerland. Google applies this list by IP address.
  const REGIONS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
    'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];

  // The page has no IP to go on, so it uses the time zone to decide where to
  // show the banner. Both mistakes are safe: a European on another time zone
  // gets Google's regional default (no cookies), and anyone else on a European
  // time zone just sees the banner.
  const EUROPE_ZONES = ['Asia/Nicosia', 'Asia/Famagusta', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores',
    'Atlantic/Reykjavik', 'Atlantic/Faroe', 'Arctic/Longyearbyen', 'America/Guadeloupe', 'America/Martinique',
    'America/Cayenne', 'Indian/Reunion', 'Indian/Mayotte'];
  const zone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; } })();
  const europe = zone.startsWith('Europe/') || EUROPE_ZONES.includes(zone);

  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch {} };

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', { ...denied, analytics_storage: 'denied', region: REGIONS });
  gtag('consent', 'default', { ...denied, analytics_storage: 'granted' });

  const choice = read();
  let started = false;
  let loaded = false;

  function site() {
    const p = location.pathname;
    if (/^\/orbit(-kit\/|\/kit\/)/.test(p)) return 'orbit-kit';
    const first = p.split('/')[1];
    return first === 'orbit' || first === 'zumly' ? first : 'zumerlab';
  }

  function start() {
    if (started) return;
    started = true;
    if (read() === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { content_group: site() });
  }

  function decide(value) {
    write(value);
    if (value === 'granted') return start();
    if (!started) return;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    // Remove the cookies already set (_ga, _ga_<id>).
    const base = location.hostname.split('.').slice(-2).join('.');
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim();
      if (!/^(_ga|_gid)/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${base}`;
    }
    started = false;
  }

  if (choice === 'granted' || (!choice && !europe)) start();

  // ─── Banner ──────────────────────────────────────────────

  let banner = null;

  // Light or dark, from the page itself, which may have its own theme toggle.
  function darkPage() {
    for (const el of [document.body, document.documentElement]) {
      const bg = el ? getComputedStyle(el).backgroundColor : '';
      const m = bg.match(/[\d.]+/g);
      if (!m || (m[3] !== undefined && +m[3] === 0)) continue;
      if (/^(ok)?l(ab|ch)\(/.test(bg)) return parseFloat(m[0]) < (bg.includes('%') ? 50 : 0.5);
      return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] < 128;
    }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function openBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.setAttribute('data-zumerlab-consent', '');
    const root = banner.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host { all: initial; position: fixed; z-index: 2147483000; left: 16px; bottom: 16px; width: min(360px, calc(100vw - 32px)); }
      .card {
        --bg: #ffffff; --fg: #1b1f24; --muted: #59636e; --line: rgba(27, 31, 36, .12); --btn: #f1f3f5; --btn-hover: #e6e9ec;
        box-sizing: border-box; padding: 16px; border: 1px solid var(--line); border-radius: 12px;
        background: var(--bg); color: var(--fg); box-shadow: 0 10px 30px rgba(0, 0, 0, .18);
        font: 14px/1.45 var(--font);
        animation: in .24s ease-out;
      }
      .card.dark { --bg: #16191d; --fg: #eef1f4; --muted: #a2abb5; --line: rgba(255, 255, 255, .12); --btn: #262b31; --btn-hover: #31373e; box-shadow: 0 10px 30px rgba(0, 0, 0, .5); }
      h2 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
      p { margin: 0 0 14px; color: var(--muted); }
      a { color: var(--fg); text-underline-offset: 3px; }
      .actions { display: flex; gap: 8px; }
      button {
        flex: 1; min-height: 36px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px;
        background: var(--btn); color: var(--fg); font: inherit; font-weight: 500; cursor: pointer;
      }
      button:hover { background: var(--btn-hover); }
      button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      @keyframes in { from { opacity: 0; transform: translateY(8px); } }
      @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
    </style>
    <section class="card${darkPage() ? ' dark' : ''}" role="region" aria-label="Cookie consent"
      style="--font: ${getComputedStyle(document.body).fontFamily.replace(/"/g, "'")}, system-ui, sans-serif">
      <h2>Analytics cookies</h2>
      <p>Can we use Google Analytics to see which pages and demos people use? Nothing is stored unless you accept. <a href="/privacy.html">Privacy</a></p>
      <div class="actions">
        <button type="button" data-v="denied">Decline</button>
        <button type="button" data-v="granted">Accept</button>
      </div>
    </section>`;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      decide(b.dataset.v);
      banner.remove();
      banner = null;
    });
    document.body.appendChild(banner);
  }

  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  ready(() => {
    if (!europe) return;
    for (const el of document.querySelectorAll('[data-cookie-settings]')) el.hidden = false;
    if (!choice) openBanner();
  });

  // ─── Events ──────────────────────────────────────────────

  const clip = (s, n = 100) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

  function track(name, params = {}) {
    if (!started) return;
    const clean = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') clean[k] = v;
    gtag('event', name, clean);
  }

  // A demo is any live example: Orbit's <figure class="example"> and stages,
  // Zumly's .demo iframes, or anything marked data-demo="name".
  const DEMO = '[data-demo], figure.example, .demo, .stage, .hero-stage';
  const page = () => location.pathname.replace(/index\.html$/, '');

  function demoOf(el) {
    const box = el.closest && (el.closest(DEMO) || (el.tagName === 'IFRAME' ? el : null));
    if (!box) return undefined;
    const frame = box.tagName === 'IFRAME' ? box : box.querySelector('iframe');
    const name = box.dataset.demo || box.getAttribute('aria-label') || (frame && frame.title) ||
      (box.querySelector('figcaption, h2, h3') || {}).textContent;
    return clip(page() + (name ? ` · ${clip(name)}` : ''));
  }

  function area(el, demo) {
    if (demo) return 'demo';
    const box = el.closest('header, nav, footer, aside, main');
    return box ? box.tagName.toLowerCase() : 'page';
  }

  function label(el) {
    const text = clip(el.innerText || el.textContent);
    return clip(el.getAttribute('aria-label') || (/\p{L}/u.test(text) ? text : '') || el.title || text || el.id || el.tagName.toLowerCase());
  }

  document.addEventListener('click', (e) => {
    const settings = e.target.closest('[data-cookie-settings]');
    if (settings) {
      e.preventDefault();
      openBanner();
      return;
    }
    const el = e.target.closest('a[href], button, [role="button"], summary, [data-track]');
    if (!el) return;
    const demo = demoOf(el);
    if (el.matches('a[href]') && !el.dataset.track) {
      const url = new URL(el.href, location.href);
      track('link_click', {
        link_url: url.href, link_text: label(el), link_domain: url.hostname,
        outbound: url.origin !== location.origin, area: area(el, demo), demo,
      });
    } else {
      track('ui_click', { label: el.dataset.track || label(el), text: clip(el.dataset.copy), area: area(el, demo), demo });
    }
  }, true);

  // First touch of each demo, once per page view. A click inside an iframe
  // never reaches this page, but the iframe takes the focus.
  const once = new Set();
  function first(name, el) {
    if (!started) return;
    const demo = demoOf(el);
    if (!demo || once.has(name + demo)) return;
    once.add(name + demo);
    track(name, { demo });
  }
  document.addEventListener('pointerdown', (e) => first('demo_interact', e.target), true);
  document.addEventListener('keydown', (e) => first('demo_interact', e.target), true);
  document.addEventListener('input', (e) => { if (e.target.matches('textarea')) first('code_edit', e.target); }, true);
  let poll;
  addEventListener('blur', () => {
    clearInterval(poll);
    poll = setInterval(() => {
      const f = document.activeElement;
      if (f && f.tagName === 'IFRAME') first('demo_interact', f);
    }, 500);
  });
  addEventListener('focus', () => clearInterval(poll));

  document.addEventListener('copy', () => {
    const sel = getSelection();
    const text = clip(sel);
    if (!text) return;
    const el = (sel.anchorNode && sel.anchorNode.parentElement) || document.body;
    const demo = demoOf(el);
    track('copy_text', { text, code: !!el.closest('pre, code'), area: area(el, demo), demo });
  });

  // Enhanced measurement already sends scroll at 90%.
  const marks = [25, 50, 75];
  let mark = 0;
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max < 400) return;
    const pct = (scrollY / max) * 100;
    while (mark < marks.length && pct >= marks[mark]) track('scroll_depth', { percent_scrolled: marks[mark++] });
  }, { passive: true });

  window.zumerlab = { track, consent: openBanner };
})();
