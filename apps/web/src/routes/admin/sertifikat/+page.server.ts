import { error, fail } from '@sveltejs/kit';
import type { Hex } from 'viem';
import { env } from '$env/dynamic/private';
import { muatBatch } from '$lib/server/data';
import { anchorAktif } from '$lib/server/anchorAktif';
import { KEWENANGAN } from '$lib/peran';

const PER_HAL = 25;

export async function load({ url }) {
	const data = await muatBatch();
	if (!data) return { ada: false as const };

	const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
	const hal = Math.max(1, Number(url.searchParams.get('hal') ?? 1));

	const cocok = q
		? data.sertifikat.filter(
				(s) => s.nama.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
			)
		: data.sertifikat;

	const total = cocok.length;
	const halaman = cocok.slice((hal - 1) * PER_HAL, hal * PER_HAL);

	const anchor = await anchorAktif();
	let status: Record<string, boolean> = {};
	if (anchor) {
		try {
			const hasil = await Promise.all(
				halaman.map(async (s) => [s.id, await anchor.cekDicabut(s.daun)] as const)
			);
			status = Object.fromEntries(hasil);
		} catch {
			status = {};
		}
	}

	return {
		ada: true as const,
		jaringan: data.jaringan,
		basisExplorer: env.EXPLORER_URL ?? null,
		q,
		hal,
		total,
		perHal: PER_HAL,
		totalHal: Math.max(1, Math.ceil(total / PER_HAL)),
		sertifikat: halaman.map((s) => ({
			id: s.id,
			nama: s.nama,
			daun: s.daun,
			indeks: s.indeks,
			dicabut: status[s.id] ?? false
		}))
	};
}

export const actions = {
	cabut: async ({ request, locals }) => {
		// Penjagaan kedua: peran diperiksa lagi di sisi server, bukan hanya
		// disembunyikan di antarmuka.
		if (!locals.pengguna || !KEWENANGAN[locals.pengguna.peran].cabut) {
			throw error(403, 'Peran Anda tidak berwenang mencabut sertifikat');
		}

		const form = await request.formData();
		const daun = form.get('daun') as Hex;
		const alasan = String(form.get('alasan') ?? '').trim();

		if (!daun) return fail(400, { pesan: 'Daun tidak boleh kosong' });
		if (alasan.length < 5) return fail(400, { pesan: 'Alasan pencabutan minimal 5 karakter' });

		const anchor = await anchorAktif();
		if (!anchor) return fail(503, { pesan: 'KUNCI_TX belum diatur — transaksi tidak dapat dikirim' });

		try {
			const hasil = await anchor.cabut(daun, alasan);
			return { berhasil: true, txHash: hasil.txHash, gas: Number(hasil.gasTerpakai ?? 0n) };
		} catch (e) {
			const teks = e instanceof Error ? e.message : String(e);
			return fail(400, {
				pesan: teks.includes('SudahDicabut')
					? 'Sertifikat ini sudah dicabut sebelumnya.'
					: `Gagal mencabut: ${teks.slice(0, 180)}`
			});
		}
	}
};
