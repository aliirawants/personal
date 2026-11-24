/* Dashboard */
(function () {
  UI.mount('dash');
  var P = DB.setting('bulanAktif', '2026-11');
  var r = Insight.ringkas(P);
  var app = document.getElementById('app');
  var LOGO = { livin: '../livin-mandiri.webp', gopay: '../gopay.webp' };

  /* ---------- total aset ---------- */
  function kartuSumber(s) {
    var saldo = DB.saldo(s.id);
    var kepala = s.logo && LOGO[s.logo]
      ? '<img src="' + LOGO[s.logo] + '" alt="' + UI.esc(s.nama) + '" style="height:17px;width:auto">'
      : '<span style="display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700">' + icon(s.ikon, 18) + UI.esc(s.nama) + '</span>';
    return '<div style="border:1px solid var(--line);border-radius:13px;padding:14px;display:flex;flex-direction:column;gap:8px">' +
      '<span style="display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:20px">' + kepala +
      '<button type="button" class="btn" data-sembunyi="' + s.id + '" aria-label="Sembunyikan ' + UI.esc(s.nama) + ' dari dashboard" style="border:none;padding:4px;background:none">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"></path><circle cx="12" cy="12" r="2.8"></circle></svg></button></span>' +
      UI.v(UI.rp(saldo), 'num', 'font-size:19px;font-weight:700;letter-spacing:-.01em') +
      '<span style="font-size:11px;color:var(--muted)">' + UI.esc(s.jenis) + '</span></div>';
  }

  var tampil = DB.sumberTampil(), sembunyi = DB.sumberTersembunyi();
  var htmlAset = '<section class="card" style="padding:24px 26px;display:flex;flex-wrap:wrap;gap:30px">' +
    '<div style="flex:1 1 290px;min-width:0;display:flex;flex-direction:column;gap:10px">' +
      '<span style="font-size:13px;font-weight:600;color:var(--muted)">Total Aset</span>' +
      UI.v(UI.rp(r.totalAset), 'num', "font-family:'Space Grotesk',Inter,sans-serif;font-size:42px;font-weight:700;letter-spacing:-.025em;line-height:1") +
      (sembunyi.length
        ? '<span class="pill n"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 6.1A9.9 9.9 0 0112 6c6.2 0 10 6 10 6a17 17 0 01-3.3 3.9M6.4 6.5A17 17 0 002 12s3.8 6.5 10 6.5a10 10 0 004.3-.9"></path></svg>' + sembunyi.length + ' sumber disembunyikan</span>'
        : '') +
      '<span style="font-size:12px;color:var(--muted);line-height:1.6">Sumber yang disembunyikan hilang sepenuhnya dari dashboard, total, dan ekspor. Atur di <a href="pengaturan.html">Profil &amp; Pengaturan</a>.</span>' +
      (DB.totalPiutang() || DB.totalHutang()
        ? '<div style="display:flex;flex-wrap:wrap;gap:10px;border-top:1px solid var(--hair);padding-top:12px;margin-top:2px">' +
          (DB.totalPiutang() ? '<span style="display:flex;align-items:center;gap:9px;font-size:12px">' + icon('ic-swap', 26) +
            '<span>Piutang belum kembali<span style="display:block;font-weight:700;color:var(--blu)">' + UI.v(UI.rp(DB.totalPiutang()), 'num') + '</span></span></span>' : '') +
          (DB.totalHutang() ? '<span style="display:flex;align-items:center;gap:9px;font-size:12px">' + icon('ic-bill', 26) +
            '<span>Hutang belum dibayar<span style="display:block;font-weight:700;color:var(--org)">' + UI.v(UI.rp(DB.totalHutang()), 'num') + '</span></span></span>' : '') +
          '</div>'
        : '') +
    '</div>' +
    '<div style="flex:2 1 580px;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px">' +
      tampil.map(kartuSumber).join('') +
      '<a href="pengaturan.html" style="border:1px dashed #C9D1CB;border-radius:13px;padding:14px;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--muted);font-size:13px;font-weight:600;text-decoration:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Tambah Sumber Dana</a>' +
    '</div></section>';

  /* ---------- stat ---------- */
  var target = Number(DB.setting('targetSavingsRate', 20)) || 20;
  function stat(ic, label, nilai, warna, kaki) {
    return '<div class="card" style="padding:18px 20px;display:flex;align-items:center;gap:14px">' + icon(ic, 40) +
      '<span style="display:flex;flex-direction:column;gap:4px;min-width:0;flex-grow:1">' +
      '<span style="font-size:12px;font-weight:600;color:var(--muted)">' + label + '</span>' +
      UI.v(nilai, 'num', 'font-size:24px;font-weight:700;letter-spacing:-.02em;color:' + warna) +
      (kaki || '') + '</span></div>';
  }
  var htmlStat = '<section class="grid4">' +
    stat('ic-salary', 'Pemasukan bulan ini', UI.rp(r.masuk), 'var(--grn)', '<span style="font-size:11.5px;color:var(--muted)">' + r.jumlahTx + ' transaksi tercatat</span>') +
    stat('ic-bag', 'Pengeluaran bulan ini', UI.rp(r.keluar), 'var(--org)', '<span style="font-size:11.5px;color:var(--muted)">Rata-rata ' + UI.rp(r.lajuHarian) + '/hari</span>') +
    stat('ic-swap', 'Arus kas bersih', UI.rp(r.bersih), 'var(--blu)', '<span style="font-size:11.5px;color:var(--muted)">Pemasukan − pengeluaran</span>') +
    stat('ic-star', 'Savings rate', r.masuk ? UI.pct(r.savingsRate) : '—', 'var(--grn)',
      '<span class="bar" style="height:6px"><i class="vv" style="width:' + Math.max(0, Math.min(100, r.savingsRate)) + '%;background:var(--grn-b)"></i></span>' +
      '<span style="font-size:11px;color:var(--muted)">Target pribadi ' + target + '%</span>') +
    '</section>';

  /* ---------- grafik ---------- */
  function grafik() {
    var seri = Insight.kumulatif(P), rata = Insight.kumulatifRata(P);
    var maks = Math.max(r.totalAnggaran || 0, Math.max.apply(null, seri.concat(rata).concat([1])));
    maks = Math.ceil(maks / 2e6) * 2e6 || 2e6;
    var hari = seri.length, X0 = 62, X1 = 900, Y0 = 220, Y1 = 40;
    function x(d) { return X0 + (d / Math.max(hari - 1, 1)) * (X1 - X0); }
    function y(v) { return Y0 - (v / maks) * (Y0 - Y1); }
    function path(arr, sampai) {
      return arr.slice(0, sampai === undefined ? arr.length : sampai)
        .map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    }
    var hingga = Math.min(r.berjalan, hari);
    var pNow = path(seri, hingga);
    var pAvg = rata.length ? path(rata) : '';
    var gridY = '', labY = '';
    for (var i = 0; i <= 4; i++) {
      var vy = Y0 - (i / 4) * (Y0 - Y1), val = maks * i / 4;
      gridY += '<line x1="' + X0 + '" y1="' + vy + '" x2="' + X1 + '" y2="' + vy + '" />';
      labY += '<text x="' + (X0 - 10) + '" y="' + (vy + 4) + '">' + (val ? (val / 1e6).toFixed(0) + ' jt' : '0') + '</text>';
    }
    var gridX = '', labX = '';
    [1, 5, 10, 15, 20, 25, hari].forEach(function (d) {
      var vx = x(d - 1);
      gridX += '<line x1="' + vx.toFixed(1) + '" y1="' + Y1 + '" x2="' + vx.toFixed(1) + '" y2="' + Y0 + '" />';
      labX += '<text x="' + vx.toFixed(1) + '" y="241">' + String(d).padStart(2, '0') + '/' + P.slice(5) + '</text>';
    });
    var titik = hingga ? '<circle cx="' + x(hingga - 1).toFixed(1) + '" cy="' + y(seri[hingga - 1]).toFixed(1) + '" r="6.5" fill="#fff" stroke="var(--org-b)" stroke-width="3.4"/>' : '';
    var proy = (hingga && hingga < hari)
      ? '<path d="M' + x(hingga - 1).toFixed(1) + ' ' + y(seri[hingga - 1]).toFixed(1) + ' L' + x(hari - 1).toFixed(1) + ' ' + y(r.proyeksi).toFixed(1) + '" fill="none" stroke="var(--blu-b)" stroke-width="2.5" stroke-dasharray="7 6" stroke-linecap="round"/>' : '';
    var anggaranLine = r.totalAnggaran
      ? '<line x1="' + X0 + '" y1="' + y(r.totalAnggaran).toFixed(1) + '" x2="' + X1 + '" y2="' + y(r.totalAnggaran).toFixed(1) + '" stroke="#C2410C" stroke-width="1.6" stroke-dasharray="6 5"/><text x="' + (X1 - 4) + '" y="' + (y(r.totalAnggaran) - 7).toFixed(1) + '" text-anchor="end" font-size="11" font-weight="600" fill="#C2410C">Anggaran ' + UI.rp(r.totalAnggaran) + '</text>' : '';

    return '<section class="card" style="padding:22px 26px;display:flex;flex-direction:column;gap:16px">' +
      '<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;justify-content:space-between">' +
        '<div><h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Pengeluaran kumulatif — ' + UI.namaBulan(P) + '</h2>' +
        '<p style="margin:4px 0 0;font-size:12.5px;color:var(--muted)">Dibanding rata-rata 3 bulan sebelumnya, plus proyeksi akhir bulan.</p></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;font-size:12px;font-weight:600">' +
        '<span style="display:inline-flex;align-items:center;gap:7px;color:var(--org)"><span style="width:9px;height:9px;border-radius:50%;background:var(--org-b)"></span>Bulan ini</span>' +
        '<span style="display:inline-flex;align-items:center;gap:7px;color:var(--muted)"><span style="width:9px;height:9px;border-radius:50%;background:#A8B2AA"></span>Rata-rata 3 bulan</span>' +
        '<span style="display:inline-flex;align-items:center;gap:7px;color:var(--blu)"><span style="width:16px;border-top:3px dashed var(--blu-b)"></span>Proyeksi</span></div></div>' +
      '<svg class="vv" viewBox="0 0 920 256" style="width:100%;height:auto" role="img" aria-label="Grafik pengeluaran kumulatif ' + UI.namaBulan(P) + '">' +
        '<g stroke="var(--hair)" stroke-width="1">' + gridY + gridX + '</g>' +
        '<g fill="var(--muted)" font-size="11" font-family="Inter,sans-serif" text-anchor="end">' + labY + '</g>' +
        (pAvg ? '<path d="' + pAvg + '" fill="none" stroke="#A8B2AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
        (pNow ? '<path d="' + pNow + ' L' + x(hingga - 1).toFixed(1) + ' ' + Y0 + ' L' + X0 + ' ' + Y0 + ' Z" fill="var(--org-b)" opacity=".14"/><path d="' + pNow + '" fill="none" stroke="var(--org-b)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
        proy + anggaranLine + titik +
        '<g fill="var(--muted)" font-size="11" font-family="Inter,sans-serif" text-anchor="middle">' + labX + '</g>' +
      '</svg></section>';
  }

  /* ---------- kategori & pemasukan ---------- */
  function blokKategori() {
    var list = Insight.perKategori(P);
    if (!list.length) return '<div class="card"><div class="empty">' + icon('ic-bag', 44) + 'Belum ada pengeluaran bulan ini.</div></div>';
    var total = list.reduce(function (a, b) { return a + b.jumlah; }, 0);
    var warna = ['var(--blu)', 'var(--grn)', 'var(--org-b)', 'var(--blu-b)', 'var(--tel)', 'var(--org)'];
    return '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:16px">' +
      '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Pengeluaran Teratas</h2>' +
      '<div style="display:flex;flex-direction:column;gap:13px">' + list.slice(0, 6).map(function (k, i) {
        var pct = total ? k.jumlah / total * 100 : 0;
        return '<div style="display:flex;align-items:center;gap:12px">' + icon(DB.ikonKategori(k.id), 34) +
          '<span style="flex-grow:1;min-width:0;display:flex;flex-direction:column;gap:5px">' +
          '<span style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span style="font-weight:600">' + UI.esc(k.nama) + '</span>' +
          '<span class="num" style="color:var(--muted)">' + UI.v(UI.pct(pct, 0)) + ' · ' + UI.v(UI.rp(k.jumlah)) + '</span></span>' +
          '<span class="bar"><i class="vv" style="width:' + pct.toFixed(1) + '%;background:' + warna[i % warna.length] + '"></i></span></span></div>';
      }).join('') + '</div>' +
      '<a href="transaksi.html" style="font-size:13px;font-weight:600;text-decoration:none">Lihat detail per kategori →</a></div>';
  }

  function blokPemasukan() {
    var map = {};
    DB.transaksiBulan(P).forEach(function (t) {
      if (!DB.isMasuk(t)) return;
      map[t.kategoriId] = (map[t.kategoriId] || 0) + (Number(t.nominal) || 0);
    });
    var list = Object.keys(map).map(function (id) { return { id: id, jumlah: map[id] }; }).sort(function (a, b) { return b.jumlah - a.jumlah; });
    var isi = list.length
      ? list.map(function (k) {
          return '<div style="display:flex;align-items:center;gap:11px">' + icon(DB.ikonKategori(k.id), 30) +
            '<span style="flex-grow:1;min-width:0;font-size:13px;font-weight:600">' + UI.esc(DB.namaKategori(k.id)) + '</span>' +
            UI.v(UI.rp(k.jumlah), 'num', 'font-size:13px;font-weight:600;white-space:nowrap') + '</div>';
        }).join('')
      : '<div class="empty" style="padding:20px 0">' + icon('ic-salary', 40) + 'Belum ada pemasukan tercatat bulan ini.</div>';
    return '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:16px">' +
      '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Sumber Pemasukan</h2>' +
      '<div style="display:flex;flex-direction:column;gap:13px">' + isi + '</div></div>';
  }

  /* ---------- insight ---------- */
  function blokInsight() {
    var sk = Insight.skor(P), kartu = Insight.kartu(P);
    var buka = localStorage.getItem('pf.insight') !== '0';
    var warnaSkor = sk.total >= 65 ? 'var(--grn)' : sk.total >= 45 ? 'var(--org)' : 'var(--org)';
    var keliling = 2 * Math.PI * 44;
    var pilar = sk.pilar.map(function (p) {
      return '<div style="display:flex;flex-direction:column;gap:7px"><span style="font-size:11px;color:var(--muted);font-weight:600">' + p.nama + '</span>' +
        '<span class="bar" style="height:6px;background:var(--line)"><i class="vv" style="width:' + Math.round(p.nilai) + '%;background:' + (p.baik ? 'var(--grn-b)' : 'var(--org-b)') + '"></i></span>' +
        '<span style="font-size:11px;font-weight:600;color:' + (p.baik ? 'var(--grn)' : 'var(--org)') + '">' + UI.v(p.teks) + '</span></div>';
    }).join('');

    var kartuHtml = kartu.map(function (c) {
      var garis = { grn: 'var(--grn-b)', org: 'var(--org-b)', blu: 'var(--blu-b)' }[c.warna];
      var pillCls = { grn: 'g', org: 'o', blu: 'b' }[c.warna];
      var lbl = { tinggi: 'Prioritas tinggi', sedang: 'Prioritas sedang', baik: 'Kabar baik', info: 'Informasi' }[c.level];
      return '<article style="border:1px solid var(--line);border-left:4px solid ' + garis + ';border-radius:13px;padding:17px 19px;display:flex;flex-direction:column;gap:9px">' +
        '<span style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span class="pill ' + pillCls + '">' + lbl + '</span><span style="font-size:11px;color:var(--muted)">' + c.topik + '</span></span>' +
        '<h3 style="font-size:15px;font-weight:700;letter-spacing:-.01em">' + UI.esc(c.judul) + '</h3>' +
        c.isi.map(function (p) { return '<p style="margin:0;font-size:13px;line-height:1.6;color:var(--muted)">' + p + '</p>'; }).join('') +
        (c.aksi ? '<a href="' + c.aksi.href + '" style="font-size:13px;font-weight:600;text-decoration:none;margin-top:2px">' + c.aksi.label + '</a>' : '') +
        '</article>';
    }).join('');

    var pantau = ['Savings rate vs target','Laju belanja harian','Proyeksi akhir bulan','Deviasi kategori vs rata-rata 3 bulan','Rasio dana darurat','Kepatuhan tiap pos anggaran','Kaidah 50/30/20','Cakupan pos anggaran','Konsistensi investasi']
      .map(function (s) { return '<span style="font-size:12px;background:var(--bg);border:1px solid var(--line);padding:6px 11px;border-radius:999px">' + s + '</span>'; }).join('');

    return '<section class="card" style="padding:0;overflow:hidden">' +
      '<button type="button" id="tglInsight" aria-expanded="' + buka + '" style="width:100%;background:none;border:none;padding:22px 26px;font:inherit;cursor:pointer;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;text-align:left">' +
        '<span style="display:flex;align-items:center;gap:14px">' + icon('ic-star', 40) +
        '<span style="display:flex;flex-direction:column;gap:3px"><span style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:19px;font-weight:600;letter-spacing:-.015em">Insight &amp; Rekomendasi Otomatis</span>' +
        '<span style="font-size:12.5px;color:var(--muted)">' + kartu.length + ' temuan · dihitung ulang tiap ada transaksi baru</span></span></span>' +
        '<span style="display:flex;align-items:center;gap:12px"><span style="font-size:12.5px;font-weight:600;color:var(--muted)">' + (buka ? 'Tutup' : 'Buka') + '</span>' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (buka ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6') + '"></path></svg></span></button>' +
      '<div id="isiInsight" style="display:' + (buka ? 'flex' : 'none') + ';flex-direction:column;gap:20px;padding:0 26px 24px">' +
        '<div style="display:flex;flex-wrap:wrap;gap:26px;align-items:center;background:var(--bg);border-radius:14px;padding:20px 22px">' +
          '<div style="display:flex;align-items:center;gap:16px">' +
          '<svg class="vv" viewBox="0 0 110 110" style="width:100px;height:100px" role="img" aria-label="Skor kesehatan finansial ' + sk.total + ' dari 100">' +
            '<circle cx="55" cy="55" r="44" fill="none" stroke="var(--line)" stroke-width="11"/>' +
            '<circle cx="55" cy="55" r="44" fill="none" stroke="' + warnaSkor + '" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + (keliling * sk.total / 100).toFixed(1) + ' ' + keliling.toFixed(1) + '" transform="rotate(-90 55 55)"/>' +
            '<text x="55" y="56" text-anchor="middle" font-family="Space Grotesk,Inter,sans-serif" font-size="27" font-weight="700" fill="var(--ink)">' + sk.total + '</text>' +
            '<text x="55" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="var(--muted)">dari 100</text></svg>' +
          '<div style="display:flex;flex-direction:column;gap:5px"><span style="font-size:12px;font-weight:600;color:var(--muted)">Skor Kesehatan Finansial</span>' +
          '<span style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:22px;font-weight:600;color:' + warnaSkor + '">' + sk.label + '</span></div></div>' +
          '<div style="flex:1 1 440px;min-width:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px">' + pilar + '</div>' +
        '</div>' +
        '<div class="grid2">' + kartuHtml + '</div>' +
        '<div style="border-top:1px solid var(--line);padding-top:16px;display:flex;flex-direction:column;gap:10px">' +
        '<span style="font-size:12px;font-weight:600;color:var(--muted)">Yang dipantau mesin rekomendasi</span>' +
        '<div style="display:flex;flex-wrap:wrap;gap:7px">' + pantau + '</div></div>' +
      '</div></section>';
  }

  /* ---------- transaksi terkini ---------- */
  function blokTerkini() {
    var tx = DB.state.Transaksi.slice().sort(function (a, b) { return String(b.tanggal).localeCompare(String(a.tanggal)); }).slice(0, 5);
    if (!tx.length) {
      return '<section class="card"><div class="empty">' + icon('ic-doc', 48) +
        '<span>Belum ada transaksi. Catat manual atau import e-statement PDF.</span>' +
        '<a class="btn solid" href="tambah.html" style="text-decoration:none">Tambah transaksi</a></div></section>';
    }
    return '<section class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:14px">' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">' +
      '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Transaksi Terkini</h2>' +
      '<a href="transaksi.html" style="font-size:13px;font-weight:600;text-decoration:none">Lihat semua →</a></div>' +
      '<div>' + tx.map(function (t, i) {
        var s = DB.sumber(t.sumberDanaId);
        return '<div style="display:flex;align-items:center;gap:13px;padding:12px 0' + (i < tx.length - 1 ? ';border-bottom:1px solid var(--hair)' : '') + '">' +
          icon(DB.ikonKategori(t.kategoriId), 36) +
          '<span style="flex-grow:1;min-width:0"><span style="display:block;font-size:14px;font-weight:600">' + UI.esc(DB.namaKategori(t.kategoriId)) + '</span>' +
          '<span style="display:block;font-size:12px;color:var(--muted)">' + UI.esc(t.catatan || '—') + ' · ' + UI.tanggal(t.tanggal) + (s ? ' · ' + UI.esc(s.nama) : '') +
          (DB.isNetral(t) ? ' · ' + UI.labelTipe(t.tipe) : '') + '</span></span>' +
          UI.v(UI.rpSigned(t.nominal, t.tipe), 'num', 'font-size:14px;font-weight:700;white-space:nowrap;color:' + UI.warnaTipe(t.tipe)) + '</div>';
      }).join('') + '</div></section>';
  }

  app.innerHTML = htmlAset + htmlStat + grafik() +
    '<section class="grid2">' + blokKategori() + blokPemasukan() + '</section>' +
    blokInsight() + blokTerkini();

  document.getElementById('tglInsight').addEventListener('click', function () {
    var el = document.getElementById('isiInsight');
    var buka = el.style.display === 'none';
    el.style.display = buka ? 'flex' : 'none';
    localStorage.setItem('pf.insight', buka ? '1' : '0');
    this.setAttribute('aria-expanded', buka);
    this.querySelector('span:last-child span').textContent = buka ? 'Tutup' : 'Buka';
    this.querySelector('svg path').setAttribute('d', buka ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6');
  });

  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sembunyi]');
    if (!b) return;
    var s = DB.sumber(b.getAttribute('data-sembunyi'));
    if (!s) return;
    s.tampilDiTotal = false;
    DB.save();
    UI.toast(s.nama + ' disembunyikan dari dashboard');
    location.reload();
  });

  UI.done();
})();
