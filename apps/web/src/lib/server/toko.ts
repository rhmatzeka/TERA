/**
 * Penyimpanan batch — banyak batch, satu berkas per batch.
 *
 * PROTOTIPE: pada Fase 2 seluruh modul ini diganti PostgreSQL + Drizzle
 * (tabel `batch` dan `sertifikat` pada plan.md bagian 7). Bentuk fungsinya
 * sengaja dibuat menyerupai query agar penggantiannya lurus.
 */
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import type { Hex } from 'viem';

const DIR = 'data/batch';
const LAMA = 'data/batch.json'; // format lama, satu batch

export type StatusBatch = 'draf' | 'menunggu_persetujuan' | 'memproses' | 'terbit' | 'gagal';

export interface SertifikatData {
	id: string;
	nama: string;
	dokumenKanonik: string;
	hashDokumen: Hex;
	daun: Hex;
	bukti: Hex[];
	indeks: number;
	dicabutLokal: boolean;
}

export interface MetaBatch {
	uuid: string;
	idOnchain: Hex;
	root: Hex;
	namaKegiatan: string;
	tanggalKegiatan: string;
	penyelenggara: string;
	namaPenerbit: string;
	alamatPenerbit: Hex;
	jumlah: number;
	status: StatusBatch;
	dibuatPada: string;
	dibuatOleh?: string;
	disetujuiOleh?: string;
	disetujuiPada?: string;
	txHash: Hex | null;
	nomorBlok: number | null;
	gasTerpakai: number | null;
	biayaWei: string | null;
	kedalamanBukti: number;
	templateId?: string;
	galat?: string;
}

export interface Jaringan {
	nama: string;
	chainId: number;
	rpcUrl: string;
	kontrak: Hex;
}

export interface BerkasBatch {
	batch: MetaBatch;
	jaringan: Jaringan;
	sertifikat: SertifikatData[];
}

/**
 * Cache per-berkas berdasarkan waktu ubah.
 *
 * Direktori di-`readdir` setiap kali (murah), lalu hanya berkas yang berubah
 * yang dibaca ulang. Cara ini tahan terhadap berkas yang ditambah atau dihapus
 * dari luar aplikasi — mtime direktori tidak dapat diandalkan pada mount
 * Windows/WSL, sehingga tidak dipakai sebagai penanda.
 */
const cache = new Map<string, { mtime: number; isi: BerkasBatch }>();
let sudahMigrasi = false;

/**
 * Memindahkan berkas format lama (satu batch di `data/batch.json`) ke dalam
 * toko, sekali saja. Dipakai untuk data yang dihasilkan `scripts/demo.ts`.
 */
async function migrasi(): Promise<void> {
	try {
		const isi = JSON.parse(await readFile(LAMA, 'utf-8')) as BerkasBatch;
		isi.batch.status ??= 'terbit';
		isi.batch.dibuatPada ??= new Date().toISOString();
		await mkdir(DIR, { recursive: true });
		await writeFile(`${DIR}/${isi.batch.uuid}.json`, JSON.stringify(isi));
		await rename(LAMA, `${LAMA}.dipindahkan`);
	} catch {
		/* tidak ada berkas lama — abaikan */
	}
}

async function muatSemua(): Promise<Map<string, BerkasBatch>> {
	if (!sudahMigrasi) {
		await migrasi();
		sudahMigrasi = true;
	}
	await mkdir(DIR, { recursive: true });

	const berkasAda = new Set<string>();
	const hasil = new Map<string, BerkasBatch>();

	for (const berkas of await readdir(DIR)) {
		if (!berkas.endsWith('.json')) continue;
		const jalur = `${DIR}/${berkas}`;
		berkasAda.add(jalur);

		let mtime: number;
		try {
			mtime = (await stat(jalur)).mtimeMs;
		} catch {
			continue;
		}

		const tersimpan = cache.get(jalur);
		if (tersimpan && tersimpan.mtime === mtime) {
			hasil.set(tersimpan.isi.batch.uuid, tersimpan.isi);
			continue;
		}

		try {
			const isi = JSON.parse(await readFile(jalur, 'utf-8')) as BerkasBatch;
			cache.set(jalur, { mtime, isi });
			hasil.set(isi.batch.uuid, isi);
		} catch {
			/* berkas rusak atau sedang ditulis — lewati */
		}
	}

	// buang entri cache yang berkasnya sudah tidak ada
	for (const jalur of cache.keys()) {
		if (!berkasAda.has(jalur)) cache.delete(jalur);
	}

	return hasil;
}

export function kosongkanCache(): void {
	cache.clear();
}

export async function simpanBatch(isi: BerkasBatch): Promise<void> {
	await mkdir(DIR, { recursive: true });
	const jalur = `${DIR}/${isi.batch.uuid}.json`;
	await writeFile(jalur, JSON.stringify(isi));
	try {
		cache.set(jalur, { mtime: (await stat(jalur)).mtimeMs, isi });
	} catch {
		cache.delete(jalur);
	}
}

export async function ambilBatch(uuid: string): Promise<BerkasBatch | null> {
	return (await muatSemua()).get(uuid) ?? null;
}

/** Ringkasan seluruh batch, terbaru lebih dulu. */
export async function daftarBatch(): Promise<MetaBatch[]> {
	return [...(await muatSemua()).values()]
		.map((b) => b.batch)
		.sort((a, b) => (b.dibuatPada ?? '').localeCompare(a.dibuatPada ?? ''));
}

/** Batch terbit paling akhir — dipakai halaman publik sebagai bawaan. */
export async function batchTerakhirTerbit(): Promise<BerkasBatch | null> {
	const semua = [...(await muatSemua()).values()]
		.filter((b) => b.batch.status === 'terbit')
		.sort((a, b) => (b.batch.dibuatPada ?? '').localeCompare(a.batch.dibuatPada ?? ''));
	return semua[0] ?? null;
}

/** Mencari satu sertifikat di SELURUH batch. */
export async function cariSertifikatGlobal(
	idSert: string
): Promise<{ sert: SertifikatData; isi: BerkasBatch } | null> {
	for (const isi of (await muatSemua()).values()) {
		const sert = isi.sertifikat.find((s) => s.id === idSert);
		if (sert) return { sert, isi };
	}
	return null;
}

/** Sertifikat milik satu surel, lintas batch. */
export async function sertifikatMilik(
	surel: string
): Promise<{ sert: SertifikatData; isi: BerkasBatch }[]> {
	const hasil: { sert: SertifikatData; isi: BerkasBatch }[] = [];
	for (const isi of (await muatSemua()).values()) {
		if (isi.batch.status !== 'terbit') continue;
		for (const sert of isi.sertifikat) {
			try {
				if (JSON.parse(sert.dokumenKanonik).credentialSubject.email?.toLowerCase() === surel) {
					hasil.push({ sert, isi });
				}
			} catch {
				/* dokumen rusak */
			}
		}
	}
	return hasil;
}
