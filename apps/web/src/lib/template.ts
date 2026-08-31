/**
 * Definisi template sertifikat — aman untuk klien (dipakai editor visual).
 *
 * Sistem koordinat: TITIK ASAL KIRI-ATAS, satuan piksel gambar latar.
 * Sama dengan yang dipakai peramban, sehingga posisi di editor persis sama
 * dengan hasil PDF. Konversi ke koordinat PDF (asal kiri-bawah) dilakukan
 * di `src/lib/server/pdf.ts`.
 */

/** Ruas yang nilainya diambil dari data peserta/kegiatan. */
export const RUAS_TERSEDIA = {
	nama: 'Nama penerima',
	peran: 'Peran (Peserta/Pemateri/…)',
	nomorIdentitas: 'Nomor identitas / NIM',
	namaKegiatan: 'Nama kegiatan',
	tanggalKegiatan: 'Tanggal kegiatan',
	penyelenggara: 'Penyelenggara',
	namaPenerbit: 'Institusi penerbit',
	idSertifikat: 'ID sertifikat',
	teks: 'Teks tetap (boleh memuat {nama}, {peran}, …)'
} as const;

export type KunciRuas = keyof typeof RUAS_TERSEDIA;

export const FONT_TERSEDIA = {
	'sans': 'Helvetica',
	'sans-tebal': 'Helvetica Tebal',
	'serif': 'Times',
	'serif-tebal': 'Times Tebal',
	'serif-miring': 'Times Miring',
	'mono': 'Courier'
} as const;

export type KunciFont = keyof typeof FONT_TERSEDIA;

export interface RuasTemplate {
	id: string;
	kunci: KunciRuas;
	/** Hanya untuk kunci "teks" */
	teks?: string;
	/** Koordinat titik jangkar, asal kiri-atas, piksel gambar */
	x: number;
	y: number;
	ukuran: number;
	font: KunciFont;
	warna: string;
	align: 'left' | 'center' | 'right';
	/** Teks otomatis mengecil bila melebihi lebar ini */
	lebarMaks: number;
	hurufBesar?: boolean;
}

export interface Template {
	id: string;
	nama: string;
	lebar: number;
	tinggi: number;
	berkasLatar: string | null;
	ruas: RuasTemplate[];
	qr: { tampil: boolean; x: number; y: number; ukuran: number };
	dibuatPada: string;
	bawaan?: boolean;
}

/** Template bawaan bila penyelenggara belum mengunggah desain sendiri. */
export function templateBawaan(): Template {
	const L = 842;
	const T = 595;
	const buat = (
		kunci: KunciRuas, y: number, ukuran: number, font: KunciFont,
		warna = '#16181d', tambahan: Partial<RuasTemplate> = {}
	): RuasTemplate => ({
		id: `${kunci}-${y}`,
		kunci, x: L / 2, y, ukuran, font, warna,
		align: 'center', lebarMaks: L - 160, ...tambahan
	});

	return {
		id: 'bawaan',
		nama: 'Desain Bawaan (Klasik)',
		lebar: L,
		tinggi: T,
		berkasLatar: null,
		bawaan: true,
		dibuatPada: new Date(0).toISOString(),
		ruas: [
			buat('penyelenggara', 82, 10, 'sans-tebal', '#6b7280', { hurufBesar: true }),
			buat('namaPenerbit', 104, 15, 'serif-tebal'),
			{ ...buat('teks', 160, 30, 'serif-tebal'), teks: 'S E R T I F I K A T' },
			{ ...buat('teks', 190, 12, 'serif', '#6b7280'), id: 'teks-diberikan', teks: 'diberikan kepada' },
			buat('nama', 250, 40, 'serif-tebal', '#1f6feb'),
			{
				...buat('teks', 288, 12, 'serif', '#6b7280'),
				id: 'teks-atas',
				teks: 'atas partisipasinya sebagai {peran} dalam kegiatan'
			},
			buat('namaKegiatan', 316, 19, 'serif-tebal'),
			buat('tanggalKegiatan', 340, 11, 'serif', '#6b7280')
		],
		qr: { tampil: true, x: 734, y: 443, ukuran: 78 }
	};
}
