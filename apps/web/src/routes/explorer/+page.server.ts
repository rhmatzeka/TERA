import { klienRantai, amankan } from '$lib/server/rantai';
import { muatBatch } from '$lib/server/data';

export async function load() {
	const data = await muatBatch();
	const r = await klienRantai();
	if (!data || !r) return { ada: false as const };

	try {
		const nomor = await r.client.getBlockNumber();
		const blok = await Promise.all(
			Array.from({ length: Number(nomor < 8n ? nomor : 8n) + 1 }, (_, i) => nomor - BigInt(i))
				.filter((n) => n >= 0n)
				.map((n) => r.client.getBlock({ blockNumber: n }))
		);

		return {
			ada: true as const,
			chainId: r.chainId,
			jaringan: data.jaringan,
			kontrak: data.jaringan.kontrak,
			txPenerbitan: data.batch.txHash,
			nomorTerakhir: nomor.toString(),
			blok: amankan(
				blok.map((b) => ({
					nomor: b.number!.toString(),
					waktu: new Date(Number(b.timestamp) * 1000).toISOString().replace('T', ' ').slice(0, 19),
					jumlahTx: b.transactions.length,
					gas: b.gasUsed.toString(),
					hash: b.hash
				}))
			)
		};
	} catch (e) {
		return { ada: true as const, galat: e instanceof Error ? e.message : String(e), chainId: r.chainId, jaringan: data.jaringan };
	}
}
