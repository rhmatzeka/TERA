/**
 * Autentikasi berbasis sesi.
 *
 * PROTOTIPE: akun staf tersimpan di berkas dan sesi disimpan di memori,
 * sehingga sesi hilang ketika server dimuat ulang. Pada Fase 2 keduanya
 * pindah ke PostgreSQL (tabel `pengguna` dan tabel sesi) — mekanismenya
 * sama, hanya penyimpanannya yang berubah.
 *
 * Yang SUDAH sungguhan di sini: kata sandi di-hash dengan scrypt bergaram,
 * pembandingan tahan timing attack, sesi ber-kedaluwarsa, cookie httpOnly,
 * dan penjagaan rute di `hooks.server.ts`.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Peran dan kewenangan tinggal di $lib/peran karena juga dipakai antarmuka.
// Berkas di $lib/server/ tidak boleh diimpor komponen klien.
export type { Peran, Pengguna } from '$lib/peran';
export { PERAN_STAF, adalahStaf, LABEL_PERAN, KEWENANGAN } from '$lib/peran';

import type { Pengguna } from '$lib/peran';

export function hashSandi(sandi: string): string {
	const garam = randomBytes(16);
	return `${garam.toString('hex')}:${scryptSync(sandi, garam, 64).toString('hex')}`;
}

export function cocokSandi(sandi: string, tersimpan: string): boolean {
	const [garamHex, kunciHex] = tersimpan.split(':');
	if (!garamHex || !kunciHex) return false;
	const asli = Buffer.from(kunciHex, 'hex');
	const uji = scryptSync(sandi, Buffer.from(garamHex, 'hex'), 64);
	return asli.length === uji.length && timingSafeEqual(asli, uji);
}

// ── sesi ──────────────────────────────────────────────────────────────
const UMUR_SESI_MS = 1000 * 60 * 60 * 8; // 8 jam
const sesi = new Map<string, { pengguna: Pengguna; kedaluwarsa: number }>();

export const NAMA_COOKIE = 'sesi';

export function buatSesi(pengguna: Pengguna): string {
	const token = randomBytes(32).toString('hex');
	sesi.set(token, { pengguna, kedaluwarsa: Date.now() + UMUR_SESI_MS });
	return token;
}

export function ambilSesi(token: string | undefined): Pengguna | null {
	if (!token) return null;
	const s = sesi.get(token);
	if (!s) return null;
	if (s.kedaluwarsa < Date.now()) {
		sesi.delete(token);
		return null;
	}
	return s.pengguna;
}

export function hapusSesi(token: string | undefined): void {
	if (token) sesi.delete(token);
}
