#!/usr/bin/env bash
# Dashboard lokal: http://127.0.0.1:8790  (data dari folder ujion-ops ini)
cd "$(dirname "$0")" || exit 1
exec node dashboard/server.mjs . "$@"
