import { error } from '@sveltejs/kit';
import { klienRantai, amankan } from '$lib/server/rantai';

export async function load({ params }) {
	const r = await klienRantai();
	if (!r) throw error(503, 'Data batch belum tersedia');
	if (!/^\d+$/.test(params.nomor)) throw error(400, 'Nomor blok tidak valid');

	try {
		const blok = await r.client.getBlock({
			blockNumber: BigInt(params.nomor),
			includeTransactions: true
		});

		return amankan({
			nomor: blok.number!.toString(),
			hash: blok.hash,
			indukHash: blok.parentHash,
			waktu: new Date(Number(blok.timestamp) * 1000).toISOString().replace('T', ' ').slice(0, 19),
			gasTerpakai: blok.gasUsed.toString(),
			gasLimit: blok.gasLimit.toString(),
			chainId: r.chainId,
			transaksi: (blok.transactions as unknown as { hash: string; from: string; to: string | null }[]).map(
				(t) => ({ hash: t.hash, dari: t.from, ke: t.to })
			)
		});
	} catch {
		throw error(404, 'Blok tidak ditemukan');
	}
}
