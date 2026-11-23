/* Anggaran — angka terpakai ikut disembunyikan, angka target yang kamu set tetap terlihat. */
(function () {
  UI.mount('bud');
  var app = document.getElementById('app');
  var P = DB.setting('bulanAktif', '2026-11');

  function terpakai(kategoriId) {
    return DB.transaksiBulan(P).filter(function (t) {
      if (!DB.isKeluar(t)) return false;
      var k = DB.kategori(t.kategoriId);
      var root = (k && k.induk) ? k.induk : t.kategoriId;
      return root === kategoriId || t.kategoriId === kategoriId;
    }).reduce(function (a, t) { return a + (Number(t.nominal) || 0); }, 0);
  }

  function render() {
    var r = Insight.ringkas(P);
    var pos = DB.anggaranBulan(P);
    var sisaTotal = r.totalAnggaran - r.keluar;
    var pakaiPct = r.totalAnggaran ? Math.min(100, r.keluar / r.totalAnggaran * 100) : 0;
    var idealPct = r.totalHari ? r.berjalan / r.totalHari * 100 : 0;
    var panjang = Math.PI * 130;

    var gauge = '<svg class="vv" viewBox="0 0 320 196" style="width:290px;height:auto;flex-shrink:0" role="img" aria-label="Meter anggaran: ' + UI.rp(sisaTotal) + ' masih bisa dibelanjakan">' +
      '<path d="M30 170 A130 130 0 0 1 290 170" fill="none" stroke="var(--hair)" stroke-width="22" stroke-linecap="round"/>' +
      '<path d="M30 170 A130 130 0 0 1 290 170" fill="none" stroke="' + (pakaiPct > 95 ? 'var(--org)' : 'var(--org-b)') + '" stroke-width="22" stroke-linecap="round" stroke-dasharray="' + (panjang * pakaiPct / 100).toFixed(1) + ' ' + (panjang * 1.1).toFixed(1) + '"/>' +
      '<text x="160" y="126" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="var(--muted)">Jumlah yang dapat dibelanjakan</text>' +
      '<text x="160" y="166" text-anchor="middle" font-family="Space Grotesk,Inter,sans-serif" font-size="38" font-weight="700" fill="' + (sisaTotal >= 0 ? 'var(--grn)' : 'var(--org)') + '">' + Math.abs(Math.round(sisaTotal)).toLocaleString('id-ID') + '</text></svg>';

    var rows = pos.length ? pos.map(function (a) {
      var pakai = terpakai(a.kategoriId), lim = Number(a.jumlah) || 0;
      var pct = lim ? Math.min(100, pakai / lim * 100) : 0;
      var lewat = pakai > lim;
      var warna = lewat ? 'var(--org)' : pct > 90 ? 'var(--org-b)' : pct > idealPct + 8 ? 'var(--org-b)' : 'var(--grn-b)';
      var ket = lewat
        ? '<span class="pill" style="background:var(--org);color:#fff;align-self:flex-start">Lewat ' + UI.v(UI.rp(pakai - lim)) + '</span>'
        : '<span style="font-size:12px;font-weight:600;color:' + (pct > 90 ? 'var(--org)' : 'var(--grn)') + '">Tersisa ' + UI.v(UI.rp(lim - pakai)) + (r.sisaHari ? ' · ' + UI.v(UI.rp((lim - pakai) / r.sisaHari) + '/hari') + ' selama ' + r.sisaHari + ' hari' : '') + '</span>';
      return '<div style="display:flex;flex-direction:column;gap:7px">' +
        '<span style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between">' +
          '<span style="display:flex;align-items:center;gap:11px">' + icon(DB.ikonKategori(a.kategoriId), 32) +
          '<span style="font-size:14px;font-weight:600">' + UI.esc(DB.namaKategori(a.kategoriId)) + '</span></span>' +
          '<span class="num" style="font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px">' + UI.v(UI.rp(pakai)) + ' <span style="color:#C9D1CB">/</span> ' +
          '<input type="text" inputmode="numeric" data-lim="' + a.id + '" value="' + lim.toLocaleString('id-ID') + '" aria-label="Anggaran ' + UI.esc(DB.namaKategori(a.kategoriId)) + '" style="width:110px;text-align:right;font:inherit;font-size:13px;font-weight:600;border:1px solid var(--line);border-radius:7px;padding:4px 8px;background:#fff">' +
          '<button type="button" class="btn danger" data-hapuspos="' + a.id + '" style="padding:4px 9px;font-size:11.5px">Hapus</button></span></span>' +
        '<span class="bar" style="height:11px;background:' + (lewat ? 'var(--org-t)' : 'var(--hair)') + '">' +
          '<i class="vv" style="width:' + pct.toFixed(1) + '%;background:' + warna + '"></i>' +
          '<span style="position:absolute;left:' + idealPct.toFixed(1) + '%;top:0;width:2px;height:100%;background:' + (lewat ? '#fff' : 'var(--ink)') + '"></span></span>' +
        ket + '</div>';
    }).join('') : '<div class="empty">' + icon('ic-wallet', 48) + 'Belum ada pos anggaran untuk ' + UI.namaBulan(P) + '.</div>';

    var belumAda = DB.state.Kategori.filter(function (k) {
      return k.tipe === 'pengeluaran' && !k.induk && !pos.some(function (a) { return a.kategoriId === k.id; });
    });

    var kartu = Insight.kartu(P).filter(function (c) { return c.topik === 'Pos anggaran' || c.topik === 'Laju belanja' || c.topik === 'Cakupan anggaran'; });

    app.innerHTML =
      '<section style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">' +
      '<h1 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:24px;font-weight:600;letter-spacing:-.02em">Anggaran ' + UI.namaBulan(P) + '</h1></section>' +

      '<section style="display:flex;flex-wrap:wrap;gap:16px">' +
        '<div style="flex:999 1 680px;min-width:0;display:flex;flex-direction:column;gap:16px">' +
          '<div class="card" style="padding:24px 26px;display:flex;flex-wrap:wrap;gap:30px;align-items:center">' + gauge +
            '<div style="flex:1 1 300px;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">' +
            '<span style="display:flex;flex-direction:column;gap:5px"><span class="num" style="font-size:21px;font-weight:700;letter-spacing:-.02em">' + UI.jt(r.totalAnggaran) + '</span><span style="font-size:11.5px;color:var(--muted)">Total anggaran</span></span>' +
            '<span style="display:flex;flex-direction:column;gap:5px">' + UI.v(UI.jt(r.keluar), 'num', 'font-size:21px;font-weight:700;letter-spacing:-.02em;color:var(--org)') + '<span style="font-size:11.5px;color:var(--muted)">Total pengeluaran</span></span>' +
            '<span style="display:flex;flex-direction:column;gap:5px"><span class="num" style="font-size:21px;font-weight:700;letter-spacing:-.02em">' + r.sisaHari + ' hari</span><span style="font-size:11.5px;color:var(--muted)">Menuju akhir bulan</span></span>' +
            '<span style="grid-column:1/-1;display:flex;align-items:center;gap:10px;background:' + (pakaiPct > idealPct + 5 ? 'var(--org-t)' : 'var(--grn-t)') + ';border-radius:10px;padding:11px 14px;font-size:12px">' +
            icon(pakaiPct > idealPct + 5 ? 'ic-bill' : 'ic-star', 24) +
            '<span>' + Math.round(pakaiPct) + '% anggaran terpakai di hari ke-' + r.berjalan + ' dari ' + r.totalHari + '. Sisa aman: ' + UI.v(UI.rp(r.sisaHari ? sisaTotal / r.sisaHari : 0) + '/hari') + '.</span></span></div></div>' +

          '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:18px">' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">' +
            '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Pos Anggaran</h2>' +
            '<span style="display:inline-flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted)"><span style="width:2px;height:13px;background:var(--ink)"></span>garis tipis = posisi ideal hari ini (' + Math.round(idealPct) + '%)</span></div>' +
            '<div style="display:flex;flex-direction:column;gap:17px">' + rows + '</div>' +
            (belumAda.length ? '<div style="border-top:1px solid var(--line);padding-top:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
              '<label class="sr" for="posBaru">Kategori baru untuk dianggarkan</label>' +
              '<select id="posBaru" class="fld" style="width:auto">' + belumAda.map(function (k) { return '<option value="' + k.id + '">' + UI.esc(k.nama) + '</option>'; }).join('') + '</select>' +
              '<label class="sr" for="posJumlah">Jumlah anggaran</label>' +
              '<input id="posJumlah" class="fld" type="text" inputmode="numeric" placeholder="Jumlah, mis. 500000" style="width:200px">' +
              '<button type="button" class="btn solid" id="posTambah">Tambah pos</button></div>' : '') +
          '</div></div>' +

        '<div style="flex:1 1 290px;min-width:0;display:flex;flex-direction:column;gap:16px">' +
          '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:14px">' +
          '<h2 style="font-size:15px;font-weight:700">Peringatan &amp; saran</h2>' +
          (kartu.length ? kartu.map(function (c) {
            var w = { grn: 'var(--grn-b)', org: 'var(--org-b)', blu: 'var(--blu-b)' }[c.warna];
            return '<div style="display:flex;gap:11px;align-items:flex-start;padding-bottom:13px;border-bottom:1px solid var(--hair)">' +
              '<span style="width:8px;height:8px;border-radius:50%;background:' + w + ';flex-shrink:0;margin-top:5px"></span>' +
              '<span style="font-size:12.5px;line-height:1.6"><strong>' + UI.esc(c.judul) + '</strong><span style="display:block;color:var(--muted);margin-top:3px">' + c.isi[0] + '</span></span></div>';
          }).join('') : '<p style="margin:0;font-size:12.5px;color:var(--muted)">Belum ada peringatan. Semua pos masih di jalurnya.</p>') +
          '</div></div>' +
      '</section>';

    app.querySelectorAll('[data-lim]').forEach(function (i) {
      i.addEventListener('change', function () {
        var a = DB.state.Anggaran.filter(function (x) { return x.id === i.getAttribute('data-lim'); })[0];
        if (!a) return;
        a.jumlah = Number(String(i.value).replace(/\D/g, '')) || 0;
        DB.save(); UI.toast('Anggaran diperbarui'); render();
      });
    });
    app.querySelectorAll('[data-hapuspos]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-hapuspos');
        if (!confirm('Hapus pos anggaran ini?')) return;
        DB.state.Anggaran = DB.state.Anggaran.filter(function (x) { return x.id !== id; });
        DB.save(); render();
      });
    });
    var tombol = document.getElementById('posTambah');
    if (tombol) tombol.addEventListener('click', function () {
      var kid = document.getElementById('posBaru').value;
      var jml = Number(String(document.getElementById('posJumlah').value).replace(/\D/g, '')) || 0;
      if (!jml) { UI.toast('Jumlah anggaran belum diisi'); return; }
      DB.state.Anggaran.push({ id: DB.uid('a'), periode: P, kategoriId: kid, jumlah: jml });
      DB.save(); UI.toast('Pos anggaran ditambahkan'); render();
    });
    UI.done();
  }

  render();
})();
