/**
 * Klien RPC bersama untuk halaman explorer bawaan.
 */
import { createPublicClient, defineChain, http, type PublicClient } from 'viem';
import { muatBatch } from './data';

export async function klienRantai(): Promise<{ client: PublicClient; chainId: number } | null> {
	const data = await muatBatch();
	if (!data) return null;

	const chain = defineChain({
		id: data.jaringan.chainId,
		name: data.jaringan.nama,
		nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
		rpcUrls: { default: { http: [data.jaringan.rpcUrl] } }
	});

	return {
		client: createPublicClient({ chain, transport: http(data.jaringan.rpcUrl) }) as PublicClient,
		chainId: data.jaringan.chainId
	};
}

/** BigInt tidak dapat diserialisasi ke klien — ubah jadi string. */
export function amankan<T>(nilai: T): T {
	return JSON.parse(JSON.stringify(nilai, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
}
