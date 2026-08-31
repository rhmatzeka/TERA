/**
 * Adapter jangkar untuk aksi server (penerbitan, pencabutan).
 * Konfigurasi diambil dari variabel lingkungan; bila belum lengkap,
 * jatuh ke konfigurasi batch terakhir yang terbit.
 */
import { env } from '$env/dynamic/private';
import type { Hex } from 'viem';
import { EvmAnchor } from './anchor/evm';
import { batchTerakhirTerbit } from './toko';

export async function anchorAktif(): Promise<EvmAnchor | null> {
	const kunci = env.KUNCI_TX as Hex | undefined;
	if (!kunci) return null;

	let kontrak = env.ALAMAT_REGISTRI as Hex | undefined;
	let rpcUrl = env.RPC_URL;
	let chainId = env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined;
	let nama = env.NAMA_JARINGAN;

	if (!kontrak || !rpcUrl) {
		const terakhir = await batchTerakhirTerbit();
		if (!terakhir) return null;
		kontrak ??= terakhir.jaringan.kontrak;
		rpcUrl ??= terakhir.jaringan.rpcUrl;
		chainId ??= terakhir.jaringan.chainId;
		nama ??= terakhir.jaringan.nama;
	}

	return new EvmAnchor({
		nama: nama ?? 'jaringan',
		chainId: chainId ?? 31337,
		rpcUrl: rpcUrl!,
		alamatKontrak: kontrak!,
		kunciTx: kunci
	});
}
