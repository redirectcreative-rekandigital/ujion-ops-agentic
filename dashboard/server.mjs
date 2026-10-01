// Dashboard Kantor Ujion - lokal, tanpa dependensi (Node >= 18). Pakai: node server.mjs <folder-repo-ujion>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const root = path.resolve(process.argv[2] || process.cwd()), port = +process.env.PORT || 8790;
const here = path.dirname(fileURLToPath(import.meta.url));
const F = {board:'tugas/BOARD.md', needs:'tugas/KEBUTUHAN.md', queue:'tugas/ANTRIAN-PERSETUJUAN.md', inbox:'tugas/INBOX.md', dec:'tugas/KEPUTUSAN.md'};
const OK = ['Belum','Jalan','Menunggu persetujuan','Selesai','Terblokir','Terbuka','Terjawab','Menunggu','Disetujui','Ditolak','Sudah dieksekusi'];
const K = [[/dari agent|^agent/i,'agent'],[/^id/i,'id'],[/^tugas|^barang|^keputusan/i,'judul'],[/yang dibutuhkan/i,'butuh'],[/alasan/i,'alasan'],[/format/i,'format'],[/menghambat/i,'menghambat'],[/bergantung/i,'dep'],[/keluaran|^file/i,'file'],[/kanal/i,'kanal'],[/jadwal/i,'jadwal'],[/^status/i,'status'],[/hasil/i,'hasil']];
const key = h => (K.find(([r]) => r.test(h)) || [0, h.toLowerCase()])[1];
const rd = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return ''; } };
const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
function parse(md) { // tabel + daftar poin per bagian
  const rows = [], lists = {}; let sec = '', hd = null;
  for (const l of md.split('\n')) {
    if (/^#{1,3} /.test(l)) { sec = l.replace(/^#+\s*/, '').trim(); hd = null; continue; }
    if (l.trim().startsWith('|')) {
      const c = cells(l);
      if (!hd) { hd = c.map(key); continue; }
      if (c.every(x => /^:?-+:?$/.test(x))) continue;
      if (/^[(-]/.test(c[0]) || !c[0]) continue;
      const r = {sec}; hd.forEach((h, i) => r[h] = c[i] || ''); rows.push(r);
    } else { hd = null; const m = l.match(/^\s*[-*] (.+)/); if (m && !/^\(kosong\)/.test(m[1])) (lists[sec] ||= []).push(m[1]); }
  }
  return {rows, lists};
}
function recent() {
  const out = [];
  const walk = (d, depth) => { let es = []; try { es = fs.readdirSync(d, {withFileTypes: true}); } catch {}
    for (const e of es) { const p = path.join(d, e.name);
      if (e.isDirectory() && depth < 3) walk(p, depth + 1);
      else if (e.name.endsWith('.md') && !/^(BOARD|KEBUTUHAN|INBOX|KEPUTUSAN|ANTRIAN)/.test(e.name))
        out.push({p: path.relative(root, p).split(path.sep).join('/'), t: fs.statSync(p).mtimeMs}); } };
  for (const d of ['marketing', 'maintenance', 'tugas']) walk(path.join(root, d), 0);
  return out.sort((a, b) => b.t - a.t).slice(0, 30);
}
function state() {
  const b = parse(rd(F.board)), n = parse(rd(F.needs)), q = parse(rd(F.queue)), i = parse(rd(F.inbox)), d = parse(rd(F.dec));
  const ow = Object.entries(b.lists).filter(([s]) => /pemilik/i.test(s)).flatMap(([, v]) => v);
  const ib = i.lists['Belum dipilah'] || [];
  return {project: path.basename(root), tasks: b.rows, needs: n.rows, queue: q.rows, owner: ow, inbox: ib, decisions: d.rows, files: recent(), ts: Date.now()};
}
function setStatus(file, id, val) {
  if (!F[file] || !OK.includes(val)) throw new Error('ditolak');
  const fp = path.join(root, F[file]); const lines = fs.readFileSync(fp, 'utf8').split('\n'); let hd = null, hit = false;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) { hd = null; continue; }
    const c = cells(lines[i]);
    if (!hd) { hd = c.map(key); continue; }
    const si = hd.indexOf('status');
    if (c[0] === id && si >= 0) { c[si] = val; lines[i] = '| ' + c.join(' | ') + ' |'; hit = true; }
  }
  if (!hit) throw new Error('baris tidak ditemukan');
  fs.writeFileSync(fp, lines.join('\n'));
}
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, {'content-type': type + '; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
http.createServer((req, res) => {
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) return send(res, 421, {error: 'host'});
  const u = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && u.pathname === '/') return send(res, 200, fs.readFileSync(path.join(here, 'index.html'), 'utf8'), 'text/html');
    if (req.method === 'GET' && u.pathname === '/api/state') return send(res, 200, state());
    if (req.method === 'GET' && u.pathname === '/api/file') {
      const p = path.resolve(root, u.searchParams.get('p') || '');
      if (!/^(marketing|maintenance|tugas)$/.test(path.relative(root, p).split(path.sep)[0]) || !p.endsWith('.md') || !p.startsWith(root + path.sep)) return send(res, 403, {error: 'dilarang'});
      return send(res, 200, fs.readFileSync(p, 'utf8'), 'text/plain');
    }
    if (req.method === 'POST' && u.pathname === '/api/set') {
      if (!/application\/json/.test(req.headers['content-type'] || '') || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) return send(res, 403, {error: 'origin'});
      let b = ''; req.on('data', c => { b += c; if (b.length > 2000) req.destroy(); });
      return req.on('end', () => { try { const j = JSON.parse(b); setStatus(j.file, String(j.id), j.status); send(res, 200, {ok: true}); } catch (e) { send(res, 400, {error: e.message}); } });
    }
    send(res, 404, {error: 'tidak ada'});
  } catch (e) { send(res, 500, {error: e.message}); }
}).listen(port, '127.0.0.1', () => console.log(`Kantor Ujion: http://127.0.0.1:${port}  (membaca ${root})`));
