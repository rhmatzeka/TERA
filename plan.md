# Rencana Sistem Sertifikat Digital Berbasis Blockchain

> Dokumen perencanaan skripsi. Status: rancangan awal, belum ada implementasi.
> Terakhir diperbarui: 2026-08-30

---

## 1. Ringkasan

Sistem manajemen konten (CMS) untuk menerbitkan dan memverifikasi sertifikat
kegiatan (seminar, pelatihan, webinar) dengan jangkar bukti di blockchain.

**Sasaran utama:** verifikasi mandiri oleh pihak ketiga tanpa perlu memercayai
server penerbit, dengan biaya operasional mendekati nol dan tanpa menempatkan
data pribadi di blockchain.

**Ciri pembeda:**

- 1 batch penerbitan = 1 transaksi, berapa pun jumlah pesertanya
- Peserta dan verifier tidak perlu wallet, tidak perlu instal apa pun
- Data pribadi tetap off-chain (patuh UU PDP No. 27/2022)
- Lapisan blockchain dapat diganti tanpa membongkar sistem

---

## 2. Masalah dan Posisi Riset

### Rumusan masalah

Sertifikat digital yang diterbitkan institusi umumnya diverifikasi lewat server
institusi itu sendiri. Akibatnya:

1. Verifier harus memercayai penerbit sepenuhnya
2. Server mati / domain kedaluwarsa / institusi bubar → verifikasi mati
3. Penerbitan atau pencabutan diam-diam tidak meninggalkan jejak yang dapat diaudit

### Yang TIDAK diklaim sistem ini

Penting untuk kejujuran ilmiah — blockchain **tidak** menyelesaikan pemalsuan.
Tanda tangan digital (PKI) sudah menyelesaikan itu, gratis dan sudah standar.

### Yang diklaim sistem ini

| Klaim | Mekanisme |
|---|---|
| Verifikasi tanpa memercayai server penerbit | Verifier membaca root langsung dari blockchain |
| Ketersediaan jangka panjang | Bukti tetap ada meski server penerbit mati |
| Pencabutan yang dapat diaudit | Setiap pencabutan meninggalkan jejak permanen |
| Biaya marginal mendekati nol | Batching Merkle, tanpa langganan, tanpa vendor |

### Standar rujukan

Sistem ini **tidak** menciptakan format baru. Mengacu pada:

- **W3C Verifiable Credentials 2.0** — struktur kredensial
- **Open Badges 3.0** (1EdTech) — kredensial pendidikan, selaras dengan VC
- **Blockcerts** (MIT) — pembanding terdekat
- **EIP-712** — penandatanganan terstruktur untuk klaim NFT

---

## 3. Prinsip Desain

1. **Blockchain adalah jangkar, bukan basis data.**
   Sumber kebenaran tetap dokumen kredensial yang ditandatangani. Chain hanya
   membuktikan "dokumen ini sudah ada pada waktu T dan belum berubah sejak itu".

2. **Dua bukti independen.**
   Tanda tangan institusi (PKI) + jangkar on-chain. Kalau jaringannya mati,
   sertifikat masih dapat diverifikasi lewat tanda tangan.

3. **Nol data pribadi di chain.**
   Yang naik ke chain hanya hash. Tidak ada nama, NIM, atau email.

4. **Verifikasi tanpa hambatan.**
   Tanpa login, tanpa wallet, tanpa instal. Cukup buka tautan atau pindai QR.

5. **Pemisahan wewenang.**
   Yang mengunggah data tidak boleh sekaligus yang menerbitkan.

---

## 4. Analisis Biaya

### Mengapa jumlah peserta tidak memengaruhi biaya

Satu batch berisi N sertifikat diringkas menjadi **satu Merkle root** (32 byte).
Hanya root itu yang dikirim ke blockchain. Nilai N sama sekali tidak mengubah
ukuran data yang dikirim.

```
biaya = gasUnit x hargaGas(gwei) x 1e-9 x hargaToken
```

`terbitkanBatch` terukur **50.932 gas** untuk transaksi penuh (lihat bagian 18
untuk metodologi dan koreksinya). Ukur ulang di jaringan targetmu sendiri —
jangan mengutip angka ini tanpa verifikasi.

| Peserta / batch | Transaksi | Biaya batch | Biaya per sertifikat |
|---|---|---|---|
| 500 | 1 | Rp 50 – 1.000 | ~Rp 2 |
| 50.000 | 1 | Rp 50 – 1.000 | ~Rp 0,02 |
| 200.000 | 1 | Rp 50 – 1.000 | ~Rp 0,005 |

### Perbandingan dengan desain naif

| Pendekatan | 200.000 sertifikat | Biaya |
|---|---|---|
| NFT per mahasiswa | 200.000 transaksi | ~Rp 100.000.000 |
| **Merkle batch** | **1 transaksi** | **< Rp 1.000** |

### Total biaya kepemilikan (TCO) tahunan institusi

Asumsi 100 kegiatan per tahun.

| Komponen | Setahun |
|---|---|
| Hosting server + basis data | Rp 600.000 – 2.400.000 |
| Domain | Rp 150.000 – 500.000 |
| Penyimpanan berkas | Rp 100.000 – 500.000 |
| **Gas blockchain** | **Rp 5.000 – 100.000** |
| Deploy kontrak (sekali) | Rp 1.500 – 30.000 |

**Gas hanya ~5% dari biaya operasional.** Ini temuan yang perlu ditonjolkan:
kekhawatiran "blockchain itu mahal" tidak berdasar pada desain ini.

### Opsi penghematan lanjutan

Batch bulanan alih-alih per kegiatan: 12 transaksi/tahun (turun ~88%).
Konsekuensi: ada jeda sebelum sertifikat dapat diverifikasi. Jadikan opsi
konfigurasi, bukan keputusan mati.

### Model pembayaran operasional

Bukan tagihan atau langganan. Wallet institusi diisi saldo sekali
(misal Rp 200.000), berkurang otomatis tiap penerbitan, cukup untuk
bertahun-tahun. Dashboard admin **wajib** menampilkan saldo + peringatan
saldo menipis, karena saldo habis = penerbitan gagal.

---

## 5. Arsitektur

### 5.1 Lapisan

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTASI — SvelteKit                                  │
│  Portal admin · Portal peserta · Halaman verifikasi      │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│  APLIKASI — layanan domain                               │
│  Impor CSV · Merkle · Penerbitan · Verifikasi ·          │
│  Pencabutan · Render PDF · Audit                         │
└──────────────────────────────────────────────────────────┘
          │                                    │
┌───────────────────────┐      ┌──────────────────────────┐
│  DATA                 │      │  ANCHOR (dapat diganti)  │
│  PostgreSQL           │      │  AnchorAdapter           │
│  Object storage       │      │   ├── EvmAnchor          │
│  (template, PDF)      │      │   ├── MultiChainAnchor   │
└───────────────────────┘      │   └── MockAnchor (uji)   │
                               └──────────────────────────┘
                                            │
                               ┌──────────────────────────┐
                               │  BLOCKCHAIN (EVM)        │
                               │  RegistriSertifikat      │
                               │  SertifikatSBT (fase 2)  │
                               └──────────────────────────┘
```

### 5.2 Pola Anchor Adapter

Kritis untuk umur panjang sistem. Sertifikat harus dapat diverifikasi 10–20
tahun ke depan; banyak blockchain tidak berumur sepanjang itu.

```ts
interface AnchorAdapter {
  terbitkanBatch(idBatch: string, root: `0x${string}`): Promise<HasilAnchor>;
  cabut(daun: `0x${string}`): Promise<HasilAnchor>;
  bacaRoot(idBatch: string): Promise<`0x${string}` | null>;
  cekDicabut(daun: `0x${string}`): Promise<boolean>;
  saldo(): Promise<bigint>;
}
```

Manfaat:

- Ganti jaringan = ganti implementasi, bukan bongkar sistem
- `MockAnchor` membuat seluruh aplikasi dapat diuji tanpa blockchain sama sekali
- `MultiChainAnchor` memungkinkan jangkar ke >1 jaringan (biaya tetap kecil)
- Menjawab pertanyaan penguji "kenapa jaringan X?" dengan jawaban kuat:
  jaringannya dapat diganti, dan dipilih berdasarkan hasil pengukuran

### 5.3 Alur penerbitan

```
1. Admin menyiapkan template (gambar latar + posisi placeholder)

2. Operator unggah CSV  ← streaming, tidak dimuat penuh ke memori
   nama,email,nomor_identitas,nama_kegiatan,tanggal,peran

3. Validasi otomatis
   kolom hilang · duplikat · format tanggal · email tidak valid
   → laporan error per baris, operator perbaiki, unggah ulang

4. Untuk setiap baris:
   data → dokumen kredensial (VC JSON) → ditandatangani kunci institusi
        → daun = keccak256(dokumen)

5. Semua daun → Merkle tree → satu root

6. Status batch: MENUNGGU_PERSETUJUAN
   Penandatangan melihat ringkasan (jumlah, kegiatan, root) → Setujui

7. AnchorAdapter.terbitkanBatch(idBatch, root)   ← 1 transaksi

8. Setelah terkonfirmasi → status TERBIT
   simpan txHash, nomor blok, gas terpakai, biaya
   generate tautan + QR per peserta, kirim email (opsional)
```

### 5.4 Alur verifikasi (publik, tanpa wallet)

```
Pemindaian QR → /verify/{idSertifikat}

1. Ambil dokumen kredensial + bukti Merkle dari server
2. Ambil root dari blockchain lewat RPC publik   ← BUKAN dari server penerbit
3. Verifikasi di peramban:
   a. tanda tangan institusi sah?
   b. keccak256(dokumen) == daun?
   c. MerkleProof(daun, bukti) == root on-chain?
   d. status dicabut?
4. Tampilkan: SAH / DICABUT / TIDAK DITEMUKAN
   + tautan ke block explorer sebagai bukti independen
```

Langkah 2 adalah inti klaim riset: verifier **tidak** memercayai server penerbit
untuk menentukan keabsahan.

### 5.5 Alur klaim NFT (fase 2, opsional)

Masalah: daun Merkle tidak terikat ke alamat wallet mana pun, dan bukti Merkle
tampil publik di halaman verifikasi. Jadi klaim **tidak boleh** memakai bukti
Merkle — siapa pun bisa mengklaim milik orang lain.

Solusi: **voucher bertanda tangan EIP-712**, alamat diketahui saat klaim.

```
1. Peserta login → klik "Klaim sebagai NFT"
2. Hubungkan wallet → frontend memperoleh alamat 0xABC
3. Frontend → backend: { idSertifikat, alamat }
4. Backend verifikasi sesi → tanda tangani (daun, 0xABC) → kirim tanda tangan
5. Frontend → kontrak: klaim(daun, tandaTangan)   ← PESERTA bayar gas
6. Kontrak verifikasi ECDSA → mint soulbound token
```

Institusi membayar **nol** untuk seluruh fase ini, berapa pun yang mengklaim.

---

## 6. Tech Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Runtime | **Bun** | Startup cepat, TS native, test runner bawaan |
| Framework | **SvelteKit 2 + Svelte 5 (runes)** | SSR, bundel kecil, form actions cocok untuk CMS |
| Basis data | **PostgreSQL 16** | Andal, index kuat, `COPY` untuk impor massal |
| ORM | **Drizzle** | TypeScript-first, SQL-like, lebih ringan dari Prisma di Bun |
| Auth | **Better Auth** | Aktif dikembangkan, integrasi Drizzle. (Lucia sudah tidak dilanjutkan) |
| Kontrak | **Solidity 0.8.2x + Foundry** | Toolchain tercepat, `--gas-report` langsung jadi data skripsi |
| Pustaka kontrak | **OpenZeppelin v5** | `MerkleProof`, `ERC721`, `EIP712`, `ECDSA` |
| Klien chain | **viem** | TS-first, ringan, API modern |
| Wallet frontend | **wagmi** (hanya fase 2) | Standar de facto untuk koneksi wallet |
| Merkle (JS) | **@openzeppelin/merkle-tree** | Cocok persis dengan `MerkleProof` on-chain |
| CSV | **Papa Parse** (mode stream) | Wajib streaming untuk ratusan ribu baris |
| PDF | **pdf-lib** | Cepat, murni JS. JANGAN Puppeteer (berat, lambat di skala besar) |
| QR | **qrcode** | Sederhana, cukup |
| Styling | **Tailwind CSS v4** | Iterasi cepat |
| Deploy | **Docker + VPS** | Reprodusibel, penguji dapat menjalankan ulang |

### Catatan pilihan

- **Bun + SvelteKit bukan kontribusi ilmiah.** Jangan taruh di rumusan masalah.
  Cukup sebutkan di bab implementasi sebagai keputusan teknis.
- **pdf-lib, bukan Puppeteer.** Lihat bagian 9.2 untuk alasan dan konsekuensinya.
- **Foundry, bukan Hardhat.** `forge test --gas-report` dan `forge snapshot`
  langsung menghasilkan data Bab 4.

### 6.1 Pemilihan jaringan: Monad

Jaringan target penelitian ini adalah **Monad** (L1, kompatibel EVM). Namun
argumennya harus dirumuskan dengan hati-hati, karena alasan yang lemah akan
runtuh saat sidang.

**Argumen yang LEMAH — jangan dipakai sendirian:**

> "Monad dipilih karena cepat, throughput-nya tinggi."

Penguji akan bertanya: *berapa throughput yang sistem Anda butuhkan?* Jawabannya
sekitar 100 transaksi **per tahun** — setara 0,000003 TPS. Pada beban seperti itu,
jaringan 15 TPS dan 10.000 TPS tidak dapat dibedakan. Argumen throughput gugur.

**Argumen yang KUAT — pakai ini:**

1. **Latensi finalitas, bukan throughput.**
   Yang relevan bukan berapa banyak transaksi per detik, melainkan berapa lama
   operator menunggu setelah menekan "Setujui" sampai batch berstatus terbit.
   Ini memengaruhi pengalaman pengguna secara langsung dan **dapat diukur**.
   Inilah pembacaan "cepat" yang sah untuk kasus ini.

2. **Biaya rendah dan dapat diprediksi.**
   Institusi pendidikan menganggarkan biaya di muka. Yang penting bukan sekadar
   murah, tapi stabil — biaya yang melonjak tak terduga lebih merepotkan daripada
   biaya yang sedikit lebih tinggi tapi tetap.

3. **Kompatibilitas EVM penuh — argumen terkuat.**
   Bytecode kontrak identik di semua jaringan EVM. Artinya sistem tidak terkunci
   pada Monad: lewat `AnchorAdapter` (bagian 5.2), jaringan dapat diganti tanpa
   mengubah aplikasi. Pemilihan jaringan menjadi keputusan yang dapat dianulir,
   bukan taruhan permanen.

4. **Objek penelitian yang belum banyak dievaluasi.**
   Monad sebagai L1 dengan eksekusi paralel belum banyak diteliti untuk kasus
   penggunaan kredensial akademik. Mengukurnya secara sistematis adalah
   kontribusi, bukan sekadar pemakaian.

**Risiko yang harus diakui jujur:**

Jaringan baru berarti rekam jejak umur belum terbukti, sementara sertifikat harus
dapat diverifikasi 10–20 tahun ke depan. Mitigasinya sudah ada di desain:
`AnchorAdapter` yang dapat diganti (5.2) dan tanda tangan PKI sebagai bukti kedua
yang independen dari blockchain (prinsip 2).

**Cara menuliskannya di skripsi:**

Jangan tulis "Monad dipilih karena cepat dan murah". Tulis kira-kira begini:

> Monad dipilih sebagai jaringan target karena tiga pertimbangan: biaya transaksi
> yang rendah dan stabil, latensi finalitas yang mendukung alur kerja penerbitan
> secara interaktif, serta kompatibilitas EVM penuh yang memungkinkan lapisan
> jangkar diganti tanpa perubahan pada aplikasi. Pemilihan ini diverifikasi
> secara empiris melalui pengukuran gas dan latensi terhadap dua jaringan
> pembanding (bagian 4.x).

Dengan begitu pemilihan jaringan berdiri di atas data, bukan preferensi.

**Konsekuensi untuk Fase 4:** deploy kontrak yang sama ke Monad + 2 jaringan
pembanding, lalu ukur gas unit, latensi finalitas, dan biaya. Jangan mengutip
angka dari materi pemasaran jaringan mana pun — ukur sendiri, dan sitasi
dokumentasi resmi untuk klaim yang tidak dapat kamu ukur.

---

## 7. Skema Basis Data

```sql
-- Pengguna dan peran
CREATE TABLE pengguna (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  nama          TEXT NOT NULL,
  hash_sandi    TEXT NOT NULL,
  peran         TEXT NOT NULL CHECK (peran IN ('admin','operator','penandatangan','peserta')),
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Template sertifikat
CREATE TABLE template (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama           TEXT NOT NULL,
  kunci_latar    TEXT NOT NULL,          -- kunci object storage
  penempatan     JSONB NOT NULL,         -- [{field,x,y,ukuran,font,align}]
  dibuat_oleh    UUID REFERENCES pengguna(id),
  dibuat_pada    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Batch penerbitan
CREATE TABLE batch (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kegiatan   TEXT NOT NULL,
  tanggal_kegiatan DATE NOT NULL,
  template_id     UUID REFERENCES template(id),
  jumlah          INTEGER NOT NULL DEFAULT 0,
  merkle_root     BYTEA,
  status          TEXT NOT NULL DEFAULT 'draf'
                  CHECK (status IN ('draf','menunggu_persetujuan','memproses','terbit','gagal')),
  dibuat_oleh     UUID REFERENCES pengguna(id),
  disetujui_oleh  UUID REFERENCES pengguna(id),
  disetujui_pada  TIMESTAMPTZ,
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sertifikat individual
CREATE TABLE sertifikat (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batch(id) ON DELETE CASCADE,
  nama_penerima     TEXT NOT NULL,
  email_penerima    TEXT,
  nomor_identitas   TEXT,
  peran             TEXT,                -- peserta / pemateri / panitia
  dokumen           JSONB NOT NULL,      -- kredensial W3C VC, sudah ditandatangani
  daun              BYTEA NOT NULL,      -- keccak256(dokumen)
  bukti_merkle      BYTEA[] NOT NULL,
  indeks            INTEGER NOT NULL,
  dicabut           BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sertifikat_batch ON sertifikat(batch_id);
CREATE UNIQUE INDEX idx_sertifikat_daun ON sertifikat(daun);
CREATE INDEX idx_sertifikat_email ON sertifikat(email_penerima);

-- Transaksi jangkar (satu batch bisa >1 jaringan)
CREATE TABLE anchor_tx (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batch(id),
  jaringan      TEXT NOT NULL,
  chain_id      INTEGER NOT NULL,
  alamat_kontrak TEXT NOT NULL,
  tx_hash       TEXT NOT NULL,
  nomor_blok    BIGINT,
  gas_terpakai  BIGINT,                  -- data untuk Bab 4
  harga_gas     BIGINT,
  biaya_wei     NUMERIC(78,0),
  status        TEXT NOT NULL DEFAULT 'menunggu',
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pencabutan
CREATE TABLE pencabutan (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sertifikat_id  UUID NOT NULL REFERENCES sertifikat(id),
  alasan         TEXT NOT NULL,
  dicabut_oleh   UUID REFERENCES pengguna(id),
  tx_hash        TEXT,
  dibuat_pada    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Antrean pekerjaan latar (impor besar, render PDF, kirim email)
CREATE TABLE pekerjaan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis        TEXT NOT NULL,
  muatan       JSONB NOT NULL,
  status       TEXT NOT NULL DEFAULT 'antre',
  percobaan    INTEGER NOT NULL DEFAULT 0,
  galat        TEXT,
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jejak audit (wajib, tidak boleh dihapus)
CREATE TABLE log_audit (
  id          BIGSERIAL PRIMARY KEY,
  aktor_id    UUID REFERENCES pengguna(id),
  aksi        TEXT NOT NULL,
  entitas     TEXT NOT NULL,
  entitas_id  UUID,
  metadata    JSONB,
  ip          INET,
  waktu       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8. Smart Contract

### 8.1 RegistriSertifikat (wajib, fase 1)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract RegistriSertifikat is Ownable {
    // HANYA ini yang di storage — sisanya event (jauh lebih murah)
    mapping(bytes32 => bytes32) public rootBatch;   // idBatch => merkle root
    mapping(bytes32 => bool)    public dicabut;     // daun => status

    event BatchTerbit(
        bytes32 indexed idBatch,
        bytes32 root,
        string namaKegiatan,     // di event, bukan storage
        uint256 jumlah,
        uint256 waktu
    );
    event SertifikatDicabut(bytes32 indexed daun, string alasan, uint256 waktu);

    constructor(address pemilik) Ownable(pemilik) {}

    function terbitkanBatch(
        bytes32 idBatch,
        bytes32 root,
        string calldata namaKegiatan,
        uint256 jumlah
    ) external onlyOwner {
        require(rootBatch[idBatch] == bytes32(0), "batch sudah ada");
        require(root != bytes32(0), "root kosong");
        rootBatch[idBatch] = root;
        emit BatchTerbit(idBatch, root, namaKegiatan, jumlah, block.timestamp);
    }

    function cabut(bytes32 daun, string calldata alasan) external onlyOwner {
        require(!dicabut[daun], "sudah dicabut");
        dicabut[daun] = true;
        emit SertifikatDicabut(daun, alasan, block.timestamp);
    }

    function verifikasi(bytes32 idBatch, bytes32 daun, bytes32[] calldata bukti)
        external view returns (bool)
    {
        if (dicabut[daun]) return false;
        bytes32 root = rootBatch[idBatch];
        if (root == bytes32(0)) return false;
        return MerkleProof.verify(bukti, root, daun);
    }
}
```

**Prinsip optimasi gas:** kalau data tidak perlu dibaca oleh kontrak,
taruh di event. Event tetap permanen dan terbaca frontend lewat RPC,
tapi harganya sekitar sepersepuluh storage.

### 8.2 SertifikatSBT (opsional, fase 2)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SertifikatSBT is ERC721, Ownable, EIP712 {
    address public penandatangan;
    string  private _basisUri;
    uint256 private _idBerikutnya;

    mapping(bytes32 => bool)    public sudahDiklaim;
    mapping(uint256 => bytes32) public daunDari;

    bytes32 private constant TIPE_KLAIM =
        keccak256("Klaim(bytes32 daun,address penerima)");

    error SudahDiklaim();
    error TandaTanganTidakSah();
    error TidakDapatDipindah();

    constructor(address pemilik, address _penandatangan, string memory basisUri)
        ERC721("Sertifikat Kegiatan", "CERT")
        EIP712("SertifikatSBT", "1")
        Ownable(pemilik)
    {
        penandatangan = _penandatangan;
        _basisUri = basisUri;
    }

    function klaim(bytes32 daun, bytes calldata tandaTangan) external {
        if (sudahDiklaim[daun]) revert SudahDiklaim();

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(TIPE_KLAIM, daun, msg.sender))
        );
        if (ECDSA.recover(digest, tandaTangan) != penandatangan) {
            revert TandaTanganTidakSah();
        }

        sudahDiklaim[daun] = true;
        uint256 id = _idBerikutnya++;
        daunDari[id] = daun;
        _safeMint(msg.sender, id);
    }

    function _baseURI() internal view override returns (string memory) {
        return _basisUri;
    }

    // Soulbound: mint dan burn boleh, pindah tangan tidak
    function _update(address ke, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address dari = _ownerOf(tokenId);
        if (dari != address(0) && ke != address(0)) revert TidakDapatDipindah();
        return super._update(ke, tokenId, auth);
    }
}
```

Tanda tangan terikat ke `msg.sender`, sehingga tidak dapat dipakai ulang oleh
alamat lain meski bocor.

### 8.3 Metadata NFT

`tokenURI` mengarah ke API sendiri (`https://domain/api/nft/{id}`), bukan IPFS.
IPFS memerlukan layanan pinning berbayar dan dapat hilang bila tidak dibayar.

**Isi metadata: minimal.** Nama kegiatan, tanggal, penyelenggara, ID sertifikat.
**Tanpa nama peserta**, kecuali peserta mencentang persetujuan eksplisit.

Tulis keterbatasan ini terus terang di skripsi: metadata masih tersentralisasi
sementara bukti keabsahan sudah on-chain.

### 8.4 Kesalahan umum pada mekanisme klaim

Enam jebakan berikut semuanya menghasilkan kontrak yang "jalan" saat diuji
normal, tetapi dapat dieksploitasi. Tabel ini layak masuk bab keamanan.

| Kesalahan | Akibat | Pencegahan |
|---|---|---|
| Klaim memakai bukti Merkle | Bukti tampil publik di halaman verifikasi → siapa pun dapat mengklaim NFT milik orang lain | Gunakan voucher EIP-712 (5.5) |
| Menandatangani `daun` saja, tanpa alamat | Tanda tangan yang bocor dapat dipakai alamat mana pun | Ikutkan `msg.sender` ke dalam pesan |
| Tanpa domain separator EIP-712 | Tanda tangan dapat diputar ulang ke kontrak atau chain lain | `_hashTypedDataV4` (sudah membawa `chainId` + alamat kontrak) |
| Tanpa penanda `sudahDiklaim` | Satu sertifikat dapat diklaim berkali-kali | `mapping(bytes32 => bool)` + revert |
| Memakai `eth_sign` mentah | Pengguna tidak dapat membaca isi yang ditandatangani; rawan phishing | `signTypedData` — wallet menampilkan isi terstruktur |
| Backend menandatangani tanpa memeriksa sesi | Siapa pun dapat meminta voucher untuk sertifikat siapa pun | Verifikasi sesi login **dan** kepemilikan sertifikat sebelum menandatangani |

**Akar masalahnya satu:** daun Merkle mengidentifikasi *sertifikat*, bukan
*pemilik wallet*. Pengikatan ke alamat hanya dapat terjadi pada saat klaim,
karena saat penerbitan alamat wallet peserta belum diketahui — dan memang
sebagian besar peserta tidak akan pernah punya.

**Uji yang wajib ada di `forge test`:**

```
test_KlaimBerhasil()
test_TolakJikaAlamatBerbeda()          // voucher A dipakai alamat B
test_TolakJikaDiklaimDuaKali()
test_TolakJikaPenandatanganSalah()
test_TolakPemindahanToken()            // sifat soulbound
testFuzz_TolakTandaTanganAcak(bytes)
```

---

## 9. Strategi Skala (ratusan ribu baris)

| Tantangan | Penanganan |
|---|---|
| CSV 200.000 baris | Papa Parse mode stream — jangan `readFile` seluruhnya |
| Sisip 200.000 baris ke DB | `COPY` PostgreSQL atau sisip berkelompok 1.000, bukan per baris |
| Merkle tree 200.000 daun | ~18 level, terbangun dalam hitungan detik. Bukti = 18 hash (~576 byte) |
| Simpan 200.000 bukti | Tidak masalah — `BYTEA[]` di Postgres, atau hitung ulang saat diminta |
| 200.000 PDF | **Jangan pra-generate.** Render saat diunduh, lalu cache |
| Proses lama memblokir HTTP | Tabel `pekerjaan` + worker terpisah. Antarmuka menampilkan progres |
| Transaksi gagal / gas naik | Status `gagal` + tombol coba lagi. Root tidak berubah, aman diulang |

### 9.1 Render PDF saat diunduh (bukan saat diterbitkan)

Ini keputusan skala paling penting di seluruh rencana.

**Perbandingan pada 200.000 sertifikat** (asumsi ~150 KB per berkas, ~30 ms
per render — ukur sendiri untuk angka final):

| | Pra-generate | Render saat diunduh |
|---|---|---|
| Waktu saat menerbitkan | ~1,5–2 jam | **< 1 detik** |
| Penyimpanan awal | ~30 GB | **0 GB** |
| Penyimpanan setelah 5% diunduh | ~30 GB | **~1,5 GB** |
| Ganti desain template | render ulang 200.000 berkas | kosongkan cache, selesai |
| Salah ketik 1 nama | render ulang berkas terkait | otomatis benar saat diunduh |

Sebagian besar sertifikat kegiatan tidak pernah diunduh. Merender semuanya di
muka berarti membayar penuh untuk sesuatu yang dipakai sebagian kecil.

**Yang disimpan saat penerbitan:** data peserta, dokumen kredensial
bertanda tangan, daun, dan bukti Merkle. Semuanya ringan. PDF **tidak**.

**Alur unduhan dengan cache:**

```ts
// src/routes/sertifikat/[id]/pdf/+server.ts
export async function GET({ params, setHeaders }) {
  const sert = await ambilSertifikat(params.id);
  if (!sert) error(404, 'Sertifikat tidak ditemukan');

  // versi template masuk ke kunci cache -> desain berubah, cache otomatis basi
  const kunci = `pdf/${sert.id}-${sert.template_versi}.pdf`;
  let berkas = await storage.ambil(kunci);

  if (!berkas) {
    berkas = await renderSertifikat(sert, await ambilTemplate(sert.template_id));
    await storage.simpan(kunci, berkas);      // cache setelah render pertama
  }

  setHeaders({
    'Content-Type': 'application/pdf',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  return new Response(berkas);
}
```

**Fungsi render** — perhatikan latar dan font dimuat sekali lalu dipakai ulang,
dan ukuran teks otomatis mengecil untuk nama panjang (masalah nyata yang pasti
kamu temui):

```ts
// src/lib/server/pdf.ts
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';

let latarCache: Uint8Array;   // dimuat sekali saat startup
let fontCache:  Uint8Array;

export async function renderSertifikat(sert: Sertifikat, tpl: Template) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const font  = await pdf.embedFont(fontCache, { subset: true });
  const latar = await pdf.embedPng(latarCache);
  const hal   = pdf.addPage([latar.width, latar.height]);
  hal.drawImage(latar, { x: 0, y: 0, width: latar.width, height: latar.height });

  for (const p of tpl.penempatan) {
    const teks   = String(sert.dokumen.credentialSubject[p.field] ?? '');
    const ukuran = muatkan(teks, font, p.ukuran, p.lebarMaks);
    const lebar  = font.widthOfTextAtSize(teks, ukuran);
    const x      = p.align === 'center' ? p.x - lebar / 2 : p.x;
    hal.drawText(teks, { x, y: p.y, size: ukuran, font, color: rgb(0, 0, 0) });
  }

  const qrPng = await QRCode.toBuffer(`${BASE_URL}/verify/${sert.id}`, { margin: 0 });
  const qr    = await pdf.embedPng(qrPng);
  hal.drawImage(qr, { x: tpl.qr.x, y: tpl.qr.y, width: tpl.qr.ukuran, height: tpl.qr.ukuran });

  return pdf.save();
}

// nama panjang tidak boleh keluar dari area teks
function muatkan(teks: string, font: PDFFont, awal: number, lebarMaks: number) {
  let u = awal;
  while (font.widthOfTextAtSize(teks, u) > lebarMaks && u > 6) u -= 0.5;
  return u;
}
```

**Pengecualian — unduhan massal.** Kalau operator ingin semua PDF satu batch
dalam bentuk ZIP, itu memang harus dirender semua. Tangani sebagai
**pekerjaan latar** (tabel `pekerjaan`) dengan ZIP yang di-stream ke disk —
jangan disusun di memori, dan jangan di dalam siklus permintaan HTTP.

### 9.2 pdf-lib, bukan Puppeteer

| | Puppeteer / Playwright | **pdf-lib** |
|---|---|---|
| Cara kerja | Menjalankan Chromium, render HTML, cetak PDF | Murni JS, gambar teks di koordinat |
| Waktu per dokumen | ~300–1.000 ms | **~10–50 ms** |
| Memori | ~100–300 MB per instans peramban | beberapa MB |
| Ukuran image Docker | +300 MB dependensi Chromium | tidak ada tambahan |
| Tata letak HTML/CSS | Penuh | **Tidak ada** |

Angka di atas perkiraan — ukur sendiri, dan hasilnya jadi bonus data Bab 4.

**Konsekuensi yang harus diterima:** pdf-lib tidak mengerti HTML/CSS. Maka model
template **harus** berupa *gambar latar + teks pada koordinat absolut* — dan
itu persis skema `template.penempatan` di bagian 7. Kedua keputusan ini saling
mengunci; jangan ubah salah satunya sendirian.

**Alur kerja desain yang mengikuti:**

```
1. Desainer membuat sertifikat di Canva / Figma / CorelDRAW
2. Ekspor sebagai PNG 300 dpi (atau PDF) TANPA teks yang berubah-ubah
3. Admin unggah sebagai latar template
4. Admin menaruh placeholder lewat form: x, y, ukuran, font, align, lebarMaks
5. Pratinjau dengan 3 data contoh -> termasuk satu nama sengaja dipanjangkan
```

Justru ini lebih cocok untuk institusi: desain sertifikat memang biasanya sudah
jadi dari tim desain, bukan disusun ulang dengan HTML.

**Catatan font:** sematkan berkas TTF sendiri lewat `fontkit`. Font bawaan
pdf-lib memakai encoding WinAnsi yang terbatas — cukup untuk sebagian besar nama
Indonesia, tetapi menyematkan font membuat hasilnya konsisten dan aman.

---

## 10. Keamanan dan Privasi

### Kepatuhan UU PDP No. 27/2022

| Aturan | Penerapan |
|---|---|
| Minimalisasi data | Hanya hash yang ke chain. Nama/NIM/email tetap di DB |
| Hak penghapusan (Pasal 8) | Data off-chain dapat dihapus. Hash on-chain tidak mengandung data pribadi sehingga tidak terdampak |
| Persetujuan | Checkbox eksplisit bila nama akan tampil di metadata NFT publik |

### Pengelolaan kunci — titik lemah utama sistem

Kunci penandatangan institusi bocor = siapa pun dapat menerbitkan sertifikat
palsu yang lolos verifikasi. Ini **kelemahan nyata** yang wajib dibahas jujur
di bab keamanan, bukan disembunyikan.

Mitigasi:

- Kunci di secret manager / variabel lingkungan, tidak pernah masuk repositori
- Wallet penerbitan terpisah dari wallet pemilik kontrak
- Saldo wallet penerbitan dijaga kecil (secukupnya untuk operasi)
- Kunci penandatangan voucher NFT berbeda dari kunci pemilik kontrak
- Rotasi kunci: kontrak menyimpan daftar penerbit sah, bukan satu alamat mati

### Kontrol lain

- Pemisahan wewenang: operator tidak dapat menerbitkan sendiri
- Rate limit di endpoint verifikasi publik
- Log audit tidak dapat dihapus lewat antarmuka
- Validasi berkas unggahan (jenis, ukuran, jumlah kolom)

---

## 11. Peta Jalan

Asumsi: dikerjakan sendiri, mulai dari nol. Sesuaikan bila sebagian sudah ada.

### Fase 0 — Fondasi (1 minggu)

- [ ] Inisialisasi repo, Bun + SvelteKit + Tailwind
- [ ] PostgreSQL via Docker Compose
- [ ] Skema Drizzle + migrasi
- [ ] Better Auth + 4 peran
- [ ] Anvil berjalan lokal

### Fase 1 — Kontrak (1 minggu)

- [ ] Foundry init, `RegistriSertifikat.sol`
- [ ] Uji unit: terbitkan, cabut, verifikasi, kasus gagal
- [ ] `forge test --gas-report` → simpan baseline
- [ ] Skrip deploy ke Anvil + testnet
- [ ] `AnchorAdapter` + `EvmAnchor` + `MockAnchor`

### Fase 2 — Inti penerbitan (2–3 minggu)

- [ ] CRUD template + editor penempatan + pratinjau
- [ ] Unggah CSV streaming + validasi + laporan error per baris
- [ ] Bangun dokumen kredensial (W3C VC) + tanda tangan institusi
- [ ] Bangun Merkle tree + simpan bukti
- [ ] Alur persetujuan (ajukan → setujui/tolak)
- [ ] Terbitkan on-chain + simpan `anchor_tx`
- [ ] Antrean pekerjaan + tampilan progres

### Fase 3 — Verifikasi dan distribusi (2 minggu)

- [ ] **Halaman verifikasi publik** — verifikasi di peramban, baca RPC langsung
- [ ] Render PDF saat diunduh (pdf-lib) + QR
- [ ] Portal peserta
- [ ] Pencabutan + on-chain
- [ ] Dashboard admin + indikator saldo wallet

### Fase 4 — Pengukuran (1 minggu) — INI BAB 4

- [ ] Skrip benchmark gas: batch 10 / 100 / 1.000 / 10.000 / 100.000
- [ ] Bandingkan 1 tx batch vs N tx individual
- [ ] Deploy kontrak yang sama ke 2–3 testnet, ukur
- [ ] Hitung biaya mainnet dari gas unit x harga gas x harga token
- [ ] Ukur waktu impor, waktu bangun Merkle, waktu render PDF

### Fase 5 — Klaim NFT (1–1,5 minggu) — OPSIONAL, BERSYARAT

> **Syarat kerjakan:** Fase 1–4 sudah selesai **dan** tersisa minimal 3 minggu
> sebelum tenggat. Kalau tidak, lewati — Fase 1–4 sudah merupakan sistem utuh
> yang layak disidangkan.
>
> **Catatan biaya:** fase ini **tidak menambah biaya institusi sama sekali**,
> karena transaksi klaim dikirim dan dibayar oleh peserta. Yang bertambah adalah
> waktu pengerjaan dan risiko saat demo (peserta perlu wallet dan saldo gas).
> Jadi keputusan mengerjakan atau melewati murni soal waktu, bukan biaya.
>
> Baca bagian 8.4 sebelum menulis kode klaim.

- [ ] `SertifikatSBT.sol` + uji
- [ ] Endpoint penandatangan voucher EIP-712
- [ ] wagmi: hubungkan wallet, deteksi jaringan salah, tombol pindah jaringan
- [ ] Tombol klaim + penanganan galat (wallet tidak ada, saldo nol, ditolak, klik dobel)
- [ ] Endpoint metadata `tokenURI`

### Fase 6 — Penyelesaian (1–2 minggu)

- [ ] UAT dengan pengguna nyata
- [ ] Dockerize + panduan deploy
- [ ] Rekam video demo, simpan semua tx hash + tangkapan layar explorer
- [ ] Penulisan

**Total: ~10–12 minggu** (Fase 5 dapat dilewati bila waktu mepet).

Fase 1–4 sudah merupakan sistem utuh yang layak disidangkan. Fase 5 sengaja
diletakkan di belakang: bila meleset, yang hilang hanya fitur pelengkap.

---

## 12. Rencana Pengujian

| Jenis | Cakupan | Alat |
|---|---|---|
| Unit kontrak | Semua fungsi + kasus gagal + kontrol akses | `forge test` |
| Fuzz kontrak | Merkle proof dengan input acak | `forge test` (fuzzing bawaan) |
| Unit aplikasi | Merkle, validasi CSV, tanda tangan | `bun test` |
| Integrasi | Alur penuh dengan `MockAnchor` | `bun test` |
| End-to-end | Unggah → setujui → terbit → verifikasi | Playwright |
| Blackbox | Tabel kasus uji per fitur | Manual, didokumentasikan |
| UAT | Operator, penandatangan, peserta, verifier | Kuesioner |
| Kinerja | Impor 100.000 baris, waktu bangun Merkle | Skrip benchmark |
| Biaya | Gas per operasi, lintas jaringan | `forge snapshot` |

---

## 13. Pemetaan ke Bab Skripsi

| Bab | Sumber dari dokumen ini |
|---|---|
| 1 — Pendahuluan | Bagian 2 (masalah, yang diklaim dan tidak diklaim) |
| 2 — Tinjauan Pustaka | Standar rujukan (VC, Open Badges, Blockcerts, EBSI), Merkle tree, EIP-712 |
| 3 — Metodologi | Bagian 5 (arsitektur), 7 (skema), 8 (kontrak), 11 (tahapan). Metode: Design Science Research |
| 4 — Hasil dan Pembahasan | Fase 4: tabel gas, grafik biaya per sertifikat, perbandingan lintas jaringan, hasil UAT |
| 5 — Penutup | Bagian 14 |

**Grafik kunci untuk Bab 4:** biaya per sertifikat terhadap jumlah peserta.
Kurva layanan SaaS komersial naik lurus; kurva sistem ini turun tajam mendekati
nol. Satu grafik itu menyampaikan seluruh argumen ekonomi.

---

## 14. Keterbatasan dan Penelitian Lanjutan

### Keterbatasan (tulis jujur)

1. Metadata NFT dan dokumen kredensial masih tersentralisasi di server penerbit
2. Kunci penandatangan institusi adalah titik kegagalan tunggal
3. Umur jaringan blockchain lebih pendek daripada umur guna sertifikat (10–20 tahun)
4. Peserta yang ingin mengklaim NFT harus memiliki saldo gas sendiri
5. Bila diuji di testnet: testnet dapat direset; hasil tidak identik dengan mainnet

### Penelitian lanjutan

1. **Gas sponsorship** lewat relayer atau ERC-4337 — peserta klaim tanpa saldo
2. **Jangkar multi-jaringan** untuk ketahanan jangka panjang
3. Integrasi **decentralized identifier (DID)** untuk identitas peserta
4. Penyimpanan terdesentralisasi (IPFS/Arweave) dengan model pembiayaan permanen
5. Federasi antar-institusi: registri penerbit tepercaya lintas kampus

---

## 15. Spesifikasi Teknis Kritis

Delapan hal berikut harus diputuskan **sebelum** menulis kode. Salah di sini
berarti membongkar ulang di tengah jalan.

### 15.1 Kanonikalisasi dokumen — celah paling berbahaya

Daun Merkle dihitung dari hash dokumen kredensial. Masalahnya, `JSON.stringify`
**tidak deterministik**: urutan kunci, spasi, escape unicode, dan format angka
dapat berbeda antar implementasi. Beda satu byte → hash berbeda → sertifikat
yang sah dinyatakan tidak sah.

**Aturan wajib:**

- Serialisasi memakai **RFC 8785 (JSON Canonicalization Scheme / JCS)**
  Pustaka: `canonicalize`.
- Kunci diurutkan leksikografis (UTF-16), tanpa spasi, angka format ES6.

**Jebakan Postgres:** tipe `JSONB` **mengurutkan ulang kunci dan menormalkan
angka**. Kalau dokumen disimpan sebagai `JSONB` lalu dibaca kembali untuk
di-hash, hasilnya berbeda dari saat penerbitan.

Karena itu skema berubah:

```sql
-- dokumen kanonik disimpan sebagai TEXT, INI yang di-hash
dokumen_kanonik  TEXT  NOT NULL,
-- salinan JSONB hanya untuk query/tampilan, TIDAK PERNAH untuk hashing
dokumen          JSONB NOT NULL,
```

Aturan tetap: **hash selalu dihitung dari `dokumen_kanonik`, tidak pernah dari
`dokumen`.**

### 15.2 Skema daun Merkle

Harus identik antara sisi JS dan sisi Solidity, termasuk hash gandanya.

```
hashDokumen = keccak256(utf8(dokumen_kanonik))
daun        = keccak256(keccak256(abi.encode(hashDokumen)))   // hash ganda
```

Hash ganda mencegah *second preimage attack* — tanpanya, simpul internal tree
dapat dipalsukan sebagai daun. Jangan implementasi sendiri:

- JS: `@openzeppelin/merkle-tree` → `StandardMerkleTree.of(baris, ["bytes32"])`
- Solidity: `MerkleProof.verify` dari OpenZeppelin

Keduanya sudah memakai skema yang sama persis. Menulis Merkle sendiri adalah
sumber bug paling umum di sistem seperti ini.

### 15.3 Skema kunci

Semua memakai kurva **secp256k1** (kurva Ethereum), tetapi **tiga kunci terpisah**:

| Kunci | Fungsi | Catatan |
|---|---|---|
| `KUNCI_PENERBIT` | Menandatangani dokumen kredensial (bukti PKI) | Alamatnya didaftarkan on-chain agar dapat dirotasi |
| `KUNCI_TX` | Mengirim transaksi penerbitan/pencabutan | Saldo kecil, terpisah dari pemilik kontrak |
| `KUNCI_VOUCHER` | Menandatangani voucher EIP-712 (Fase 5) | Hanya bila Fase 5 dikerjakan |

**Mengapa secp256k1, bukan Ed25519:** verifier dapat memeriksa tanda tangan
memakai pustaka yang sama yang dipakai untuk membaca blockchain (`viem`), tanpa
dependensi kriptografi tambahan di peramban. Satu pustaka untuk dua bukti.

### 15.4 Pemetaan idBatch

Basis data memakai UUID, kontrak memakai `bytes32`:

```ts
const idBatchOnchain = keccak256(toBytes(batch.id));   // UUID string -> bytes32
```

Deterministik dan tanpa ambiguitas padding. Pemetaan baliknya ada di tabel
`batch`, jadi tidak perlu reversibel.

### 15.5 Idempotensi dan nonce

Skenario gagal: transaksi terkirim, server mati sebelum sempat menyimpan
`txHash` → percobaan ulang mengirim transaksi kedua.

**Pengaman berlapis:**

1. Kontrak menolak `idBatch` yang sudah ada (`require(rootBatch[idBatch] == 0)`)
2. Status `memproses` disimpan **sebelum** transaksi dikirim
3. `txHash` disimpan segera setelah dikirim, tidak menunggu konfirmasi
4. Worker penerbitan berjalan **serial per wallet** memakai
   `pg_advisory_lock` — dua transaksi bersamaan dari wallet yang sama
   menyebabkan bentrok nonce

### 15.6 Strategi cache verifikasi

Halaman verifikasi bisa jadi endpoint tersibuk. Membaca RPC untuk tiap kunjungan
akan kena rate limit penyedia RPC.

| Data | Berubah? | Cache |
|---|---|---|
| Merkle root batch | Tidak pernah setelah terbit | Permanen |
| Status dicabut | Bisa | 60 detik |
| Dokumen + bukti | Tidak pernah | Permanen |

**Tetapi klaim risetmu menuntut lebih.** Kalau verifikasi hanya membaca cache
server, verifier tetap memercayai penerbit. Solusinya dua lapis:

1. **Render awal** memakai cache server — cepat, untuk semua pengunjung
2. **Tombol "Verifikasi Mandiri"** — peramban membaca RPC publik secara langsung
   dan menghitung ulang bukti Merkle di sisi klien, tanpa menyentuh server penerbit

Lapis kedua inilah yang membuktikan klaim utama. Wajib ada, dan wajib
didemonstrasikan saat sidang.

### 15.7 Portabilitas bukti — penutup celah klaim utama

**Celah:** kalau basis data penerbit hilang, blockchain hanya menyimpan root.
Dokumen tidak dapat direkonstruksi dari root. Artinya klaim "ketersediaan jangka
panjang" **tidak berlaku** — sistem tetap bergantung pada server penerbit.

**Penutupnya:** setiap peserta dapat mengunduh berkas bukti mandiri.

```json
{
  "versi": "1.0",
  "dokumen": "<string kanonik, apa adanya>",
  "tandaTanganPenerbit": "0x...",
  "alamatPenerbit": "0x...",
  "daun": "0x...",
  "buktiMerkle": ["0x...", "0x..."],
  "idBatchOnchain": "0x...",
  "jaringan": { "nama": "monad", "chainId": 0, "kontrak": "0x...", "rpc": "https://..." }
}
```

Dengan berkas ini + blockchain, sertifikat dapat diverifikasi **tanpa server
penerbit sama sekali**. Konsekuensinya:

- Halaman verifikasi wajib menerima unggahan berkas ini sebagai mode alternatif
- Operator dapat mengekspor seluruh batch (JSONL) untuk arsip institusi
- Klaim "ketersediaan jangka panjang" di bagian 2 menjadi benar secara harfiah

Tanpa bagian ini, klaim riset utama tidak dapat dipertahankan. Ini bukan fitur
tambahan — ini penopang tesisnya.

### 15.8 Kriteria keberhasilan

Harus terukur, bukan "sistem berjalan dengan baik".

| # | Kriteria | Target |
|---|---|---|
| K1 | Satu batch = satu transaksi, terlepas dari jumlah peserta | Terbukti untuk N = 10 … 100.000 |
| K2 | Biaya gas penerbitan konstan terhadap N | Simpangan < 5% antar ukuran batch |
| K3 | Impor 100.000 baris CSV | < 5 menit, memori < 512 MB |
| K4 | Render satu PDF | < 200 ms (p95) |
| K5 | Verifikasi sisi klien tanpa server penerbit | Berhasil, dibuktikan dengan server dimatikan |
| K6 | Verifikasi dari berkas bukti portabel | Berhasil tanpa akses ke basis data |
| K7 | Pencabutan tercermin di verifikasi | < 60 detik setelah transaksi terkonfirmasi |
| K8 | Cakupan uji kontrak | 100% baris, semua jalur revert teruji |
| K9 | Operator tidak dapat menerbitkan sendiri | Ditolak, tercatat di log audit |
| K10 | Tidak ada data pribadi di chain | Diaudit manual atas seluruh kalkulasi data transaksi |

---

## 16. Struktur Direktori

```
Skripsi/
├── plan.md
├── CLAUDE.md
├── README.md
├── contracts/                  # Foundry
│   ├── foundry.toml
│   ├── src/
│   │   ├── RegistriSertifikat.sol
│   │   └── SertifikatSBT.sol           # Fase 5
│   ├── test/
│   ├── script/
│   └── lib/
├── apps/web/                   # SvelteKit + Bun
│   ├── src/
│   │   ├── lib/
│   │   │   ├── server/
│   │   │   │   ├── db/         # skema + migrasi Drizzle
│   │   │   │   ├── anchor/     # AnchorAdapter + Evm + Mock
│   │   │   │   ├── merkle.ts
│   │   │   │   ├── kredensial.ts   # bangun + kanonikalisasi + tanda tangan
│   │   │   │   ├── pdf.ts
│   │   │   │   └── csv.ts
│   │   │   └── verifikasi.ts   # dipakai server DAN peramban
│   │   └── routes/
│   └── package.json
└── bench/                      # skrip pengukuran Fase 4
```

Catatan: `lib/verifikasi.ts` sengaja isomorfik — logika yang sama dipakai server
dan peramban, sehingga verifikasi sisi klien (15.6) tidak menduplikasi kode.

---

## 17. Variabel Lingkungan

```bash
# Basis data
DATABASE_URL="postgres://user:sandi@localhost:5432/sertifikat"

# Kunci (JANGAN pernah masuk repositori)
KUNCI_PENERBIT="0x..."        # menandatangani dokumen kredensial
KUNCI_TX="0x..."              # mengirim transaksi
KUNCI_VOUCHER="0x..."         # EIP-712, Fase 5 saja

# Jaringan
CHAIN_ID="..."
RPC_URL="https://..."
RPC_URL_PUBLIK="https://..."  # dipakai peramban untuk verifikasi mandiri
ALAMAT_REGISTRI="0x..."
ALAMAT_SBT="0x..."            # Fase 5 saja

# Aplikasi
BASE_URL="https://..."
AMBANG_SALDO_WALLET="0.05"    # peringatan bila saldo di bawah ini

# Penyimpanan
STORAGE_DRIVER="lokal"        # lokal | s3
STORAGE_PATH="./data/berkas"
```

---

## 18. Hasil Pengukuran Awal

Diukur pada 2026-08-30. Foundry 1.7.1, Solc 0.8.28 (optimizer 200 runs), Bun 1.3.13.
Regenerasi: `cd contracts && forge test --match-contract BiayaSkala -vv`

### K1/K2 — biaya penerbitan konstan terhadap jumlah sertifikat

| N (sertifikat dalam batch) | Gas `terbitkanBatch` |
|---|---|
| 10 | 26.575 |
| 100 | 26.576 |
| 1.000 | 26.575 |
| 10.000 | 26.575 |
| 100.000 | 26.576 |
| 1.000.000 | 26.576 |

**Selisih total: 1 gas. Simpangan: 0%.** K1 dan K2 terpenuhi.
Selisih 1 gas itu murni berasal dari jumlah byte bukan-nol pada calldata
`jumlah` (16 gas per byte), bukan dari jumlah sertifikat.

> **Catatan metodologi — penting untuk bab metodologi.**
> Pengukuran pertama sempat menunjukkan N=10 seolah 6.500 gas lebih mahal.
> Itu artefak biaya akses *cold* (EIP-2929): akun kontrak 2.600 gas dan slot
> `owner` 2.100 gas, dibayar sekali pada panggilan pertama. Setelah ditambahkan
> panggilan pemanasan, selisihnya hilang. Pengukuran gas tanpa pemanasan
> menghasilkan kesimpulan yang keliru.

### Gas transaksi NYATA — angka yang harus dipakai untuk menghitung biaya

Diukur dengan deploy sungguhan ke Anvil dan `cast send`, bukan lewat `forge test`.

| N (sertifikat dalam batch) | Gas transaksi penuh |
|---|---|
| 10 | 50.884 |
| 1.000 | 50.908 |
| 100.000 | 50.932 |
| 1.000.000 | 50.932 |

Selisih 48 gas (0,09%) — konstansi tetap terbukti di tingkat transaksi nyata.

Deploy kontrak (sekali seumur sistem): **669.521 gas**.

> **Koreksi metodologi yang penting.**
> Angka 26.576 dari `forge test` mengukur **eksekusi internal saja**, karena
> `gasleft()` dipasang mengelilingi panggilan fungsi. Transaksi sungguhan
> menambahkan biaya yang tidak terlihat di dalam pengukuran itu:
>
> | Komponen | Perkiraan gas |
> |---|---|
> | Biaya dasar transaksi (intrinsic) | 21.000 |
> | Calldata (argumen + string nama kegiatan) | ~1.300 |
> | Akses *cold* akun kontrak + slot `owner` | ~4.700 |
> | Eksekusi internal (terukur di `forge test`) | 26.576 |
> | **Total transaksi** | **~50.900** |
>
> **Untuk menghitung biaya rupiah di Bab 4, pakai 50.932 — bukan 26.576.**
> Memakai angka `forge test` akan menaksir biaya terlalu rendah hampir separuh.
> Gunakan `forge test` untuk membandingkan optimasi antar-versi kontrak, dan
> pengukuran on-chain untuk menghitung biaya sesungguhnya.

Dengan angka ini, rumus biaya di bagian 4 menjadi:

```
biaya = 50.932 x hargaGas(gwei) x 1e-9 x hargaToken
```

### Perbandingan dengan pendekatan naif (N = 100.000)

| Pendekatan | Total gas | Rasio |
|---|---|---|
| Naif, 1 transaksi per sertifikat | 4.556.100.000 | 171.552x |
| Naif, dikumpulkan dalam satu transaksi | 2.456.121.000 | 92.481x |
| **Merkle batch, 1 transaksi** | **26.558** | **1x** |

Pendekatan naif untuk N=100.000 juga **tidak muat dalam satu blok**
(batas umum 30.000.000 gas) sehingga harus dipecah menjadi ratusan transaksi.

Biaya operasi lain:

| Operasi | Gas |
|---|---|
| `cabut` (1 sertifikat) | 32.582 |
| `cabutBanyak` (per sertifikat, batch 50) | 25.043 |
| `verifikasi` (view, kedalaman 17) | 7.757 |

### K3 — kinerja pembangunan batch

| N | Dokumen + hash (ms) | Merkle (ms) | Total (ms) | Kedalaman bukti | Memori (MB) |
|---|---|---|---|---|---|
| 100 | 28 | 99 | 127 | 7 | 0 |
| 1.000 | 68 | 468 | 536 | 10 | 7 |
| 10.000 | 585 | 4.160 | 4.745 | 14 | 24 |
| 50.000 | 2.187 | 22.233 | 24.420 | 16 | 85 |
| 100.000 | 7.454 | 42.040 | 49.494 | 17 | 183 |

**K3 terpenuhi** (target < 5 menit, < 512 MB): 100.000 peserta selesai dalam
49 detik dengan 183 MB.

Temuan: pembangunan Merkle mendominasi (~85% waktu), terutama karena bukti
dihitung untuk **semua** entri di muka. Bila kelak jadi hambatan, buktinya dapat
dihitung saat diminta — pola yang sama dengan keputusan render PDF (9.1).

Kedalaman bukti tumbuh logaritmik: 100.000 peserta hanya butuh 17 hash
(~544 byte) per bukti, bukan 100.000.

### Kompatibilitas TypeScript ↔ Solidity

`contracts/test/MerkleKompatibilitas.t.sol` memverifikasi bukti yang dihasilkan
TypeScript langsung di dalam kontrak Solidity. Ini menutup risiko integrasi
terbesar: bila skema hash daun (15.2) kedua sisi berbeda, kegagalan muncul di
uji ini, bukan setelah sistem berjalan.

### Cakupan uji saat ini

| Suite | Jumlah | Status |
|---|---|---|
| `contracts` (Foundry, termasuk 2 fuzz) | 33 | lolos |
| `apps/web` (Bun) | 22 | lolos |

---

## 19. Keputusan yang Belum Diambil

- [x] Jaringan target penelitian: **Monad**, dengan 2 jaringan pembanding untuk
      pengukuran (lihat 6.1). Pembanding belum ditentukan.
- [ ] Dua jaringan pembanding: Base / Polygon / Arbitrum — pilih 2
- [ ] Testnet saja, atau satu batch demo di mainnet
- [ ] Object storage: filesystem lokal, MinIO, atau S3-compatible
- [ ] Pengiriman email: dikerjakan atau cukup unduh manual
- [ ] Fase 5 (klaim NFT) dikerjakan atau tidak — tergantung sisa waktu, BUKAN biaya
- [ ] Persetujuan pembimbing atas pendekatan Merkle batch (bukan NFT per orang)
