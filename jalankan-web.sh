#!/usr/bin/env bash
# Menjalankan sistem sertifikat.
#
# Dua mode, ditentukan otomatis dari apps/web/.env :
#
#   LOKAL   — tidak ada .env (atau ALAMAT_REGISTRI kosong).
#             Menyalakan Anvil, deploy kontrak, pakai blockchain lokal.
#
#   JARINGAN— .env berisi RPC_URL + ALAMAT_REGISTRI.
#             Memakai jaringan sungguhan (mis. Monad testnet). Anvil tidak dinyalakan.
#
# Sistem dimulai KOSONG. Batch dibuat lewat /admin/batch/baru.
#
# Opsi:
#   BERSIH=1 ./jalankan-web.sh   hapus seluruh data lokal, mulai dari nol
set -euo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$AKAR/apps/web"
PID_ANVIL=""

bersihkan() {
  if [ -n "$PID_ANVIL" ]; then
    echo ""
    echo "Menghentikan… (state blockchain lokal disimpan)"
    kill "$PID_ANVIL" 2>/dev/null || true
    wait "$PID_ANVIL" 2>/dev/null || true
  fi
}
trap bersihkan EXIT INT TERM

for alat in bun; do
  command -v "$alat" >/dev/null || { echo "ERROR: '$alat' tidak ditemukan di PATH"; exit 1; }
done

if [ "${BERSIH:-0}" = "1" ]; then
  echo "Menghapus seluruh data lokal…"
  rm -rf "$WEB/data"
fi
mkdir -p "$WEB/data"

# ── tentukan mode ────────────────────────────────────────────────────
ADA_ENV=0
if [ -f "$WEB/.env" ] && grep -qE '^\s*ALAMAT_REGISTRI=0x[0-9a-fA-F]{40}' "$WEB/.env" \
                      && grep -qE '^\s*RPC_URL=\S' "$WEB/.env"; then
  ADA_ENV=1
fi

if [ "$ADA_ENV" = "1" ]; then
  # ── MODE JARINGAN ──────────────────────────────────────────────────
  NAMA=$(grep -E '^\s*NAMA_JARINGAN=' "$WEB/.env" | head -1 | cut -d= -f2- | tr -d '"' || echo "jaringan")
  RPC=$(grep -E '^\s*RPC_URL=' "$WEB/.env" | head -1 | cut -d= -f2- | tr -d '"')
  KONTRAK=$(grep -E '^\s*ALAMAT_REGISTRI=' "$WEB/.env" | head -1 | cut -d= -f2- | tr -d '"')

  echo "[1/2] Mode JARINGAN — ${NAMA:-jaringan}"
  echo "      RPC     : $RPC"
  echo "      kontrak : $KONTRAK"

  if command -v cast >/dev/null; then
    if KODE=$(cast code "$KONTRAK" --rpc-url "$RPC" 2>/dev/null) && [ "$KODE" != "0x" ]; then
      echo "      kontrak terjangkau ✓"
    else
      echo "      PERINGATAN: kontrak tidak terjangkau di RPC tersebut."
      echo "      Jalankan ./deploy-jaringan.sh lebih dulu."
    fi
  fi
else
  # ── MODE LOKAL ─────────────────────────────────────────────────────
  for alat in anvil forge cast; do
    command -v "$alat" >/dev/null || { echo "ERROR: '$alat' tidak ditemukan (perlu Foundry untuk mode lokal)"; exit 1; }
  done

  RPC="http://127.0.0.1:8545"
  KUNCI_ANVIL="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  ALAMAT_ANVIL="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  STATE="$WEB/data/anvil-state.json"

  echo "[1/2] Mode LOKAL — menyalakan Anvil…"
  anvil --silent --state "$STATE" > /dev/null 2>&1 &
  PID_ANVIL=$!
  for _ in $(seq 1 40); do
    cast block-number --rpc-url "$RPC" >/dev/null 2>&1 && break
    sleep 0.5
  done
  cast block-number --rpc-url "$RPC" >/dev/null 2>&1 || { echo "ERROR: Anvil gagal start"; exit 1; }

  TERSIMPAN="$WEB/data/alamat-kontrak.txt"
  KONTRAK=""
  if [ -f "$TERSIMPAN" ]; then
    K=$(cat "$TERSIMPAN")
    [ "$(cast code "$K" --rpc-url "$RPC" 2>/dev/null || echo 0x)" != "0x" ] && KONTRAK="$K"
  fi
  if [ -z "$KONTRAK" ]; then
    cd "$AKAR/contracts"
    KUNCI_TX="$KUNCI_ANVIL" ALAMAT_PENERBIT="$ALAMAT_ANVIL" \
      forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast > /dev/null 2>&1
    KONTRAK=$(python3 -c "import json;print(json.load(open('broadcast/Deploy.s.sol/31337/run-latest.json'))['transactions'][0]['contractAddress'])")
    echo "$KONTRAK" > "$TERSIMPAN"
    echo "      kontrak baru: $KONTRAK"
  else
    echo "      kontrak: $KONTRAK"
  fi

  export KUNCI_TX="$KUNCI_ANVIL"
  export ALAMAT_REGISTRI="$KONTRAK"
  export ALAMAT_PENERBIT="$ALAMAT_ANVIL"
  export RPC_URL="$RPC"
  export CHAIN_ID="31337"
  export NAMA_JARINGAN="anvil-lokal"
  export BASE_URL="http://localhost:5173"
  export AMBANG_SALDO_WALLET="0.05"
  # Anvil tidak punya explorer publik -> pakai explorer bawaan aplikasi.
  export EXPLORER_URL="/explorer"
fi

cd "$WEB"
[ -d node_modules ] || bun install > /dev/null 2>&1

echo "[2/2] Menyalakan aplikasi…"
echo ""
echo "  ┌───────────────────────────────────────────────┐"
echo "  │  Beranda     http://localhost:5173            │"
echo "  │  Masuk       http://localhost:5173/masuk      │"
echo "  │  Buat batch  /admin/batch/baru                │"
echo "  │                                               │"
echo "  │  Ctrl+C untuk menghentikan                    │"
echo "  └───────────────────────────────────────────────┘"
echo ""
bun run dev
