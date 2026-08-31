import { muatBatch } from '$lib/server/data';

export async function load({ url }) {
	const kueri = (url.searchParams.get('q') ?? '').trim().toLowerCase();
	const data = await muatBatch();
	if (!data) return { ada: false as const, kueri, hasil: [] };

	const hasil = kueri
		? data.sertifikat
				.filter(
					(s) => s.id.toLowerCase() === kueri || s.nama.toLowerCase().includes(kueri)
				)
				.slice(0, 12)
				.map((s) => ({ id: s.id, nama: s.nama }))
		: [];

	return {
		ada: true as const,
		kueri,
		hasil,
		batch: data.batch,
		jaringan: data.jaringan
	};
}
