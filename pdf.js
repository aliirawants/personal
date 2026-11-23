/* Pembaca e-statement PDF. Dibuka di browser, dibaca, lalu dibuang — tidak pernah diunggah. */
(function () {
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var siap = null;

  function muat() {
    if (siap) return siap;
    siap = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = CDN + 'pdf.min.js';
      s.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'pdf.worker.min.js';
        res(window.pdfjsLib);
      };
      s.onerror = function () { rej(new Error('Gagal memuat pdf.js. Cek koneksi internet.')); };
      document.head.appendChild(s);
    });
    return siap;
  }

  /* Tebak kategori dari nama merchant. Dipelajari juga dari transaksi yang sudah ada. */
  var ATURAN = [
    [/(warung|resto|bakmi|bebek|ayam|nasi|kopi|coffee|cafe|kedai|food|mie|sate|bakso|martabak|roti|kue|mamimely|algo)/i, 'k-makan'],
    [/(indomaret|alfamart|idm qris|alfa|superindo|hypermart|transmart|giant|toko)/i, 'k-pribadi'],
    [/(shell|pertamina|spbu|bensin|grab|gojek|gocar|emoney|e-money|flazz|tol|parkir|busway|kereta|kai)/i, 'k-transport'],
    [/(pln|telkom|indihome|wifi|internet|pulsa|listrik|air|pdam|bpjs)/i, 'k-tagihan'],
    [/(tabungan|reksa|emas|saham|investasi|haji|deposito)/i, 'k-investasi'],
    [/(apotek|klinik|rumah sakit|dokter)/i, 'k-keluarga'],
    [/(biaya adm|admin|administrasi|pajak bunga)/i, 'k-tagihan'],
    [/(payroll|gaji|salary)/i, 'k-gaji'],
    [/(transfer masuk|setoran|kredit)/i, 'k-masuk']
  ];

  function tebakKategori(ket, tipe) {
    var t = String(ket || '');
    for (var i = 0; i < ATURAN.length; i++) {
      if (ATURAN[i][0].test(t)) {
        var k = DB.kategori(ATURAN[i][1]);
        if (k && ((tipe === 'pemasukan') === (k.tipe === 'pemasukan'))) return ATURAN[i][1];
      }
    }
    var kunci = t.toUpperCase().replace(/[^A-Z ]/g, '').trim().split(/\s+/).slice(0, 2).join(' ');
    if (kunci.length > 3) {
      var cocok = DB.state.Transaksi.filter(function (x) {
        return String(x.catatan || '').toUpperCase().indexOf(kunci) >= 0;
      });
      if (cocok.length) return cocok[cocok.length - 1].kategoriId;
    }
    return '';
  }

  function keAngka(s) {
    return Number(String(s).replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')) || 0;
  }

  var BULAN = { jan:'01', feb:'02', mar:'03', apr:'04', mei:'05', may:'05', jun:'06', jul:'07', agu:'08', aug:'08', sep:'09', okt:'10', oct:'10', nov:'11', des:'12', dec:'12' };

  function keTanggal(s) {
    var m = String(s).match(/(\d{1,2})\s+([A-Za-z]{3})\s*(\d{4})?/);
    if (!m) return '';
    var bln = BULAN[m[2].toLowerCase()];
    if (!bln) return '';
    var th = m[3] || String(new Date().getFullYear());
    return th + '-' + bln + '-' + String(m[1]).padStart(2, '0');
  }

  var PDF = {
    /**
     * Baca sebuah File PDF. Kalau terkunci, password wajib diisi.
     * Mengembalikan { baris: [...], info: {...} }. Objek PDF langsung dihancurkan setelah dibaca.
     */
    baca: function (file, password) {
      return muat().then(function (lib) {
        return file.arrayBuffer().then(function (buf) {
          var tugas = lib.getDocument({ data: new Uint8Array(buf), password: password || '' });
          return tugas.promise.then(function (doc) {
            var halaman = [];
            for (var i = 1; i <= doc.numPages; i++) halaman.push(i);
            return Promise.all(halaman.map(function (p) {
              return doc.getPage(p).then(function (pg) { return pg.getTextContent(); });
            })).then(function (isi) {
              var teks = isi.map(function (tc) {
                var baris = {}, out = [];
                tc.items.forEach(function (it) {
                  var y = Math.round(it.transform[5]);
                  (baris[y] = baris[y] || []).push(it.str);
                });
                Object.keys(baris).map(Number).sort(function (a, b) { return b - a; })
                  .forEach(function (y) { out.push(baris[y].join(' ').replace(/\s+/g, ' ').trim()); });
                return out.join('\n');
              }).join('\n');
              doc.destroy();                 // buang isi PDF dari memori
              return PDF.parse(teks);
            });
          }).catch(function (err) {
            var nm = String(err && err.name);
            if (nm === 'PasswordException') {
              var e = new Error(password ? 'Password salah.' : 'File ini terkunci — masukkan password.');
              e.perluPassword = true;
              throw e;
            }
            throw err;
          });
        });
      });
    },

    parse: function (teks) {
      var baris = teks.split('\n');
      var out = [], info = { periode: '', saldoAkhir: 0 };
      baris.forEach(function (ln) {
        var p = ln.match(/Periode[^0-9]*(\d{1,2}\s+\w{3}\s+\d{4})\s*[-–]\s*(\d{1,2}\s+\w{3}\s+\d{4})/i);
        if (p) info.periode = keTanggal(p[1]) + ' s/d ' + keTanggal(p[2]);
        var s = ln.match(/Saldo Akhir[^0-9\-]*([\d.,]+)/i);
        if (s) info.saldoAkhir = keAngka(s[1]);
      });

      /* Baris transaksi: tanggal, keterangan, nominal bertanda, saldo berjalan. */
      var re = /^(\d{1,3}\s+)?(\d{1,2}\s+\w{3}\s+\d{4})\s+(.*?)\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})\s*$/;
      baris.forEach(function (ln) {
        var m = ln.trim().match(re);
        if (!m) return;
        var tanggal = keTanggal(m[2]);
        var ket = m[3].replace(/\s+/g, ' ').trim();
        var nominal = keAngka(m[4]);
        if (!tanggal || !nominal) return;
        var tipe = nominal > 0 ? 'pemasukan' : 'pengeluaran';
        out.push({
          tanggal: tanggal,
          keterangan: ket,
          nominal: Math.abs(nominal),
          tipe: tipe,
          saldo: keAngka(m[5]),
          kategoriId: tebakKategori(ket, tipe)
        });
      });
      return { baris: out, info: info, mentah: baris.length };
    },

    /** Tandai mana yang sudah pernah masuk. */
    cocokkan: function (baris, sumberDanaId) {
      return baris.map(function (b) {
        var hash = DB.hashTx(b.tanggal, b.nominal, b.keterangan);
        return Object.assign({}, b, { hash: hash, duplikat: DB.adaHash(hash), sumberDanaId: sumberDanaId });
      });
    }
  };

  window.PDF = PDF;
})();
