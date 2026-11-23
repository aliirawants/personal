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
    [/bunga humairo/i, 'k-bunga'],
    [/(hajiku|tabungan haji|reksa|emas|saham|deposito|investasi)/i, 'k-investasi'],
    [/(payroll|gaji|salary|asiatop)/i, 'k-gaji'],
    [/(transfer (bi fast )?dari|transfer masuk|setoran|koreksi transaksi)/i, 'k-masuk'],
    [/(kantin|warteg|resto|bakmi|bebek|ayam|nasi|kopi|coffee|cafe|kedai|mie|sate|bakso|martabak|roti|kue|bakery|teh |poci|es teh|juice|jus|fruit|buah|dimsum|seblak|geprek|padang|soto|pecel|burger|pizza|donut|boba|milk|chatime|lawson|algo|food|resep|dapur|warung|rames|catering)/i, 'k-makan'],
    [/(indomaret|alfamart|idm qris|alfa|superindo|hypermart|transmart|giant|circle k|lotte)/i, 'k-pribadi'],
    [/(tokopedia|shopee|lazada|blibli|bukalapak|e-commerce|vap-|tiktok shop|olshop)/i, 'k-belanja'],
    [/(shell|pertamina|spbu|bensin|grab|gojek|gocar|e-?money|emoney|flazz|tol|parkir|busway|kereta|kai|travel|damri|top-?up e)/i, 'k-transport'],
    [/(pln|telkom|indihome|wifi|internet|pulsa|listrik|air|pdam|bpjs|netflix|spotify|youtube|langganan)/i, 'k-tagihan'],
    [/(biaya adm|administrasi|admin kartu|pajak bunga|biaya transfer)/i, 'k-tagihan'],
    [/(apotek|klinik|rumah sakit|dokter|kimia farma|guardian|century)/i, 'k-keluarga'],
    [/(atribut|pionir|toko buku|gramedia|stationery|alat tulis)/i, 'k-pribadi'],
    [/(transfer ke bank|fliptech|flip|kirim ke)/i, 'k-transfer']
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
      var baris = teks.split('\n').map(function (s) { return s.replace(/\s+/g, ' ').trim(); });
      var info = { periode: '', saldoAwal: 0, saldoAkhir: 0, rekening: '' };

      baris.forEach(function (ln) {
        var pr = ln.match(/(\d{1,2}\s+\w{3}\s+\d{4})\s*[-–]\s*(\d{1,2}\s+\w{3}\s+\d{4})/);
        if (pr && !info.periode) info.periode = keTanggal(pr[1]) + ' s/d ' + keTanggal(pr[2]);
        var sa = ln.match(/Saldo Awal[^0-9]*([\d.]+,\d{2})/i);
        if (sa) info.saldoAwal = keAngka(sa[1]);
        var sk = ln.match(/Saldo Akhir[^0-9]*([\d.]+,\d{2})/i);
        if (sk) info.saldoAkhir = keAngka(sk[1]);
        var rk = ln.match(/Account Number\s*:?\s*(\d{6,})/i) || ln.match(/^(\d{10,})$/);
        if (rk && !info.rekening) info.rekening = rk[1];
      });

      /* Baris jangkar: <keterangan?> <saldo> <no urut> <nominal bertanda> */
      var JANGKAR = /^(.*?)\s*([\d.]+,\d{2})\s+(\d{1,4})\s+([+-][\d.]+,\d{2})$/;
      var TANGGAL = /^(\d{1,2}\s+\w{3}\s+\d{4})$/;
      var WAKTU   = /\d{1,2}:\d{2}:\d{2}(\s*WIB)?/;
      var SAMPAH  = /e-Statement|Menara Mandiri|Mandiri Call|Otoritas Jasa|Lembaga Penjamin|Nama\/|Cabang\/|Periode\/|Dicetak|Nomor Rekening|Mata Uang|Saldo A|Dana (Masuk|Keluar)|^No Tanggal|^No Date|Balance \(IDR\)|Amount \(IDR\)|Keterangan|Remarks|dari \d+$|^\d+ of \d+$|Tabungan NOW/i;

      function bersih(s) {
        return String(s).replace(WAKTU, ' ').replace(/\b\d{10,}\b/g, ' ').replace(/\s+/g, ' ').trim();
      }
      function layak(s) {
        if (!s) return false;
        if (TANGGAL.test(s) || SAMPAH.test(s)) return false;
        return bersih(s).length > 1;
      }

      var jangkarIdx = [];
      baris.forEach(function (ln, i) { if (JANGKAR.test(ln) && !SAMPAH.test(ln)) jangkarIdx.push(i); });

      var out = [];
      jangkarIdx.forEach(function (a, n) {
        var m = baris[a].match(JANGKAR);
        var nominal = keAngka(m[4]);
        if (!nominal) return;
        var batasAtas = n > 0 ? jangkarIdx[n - 1] + 1 : 0;
        var batasBawah = n < jangkarIdx.length - 1 ? jangkarIdx[n + 1] : baris.length;

        /* tanggal: cari mundur maksimal 4 baris */
        var tanggal = '', idxTgl = -1;
        for (var i = a - 1; i >= Math.max(batasAtas, a - 4) && !tanggal; i--) {
          var d = baris[i].match(/(\d{1,2}\s+\w{3}\s+\d{4})/);
          if (d && !SAMPAH.test(baris[i])) { tanggal = keTanggal(d[1]); idxTgl = i; }
        }
        if (!tanggal) return;

        /* keterangan: awalan di atas tanggal + sisa teks di baris jangkar */
        var awalan = [];
        var sisaTgl = baris[idxTgl].replace(/(\d{1,2}\s+\w{3}\s+\d{4})/, ' ');
        if (layak(sisaTgl)) awalan.push(bersih(sisaTgl));
        if (!awalan.length && idxTgl - 1 >= batasAtas && layak(baris[idxTgl - 1])) {
          awalan.push(bersih(baris[idxTgl - 1]));
        }
        var inti = bersih(m[1]);
        if (!inti) {
          for (var k = a + 1; k < Math.min(batasBawah, a + 2) && !inti; k++) {
            if (layak(baris[k])) inti = bersih(baris[k]);
          }
        }
        var ket = (awalan.join(' ') + ' ' + inti).replace(/\s+/g, ' ').trim();
        if (!ket) ket = 'Transaksi';

        var tipe = nominal > 0 ? 'pemasukan' : 'pengeluaran';
        out.push({
          tanggal: tanggal,
          keterangan: ket,
          nominal: Math.abs(nominal),
          tipe: tipe,
          saldo: keAngka(m[2]),
          urut: Number(m[3]),
          kategoriId: tebakKategori(ket, tipe)
        });
      });

      out.sort(function (x, y) { return x.urut - y.urut; });
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
