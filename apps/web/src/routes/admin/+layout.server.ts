import { muatBatch } from '$lib/server/data';
import { KEWENANGAN } from '$lib/peran';

export async function load({ locals }) {
	const data = await muatBatch();
	return {
		pengguna: locals.pengguna!,
		kewenangan: KEWENANGAN[locals.pengguna!.peran],
		adaBatch: data !== null,
		namaKegiatan: data?.batch.namaKegiatan ?? null
	};
}
