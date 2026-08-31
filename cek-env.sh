#!/usr/bin/env bash
# Memeriksa apps/web/.env tanpa pernah menampilkan private key.
#   ./cek-env.sh
set -uo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_WEB="$AKAR/apps/web/.env"
OK=0

[ -f "$ENV_WEB" ] || { echo "✕ apps/web/.env tidak ada"; exit 1; }
baca() { grep -E "^\s*$1=" "$ENV_WEB" | head -1 | cut -d= -f2- | tr -d '"' | tr -d '[:space:]'; }

echo ""
echo "═══ Pemeriksaan apps/web/.env ═══"
echo ""

RPC=$(baca RPC_URL); CHAIN=$(baca CHAIN_ID); KUNCI=$(baca KUNCI_TX)
REG=$(baca ALAMAT_REGISTRI); EXP=$(baca EXPLORER_URL)

# ── kunci ──────────────────────────────────────────────────────────────
if [ -z "$KUNCI" ]; then
  echo "✕ KUNCI_TX belum diisi"
  echo "    Buka apps/web/.env, isi baris KUNCI_TX="
  OK=1
else
  BERSIH="${KUNCI#0x}"
  if [ ${#BERSIH} -ne 64 ] || ! [[ "$BERSIH" =~ ^[0-9a-fA-F]+$ ]]; then
    echo "✕ KUNCI_TX bukan private key yang sah"
    echo "    panjang terbaca: ${#BERSIH} karakter (seharusnya 64 hex)"
    OK=1
  else
    ALAMAT=$(cast wallet address "0x$BERSIH" 2>/dev/null)
    if [ -z "$ALAMAT" ]; then
      echo "✕ KUNCI_TX tidak dapat dibaca sebagai private key"
      OK=1
    else
      echo "✓ KUNCI_TX terbaca"
      echo "    alamat dompet : $ALAMAT"
    fi
  fi
fi

# ── jaringan ───────────────────────────────────────────────────────────
if [ -z "$RPC" ]; then
  echo "✕ RPC_URL kosong"; OK=1
else
  CID=$(timeout 25 cast chain-id --rpc-url "$RPC" 2>/dev/null)
  if [ -z "$CID" ]; then
    echo "✕ RPC tidak dapat dihubungi: $RPC"; OK=1
  elif [ -n "$CHAIN" ] && [ "$CHAIN" != "$CID" ]; then
    echo "✕ CHAIN_ID di .env ($CHAIN) ≠ chainId RPC ($CID)"; OK=1
  else
    BLOK=$(timeout 25 cast block-number --rpc-url "$RPC" 2>/dev/null)
    echo "✓ RPC terhubung — chainId $CID, blok $BLOK"
  fi
fi

# ── saldo ──────────────────────────────────────────────────────────────
if [ -n "${ALAMAT:-}" ] && [ -n "${CID:-}" ]; then
  WEI=$(timeout 25 cast balance "$ALAMAT" --rpc-url "$RPC" 2>/dev/null || echo 0)
  MON=$(cast from-wei "$WEI" 2>/dev/null || echo 0)
  GAS=$(timeout 25 cast gas-price --rpc-url "$RPC" 2>/dev/null || echo 0)
  PERLU=$(python3 -c "print(f'{669521*$GAS/1e18:.5f}')" 2>/dev/null || echo "?")

  if [ "$WEI" = "0" ]; then
    echo "✕ Saldo dompet KOSONG"
    echo "    Ambil dana dari faucet: https://faucet.monad.xyz/"
    echo "    Alamat yang harus diisi: $ALAMAT"
    OK=1
  else
    CUKUP=$(python3 -c "print('ya' if float('$MON') > float('$PERLU') else 'tidak')" 2>/dev/null)
    echo "✓ Saldo: $MON MON"
    echo "    perkiraan biaya deploy : $PERLU MON  (cukup: $CUKUP)"
  fi
fi

# ── explorer ───────────────────────────────────────────────────────────
if [ -n "$EXP" ]; then
  echo "! EXPLORER_URL terisi ($EXP) — hash TIDAK akan mengarah ke Monad Explorer."
  echo "    Kosongkan baris itu bila ingin tautan ke explorer asli."
else
  echo "✓ EXPLORER_URL kosong — hash akan mengarah ke Monad Explorer"
fi

# ── kontrak ────────────────────────────────────────────────────────────
if [ -z "$REG" ]; then
  echo "· ALAMAT_REGISTRI belum ada — normal sebelum deploy"
else
  KODE=$(timeout 25 cast code "$REG" --rpc-url "$RPC" 2>/dev/null || echo 0x)
  [ "$KODE" != "0x" ] && echo "✓ Kontrak sudah ter-deploy: $REG" \
                      || { echo "✕ ALAMAT_REGISTRI terisi tapi kontrak tidak ada di jaringan itu"; OK=1; }
fi

echo ""
if [ "$OK" = "0" ]; then
  [ -z "$REG" ] && echo "SIAP. Langkah berikutnya:  ./deploy-jaringan.sh" \
                || echo "SIAP. Langkah berikutnya:  ./jalankan-web.sh"
else
  echo "Masih ada yang perlu diperbaiki (lihat tanda ✕ di atas)."
fi
echo ""
exit "$OK"
