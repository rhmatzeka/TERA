import { error, fail, redirect } from '@sveltejs/kit';
import { CONTOH_CSV, imporCsv } from '$lib/server/csv';
import { daftarTemplate } from '$lib/server/tokoTemplate';
import { siapkanBatch } from '$lib/server/penerbitan';

const MAKS_BYTE = 20 * 1024 * 1024; // 20 MB

export async function load() {
	return {
		contohCsv: CONTOH_CSV,
		template: (await daftarTemplate()).map((t) => ({
			id: t.id,
			nama: t.nama,
			adaGambar: Boolean(t.berkasLatar)
		}))
	};
}

export const actions = {
	/** Langkah 1 — unggah CSV, validasi, tampilkan pratinjau. Belum menyimpan apa pun. */
	periksa: async ({ request }) => {
		const form = await request.formData();
		const berkas = form.get('csv') as File | null;

		const rincian = {
			namaKegiatan: String(form.get('namaKegiatan') ?? '').trim(),
			tanggalKegiatan: String(form.get('tanggalKegiatan') ?? '').trim(),
			penyelenggara: String(form.get('penyelenggara') ?? '').trim(),
			namaPenerbit: String(form.get('namaPenerbit') ?? '').trim(),
			templateId: String(form.get('templateId') ?? 'bawaan')
		};

		const kurang = Object.entries(rincian)
			.filter(([k, v]) => k !== 'templateId' && !v)
			.map(([k]) => k);
		if (kurang.length) return fail(400, { rincian, pesan: 'Lengkapi seluruh rincian kegiatan' });
		if (!berkas || berkas.size === 0) return fail(400, { rincian, pesan: 'Pilih berkas CSV' });
		if (berkas.size > MAKS_BYTE) return fail(400, { rincian, pesan: 'Berkas melebihi 20 MB' });

		const hasil = imporCsv(await berkas.text());

		return {
			rincian,
			namaBerkas: berkas.name,
			kolomTerbaca: hasil.kolomTerbaca,
			totalBaris: hasil.totalBaris,
			galat: hasil.galat.slice(0, 50),
			jumlahGalat: hasil.galat.length,
			jumlahSah: hasil.peserta.length,
			pratinjau: hasil.peserta.slice(0, 8),
			pesertaJson: JSON.stringify(hasil.peserta)
		};
	},

	/** Langkah 2 — bangun dokumen + Merkle, simpan sebagai menunggu persetujuan. */
	siapkan: async ({ request, locals }) => {
		if (!locals.pengguna) throw error(403, 'Tidak berwenang');

		const form = await request.formData();
		const rincian = {
			namaKegiatan: String(form.get('namaKegiatan') ?? ''),
			tanggalKegiatan: String(form.get('tanggalKegiatan') ?? ''),
			penyelenggara: String(form.get('penyelenggara') ?? ''),
			namaPenerbit: String(form.get('namaPenerbit') ?? ''),
			templateId: String(form.get('templateId') ?? 'bawaan')
		};

		let peserta;
		try {
			peserta = JSON.parse(String(form.get('pesertaJson') ?? '[]'));
		} catch {
			return fail(400, { pesan: 'Data peserta rusak, ulangi unggahan' });
		}
		if (!Array.isArray(peserta) || peserta.length === 0) {
			return fail(400, { pesan: 'Tidak ada peserta yang sah' });
		}

		try {
			const isi = await siapkanBatch(rincian, peserta, locals.pengguna.nama);
			throw redirect(303, `/admin/kegiatan/${isi.batch.uuid}`);
		} catch (e) {
			if (e instanceof Response || (e as { status?: number })?.status === 303) throw e;
			return fail(500, { pesan: e instanceof Error ? e.message : String(e) });
		}
	}
};
