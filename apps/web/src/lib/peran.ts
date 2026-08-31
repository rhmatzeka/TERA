/**
 * Definisi peran dan kewenangan — AMAN untuk klien.
 *
 * Dipisahkan dari `$lib/server/auth.ts` dengan sengaja: berkas di dalam
 * `$lib/server/` diblokir SvelteKit agar tidak pernah masuk bundel peramban,
 * sehingga konstanta yang dibutuhkan antarmuka (label peran, kewenangan
 * untuk menyembunyikan tombol) harus tinggal di luar direktori itu.
 *
 * Yang TIDAK boleh pindah ke sini: hashing kata sandi, penyimpanan sesi,
 * dan apa pun yang menyentuh rahasia.
 */

export type Peran = 'admin' | 'operator' | 'penandatangan' | 'peserta';

export interface Pengguna {
	id: string;
	email: string;
	nama: string;
	peran: Peran;
}

export const PERAN_STAF: Peran[] = ['admin', 'operator', 'penandatangan'];
export const adalahStaf = (p: Peran) => PERAN_STAF.includes(p);

export const LABEL_PERAN: Record<Peran, string> = {
	admin: 'Administrator',
	operator: 'Operator',
	penandatangan: 'Penandatangan',
	peserta: 'Peserta'
};

/**
 * Kewenangan per peran. Di antarmuka ini hanya menyembunyikan tombol —
 * penjagaan yang sesungguhnya tetap dilakukan ulang di action server.
 */
export const KEWENANGAN: Record<Peran, { terbitkan: boolean; cabut: boolean; kelolaPengguna: boolean }> = {
	admin: { terbitkan: false, cabut: false, kelolaPengguna: true },
	operator: { terbitkan: false, cabut: false, kelolaPengguna: false },
	penandatangan: { terbitkan: true, cabut: true, kelolaPengguna: false },
	peserta: { terbitkan: false, cabut: false, kelolaPengguna: false }
};
