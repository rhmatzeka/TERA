/**
 * Render sertifikat menjadi PDF, mengikuti template yang dipilih.
 *
 * Sesuai plan.md 9.1, PDF TIDAK dibuat saat penerbitan — dirender ketika
 * diunduh lalu disimpan di cache. Memakai pdf-lib, bukan Puppeteer (9.2),
 * sehingga tata letak memakai koordinat absolut.
 *
 * Koordinat template memakai asal KIRI-ATAS (sama seperti editor di peramban);
 * di sini dikonversi ke asal kiri-bawah milik PDF.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import { templateBawaan, type KunciFont, type RuasTemplate, type Template } from '$lib/template';
import { berkasLatar } from './tokoTemplate';

/**
 * Versi perender. WAJIB dinaikkan setiap kali tampilan PDF diubah —
 * nilainya ikut menjadi kunci cache, sehingga berkas lama otomatis basi.
 * Tanpa ini, perubahan kode tidak terlihat karena PDF lama terus disajikan.
 */
export const VERSI_RENDER = 2;

export interface DataSertifikat {
	id: string;
	nama: string;
	peran: string;
	nomorIdentitas: string;
	namaKegiatan: string;
	tanggalKegiatan: string;
	penyelenggara: string;
	namaPenerbit: string;
	urlVerifikasi: string;
	txHash: string;
	dicabut: boolean;
}

const FONT_PDF: Record<KunciFont, StandardFonts> = {
	'sans': StandardFonts.Helvetica,
	'sans-tebal': StandardFonts.HelveticaBold,
	'serif': StandardFonts.TimesRoman,
	'serif-tebal': StandardFonts.TimesRomanBold,
	'serif-miring': StandardFonts.TimesRomanItalic,
	'mono': StandardFonts.Courier
};

function keRgb(hex: string) {
	const h = hex.replace('#', '');
	const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
	const v = parseInt(n, 16);
	return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

/** Mengecilkan ukuran teks sampai muat — nama panjang tidak boleh jebol. */
function muatkan(teks: string, font: PDFFont, awal: number, lebarMaks: number): number {
	let u = awal;
	while (u > 5 && font.widthOfTextAtSize(teks, u) > lebarMaks) u -= 0.5;
	return u;
}

function nilaiRuas(r: RuasTemplate, d: DataSertifikat): string {
	const peta = petaNilai(d);
	// Teks tetap boleh memuat placeholder, mis. "sebagai {peran} dalam kegiatan"
	const nilai =
		r.kunci === 'teks'
			? (r.teks ?? '').replace(/\{(\w+)\}/g, (cocok, k) => peta[k] ?? cocok)
			: (peta[r.kunci] ?? '');
	return r.hurufBesar ? nilai.toUpperCase() : nilai;
}

function petaNilai(d: DataSertifikat): Record<string, string> {
	return {
		nama: d.nama,
		peran: d.peran,
		nomorIdentitas: d.nomorIdentitas,
		namaKegiatan: d.namaKegiatan,
		tanggalKegiatan: d.tanggalKegiatan,
		penyelenggara: d.penyelenggara,
		namaPenerbit: d.namaPenerbit,
		idSertifikat: d.id
	};
}

/** Bingkai bawaan — hanya digambar bila template tidak punya gambar latar. */
function gambarBingkai(hal: PDFPage, L: number, T: number) {
	const emas = rgb(0.72, 0.58, 0.24);
	hal.drawRectangle({ x: 0, y: 0, width: L, height: T, color: rgb(1, 1, 1) });
	hal.drawRectangle({ x: 22, y: 22, width: L - 44, height: T - 44, borderColor: emas, borderWidth: 2.5 });
	hal.drawRectangle({ x: 31, y: 31, width: L - 62, height: T - 62, borderColor: emas, borderWidth: 0.7 });
	for (const [sx, sy] of [[38, 38], [L - 38, 38], [38, T - 38], [L - 38, T - 38]]) {
		hal.drawCircle({ x: sx, y: sy, size: 3.5, color: emas });
	}
	hal.drawLine({
		start: { x: L / 2 - 40, y: T - 120 }, end: { x: L / 2 + 40, y: T - 120 },
		thickness: 1, color: emas
	});
	hal.drawLine({
		start: { x: 180, y: T - 262 }, end: { x: L - 180, y: T - 262 },
		thickness: 0.7, color: rgb(0.85, 0.87, 0.9)
	});
	hal.drawLine({ start: { x: 78, y: 118 }, end: { x: 258, y: 118 }, thickness: 0.7, color: rgb(0.42, 0.45, 0.51) });
}

export async function renderSertifikat(
	d: DataSertifikat,
	tpl: Template = templateBawaan()
): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.setTitle(`Sertifikat — ${d.nama}`);
	pdf.setSubject(d.namaKegiatan);
	pdf.setAuthor(d.namaPenerbit);
	// Catatan: pdf-lib selalu menimpa ruas Producer dengan identitasnya sendiri
	// saat menyimpan, jadi identitas TERA ditaruh di Creator.
	pdf.setCreator('TERA — Tanda Elektronik Resmi Autentik');

	const L = tpl.lebar;
	const T = tpl.tinggi;
	const hal = pdf.addPage([L, T]);

	// ── latar ────────────────────────────────────────────────────────
	if (tpl.berkasLatar) {
		const data = await berkasLatar(tpl.id, tpl.berkasLatar);
		if (data) {
			const gambar = tpl.berkasLatar.endsWith('.png')
				? await pdf.embedPng(data)
				: await pdf.embedJpg(data);
			hal.drawImage(gambar, { x: 0, y: 0, width: L, height: T });
		} else {
			gambarBingkai(hal, L, T);
		}
	} else {
		gambarBingkai(hal, L, T);
	}

	// ── ruas teks ────────────────────────────────────────────────────
	const cacheFont = new Map<KunciFont, PDFFont>();
	const font = async (k: KunciFont) => {
		if (!cacheFont.has(k)) cacheFont.set(k, await pdf.embedFont(FONT_PDF[k]));
		return cacheFont.get(k)!;
	};

	for (const r of tpl.ruas) {
		const teks = nilaiRuas(r, d);
		if (!teks) continue;

		const f = await font(r.font);
		const ukuran = muatkan(teks, f, r.ukuran, r.lebarMaks || L);
		const lebar = f.widthOfTextAtSize(teks, ukuran);

		const x = r.align === 'center' ? r.x - lebar / 2 : r.align === 'right' ? r.x - lebar : r.x;
		// konversi asal kiri-atas -> kiri-bawah, y menunjuk baseline teks
		const y = T - r.y - ukuran * 0.8;

		hal.drawText(teks, { x, y, size: ukuran, font: f, color: keRgb(r.warna) });
	}

	// ── QR verifikasi ────────────────────────────────────────────────
	if (tpl.qr.tampil) {
		const qrPng = await QRCode.toBuffer(d.urlVerifikasi, {
			margin: 0, width: 360, color: { dark: '#16181d', light: '#ffffff' }
		});
		const qr = await pdf.embedPng(qrPng);
		hal.drawImage(qr, {
			x: tpl.qr.x, y: T - tpl.qr.y - tpl.qr.ukuran,
			width: tpl.qr.ukuran, height: tpl.qr.ukuran
		});
		const kecil = await font('sans');
		hal.drawText('Pindai untuk verifikasi', {
			x: tpl.qr.x - 4, y: T - tpl.qr.y - tpl.qr.ukuran - 10, size: 6.5, font: kecil,
			color: rgb(0.42, 0.45, 0.51)
		});
	}

	// ── keterangan kaki (hanya untuk desain bawaan) ──────────────────
	if (!tpl.berkasLatar) {
		const sans = await font('sans');
		const sansTebal = await font('sans-tebal');
		hal.drawText(d.namaPenerbit, { x: 78, y: 104, size: 9.5, font: sansTebal, color: rgb(0.09, 0.1, 0.13) });
		hal.drawText('Penyelenggara', { x: 78, y: 91, size: 8, font: sans, color: rgb(0.42, 0.45, 0.51) });
		hal.drawText('Sertifikat ini terjangkar di blockchain dan dapat diverifikasi secara mandiri.', {
			x: 78, y: 62, size: 7.5, font: sans, color: rgb(0.42, 0.45, 0.51)
		});
		hal.drawText(`ID  ${d.id}`, { x: 78, y: 50, size: 6.5, font: sans, color: rgb(0.42, 0.45, 0.51) });
		hal.drawText(`TX  ${d.txHash}`, { x: 78, y: 40, size: 6.5, font: sans, color: rgb(0.42, 0.45, 0.51) });
	}

	// ── cap DICABUT ──────────────────────────────────────────────────
	if (d.dicabut) {
		const merah = rgb(0.75, 0.23, 0.17);
		const f = await font('sans-tebal');
		const t = 'DICABUT';
		const u = Math.min(48, L / 18);
		const w = f.widthOfTextAtSize(t, u);
		hal.drawRectangle({
			x: L / 2 - w / 2 - 26, y: T / 2 - 34, width: w + 52, height: 68,
			borderColor: merah, borderWidth: 3, opacity: 0, borderOpacity: 0.85,
			rotate: { type: 'degrees', angle: -8 }
		});
		hal.drawText(t, {
			x: (L - w) / 2, y: T / 2 - 14, size: u, font: f,
			color: merah, opacity: 0.85, rotate: { type: 'degrees', angle: -8 }
		});
	}

	// updateMetadata: false — tanpa ini pdf-lib menimpa Producer dan Creator
	// dengan identitasnya sendiri saat menyimpan.
	return pdf.save({ updateMetadata: false });
}
