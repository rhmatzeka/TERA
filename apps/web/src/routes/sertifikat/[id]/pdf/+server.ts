import { error } from '@sveltejs/kit';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { env } from '$env/dynamic/private';
import { cariSertifikatGlobal } from '$lib/server/toko';
import { anchorAktif } from '$lib/server/anchorAktif';
import { renderSertifikat, VERSI_RENDER } from '$lib/server/pdf';
import { ambilTemplate } from '$lib/server/tokoTemplate';
import { templateBawaan } from '$lib/template';

const DIR_CACHE = 'data/cache-pdf';

/**
 * PDF dirender SAAT DIUNDUH, bukan saat penerbitan (plan.md 9.1).
 * Hasil render disimpan di cache; kunci cache memuat status pencabutan
 * sehingga sertifikat yang dicabut otomatis dirender ulang dengan cap.
 */
export async function GET({ params, url }) {
	const temuan = await cariSertifikatGlobal(params.id);
	if (!temuan) throw error(404, 'Sertifikat tidak ditemukan');
	const { sert, isi: data } = temuan;

	let dicabut = sert.dicabutLokal;
	try {
		const anchor = await anchorAktif();
		if (anchor) dicabut = await anchor.cekDicabut(sert.daun);
	} catch {
		/* rantai tidak terhubung — pakai nilai lokal */
	}

	// versi template ikut kunci cache: desain berubah -> cache otomatis basi
	const idTemplate = data.batch.templateId ?? 'bawaan';
	const kunci = `${DIR_CACHE}/${sert.id}-v${VERSI_RENDER}-${idTemplate}-${dicabut ? 'cabut' : 'aktif'}.pdf`;
	let berkas: Uint8Array | null = null;
	try {
		berkas = await readFile(kunci);
	} catch {
		berkas = null;
	}

	let mulai = 0;
	if (!berkas) {
		mulai = performance.now();
		const dok = JSON.parse(sert.dokumenKanonik);
		const basis = env.BASE_URL ?? url.origin;

		const tpl = (await ambilTemplate(idTemplate)) ?? templateBawaan();
		berkas = await renderSertifikat({
			id: sert.id,
			nama: sert.nama,
			peran: dok.credentialSubject.peran ?? 'Peserta',
			nomorIdentitas: dok.credentialSubject.nomorIdentitas ?? '-',
			namaKegiatan: data.batch.namaKegiatan,
			tanggalKegiatan: data.batch.tanggalKegiatan,
			penyelenggara: data.batch.penyelenggara,
			namaPenerbit: data.batch.namaPenerbit,
			urlVerifikasi: `${basis}/verify/${sert.id}`,
			txHash: data.batch.txHash,
			dicabut
		}, tpl);

		await mkdir(DIR_CACHE, { recursive: true });
		await writeFile(kunci, berkas);
	}

	return new Response(new Uint8Array(berkas), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `${url.searchParams.has('unduh') ? 'attachment' : 'inline'}; filename="sertifikat-${sert.nama.replace(/\s+/g, '-')}.pdf"`,
			'Cache-Control': 'private, max-age=3600',
			'X-Render-Ms': mulai ? (performance.now() - mulai).toFixed(1) : 'cache'
		}
	});
}
