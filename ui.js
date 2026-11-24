/* Shell, format angka, dan tombol sembunyikan-angka (global, ikut scroll). */
(function () {
  var LSP = 'pf.privacy.v1';

  var NAV = [
    { href: 'index.html',      key: 'dash', icon: 'ic-chart',  label: 'Dashboard' },
    { href: 'transaksi.html',  key: 'trx',  icon: 'ic-swap',   label: 'Transaksi' },
    { href: 'tambah.html',     key: 'add',  icon: '',          label: 'Tambah', big: true },
    { href: 'anggaran.html',   key: 'bud',  icon: 'ic-wallet', label: 'Anggaran' },
    { href: 'pengaturan.html', key: 'set',  icon: 'ic-user',   label: 'Profil & Pengaturan' }
  ];

  var UI = {
    /* ---- format ---- */
    rp: function (n) {
      var v = Math.round(Number(n) || 0);
      var s = Math.abs(v).toLocaleString('id-ID');
      return (v < 0 ? '− Rp ' : 'Rp ') + s;
    },
    rpSigned: function (n, tipe) {
      var s = Math.abs(Math.round(Number(n) || 0)).toLocaleString('id-ID');
      if (tipe === 'transfer') return '⇄ Rp ' + s;
      return (['pemasukan', 'hutang', 'pelunasan'].indexOf(tipe) >= 0 ? '+ Rp ' : '− Rp ') + s;
    },
    warnaTipe: function (tipe) {
      if (tipe === 'pemasukan') return 'var(--grn)';
      if (['transfer', 'piutang', 'hutang', 'pelunasan', 'pembayaran'].indexOf(tipe) >= 0) return 'var(--blu)';
      return 'var(--org)';
    },
    labelTipe: function (tipe) {
      return { pengeluaran: 'Pengeluaran', pemasukan: 'Pemasukan', transfer: 'Pindah dana',
               piutang: 'Piutang', hutang: 'Hutang',
               pelunasan: 'Pelunasan patungan', pembayaran: 'Bayar hutang' }[tipe] || 'Pengeluaran';
    },
    JENIS: [
      ['pengeluaran', 'Pengeluaran'], ['pemasukan', 'Pemasukan'],
      ['transfer', 'Pindah ke dompet lain'], ['piutang', 'Piutang (ditalangi, ditagih balik)'],
      ['hutang', 'Hutang (dapat pinjaman)'],
      ['pelunasan', 'Pelunasan patungan (uang balik ke aku)'],
      ['pembayaran', 'Bayar hutang (aku mengembalikan)']
    ],
    JENIS_LUNAS: { pelunasan: 'piutang', pembayaran: 'hutang' },
    pct: function (n, d) { return (Number(n) || 0).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%'; },
    jt: function (n) { return (Math.round((Number(n) || 0) / 1e5) / 10).toFixed(2).replace('.', ',') + ' jt'; },
    tanggal: function (iso) {
      var b = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      var d = new Date(iso + 'T00:00:00');
      if (isNaN(d)) return iso;
      return d.getDate() + ' ' + b[d.getMonth()] + ' ' + d.getFullYear();
    },
    hari: function (iso) {
      var h = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      var d = new Date(iso + 'T00:00:00');
      return isNaN(d) ? '' : h[d.getDay()];
    },
    namaBulan: function (periode) {
      var b = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      var p = String(periode).split('-');
      return b[Number(p[1]) - 1] + ' ' + p[0];
    },
    esc: function (s) {
      return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    /* angka yang ikut disembunyikan */
    v: function (text, cls, style) {
      var t = UI.esc(text);
      return '<span class="v ' + (cls || '') + '" data-real="' + t + '"' + (style ? ' style="' + style + '"' : '') + '>' + t + '</span>';
    },

    /* ---- privacy ---- */
    privacy: { on: false, timer: null },
    scramble: function (s) { return String(s).replace(/[0-9]/g, function () { return String(Math.floor(Math.random() * 10)); }); },
    applyPrivacy: function () {
      var on = UI.privacy.on;
      var nodes = document.querySelectorAll('.v');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i], real = el.getAttribute('data-real') || el.textContent;
        if (on) { el.classList.add('mk'); el.textContent = UI.scramble(real); }
        else { el.classList.remove('mk'); el.textContent = real; }
      }
      var vis = document.querySelectorAll('.vv');
      for (var j = 0; j < vis.length; j++) vis[j].classList.toggle('mkv', on);
      var btns = document.querySelectorAll('[data-priv]');
      for (var k = 0; k < btns.length; k++) {
        btns[k].setAttribute('aria-pressed', on ? 'true' : 'false');
        btns[k].innerHTML = (on
          ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 6.1A9.9 9.9 0 0112 6c6.2 0 10 6 10 6a17 17 0 01-3.3 3.9M6.4 6.5A17 17 0 002 12s3.8 6.5 10 6.5a10 10 0 004.3-.9"></path></svg> Angka disembunyikan'
          : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"></path><circle cx="12" cy="12" r="2.8"></circle></svg> Sembunyikan angka');
      }
      clearInterval(UI.privacy.timer);
      if (on) {
        UI.privacy.timer = setInterval(function () {
          var ns = document.querySelectorAll('.v');
          for (var i = 0; i < ns.length; i++) ns[i].textContent = UI.scramble(ns[i].getAttribute('data-real') || '');
        }, 230);
      }
    },
    togglePrivacy: function () {
      UI.privacy.on = !UI.privacy.on;
      try { localStorage.setItem(LSP, UI.privacy.on ? '1' : '0'); } catch (e) {}
      UI.applyPrivacy();
    },
    initPrivacy: function () {
      var saved = null;
      try { saved = localStorage.getItem(LSP); } catch (e) {}
      if (saved === null) saved = (DB.setting('sembunyikanAngkaDefault', 'false') === 'true') ? '1' : '0';
      UI.privacy.on = saved === '1';
    },

    /* ---- shell ---- */
    shell: function (active) {
      var periode = DB.setting('bulanAktif', '2026-11');
      var nav = NAV.map(function (n) {
        var cur = n.key === active ? ' aria-current="page"' : '';
        var ico = n.big
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>'
          : window.icon(n.icon, 20);
        return '<a class="tab' + (n.big ? ' big' : '') + '" href="' + n.href + '"' + cur + '>' + ico + ' ' + n.label + '</a>';
      }).join('');
      return '' +
      '<div class="topwrap">' +
        '<div class="topbar">' +
          '<div class="brand">' +
            '<a class="back" href="../index.html"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6"></path><path d="M12 19l-7-7 7-7"></path></svg> Beranda</a>' +
            '<span style="display:flex;align-items:center;gap:9px">' + window.icon('ic-chart', 28) + '<span class="title">Personal Finance</span></span>' +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
            '<button type="button" class="priv" data-priv aria-pressed="false"></button>' +
            '<span class="btn" style="border-radius:999px;display:inline-flex;align-items:center;gap:8px;cursor:default"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>' + UI.namaBulan(periode) + '</span>' +
            '<span class="avatar">AI</span>' +
          '</div>' +
        '</div>' +
        '<nav class="nav" aria-label="Bagian Personal Finance">' + nav + '</nav>' +
      '</div>';
    },

    mount: function (active) {
      DB.load();
      UI.initPrivacy();
      var host = document.getElementById('shell');
      if (host) host.innerHTML = UI.shell(active);
      document.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-priv]') : null;
        if (b) UI.togglePrivacy();
      });
    },

    done: function () { UI.applyPrivacy(); },

    toast: function (msg) {
      var el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 3200);
    }
  };

  window.UI = UI;
})();
