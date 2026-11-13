/* Resident dashboard: local data, SVG charts, bookings, complaints, payments */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var TODAY = '2026-11-13';
  var months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  var paidByMonth = [3200, 3200, 3600, 3200, 3200, 0];
  var collection = [91, 93, 94, 92, 95, 88];
  var SLOTS = { Morning: ['8 AM – 12 PM', 1500], Afternoon: ['12 – 4 PM', 1500], Evening: ['4 – 8 PM', 3000], Night: ['8 – 11 PM', 3500] };

  var invoices = [
    { id: 'INV-3311', d: 'November 2026 maintenance', a: 3200, due: '15 Nov 2026', paid: false },
    { id: 'INV-3290', d: 'October 2026 maintenance', a: 3200, due: '15 Oct 2026', paid: true },
    { id: 'INV-3262', d: 'September 2026 maintenance', a: 3200, due: '15 Sep 2026', paid: true },
    { id: 'INV-3241', d: 'August 2026 maintenance + water charges', a: 3600, due: '15 Aug 2026', paid: true },
    { id: 'INV-3215', d: 'July 2026 maintenance', a: 3200, due: '15 Jul 2026', paid: true },
    { id: 'INV-3188', d: 'June 2026 maintenance', a: 3200, due: '15 Jun 2026', paid: true }
  ];
  var bookings = [
    { id: 'BK-2041', date: '2026-11-20', slot: 'Evening', purpose: 'Birthday party', guests: 40, status: 'Confirmed' },
    { id: 'BK-2057', date: '2026-12-05', slot: 'Morning', purpose: 'Workshop or class', guests: 25, status: 'Pending' },
    { id: 'BK-1988', date: '2026-09-14', slot: 'Evening', purpose: 'Family function', guests: 60, status: 'Completed' }
  ];
  var othersBooked = { '2026-11-22': ['Morning', 'Afternoon'], '2026-11-28': ['Evening', 'Night'], '2026-12-13': ['Morning', 'Afternoon', 'Evening', 'Night'] };
  var complaints = [
    { id: 'CMP-2310', sub: 'Garbage not collected from Tower B corridor', cat: 'Housekeeping', pri: 'Medium', on: '11 Nov 2026', st: 'Open' },
    { id: 'CMP-2308', sub: 'Water leakage in bathroom ceiling', cat: 'Plumbing', pri: 'High', on: '8 Nov 2026', st: 'In Progress' },
    { id: 'CMP-2291', sub: 'Lift 2 making unusual noise', cat: 'Lift', pri: 'High', on: '29 Oct 2026', st: 'Resolved' },
    { id: 'CMP-2276', sub: 'Parking area street light not working', cat: 'Electrical', pri: 'Low', on: '18 Oct 2026', st: 'Resolved' }
  ];
  var notices = [
    { id: 1, t: 'November Maintenance Due Date', cat: 'Maintenance', d: '10 Nov 2026', x: 'Maintenance of ₹3,200 is payable by 15 November to avoid a ₹200 late fee.', read: false },
    { id: 2, t: 'Water Tank Cleaning – Tower A & B', cat: 'Maintenance Work', d: '7 Nov 2026', x: 'Water supply will be paused on 18 November from 10 AM to 2 PM.', read: false },
    { id: 3, t: 'General Body Meeting', cat: 'Meeting', d: '5 Nov 2026', x: 'Annual budget and clubhouse upgrade proposal at 6 PM on 22 November in the Community Hall.', read: false },
    { id: 4, t: 'Fire Safety Drill', cat: 'Safety', d: '3 Nov 2026', x: 'Mandatory evacuation drill on 25 November at 11 AM. Follow volunteer instructions.', read: true },
    { id: 5, t: 'Diwali Celebration Thank You', cat: 'Event', d: '1 Nov 2026', x: 'Thank you to all volunteers and residents for a wonderful Diwali night.', read: true }
  ];

  function $(s) { return document.querySelector(s); }
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function title(e, text) { var t = document.createElementNS(NS, 'title'); t.textContent = text; e.appendChild(t); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2800); }
  function fmtDate(iso) { var p = iso.split('-'); return parseInt(p[2], 10) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(p[1], 10) - 1] + ' ' + p[0]; }

  /* ---- charts ---- */
  function axes(svg, W, H, max, pad, ticks) {
    for (var i = 0; i <= ticks; i++) {
      var y = pad.t + (H - pad.t - pad.b) * i / ticks;
      el('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y, 'class': 'grid-line' }, svg);
      var tx = el('text', { x: pad.l - 8, y: y + 4, 'text-anchor': 'end' }, svg); tx.textContent = Math.round(max - max * i / ticks);
    }
  }
  function mk(label) { return el('svg', { viewBox: '0 0 520 260', 'class': 'chart', role: 'img', 'aria-label': label, direction: 'ltr' }); }
  function barChart(host, labels, data, max, color, unit) {
    var W = 520, H = 260, pad = { l: 48, r: 16, t: 16, b: 30 }, svg = mk('Maintenance paid per month');
    axes(svg, W, H, max, pad, 4);
    var slot = (W - pad.l - pad.r) / labels.length, bw = slot * .55;
    labels.forEach(function (l, i) {
      var h = (H - pad.t - pad.b) * data[i] / max, x = pad.l + slot * i + (slot - bw) / 2;
      title(el('rect', { x: x, y: H - pad.b - h, width: bw, height: Math.max(h, 0), rx: 6, fill: color }, svg), l + ': ' + (data[i] ? unit + data[i].toLocaleString('en-IN') : 'Pending'));
      var t = el('text', { x: x + bw / 2, y: H - 8, 'text-anchor': 'middle' }, svg); t.textContent = l;
      var v = el('text', { x: x + bw / 2, y: H - pad.b - h - 6, 'text-anchor': 'middle' }, svg); v.textContent = data[i] ? data[i] : 'Due';
    });
    host.innerHTML = ''; host.appendChild(svg);
  }
  function lineChart(host, labels, data, color) {
    var W = 520, H = 260, pad = { l: 48, r: 16, t: 16, b: 30 }, svg = mk('Society collection rate'), min = 80, max = 100;
    for (var i = 0; i <= 4; i++) {
      var y = pad.t + (H - pad.t - pad.b) * i / 4; el('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y, 'class': 'grid-line' }, svg);
      var tx = el('text', { x: pad.l - 8, y: y + 4, 'text-anchor': 'end' }, svg); tx.textContent = Math.round(max - (max - min) * i / 4);
    }
    var step = (W - pad.l - pad.r) / (labels.length - 1 || 1), pts = [];
    labels.forEach(function (l, i) {
      var x = pad.l + step * i, y = pad.t + (H - pad.t - pad.b) * (1 - (data[i] - min) / (max - min)); pts.push([x, y]);
      var t = el('text', { x: x, y: H - 8, 'text-anchor': 'middle' }, svg); t.textContent = l;
    });
    el('path', { d: 'M' + pts[0][0] + ',' + (H - pad.b) + ' L' + pts.map(function (p) { return p.join(','); }).join(' L') + ' L' + pts[pts.length - 1][0] + ',' + (H - pad.b) + 'Z', fill: color, opacity: '.14' }, svg);
    el('polyline', { points: pts.map(function (p) { return p.join(','); }).join(' '), fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
    pts.forEach(function (p, i) { title(el('circle', { cx: p[0], cy: p[1], r: 5, fill: color, stroke: css('--card'), 'stroke-width': 2 }, svg), labels[i] + ': ' + data[i] + '%'); });
    host.innerHTML = ''; host.appendChild(svg);
  }
  function donut(host, parts) {
    var total = parts.reduce(function (s, p) { return s + p.v; }, 0) || 1, R = 70, C = 2 * Math.PI * R, off = 0;
    var svg = el('svg', { viewBox: '0 0 520 200', 'class': 'chart', role: 'img', 'aria-label': 'Complaints by status', direction: 'ltr' });
    var g = el('g', { transform: 'translate(260 100) rotate(-90)' }, svg);
    el('circle', { r: R, fill: 'none', stroke: css('--border'), 'stroke-width': 28 }, g);
    parts.forEach(function (p) {
      if (!p.v) return;
      var len = C * p.v / total; title(el('circle', { r: R, fill: 'none', stroke: p.c, 'stroke-width': 28, 'stroke-dasharray': len + ' ' + (C - len), 'stroke-dashoffset': -off }, g), p.l + ': ' + p.v); off += len;
    });
    var t = el('text', { x: 260, y: 108, 'text-anchor': 'middle', style: 'font:700 26px Outfit,sans-serif;fill:' + css('--text') }, svg); t.textContent = total;
    host.innerHTML = ''; host.appendChild(svg);
    var lg = document.createElement('div'); lg.className = 'legend';
    lg.innerHTML = parts.map(function (p) { return '<span><i style="background:' + p.c + '"></i>' + p.l + ' (' + p.v + ')</span>'; }).join('');
    host.appendChild(lg);
  }
  function drawCharts() {
    var n = parseInt($('#range').value, 10);
    barChart($('#c-bar'), months.slice(-n), paidByMonth.slice(-n), 4000, css('--brand'), '₹');
    lineChart($('#c-line'), months.slice(-n), collection.slice(-n), css('--accent'));
    var c = { Open: 0, 'In Progress': 0, Resolved: 0, Escalated: 0 }; complaints.forEach(function (x) { c[x.st]++; });
    donut($('#c-donut'), [{ l: 'Open', v: c.Open, c: css('--accent') }, { l: 'In Progress', v: c['In Progress'], c: css('--brand') }, { l: 'Escalated', v: c.Escalated, c: '#d93a3a' }, { l: 'Resolved', v: c.Resolved, c: '#8fa3ad' }]);
  }

  /* ---- renderers ---- */
  function kpis() {
    var pend = 0, paid = 0; invoices.forEach(function (i) { i.paid ? paid += i.a : pend += i.a; });
    $('#k-due').textContent = inr(pend); $('#m-pend').textContent = inr(pend); $('#m-paid').textContent = inr(paid);
    $('#k-book').textContent = bookings.filter(function (b) { return b.date >= TODAY && b.status !== 'Cancelled'; }).length;
    $('#k-comp').textContent = complaints.filter(function (c) { return c.st !== 'Resolved'; }).length;
    $('#k-notice').textContent = notices.filter(function (n) { return !n.read; }).length;
  }
  function renderInv() {
    $('#m-body').innerHTML = invoices.map(function (f, i) {
      return '<tr><td>' + f.id + '</td><td>' + f.d + '</td><td>' + inr(f.a) + '</td><td>' + f.due + '</td><td><span class="pill ' + (f.paid ? 'ok' : 'warn') + '">' + (f.paid ? 'Paid' : 'Pending') + '</span></td><td>' + (f.paid ? '<button class="btn btn-outline btn-sm" data-rcpt="' + i + '">Receipt</button>' : '<button class="btn btn-primary btn-sm" data-pay="' + i + '">Pay Now</button>') + '</td></tr>';
    }).join('');
  }
  function takenOn(date) {
    var t = (othersBooked[date] || []).slice();
    bookings.forEach(function (b) { if (b.date === date && b.status !== 'Cancelled' && t.indexOf(b.slot) < 0) t.push(b.slot); });
    return t;
  }
  function renderSlots() {
    var d = $('#b-date').value, taken = d ? takenOn(d) : [], keep = (document.querySelector('input[name=slot]:checked') || {}).value;
    $('#b-slots').innerHTML = Object.keys(SLOTS).map(function (s) {
      var tk = taken.indexOf(s) > -1;
      return '<label class="' + (tk ? 'taken' : '') + '"><input type="radio" name="slot" value="' + s + '"' + (tk ? ' disabled' : '') + (keep === s && !tk ? ' checked' : '') + '> ' + s + ' (' + SLOTS[s][0] + ')' + (tk ? ' – booked' : '') + '</label>';
    }).join('');
  }
  function renderBookings() {
    $('#b-body').innerHTML = bookings.map(function (b, i) {
      var cls = b.status === 'Confirmed' || b.status === 'Completed' ? 'ok' : (b.status === 'Cancelled' ? 'bad' : 'warn');
      var act = (b.status === 'Confirmed' || b.status === 'Pending') && b.date >= TODAY ? '<button class="btn btn-outline btn-sm" data-cancel="' + i + '">Cancel</button>' : '<span>—</span>';
      return '<tr><td>' + b.id + '</td><td>' + fmtDate(b.date) + '</td><td>' + b.slot + '</td><td>' + b.purpose + '</td><td>' + b.guests + '</td><td>' + inr(SLOTS[b.slot][1]) + '</td><td><span class="pill ' + cls + '">' + b.status + '</span></td><td>' + act + '</td></tr>';
    }).join('');
  }
  function renderComplaints() {
    var f = $('#c-filter').value, rows = complaints.filter(function (c) { return !f || c.st === f; });
    $('#c-body').innerHTML = rows.length ? rows.map(function (c) {
      var i = complaints.indexOf(c), cls = c.st === 'Resolved' ? 'ok' : (c.st === 'Escalated' ? 'bad' : 'warn');
      var act = c.st === 'Open' || c.st === 'In Progress' ? '<button class="btn btn-outline btn-sm" data-esc="' + i + '">Escalate</button>' : '<span>—</span>';
      return '<tr><td>' + c.id + '</td><td>' + c.sub + '</td><td>' + c.cat + '</td><td>' + c.pri + '</td><td>' + c.on + '</td><td><span class="pill ' + cls + '">' + c.st + '</span></td><td>' + act + '</td></tr>';
    }).join('') : '<tr><td colspan="7">No complaints with this status.</td></tr>';
  }
  function renderNotices() {
    var f = $('#n-filter').value, rows = notices.filter(function (n) { return !f || (f === 'Unread' ? !n.read : n.read); });
    $('#n-list').innerHTML = rows.length ? rows.map(function (n) {
      return '<div class="notice-row' + (n.read ? '' : ' unread') + '"><div><span class="pill ' + (n.read ? '' : 'warn') + '">' + n.cat + '</span><h4>' + n.t + '</h4><p>' + n.x + '</p><small style="color:var(--muted)">' + n.d + '</small></div>' + (n.read ? '<span class="pill ok">Read</span>' : '<button class="btn btn-outline btn-sm" data-read="' + n.id + '">Mark as read</button>') + '</div>';
    }).join('') : '<p style="margin:0">No notices to show.</p>';
  }
  function refresh() { kpis(); renderInv(); renderSlots(); renderBookings(); renderComplaints(); renderNotices(); drawCharts(); }

  /* ---- forms ---- */
  function setErr(id, msg) { var w = $('#' + id).closest('.field'); w.classList.toggle('invalid', !!msg); var e = w.querySelector('.err'); if (msg && e) e.textContent = msg; return !msg; }
  var seq = { bk: 2058, cmp: 2311 };

  document.addEventListener('DOMContentLoaded', function () {
    $('#b-date').min = TODAY;
    document.querySelectorAll('[data-panel]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.side-link').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        document.querySelectorAll('.dpanel').forEach(function (p) { p.classList.remove('active'); });
        $('#p-' + b.dataset.panel).classList.add('active');
        if (b.dataset.panel === 'overview') drawCharts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    document.querySelectorAll('[data-open-panel]').forEach(function (b) {
      b.addEventListener('click', function () { var t = document.querySelector('.side-link[data-panel="' + b.dataset.openPanel + '"]'); if (t) t.click(); });
    });
    $('#range').addEventListener('change', drawCharts);
    $('#b-date').addEventListener('change', function () { setErr('b-date', ''); renderSlots(); });
    $('#c-filter').addEventListener('change', renderComplaints);
    $('#n-filter').addEventListener('change', renderNotices);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(drawCharts, 30); }); });

    $('#book-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = $('#b-date').value, g = parseInt($('#b-guests').value, 10), p = $('#b-purpose').value, s = document.querySelector('input[name=slot]:checked');
      var ok = setErr('b-date', !d ? 'Please choose a date' : (d < TODAY ? 'Date cannot be in the past' : ''));
      ok = setErr('b-guests', !g || g < 1 || g > 120 ? 'Enter 1 to 120 guests' : '') && ok;
      ok = setErr('b-purpose', p ? '' : 'Please select a purpose') && ok;
      $('#b-slot-err').parentNode.classList.toggle('invalid', !s); ok = !!s && ok;
      if (!ok) return;
      bookings.unshift({ id: 'BK-' + (seq.bk++), date: d, slot: s.value, purpose: p, guests: g, status: 'Confirmed' });
      this.reset(); renderSlots(); renderBookings(); kpis(); toast('Clubhouse booked for ' + fmtDate(d) + ' (' + s.value + ')');
    });
    $('#comp-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var c = $('#c-cat').value, pr = $('#c-pri').value, s = $('#c-sub').value.trim(), d = $('#c-desc').value.trim();
      var ok = setErr('c-cat', c ? '' : 'Please select a category');
      ok = setErr('c-pri', pr ? '' : 'Please select a priority') && ok;
      ok = setErr('c-sub', s ? '' : 'Please enter a subject') && ok;
      ok = setErr('c-desc', d ? '' : 'Please describe the issue') && ok;
      if (!ok) return;
      var id = 'CMP-' + (seq.cmp++);
      complaints.unshift({ id: id, sub: s, cat: c, pri: pr, on: fmtDate(TODAY), st: 'Open' });
      this.reset(); renderComplaints(); kpis(); drawCharts(); toast('Complaint ' + id + ' submitted');
    });

    var payIdx = null;
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return; var d = t.dataset;
      if (d.pay) { payIdx = d.pay; $('#pay-desc').textContent = invoices[payIdx].d + ' • ' + inr(invoices[payIdx].a); $('#pay-modal').classList.add('show'); }
      else if (d.rcpt) toast('Receipt ' + invoices[d.rcpt].id + ' is ready to download');
      else if (d.cancel) { bookings[d.cancel].status = 'Cancelled'; renderBookings(); renderSlots(); kpis(); toast('Booking ' + bookings[d.cancel].id + ' cancelled'); }
      else if (d.esc) { complaints[d.esc].st = 'Escalated'; renderComplaints(); kpis(); drawCharts(); toast(complaints[d.esc].id + ' escalated to the committee'); }
      else if (d.read) { notices.forEach(function (n) { if (String(n.id) === d.read) n.read = true; }); renderNotices(); kpis(); }
    });
    $('#pay-cancel').addEventListener('click', function () { $('#pay-modal').classList.remove('show'); });
    $('#pay-modal').addEventListener('click', function (e) { if (e.target.id === 'pay-modal') e.target.classList.remove('show'); });
    $('#pay-confirm').addEventListener('click', function () {
      invoices[payIdx].paid = true; paidByMonth[paidByMonth.length - 1] = invoices[payIdx].a;
      $('#pay-modal').classList.remove('show'); renderInv(); kpis(); drawCharts(); toast('Payment of ' + inr(invoices[payIdx].a) + ' recorded');
    });
    refresh();
  });
})();


/* Label every table cell with its column heading so tables can stack as cards on small screens */
(function () {
  function label(table) {
    var heads = Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i] && td.getAttribute('data-label') !== heads[i]) td.setAttribute('data-label', heads[i]); });
    });
  }
  function run() {
    document.querySelectorAll('.dtable').forEach(function (t) {
      label(t);
      var body = t.querySelector('tbody');
      if (body) new MutationObserver(function () { label(t); }).observe(body, { childList: true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
