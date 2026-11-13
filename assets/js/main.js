/* ===== Shared behaviour: theme, direction, nav, dropdown, back-to-top ===== */
(function () {
  var root = document.documentElement;
  function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  root.classList.add('js');
  root.setAttribute('data-theme', get('rwa-theme', 'light'));
  root.setAttribute('dir', get('rwa-dir', 'ltr'));

  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.querySelector('.main-nav');
    var toggle = document.querySelector('.menu-toggle');

    function closeDropdowns() {
      document.querySelectorAll('.has-dd.open').forEach(function (d) {
        d.classList.remove('open');
        var b = d.querySelector('.dd-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
    function closeMenu() {
      if (nav) nav.classList.remove('open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
      closeDropdowns();
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        set('rwa-theme', next);
      });
    });
    document.querySelectorAll('[data-dir-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
        root.setAttribute('dir', next);
        set('rwa-dir', next);
      });
    });

    if (toggle && nav) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (!open) closeDropdowns();
      });
    }

    document.querySelectorAll('.dd-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var parent = btn.closest('.has-dd');
        var wasOpen = parent.classList.contains('open');
        closeDropdowns();
        if (!wasOpen) { parent.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });

    document.querySelectorAll('.main-nav a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-dd')) closeDropdowns();
      if (nav && nav.classList.contains('open') && !e.target.closest('.main-nav')) closeMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (!window.matchMedia('(max-width:1279px),(max-width:1366px) and (min-height:821px)').matches) closeMenu(); });

    var top = document.querySelector('.back-top');
    if (top) {
      window.addEventListener('scroll', function () {
        top.classList.toggle('show', window.scrollY > 400);
      }, { passive: true });
      top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();

/* ===== Forms: validation, password toggle, static auth redirects ===== */
document.addEventListener('DOMContentLoaded', function () {
  function valid(f) {
    var v = f.value.trim();
    if (f.required && !v) return false;
    if (f.type === 'email' && v) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (f.type === 'tel' && v) return /^[+\d][\d\s-]{7,}$/.test(v);
    if (f.type === 'checkbox') return !f.required || f.checked;
    if (f.dataset.match) { var o = document.getElementById(f.dataset.match); return !o || v === o.value; }
    if (f.type === 'password' && f.dataset.min) return v.length >= parseInt(f.dataset.min, 10);
    return true;
  }
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var fields = form.querySelectorAll('input,select,textarea');
    fields.forEach(function (f) {
      f.addEventListener('input', function () { var w = f.closest('.field'); if (w) w.classList.toggle('invalid', !valid(f)); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      fields.forEach(function (f) { var w = f.closest('.field'); var good = valid(f); if (w) w.classList.toggle('invalid', !good); if (!good) ok = false; });
      if (!ok) return;
      var next = form.dataset.next;
      if (next) { window.location.href = next; return; }
      var msg = form.querySelector('.form-ok'); if (msg) msg.classList.add('show');
      form.reset();
    });
  });
  document.querySelectorAll('[data-pw-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = document.getElementById(b.dataset.pwToggle);
      var show = i.type === 'password'; i.type = show ? 'text' : 'password';
      b.textContent = show ? 'Hide' : 'Show';
    });
  });
  document.querySelectorAll('[data-social]').forEach(function (b) {
    b.addEventListener('click', function () { window.location.href = 'dashboard.html'; });
  });
});

/* ===== Motion: scroll reveal (staggered) + number count-up ===== */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEL = '.section-head,.card,.svc,.stat,.step,.qtile,.value,.info-card,.quote,.voice-main,.ann,.pinned,.ann-photo,.mosaic .media,.feature .big,.month,.vrow,.timeline li,.panel,.check-list li,.split>*,.faq details,.cstrip,.footer-grid>div,.kpi,.dcard,.cta .container,.values-split>*,.chips';
  function counts(root) {
    (root || document).querySelectorAll('.hero-stats strong,.stat strong,.glance strong').forEach(function (n) {
      var m = /^(\d[\d,]*)(\+|%)?$/.exec(n.textContent.trim());
      if (!m || n.dataset.counted) return;
      n.dataset.counted = '1';
      var end = parseInt(m[1].replace(/,/g, ''), 10), suf = m[2] || '', big = m[1].indexOf(',') > -1;
      var io = new IntersectionObserver(function (es, o) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; o.disconnect();
          var t0 = null, dur = 1400;
          function step(t) {
            if (t0 === null) t0 = t; var p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
            n.textContent = (big ? v.toLocaleString('en-IN') : v) + suf; if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: .4 });
      io.observe(n);
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var seen = new Map();
    var els = document.querySelectorAll(SEL);
    els.forEach(function (el) {
      if (el.closest('.site-header,.dash-top,.auth-nav,.modal')) return;
      var p = el.parentNode, i = seen.get(p) || 0; seen.set(p, i + 1);
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(i, 5) * 0.09 + 's');
      if (el.matches('.split>*')) el.classList.add(i === 0 ? 'from-left' : 'from-right');
      else if (el.matches('.mosaic .media,.feature .big')) el.classList.add('zoom');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target; t.classList.add('in'); io.unobserve(t);
        /* once revealed, hand the element back to normal hover styles */
        setTimeout(function () { t.classList.remove('reveal', 'in', 'from-left', 'from-right', 'zoom'); t.style.removeProperty('--d'); }, 1300);
      });
    }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    counts();
  });
})();

/* ===== FAQ: opening one question closes the others ===== */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq').forEach(function (faq) {
    var items = faq.querySelectorAll('details');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });
});

/* ===== Announcement filter chips ===== */
document.addEventListener('DOMContentLoaded', function () {
  var chips = document.querySelectorAll('.chip[data-filter]');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.toggle('active', x === c); });
      document.querySelectorAll('.ann').forEach(function (a) { a.hidden = c.dataset.filter !== 'all' && a.dataset.cat !== c.dataset.filter; });
    });
  });
});
