import { error, fail } from '@sveltejs/kit';
import { ambilTemplate, simpanTemplate } from '$lib/server/tokoTemplate';
import type { Template } from '$lib/template';

export async function load({ params }) {
	const t = await ambilTemplate(params.id);
	if (!t) throw error(404, 'Desain tidak ditemukan');
	if (t.bawaan) throw error(400, 'Desain bawaan tidak dapat diubah');
	return { template: t };
}

export const actions = {
	simpan: async ({ params, request }) => {
		const form = await request.formData();
		const lama = await ambilTemplate(params.id);
		if (!lama) throw error(404, 'Desain tidak ditemukan');

		let masuk: Partial<Template>;
		try {
			masuk = JSON.parse(String(form.get('template') ?? '{}'));
		} catch {
			return fail(400, { pesan: 'Data desain rusak' });
		}

		// Hanya bagian yang boleh diubah dari editor yang ditimpa.
		const baru: Template = {
			...lama,
			nama: (masuk.nama ?? lama.nama).slice(0, 120),
			ruas: (masuk.ruas ?? lama.ruas).map((r) => ({
				...r,
				x: Math.round(r.x),
				y: Math.round(r.y),
				ukuran: Math.max(5, Math.min(400, Math.round(r.ukuran))),
				lebarMaks: Math.max(20, Math.round(r.lebarMaks))
			})),
			qr: masuk.qr ?? lama.qr
		};

		await simpanTemplate(baru);
		return { pesan: 'Desain disimpan', berhasil: true };
	}
};
