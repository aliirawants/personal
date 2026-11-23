/* Tambah transaksi: catat manual + import e-statement PDF */
(function () {
  UI.mount('add');
  var app = document.getElementById('app');
  var tab = 'manual';
  var form = { tipe: 'pengeluaran', nominal: 0, kategoriId: 'k-makan', sumberDanaId: 's-tunai', catatan: '', tanggal: new Date().toISOString().slice(0, 10) };
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
    var kats = DB.state.Kategori.filter(function (k) {
      return form.tipe === 'pemasukan' ? k.tipe === 'pemasukan' : k.tipe === 'pengeluaran';
    });
    if (kats.length && !kats.some(function (k) { return k.id === form.kategoriId; })) form.kategoriId = kats[0].id;

    var baris = function (ic, isi) {
      return '<div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--hair)">' + icon(ic, 30) + isi + '</div>';
    };

    return '<section class="card" style="padding:26px;display:flex;justify-content:center">' +
      '<div style="flex:1 1 540px;max-width:560px;min-width:0;display:flex;flex-direction:column;gap:18px">' +
        '<span style="display:flex;padding:4px;background:var(--hair);border-radius:11px">' +
        ['pengeluaran|Pengeluaran|var(--org)', 'pemasukan|Pemasukan|var(--grn)', 'transfer|Transfer|var(--blu)'].map(function (t) {
          var p = t.split('|'), on = form.tipe === p[0];
          return '<button type="button" data-tipe="' + p[0] + '" style="flex:1;border:none;background:' + (on ? '#fff' : 'none') + ';padding:11px 4px;border-radius:8px;font:inherit;font-size:13px;font-weight:' + (on ? 700 : 600) + ';color:' + (on ? p[2] : 'var(--muted)') + ';cursor:pointer' + (on ? ';box-shadow:0 1px 3px rgba(16,35,26,.12)' : '') + '">' + p[1] + '</button>';
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
    if (slot) slot.innerHTML = icon(DB.ikonKategori(form.kategoriId), 30) +
      '<label class="sr" for="fKategori">Kategori</label><select id="fKategori" class="fld" style="border:none;padding:0;font-size:15px;font-weight:600;background:none;cursor:pointer">' +
      kats.map(function (k) { return '<option value="' + k.id + '"' + (form.kategoriId === k.id ? ' selected' : '') + '>' + UI.esc(DB.namaKategori(k.id)) + '</option>'; }).join('') + '</select>';
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
    ['fSumber', 'fKategori', 'fCatatan', 'fTanggal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        if (id === 'fSumber') form.sumberDanaId = el.value;
        if (id === 'fKategori') { form.kategoriId = el.value; render(); }
        if (id === 'fCatatan') form.catatan = el.value;
        if (id === 'fTanggal') form.tanggal = el.value;
      });
    });
    var simpan = document.getElementById('fSimpan');
    if (simpan) simpan.addEventListener('click', function () {
      if (!form.nominal) { UI.toast('Nominal belum diisi'); return; }
      DB.tambahTransaksi({
        tanggal: form.tanggal, tipe: form.tipe === 'transfer' ? 'pengeluaran' : form.tipe,
        kategoriId: form.kategoriId, nominal: form.nominal,
        sumberDanaId: form.sumberDanaId, catatan: form.catatan, asal: 'manual'
      });
      UI.toast('Tersimpan');
      form.nominal = 0; form.catatan = '';
      render();
    });
  }

  /* ---------------- import pdf ---------------- */
  function blokImport() {
    var baru = impor.baris.filter(function (b) { return !b.duplikat; });
    var dup = impor.baris.length - baru.length;
    var perlu = baru.filter(function (b) { return !b.kategoriId; }).length;

    var langkah = [['1', 'Unggah', impor.file], ['2', 'Buka kunci', impor.baris.length], ['3', 'Cocokkan', impor.baris.length], ['4', 'Simpan & buang PDF', false]]
      .map(function (s, i) {
        var aktif = s[2];
        return (i ? '<span style="flex:1 1 20px;height:2px;background:var(--line);min-width:14px"></span>' : '') +
          '<span style="display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:700;color:' + (aktif ? 'var(--grn)' : 'var(--faint)') + '">' +
          '<span style="width:24px;height:24px;border-radius:50%;background:' + (aktif ? 'var(--grn)' : 'var(--line)') + ';color:' + (aktif ? '#fff' : 'var(--muted)') + ';display:flex;align-items:center;justify-content:center;font-size:12px">' + s[0] + '</span>' + s[1] + '</span>';
      }).join('');

    var tabelRows = impor.baris.map(function (b, i) {
      var kats = DB.state.Kategori.filter(function (k) { return b.tipe === 'pemasukan' ? k.tipe === 'pemasukan' : k.tipe === 'pengeluaran'; });
      return '<tr' + (b.duplikat ? ' style="background:var(--bg);color:var(--faint)"' : (!b.kategoriId ? ' style="background:#FFF8F2"' : '')) + '>' +
        '<td><input type="checkbox" data-pilih="' + i + '"' + (b.duplikat ? ' disabled' : (b.pilih === false ? '' : ' checked')) + ' aria-label="Pilih baris ' + (i + 1) + '" style="width:15px;height:15px;accent-color:#15803D"></td>' +
        '<td class="num" style="white-space:nowrap">' + UI.esc(b.tanggal) + '</td>' +
        '<td' + (b.duplikat ? ' style="text-decoration:line-through"' : '') + '>' + UI.esc(b.keterangan) + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + UI.v(UI.rpSigned(b.nominal, b.tipe), 'num', 'font-weight:600;color:' + (b.tipe === 'pemasukan' ? 'var(--grn)' : 'var(--org)')) + '</td>' +
        '<td><span style="display:flex;align-items:center;gap:8px">' +
          (b.kategoriId ? icon(DB.ikonKategori(b.kategoriId), 26)
                        : '<span style="width:26px;height:26px;border-radius:8px;border:1px dashed var(--org-b);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--org);font-size:13px;font-weight:700">?</span>') +
          (b.duplikat ? '<span>' + UI.esc(DB.namaKategori(b.kategoriId) || '—') + '</span>' :
          '<select class="fld" data-kat="' + i + '" aria-label="Kategori baris ' + (i + 1) + '" style="padding:5px 7px;font-size:11.5px' + (!b.kategoriId ? ';border-color:var(--org-b);color:var(--org);font-weight:600' : '') + '">' +
          '<option value="">Pilih kategori…</option>' +
          kats.map(function (k) { return '<option value="' + k.id + '"' + (b.kategoriId === k.id ? ' selected' : '') + '>' + UI.esc(DB.namaKategori(k.id)) + '</option>'; }).join('') + '</select>') +
          '</span></td>' +
        '<td>' + (b.duplikat ? '<span class="pill n">Sudah ada</span>' : (b.kategoriId ? '<span class="pill g">Baru</span>' : '<span class="pill o">Belum dikenali</span>')) + '</td></tr>';
    }).join('');

    return '<section class="card" style="padding:24px 26px;display:flex;flex-direction:column;gap:18px">' +
      '<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">' +
        '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:18px;font-weight:600;letter-spacing:-.015em">Import e-Statement (PDF)</h2>' +
        '<span class="pill g"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M6 6l1 14h10l1-14"></path></svg>PDF dibuang setelah dibaca — hanya datanya disimpan</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:9px;align-items:center">' + langkah + '</div>' +

      '<div style="display:flex;flex-wrap:wrap;gap:16px">' +
        '<div style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:14px">' +
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

          '<p style="margin:0;font-size:11.5px;line-height:1.6;color:var(--muted)">File dibuka dan dibaca di browsermu sendiri, lalu dibuang dari memori begitu transaksinya diimpor. PDF-nya tidak pernah diunggah, tidak disimpan, dan tidak menyentuh server mana pun.</p>' +
        '</div>' +

        '<div style="flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:14px">' +
          (impor.baris.length ? (
            '<div class="grid4">' +
              ['' + impor.baris.length + '|terbaca|var(--ink)', '' + baru.length + '|baru|var(--grn)', '' + dup + '|sudah ada|var(--faint)', '' + perlu + '|perlu kategori|var(--org)'].map(function (s) {
                var p = s.split('|');
                return '<span style="border:1px solid var(--line);border-radius:11px;padding:12px 14px;display:flex;flex-direction:column;gap:3px"><span class="num" style="font-size:20px;font-weight:700;color:' + p[2] + '">' + p[0] + '</span><span style="font-size:11px;color:var(--muted)">' + p[1] + '</span></span>';
              }).join('') + '</div>' +
            '<div class="scroll"><table style="min-width:640px"><thead><tr>' +
              '<th style="width:34px"><span class="sr">Pilih</span></th><th>Tanggal</th><th>Keterangan di PDF</th><th style="text-align:right">Nominal</th><th>Kategori</th><th>Status</th>' +
              '</tr></thead><tbody>' + tabelRows + '</tbody></table></div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">' +
              '<span style="font-size:11.5px;color:var(--muted);max-width:46ch;line-height:1.6">Duplikat dikenali dari <strong style="color:var(--ink)">tanggal + nominal + awal keterangan</strong>. Tebakan kategori dipelajari dari catatan transaksi yang sudah ada.</span>' +
              '<span style="display:flex;gap:10px"><button type="button" class="btn" id="fBatal">Batal</button>' +
              '<button type="button" class="btn solid" id="fImpor">Impor ' + baru.length + ' &amp; buang PDF</button></span></div>'
          ) : '<div class="empty">' + icon('ic-doc', 48) + '<span>Pilih file PDF di sebelah kiri, lalu tekan “Baca file”.</span></div>') +
        '</div></div></section>';
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
    app.querySelectorAll('[data-kat]').forEach(function (s) {
      s.addEventListener('change', function () { impor.baris[Number(s.getAttribute('data-kat'))].kategoriId = s.value; render(); });
    });
    app.querySelectorAll('[data-pilih]').forEach(function (c) {
      c.addEventListener('change', function () { impor.baris[Number(c.getAttribute('data-pilih'))].pilih = c.checked; });
    });
    var batal = document.getElementById('fBatal');
    if (batal) batal.addEventListener('click', function () { impor = { file: null, sumberDanaId: impor.sumberDanaId, baris: [], info: null, perluPassword: false, pesan: '', memuat: false }; render(); });
    var go = document.getElementById('fImpor');
    if (go) go.addEventListener('click', function () {
      var dipilih = impor.baris.filter(function (b) { return !b.duplikat && b.pilih !== false; });
      var tanpaKat = dipilih.filter(function (b) { return !b.kategoriId; });
      if (tanpaKat.length) { UI.toast(tanpaKat.length + ' baris belum punya kategori'); return; }
      dipilih.forEach(function (b) {
        DB.tambahTransaksi({
          tanggal: b.tanggal, tipe: b.tipe, kategoriId: b.kategoriId, nominal: b.nominal,
          sumberDanaId: b.sumberDanaId, catatan: b.keterangan, asal: 'pdf', hash: b.hash
        });
      });
      impor = { file: null, sumberDanaId: impor.sumberDanaId, baris: [], info: null, perluPassword: false, pesan: '', memuat: false };
      UI.toast(dipilih.length + ' transaksi diimpor · PDF dibuang');
      render();
    });
  }

  render();
})();
