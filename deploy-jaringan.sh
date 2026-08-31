#!/usr/bin/env bash
# Deploy RegistriSertifikat ke jaringan sungguhan (testnet/mainnet),
# lalu menuliskan alamat kontraknya ke apps/web/.env
#
#   ./deploy-jaringan.sh
#
# Membaca apps/web/.env untuk RPC_URL, CHAIN_ID, NAMA_JARINGAN.
# Kunci pengirim diambil dari (pilih salah satu):
#   - keystore Foundry  : AKUN=nama-keystore ./deploy-jaringan.sh   (DIANJURKAN)
#   - variabel KUNCI_TX di apps/web/.env
set -euo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_WEB="$AKAR/apps/web/.env"

[ -f "$ENV_WEB" ] || { echo "ERROR: $ENV_WEB tidak ada. Salin dari .env.example dan isi dulu."; exit 1; }
for alat in forge cast; do command -v "$alat" >/dev/null || { echo "ERROR: '$alat' tidak ditemukan"; exit 1; }; done

baca() { grep -E "^\s*$1=" "$ENV_WEB" | head -1 | cut -d= -f2- | tr -d '"' || true; }

RPC=$(baca RPC_URL)
CHAIN=$(baca CHAIN_ID)
NAMA=$(baca NAMA_JARINGAN)
PENERBIT=$(baca ALAMAT_PENERBIT)

[ -n "$RPC" ] || { echo "ERROR: RPC_URL belum diisi di $ENV_WEB"; exit 1; }

echo "Jaringan : ${NAMA:-?} (chainId ${CHAIN:-?})"
echo "RPC      : $RPC"

CHAIN_NYATA=$(cast chain-id --rpc-url "$RPC" 2>/dev/null || echo "")
[ -n "$CHAIN_NYATA" ] || { echo "ERROR: RPC tidak dapat dihubungi"; exit 1; }
if [ -n "$CHAIN" ] && [ "$CHAIN" != "$CHAIN_NYATA" ]; then
  echo "ERROR: CHAIN_ID di .env ($CHAIN) tidak cocok dengan RPC ($CHAIN_NYATA)"; exit 1
fi
echo "Terhubung, chainId $CHAIN_NYATA"

cd "$AKAR/contracts"

if [ -n "${AKUN:-}" ]; then
  echo "Memakai keystore Foundry: $AKUN"
  ALAMAT_PENGIRIM=$(cast wallet address --account "$AKUN")
  ARG_AKUN=(--account "$AKUN" --sender "$ALAMAT_PENGIRIM")
else
  KUNCI=$(baca KUNCI_TX)
  [ -n "$KUNCI" ] || { echo "ERROR: isi KUNCI_TX di .env, atau pakai AKUN=<keystore> ./deploy-jaringan.sh"; exit 1; }
  ALAMAT_PENGIRIM=$(cast wallet address "$KUNCI")
  ARG_AKUN=(--private-key "$KUNCI")
  export KUNCI_TX="$KUNCI"
fi

SALDO=$(cast balance "$ALAMAT_PENGIRIM" --rpc-url "$RPC")
echo "Pengirim : $ALAMAT_PENGIRIM"
echo "Saldo    : $(cast from-wei "$SALDO") token"
if [ "$SALDO" = "0" ]; then
  echo ""
  echo "ERROR: saldo kosong. Ambil dana dari faucet jaringan tersebut lebih dulu."
  echo "       Monad testnet: https://faucet.monad.xyz/"
  exit 1
fi

echo ""
echo "Men-deploy RegistriSertifikat…"
ALAMAT_PENERBIT="${PENERBIT:-$ALAMAT_PENGIRIM}" \
  forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast "${ARG_AKUN[@]}" 2>&1 | tail -20

ALAMAT=$(python3 -c "
import json,glob,sys
f=glob.glob('broadcast/Deploy.s.sol/$CHAIN_NYATA/run-latest.json')
if not f: sys.exit('tidak ditemukan hasil broadcast')
print(json.load(open(f[0]))['transactions'][0]['contractAddress'])")

echo ""
echo "Kontrak ter-deploy: $ALAMAT"

# tulis balik ke .env
if grep -qE '^\s*ALAMAT_REGISTRI=' "$ENV_WEB"; then
  sed -i "s|^\s*ALAMAT_REGISTRI=.*|ALAMAT_REGISTRI=$ALAMAT|" "$ENV_WEB"
else
  echo "ALAMAT_REGISTRI=$ALAMAT" >> "$ENV_WEB"
fi
if ! grep -qE '^\s*ALAMAT_PENERBIT=\S' "$ENV_WEB"; then
  echo "ALAMAT_PENERBIT=${PENERBIT:-$ALAMAT_PENGIRIM}" >> "$ENV_WEB"
fi

echo "ALAMAT_REGISTRI ditulis ke apps/web/.env"
echo ""
echo "Selanjutnya:  ./jalankan-web.sh"
