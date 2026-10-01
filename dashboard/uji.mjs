// Uji otomatis server dashboard (U14-U16 + kontrol keamanan, lihat docs/PENGUJIAN.md).
// Pakai: node dashboard/uji.mjs   (menjalankan server sementara di port 8791 dengan data contoh)
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, 'contoh');
const port = +(process.env.UJI_PORT || 8791);
const boardPath = path.join(root, 'tugas', 'BOARD.md');
const queuePath = path.join(root, 'tugas', 'ANTRIAN-PERSETUJUAN.md');
const needsPath = path.join(root, 'tugas', 'KEBUTUHAN.md');
const simpan = {board: fs.readFileSync(boardPath, 'utf8'), queue: fs.readFileSync(queuePath, 'utf8'), needs: fs.readFileSync(needsPath, 'utf8')};

const hasil = []; let gagal = 0;
const cek = (id, nama, ok, ket = '') => { hasil.push([id, nama, ok ? 'LULUS' : 'GAGAL', ket]); if (!ok) gagal++; };

const req = (method, p, headers = {}, body = null) => new Promise(resolve => {
  const r = http.request({host: '127.0.0.1', port, path: p, method, headers}, res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({code: res.statusCode, body: d}));
  });
  r.on('error', e => resolve({code: 0, body: String(e)}));
  if (body != null) r.write(body);
  r.end();
});
const raw = teks => new Promise(resolve => {
  const s = net.connect(port, '127.0.0.1', () => s.write(teks));
  let d = ''; s.on('data', c => d += c); s.on('close', () => resolve(d)); s.on('error', () => resolve(''));
});
const baris = md => md.split('\n').filter(l => l.trim().startsWith('|'))
  .map(l => l.trim().replace(/^\||\|$/g, '').split('|')[0].trim())
  .filter(c => c && !/^:?-+:?$/.test(c) && !/^id$/i.test(c) && !/^\(kosong\)$/i.test(c)).length;
const pulihkan = () => { fs.writeFileSync(boardPath, simpan.board); fs.writeFileSync(queuePath, simpan.queue); fs.writeFileSync(needsPath, simpan.needs); };

const server = spawn(process.execPath, [path.join(here, 'server.mjs'), root], {env: {...process.env, PORT: String(port)}, stdio: 'ignore'});
try {
  let siap = false;
  for (let i = 0; i < 40 && !siap; i++) { const r = await req('GET', '/api/state'); siap = r.code === 200; if (!siap) await new Promise(x => setTimeout(x, 100)); }
  cek('U14', 'Server memuat dan membaca data', siap);
  if (siap) {
    const s = JSON.parse((await req('GET', '/api/state')).body);
    cek('U14', 'Jumlah tugas cocok dengan BOARD.md', s.tasks.length === baris(simpan.board), `${s.tasks.length} vs ${baris(simpan.board)}`);
    cek('U14', 'Jumlah kebutuhan cocok dengan KEBUTUHAN.md', s.needs.length === baris(simpan.needs), `${s.needs.length} vs ${baris(simpan.needs)}`);
    cek('U14', 'Jumlah antrian cocok dengan ANTRIAN-PERSETUJUAN.md', s.queue.length === baris(simpan.queue), `${s.queue.length} vs ${baris(simpan.queue)}`);
    cek('U14', 'Daftar berkas hasil berisi marketing/riset', s.files.some(f => f.p === 'marketing/riset/kompetitor-ringkas.md'));

    const beranda = await req('GET', '/');
    cek('U17', 'Halaman dashboard terkirim sebagai HTML', beranda.code === 200 && /<!doctype html>/i.test(beranda.body));

    const baca = await req('GET', '/api/file?p=' + encodeURIComponent('marketing/riset/kompetitor-ringkas.md'));
    cek('U17', 'Baca berkas .md yang diizinkan', baca.code === 200 && baca.body.includes('komp'));

    const tulis = await req('POST', '/api/set', {'content-type': 'application/json'}, JSON.stringify({file: 'board', id: 'T2', status: 'Selesai'}));
    const boardBaru = fs.readFileSync(boardPath, 'utf8');
    cek('U15', 'Tombol status mengubah Status T2', tulis.code === 200 && /\| T2 \|.*\| Selesai \|/.test(boardBaru));
    cek('U15', 'Baris T2 selain kolom Status tidak berubah', boardBaru.split('\n').filter(l => l.includes('| T2 |'))[0].split('|').slice(1, 5).join('|') === simpan.board.split('\n').filter(l => l.includes('| T2 |'))[0].split('|').slice(1, 5).join('|'));
    cek('U15', 'Berkas lain tidak tersentuh', fs.readFileSync(queuePath, 'utf8') === simpan.queue && fs.readFileSync(needsPath, 'utf8') === simpan.needs);

    const q = await req('POST', '/api/set', {'content-type': 'application/json'}, JSON.stringify({file: 'queue', id: 'A1', status: 'Disetujui'}));
    cek('U15', 'Antrian A1 bisa disetujui', q.code === 200 && /\| A1 \|.*\| Disetujui \|/.test(fs.readFileSync(queuePath, 'utf8')));

    const idSalah = await req('POST', '/api/set', {'content-type': 'application/json'}, JSON.stringify({file: 'board', id: 'T999', status: 'Selesai'}));
    const nilaiSalah = await req('POST', '/api/set', {'content-type': 'application/json'}, JSON.stringify({file: 'board', id: 'T2', status: 'Hancur'}));
    const fileSalah = await req('POST', '/api/set', {'content-type': 'application/json'}, JSON.stringify({file: '../../PRD', id: 'T2', status: 'Selesai'}));
    cek('U16', 'ID tidak dikenal ditolak (400)', idSalah.code === 400);
    cek('U16', 'Nilai status di luar daftar putih ditolak (400)', nilaiSalah.code === 400);
    cek('U16', 'Nama file di luar daftar putih ditolak (400)', fileSalah.code === 400);

    const hostAsing = await raw(`GET / HTTP/1.1\r\nHost: contoh.example.com\r\nConnection: close\r\n\r\n`);
    cek('U16', 'Host asing ditolak (421)', /^HTTP\/1\.1 421/.test(hostAsing));
    const hostLokal = await raw(`GET /api/state HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`);
    cek('U16', 'Host lokal diterima (200)', /^HTTP\/1\.1 200/.test(hostLokal));

    const ct = await req('POST', '/api/set', {'content-type': 'text/plain'}, '{"file":"board"}');
    cek('U16', 'POST non-JSON ditolak (403)', ct.code === 403);
    const origin = await req('POST', '/api/set', {'content-type': 'application/json', origin: 'http://evil.example'}, JSON.stringify({file: 'board', id: 'T2', status: 'Selesai'}));
    cek('U16', 'POST lintas-origin ditolak (403)', origin.code === 403);

    const traversal = await req('GET', '/api/file?p=' + encodeURIComponent('../../PRD.md'));
    const rahasia = await req('GET', '/api/file?p=' + encodeURIComponent('../../.claude/settings.json'));
    const nonMd = await req('GET', '/api/file?p=' + encodeURIComponent('tugas/BOARD.md.bak'));
    cek('U16', 'Path traversal ditolak (403)', traversal.code === 403);
    cek('U16', 'Berkas di luar tiga folder ditolak (403)', rahasia.code === 403);
    cek('U16', 'Berkas non-.md ditolak (403)', nonMd.code === 403);
  }
} finally {
  pulihkan();
  server.kill();
}

console.log('');
for (const [id, nama, status, ket] of hasil) console.log(`${status === 'LULUS' ? 'LULUS' : 'GAGAL'}  ${id}  ${nama}${ket ? `  (${ket})` : ''}`);
console.log(`\n${hasil.length - gagal}/${hasil.length} lulus`);
process.exit(gagal ? 1 : 0);
