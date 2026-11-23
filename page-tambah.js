/* Tambah transaksi: catat manual + import e-statement PDF */
(function () {
  UI.mount('add');
  var app = document.getElementById('app');
  var tab = 'manual';
  var form = { tipe: 'pengeluaran', nominal: 0, kategoriId: 'k-makan', sumberDanaId: 's-tunai', tujuanDanaId: '', catatan: '', tanggal: new Date().toISOString().slice(0, 10) };
  var impor = { file: null, sumberDanaId: 's-mandiri', baris: [], info: null, perluPassword: false, pesan: '', memuat: false };

  function render() {
    app.innerHTML =
      '<section style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">' +
      '<h1 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:24px;font-weight:600;letter-spacing:-.02em">Tambah Transaksi</h1>' +
      '<span style="display:inline-flex;padding:3px;background:var(--hair);border-radius:10px">' +
        ['manual|Catat Manual', 'pdf|Import e-Statement (PDF)'].map(function (t) {
          var p = t.split('|'), on = tab === p[0];
          return '<button type="button" data-tab="' + p[0] + '" style="border:none;background:' + (on ? '#fff' : 'none') + ';padding:9px 18px;border-radius:8px;font:inherit;font-size:13px;font-weight:' + (on ? 700 : 600) + ';color:' + (on ? 'var(--ink)' : 'var(--muted)') + ';cursor:pointer' + (on ? ';box-shadow:0 1px 2px rgba(16,35,26,.1)' : '') + '">' + p[1] + '</button>';
        }).join('') + '</span></section>' +
      (tab === 'manual' ? blokManual() : blokImport());

    app.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.getAttribute('data-tab'); render(); });
    });
    (tab === 'manual' ? pasangManual : pasangImport)();
    UI.done();
  }

  /* ---------------- manual ---------------- */
  function blokManual() {
    var kats = DB.state.Kategori.filter(function (k) { return k.tipe === grupKategori(form.tipe); });
    if (form.tipe !== 'transfer' && kats.length && !kats.some(function (k) { return k.id === form.kategoriId; })) form.kategoriId = kats[0].id;

    var baris = function (ic, isi) {
      return '<div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--hair)">' + icon(ic, 30) + isi + '</div>';
    };

    return '<section class="card" style="padding:26px;display:flex;justify-content:center">' +
      '<div style="flex:1 1 540px;max-width:560px;min-width:0;display:flex;flex-direction:column;gap:18px">' +
        '<span style="display:flex;flex-wrap:wrap;gap:4px;padding:4px;background:var(--hair);border-radius:11px">' +
        ['pengeluaran|Pengeluaran|var(--org)', 'pemasukan|Pemasukan|var(--grn)', 'transfer|Pindah dana|var(--blu)',
         'piutang|Piutang|var(--blu)', 'hutang|Hutang|var(--blu)'].map(function (t) {
          var p = t.split('|'), on = form.tipe === p[0];
          return '<button type="button" data-tipe="' + p[0] + '" style="flex:1 1 90px;border:none;background:' + (on ? '#fff' : 'none') + ';padding:11px 4px;border-radius:8px;font:inherit;font-size:12.5px;font-weight:' + (on ? 700 : 600) + ';color:' + (on ? p[2] : 'var(--muted)') + ';cursor:pointer' + (on ? ';box-shadow:0 1px 3px rgba(16,35,26,.12)' : '') + '">' + p[1] + '</button>';
        }).join('') + '</span>' +

        '<div style="border:1px solid var(--line);border-radius:14px;overflow:hidden">' +
          baris('ic-wallet', '<label class="sr" for="fSumber">Sumber dana</label><select id="fSumber" class="fld" style="border:none;padding:0;font-size:15px;font-weight:600;background:none;cursor:pointer">' +
            DB.state.SumberDana.map(function (s) { return '<option value="' + s.id + '"' + (form.sumberDanaId === s.id ? ' selected' : '') + '>' + UI.esc(s.nama) + '</option>'; }).join('') + '</select>') +
          '<div style="display:flex;align-items:center;gap:14px;padding:16px 18px;border-bottom:1px solid var(--hair)">' +
            '<span style="font-size:11px;font-weight:700;color:var(--muted);background:var(--hair);padding:6px 9px;border-radius:7px;letter-spacing:.03em">IDR</span>' +
            '<label class="sr" for="fNominal">Nominal</label>' +
            '<input id="fNominal" class="num" type="text" inputmode="numeric" value="' + (form.nominal ? Number(form.nominal).toLocaleString('id-ID') : '0') + '" style="flex-grow:1;min-width:0;border:none;outline:none;font:inherit;font-size:34px;font-weight:700;letter-spacing:-.025em;background:none;padding:0;color:' + (form.tipe === 'pemasukan' ? 'var(--grn)' : 'var(--org)') + '"></div>' +
          '<div id="rowKategori" style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--hair)"></div>' +
          '<div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--hair)">' + icon('ic-note', 30) +
            '<label class="sr" for="fCatatan">Catatan</label><input id="fCatatan" type="text" placeholder="Tulis catatan" value="' + UI.esc(form.catatan) + '" style="flex-grow:1;min-width:0;border:none;outline:none;font:inherit;font-size:15px;background:none;padding:0;color:var(--ink)"></div>' +
          '<div style="display:flex;align-items:center;gap:14px;padding:14px 18px">' + icon('ic-cal', 30) +
            '<label class="sr" for="fTanggal">Tanggal</label><input id="fTanggal" type="date" value="' + form.tanggal + '" style="flex-grow:1;min-width:0;border:none;outline:none;font:inherit;font-size:15px;font-weight:600;background:none;padding:0;color:var(--ink)"></div>' +
        '</div>' +

        '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' +
        '<span style="font-size:11.5px;color:var(--muted);width:100%;text-align:center">Nominal cepat</span>' +
        [15000, 25000, 50000, 100000, 250000].map(function (v) {
          return '<button type="button" class="btn" data-cepat="' + v + '" style="border-radius:999px">' + v.toLocaleString('id-ID') + '</button>';
        }).join('') + '</div>' +
        '<button type="button" class="btn solid" id="fSimpan" style="padding:15px;font-size:15px;border-radius:12px">Simpan</button>' +
      '</div></section>';
  }

  function pasangManual() {
    /* baris kategori disisipkan terpisah supaya select-nya rapi */
    var kats = DB.state.Kategori.filter(function (k) { return form.tipe === 'pemasukan' ? k.tipe === 'pemasukan' : k.tipe === 'pengeluaran'; });
    var slot = document.getElementById('rowKategori');
    if (slot && form.tipe === 'transfer') {
      var tj = DB.sumber(form.tujuanDanaId);
      slot.innerHTML = icon(tj ? tj.ikon : 'ic-wallet', 30) +
        '<label class="sr" for="fTujuan">Dompet tujuan</label><select id="fTujuan" class="fld" style="border:none;padding:0;font-size:15px;font-weight:600;background:none;cursor:pointer">' +
        '<option value="">Pilih dompet tujuan…</option>' +
        DB.state.SumberDana.filter(function (s) { return s.id !== form.sumberDanaId; })
          .map(function (s) { return '<option value="' + s.id + '"' + (form.tujuanDanaId === s.id ? ' selected' : '') + '>' + UI.esc(s.nama) + '</option>'; }).join('') + '</select>';
    } else if (slot) {
      slot.innerHTML = icon(DB.ikonKategori(form.kategoriId), 30) +
        '<label class="sr" for="fKategori">Kategori</label><select id="fKategori" class="fld" style="border:none;padding:0;font-size:15px;font-weight:600;background:none;cursor:pointer">' +
        kats.map(function (k) { return '<option value="' + k.id + '"' + (form.kategoriId === k.id ? ' selected' : '') + '>' + UI.esc(DB.namaKategori(k.id)) + '</option>'; }).join('') + '</select>';
    }
    app.querySelectorAll('[data-tipe]').forEach(function (b) {
      b.addEventListener('click', function () { form.tipe = b.getAttribute('data-tipe'); render(); });
    });
    app.querySelectorAll('[data-cepat]').forEach(function (b) {
      b.addEventListener('click', function () { form.nominal = Number(b.getAttribute('data-cepat')); render(); });
    });
    var nom = document.getElementById('fNominal');
    if (nom) nom.addEventListener('input', function () {
      var v = Number(String(this.value).replace(/\D/g, '')) || 0;
      form.nominal = v;
      this.value = v.toLocaleString('id-ID');
    });
    ['fSumber', 'fKategori', 'fTujuan', 'fCatatan', 'fTanggal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        if (id === 'fSumber') { form.sumberDanaId = el.value; if (form.tujuanDanaId === el.value) form.tujuanDanaId = ''; render(); }
        if (id === 'fKategori') { form.kategoriId = el.value; render(); }
        if (id === 'fTujuan') { form.tujuanDanaId = el.value; render(); }
        if (id === 'fCatatan') form.catatan = el.value;
        if (id === 'fTanggal') form.tanggal = el.value;
      });
    });
    var simpan = document.getElementById('fSimpan');
    if (simpan) simpan.addEventListener('click', function () {
      if (!form.nominal) { UI.toast('Nominal belum diisi'); return; }
      if (form.tipe === 'transfer' && !form.tujuanDanaId) { UI.toast('Dompet tujuan belum dipilih'); return; }
      DB.tambahTransaksi({
        tanggal: form.tanggal, tipe: form.tipe,
        kategoriId: form.tipe === 'transfer' ? '' : form.kategoriId,
        tujuanDanaId: form.tipe === 'transfer' ? form.tujuanDanaId : '',
        nominal: form.nominal,
        sumberDanaId: form.sumberDanaId, catatan: form.catatan, asal: 'manual'
      });
      UI.toast('Tersimpan');
      form.nominal = 0; form.catatan = '';
      render();
    });
  }

  /* ---------------- import pdf ---------------- */

  function grupKategori(tipe) {
    if (tipe === 'pemasukan') return 'pemasukan';
    if (tipe === 'piutang' || tipe === 'hutang') return 'hutang';
    return 'pengeluaran';
  }
  function opsiKategori(tipe, terpilih) {
    return DB.state.Kategori.filter(function (k) { return k.tipe === grupKategori(tipe); })
      .map(function (k) { return '<option value="' + k.id + '"' + (terpilih === k.id ? ' selected' : '') + '>' + UI.esc(DB.namaKategori(k.id)) + '</option>'; }).join('');
  }
  function opsiDompet(kecuali, terpilih) {
    return DB.state.SumberDana.filter(function (s) { return s.id !== kecuali; })
      .map(function (s) { return '<option value="' + s.id + '"' + (terpilih === s.id ? ' selected' : '') + '>' + UI.esc(s.nama) + '</option>'; }).join('');
  }
  function opsiJenis(terpilih) {
    return UI.JENIS.map(function (j) { return '<option value="' + j[0] + '"' + (terpilih === j[0] ? ' selected' : '') + '>' + j[1] + '</option>'; }).join('');
  }
  function totalBagian(b) {
    return (b.bagian || []).reduce(function (a, x) { return a + (Number(x.nominal) || 0); }, 0);
  }
  function masalahBaris(b) {
    if (b.duplikat || b.pilih === false) return '';
    if (b.bagian) {
      if (totalBagian(b) !== b.nominal) return 'Jumlah bagian belum pas';
      for (var i = 0; i < b.bagian.length; i++) {
        var m = masalahSatu(b.bagian[i], b.sumberDanaId);
        if (m) return 'Bagian ' + (i + 1) + ': ' + m;
      }
      return '';
    }
    return masalahSatu(b, b.sumberDanaId);
  }
  function masalahSatu(x, sumber) {
    if (x.tipe === 'transfer') return x.tujuanDanaId ? '' : 'tujuan dompet belum dipilih';
    return x.kategoriId ? '' : 'kategori belum dipilih';
  }

  /* satu sel "ke mana": kategori, atau dompet tujuan kalau jenisnya pindah dana */
  function selTujuan(key, x, sumber) {
    if (x.tipe === 'transfer') {
      return '<span style="display:flex;align-items:center;gap:8px">' +
        (x.tujuanDanaId ? icon((DB.sumber(x.tujuanDanaId) || {}).ikon || 'ic-wallet', 26) : tandaTanya()) +
        '<select class="fld" data-tujuan="' + key + '" aria-label="Dompet tujuan" style="padding:5px 7px;font-size:11.5px' + (x.tujuanDanaId ? '' : ';border-color:var(--org-b);color:var(--org);font-weight:600') + '">' +
        '<option value="">Pilih dompet tujuan…</option>' + opsiDompet(sumber, x.tujuanDanaId) + '</select></span>';
    }
    return '<span style="display:flex;align-items:center;gap:8px">' +
      (x.kategoriId ? icon(DB.ikonKategori(x.kategoriId), 26) : tandaTanya()) +
      '<select class="fld" data-kat="' + key + '" aria-label="Kategori" style="padding:5px 7px;font-size:11.5px' + (x.kategoriId ? '' : ';border-color:var(--org-b);color:var(--org);font-weight:600') + '">' +
      '<option value="">Pilih kategori…</option>' + opsiKategori(x.tipe, x.kategoriId) + '</select></span>';
  }
  function tandaTanya() {
    return '<span style="width:26px;height:26px;border-radius:8px;border:1px dashed var(--org-b);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--org);font-size:13px;font-weight:700">?</span>';
  }

  function blokImport() {
    var baru = impor.baris.filter(function (b) { return !b.duplikat; });
    var dup = impor.baris.length - baru.length;
    var perlu = baru.filter(function (b) { return masalahBaris(b); }).length;

    var langkah = [['1', 'Unggah', impor.file], ['2', 'Buka kunci', impor.baris.length], ['3', 'Cocokkan', impor.baris.length], ['4', 'Simpan & buang PDF', false]]
      .map(function (s, i) {
        var aktif = s[2];
        return (i ? '<span style="flex:1 1 20px;height:2px;background:var(--line);min-width:14px"></span>' : '') +
          '<span style="display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:700;color:' + (aktif ? 'var(--grn)' : 'var(--faint)') + '">' +
          '<span style="width:24px;height:24px;border-radius:50%;background:' + (aktif ? 'var(--grn)' : 'var(--line)') + ';color:' + (aktif ? '#fff' : 'var(--muted)') + ';display:flex;align-items:center;justify-content:center;font-size:12px">' + s[0] + '</span>' + s[1] + '</span>';
      }).join('');

    var tabelRows = impor.baris.map(function (b, i) {
      var pecah = !!b.bagian;
      var warnaLatar = b.duplikat ? ' style="background:var(--bg);color:var(--faint)"' : (masalahBaris(b) ? ' style="background:#FFF8F2"' : '');
      var sisa = pecah ? b.nominal - totalBagian(b) : 0;

      var utama = '<tr' + warnaLatar + '>' +
        '<td><input type="checkbox" data-pilih="' + i + '"' + (b.duplikat ? ' disabled' : (b.pilih === false ? '' : ' checked')) + ' aria-label="Pilih baris ' + (i + 1) + '" style="width:15px;height:15px;accent-color:#15803D"></td>' +
        '<td class="num" style="white-space:nowrap">' + UI.esc(b.tanggal) + '</td>' +
        '<td' + (b.duplikat ? ' style="text-decoration:line-through"' : '') + '>' + UI.esc(b.keterangan) + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + UI.v(UI.rpSigned(b.nominal, b.tipe), 'num', 'font-weight:600;color:' + UI.warnaTipe(b.tipe)) + '</td>' +
        '<td>' + (b.duplikat || pecah
          ? '<span style="font-size:11.5px;color:var(--muted)">' + (pecah ? 'Dipecah ' + b.bagian.length + ' bagian' : UI.labelTipe(b.tipe)) + '</span>'
          : '<select class="fld" data-jenis="' + i + '" aria-label="Jenis transaksi baris ' + (i + 1) + '" style="padding:5px 7px;font-size:11.5px">' + opsiJenis(b.tipe) + '</select>') + '</td>' +
        '<td>' + (b.duplikat
          ? '<span>' + UI.esc(DB.namaKategori(b.kategoriId) || '—') + '</span>'
          : (pecah ? '<span style="font-size:11.5px;color:var(--muted)">lihat bagian di bawah</span>' : selTujuan(String(i), b, b.sumberDanaId))) + '</td>' +
        '<td style="white-space:nowrap">' +
          (b.duplikat ? '<span class="pill n">Sudah ada</span>'
            : (masalahBaris(b) ? '<span class="pill o">' + UI.esc(masalahBaris(b)) + '</span>' : '<span class="pill g">Baru</span>')) +
          (b.duplikat ? '' : ' <button type="button" class="btn" data-pecah="' + i + '" style="padding:4px 9px;font-size:11px;margin-left:6px">' + (pecah ? 'Gabung' : 'Pecah') + '</button>') +
        '</td></tr>';

      if (!pecah) return utama;

      var sub = b.bagian.map(function (g, j) {
        var key = i + ':' + j;
        return '<tr style="background:#FBFCFB">' +
          '<td></td><td></td>' +
          '<td style="padding-left:26px"><span style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)">' +
            '<span style="color:#C9D1CB">└</span>' +
            '<input type="text" data-label="' + key + '" value="' + UI.esc(g.label || '') + '" placeholder="Bagian siapa? (opsional)" aria-label="Label bagian ' + (j + 1) + '" style="font:inherit;font-size:12px;border:1px solid var(--line);border-radius:7px;padding:4px 8px;width:180px"></span></td>' +
          '<td style="text-align:right;white-space:nowrap"><input type="text" inputmode="numeric" data-nom="' + key + '" value="' + (Number(g.nominal) || 0).toLocaleString('id-ID') + '" aria-label="Nominal bagian ' + (j + 1) + '" style="font:inherit;font-size:12px;font-weight:600;text-align:right;border:1px solid var(--line);border-radius:7px;padding:4px 8px;width:110px"></td>' +
          '<td><select class="fld" data-jenis="' + key + '" aria-label="Jenis bagian ' + (j + 1) + '" style="padding:5px 7px;font-size:11.5px">' + opsiJenis(g.tipe) + '</select></td>' +
          '<td>' + selTujuan(key, g, b.sumberDanaId) + '</td>' +
          '<td style="white-space:nowrap">' + (b.bagian.length > 2
            ? '<button type="button" class="btn danger" data-hapusbagian="' + key + '" style="padding:4px 9px;font-size:11px">Hapus</button>' : '') + '</td></tr>';
      }).join('');

      var kaki = '<tr style="background:#FBFCFB">' +
        '<td></td><td></td>' +
        '<td style="padding-left:26px"><button type="button" class="btn" data-tambahbagian="' + i + '" style="padding:4px 10px;font-size:11.5px">+ Tambah bagian</button></td>' +
        '<td style="text-align:right;white-space:nowrap;font-size:11.5px;font-weight:700;color:' + (sisa === 0 ? 'var(--grn)' : 'var(--org)') + '">' +
          (sisa === 0 ? 'Pas' : 'Sisa ' + UI.rp(sisa)) + '</td>' +
        '<td colspan="3">' + (sisa !== 0
          ? '<button type="button" class="btn" data-paskan="' + i + '" style="padding:4px 10px;font-size:11.5px">Masukkan sisa ke bagian terakhir</button>'
          : '<span style="font-size:11.5px;color:var(--muted)">Total bagian sudah sama dengan nominal aslinya.</span>') + '</td></tr>';

      return utama + sub + kaki;
    }).join('');

    return '<section class="card" style="padding:24px 26px;display:flex;flex-direction:column;gap:18px">' +
      '<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">' +
        '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:18px;font-weight:600;letter-spacing:-.015em">Import e-Statement (PDF)</h2>' +
        '<span class="pill g"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M6 6l1 14h10l1-14"></path></svg>PDF dibuang setelah dibaca — hanya datanya disimpan</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:9px;align-items:center">' + langkah + '</div>' +

      '<div style="display:flex;flex-wrap:wrap;gap:16px">' +
        '<div style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:14px">' +
          '<label for="fPdf" style="border:2px dashed #C9D1CB;border-radius:14px;padding:26px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;background:var(--bg);text-align:center;cursor:pointer">' +
            icon('ic-doc', 46) +
            '<span style="font-size:14px;font-weight:600">' + (impor.file ? UI.esc(impor.file.name) : 'Pilih file PDF e-statement') + '</span>' +
            '<span style="font-size:12px;color:var(--muted)">' + (impor.file ? Math.round(impor.file.size / 1024) + ' KB' : 'File tidak diunggah ke mana pun — dibaca di browser ini') + '</span>' +
            '<input id="fPdf" type="file" accept="application/pdf" style="display:none"></label>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="fBank">Masuk ke sumber dana</label>' +
          '<select id="fBank" class="fld">' + DB.state.SumberDana.map(function (s) { return '<option value="' + s.id + '"' + (impor.sumberDanaId === s.id ? ' selected' : '') + '>' + UI.esc(s.nama) + '</option>'; }).join('') + '</select></span>' +
          '<div style="border:1px solid ' + (impor.perluPassword ? 'var(--org-b)' : 'var(--line)') + ';border-radius:13px;padding:14px 16px;display:flex;flex-direction:column;gap:11px' + (impor.perluPassword ? ';background:#FFF8F2' : '') + '">' +
            '<span style="display:flex;align-items:center;gap:10px">' + icon('ic-lock', 28) +
            '<span style="font-size:12.5px;font-weight:700">Password PDF</span></span>' +
            '<span style="position:relative;display:flex;align-items:center">' +
              '<label class="sr" for="fPw">Password PDF</label>' +
              '<input id="fPw" class="fld" type="password" value="' + UI.esc(DB.getSecret(impor.sumberDanaId)) + '" placeholder="Kosongkan kalau tidak terkunci" style="padding-right:42px">' +
              '<button type="button" id="fPwShow" aria-label="Tampilkan password" style="position:absolute;right:8px;background:none;border:none;padding:6px;cursor:pointer;color:var(--muted);display:flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"></path><circle cx="12" cy="12" r="2.8"></circle></svg></button></span>' +
            '<label style="display:flex;align-items:flex-start;gap:9px;font-size:12px;cursor:pointer">' +
              '<input id="fIngat" type="checkbox"' + (DB.getSecret(impor.sumberDanaId) ? ' checked' : '') + ' style="margin-top:2px;width:15px;height:15px;accent-color:#15803D">' +
              '<span>Ingat password untuk sumber dana ini<span style="display:block;color:var(--muted);font-size:11px;margin-top:2px">Tersimpan di browser ini saja — tidak ikut ke GitHub.</span></span></label>' +
            (impor.pesan ? '<span style="font-size:12px;font-weight:600;color:var(--org)">' + UI.esc(impor.pesan) + '</span>' : '') +
            '<button type="button" class="btn solid" id="fBaca"' + (impor.file ? '' : ' disabled') + '>' + (impor.memuat ? 'Membaca…' : 'Baca file') + '</button>' +
          '</div>' +
          '<p style="margin:0;font-size:11.5px;line-height:1.6;color:var(--muted)">File dibuka dan dibaca di browsermu sendiri, lalu dibuang dari memori begitu transaksinya diimpor. PDF-nya tidak pernah diunggah dan tidak menyentuh server mana pun.</p>' +
        '</div>' +

        '<div style="flex:999 1 620px;min-width:0;display:flex;flex-direction:column;gap:14px">' +
          (impor.baris.length ? (
            '<div class="grid4">' +
              ['' + impor.baris.length + '|terbaca|var(--ink)', '' + baru.length + '|baru|var(--grn)', '' + dup + '|sudah ada|var(--faint)', '' + perlu + '|perlu dilengkapi|var(--org)'].map(function (s) {
                var q = s.split('|');
                return '<span style="border:1px solid var(--line);border-radius:11px;padding:12px 14px;display:flex;flex-direction:column;gap:3px"><span class="num" style="font-size:20px;font-weight:700;color:' + q[2] + '">' + q[0] + '</span><span style="font-size:11px;color:var(--muted)">' + q[1] + '</span></span>';
              }).join('') + '</div>' +
            '<div class="scroll"><table style="min-width:900px"><thead><tr>' +
              '<th style="width:34px"><span class="sr">Pilih</span></th><th>Tanggal</th><th>Keterangan di PDF</th><th style="text-align:right">Nominal</th><th>Jenis</th><th>Kategori / Tujuan</th><th>Status</th>' +
              '</tr></thead><tbody>' + tabelRows + '</tbody></table></div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">' +
              '<span style="font-size:11.5px;color:var(--muted);max-width:60ch;line-height:1.6"><strong style="color:var(--ink)">Pecah</strong> untuk tagihan patungan — tiap bagian punya nominal dan kategori sendiri, misalnya bagianmu masuk Makanan dan bagian temanmu masuk Piutang. <strong style="color:var(--ink)">Pindah ke dompet lain</strong> untuk tarik tunai atau pindah saldo: uangnya tidak dihitung sebagai pengeluaran.</span>' +
              '<span style="display:flex;gap:10px"><button type="button" class="btn" id="fBatal">Batal</button>' +
              '<button type="button" class="btn solid" id="fImpor">Impor ' + baru.length + ' &amp; buang PDF</button></span></div>'
          ) : '<div class="empty">' + icon('ic-doc', 48) + '<span>Pilih file PDF di sebelah kiri, lalu tekan “Baca file”.</span></div>') +
        '</div></div></section>';
  }

  function cari(key) {
    var q = String(key).split(':');
    var b = impor.baris[Number(q[0])];
    return q.length > 1 ? b.bagian[Number(q[1])] : b;
  }

  function pasangImport() {
    var f = document.getElementById('fPdf');
    if (f) f.addEventListener('change', function () { impor.file = this.files[0] || null; impor.pesan = ''; impor.baris = []; render(); });
    var bank = document.getElementById('fBank');
    if (bank) bank.addEventListener('change', function () { impor.sumberDanaId = this.value; render(); });
    var show = document.getElementById('fPwShow');
    if (show) show.addEventListener('click', function () {
      var i = document.getElementById('fPw');
      i.type = i.type === 'password' ? 'text' : 'password';
    });
    var baca = document.getElementById('fBaca');
    if (baca) baca.addEventListener('click', function () {
      var pw = document.getElementById('fPw').value;
      var ingat = document.getElementById('fIngat').checked;
      if (!impor.file) return;
      impor.memuat = true; impor.pesan = ''; render();
      PDF.baca(impor.file, pw).then(function (hasil) {
        if (ingat && pw) DB.setSecret(impor.sumberDanaId, pw); else if (!ingat) DB.setSecret(impor.sumberDanaId, '');
        impor.baris = PDF.cocokkan(hasil.baris, impor.sumberDanaId);
        impor.info = hasil.info;
        impor.perluPassword = false;
        impor.memuat = false;
        if (!impor.baris.length) impor.pesan = 'Tidak ada baris transaksi yang dikenali. Kirim contoh PDF-nya supaya formatnya ditambahkan.';
        render();
      }).catch(function (err) {
        impor.memuat = false;
        impor.perluPassword = !!err.perluPassword;
        impor.pesan = err.message;
        render();
      });
    });

    app.querySelectorAll('[data-jenis]').forEach(function (s) {
      s.addEventListener('change', function () {
        var x = cari(s.getAttribute('data-jenis'));
        x.tipe = s.value;
        if (x.tipe === 'transfer') x.kategoriId = '';
        else { x.tujuanDanaId = ''; 
               var sah = DB.state.Kategori.some(function (k) { return k.id === x.kategoriId && k.tipe === grupKategori(x.tipe); });
               if (!sah) x.kategoriId = ''; }
        render();
      });
    });
    app.querySelectorAll('[data-kat]').forEach(function (s) {
      s.addEventListener('change', function () { cari(s.getAttribute('data-kat')).kategoriId = s.value; render(); });
    });
    app.querySelectorAll('[data-tujuan]').forEach(function (s) {
      s.addEventListener('change', function () { cari(s.getAttribute('data-tujuan')).tujuanDanaId = s.value; render(); });
    });
    app.querySelectorAll('[data-pilih]').forEach(function (c) {
      c.addEventListener('change', function () { impor.baris[Number(c.getAttribute('data-pilih'))].pilih = c.checked; });
    });
    app.querySelectorAll('[data-label]').forEach(function (inp) {
      inp.addEventListener('input', function () { cari(inp.getAttribute('data-label')).label = inp.value; });
    });
    app.querySelectorAll('[data-nom]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var g = cari(inp.getAttribute('data-nom'));
        g.nominal = Number(String(inp.value).replace(/\D/g, '')) || 0;
        render();
      });
    });
    app.querySelectorAll('[data-pecah]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var b = impor.baris[Number(btn.getAttribute('data-pecah'))];
        if (b.bagian) { delete b.bagian; }
        else {
          b.bagian = [
            { nominal: b.nominal, tipe: b.tipe, kategoriId: b.kategoriId, tujuanDanaId: '', label: 'Bagianku' },
            { nominal: 0, tipe: 'piutang', kategoriId: 'k-piutang', tujuanDanaId: '', label: '' }
          ];
        }
        render();
      });
    });
    app.querySelectorAll('[data-tambahbagian]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var b = impor.baris[Number(btn.getAttribute('data-tambahbagian'))];
        b.bagian.push({ nominal: 0, tipe: 'piutang', kategoriId: 'k-piutang', tujuanDanaId: '', label: '' });
        render();
      });
    });
    app.querySelectorAll('[data-hapusbagian]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = btn.getAttribute('data-hapusbagian').split(':');
        impor.baris[Number(q[0])].bagian.splice(Number(q[1]), 1);
        render();
      });
    });
    app.querySelectorAll('[data-paskan]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var b = impor.baris[Number(btn.getAttribute('data-paskan'))];
        var sisa = b.nominal - totalBagian(b);
        var last = b.bagian[b.bagian.length - 1];
        last.nominal = Math.max(0, (Number(last.nominal) || 0) + sisa);
        render();
      });
    });

    var batal = document.getElementById('fBatal');
    if (batal) batal.addEventListener('click', function () { impor = { file: null, sumberDanaId: impor.sumberDanaId, baris: [], info: null, perluPassword: false, pesan: '', memuat: false }; render(); });

    var go = document.getElementById('fImpor');
    if (go) go.addEventListener('click', function () {
      var dipilih = impor.baris.filter(function (b) { return !b.duplikat && b.pilih !== false; });
      var rusak = dipilih.filter(function (b) { return masalahBaris(b); });
      if (rusak.length) { UI.toast(rusak.length + ' baris belum lengkap: ' + masalahBaris(rusak[0])); return; }

      var jumlah = 0;
      dipilih.forEach(function (b) {
        var bagian = b.bagian || [{ nominal: b.nominal, tipe: b.tipe, kategoriId: b.kategoriId, tujuanDanaId: b.tujuanDanaId, label: '' }];
        var grupId = b.bagian ? DB.uid('g') : '';
        bagian.forEach(function (g, j) {
          if (!Number(g.nominal)) return;
          var ket = b.keterangan + (g.label ? ' · ' + g.label : (b.bagian ? ' · bagian ' + (j + 1) : ''));
          DB.tambahTransaksi({
            tanggal: b.tanggal,
            tipe: g.tipe,
            kategoriId: g.tipe === 'transfer' ? '' : g.kategoriId,
            tujuanDanaId: g.tipe === 'transfer' ? g.tujuanDanaId : '',
            nominal: Number(g.nominal),
            sumberDanaId: b.sumberDanaId,
            catatan: ket,
            asal: 'pdf',
            grupId: grupId,
            hashInduk: b.hash,
            hash: DB.hashTx(b.tanggal, g.nominal, ket, b.bagian ? j + 1 : 0)
          });
          jumlah++;
        });
      });
      impor = { file: null, sumberDanaId: impor.sumberDanaId, baris: [], info: null, perluPassword: false, pesan: '', memuat: false };
      UI.toast(jumlah + ' transaksi diimpor · PDF dibuang');
      render();
    });
  }

  render();
})();
