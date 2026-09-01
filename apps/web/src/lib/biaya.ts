/**
 * Format biaya transaksi.
 *
 * Satuan utama SELALU token asli jaringan (ETH, MON, MATIC, …). Konversi
 * ke rupiah hanya ditampilkan bila kursnya diatur lewat HARGA_TOKEN_IDR.
 *
 * Alasannya: token testnet tidak punya nilai pasar, sehingga menampilkan
 * rupiah di jaringan uji justru menyesatkan — dan angka itu tidak boleh
 * dipakai sebagai klaim biaya produksi.
 */

export interface Kurs {
	simbol: string;
	hargaIdr: number | null;
}

export function formatBiaya(wei: string | bigint | null, kurs: Kurs): string {
	if (wei === null || wei === undefined) return '—';
	const n = Number(BigInt(wei)) / 1e18;
	const token = `${n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} ${kurs.simbol}`;
	if (!kurs.hargaIdr) return token;

	const idr = n * kurs.hargaIdr;
	const teks = idr < 1 ? `Rp ${idr.toFixed(4)}` : `Rp ${Math.round(idr).toLocaleString('id-ID')}`;
	return `${token} · ${teks}`;
}

/** Biaya per sertifikat — angka kunci pada analisis skripsi. */
export function biayaPerSertifikat(wei: string | bigint | null, jumlah: number, kurs: Kurs): string {
	if (wei === null || wei === undefined || jumlah <= 0) return '—';
	const n = Number(BigInt(wei)) / 1e18 / jumlah;
	const token = `${n.toPrecision(3)} ${kurs.simbol}`;
	if (!kurs.hargaIdr) return token;
	const idr = n * kurs.hargaIdr;
	return `${token} · Rp ${idr < 1 ? idr.toFixed(4) : Math.round(idr).toLocaleString('id-ID')}`;
}
