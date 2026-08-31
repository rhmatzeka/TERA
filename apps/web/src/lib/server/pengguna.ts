/**
 * Penyimpanan akun. PROTOTIPE — pada Fase 2 diganti tabel `pengguna`.
 *
 * Akun staf dibuat sekali saat modul dimuat. Akun peserta tidak disimpan:
 * peserta dikenali dari surel yang tercantum di dalam dokumen kredensial
 * batch — meniru alur nyata, yaitu peserta menerima tautan lewat surel
 * setelah kegiatan selesai.
 */
import { cocokSandi, hashSandi } from './auth';
import type { Pengguna } from '$lib/peran';
import { muatBatch } from './data';

interface Akun extends Pengguna {
	hash: string;
}

/** Kata sandi demo — pada sistem nyata dibuat acak dan dikirim ke penggunanya. */
export const AKUN_DEMO = [
	{ email: 'admin@kampus.ac.id', sandi: 'admin123', nama: 'Rina Admin', peran: 'admin' as const },
	{ email: 'operator@kampus.ac.id', sandi: 'operator123', nama: 'Dian Operator', peran: 'operator' as const },
	{ email: 'dekan@kampus.ac.id', sandi: 'dekan123', nama: 'Prof. Hadi', peran: 'penandatangan' as const }
];

export const SANDI_PESERTA = 'peserta123';

const staf: Akun[] = AKUN_DEMO.map((a, i) => ({
	id: `staf-${i + 1}`,
	email: a.email,
	nama: a.nama,
	peran: a.peran,
	hash: hashSandi(a.sandi)
}));

export async function masuk(email: string, sandi: string): Promise<Pengguna | null> {
	const surel = email.trim().toLowerCase();

	const akun = staf.find((a) => a.email === surel);
	if (akun) {
		return cocokSandi(sandi, akun.hash) ? { id: akun.id, email: akun.email, nama: akun.nama, peran: akun.peran } : null;
	}

	// Peserta: dikenali dari dokumen kredensial pada batch.
	const data = await muatBatch();
	if (!data) return null;

	const sert = data.sertifikat.find((s) => {
		try {
			return JSON.parse(s.dokumenKanonik).credentialSubject.email?.toLowerCase() === surel;
		} catch {
			return false;
		}
	});
	if (!sert || sandi !== SANDI_PESERTA) return null;

	return { id: sert.id, email: surel, nama: sert.nama, peran: 'peserta' };
}
