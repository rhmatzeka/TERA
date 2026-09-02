/**
 * Pemformat waktu untuk antarmuka.
 *
 * Data rantai memberi waktu dalam epoch detik atau string ISO. Keduanya tidak
 * layak ditampilkan mentah kepada pengguna — halaman ini dibaca panitia
 * kegiatan, bukan pengembang.
 */

const ZONA = 'Asia/Jakarta';

function keTanggal(nilai: string | number | bigint): Date | null {
	if (typeof nilai === 'string' && !/^\d+$/.test(nilai)) {
		const d = new Date(nilai);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	const detik = Number(nilai);
	if (!Number.isFinite(detik) || detik <= 0) return null;
	return new Date(detik * 1000);
}

/** "30 Agustus 2026, 21.25 WIB" */
export function formatWaktu(nilai: string | number | bigint): string {
	const d = keTanggal(nilai);
	if (!d) return String(nilai);
	const teks = d.toLocaleString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: ZONA
	});
	return `${teks} WIB`;
}

/** "30 Agu 2026, 21.25" — untuk ruang sempit. */
export function formatWaktuRingkas(nilai: string | number | bigint): string {
	const d = keTanggal(nilai);
	if (!d) return String(nilai);
	return d.toLocaleString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: ZONA
	});
}

/** Menandai nilai epoch yang layak diformat sebagai waktu. */
export function tampakWaktu(kunci: string, nilai: unknown): boolean {
	return (
		/waktu|timestamp|tanggal/i.test(kunci) &&
		typeof nilai === 'string' &&
		/^\d{9,11}$/.test(nilai)
	);
}

/**
 * "20 Oktober 2026" — untuk tanggal tanpa jam, seperti tanggal kegiatan
 * yang tersimpan dalam bentuk YYYY-MM-DD.
 */
export function formatTanggal(nilai: string): string {
	const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nilai.trim());
	if (!cocok) return nilai;
	const d = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
	if (Number.isNaN(d.getTime())) return nilai;
	return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
