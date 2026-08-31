import { error } from '@sveltejs/kit';
import { formatEther, type Hex } from 'viem';
import { klienRantai, amankan } from '$lib/server/rantai';
import { muatBatch } from '$lib/server/data';

export async function load({ params }) {
	const r = await klienRantai();
	const data = await muatBatch();
	if (!r || !data) throw error(503, 'Data batch belum tersedia');

	const alamat = params.alamat as Hex;
	if (!/^0x[0-9a-fA-F]{40}$/.test(alamat)) throw error(400, 'Alamat tidak valid');

	const [saldo, kode, jumlahTx] = await Promise.all([
		r.client.getBalance({ address: alamat }),
		r.client.getCode({ address: alamat }),
		r.client.getTransactionCount({ address: alamat })
	]);

	const kontrak = Boolean(kode && kode !== '0x');
	const iniRegistri = alamat.toLowerCase() === data.jaringan.kontrak.toLowerCase();

	// Nilai storage kontrak — memperlihatkan bahwa yang tersimpan hanya root
	let rootBatch: string | null = null;
	if (iniRegistri) {
		try {
			rootBatch = (await r.client.readContract({
				address: alamat,
				abi: [{
					type: 'function', name: 'rootBatch', stateMutability: 'view',
					inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bytes32' }]
				}],
				functionName: 'rootBatch',
				args: [data.batch.idOnchain]
			})) as string;
		} catch { rootBatch = null; }
	}

	return amankan({
		alamat,
		chainId: r.chainId,
		jaringan: data.jaringan.nama,
		saldo: formatEther(saldo),
		kontrak,
		ukuranKode: kode ? (kode.length - 2) / 2 : 0,
		jumlahTx,
		iniRegistri,
		rootBatch,
		idBatch: data.batch.idOnchain,
		txPenerbitan: data.batch.txHash,
		jumlahSertifikat: data.batch.jumlah
	});
}
