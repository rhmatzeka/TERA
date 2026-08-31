/**
 * Penyimpanan template. PROTOTIPE — Fase 2 diganti tabel `template`
 * ditambah object storage untuk berkas latar.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { templateBawaan, type Template } from '$lib/template';

const DIR = 'data/template';

export async function daftarTemplate(): Promise<Template[]> {
	await mkdir(DIR, { recursive: true });
	const hasil: Template[] = [];
	for (const d of await readdir(DIR, { withFileTypes: true })) {
		if (!d.isDirectory()) continue;
		try {
			hasil.push(JSON.parse(await readFile(`${DIR}/${d.name}/meta.json`, 'utf-8')));
		} catch {
			/* rusak — lewati */
		}
	}
	hasil.sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));
	return [templateBawaan(), ...hasil];
}

export async function ambilTemplate(id: string): Promise<Template | null> {
	if (id === 'bawaan') return templateBawaan();
	try {
		return JSON.parse(await readFile(`${DIR}/${id}/meta.json`, 'utf-8'));
	} catch {
		return null;
	}
}

export async function simpanTemplate(t: Template): Promise<void> {
	await mkdir(`${DIR}/${t.id}`, { recursive: true });
	await writeFile(`${DIR}/${t.id}/meta.json`, JSON.stringify(t, null, 2));
}

export async function hapusTemplate(id: string): Promise<void> {
	if (id === 'bawaan') throw new Error('Desain bawaan tidak dapat dihapus');
	await rm(`${DIR}/${id}`, { recursive: true, force: true });
}

export async function berkasLatar(id: string, nama: string): Promise<Uint8Array | null> {
	try {
		return await readFile(`${DIR}/${id}/${nama}`);
	} catch {
		return null;
	}
}

/**
 * Menyimpan gambar latar dan membaca ukurannya.
 * pdf-lib dipakai untuk membaca dimensi agar tidak perlu pustaka gambar lain.
 */
export async function simpanLatar(
	id: string,
	berkas: Uint8Array,
	tipe: string
): Promise<{ nama: string; lebar: number; tinggi: number }> {
	const png = tipe.includes('png');
	const nama = png ? 'latar.png' : 'latar.jpg';

	const pdf = await PDFDocument.create();
	const gambar = png ? await pdf.embedPng(berkas) : await pdf.embedJpg(berkas);

	await mkdir(`${DIR}/${id}`, { recursive: true });
	await writeFile(`${DIR}/${id}/${nama}`, berkas);

	return { nama, lebar: Math.round(gambar.width), tinggi: Math.round(gambar.height) };
}
