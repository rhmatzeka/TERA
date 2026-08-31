/**
 * Pembentukan batch dan penerbitannya ke blockchain.
 * Inilah inti alur pada plan.md 5.3.
 */
import { env } from '$env/dynamic/private';
import type { Hex } from 'viem';
import { bangunDokumen, hashDariDokumen } from '$lib/kredensial';
import { bangunBatch, idBatchOnchain } from '$lib/merkle';
import type { BarisPeserta } from './csv';
import { anchorAktif } from './anchorAktif';
import { ambilBatch, simpanBatch, type BerkasBatch, type Jaringan, type MetaBatch } from './toko';

export interface RincianKegiatan {
	namaKegiatan: string;
	tanggalKegiatan: string;
	penyelenggara: string;
	namaPenerbit: string;
	templateId?: string;
}

/** Konfigurasi jaringan dari variabel lingkungan. */
export function jaringanAktif(): Jaringan | null {
	const kontrak = env.ALAMAT_REGISTRI as Hex | undefined;
	const rpcUrl = env.RPC_URL;
	if (!kontrak || !rpcUrl) return null;
	return {
		nama: env.NAMA_JARINGAN ?? 'anvil-lokal',
		chainId: Number(env.CHAIN_ID ?? 31337),
		rpcUrl,
		kontrak
	};
}

/**
 * Membangun batch: dokumen kredensial -> kanonikalisasi -> hash -> Merkle.
 * Belum menyentuh blockchain; status berhenti di `menunggu_persetujuan`.
 */
export async function siapkanBatch(
	rincian: RincianKegiatan,
	peserta: BarisPeserta[],
	dibuatOleh: string
): Promise<BerkasBatch> {
	const jaringan = jaringanAktif();
	if (!jaringan) throw new Error('Konfigurasi jaringan belum lengkap (ALAMAT_REGISTRI / RPC_URL)');

	const alamatPenerbit = (env.ALAMAT_PENERBIT ??
		'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') as Hex;
	const uuid = crypto.randomUUID();

	const dokumen = peserta.map((p) => {
		const idSert = crypto.randomUUID();
		const dok = bangunDokumen({
			idSertifikat: idSert,
			alamatPenerbit,
			namaPenerbit: rincian.namaPenerbit,
			namaKegiatan: rincian.namaKegiatan,
			tanggalKegiatan: rincian.tanggalKegiatan,
			penyelenggara: rincian.penyelenggara,
			subjek: {
				nama: p.nama,
				email: p.email,
				nomorIdentitas: p.nomorIdentitas || undefined,
				peran: p.peran
			}
		});
		const { kanonik, hash } = hashDariDokumen(dok);
		return { idSertifikat: idSert, hashDokumen: hash, kanonik, nama: p.nama };
	});

	const { root, entri } = bangunBatch(dokumen);
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
			dicabutLokal: false
		};
	});

	const batch: MetaBatch = {
		uuid,
		idOnchain: idBatchOnchain(uuid),
		root,
		...rincian,
		templateId: rincian.templateId ?? 'bawaan',
		alamatPenerbit,
		jumlah: sertifikat.length,
		status: 'menunggu_persetujuan',
		dibuatPada: new Date().toISOString(),
		dibuatOleh,
		txHash: null,
		nomorBlok: null,
		gasTerpakai: null,
		biayaWei: null,
		kedalamanBukti: Math.max(...entri.map((e) => e.bukti.length))
	};

	const isi: BerkasBatch = { batch, jaringan, sertifikat };
	await simpanBatch(isi);
	return isi;
}

/**
 * Menerbitkan batch ke blockchain — SATU transaksi, berapa pun jumlah peserta.
 *
 * Idempotensi (plan.md 15.5): status `memproses` disimpan sebelum transaksi
 * dikirim, dan kontrak menolak `idBatch` yang sudah ada, sehingga percobaan
 * ulang tidak menghasilkan penerbitan ganda.
 */
export async function terbitkanBatch(uuid: string, disetujuiOleh: string): Promise<BerkasBatch> {
	const isi = await ambilBatch(uuid);
	if (!isi) throw new Error('Batch tidak ditemukan');
	if (isi.batch.status === 'terbit') throw new Error('Batch ini sudah diterbitkan');

	const anchor = await anchorAktif();
	if (!anchor) throw new Error('KUNCI_TX belum diatur — transaksi tidak dapat dikirim');

	isi.batch.status = 'memproses';
	isi.batch.disetujuiOleh = disetujuiOleh;
	isi.batch.disetujuiPada = new Date().toISOString();
	await simpanBatch(isi);

	try {
		const hasil = await anchor.terbitkanBatch(
			isi.batch.idOnchain,
			isi.batch.root,
			isi.batch.namaKegiatan,
			isi.batch.jumlah
		);
		isi.batch.status = 'terbit';
		isi.batch.txHash = hasil.txHash;
		isi.batch.nomorBlok = Number(hasil.nomorBlok ?? 0n);
		isi.batch.gasTerpakai = Number(hasil.gasTerpakai ?? 0n);
		isi.batch.biayaWei = (hasil.biayaWei ?? 0n).toString();
		delete isi.batch.galat;
	} catch (e) {
		isi.batch.status = 'gagal';
		isi.batch.galat = e instanceof Error ? e.message.slice(0, 300) : String(e);
	}

	await simpanBatch(isi);
	if (isi.batch.status === 'gagal') throw new Error(isi.batch.galat);
	return isi;
}
