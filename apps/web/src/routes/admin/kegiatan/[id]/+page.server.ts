import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { ambilBatch } from '$lib/server/toko';
import { terbitkanBatch } from '$lib/server/penerbitan';
import { KEWENANGAN } from '$lib/peran';

export async function load({ params }) {
	const isi = await ambilBatch(params.id);
	if (!isi) throw error(404, 'Batch tidak ditemukan');

	return {
		batch: isi.batch,
		jaringan: isi.jaringan,
		basisExplorer: env.EXPLORER_URL ?? null,
		contoh: isi.sertifikat.slice(0, 10).map((s) => ({ id: s.id, nama: s.nama, indeks: s.indeks }))
	};
}

export const actions = {
	terbitkan: async ({ params, locals }) => {
		// Hanya Penandatangan yang boleh menerbitkan — pemisahan wewenang
		// pada plan.md prinsip 5. Dicek di server, bukan hanya di antarmuka.
		if (!locals.pengguna || !KEWENANGAN[locals.pengguna.peran].terbitkan) {
			throw error(403, 'Hanya Penandatangan yang berwenang menerbitkan batch');
		}

		try {
			const isi = await terbitkanBatch(params.id, locals.pengguna.nama);
			return {
				berhasil: true,
				txHash: isi.batch.txHash,
				gas: isi.batch.gasTerpakai,
				biayaWei: isi.batch.biayaWei
			};
		} catch (e) {
			return fail(400, { pesan: e instanceof Error ? e.message : String(e) });
		}
	}
};
