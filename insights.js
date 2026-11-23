/* Mesin rekomendasi — dihitung ulang dari data tiap halaman dibuka. */
(function () {
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function n(x) { return Number(x) || 0; }
  function prevPeriode(p, back) {
    var y = Number(p.slice(0, 4)), m = Number(p.slice(5, 7)) - back;
    while (m <= 0) { m += 12; y -= 1; }
    return y + '-' + String(m).padStart(2, '0');
  }
  function hariDalamBulan(p) { return new Date(Number(p.slice(0, 4)), Number(p.slice(5, 7)), 0).getDate(); }

  var KEBUTUHAN = ['k-makan','k-transport','k-transport-rawat','k-tagihan','k-internet','k-sewa','k-keluarga','k-rumah','k-hewan','k-rt'];
  var TABUNGAN  = ['k-investasi'];

  var Insight = {
    ringkas: function (periode) {
      var tx = DB.transaksiBulan(periode);
      var masuk = sum(tx.filter(function (t) { return DB.isMasuk(t); }).map(function (t) { return n(t.nominal); }));
      var keluar = sum(tx.filter(function (t) { return DB.isKeluar(t); }).map(function (t) { return n(t.nominal); }));
      var hariIni = new Date();
      var berjalan = (periode === hariIni.toISOString().slice(0, 7)) ? hariIni.getDate() : hariDalamBulan(periode);
      var totalHari = hariDalamBulan(periode);
      var lajuHarian = berjalan ? keluar / berjalan : 0;
      return {
        periode: periode, masuk: masuk, keluar: keluar, bersih: masuk - keluar,
        savingsRate: masuk ? (masuk - keluar) / masuk * 100 : 0,
        berjalan: berjalan, totalHari: totalHari, sisaHari: Math.max(0, totalHari - berjalan),
        lajuHarian: lajuHarian, proyeksi: lajuHarian * totalHari,
        totalAnggaran: sum(DB.anggaranBulan(periode).map(function (a) { return n(a.jumlah); })),
        totalAset: DB.totalAset(), jumlahTx: tx.length
      };
    },

    perKategori: function (periode) {
      var map = {};
      DB.transaksiBulan(periode).forEach(function (t) {
        if (!DB.isKeluar(t)) return;
        var k = DB.kategori(t.kategoriId);
        var root = (k && k.induk) ? k.induk : t.kategoriId;
        map[root] = (map[root] || 0) + n(t.nominal);
      });
      return Object.keys(map).map(function (id) { return { id: id, nama: DB.namaKategori(id), jumlah: map[id] }; })
        .sort(function (a, b) { return b.jumlah - a.jumlah; });
    },

    rataTiga: function (periode, kategoriId) {
      var tot = 0, ada = 0;
      for (var i = 1; i <= 3; i++) {
        var p = prevPeriode(periode, i);
        var tx = DB.transaksiBulan(p).filter(function (t) {
          if (!DB.isKeluar(t)) return false;
          var k = DB.kategori(t.kategoriId);
          var root = (k && k.induk) ? k.induk : t.kategoriId;
          return kategoriId ? root === kategoriId : true;
        });
        if (tx.length) { tot += sum(tx.map(function (t) { return n(t.nominal); })); ada++; }
      }
      return ada ? tot / ada : 0;
    },

    skor: function (periode) {
      var r = this.ringkas(periode);
      var target = n(DB.setting('targetSavingsRate', 20));
      var pilar = [];
      var sr = Math.max(0, Math.min(100, (r.savingsRate / Math.max(target, 1)) * 60));
      pilar.push({ nama: 'Savings rate', nilai: sr, teks: r.masuk ? UI.pct(r.savingsRate) : '—', baik: r.savingsRate >= target });
      var bulanTertutup = r.keluar ? r.totalAset / r.keluar : 0;
      pilar.push({ nama: 'Dana darurat', nilai: Math.min(100, bulanTertutup / 6 * 100), teks: bulanTertutup.toFixed(1).replace('.', ',') + '×', baik: bulanTertutup >= 6 });
      var pakai = r.totalAnggaran ? r.keluar / r.totalAnggaran : 0;
      var ideal = r.totalHari ? r.berjalan / r.totalHari : 0;
      pilar.push({ nama: 'Disiplin anggaran', nilai: Math.max(0, Math.min(100, (1 - Math.max(0, pakai - ideal)) * 100)), teks: r.totalAnggaran ? UI.pct(pakai * 100, 0) : '—', baik: pakai <= ideal + 0.05 });
      var inv = sum(DB.transaksiBulan(periode).filter(function (t) { return DB.isKeluar(t) && t.kategoriId === 'k-investasi'; }).map(function (t) { return n(t.nominal); }));
      pilar.push({ nama: 'Investasi', nilai: inv > 0 ? 85 : 20, teks: inv > 0 ? 'Jalan' : 'Kosong', baik: inv > 0 });
      pilar.push({ nama: 'Laju belanja', nilai: Math.max(0, Math.min(100, (1 - Math.max(0, (r.proyeksi - r.totalAnggaran) / Math.max(r.totalAnggaran, 1))) * 100)), teks: r.totalAnggaran && r.proyeksi > r.totalAnggaran ? 'Terlalu cepat' : 'Aman', baik: !r.totalAnggaran || r.proyeksi <= r.totalAnggaran });
      var total = Math.round(sum(pilar.map(function (p) { return p.nilai; })) / pilar.length);
      var label = total >= 80 ? 'Sangat baik' : total >= 65 ? 'Baik' : total >= 45 ? 'Cukup' : 'Perlu perhatian';
      return { total: total, label: label, pilar: pilar, ringkas: r };
    },

    kartu: function (periode) {
      var out = [], r = this.ringkas(periode);
      var target = n(DB.setting('targetSavingsRate', 20));
      if (!r.jumlahTx) {
        out.push({ level: 'info', warna: 'blu', topik: 'Mulai', judul: 'Belum ada transaksi di bulan ini',
          isi: ['Catat manual lewat tombol Tambah, atau import e-statement PDF rekeningmu. Begitu ada data, semua angka dan rekomendasi di halaman ini terisi sendiri.'],
          aksi: { label: 'Tambah transaksi →', href: 'tambah.html' } });
        return out;
      }

      if (r.totalAnggaran && r.sisaHari > 0) {
        var sisa = r.totalAnggaran - r.keluar;
        var bolehHarian = r.sisaHari ? sisa / r.sisaHari : 0;
        if (r.proyeksi > r.totalAnggaran) {
          out.push({ level: 'tinggi', warna: 'org', topik: 'Laju belanja',
            judul: 'Laju belanjamu melebihi anggaran bulan ini',
            isi: ['Terpakai ' + UI.v(UI.rp(r.keluar)) + ' dari ' + UI.v(UI.rp(r.totalAnggaran)) + ' dalam ' + r.berjalan + ' hari — rata-rata ' + UI.v(UI.rp(r.lajuHarian) + '/hari') + '.',
                  'Sisa ' + UI.v(UI.rp(sisa)) + ' untuk ' + r.sisaHari + ' hari berarti maksimal ' + UI.v(UI.rp(bolehHarian) + '/hari') + '. Proyeksi akhir bulan ' + UI.v(UI.rp(r.proyeksi)) + ' → lewat ' + UI.v(UI.rp(r.proyeksi - r.totalAnggaran)) + '.'],
            aksi: { label: 'Atur ulang anggaran →', href: 'anggaran.html' } });
        } else {
          out.push({ level: 'baik', warna: 'grn', topik: 'Laju belanja',
            judul: 'Laju belanja masih di dalam anggaran',
            isi: ['Rata-rata ' + UI.v(UI.rp(r.lajuHarian) + '/hari') + ', proyeksi akhir bulan ' + UI.v(UI.rp(r.proyeksi)) + ' dari anggaran ' + UI.v(UI.rp(r.totalAnggaran)) + '.'] });
        }
      }

      var bulanTertutup = r.keluar ? r.totalAset / r.keluar : 0;
      if (bulanTertutup < 6) {
        var butuh = r.keluar * 6, kurang = butuh - r.totalAset;
        out.push({ level: 'tinggi', warna: 'blu', topik: 'Dana darurat',
          judul: 'Dana darurat baru menutup ' + bulanTertutup.toFixed(1).replace('.', ',') + ' bulan pengeluaran',
          isi: ['Aset likuid ' + UI.v(UI.rp(r.totalAset)) + ' dibanding pengeluaran bulanan ' + UI.v(UI.rp(r.keluar)) + '. Standar yang dipakai: 6× (' + UI.v(UI.rp(butuh)) + ').',
                'Masih kurang ' + UI.v(UI.rp(kurang)) + '. Menyisihkan ' + UI.v(UI.rp(kurang / 12) + '/bulan') + ' menutupnya dalam setahun.'],
          aksi: { label: 'Buat pos Dana Darurat →', href: 'anggaran.html' } });
      }

      if (r.masuk) {
        if (r.savingsRate >= target) {
          out.push({ level: 'baik', warna: 'grn', topik: 'Savings rate',
            judul: 'Kamu menyisihkan ' + UI.pct(r.savingsRate) + ' — di atas target ' + target + '%',
            isi: ['Arus kas bersih ' + UI.v(UI.rp(r.bersih)) + ' bulan ini. Kalau laju ini bertahan, terkumpul ' + UI.v(UI.rp(r.bersih * 12)) + ' dalam 12 bulan.'] });
        } else {
          out.push({ level: 'sedang', warna: 'org', topik: 'Savings rate',
            judul: 'Savings rate ' + UI.pct(r.savingsRate) + ', di bawah target ' + target + '%',
            isi: ['Untuk mencapai target, pengeluaran bulan ini perlu turun ke ' + UI.v(UI.rp(r.masuk * (1 - target / 100))) + ' — selisih ' + UI.v(UI.rp(r.keluar - r.masuk * (1 - target / 100))) + '.'] });
        }
      }

      this.perKategori(periode).slice(0, 6).forEach(function (k) {
        var rata = Insight.rataTiga(periode, k.id);
        if (!rata) return;
        var delta = (k.jumlah - rata) / rata * 100;
        if (delta >= 15) {
          out.push({ level: 'sedang', warna: 'org', topik: 'Deviasi kategori',
            judul: k.nama + ' naik ' + Math.round(delta) + '% dari kebiasaanmu',
            isi: [UI.v(UI.rp(k.jumlah)) + ' bulan ini vs rata-rata 3 bulan ' + UI.v(UI.rp(rata)) + '.',
                  'Menahannya di angka rata-rata menghemat ' + UI.v(UI.rp((k.jumlah - rata) * 12) + '/tahun') + '.'],
            aksi: { label: 'Lihat transaksinya →', href: 'transaksi.html' } });
        }
      });

      DB.anggaranBulan(periode).forEach(function (a) {
        var pakai = sum(DB.transaksiBulan(periode).filter(function (t) {
          if (!DB.isKeluar(t)) return false;
          var k = DB.kategori(t.kategoriId);
          var root = (k && k.induk) ? k.induk : t.kategoriId;
          return root === a.kategoriId || t.kategoriId === a.kategoriId;
        }).map(function (t) { return n(t.nominal); }));
        var lim = n(a.jumlah);
        if (!lim) return;
        if (pakai > lim) {
          out.push({ level: 'sedang', warna: 'org', topik: 'Pos anggaran',
            judul: 'Pos “' + DB.namaKategori(a.kategoriId) + '” sudah lewat batas',
            isi: ['Terpakai ' + UI.v(UI.rp(pakai)) + ' dari anggaran ' + UI.v(UI.rp(lim)) + ' — lewat ' + UI.v(UI.rp(pakai - lim)) + '.'],
            aksi: { label: 'Geser alokasi →', href: 'anggaran.html' } });
        } else if (r.sisaHari > 0 && pakai / lim > 0.9) {
          out.push({ level: 'sedang', warna: 'org', topik: 'Pos anggaran',
            judul: 'Pos “' + DB.namaKategori(a.kategoriId) + '” tinggal ' + Math.round((1 - pakai / lim) * 100) + '%',
            isi: ['Sisa ' + UI.v(UI.rp(lim - pakai)) + ' untuk ' + r.sisaHari + ' hari lagi.'] });
        }
      });

      var keb = 0, tab = 0;
      DB.transaksiBulan(periode).forEach(function (t) {
        if (!DB.isKeluar(t)) return;
        var k = DB.kategori(t.kategoriId);
        var root = (k && k.induk) ? k.induk : t.kategoriId;
        if (KEBUTUHAN.indexOf(root) >= 0) keb += n(t.nominal);
        if (TABUNGAN.indexOf(root) >= 0) tab += n(t.nominal);
      });
      if (r.masuk) {
        var pKeb = keb / r.masuk * 100, pTab = (tab + r.bersih) / r.masuk * 100;
        var pIng = Math.max(0, 100 - pKeb - pTab);
        out.push({ level: 'info', warna: 'blu', topik: 'Kaidah 50/30/20',
          judul: 'Alokasimu ' + Math.round(pKeb) + ' / ' + Math.round(pIng) + ' / ' + Math.round(pTab),
          isi: ['Kebutuhan ' + UI.pct(pKeb) + ', keinginan ' + UI.pct(pIng) + ', tabungan & investasi ' + UI.pct(pTab) + ' dari pemasukan.',
                pTab >= 20 ? 'Porsi tabungan sudah di atas kaidah 50/30/20.' : 'Kaidah 50/30/20 menyarankan minimal 20% untuk tabungan & investasi.'] });
      }

      var diluar = sum(DB.transaksiBulan(periode).filter(function (t) {
        if (!DB.isKeluar(t)) return false;
        var k = DB.kategori(t.kategoriId);
        var root = (k && k.induk) ? k.induk : t.kategoriId;
        return !DB.anggaranBulan(periode).some(function (a) { return a.kategoriId === root || a.kategoriId === t.kategoriId; });
      }).map(function (t) { return n(t.nominal); }));
      if (diluar > 0) {
        out.push({ level: 'info', warna: 'blu', topik: 'Cakupan anggaran',
          judul: UI.rp(diluar) + ' belum masuk pos anggaran mana pun',
          isi: ['Selama ada pengeluaran di luar pos, proyeksi dan skor di atas memandang rendah pengeluaran sebenarnya.'],
          aksi: { label: 'Lengkapi pos anggaran →', href: 'anggaran.html' } });
      }

      var order = { tinggi: 0, sedang: 1, info: 2, baik: 3 };
      return out.sort(function (a, b) { return order[a.level] - order[b.level]; });
    },

    kumulatif: function (periode) {
      var hari = hariDalamBulan(periode), seri = [], akum = 0;
      var tx = DB.transaksiBulan(periode).filter(function (t) { return DB.isKeluar(t); });
      for (var d = 1; d <= hari; d++) {
        var key = periode + '-' + String(d).padStart(2, '0');
        tx.forEach(function (t) { if (t.tanggal === key) akum += n(t.nominal); });
        seri.push(akum);
      }
      return seri;
    },
    kumulatifRata: function (periode) {
      var hari = hariDalamBulan(periode), out = new Array(hari).fill(0), ada = 0;
      for (var i = 1; i <= 3; i++) {
        var p = prevPeriode(periode, i);
        var tx = DB.transaksiBulan(p).filter(function (t) { return DB.isKeluar(t); });
        if (!tx.length) continue;
        ada++;
        var akum = 0;
        for (var d = 1; d <= hari; d++) {
          var key = p + '-' + String(d).padStart(2, '0');
          tx.forEach(function (t) { if (t.tanggal === key) akum += n(t.nominal); });
          out[d - 1] += akum;
        }
      }
      return ada ? out.map(function (x) { return x / ada; }) : [];
    }
  };

  window.Insight = Insight;
})();
