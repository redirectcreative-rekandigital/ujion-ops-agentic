#!/bin/bash
# Pasang opencode serve sebagai systemd service (permanen, hidup setelah logout).
# Jalankan di VPS sebagai root:  sudo bash pasang-opencode-serve.sh
# Idempoten: aman dijalankan ulang.
set -e

UNIT_SRC="$(dirname "$0")/opencode-serve.service"
UNIT_DST="/etc/systemd/system/opencode-serve.service"
ENV_FILE="/etc/opencode-serve.env"

if [ "$(id -u)" -ne 0 ]; then
  echo "Jalankan sebagai root (sudo)." >&2
  exit 1
fi

# 1. Pastikan opencode terinstal
if ! command -v opencode >/dev/null 2>&1; then
  echo "[1/5] opencode belum ada, menginstal..."
  npm install -g opencode@latest
else
  echo "[1/5] opencode sudah ada: $(command -v opencode)"
fi

# Samakan path biner dengan ExecStart di unit file
BIN="$(command -v opencode)"
if [ "$BIN" != "/usr/local/bin/opencode" ]; then
  echo "      biner di $BIN — sesuaikan ExecStart di $UNIT_DST bila perlu."
fi

# 2. Password serve (dibuat sekali, dipakai dashboard sebagai OPENCODE_SERVER_PASSWORD)
if [ ! -f "$ENV_FILE" ]; then
  echo "[2/5] membuat $ENV_FILE ..."
  PASS="$(openssl rand -base64 24)"
  printf 'OPENCODE_SERVER_PASSWORD=%s\n' "$PASS" > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "      PASSWORD BARU (simpan ke Coolify env OPENCODE_SERVER_PASSWORD):"
  echo "      $PASS"
else
  echo "[2/5] $ENV_FILE sudah ada (password tidak diubah)."
  echo "      Lihat password: sudo cat $ENV_FILE"
fi

# 3. Pasang unit file
echo "[3/5] memasang unit file..."
cp "$UNIT_SRC" "$UNIT_DST"
systemctl daemon-reload

# 4. Enable + start (permanen: jalan saat boot & setelah logout)
echo "[4/5] enable + start..."
systemctl enable --now opencode-serve.service

# 5. Verifikasi
echo "[5/5] status:"
systemctl --no-pager status opencode-serve.service | head -12
echo "---"
echo "Health check:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:4096/global/health || true
echo "Selesai. Cek log: journalctl -u opencode-serve.service -f"
