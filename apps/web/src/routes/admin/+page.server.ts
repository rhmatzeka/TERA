import { formatEther } from 'viem';
import { env } from '$env/dynamic/private';
import { muatBatch } from '$lib/server/data';
import { anchorAktif } from '$lib/server/anchorAktif';

export async function load() {
	const data = await muatBatch();
	if (!data) return { ada: false as const };

	const anchor = await anchorAktif();
	let saldo: string | null = null;
	let saldoRendah = false;
	let jumlahDicabut = 0;
	let rantaiHidup = false;

	if (anchor) {
		try {
			saldo = formatEther(await anchor.saldo());
			saldoRendah = Number(saldo) < Number(env.AMBANG_SALDO_WALLET ?? '0.05');
			const cek = await Promise.all(data.sertifikat.map((s) => anchor.cekDicabut(s.daun)));
			jumlahDicabut = cek.filter(Boolean).length;
			rantaiHidup = true;
		} catch {
			rantaiHidup = false;
		}
	}

	return {
		ada: true as const,
		kurs: {
			simbol: env.SIMBOL_TOKEN ?? 'ETH',
			hargaIdr: env.HARGA_TOKEN_IDR ? Number(env.HARGA_TOKEN_IDR) : null
		},
		batch: data.batch,
		jaringan: data.jaringan,
		basisExplorer: env.EXPLORER_URL ?? null,
		saldo,
		saldoRendah,
		jumlahDicabut,
		rantaiHidup,
		adaKunci: anchor !== null
	};
}
