import { fail, redirect } from '@sveltejs/kit';
import { daftarTemplate, hapusTemplate, simpanLatar, simpanTemplate } from '$lib/server/tokoTemplate';
import { templateBawaan, type Template } from '$lib/template';

const MAKS = 8 * 1024 * 1024;

export async function load() {
	return { template: await daftarTemplate() };
}

export const actions = {
	unggah: async ({ request }) => {
		const form = await request.formData();
		const nama = String(form.get('nama') ?? '').trim();
		const berkas = form.get('latar') as File | null;

		if (!nama) return fail(400, { pesan: 'Beri nama desainnya' });
		if (!berkas || berkas.size === 0) return fail(400, { pesan: 'Pilih berkas gambar desain' });
		if (berkas.size > MAKS) return fail(400, { pesan: 'Gambar melebihi 8 MB' });
		if (!/image\/(png|jpeg)/.test(berkas.type)) {
			return fail(400, { pesan: 'Format harus PNG atau JPG' });
		}

		const id = crypto.randomUUID();
		let info;
		try {
			info = await simpanLatar(id, new Uint8Array(await berkas.arrayBuffer()), berkas.type);
		} catch {
			return fail(400, { pesan: 'Gambar tidak dapat dibaca. Pastikan PNG atau JPG yang sah.' });
		}

		// Mulai dari susunan bawaan, diskalakan ke ukuran gambar yang diunggah.
		const dasar = templateBawaan();
		const sx = info.lebar / dasar.lebar;
		const sy = info.tinggi / dasar.tinggi;

		const t: Template = {
			id,
			nama,
			lebar: info.lebar,
			tinggi: info.tinggi,
			berkasLatar: info.nama,
			dibuatPada: new Date().toISOString(),
			ruas: dasar.ruas
				.filter((r) => r.kunci !== 'teks' || r.teks === 'S E R T I F I K A T')
				.map((r) => ({
					...r,
					x: Math.round(r.x * sx),
					y: Math.round(r.y * sy),
					ukuran: Math.round(r.ukuran * sy),
					lebarMaks: Math.round(r.lebarMaks * sx)
				})),
			qr: {
				tampil: true,
				x: Math.round(dasar.qr.x * sx),
				y: Math.round(dasar.qr.y * sy),
				ukuran: Math.round(dasar.qr.ukuran * sy)
			}
		};

		await simpanTemplate(t);
		throw redirect(303, `/admin/desain/${id}`);
	},

	hapus: async ({ request }) => {
		const form = await request.formData();
		try {
			await hapusTemplate(String(form.get('id') ?? ''));
			return { pesan: 'Desain dihapus' };
		} catch (e) {
			return fail(400, { pesan: e instanceof Error ? e.message : String(e) });
		}
	}
};
