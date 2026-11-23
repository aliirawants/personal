/* Daftar transaksi */
(function () {
  UI.mount('trx');
  var app = document.getElementById('app');
  var P = DB.setting('bulanAktif', '2026-11');
  var filter = { q: '', kategori: '', sumber: '', tipe: '', periode: 'ini' };

  function periodeAktif() {
    if (filter.periode === 'ini') return [P];
    if (filter.periode === 'lalu') {
      var y = Number(P.slice(0, 4)), m = Number(P.slice(5, 7)) - 1;
      if (m <= 0) { m = 12; y--; }
      return [y + '-' + String(m).padStart(2, '0')];
    }
    if (filter.periode === 'tahun') {
      var out = []; for (var i = 1; i <= 12; i++) out.push(P.slice(0, 4) + '-' + String(i).padStart(2, '0')); return out;
    }
    return null; // masa depan
  }

  function dataTerpilih() {
    var per = periodeAktif();
    return DB.state.Transaksi.filter(function (t) {
      var b = String(t.tanggal || '').slice(0, 7);
      if (per === null) { if (b <= P) return false; } else if (per.indexOf(b) < 0) return false;
      if (filter.kategori) {
        var k = DB.kategori(t.kategoriId);
        var root = (k && k.induk) ? k.induk : t.kategoriId;
        if (root !== filter.kategori && t.kategoriId !== filter.kategori) return false;
      }
      if (filter.sumber && t.sumberDanaId !== filter.sumber) return false;
      if (filter.tipe && t.tipe !== filter.tipe) return false;
      if (filter.q) {
        var h = (DB.namaKategori(t.kategoriId) + ' ' + (t.catatan || '')).toLowerCase();
        if (h.indexOf(filter.q.toLowerCase()) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return String(b.tanggal).localeCompare(String(a.tanggal)); });
  }

  function render() {
    var tx = dataTerpilih();
    var masuk = 0, keluar = 0;
    tx.forEach(function (t) { var n = Number(t.nominal) || 0; if (t.tipe === 'pemasukan') masuk += n; else keluar += n; });

    var tabs = [['tahun', P.slice(0, 4)], ['lalu', 'Bulan Lalu'], ['ini', 'Bulan Ini'], ['depan', 'Masa Depan']]
      .map(function (t) {
        var on = filter.periode === t[0];
        return '<button type="button" data-per="' + t[0] + '" style="flex:1 1 140px;border:none;background:none;padding:15px 12px;font:inherit;font-size:13.5px;font-weight:' + (on ? 700 : 600) + ';color:' + (on ? 'var(--ink)' : 'var(--muted)') + ';cursor:pointer;border-bottom:3px solid ' + (on ? 'var(--grn)' : 'transparent') + '">' + t[1] + '</button>';
      }).join('');

    var kats = DB.state.Kategori.filter(function (k) { return !k.induk; })
      .map(function (k) { return '<option value="' + k.id + '"' + (filter.kategori === k.id ? ' selected' : '') + '>' + UI.esc(k.nama) + '</option>'; }).join('');
    var srcs = DB.state.SumberDana
      .map(function (s) { return '<option value="' + s.id + '"' + (filter.sumber === s.id ? ' selected' : '') + '>' + UI.esc(s.nama) + '</option>'; }).join('');

    var groups = {};
    tx.forEach(function (t) { (groups[t.tanggal] = groups[t.tanggal] || []).push(t); });
    var tanggalUrut = Object.keys(groups).sort(function (a, b) { return b.localeCompare(a); });

    var daftar = tanggalUrut.length ? tanggalUrut.map(function (tg) {
      var rows = groups[tg];
      var net = rows.reduce(function (a, t) { return a + (t.tipe === 'pemasukan' ? 1 : -1) * (Number(t.nominal) || 0); }, 0);
      return '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:18px 0 9px;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);margin-top:8px">' +
        '<span style="display:flex;align-items:baseline;gap:10px"><span style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:22px;font-weight:700">' + Number(tg.slice(8)) + '</span>' +
        '<span style="font-size:12.5px;color:var(--muted)">' + UI.hari(tg) + ' · ' + UI.tanggal(tg) + '</span></span>' +
        UI.v((net >= 0 ? '+ ' : '− ') + 'Rp ' + Math.abs(Math.round(net)).toLocaleString('id-ID'), 'num', 'font-size:13px;font-weight:700;color:' + (net >= 0 ? 'var(--grn)' : 'var(--org)')) + '</div>' +
        rows.map(function (t, i) {
          var s = DB.sumber(t.sumberDanaId);
          return '<div style="display:flex;align-items:center;gap:13px;padding:12px 0' + (i < rows.length - 1 ? ';border-bottom:1px solid var(--hair)' : '') + '">' +
            icon(DB.ikonKategori(t.kategoriId), 36) +
            '<span style="flex-grow:1;min-width:0"><span style="display:block;font-size:14px;font-weight:600">' + UI.esc(DB.namaKategori(t.kategoriId)) + '</span>' +
            '<span style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)">' + UI.esc(t.catatan || '—') +
            (t.asal === 'pdf' ? '<span class="pill b" style="font-size:10.5px;padding:2px 7px">Dari e-Statement</span>' : '') + '</span></span>' +
            (s ? '<span class="pill n" style="white-space:nowrap">' + UI.esc(s.nama) + '</span>' : '') +
            UI.v(UI.rpSigned(t.nominal, t.tipe), 'num', 'font-size:14px;font-weight:700;white-space:nowrap;min-width:118px;text-align:right;color:' + (t.tipe === 'pemasukan' ? 'var(--grn)' : 'var(--org)')) +
            '<button type="button" class="btn danger" data-hapus="' + t.id + '" style="padding:6px 10px;font-size:12px">Hapus</button></div>';
        }).join('');
    }).join('') : '<div class="empty">' + icon('ic-doc', 48) + '<span>Tidak ada transaksi di periode atau filter ini.</span><a class="btn solid" href="tambah.html" style="text-decoration:none">Tambah transaksi</a></div>';

    app.innerHTML =
      '<section class="card" style="padding:0;overflow:hidden">' +
        '<div style="display:flex;flex-wrap:wrap;border-bottom:1px solid var(--line)">' + tabs + '</div>' +
        '<div style="padding:20px 26px;display:flex;flex-wrap:wrap;gap:32px;align-items:center;justify-content:space-between">' +
          '<div style="display:flex;flex-wrap:wrap;gap:40px">' +
            '<span style="display:flex;flex-direction:column;gap:5px"><span class="lbl">Pemasukan</span>' + UI.v(UI.rp(masuk), 'num', 'font-size:22px;font-weight:700;color:var(--grn);letter-spacing:-.02em') + '</span>' +
            '<span style="display:flex;flex-direction:column;gap:5px"><span class="lbl">Pengeluaran</span>' + UI.v(UI.rp(keluar), 'num', 'font-size:22px;font-weight:700;color:var(--org);letter-spacing:-.02em') + '</span>' +
            '<span style="display:flex;flex-direction:column;gap:5px"><span class="lbl">Selisih</span>' + UI.v(UI.rp(masuk - keluar), 'num', 'font-size:22px;font-weight:700;color:var(--blu);letter-spacing:-.02em') + '</span>' +
          '</div>' +
          '<span style="font-size:12.5px;color:var(--muted)">' + tx.length + ' transaksi</span>' +
        '</div></section>' +

      '<section style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
        '<span style="flex:1 1 240px;min-width:0;position:relative;display:flex;align-items:center">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="position:absolute;left:13px"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>' +
        '<label class="sr" for="q">Cari transaksi</label><input id="q" class="fld" type="search" placeholder="Cari kategori atau catatan…" value="' + UI.esc(filter.q) + '" style="padding-left:38px"></span>' +
        '<label class="sr" for="fk">Kategori</label><select id="fk" class="fld" style="width:auto"><option value="">Semua kategori</option>' + kats + '</select>' +
        '<label class="sr" for="fd">Sumber dana</label><select id="fd" class="fld" style="width:auto"><option value="">Semua sumber dana</option>' + srcs + '</select>' +
        '<label class="sr" for="ft">Tipe</label><select id="ft" class="fld" style="width:auto"><option value="">Semua tipe</option>' +
          ['pengeluaran','pemasukan'].map(function (x) { return '<option value="' + x + '"' + (filter.tipe === x ? ' selected' : '') + '>' + x.charAt(0).toUpperCase() + x.slice(1) + '</option>'; }).join('') + '</select>' +
        '<button type="button" class="btn" id="csv">Ekspor CSV</button>' +
      '</section>' +

      '<section class="card" style="padding:6px 26px 20px;display:flex;flex-direction:column">' + daftar + '</section>';

    document.getElementById('q').addEventListener('input', function () { filter.q = this.value; render(); this.focus(); });
    document.getElementById('fk').addEventListener('change', function () { filter.kategori = this.value; render(); });
    document.getElementById('fd').addEventListener('change', function () { filter.sumber = this.value; render(); });
    document.getElementById('ft').addEventListener('change', function () { filter.tipe = this.value; render(); });
    app.querySelectorAll('[data-per]').forEach(function (b) {
      b.addEventListener('click', function () { filter.periode = b.getAttribute('data-per'); render(); });
    });
    document.getElementById('csv').addEventListener('click', function () {
      var rows = [['tanggal','tipe','kategori','nominal','sumberDana','catatan','asal']].concat(dataTerpilih().map(function (t) {
        var s = DB.sumber(t.sumberDanaId);
        return [t.tanggal, t.tipe, DB.namaKategori(t.kategoriId), t.nominal, s ? s.nama : '', t.catatan || '', t.asal || 'manual'];
      }));
      var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'transaksi-' + P + '.csv';
      a.click();
    });
    app.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hapus]');
      if (!b) return;
      if (!confirm('Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.')) return;
      DB.hapusTransaksi(b.getAttribute('data-hapus'));
      UI.toast('Transaksi dihapus');
      render();
    });
    UI.done();
  }

  render();
})();
