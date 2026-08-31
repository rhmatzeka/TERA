# TERA — Tanda Elektronik Resmi Autentik

Sistem penerbitan dan verifikasi sertifikat digital yang keasliannya dijangkarkan
ke blockchain. Dibangun sebagai proyek skripsi.

> **Rancang Bangun TERA sebagai Content Management System Sertifikat Digital
> Berbasis Web3 Menggunakan Merkle Tree pada Blockchain Monad untuk Penerbitan
> Massal yang Tahan Manipulasi dan Transparan**

## Gagasan utama

Seluruh sertifikat satu kegiatan diringkas menjadi **satu Merkle root sepanjang
32 byte**, lalu root itu dicatat ke blockchain dalam **satu transaksi**.
Akibatnya:

| | |
|---|---|
| Biaya penerbitan | Tidak bergantung pada jumlah peserta |
| Data pribadi di blockchain | Tidak ada — hanya hash |
| Verifikasi | Dapat dilakukan siapa pun langsung ke jaringan, tanpa dompet kripto |
| Pencabutan | Tercatat permanen dan dapat diaudit |

## Hasil pengukuran

Gas `terbitkanBatch` terhadap jumlah sertifikat dalam satu batch:

| Jumlah sertifikat | Gas |
|---|---|
| 10 | 26.575 |
| 1.000 | 26.575 |
| 100.000 | 26.576 |
| 1.000.000 | 26.576 |

Simpangan 0%. Angka di atas adalah gas eksekusi internal; transaksi penuh
terukur **50.932 gas** (termasuk biaya dasar, calldata, dan akses *cold*).

Dibandingkan pendekatan satu transaksi per sertifikat pada N = 100.000:
**171.552× lebih hemat**.

## Jaringan

Kontrak berjalan di **Monad Testnet** (chainId 10143):

- Kontrak: [`0xb7a00687762d15212f73ffa164723a23252174ad`](https://testnet.monadexplorer.com/address/0xb7a00687762d15212f73ffa164723a23252174ad)

## Teknologi

| Lapisan | Pilihan |
|---|---|
| Kontrak | Solidity 0.8.28 · Foundry · OpenZeppelin |
| Aplikasi | SvelteKit 2 · Svelte 5 · Bun |
| Blockchain | viem · Merkle Tree OpenZeppelin |
| Dokumen | pdf-lib · Kredensial W3C Verifiable Credentials |

## Menjalankan

**Mode lokal** — tanpa konfigurasi apa pun, memakai blockchain lokal (Anvil):

```bash
./jalankan-web.sh          # buka http://localhost:5173
BERSIH=1 ./jalankan-web.sh # mulai dari nol
```

**Mode jaringan** — memakai testnet sungguhan:

```bash
cp apps/web/.env.example apps/web/.env   # isi KUNCI_TX
./cek-env.sh                             # periksa konfigurasi
./deploy-jaringan.sh                     # deploy kontrak
./jalankan-web.sh
```

Prasyarat: [Bun](https://bun.sh) dan [Foundry](https://getfoundry.sh).

## Pengujian

```bash
cd contracts && forge test               # 33 uji, termasuk fuzz
cd apps/web  && bun test                 # 28 uji
cd apps/web  && bun run scripts/asap.ts  # uji asap ala peramban
```

Uji terpenting: `contracts/test/MerkleKompatibilitas.t.sol` memverifikasi bahwa
bukti Merkle yang dihasilkan TypeScript diterima oleh kontrak Solidity.

## Struktur

```
contracts/          Smart contract (Foundry)
apps/web/           Aplikasi SvelteKit
  src/lib/          Kredensial, Merkle, template — isomorfik
  src/lib/server/   Toko data, penerbitan, PDF, autentikasi
  src/routes/       Publik · portal peserta · panel admin · explorer
plan.md             Rancangan lengkap, spesifikasi, dan hasil pengukuran
```

## Catatan

Ini prototipe skripsi. Data masih disimpan sebagai berkas JSON, bukan
PostgreSQL, dan sesi login disimpan di memori.

## Lisensi

MIT
