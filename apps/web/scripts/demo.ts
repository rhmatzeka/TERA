/**
 * Demo alur penuh terhadap rantai sungguhan.
 *
 *   anvil --silent &
 *   cd contracts && KUNCI_TX=0xac09... forge script script/Deploy.s.sol \
 *       --rpc-url http://127.0.0.1:8545 --broadcast
 *   cd apps/web && ALAMAT_REGISTRI=0x... bun run scripts/demo.ts
 */
import type { Hex } from 'viem';
import { formatEther } from 'viem';
import { mkdir, writeFile } from 'node:fs/promises';
import { EvmAnchor } from '../src/lib/server/anchor/evm';
import { bangunBatch, idBatchOnchain } from '../src/lib/merkle';
import { bangunDokumen, hashDariDokumen } from '../src/lib/kredensial';

const RPC = process.env.RPC_URL ?? 'http://127.0.0.1:8545';
const KONTRAK = process.env.ALAMAT_REGISTRI as Hex;
const KUNCI = (process.env.KUNCI_TX ??
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as Hex;
const JUMLAH = Number(process.env.JUMLAH ?? 500);
const HARGA_TOKEN_IDR = Number(process.env.HARGA_TOKEN_IDR ?? 50_000_000);

if (!KONTRAK) throw new Error('ALAMAT_REGISTRI belum diisi');

const garis = (j = 62) => console.log('─'.repeat(j));
const rupiah = (n: number) =>
	n < 1 ? `Rp ${n.toFixed(4)}` : `Rp ${Math.round(n).toLocaleString('id-ID')}`;

// ── data peserta (menirukan hasil impor CSV) ──────────────────────────
const NAMA_DEPAN = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Rizki', 'Putri', 'Agus', 'Nur'];
const NAMA_BELAKANG = ['Santoso', 'Rahayu', 'Wijaya', 'Lestari', 'Pratama', 'Anggraini'];

function pesertaCsv(n: number) {
	return Array.from({ length: n }, (_, i) => ({
		nama: `${NAMA_DEPAN[i % NAMA_DEPAN.length]} ${NAMA_BELAKANG[i % NAMA_BELAKANG.length]}`,
		nomorIdentitas: `2021${String(i + 1).padStart(5, '0')}`,
		email: `peserta${i + 1}@kampus.ac.id`
	}));
}

const anchor = new EvmAnchor({
	nama: 'anvil-lokal',
	chainId: 31337,
	rpcUrl: RPC,
	alamatKontrak: KONTRAK,
	kunciTx: KUNCI,
	simbolNativ: 'ETH'
});

console.log('');
garis();
console.log('  DEMO PENERBITAN SERTIFIKAT BERBASIS BLOCKCHAIN');
garis();
console.log(`jaringan  : ${anchor.nama} (chainId ${anchor.chainId})`);
console.log(`kontrak   : ${anchor.alamatKontrak}`);
console.log(`saldo     : ${formatEther(await anchor.saldo())} ETH`);

// ── 1. bangun kredensial ──────────────────────────────────────────────
console.log('');
console.log(`[1] Membangun ${JUMLAH.toLocaleString('id-ID')} dokumen kredensial…`);
const t0 = performance.now();

const uuidBatch = crypto.randomUUID();
const ALAMAT_PENERBIT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Hex;

const csv = pesertaCsv(JUMLAH);
const dokumen = csv.map((p, i) => {
	const dok = bangunDokumen({
		idSertifikat: crypto.randomUUID(),
		alamatPenerbit: ALAMAT_PENERBIT,
		namaPenerbit: 'Universitas Contoh',
		namaKegiatan: 'Webinar Nasional Blockchain 2026',
		tanggalKegiatan: '2026-03-15',
		penyelenggara: 'Fakultas Teknik',
		subjek: { nama: p.nama, nomorIdentitas: p.nomorIdentitas, email: p.email, peran: 'Peserta' }
	});
	const { kanonik, hash } = hashDariDokumen(dok);
	return { idSertifikat: dok.id.replace('urn:uuid:', ''), hashDokumen: hash, kanonik, nama: p.nama, i };
});

const t1 = performance.now();
console.log(`    selesai dalam ${(t1 - t0).toFixed(0)} ms`);
console.log(`    contoh dokumen kanonik (${dokumen[0].kanonik.length} byte):`);
console.log(`    ${dokumen[0].kanonik.slice(0, 110)}…`);

// ── 2. merkle tree ────────────────────────────────────────────────────
console.log('');
console.log('[2] Membangun Merkle tree…');
const t2 = performance.now();
const { root, entri } = bangunBatch(dokumen);
const t3 = performance.now();

const kedalaman = Math.max(...entri.map((e) => e.bukti.length));
console.log(`    selesai dalam ${(t3 - t2).toFixed(0)} ms`);
console.log(`    root            : ${root}`);
console.log(`    kedalaman bukti : ${kedalaman} hash (${kedalaman * 32} byte per peserta)`);

// ── 3. terbitkan on-chain ─────────────────────────────────────────────
console.log('');
console.log('[3] Menerbitkan ke blockchain — SATU transaksi untuk semua peserta…');
const idOnchain = idBatchOnchain(uuidBatch);
const t4 = performance.now();
const hasil = await anchor.terbitkanBatch(idOnchain, root, 'Webinar Nasional Blockchain 2026', JUMLAH);
const t5 = performance.now();

const gas = hasil.gasTerpakai!;
const biayaEth = Number(formatEther(hasil.biayaWei!));
const biayaIdr = biayaEth * HARGA_TOKEN_IDR;

console.log(`    txHash     : ${hasil.txHash}`);
console.log(`    blok       : ${hasil.nomorBlok}`);
console.log(`    gas        : ${gas.toLocaleString('id-ID')}`);
console.log(`    waktu      : ${(t5 - t4).toFixed(0)} ms`);
console.log(`    biaya      : ${biayaEth.toFixed(9)} ETH  ≈ ${rupiah(biayaIdr)}`);
console.log(`    per peserta: ${rupiah(biayaIdr / JUMLAH)}`);

// ── 4. verifikasi ─────────────────────────────────────────────────────
console.log('');
console.log('[4] Verifikasi terhadap blockchain (tanpa basis data penerbit)…');
const contoh = [0, Math.floor(JUMLAH / 2), JUMLAH - 1];
for (const idx of contoh) {
	const e = entri.find((x) => x.indeks === idx) ?? entri[0];
	const asal = dokumen.find((d) => d.hashDokumen === e.hashDokumen)!;
	const st = await anchor.verifikasi(idOnchain, e.daun, e.bukti);
	console.log(`    ${st.sah ? '✓ SAH  ' : '✗ TOLAK'}  ${asal.nama.padEnd(18)} ${asal.idSertifikat}`);
}

// ── 5. dokumen palsu ──────────────────────────────────────────────────
console.log('');
console.log('[5] Uji dokumen palsu — nama diubah setelah penerbitan…');
const asli = dokumen[0];
const palsu = bangunDokumen({
	idSertifikat: asli.idSertifikat,
	alamatPenerbit: ALAMAT_PENERBIT,
	namaPenerbit: 'Universitas Contoh',
	namaKegiatan: 'Webinar Nasional Blockchain 2026',
	tanggalKegiatan: '2026-03-15',
	penyelenggara: 'Fakultas Teknik',
	subjek: { nama: 'Penyusup Budiman', nomorIdentitas: '2021000001', email: asli.kanonik && 'x@y.z', peran: 'Peserta' }
});
const hashPalsu = hashDariDokumen(palsu).hash;
const entriAsli = entri.find((e) => e.hashDokumen === asli.hashDokumen)!;
const { hitungDaun } = await import('../src/lib/merkle');
const stPalsu = await anchor.verifikasi(idOnchain, hitungDaun(hashPalsu), entriAsli.bukti);
console.log(`    dokumen diubah → ${stPalsu.sah ? '✗ LOLOS (BUG!)' : '✓ DITOLAK'}`);

// ── 6. pencabutan ─────────────────────────────────────────────────────
console.log('');
console.log('[6] Mencabut satu sertifikat…');
const target = entri.find((e) => e.hashDokumen === dokumen[1].hashDokumen)!;
const cabut = await anchor.cabut(target.daun, 'terbukti tidak menghadiri kegiatan');
const stSesudah = await anchor.verifikasi(idOnchain, target.daun, target.bukti);
const stLain = await anchor.verifikasi(idOnchain, entriAsli.daun, entriAsli.bukti);

console.log(`    txHash                 : ${cabut.txHash}`);
console.log(`    gas                    : ${cabut.gasTerpakai!.toLocaleString('id-ID')}`);
console.log(`    ${dokumen[1].nama} → sah=${stSesudah.sah} dicabut=${stSesudah.sudahCabut}`);
console.log(`    peserta lain tetap sah : ${stLain.sah}`);

// ── 7. simpan data untuk aplikasi web ────────────────────────────────
console.log('');
console.log('[7] Menyimpan data batch untuk aplikasi web…');

const perHash = new Map(dokumen.map((d) => [d.hashDokumen, d]));
const sertifikat = entri.map((e) => {
	const d = perHash.get(e.hashDokumen)!;
	return {
		id: d.idSertifikat,
		nama: d.nama,
		dokumenKanonik: d.kanonik,
		hashDokumen: e.hashDokumen,
		daun: e.daun,
		bukti: e.bukti,
		indeks: e.indeks,
		dicabutLokal: e.daun === target.daun
	};
});

const berkasData = {
	batch: {
		uuid: uuidBatch,
		idOnchain,
		root,
		namaKegiatan: 'Webinar Nasional Blockchain 2026',
		tanggalKegiatan: '2026-03-15',
		penyelenggara: 'Fakultas Teknik',
		namaPenerbit: 'Universitas Contoh',
		alamatPenerbit: ALAMAT_PENERBIT,
		jumlah: JUMLAH,
		txHash: hasil.txHash,
		nomorBlok: Number(hasil.nomorBlok ?? 0n),
		gasTerpakai: Number(gas),
		biayaWei: (hasil.biayaWei ?? 0n).toString(),
		kedalamanBukti: kedalaman
	},
	jaringan: {
		nama: 'anvil-lokal',
		chainId: 31337,
		rpcUrl: RPC,
		kontrak: KONTRAK
	},
	sertifikat
};

await mkdir('data', { recursive: true });
await writeFile('data/batch.json', JSON.stringify(berkasData, null, 0));
console.log(`    data/batch.json (${sertifikat.length} sertifikat)`);
console.log('    jalankan `bun run dev` lalu buka http://localhost:5173');

// ── ringkasan ─────────────────────────────────────────────────────────
console.log('');
garis();
console.log('  RINGKASAN');
garis();
const naifPerSert = 52_061;
console.log(`peserta                    : ${JUMLAH.toLocaleString('id-ID')}`);
console.log(`transaksi blockchain       : 1`);
console.log(`gas terpakai               : ${gas.toLocaleString('id-ID')}`);
console.log(`biaya total                : ${rupiah(biayaIdr)}`);
console.log(`biaya per sertifikat       : ${rupiah(biayaIdr / JUMLAH)}`);
console.log('');
console.log(`jika 1 transaksi/sertifikat: ${(naifPerSert * JUMLAH).toLocaleString('id-ID')} gas`);
console.log(`penghematan                : ${Math.round((naifPerSert * JUMLAH) / Number(gas)).toLocaleString('id-ID')}x`);
console.log('');
console.log('data pribadi di blockchain : TIDAK ADA (hanya root 32 byte)');
console.log(`ukuran data on-chain       : 32 byte untuk ${JUMLAH.toLocaleString('id-ID')} peserta`);
garis();
console.log('');
