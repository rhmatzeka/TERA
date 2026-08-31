import { describe, expect, test } from 'bun:test';
import { bangunBatch, hitungDaun, verifikasiBukti, idBatchOnchain } from '../src/lib/merkle';
import { bangunDokumen, hashDariDokumen, kanonikalisasi } from '../src/lib/kredensial';
import type { Hex } from 'viem';

function pesertaContoh(n: number) {
	return Array.from({ length: n }, (_, i) => {
		const dok = bangunDokumen({
			idSertifikat: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
			alamatPenerbit: '0x1111111111111111111111111111111111111111',
			namaPenerbit: 'Universitas Contoh',
			namaKegiatan: 'Webinar Blockchain 2026',
			tanggalKegiatan: '2026-03-15',
			penyelenggara: 'Fakultas Teknik',
			subjek: { nama: `Peserta ${i}`, nomorIdentitas: `2019${String(i).padStart(4, '0')}` }
		});
		const { kanonik, hash } = hashDariDokumen(dok);
		return {
			idSertifikat: dok.id.replace('urn:uuid:', ''),
			hashDokumen: hash,
			kanonik
		};
	});
}

describe('kanonikalisasi (plan.md 15.1)', () => {
	test('urutan kunci tidak memengaruhi hasil', () => {
		const a = { b: 2, a: 1, c: { z: 26, y: 25 } };
		const b = { c: { y: 25, z: 26 }, a: 1, b: 2 };
		expect(kanonikalisasi(a)).toBe(kanonikalisasi(b));
	});

	test('hash stabil untuk objek yang sama dengan urutan berbeda', () => {
		const a = hashDariDokumen({ nama: 'Budi', nim: '123' });
		const b = hashDariDokumen({ nim: '123', nama: 'Budi' });
		expect(a.hash).toBe(b.hash);
	});

	test('perubahan satu karakter mengubah hash', () => {
		const a = hashDariDokumen({ nama: 'Budi Santoso' });
		const b = hashDariDokumen({ nama: 'Budi Santosa' });
		expect(a.hash).not.toBe(b.hash);
	});

	test('spasi dihilangkan dari bentuk kanonik', () => {
		expect(kanonikalisasi({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
	});
});

describe('merkle (plan.md 15.2)', () => {
	test('membangun batch dan memverifikasi setiap bukti', () => {
		const peserta = pesertaContoh(50);
		const { root, entri } = bangunBatch(peserta);

		expect(entri).toHaveLength(50);
		for (const e of entri) {
			expect(verifikasiBukti(root, e.hashDokumen, e.bukti)).toBe(true);
		}
	});

	test('bukti milik orang lain ditolak', () => {
		const peserta = pesertaContoh(10);
		const { root, entri } = bangunBatch(peserta);
		expect(verifikasiBukti(root, entri[0].hashDokumen, entri[1].bukti)).toBe(false);
	});

	test('dokumen yang diubah ditolak', () => {
		const peserta = pesertaContoh(10);
		const { root, entri } = bangunBatch(peserta);
		const hashPalsu = hashDariDokumen({ nama: 'Penyusup' }).hash;
		expect(verifikasiBukti(root, hashPalsu, entri[0].bukti)).toBe(false);
	});

	test('daun tunggal konsisten dengan daun di dalam tree', () => {
		const peserta = pesertaContoh(8);
		const { entri } = bangunBatch(peserta);
		for (const e of entri) {
			expect(hitungDaun(e.hashDokumen)).toBe(e.daun);
		}
	});

	test('batch kosong ditolak', () => {
		expect(() => bangunBatch([])).toThrow();
	});

	test('batch 1 peserta tetap sah', () => {
		const { root, entri } = bangunBatch(pesertaContoh(1));
		expect(verifikasiBukti(root, entri[0].hashDokumen, entri[0].bukti)).toBe(true);
	});

	test(
		'kedalaman bukti tumbuh logaritmik terhadap jumlah peserta',
		() => {
			const ukuran = [10, 100, 1_000, 10_000];
			const kedalaman = ukuran.map((n) => {
				const { entri } = bangunBatch(pesertaContoh(n));
				return Math.max(...entri.map((e) => e.bukti.length));
			});
			// 10.000 peserta -> bukti maksimum ~14 hash (~448 byte), bukan 10.000
			expect(kedalaman[3]).toBeLessThanOrEqual(15);
			expect(kedalaman[0]).toBeLessThan(kedalaman[3]);
		},
		60_000
	);

	test('idBatchOnchain deterministik dan 32 byte', () => {
		const id = '3f8a1c2e-0000-4000-8000-000000000001';
		expect(idBatchOnchain(id)).toBe(idBatchOnchain(id));
		expect(idBatchOnchain(id)).toHaveLength(66); // 0x + 64 hex
	});
});

describe('vektor uji untuk kontrak Solidity', () => {
	test('menghasilkan vektor tetap yang dapat diuji ulang di Foundry', () => {
		const peserta = pesertaContoh(4);
		const { root, entri } = bangunBatch(peserta);

		// Dicetak agar dapat disalin ke test/MerkleKompatibilitas.t.sol
		console.log('\n=== VEKTOR UJI (salin ke Foundry) ===');
		console.log('root :', root);
		console.log('daun :', entri[0].daun);
		console.log('bukti:', JSON.stringify(entri[0].bukti));

		expect(root).toMatch(/^0x[0-9a-f]{64}$/);
		expect(verifikasiBukti(root, entri[0].hashDokumen, entri[0].bukti)).toBe(true);
	});
});
