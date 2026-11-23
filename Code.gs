/**
 * Personal Finance — Ali Irawan
 * Backend Google Apps Script untuk situs statis di GitHub Pages.
 *
 * Semua permintaan WAJIB membawa token yang cocok dengan Script Property "TOKEN".
 * URL Web App boleh bocor; tanpa token dia tidak bisa apa-apa.
 *
 * Cara pasang: lihat README.md di repo.
 */

var SPREADSHEET_ID = '10Fo582SHL_8Dn70HkwmZtG10zqOfFIj3gXp7KWfzYuk';
var SHEETS = ['Transaksi', 'Kategori', 'SumberDana', 'Anggaran', 'Pengaturan'];

function doGet(e) {
  return handle(e, (e && e.parameter) || {});
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'Body bukan JSON yang sah.' });
  }
  return handle(e, body);
}

function handle(e, p) {
  try {
    var expected = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!expected) return json({ ok: false, error: 'TOKEN belum diset di Script Properties.' });
    if (String(p.token || '') !== String(expected)) return json({ ok: false, error: 'Token salah.' });

    var action = String(p.action || 'pull');
    if (action === 'ping')      return json({ ok: true, pong: true, waktu: new Date().toISOString() });
    if (action === 'pull')      return json({ ok: true, data: pullAll() });
    if (action === 'replace')   return json({ ok: true, data: replaceSheet(p.sheet, p.rows) });
    if (action === 'append')    return json({ ok: true, data: appendRows(p.sheet, p.rows) });
    return json({ ok: false, error: 'Action tidak dikenal: ' + action });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function book() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function readSheet(name) {
  var sh = book().getSheetByName(name);
  if (!sh) return { header: [], rows: [] };
  var values = sh.getDataRange().getValues();
  if (!values.length) return { header: [], rows: [] };
  var header = values.shift().map(String);
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (r.join('') === '') continue;
    var o = {};
    for (var c = 0; c < header.length; c++) o[header[c]] = normalise(r[c]);
    rows.push(o);
  }
  return { header: header, rows: rows };
}

function normalise(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (v === 'TRUE' || v === true) return true;
  if (v === 'FALSE' || v === false) return false;
  return v;
}

function pullAll() {
  var out = {};
  for (var i = 0; i < SHEETS.length; i++) out[SHEETS[i]] = readSheet(SHEETS[i]).rows;
  return out;
}

function guardName(name) {
  if (SHEETS.indexOf(String(name)) === -1) throw new Error('Sheet tidak diizinkan: ' + name);
  return String(name);
}

/** Tulis ulang seluruh isi sebuah sheet (header dipertahankan). */
function replaceSheet(name, rows) {
  name = guardName(name);
  rows = rows || [];
  var sh = book().getSheetByName(name);
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String).filter(String);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, header.length).clearContent();
  if (!rows.length) return { ditulis: 0 };
  var matrix = rows.map(function (o) {
    return header.map(function (h) { return o[h] === undefined || o[h] === null ? '' : o[h]; });
  });
  sh.getRange(2, 1, matrix.length, header.length).setValues(matrix);
  return { ditulis: matrix.length };
}

/** Tambah baris ke bawah tanpa menyentuh yang sudah ada. */
function appendRows(name, rows) {
  name = guardName(name);
  rows = rows || [];
  if (!rows.length) return { ditambah: 0 };
  var sh = book().getSheetByName(name);
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String).filter(String);
  var matrix = rows.map(function (o) {
    return header.map(function (h) { return o[h] === undefined || o[h] === null ? '' : o[h]; });
  });
  sh.getRange(sh.getLastRow() + 1, 1, matrix.length, header.length).setValues(matrix);
  return { ditambah: matrix.length };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
