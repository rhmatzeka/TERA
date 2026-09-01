import { env } from '$env/dynamic/private';
import { daftarBatch } from '$lib/server/toko';
import { ambilBatch } from '$lib/server/toko';

export async function load() {
	const daftar = await daftarBatch();
	const chainSekarang = Number(env.CHAIN_ID ?? 31337);

	// Tandai kegiatan yang diterbitkan di jaringan lain — sertifikatnya
	// tidak dapat diverifikasi selama aplikasi tersambung ke jaringan ini.
	const batch = await Promise.all(
		daftar.map(async (b) => {
			const isi = await ambilBatch(b.uuid);
			return {
				...b,
				jaringan: isi?.jaringan.nama ?? '?',
				chainId: isi?.jaringan.chainId ?? 0,
				jaringanLain: (isi?.jaringan.chainId ?? 0) !== chainSekarang
			};
		})
	);

	return {
		batch,
		chainSekarang,
		kurs: {
			simbol: env.SIMBOL_TOKEN ?? 'ETH',
			hargaIdr: env.HARGA_TOKEN_IDR ? Number(env.HARGA_TOKEN_IDR) : null
		}
	};
}
