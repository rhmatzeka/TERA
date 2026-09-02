import { createPublicClient, decodeEventLog, defineChain, http, type Hex } from 'viem';
import { env } from '$env/dynamic/private';
import { muatBatch } from '$lib/server/data';
import { infoExplorer } from '$lib/explorer';

const ABI_EVENT = [
	{
		type: 'event',
		name: 'BatchTerbit',
		inputs: [
			{ name: 'idBatch', type: 'bytes32', indexed: true },
			{ name: 'root', type: 'bytes32', indexed: false },
			{ name: 'namaKegiatan', type: 'string', indexed: false },
			{ name: 'jumlah', type: 'uint256', indexed: false },
			{ name: 'waktu', type: 'uint256', indexed: false }
		]
	},
	{
		type: 'event',
		name: 'SertifikatDicabut',
		inputs: [
			{ name: 'daun', type: 'bytes32', indexed: true },
			{ name: 'alasan', type: 'string', indexed: false },
			{ name: 'waktu', type: 'uint256', indexed: false }
		]
	}
] as const;


export async function load() {
	const data = await muatBatch();
	if (!data) return { ada: false as const };

	const simbol = env.SIMBOL_TOKEN ?? 'ETH';
	const kurs = {
		simbol,
		hargaIdr: env.HARGA_TOKEN_IDR ? Number(env.HARGA_TOKEN_IDR) : null
	};

	const chain = defineChain({
		id: data.jaringan.chainId,
		name: data.jaringan.nama,
		nativeCurrency: { name: simbol, symbol: simbol, decimals: 18 },
		rpcUrls: { default: { http: [data.jaringan.rpcUrl] } }
	});
	const client = createPublicClient({ chain, transport: http(data.jaringan.rpcUrl) });

	try {
		const [tx, struk, rootOnchain, kodeKontrak] = await Promise.all([
			client.getTransaction({ hash: data.batch.txHash }),
			client.getTransactionReceipt({ hash: data.batch.txHash }),
			client.readContract({
				address: data.jaringan.kontrak,
				abi: [
					{
						type: 'function', name: 'rootBatch', stateMutability: 'view',
						inputs: [{ name: '', type: 'bytes32' }],
						outputs: [{ name: '', type: 'bytes32' }]
					}
				],
				functionName: 'rootBatch',
				args: [data.batch.idOnchain]
			}) as Promise<Hex>,
			client.getCode({ address: data.jaringan.kontrak })
		]);

		const blok = await client.getBlock({ blockNumber: struk.blockNumber });

		const peristiwa = struk.logs.flatMap((log) => {
			try {
				const d = decodeEventLog({ abi: ABI_EVENT, data: log.data, topics: log.topics });
				return [{ nama: d.eventName as string, argumen: JSON.parse(
					JSON.stringify(d.args, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
				) as Record<string, string> }];
			} catch {
				return [];
			}
		});

		return {
			ada: true as const,
			batch: data.batch,
			jaringan: data.jaringan,
			explorer: infoExplorer(data.jaringan.chainId, env.EXPLORER_URL),
			basisExplorer: env.EXPLORER_URL ?? null,
			kurs,
			rantai: {
				dari: tx.from,
				ke: tx.to,
				nilai: tx.value.toString(),
				nonce: tx.nonce,
				calldataUkuran: (tx.input.length - 2) / 2,
				gasTerpakai: struk.gasUsed.toString(),
				hargaGas: (struk.effectiveGasPrice ?? 0n).toString(),
				status: struk.status,
				nomorBlok: struk.blockNumber.toString(),
				waktuBlok: new Date(Number(blok.timestamp) * 1000).toISOString(),
				biayaWei: (struk.gasUsed * (struk.effectiveGasPrice ?? 0n)).toString(),
				ukuranKode: kodeKontrak ? (kodeKontrak.length - 2) / 2 : 0,
				rootTersimpan: rootOnchain,
				cocokDenganLokal: rootOnchain.toLowerCase() === data.batch.root.toLowerCase()
			},
			peristiwa,
			galat: null as string | null
		};
	} catch (e) {
		return {
			ada: true as const,
			batch: data.batch,
			jaringan: data.jaringan,
			explorer: infoExplorer(data.jaringan.chainId, env.EXPLORER_URL),
			basisExplorer: env.EXPLORER_URL ?? null,
			kurs,
			rantai: null,
			peristiwa: [],
			galat: e instanceof Error ? e.message : String(e)
		};
	}
}
