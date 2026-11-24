/* Lapisan data: localStorage sebagai sumber utama, Google Sheet sebagai cadangan & sinkron. */
(function () {
  var LS = 'pf.data.v1', LSCFG = 'pf.cfg.v1', LSSEC = 'pf.sec.v1';
  var TABS = ['Transaksi', 'Kategori', 'SumberDana', 'Anggaran', 'Pengaturan'];

  var SEED = {
    Transaksi: [],
    Kategori: [
      ['k-makan','pengeluaran','Makanan & Minuman','','ic-food','orange'],
      ['k-transport','pengeluaran','Transportasi','','ic-car','slate'],
      ['k-transport-rawat','pengeluaran','Perawatan Kendaraan','k-transport','ic-car','slate'],
      ['k-transfer','pengeluaran','Transfer keluar','','ic-swap','slate'],
      ['k-hiburan','pengeluaran','Hiburan','','ic-play','blue'],
      ['k-bunga','pengeluaran','Bunga Canciku','k-hiburan','ic-heart','orange'],
      ['k-belanja','pengeluaran','Belanja','','ic-bag','teal'],
      ['k-dandan','pengeluaran','Dandan','k-belanja','ic-bag','teal'],
      ['k-pribadi','pengeluaran','Keperluan Pribadi','k-belanja','ic-bag','teal'],
      ['k-rt','pengeluaran','Peralatan Rumah Tangga','k-belanja','ic-home','teal'],
      ['k-tagihan','pengeluaran','Tagihan & Utilitas','','ic-bill','orange'],
      ['k-internet','pengeluaran','Tagihan internet','k-tagihan','ic-phone','orange'],
      ['k-sewa','pengeluaran','Sewa','k-tagihan','ic-home','orange'],
      ['k-belanjaa','pengeluaran','Belanjaa','','ic-bag','green'],
      ['k-hadiah','pengeluaran','Hadiah & Donasi','','ic-gift','green'],
      ['k-investasi','pengeluaran','Investasi','','ic-chart','blue'],
      ['k-keluarga','pengeluaran','Keluarga','','ic-home','green'],
      ['k-rumah','pengeluaran','Perawatan Rumah','k-keluarga','ic-home','green'],
      ['k-hewan','pengeluaran','Hewan Peliharaan','k-keluarga','ic-pet','orange'],
      ['k-gaji','pemasukan','Gaji','','ic-salary','green'],
      ['k-masuk','pemasukan','Transfer Masuk','','ic-swap','blue'],
      ['k-bonus','pemasukan','Bonus & Lainnya','','ic-gift','orange'],
      ['k-piutang','hutang','Piutang','','ic-wallet','blue'],
      ['k-hutang','hutang','Hutang','','ic-wallet','orange']
    ].map(function (r) { return { id:r[0], tipe:r[1], nama:r[2], induk:r[3], ikon:r[4], warna:r[5] }; }),
    SumberDana: [
      ['s-mandiri','Bank Mandiri','bank',1442097,'ic-bank','livin',true],
      ['s-octo','Bank OCTO','bank',2145600,'ic-bank','',true],
      ['s-tunai','Tunai — Dompet Saya','tunai',2568051,'ic-cash','',true],
      ['s-gopay','GoPay','ewallet',118300,'ic-wallet','gopay',true],
      ['s-emas','Tabungan Emas','investasi',2340000,'ic-gold','',true],
      ['s-haji','Tabungan Haji','investasi',4850000,'ic-star','',false]
    ].map(function (r) { return { id:r[0], nama:r[1], jenis:r[2], saldoAwal:r[3], ikon:r[4], logo:r[5], tampilDiTotal:r[6] }; }),
    Anggaran: [
      ['a-makan','k-makan',1200000],['a-keluarga','k-keluarga',1200000],
      ['a-investasi','k-investasi',1500000],['a-transport','k-transport',500000],
      ['a-tagihan','k-tagihan',350000],['a-bunga','k-bunga',200000],
      ['a-belanjaa','k-belanjaa',300000],['a-hadiah','k-hadiah',460000]
    ].map(function (r) { return { id:r[0], periode:'2026-11', kategoriId:r[1], jumlah:r[2] }; }),
    Pengaturan: [
      { key:'nama', value:'Ali Irawan' },
      { key:'mataUang', value:'IDR' },
      { key:'awalPeriode', value:'1' },
      { key:'targetSavingsRate', value:'20' },
      { key:'sembunyikanAngkaDefault', value:'true' }
    ]
  };

  function read(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  var DB = {
    state: null,
    cfg: read(LSCFG, { url: '', token: '' }),
    sec: read(LSSEC, {}),

    load: function () {
      this.state = read(LS, null);
      if (!this.state) { this.state = JSON.parse(JSON.stringify(SEED)); write(LS, this.state); }
      TABS.forEach(function (t) { if (!DB.state[t]) DB.state[t] = []; });
      return this.state;
    },
    save: function (opts) {
      write(LS, this.state);
      if (!(opts && opts.noPush)) this.queuePush();
    },
    reset: function () { this.state = JSON.parse(JSON.stringify(SEED)); write(LS, this.state); },

    /* ---- konfigurasi sinkron ---- */
    setConfig: function (url, token) { this.cfg = { url: url || '', token: token || '' }; write(LSCFG, this.cfg); },
    connected: function () { return !!(this.cfg.url && this.cfg.token); },

    /* ---- rahasia (password e-statement) — hanya di browser ini ---- */
    getSecret: function (k) { return this.sec[k] || ''; },
    setSecret: function (k, v) { if (v) this.sec[k] = v; else delete this.sec[k]; write(LSSEC, this.sec); },
    listSecrets: function () { return Object.keys(this.sec); },

    /* ---- jaringan ---- */
    call: function (action, payload) {
      if (!this.connected()) return Promise.reject(new Error('Sheet belum dihubungkan.'));
      var body = Object.assign({ action: action, token: this.cfg.token }, payload || {});
      return fetch(this.cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error(j.error || 'Gagal.');
        return j;
      });
    },
    ping: function () { return this.call('ping'); },
    pull: function () {
      var self = this;
      return this.call('pull').then(function (j) {
        TABS.forEach(function (t) { if (j.data[t]) self.state[t] = j.data[t]; });
        self.save({ noPush: true });
        return j.data;
      });
    },
    push: function () {
      var self = this, chain = Promise.resolve();
      TABS.forEach(function (t) {
        chain = chain.then(function () { return self.call('replace', { sheet: t, rows: self.state[t] }); });
      });
      return chain;
    },
    _t: null,
    queuePush: function () {
      if (!this.connected()) return;
      var self = this;
      clearTimeout(this._t);
      this._t = setTimeout(function () {
        self.push().then(function () { if (window.UI) UI.toast('Tersinkron ke Google Sheet'); })
                   .catch(function (e) { if (window.UI) UI.toast('Sinkron gagal: ' + e.message); });
      }, 1500);
    },

    /* ---- query ---- */
    kategori: function (id) { return this.state.Kategori.filter(function (k) { return k.id === id; })[0] || null; },
    sumber: function (id) { return this.state.SumberDana.filter(function (s) { return s.id === id; })[0] || null; },
    namaKategori: function (id) {
      var k = this.kategori(id); if (!k) return 'Tanpa kategori';
      if (k.induk) { var p = this.kategori(k.induk); if (p) return p.nama + ' › ' + k.nama; }
      return k.nama;
    },
    ikonKategori: function (id) { var k = this.kategori(id); return (k && k.ikon) || 'ic-note'; },
    setting: function (key, fallback) {
      var r = this.state.Pengaturan.filter(function (p) { return p.key === key; })[0];
      return r ? r.value : fallback;
    },
    setSetting: function (key, value) {
      var r = this.state.Pengaturan.filter(function (p) { return p.key === key; })[0];
      if (r) r.value = value; else this.state.Pengaturan.push({ key: key, value: value });
    },
    sumberTampil: function () {
      return this.state.SumberDana.filter(function (s) { return s.tampilDiTotal === true || s.tampilDiTotal === 'TRUE'; });
    },
    sumberTersembunyi: function () {
      return this.state.SumberDana.filter(function (s) { return !(s.tampilDiTotal === true || s.tampilDiTotal === 'TRUE'); });
    },
    /* jenis transaksi: pengeluaran | pemasukan | transfer | piutang | hutang
       - transfer : pindah antar dompet sendiri, bukan pengeluaran maupun pemasukan
       - piutang  : uang keluar tapi ditagih balik, bukan pengeluaran
       - hutang   : uang masuk tapi harus dikembalikan, bukan pemasukan          */
    isKeluar: function (t) { return (t.tipe || 'pengeluaran') === 'pengeluaran'; },
    isMasuk:  function (t) { return t.tipe === 'pemasukan'; },
    isNetral: function (t) { return ['transfer', 'piutang', 'hutang', 'pelunasan', 'pembayaran'].indexOf(t.tipe) >= 0; },
    /* pelunasan  : piutangku dikembalikan — uang masuk, bukan pemasukan
       pembayaran : aku melunasi hutang   — uang keluar, bukan pengeluaran */

    /* daftar pelunasan disimpan ringkas: "id:nominal|id:nominal" */
    uraiLunasi: function (v) {
      if (Array.isArray(v)) return v;
      return String(v || '').split('|').filter(Boolean).map(function (s) {
        var q = s.split(':');
        return { id: q[0], nominal: Number(q[1]) || 0 };
      });
    },
    rangkumLunasi: function (arr) {
      return (arr || []).filter(function (l) { return l.id && l.nominal; })
        .map(function (l) { return l.id + ':' + Math.round(l.nominal); }).join('|');
    },
    /* berapa sisa sebuah piutang/hutang yang belum ditutup */
    sisaTagihan: function (t) {
      var self = this, tutup = 0;
      this.state.Transaksi.forEach(function (x) {
        self.uraiLunasi(x.lunasi).forEach(function (l) { if (l.id === t.id) tutup += l.nominal; });
      });
      return Math.max(0, (Number(t.nominal) || 0) - tutup);
    },
    tagihanTerbuka: function (jenis) {
      var self = this;
      return this.state.Transaksi.filter(function (t) { return t.tipe === jenis; })
        .map(function (t) { return { tx: t, sisa: self.sisaTagihan(t) }; })
        .filter(function (r) { return r.sisa > 0; })
        .sort(function (a, b) { return String(a.tx.tanggal).localeCompare(String(b.tx.tanggal)); });
    },
    piutangTerbuka: function () { return this.tagihanTerbuka('piutang'); },
    hutangTerbuka:  function () { return this.tagihanTerbuka('hutang'); },
    totalPiutang: function () { return this.piutangTerbuka().reduce(function (a, r) { return a + r.sisa; }, 0); },
    totalHutang:  function () { return this.hutangTerbuka().reduce(function (a, r) { return a + r.sisa; }, 0); },

    saldo: function (sumberId) {
      var s = this.sumber(sumberId);
      var awal = Number(s ? s.saldoAwal : 0) || 0;
      this.state.Transaksi.forEach(function (t) {
        var n = Number(t.nominal) || 0;
        if (t.tipe === 'transfer') {
          if (t.sumberDanaId === sumberId) awal -= n;
          if (t.tujuanDanaId === sumberId) awal += n;
          return;
        }
        if (t.sumberDanaId !== sumberId) return;
        var masuk = ['pemasukan', 'hutang', 'pelunasan'].indexOf(t.tipe) >= 0;
        awal += masuk ? n : -n;
      });
      return awal;
    },
    totalAset: function () {
      var self = this, tot = 0;
      this.sumberTampil().forEach(function (s) { tot += self.saldo(s.id); });
      return tot;
    },
    bulan: function (t) { return String(t.tanggal || '').slice(0, 7); },
    transaksiBulan: function (periode) {
      var self = this;
      return this.state.Transaksi.filter(function (t) { return self.bulan(t) === periode; })
        .sort(function (a, b) { return String(b.tanggal).localeCompare(String(a.tanggal)); });
    },
    anggaranBulan: function (periode) {
      return this.state.Anggaran.filter(function (a) { return a.periode === periode; });
    },

    /* ---- mutasi ---- */
    uid: function (p) { return (p || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    hashTx: function (tgl, nominal, ket, bagian) {
      var h = [String(tgl), String(Math.round(Number(nominal) || 0)), String(ket || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 28)].join('|');
      return bagian ? h + '#' + bagian : h;
    },
    /* hash induk: dipakai supaya satu baris PDF yang sudah dipecah tidak terbaca ulang */
    hashInduk: function (tgl, nominal, ket) { return this.hashTx(tgl, nominal, ket); },
    adaInduk: function (h) {
      return this.state.Transaksi.some(function (t) { return t.hashInduk === h; });
    },
    tambahTransaksi: function (t) {
      t.id = t.id || this.uid('t');
      t.tipe = t.tipe || 'pengeluaran';
      t.tujuanDanaId = t.tujuanDanaId || '';
      t.grupId = t.grupId || '';
      t.hashInduk = t.hashInduk || '';
      if (t.lunasi && typeof t.lunasi !== 'string') t.lunasi = this.rangkumLunasi(t.lunasi);
      t.lunasi = t.lunasi || '';
      t.hash = t.hash || this.hashTx(t.tanggal, t.nominal, t.catatan);
      t.dibuat = new Date().toISOString();
      this.state.Transaksi.push(t);
      this.save();
      return t;
    },
    hapusTransaksi: function (id) {
      this.state.Transaksi = this.state.Transaksi.filter(function (t) { return t.id !== id; });
      this.save();
    },
    adaHash: function (h) {
      return this.state.Transaksi.some(function (t) { return t.hash === h; });
    }
  };

  window.DB = DB;
})();
