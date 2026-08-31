import { env } from '$env/dynamic/private';
import { muatBatch } from '$lib/server/data';
import { anchorAktif } from '$lib/server/anchorAktif';

export async function load({ locals }) {
	const data = await muatBatch();
	if (!data) return { ada: false as const };

	const surel = locals.pengguna!.email;

	// Peserta hanya melihat sertifikat MILIKNYA — disaring di server,
	// bukan disembunyikan di antarmuka.
	const milik = data.sertifikat.filter((s) => {
		try {
			return JSON.parse(s.dokumenKanonik).credentialSubject.email?.toLowerCase() === surel;
		} catch {
			return false;
		}
	});

	const anchor = await anchorAktif();
	const daftar = await Promise.all(
		milik.map(async (s) => {
			const dok = JSON.parse(s.dokumenKanonik);
			let dicabut = s.dicabutLokal;
			try {
				if (anchor) dicabut = await anchor.cekDicabut(s.daun);
			} catch {
				/* pakai nilai lokal bila rantai tidak terhubung */
			}
			return {
				id: s.id,
				nama: s.nama,
				nomorIdentitas: dok.credentialSubject.nomorIdentitas ?? '',
				peran: dok.credentialSubject.peran ?? 'Peserta',
				dicabut
			};
		})
	);

	return {
		ada: true as const,
		batch: data.batch,
		jaringan: data.jaringan,
		basisExplorer: env.EXPLORER_URL ?? null,
		daftar
	};
}
