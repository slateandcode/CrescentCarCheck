(function () {
  'use strict';

  const cfg = window.CRESCENT_CONFIG || {};
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const root = document.documentElement;
  const motion = root.classList.contains('motion');

  /* ---------- Tracking ---------- */

  window.dataLayer = window.dataLayer || [];

  function track(event, params, conversion) {
    window.dataLayer.push(Object.assign({ event: event }, params));
    const label = conversion && cfg.conversions && cfg.conversions[conversion];
    if (label && window.gtag && cfg.adsId) {
      window.gtag('event', 'conversion', { send_to: cfg.adsId + '/' + label });
    }
  }

  function addScript(src) {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadTags() {
    if (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    const ids = [cfg.adsId, cfg.ga4Id].filter(Boolean);
    ids.forEach((id) => window.gtag('config', id));
    if (ids.length) addScript('https://www.googletagmanager.com/gtag/js?id=' + ids[0]);
    if (cfg.gtmId) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      addScript('https://www.googletagmanager.com/gtm.js?id=' + cfg.gtmId);
    }
  }

  if (document.readyState === 'complete') loadTags();
  else window.addEventListener('load', loadTags);

  /* ---------- Menu (mobile drawer) ---------- */

  const menu = $('#menu');
  const burger = $('.top__burger');

  if (menu && burger) {
    menu.addEventListener('close', () => burger.setAttribute('aria-expanded', 'false'));
    burger.addEventListener('click', () => burger.setAttribute('aria-expanded', 'true'));
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const where = { cta_location: a.dataset.cta || 'unknown' };

    // A link inside the drawer closes it first; the page then scrolls to the section.
    if (menu && menu.open && menu.contains(a)) menu.close();

    if (href.indexOf('https://wa.me/') === 0) {
      promoDone();
      if (!a.hasAttribute('data-direct')) {
        e.preventDefault();
        openWaForm(a);
      } else if (!a.hasAttribute('data-notrack')) {
        track('whatsapp_click', where, 'whatsapp');
      }
    } else if (href.indexOf('tel:') === 0) {
      track('call_click', where, 'call');
      promoDone();
    }
  });

  /* ---------- Reviews: rendered from assets/js/reviews.js ---------- */

  const revList = $('[data-reviews]');
  const reviews = Array.isArray(window.CRESCENT_REVIEWS) ? window.CRESCENT_REVIEWS : [];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function icon(id, cls) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', cls || 'i');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  if (revList) {
    reviews.forEach((r) => {
      const li = el('li', 'rev');
      li.setAttribute('data-r', '');

      const top = el('div', 'rev__top');
      top.appendChild(el('span', 'rev__av', (r.name || '?').trim().charAt(0).toUpperCase()));
      const who = el('div', 'rev__who');
      who.appendChild(el('b', null, r.name || 'Google user'));
      if (r.when) who.appendChild(el('span', null, r.when));
      top.appendChild(who);
      top.appendChild(icon('i-google', 'i rev__g'));
      li.appendChild(top);

      const n = Math.max(1, Math.min(5, Math.round(+r.stars || 5)));
      const stars = el('div', 'rev__stars stars');
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', n + ' out of 5 stars');
      for (let i = 0; i < n; i++) stars.appendChild(icon('i-star'));
      li.appendChild(stars);

      li.appendChild(el('p', null, r.text || ''));
      revList.appendChild(li);
    });
  }

  const allReviews = $('[data-google-reviews]');
  if (allReviews && cfg.googleReviewsUrl) {
    allReviews.href = cfg.googleReviewsUrl;
    allReviews.hidden = false;
  }

  /* ---------- Scroll-linked effects ---------- */

  const bar = $('.bar');
  const beamItems = $$('[data-at]');
  const scanNow = $('[data-scan-now]');
  const scanCount = $('[data-scan-count]');
  const scanStick = $('.scan__stick');
  const scanItems = $$('.scan__list li');
  const scanNames = scanItems.map((li) => li.textContent.trim());
  let lastLit = -2;

  function paintScan(p) {
    beamItems.forEach((el) => el.classList.toggle('on', p >= +el.dataset.at));
    scanCount.textContent = Math.round(600 * clamp(p / 0.92));
    let lit = -1;
    scanItems.forEach((li, i) => { if (li.classList.contains('on')) lit = i; });
    if (p >= 0.92) lit = scanItems.length;
    if (lit !== lastLit) {
      lastLit = lit;
      scanNow.textContent = lit < 0 ? 'Starting scan' : lit === scanItems.length ? 'Report ready' : scanNames[lit];
    }
  }

  const scrubs = $$('[data-scrub]').map((el) => ({
    el: el,
    mode: el.dataset.scrub,
    range: parseFloat(el.dataset.range) || 0.8,
    live: true,
    last: -1
  }));

  if (motion && 'IntersectionObserver' in window) {
    const liveIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const s = scrubs.find((x) => x.el === en.target);
        if (s) s.live = en.isIntersecting;
      });
      // A jump (anchor link, fast fling) can land here after the frame already skipped this element.
      onScroll();
    }, { rootMargin: '25% 0px' });
    scrubs.forEach((s) => liveIO.observe(s.el));
  }

  let ticking = false;

  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';

    scrubs.forEach((s) => {
      if (!s.live) return;
      const r = s.el.getBoundingClientRect();
      let p;
      if (s.mode === 'pin') p = -r.top / (r.height - scanStick.offsetHeight);
      else if (s.mode === 'through') p = (vh * 0.7 - r.top) / r.height;
      else p = (vh - r.top) / (vh * s.range);
      p = clamp(p);
      if (Math.abs(p - s.last) < 0.0005) return;
      s.last = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      if (s.mode === 'pin') paintScan(p);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  if (motion) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    frame();
  } else {
    beamItems.forEach((el) => el.classList.add('on'));
    bar.style.display = 'none';
  }

  /* ---------- Section spy: highlights the current section in the header and the drawer ---------- */

  // On the home page each menu link points to its own page and carries data-spy="<section id>" so the
  // section it belongs to can still be highlighted while scrolling. On the other pages the current
  // link is marked is-active in the HTML and there is nothing to spy on.
  const navLinks = $$('.top__nav a[data-spy], .menu__nav a[data-spy]');
  const spyIds = navLinks.map((a) => a.dataset.spy).filter((id, i, arr) => arr.indexOf(id) === i);
  const spySections = spyIds.map((id) => document.getElementById(id)).filter(Boolean);

  function setActive(id) {
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.spy === id));
  }

  if (spySections.length && 'IntersectionObserver' in window) {
    const seen = new Map();
    const spyIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => seen.set(en.target.id, en.isIntersecting));
      // The last section (in page order) that is currently on screen wins.
      let current = '';
      spySections.forEach((sec) => { if (seen.get(sec.id)) current = sec.id; });
      if (current) setActive(current);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spySections.forEach((sec) => spyIO.observe(sec));
  }

  /* ---------- Reveals and count-ups ---------- */

  function countUp(el) {
    const to = +el.dataset.count;
    const t0 = performance.now();
    const dur = 1100;
    (function step(now) {
      const k = clamp((now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  const revealed = $$('[data-r]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (motion) $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealed.forEach((el) => io.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Swipe sliders: thin progress line under each, arrows where present ---------- */

  $$('[data-slider]').forEach((list) => {
    const wrap = list.parentElement;
    const track = (wrap.classList.contains('revs__wrap') ? wrap : list).nextElementSibling;
    const fill = track && $('i', track);
    const prev = $('[data-rail-step="-1"]', wrap);
    const next = $('[data-rail-step="1"]', wrap);

    const paint = () => {
      const max = list.scrollWidth - list.clientWidth;
      const seen = max > 0 ? (list.scrollLeft + list.clientWidth) / list.scrollWidth : 1;
      if (fill) fill.style.transform = 'scaleX(' + seen + ')';
      if (prev) prev.disabled = list.scrollLeft <= 2;
      if (next) next.disabled = list.scrollLeft >= max - 2;
    };

    [prev, next].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        const card = list.firstElementChild;
        const step = card ? card.getBoundingClientRect().width + 12 : list.clientWidth * 0.8;
        list.scrollBy({ left: step * +btn.dataset.railStep * 2, behavior: motion ? 'smooth' : 'auto' });
      });
    });

    list.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  });

  /* ---------- Dialogs ---------- */

  $$('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dlg = $(btn.dataset.open);
      if (dlg && dlg.showModal && !dlg.open) {
        dlg.showModal();
        // Focus the panel so the close button opens without a focus ring. Tabbing still shows it.
        if (dlg.id === 'menu' || dlg.id === 'report-view') dlg.focus();
      }
    });
  });

  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });

  /* ---------- Callout popup: once per visit ---------- */

  const promo = $('#promo');
  const form = $('#lead-form');
  let promoSpent = false;

  function promoSeen() {
    try { return sessionStorage.getItem('cc_promo') === '1'; } catch (err) { return false; }
  }

  function promoDone() {
    promoSpent = true;
    try { sessionStorage.setItem('cc_promo', '1'); } catch (err) { /* private mode */ }
  }

  function openPromo(trigger) {
    if (promoSpent || promoSeen() || !promo.showModal) return;
    if ($('dialog[open]')) return;
    // The contact form only exists on the home page.
    if (form && form.contains(document.activeElement)) return;
    const contact = $('#contact');
    if (contact) {
      const c = contact.getBoundingClientRect();
      if (c.top < window.innerHeight && c.bottom > 0) return;
    }
    promoDone();
    promo.showModal();
    track('popup_open', { trigger: trigger });
  }

  setTimeout(() => openPromo('timer'), cfg.popupDelayMs || 10000);

  window.addEventListener('scroll', function onDepth() {
    const max = root.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max < 0.4) return;
    window.removeEventListener('scroll', onDepth);
    openPromo('scroll');
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.clientY <= 0 && !e.relatedTarget) openPromo('exit');
  });

  /* ---------- Shared form checks ---------- */

  const filled = (v) => v.length >= 2;
  const chosen = (v) => v !== '';
  const phoneOk = (v) => {
    const digits = v.replace(/\D/g, '').length;
    return digits >= 9 && digits <= 15;
  };

  function setError(input, bad) {
    const wrap = input.closest('.field');
    const err = $('.field__err', wrap);
    wrap.classList.toggle('is-bad', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (err) err.hidden = !bad;
  }

  function validate(formEl, rules) {
    let first = null;
    Object.keys(rules).forEach((name) => {
      const input = formEl.elements[name];
      const bad = !rules[name](input.value.trim());
      setError(input, bad);
      if (bad && !first) first = input;
    });
    if (first) first.focus();
    return !first;
  }

  function clearErrorsOnEdit(formEl) {
    ['input', 'change'].forEach((type) => {
      formEl.addEventListener(type, (e) => {
        if (e.target.closest('.field.is-bad')) setError(e.target, false);
      });
    });
  }

  /* ---------- WhatsApp details: asked before the chat opens ---------- */

  const waDialog = $('#wa-form');
  const waForm = $('#wa-details');
  const waDone = $('#wa-done');
  const waAgain = $('#wa-again');
  const waRules = { name: filled, car: filled, emirate: chosen, package: chosen };
  const waPackageByCta = {
    'package-premium': 'Premium Inspection (AED 399)',
    'package-standard': 'Standard Inspection (AED 299)',
    'package-help': 'Not sure yet'
  };
  let waCta = 'unknown';
  let waIntro = '';

  clearErrorsOnEdit(waForm);

  function openWaForm(a) {
    const openDialog = $('dialog[open]');
    if (openDialog) openDialog.close();

    waCta = a.dataset.cta || 'unknown';
    waIntro = new URL(a.href).searchParams.get('text') || '';

    // Anything already typed into the contact form carries over.
    if (form) {
      ['name', 'car', 'emirate', 'package'].forEach((n) => {
        if (!waForm.elements[n].value && form.elements[n].value) waForm.elements[n].value = form.elements[n].value;
      });
    }
    if (waPackageByCta[waCta]) waForm.elements.package.value = waPackageByCta[waCta];

    waForm.hidden = false;
    waDone.hidden = true;
    waDialog.showModal();
    track('whatsapp_form_open', { cta_location: waCta });
  }

  waForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(waForm, waRules)) return;

    const d = Object.fromEntries(new FormData(waForm).entries());
    const lines = [
      waIntro,
      '',
      'Name: ' + d.name.trim(),
      'Car: ' + d.car.trim(),
      'Car location: ' + d.emirate,
      'Package: ' + d.package
    ];
    const url = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));

    track('whatsapp_click', { cta_location: waCta, package: d.package, emirate: d.emirate }, 'whatsapp');
    waAgain.href = url;
    waForm.hidden = true;
    waDone.hidden = false;

    const chat = window.open(url, '_blank');
    if (chat) chat.opener = null;
    else location.href = url;
  });

  /* ---------- Contact form ---------- */

  const done = $('#form-done');
  const pkgSelect = $('#f-package');

  // Keep the ad click details with the lead, even if they browse around first.
  const trackKeys = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const qs = new URLSearchParams(location.search);
  const adData = {};
  trackKeys.forEach((k) => {
    let v = qs.get(k);
    try {
      if (v) sessionStorage.setItem('cc_' + k, v);
      else v = sessionStorage.getItem('cc_' + k);
    } catch (err) { /* private mode */ }
    if (v) adData[k] = v;
  });

  $$('[data-package]').forEach((a) => {
    a.addEventListener('click', () => { if (pkgSelect) pkgSelect.value = a.dataset.package; });
  });

  $$('[data-package], [data-focus-form]').forEach((a) => {
    a.addEventListener('click', () => {
      setTimeout(() => { const f = $('#f-name'); if (f) f.focus({ preventScroll: true }); }, motion ? 800 : 0);
    });
  });

  const leadRules = { name: filled, phone: phoneOk, emirate: chosen, package: chosen, car: filled };

  if (form) clearErrorsOnEdit(form);

  function waLink(d) {
    const lines = [
      "Hi Crescent Car Check, I'd like to book an inspection.",
      '',
      'Name: ' + d.name,
      'Phone: ' + d.phone,
      'Car: ' + d.car,
      'Car location: ' + d.emirate,
      'Package: ' + d.package
    ];
    return 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function showDone(d, sent) {
    $('[data-done-title]', done).textContent = sent ? "Thanks, we've got your request." : 'One last tap.';
    $('[data-done-text]', done).textContent = sent
      ? 'Our team will be in touch shortly to confirm your slot. Want it sorted now? Send your details on WhatsApp.'
      : 'Send your details to us on WhatsApp and our team will confirm your slot.';
    $('[data-done-wa]', done).href = waLink(d);
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
  }

  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.elements.company.value) return;
    if (!validate(form, leadRules)) return;

    const fd = new FormData(form);
    fd.delete('company');
    const d = Object.fromEntries(fd.entries());
    const btn = $('button[type="submit"]', form);

    if (!cfg.formEndpoint) {
      showDone(d, false);
      return;
    }

    fd.append('page', location.href);
    Object.keys(adData).forEach((k) => fd.append(k, adData[k]));
    btn.disabled = true;
    btn.textContent = 'Sending...';

    fetch(cfg.formEndpoint, { method: 'POST', body: fd })
      .then((res) => {
        if (!res.ok) throw new Error('Form endpoint returned ' + res.status);
        track('form_submit', { package: d.package, emirate: d.emirate }, 'form');
        showDone(d, true);
      })
      .catch(() => showDone(d, false));
  });
})();
