import { describe, expect, test } from 'bun:test';
import { renderSertifikat, type DataSertifikat } from '../src/lib/server/pdf';
import { inflateSync } from 'node:zlib';

const dasar: DataSertifikat = {
	id: 'c86fffe4-3ef4-4c61-aba9-3d6b449d9528',
	nama: 'Budi Santoso',
	peran: 'Peserta',
	nomorIdentitas: '202100001',
	namaKegiatan: 'Webinar Nasional Blockchain 2026',
	tanggalKegiatan: '2026-03-15',
	penyelenggara: 'Fakultas Teknik',
	namaPenerbit: 'Universitas Contoh',
	urlVerifikasi: 'http://localhost:5173/verify/c86fffe4',
	txHash: '0xf4bdcaad09af623cc76ff644c52002eb24eff6a6a8f53450cf52d880ed698b4b',
	dicabut: false
};

/**
 * Mengekstrak teks yang tergambar di dalam PDF.
 *
 * pdf-lib menulis teks sebagai hex string pada content stream —
 * `<427564692053616E746F736F> Tj` adalah "Budi Santoso". Content stream
 * itu sendiri terkompresi Flate, jadi harus di-inflate lebih dulu.
 */
function teksDalamPdf(buf: Uint8Array): string {
	const mentah = Buffer.from(buf);
	const asli = mentah.toString('latin1');
	const potongan: string[] = [];

	const re = /stream[\r\n]+/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(asli)) !== null) {
		const mulai = m.index + m[0].length;
		const akhir = asli.indexOf('endstream', mulai);
		if (akhir < mulai) continue;

		let isi: string;
		try {
			isi = inflateSync(mentah.subarray(mulai, akhir)).toString('latin1');
		} catch {
			continue; // bukan stream terkompresi (mis. gambar QR)
		}

		for (const t of isi.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
			potongan.push(Buffer.from(t[1], 'hex').toString('latin1'));
		}
	}
	return potongan.join('\n');
}

/** Menandai keberadaan objek gambar (QR) tanpa perlu dekompresi. */
function adaGambar(buf: Uint8Array): boolean {
	return Buffer.from(buf).toString('latin1').includes('/Subtype /Image');
}

describe('render PDF sertifikat', () => {
	test('menghasilkan PDF A4 mendatar yang sah', async () => {
		const pdf = await renderSertifikat(dasar);
		expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe('%PDF-');
		expect(pdf.byteLength).toBeGreaterThan(3000);
	});

	test('memuat nama, kegiatan, dan penerbit', async () => {
		const teks = teksDalamPdf(await renderSertifikat(dasar));
		for (const harus of ['Budi Santoso', 'Webinar Nasional Blockchain 2026', 'Universitas Contoh', 'S E R T I F I K A T']) {
			expect(teks).toContain(harus);
		}
	});

	test('menyertakan QR code', async () => {
		expect(adaGambar(await renderSertifikat(dasar))).toBe(true);
	});

	test('memberi cap DICABUT bila sertifikat dicabut', async () => {
		const aktif = teksDalamPdf(await renderSertifikat(dasar));
		const cabut = teksDalamPdf(await renderSertifikat({ ...dasar, dicabut: true }));
		expect(aktif).not.toContain('DICABUT');
		expect(cabut).toContain('DICABUT');
	});

	test('nama sangat panjang tetap tergambar utuh', async () => {
		const panjang = 'Muhammad Abdurrahman Wijayakusuma Prasetyo Nugroho Santosa';
		const teks = teksDalamPdf(await renderSertifikat({ ...dasar, nama: panjang }));
		expect(teks).toContain(panjang);
	});

	test('memuat keterangan peran dan tanggal kegiatan', async () => {
		const teks = teksDalamPdf(await renderSertifikat(dasar));
		expect(teks).toContain('sebagai Peserta');
		expect(teks).toContain('2026-03-15');
	});
});
