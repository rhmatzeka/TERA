import { error, json } from '@sveltejs/kit';
import { cariSertifikatGlobal } from '$lib/server/toko';

/**
 * Berkas bukti portabel (plan.md 15.7).
 *
 * Peserta hanya boleh mengunduh bukti MILIKNYA — kepemilikan diperiksa
 * dengan mencocokkan surel pada sesi terhadap surel di dalam dokumen.
 */
export async function GET({ params, locals }) {
	const temuan = await cariSertifikatGlobal(params.id);
	if (!temuan) throw error(404, 'Sertifikat tidak ditemukan');
	const { sert, isi: data } = temuan;

	let pemilik: string | null = null;
	try {
		pemilik = JSON.parse(sert.dokumenKanonik).credentialSubject.email?.toLowerCase() ?? null;
	} catch {
		pemilik = null;
	}
	if (!locals.pengguna || locals.pengguna.email !== pemilik) {
		throw error(403, 'Bukti ini bukan milik akun Anda');
	}

	return json(
		{
			versi: '1.0',
			catatan:
				'Berkas ini cukup untuk memverifikasi sertifikat tanpa server penerbit. ' +
				'Hitung keccak256 dari `dokumen` apa adanya, susun daun Merkle dengan skema ' +
				'StandardMerkleTree OpenZeppelin, lalu cocokkan dengan Merkle root pada kontrak.',
			dokumen: sert.dokumenKanonik,
			hashDokumen: sert.hashDokumen,
			daun: sert.daun,
			buktiMerkle: sert.bukti,
			alamatPenerbit: data.batch.alamatPenerbit,
			idBatchOnchain: data.batch.idOnchain,
			merkleRoot: data.batch.root,
			jaringan: {
				nama: data.jaringan.nama,
				chainId: data.jaringan.chainId,
				kontrak: data.jaringan.kontrak,
				rpc: data.jaringan.rpcUrl,
				txPenerbitan: data.batch.txHash
			}
		},
		{ headers: { 'Content-Disposition': `attachment; filename="bukti-${params.id}.json"` } }
	);
}
