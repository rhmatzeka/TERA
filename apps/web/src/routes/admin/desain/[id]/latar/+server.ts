import { error } from '@sveltejs/kit';
import { ambilTemplate, berkasLatar } from '$lib/server/tokoTemplate';

export async function GET({ params }) {
	const t = await ambilTemplate(params.id);
	if (!t?.berkasLatar) throw error(404, 'Desain tidak punya gambar latar');

	const data = await berkasLatar(t.id, t.berkasLatar);
	if (!data) throw error(404, 'Berkas tidak ditemukan');

	return new Response(new Uint8Array(data), {
		headers: {
			'Content-Type': t.berkasLatar.endsWith('.png') ? 'image/png' : 'image/jpeg',
			'Cache-Control': 'private, max-age=300'
		}
	});
}
