#!/usr/bin/env bash
# Jalankan Claude Code dari repo ops dengan Joko sebagai manajer dan akses-baca ke repo aplikasi.
cd "$(dirname "$0")" || exit 1
[ -d ../ujion-tka-apps ] || { echo "Folder ../ujion-tka-apps tidak ditemukan (letakkan sejajar dengan ujion-ops)."; exit 1; }
exec claude --add-dir ../ujion-tka-apps --agent joko-manager "$@"
