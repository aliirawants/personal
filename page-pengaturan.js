/* Profil & Pengaturan */
(function () {
  UI.mount('set');
  var app = document.getElementById('app');
  var LOGO = { livin: '../livin-mandiri.webp', gopay: '../gopay.webp' };
  var tabKat = 'pengeluaran';
  var baru = { nama: '', induk: '', ikon: 'ic-phone', tipe: 'pengeluaran' };

  function render() {
    /* ---- sumber dana ---- */
    var rows = DB.state.SumberDana.map(function (s) {
      var on = s.tampilDiTotal === true || s.tampilDiTotal === 'TRUE';
      var kepala = s.logo && LOGO[s.logo]
        ? '<img src="' + LOGO[s.logo] + '" alt="' + UI.esc(s.nama) + '" style="height:18px;width:auto">'
        : icon(s.ikon, 26);
      return '<tr' + (on ? '' : ' style="background:var(--bg)"') + '>' +
        '<td><span style="display:flex;align-items:center;gap:11px' + (on ? '' : ';opacity:.6') + '">' + kepala +
        '<input type="text" data-nama="' + s.id + '" value="' + UI.esc(s.nama) + '" aria-label="Nama sumber dana" style="font:inherit;font-size:13px;font-weight:700;border:1px solid transparent;border-radius:7px;padding:4px 6px;background:none;width:170px"></span></td>' +
        '<td style="color:var(--muted)">' + UI.esc(s.jenis) + '</td>' +
        '<td style="text-align:right">' + UI.v(UI.rp(DB.saldo(s.id)), 'num', 'font-weight:600' + (on ? '' : ';color:var(--faint)')) + '</td>' +
        '<td>' + (DB.getSecret(s.id) ? '<span class="pill g">Tersimpan</span>' : '<span class="pill n">Belum diisi</span>') + '</td>' +
        '<td><button type="button" data-toggle="' + s.id + '" role="switch" aria-checked="' + on + '" aria-label="Hitung ' + UI.esc(s.nama) + ' di total aset" style="border:none;padding:0;cursor:pointer;background:none">' +
          '<span style="display:inline-flex;width:40px;height:23px;border-radius:12px;background:' + (on ? 'var(--grn-b)' : '#C9D1CB') + ';padding:2px;justify-content:' + (on ? 'flex-end' : 'flex-start') + '"><span style="width:19px;height:19px;border-radius:50%;background:#fff"></span></span></button>' +
          (on ? '' : '<span style="display:block;font-size:11px;font-weight:600;color:var(--org);margin-top:5px">Disembunyikan</span>') + '</td>' +
        '<td><button type="button" class="btn danger" data-hapussumber="' + s.id + '" style="padding:5px 10px;font-size:11.5px">Hapus</button></td></tr>';
    }).join('');

    /* ---- pohon kategori ---- */
    var utama = DB.state.Kategori.filter(function (k) { return k.tipe === tabKat && !k.induk; });
    var pohon = utama.map(function (k) {
      var subs = DB.state.Kategori.filter(function (s) { return s.induk === k.id; });
      var jml = DB.state.Transaksi.filter(function (t) { return t.kategoriId === k.id; }).length;
      return '<div style="display:flex;align-items:center;gap:11px;padding:10px 14px;border-bottom:1px solid var(--hair)">' + icon(k.ikon, 30) +
        '<span style="flex-grow:1;font-size:13.5px;font-weight:600">' + UI.esc(k.nama) + '</span>' +
        '<span style="font-size:11.5px;color:var(--muted)">' + jml + ' transaksi</span>' +
        '<button type="button" class="btn danger" data-hapuskat="' + k.id + '" style="padding:4px 9px;font-size:11px">Hapus</button></div>' +
        subs.map(function (s) {
          var js = DB.state.Transaksi.filter(function (t) { return t.kategoriId === s.id; }).length;
          return '<div style="display:flex;align-items:center;gap:11px;padding:9px 14px 9px 46px;border-bottom:1px solid var(--hair);background:#FBFCFB">' +
            '<span style="color:#C9D1CB;font-size:13px">└</span>' + icon(s.ikon, 22) +
            '<span style="flex-grow:1;font-size:13px;color:var(--muted)">' + UI.esc(s.nama) + '</span>' +
            '<span style="font-size:11.5px;color:var(--faint)">' + js + '</span>' +
            '<button type="button" class="btn danger" data-hapuskat="' + s.id + '" style="padding:4px 9px;font-size:11px">Hapus</button></div>';
        }).join('');
    }).join('');

    var pickers = ICON_LIST.map(function (ic) {
      var on = baru.ikon === ic;
      return '<button type="button" data-ikon="' + ic + '" aria-label="Ikon ' + ICON_LABEL[ic] + (on ? ', terpilih' : '') + '"' + (on ? ' aria-pressed="true"' : '') +
        ' style="aspect-ratio:1;border-radius:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:5px;' +
        (on ? 'border:2px solid var(--grn);background:var(--grn-t)' : 'border:1px solid var(--line);background:#fff') + '">' +
        '<svg style="width:100%;height:100%" aria-hidden="true"><use href="#' + ic + '"></use></svg></button>';
    }).join('');

    var terhubung = DB.connected();

    app.innerHTML =
      '<h1 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:24px;font-weight:600;letter-spacing:-.02em">Profil &amp; Pengaturan</h1>' +

      '<section class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:15px">' +
        '<div><h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Sumber Dana</h2>' +
        '<p style="margin:4px 0 0;font-size:12.5px;color:var(--muted)">Matikan “Hitung di total aset” dan sumber itu hilang sepenuhnya dari dashboard — kartunya, nominalnya, dan kontribusinya ke total.</p></div>' +
        '<div class="scroll"><table style="min-width:760px"><thead><tr><th>Nama</th><th>Jenis</th><th style="text-align:right">Saldo</th><th>Password e-Statement</th><th>Hitung di total aset</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;border-top:1px solid var(--line);padding-top:14px">' +
          '<label class="sr" for="sNama">Nama sumber dana baru</label><input id="sNama" class="fld" placeholder="Nama, mis. Bank BCA" style="width:220px">' +
          '<label class="sr" for="sJenis">Jenis</label><select id="sJenis" class="fld" style="width:auto"><option value="bank">Rekening bank</option><option value="tunai">Tunai</option><option value="ewallet">E-wallet</option><option value="investasi">Investasi</option></select>' +
          '<label class="sr" for="sSaldo">Saldo awal</label><input id="sSaldo" class="fld" inputmode="numeric" placeholder="Saldo awal" style="width:160px">' +
          '<button type="button" class="btn solid" id="sTambah">Tambah Sumber Dana</button></div>' +
      '</section>' +

      '<section style="display:flex;flex-wrap:wrap;gap:16px">' +
        '<div class="card" style="flex:999 1 540px;min-width:0;padding:22px 24px;display:flex;flex-direction:column;gap:15px">' +
          '<h2 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Kategori</h2>' +
          '<span style="display:inline-flex;align-self:flex-start;padding:3px;background:var(--hair);border-radius:9px">' +
          [['pengeluaran','Pengeluaran'],['pemasukan','Pemasukan'],['hutang','Hutang / Piutang']].map(function (t) {
            var on = tabKat === t[0];
            return '<button type="button" data-tabkat="' + t[0] + '" style="border:none;background:' + (on ? '#fff' : 'none') + ';padding:8px 16px;border-radius:7px;font:inherit;font-size:12px;font-weight:' + (on ? 700 : 600) + ';color:' + (on ? 'var(--ink)' : 'var(--muted)') + ';cursor:pointer">' + t[1] + '</button>';
          }).join('') + '</span>' +
          '<div style="display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;overflow:hidden">' + (pohon || '<div class="empty">Belum ada kategori di tab ini.</div>') + '</div>' +
        '</div>' +

        '<div class="card" style="flex:1 1 330px;min-width:0;padding:22px 24px;display:flex;flex-direction:column;gap:15px;border-color:var(--grn)">' +
          '<h2 style="font-size:15px;font-weight:700">Kategori Baru</h2>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="kNama">Nama kategori</label><input id="kNama" class="fld" value="' + UI.esc(baru.nama) + '" placeholder="mis. Langganan Digital"></span>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="kTipe">Tipe</label><select id="kTipe" class="fld">' +
            [['pengeluaran','Pengeluaran'],['pemasukan','Pemasukan'],['hutang','Hutang / Piutang']].map(function (t) { return '<option value="' + t[0] + '"' + (baru.tipe === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></span>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="kInduk">Letakkan di</label><select id="kInduk" class="fld"><option value="">Kategori Utama (berdiri sendiri)</option>' +
            DB.state.Kategori.filter(function (k) { return k.tipe === baru.tipe && !k.induk; }).map(function (k) { return '<option value="' + k.id + '"' + (baru.induk === k.id ? ' selected' : '') + '>Sub dari — ' + UI.esc(k.nama) + '</option>'; }).join('') + '</select></span>' +
          '<span style="display:flex;flex-direction:column;gap:9px"><span class="lbl">Pilih ikon</span>' +
          '<span style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px">' + pickers + '</span></span>' +
          '<span style="display:flex;align-items:center;gap:11px;background:var(--bg);border-radius:11px;padding:12px 14px">' + icon(baru.ikon, 36) +
          '<span style="font-size:12.5px"><strong>' + (UI.esc(baru.nama) || 'Nama kategori') + '</strong><span style="display:block;color:var(--muted);font-size:11.5px">Pratinjau · ' + (baru.induk ? 'sub dari ' + UI.esc(DB.namaKategori(baru.induk)) : 'kategori utama') + '</span></span></span>' +
          '<button type="button" class="btn solid" id="kSimpan" style="padding:11px">Simpan kategori</button>' +
        '</div></section>' +

      '<section class="grid2">' +
        '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:14px">' +
          '<h2 style="font-size:15px;font-weight:700">Profil &amp; Preferensi</h2>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="pNama">Nama</label><input id="pNama" class="fld" value="' + UI.esc(DB.setting('nama', 'Ali Irawan')) + '"></span>' +
          '<span style="display:flex;flex-wrap:wrap;gap:12px">' +
            '<span style="flex:1 1 140px;display:flex;flex-direction:column;gap:6px"><label class="lbl" for="pBulan">Bulan aktif</label><input id="pBulan" class="fld" type="month" value="' + DB.setting('bulanAktif', '2026-11') + '"></span>' +
            '<span style="flex:1 1 140px;display:flex;flex-direction:column;gap:6px"><label class="lbl" for="pTarget">Target savings rate (%)</label><input id="pTarget" class="fld" inputmode="numeric" value="' + UI.esc(DB.setting('targetSavingsRate', '20')) + '"></span></span>' +
          '<label style="display:flex;align-items:flex-start;gap:10px;font-size:12.5px;cursor:pointer"><input id="pSembunyi" type="checkbox"' + (DB.setting('sembunyikanAngkaDefault', 'false') === 'true' ? ' checked' : '') + ' style="margin-top:2px;width:15px;height:15px;accent-color:#15803D">' +
          '<span>Buka halaman dengan angka sudah disembunyikan<span style="display:block;color:var(--muted);font-size:11.5px;margin-top:2px">Tombolnya tetap di header dan ikut ke mana pun kamu scroll.</span></span></label>' +
          '<button type="button" class="btn solid" id="pSimpan">Simpan preferensi</button></div>' +

        '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:14px">' +
          '<h2 style="font-size:15px;font-weight:700">Data &amp; Keamanan</h2>' +
          '<p style="margin:0;font-size:12.5px;line-height:1.65;color:var(--muted)">Data disimpan di browser ini. Hubungkan ke Google Sheet supaya bisa dibuka dari HP dan laptop. URL dan kunci hanya tersimpan di browser ini — tidak ikut ke GitHub.</p>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="gUrl">URL Web App Apps Script</label><input id="gUrl" class="fld" value="' + UI.esc(DB.cfg.url) + '" placeholder="https://script.google.com/macros/s/.../exec"></span>' +
          '<span style="display:flex;flex-direction:column;gap:6px"><label class="lbl" for="gTok">Kunci rahasia (TOKEN)</label><input id="gTok" class="fld" type="password" value="' + UI.esc(DB.cfg.token) + '" placeholder="Sama persis dengan Script Property TOKEN"></span>' +
          '<span style="display:flex;flex-wrap:wrap;gap:9px"><button type="button" class="btn solid" id="gSimpan">Simpan &amp; tes</button>' +
            '<button type="button" class="btn" id="gTarik"' + (terhubung ? '' : ' disabled') + '>Tarik dari Sheet</button>' +
            '<button type="button" class="btn" id="gDorong"' + (terhubung ? '' : ' disabled') + '>Dorong ke Sheet</button></span>' +
          '<span class="pill ' + (terhubung ? 'g' : 'n') + '" style="align-self:flex-start">' + (terhubung ? 'Tersambung ke Google Sheet' : 'Belum tersambung — jalan offline') + '</span>' +
          '<div style="border-top:1px solid var(--line);padding-top:14px;display:flex;flex-wrap:wrap;gap:9px">' +
            '<button type="button" class="btn" id="eksporJson">Ekspor semua (.json)</button>' +
            '<button type="button" class="btn" id="imporJson">Impor dari file</button>' +
            '<input id="fileJson" type="file" accept="application/json" style="display:none"></div>' +
          '<div style="border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:9px">' +
            '<span style="font-size:12.5px;font-weight:600">Password e-statement tersimpan</span>' +
            (DB.listSecrets().length ? DB.listSecrets().map(function (k) {
              var s = DB.sumber(k);
              return '<span style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px"><span>' + UI.esc(s ? s.nama : k) + ' · ••••••••</span>' +
                '<button type="button" class="btn danger" data-hapussecret="' + k + '" style="padding:5px 10px;font-size:12px">Hapus</button></span>';
            }).join('') : '<span style="font-size:12px;color:var(--muted)">Belum ada. Centang “Ingat password” saat import PDF.</span>') +
            '<span style="font-size:11.5px;color:var(--muted);line-height:1.6">Tersimpan di browser ini saja. Hapus kalau perangkat dipakai bersama.</span></div>' +
        '</div></section>';

    pasang();
    UI.done();
  }

  function pasang() {
    app.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = DB.sumber(b.getAttribute('data-toggle'));
        s.tampilDiTotal = !(s.tampilDiTotal === true || s.tampilDiTotal === 'TRUE');
        DB.save(); render();
      });
    });
    app.querySelectorAll('[data-nama]').forEach(function (i) {
      i.addEventListener('change', function () {
        var s = DB.sumber(i.getAttribute('data-nama')); s.nama = i.value; DB.save(); UI.toast('Nama diperbarui');
      });
    });
    app.querySelectorAll('[data-hapussumber]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-hapussumber');
        var pakai = DB.state.Transaksi.filter(function (t) { return t.sumberDanaId === id; }).length;
        if (pakai) { UI.toast('Masih dipakai ' + pakai + ' transaksi — tidak bisa dihapus'); return; }
        if (!confirm('Hapus sumber dana ini?')) return;
        DB.state.SumberDana = DB.state.SumberDana.filter(function (s) { return s.id !== id; });
        DB.save(); render();
      });
    });
    document.getElementById('sTambah').addEventListener('click', function () {
      var nama = document.getElementById('sNama').value.trim();
      if (!nama) { UI.toast('Nama belum diisi'); return; }
      var jenis = document.getElementById('sJenis').value;
      var ikon = { bank: 'ic-bank', tunai: 'ic-cash', ewallet: 'ic-wallet', investasi: 'ic-gold' }[jenis];
      DB.state.SumberDana.push({
        id: DB.uid('s'), nama: nama, jenis: jenis,
        saldoAwal: Number(String(document.getElementById('sSaldo').value).replace(/\D/g, '')) || 0,
        ikon: ikon, logo: '', tampilDiTotal: true
      });
      DB.save(); UI.toast('Sumber dana ditambahkan'); render();
    });

    app.querySelectorAll('[data-tabkat]').forEach(function (b) {
      b.addEventListener('click', function () { tabKat = b.getAttribute('data-tabkat'); render(); });
    });
    app.querySelectorAll('[data-hapuskat]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-hapuskat');
        var pakai = DB.state.Transaksi.filter(function (t) { return t.kategoriId === id; }).length;
        if (pakai) { UI.toast('Masih dipakai ' + pakai + ' transaksi — tidak bisa dihapus'); return; }
        if (!confirm('Hapus kategori ini?')) return;
        DB.state.Kategori = DB.state.Kategori.filter(function (k) { return k.id !== id && k.induk !== id; });
        DB.save(); render();
      });
    });
    app.querySelectorAll('[data-ikon]').forEach(function (b) {
      b.addEventListener('click', function () { baru.ikon = b.getAttribute('data-ikon'); render(); });
    });
    ['kNama', 'kTipe', 'kInduk'].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(id === 'kNama' ? 'input' : 'change', function () {
        if (id === 'kNama') { baru.nama = el.value; var pv = app.querySelector('[style*="Pratinjau"]'); }
        if (id === 'kTipe') { baru.tipe = el.value; baru.induk = ''; render(); }
        if (id === 'kInduk') { baru.induk = el.value; render(); }
      });
    });
    document.getElementById('kSimpan').addEventListener('click', function () {
      var nama = document.getElementById('kNama').value.trim();
      if (!nama) { UI.toast('Nama kategori belum diisi'); return; }
      DB.state.Kategori.push({ id: DB.uid('k'), tipe: baru.tipe, nama: nama, induk: baru.induk, ikon: baru.ikon, warna: 'green' });
      DB.save(); UI.toast('Kategori “' + nama + '” ditambahkan');
      baru = { nama: '', induk: '', ikon: 'ic-phone', tipe: baru.tipe };
      tabKat = baru.tipe; render();
    });

    document.getElementById('pSimpan').addEventListener('click', function () {
      DB.setSetting('nama', document.getElementById('pNama').value);
      DB.setSetting('bulanAktif', document.getElementById('pBulan').value);
      DB.setSetting('targetSavingsRate', String(Number(document.getElementById('pTarget').value) || 20));
      DB.setSetting('sembunyikanAngkaDefault', document.getElementById('pSembunyi').checked ? 'true' : 'false');
      DB.save(); UI.toast('Preferensi tersimpan');
    });

    document.getElementById('gSimpan').addEventListener('click', function () {
      DB.setConfig(document.getElementById('gUrl').value.trim(), document.getElementById('gTok').value.trim());
      if (!DB.connected()) { UI.toast('URL dan kunci wajib diisi dua-duanya'); render(); return; }
      DB.ping().then(function () { UI.toast('Tersambung ke Google Sheet'); render(); })
               .catch(function (e) { UI.toast('Gagal: ' + e.message); });
    });
    document.getElementById('gTarik').addEventListener('click', function () {
      DB.pull().then(function () { UI.toast('Data ditarik dari Sheet'); render(); })
               .catch(function (e) { UI.toast('Gagal: ' + e.message); });
    });
    document.getElementById('gDorong').addEventListener('click', function () {
      DB.push().then(function () { UI.toast('Data didorong ke Sheet'); })
               .catch(function (e) { UI.toast('Gagal: ' + e.message); });
    });

    document.getElementById('eksporJson').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(DB.state, null, 2)], { type: 'application/json' }));
      a.download = 'personal-finance-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    });
    document.getElementById('imporJson').addEventListener('click', function () { document.getElementById('fileJson').click(); });
    document.getElementById('fileJson').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      f.text().then(function (txt) {
        try {
          var j = JSON.parse(txt);
          if (!j.Transaksi) throw new Error('Struktur file tidak dikenali.');
          if (!confirm('Ganti seluruh data dengan isi file ini?')) return;
          DB.state = j; DB.save(); UI.toast('Data diimpor'); render();
        } catch (e) { UI.toast('Gagal membaca file: ' + e.message); }
      });
    });
    app.querySelectorAll('[data-hapussecret]').forEach(function (b) {
      b.addEventListener('click', function () { DB.setSecret(b.getAttribute('data-hapussecret'), ''); UI.toast('Password dihapus'); render(); });
    });
  }

  render();
})();
