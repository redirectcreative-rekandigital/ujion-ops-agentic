# Dashboard Kantor Ujion
Lokal, Node >= 18, tanpa dependensi. Dari root ujion-ops: `./dashboard.sh` (http://127.0.0.1:8790).
Data contoh: `node dashboard/server.mjs dashboard/contoh`. Port lain: `PORT=9000 ./dashboard.sh`.
Aman: hanya 127.0.0.1; hanya membaca tugas/ marketing/ maintenance/ (*.md); hanya kolom Status yang bisa diubah lewat tombol.
Uji otomatis (U14-U16): `node dashboard/uji.mjs` -> menjalankan server sementara dengan data contoh dan memeriksa endpoint + kontrol keamanan.
