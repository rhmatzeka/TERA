import { describe, expect, test } from 'bun:test';
import { MockAnchor } from '../src/lib/server/anchor/mock';
import { bangunBatch, hitungDaun, idBatchOnchain, verifikasiBuktiDaun } from '../src/lib/merkle';
import { bangunDokumen, hashDariDokumen } from '../src/lib/kredensial';

function batchContoh(n: number) {
	const peserta = Array.from({ length: n }, (_, i) => {
		const dok = bangunDokumen({
			idSertifikat: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
			alamatPenerbit: '0x1111111111111111111111111111111111111111',
			namaPenerbit: 'Universitas Contoh',
			namaKegiatan: 'Pelatihan Web3',
			tanggalKegiatan: '2026-04-01',
			penyelenggara: 'Fakultas Teknik',
			subjek: { nama: `Peserta ${i}` }
		});
		return { idSertifikat: dok.id, hashDokumen: hashDariDokumen(dok).hash };
	});
	return bangunBatch(peserta);
}

describe('verifikasi tataran daun cocok dengan skema OpenZeppelin', () => {
	test('setiap daun terverifikasi terhadap root', () => {
		const { root, entri } = batchContoh(20);
		for (const e of entri) {
			expect(verifikasiBuktiDaun(root, e.daun, e.bukti)).toBe(true);
		}
	});

	test('daun asing ditolak', () => {
		const { root, entri } = batchContoh(20);

		// Dokumen yang benar-benar tidak pernah masuk batch ini.
		// Catatan: batchContoh(n) bersifat deterministik, sehingga peserta
		// batch kecil selalu merupakan bagian dari batch besar — memakainya
		// sebagai "daun asing" akan salah.
		const dokAsing = bangunDokumen({
			idSertifikat: 'ffffffff-0000-4000-8000-999999999999',
			alamatPenerbit: '0x2222222222222222222222222222222222222222',
			namaPenerbit: 'Institusi Lain',
			namaKegiatan: 'Kegiatan Lain',
			tanggalKegiatan: '2020-01-01',
			penyelenggara: 'Pihak Lain',
			subjek: { nama: 'Penyusup' }
		});
		const daunAsing = hitungDaun(hashDariDokumen(dokAsing).hash);

		expect(verifikasiBuktiDaun(root, daunAsing, entri[0].bukti)).toBe(false);
	});

	test('bukti milik peserta lain ditolak', () => {
		const { root, entri } = batchContoh(20);
		expect(verifikasiBuktiDaun(root, entri[0].daun, entri[1].bukti)).toBe(false);
	});
});

describe('MockAnchor — alur penuh tanpa blockchain', () => {
	test('terbit lalu verifikasi berhasil', async () => {
		const anchor = new MockAnchor();
		const uuid = 'aaaaaaaa-0000-4000-8000-000000000001';
		const id = idBatchOnchain(uuid);
		const { root, entri } = batchContoh(30);

		const hasil = await anchor.terbitkanBatch(id, root, 'Pelatihan Web3', 30);
		expect(hasil.txHash).toMatch(/^0x[0-9a-f]{64}$/);
		expect(await anchor.bacaRoot(id)).toBe(root);

		const status = await anchor.verifikasi(id, entri[0].daun, entri[0].bukti);
		expect(status).toEqual({ sah: true, adaBatch: true, sudahCabut: false });
	});

	test('batch ganda ditolak — sama seperti kontrak (plan.md 15.5)', async () => {
		const anchor = new MockAnchor();
		const id = idBatchOnchain('bbbbbbbb-0000-4000-8000-000000000001');
		const { root } = batchContoh(5);

		await anchor.terbitkanBatch(id, root, 'Seminar', 5);
		expect(anchor.terbitkanBatch(id, root, 'Seminar', 5)).rejects.toThrow('BatchSudahAda');
	});

	test('batch yang belum terbit menghasilkan adaBatch=false', async () => {
		const anchor = new MockAnchor();
		const { entri } = batchContoh(5);
		const status = await anchor.verifikasi(idBatchOnchain('belum-ada'), entri[0].daun, entri[0].bukti);
		expect(status).toEqual({ sah: false, adaBatch: false, sudahCabut: false });
	});

	test('pencabutan membatalkan sertifikat yang tadinya sah', async () => {
		const anchor = new MockAnchor();
		const id = idBatchOnchain('cccccccc-0000-4000-8000-000000000001');
		const { root, entri } = batchContoh(10);
		await anchor.terbitkanBatch(id, root, 'Seminar', 10);

		expect((await anchor.verifikasi(id, entri[0].daun, entri[0].bukti)).sah).toBe(true);

		await anchor.cabut(entri[0].daun, 'ditarik');
		const status = await anchor.verifikasi(id, entri[0].daun, entri[0].bukti);
		expect(status).toEqual({ sah: false, adaBatch: true, sudahCabut: true });

		// peserta lain tidak terpengaruh
		expect((await anchor.verifikasi(id, entri[1].daun, entri[1].bukti)).sah).toBe(true);
	});

	test('pencabutan ganda ditolak', async () => {
		const anchor = new MockAnchor();
		const { entri } = batchContoh(3);
		await anchor.cabut(entri[0].daun, 'alasan');
		expect(anchor.cabut(entri[0].daun, 'alasan')).rejects.toThrow('SudahDicabut');
	});

	test('saldo terbaca untuk indikator dashboard', async () => {
		expect(await new MockAnchor().saldo()).toBeGreaterThan(0n);
	});
});
