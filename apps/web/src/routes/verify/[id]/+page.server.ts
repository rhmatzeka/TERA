import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { cariSertifikatGlobal } from '$lib/server/toko';
import { anchorAktif } from '$lib/server/anchorAktif';

export async function load({ params }) {
	// Cari lintas batch — sertifikat dapat berasal dari kegiatan mana pun.
	const temuan = await cariSertifikatGlobal(params.id);
	if (!temuan) throw error(404, 'Sertifikat tidak ditemukan');
	const { sert, isi: data } = temuan;

	// Seluruh bahan verifikasi dikirim ke peramban, sehingga verifikasi dapat
	// dilakukan sepenuhnya di sisi klien tanpa memercayai server ini.
	// Status pencabutan dibaca dari rantai untuk render awal; peramban tetap
	// memeriksa ulang sendiri lewat tombol Verifikasi mandiri.
	let dicabut = sert.dicabutLokal;
	try {
		const anchor = await anchorAktif();
		if (anchor) dicabut = await anchor.cekDicabut(sert.daun);
	} catch {
		/* rantai tidak terhubung */
	}

	const dok = JSON.parse(sert.dokumenKanonik);

	return {
		sert,
		dicabut,
		peran: dok.credentialSubject.peran ?? 'Peserta',
		nomorIdentitas: dok.credentialSubject.nomorIdentitas ?? '-',
		batch: data.batch,
		jaringan: data.jaringan,
		basisExplorer: env.EXPLORER_URL ?? null
	};
}
