import { error } from '@sveltejs/kit';
import { decodeEventLog, decodeFunctionData, type Hex } from 'viem';
import { klienRantai, amankan } from '$lib/server/rantai';
import { muatBatch } from '$lib/server/data';

const ABI = [
	{
		type: 'function', name: 'terbitkanBatch',
		inputs: [
			{ name: 'idBatch', type: 'bytes32' }, { name: 'root', type: 'bytes32' },
			{ name: 'namaKegiatan', type: 'string' }, { name: 'jumlah', type: 'uint256' }
		], outputs: []
	},
	{
		type: 'function', name: 'cabut',
		inputs: [{ name: 'daun', type: 'bytes32' }, { name: 'alasan', type: 'string' }], outputs: []
	},
	{
		type: 'event', name: 'BatchTerbit',
		inputs: [
			{ name: 'idBatch', type: 'bytes32', indexed: true },
			{ name: 'root', type: 'bytes32', indexed: false },
			{ name: 'namaKegiatan', type: 'string', indexed: false },
			{ name: 'jumlah', type: 'uint256', indexed: false },
			{ name: 'waktu', type: 'uint256', indexed: false }
		]
	},
	{
		type: 'event', name: 'SertifikatDicabut',
		inputs: [
			{ name: 'daun', type: 'bytes32', indexed: true },
			{ name: 'alasan', type: 'string', indexed: false },
			{ name: 'waktu', type: 'uint256', indexed: false }
		]
	}
] as const;

export async function load({ params }) {
	const r = await klienRantai();
	const data = await muatBatch();
	if (!r || !data) throw error(503, 'Data batch belum tersedia');

	const hash = params.hash as Hex;
	if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw error(400, 'Hash transaksi tidak valid');

	try {
		const [tx, struk] = await Promise.all([
			r.client.getTransaction({ hash }),
			r.client.getTransactionReceipt({ hash })
		]);
		const blok = await r.client.getBlock({ blockNumber: struk.blockNumber });

		let fungsi: { nama: string; argumen: Record<string, string> } | null = null;
		try {
			const d = decodeFunctionData({ abi: ABI, data: tx.input });
			const nama = (ABI.find((a) => a.type === 'function' && a.name === d.functionName) as
				{ inputs: readonly { name: string }[] } | undefined)?.inputs ?? [];
			fungsi = {
				nama: d.functionName as string,
				argumen: Object.fromEntries(
					(d.args ?? []).map((v, i) => [nama[i]?.name ?? String(i), String(v)])
				)
			};
		} catch { /* bukan panggilan kontrak yang dikenali */ }

		const peristiwa = struk.logs.flatMap((log) => {
			try {
				const d = decodeEventLog({ abi: ABI, data: log.data, topics: log.topics });
				return [{
					nama: d.eventName as string,
					argumen: Object.fromEntries(Object.entries(d.args ?? {}).map(([k, v]) => [k, String(v)]))
				}];
			} catch { return []; }
		});

		const biayaWei = struk.gasUsed * (struk.effectiveGasPrice ?? 0n);

		return amankan({
			hash,
			chainId: r.chainId,
			jaringan: data.jaringan.nama,
			status: struk.status,
			nomorBlok: struk.blockNumber.toString(),
			waktu: new Date(Number(blok.timestamp) * 1000).toISOString().replace('T', ' ').slice(0, 19),
			dari: tx.from,
			ke: tx.to,
			nonce: tx.nonce,
			nilai: tx.value.toString(),
			gasTerpakai: struk.gasUsed.toString(),
			gasLimit: tx.gas.toString(),
			hargaGas: (struk.effectiveGasPrice ?? 0n).toString(),
			biayaWei: biayaWei.toString(),
			biayaEth: (Number(biayaWei) / 1e18).toFixed(9),
			calldata: tx.input,
			calldataUkuran: (tx.input.length - 2) / 2,
			fungsi,
			peristiwa
		});
	} catch (e) {
		throw error(404, `Transaksi tidak ditemukan: ${e instanceof Error ? e.message.slice(0, 120) : ''}`);
	}
}
