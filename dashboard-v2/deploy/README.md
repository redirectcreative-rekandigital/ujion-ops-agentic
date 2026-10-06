# Deploy VPS: systemd (opencode) + Coolify (dashboard)

Keputusan pemilik: **systemd host tetap** — container Coolify HANYA Next.js,
opencode serve jalan di host via systemd (tetap hidup setelah logout).

## Urutan pasang di VPS

### 1. Repo + opencode serve (sekali saja, root via SSH)

```bash
cd /root/proyek  # sesuaikan bila path berbeda
git clone <url-ujion-ops> ujion-ops
git clone <url-ujion-tka-apps> ujion-tka-apps
cd ujion-ops/dashboard-v2/deploy
sudo bash pasang-opencode-serve.sh
```

Script akan: instal opencode bila belum ada → buat `/etc/opencode-serve.env`
(password acak, `chmod 600`) → pasang + enable + start service → cek health.

### 2. Coolify (dashboard container)

1. Login Coolify → **New Resource** → **Docker Compose** (atau From Git: repo
   `ujion-ops`, compose location `/docker-compose.yml`).
2. Paste isi `ujion-ops/docker-compose.yml` (repo root) bila pakai Compose Empty.
3. Set Environment Variables dari `deploy/coolify-env.example`:
   - `OPENCODE_SERVER_PASSWORD` harus **SAMA** dengan isi
     `sudo cat /etc/opencode-serve.env` di host!
4. Set domain + SSL → **Deploy**.
5. Buka dashboard → masukkan PIN → badge header harus hijau
   ("opencode connected").

## Container → host

Service bind `127.0.0.1:4096` di host. Compose sudah berisi:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

dan container memakai `OPENCODE_SERVER_URL=http://host.docker.internal:4096`.

## Operasional

```bash
systemctl status opencode-serve.service
journalctl -u opencode-serve.service -f
sudo systemctl restart opencode-serve.service
curl http://127.0.0.1:4096/global/health
```

## [perlu verifikasi] di VPS

- Opsi auth `opencode serve --help`: bila ada flag password, tambahkan ke `ExecStart`
  di unit file lalu `daemon-reload` + restart. Laporkan output `--help` agar unit
  file disesuaikan.
- `WorkingDirectory=/root/proyek/ujion-ops`: sesuaikan bila path repo di VPS berbeda.
