/**
 * Pengukuran kinerja sisi aplikasi untuk Bab 4 (kriteria K3 pada plan.md).
 * Jalankan: bun run test/kinerja.bench.ts
 */
import { bangunBatch } from '../src/lib/merkle';
import { bangunDokumen, hashDariDokumen } from '../src/lib/kredensial';

function bangunPeserta(n: number) {
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
		const { hash } = hashDariDokumen(dok);
		return { idSertifikat: dok.id, hashDokumen: hash };
	});
}

const ukuran = [100, 1_000, 10_000, 50_000, 100_000];

console.log('\n=== K3: Kinerja pembangunan batch ===');
console.log('        N | dokumen+hash (ms) | merkle (ms) | total (ms) | kedalaman | memori (MB)');

for (const n of ukuran) {
	Bun.gc(true);
	const memAwal = process.memoryUsage().heapUsed;

	const t0 = performance.now();
	const peserta = bangunPeserta(n);
	const t1 = performance.now();
	const { entri } = bangunBatch(peserta);
	const t2 = performance.now();

	const memAkhir = process.memoryUsage().heapUsed;
	const kedalaman = Math.max(...entri.map((e) => e.bukti.length));

	console.log(
		[
			String(n).padStart(9),
			(t1 - t0).toFixed(0).padStart(17),
			(t2 - t1).toFixed(0).padStart(11),
			(t2 - t0).toFixed(0).padStart(10),
			String(kedalaman).padStart(9),
			((memAkhir - memAwal) / 1024 / 1024).toFixed(0).padStart(11)
		].join(' | ')
	);
}
console.log('');
