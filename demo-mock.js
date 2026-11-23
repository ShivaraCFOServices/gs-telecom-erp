/* Browser mock of the Google Apps Script services, so the real backend runs inside the browser for DEMO mode.
   This file is concatenated with ../backend/*.gs by build/build-demo.js into js/demo-backend.js. */
var __store = { sheets: {}, order: [] }, __storeKey = 'gs_demo_db';
function __persist() { try { localStorage.setItem(__storeKey, JSON.stringify(__store)); } catch (e) { /* quota */ } }
function __makeSheet(name) {
  var rows = __store.sheets[name] = __store.sheets[name] || [];
  var sh = {
    getName: function () { return name; }, getLastRow: function () { return rows.length; }, getLastColumn: function () { var m = 0; rows.forEach(function (r) { if (r.length > m) m = r.length; }); return m; }, setFrozenRows: function () { return sh; },
    getRange: function (r, c, nr, nc) {
      nr = nr || 1; nc = nc || 1;
      var rng = {
        setValues: function (vals) { for (var i = 0; i < nr; i++) { var rr = r - 1 + i; while (rows.length <= rr) rows.push([]); for (var j = 0; j < nc; j++) rows[rr][c - 1 + j] = vals[i][j]; } __persist(); return rng; },
        getValues: function () { var out = []; for (var i = 0; i < nr; i++) { var src = rows[r - 1 + i] || [], line = []; for (var j = 0; j < nc; j++) line.push(src[c - 1 + j] === undefined || src[c - 1 + j] === null ? '' : src[c - 1 + j]); out.push(line); } return out; },
        setFontWeight: function () { return rng; }, setBackground: function () { return rng; }, setFontColor: function () { return rng; }
      };
      return rng;
    }
  };
  return sh;
}
var __ss = {
  getId: function () { return "demo"; }, getUrl: function () { return ""; },
  getSheetByName: function (n) { return __store.sheets[n] ? __makeSheet(n) : null; },
  insertSheet: function (n) { __store.sheets[n] = __store.sheets[n] || []; if (__store.order.indexOf(n) < 0) __store.order.push(n); __persist(); return __makeSheet(n); },
  getSheets: function () { return __store.order.map(__makeSheet); },
  deleteSheet: function (sh) { delete __store.sheets[sh.getName()]; __store.order = __store.order.filter(function (n) { return n !== sh.getName(); }); __persist(); }
};
function __pad(n) { return String(n).length < 2 ? '0' + n : String(n); }
var __cache = {};
function __sha256(str) { // compact synchronous SHA-256 (returns signed-byte array like Apps Script)
  function R(n, x) { return (x >>> n) | (x << (32 - n)); }
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var bytes = unescape(encodeURIComponent(str)).split('').map(function (c) { return c.charCodeAt(0); });
  var l = bytes.length * 8; bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
  for (var i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (l >>> (i * 8)) & 0xff);
  for (var off = 0; off < bytes.length; off += 64) {
    var w = [];
    for (var t = 0; t < 16; t++) w[t] = (bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3];
    for (t = 16; t < 64; t++) { var s0 = R(7, w[t - 15]) ^ R(18, w[t - 15]) ^ (w[t - 15] >>> 3), s1 = R(17, w[t - 2]) ^ R(19, w[t - 2]) ^ (w[t - 2] >>> 10); w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0; }
    var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
    for (t = 0; t < 64; t++) { var S1 = R(6, e) ^ R(11, e) ^ R(25, e), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[t] + w[t]) | 0, S0 = R(2, a) ^ R(13, a) ^ R(22, a), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0; }
    H = [(H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + hh) | 0];
  }
  var out = [];
  H.forEach(function (x) { for (var i = 3; i >= 0; i--) { var bb = (x >>> (i * 8)) & 0xff; out.push(bb > 127 ? bb - 256 : bb); } });
  return out;
}
var __props = {};
var PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return __props[k] || null; }, setProperty: function (k, v) { __props[k] = String(v); return this; } }; } };
var SpreadsheetApp = { openById: function () { return __ss; }, create: function () { return __ss; }, getActiveSpreadsheet: function () { return __ss; }, flush: function () { __persist(); } };
var CacheService = { getScriptCache: function () { return { get: function (k) { return __cache[k] || null; }, put: function (k, v) { __cache[k] = v; }, remove: function (k) { delete __cache[k]; }, removeAll: function (ks) { ks.forEach(function (k) { delete __cache[k]; }); } }; } };
var LockService = { getScriptLock: function () { return { waitLock: function () { }, releaseLock: function () { } }; } };
var Utilities = {
  formatDate: function (d, tz, fmt) { if (!(d instanceof Date)) d = new Date(d); var y = d.getFullYear(), M = __pad(d.getMonth() + 1), D = __pad(d.getDate()); if (fmt === 'yyyy-MM-dd') return y + '-' + M + '-' + D; return y + '-' + M + '-' + D + 'T' + __pad(d.getHours()) + ':' + __pad(d.getMinutes()) + ':' + __pad(d.getSeconds()); },
  getUuid: function () { return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })); },
  DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
  computeDigest: function (alg, str) { return __sha256(str); },
  base64Encode: function (b) { return btoa(String.fromCharCode.apply(null, b.map(function (x) { return x < 0 ? x + 256 : x; }))); },
  newBlob: function () { throw new Error('PDF not available in demo mode'); }
};
var Session = { getScriptTimeZone: function () { return 'Asia/Kolkata'; }, getActiveUser: function () { return { getEmail: function () { return 'demo@example.com'; } }; } };
var ScriptApp = { getProjectTriggers: function () { return []; }, newTrigger: function () { return { timeBased: function () { return { atHour: function () { return { everyDays: function () { return { create: function () { } }; } }; } }; } }; } };
var ContentService = { createTextOutput: function (tx) { return { _t: tx, setMimeType: function () { return this; } }; }, MimeType: { JSON: 'json' } };
var HtmlService = { createTemplateFromFile: function () { throw new Error('no PDF in demo'); }, createHtmlOutput: function (x) { return x; } };
var DriveApp = { getFoldersByName: function () { return { hasNext: function () { return false; } }; }, createFolder: function () { return {}; }, getFilesByName: function () { return { hasNext: function () { return false; } }; } };
var MailApp = { sendEmail: function (o) { console.log('[demo mail]', o.subject); } };
var Logger = { log: function (m) { console.log('[Logger]', m); } };
