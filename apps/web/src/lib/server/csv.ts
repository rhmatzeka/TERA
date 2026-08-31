/**
 * Impor dan validasi CSV peserta.
 *
 * Laporan galat dibuat PER BARIS agar operator tahu persis baris mana yang
 * harus diperbaiki — bukan sekadar "berkas tidak valid".
 */
import Papa from 'papaparse';

export interface BarisPeserta {
	baris: number;
	nama: string;
	email: string;
	nomorIdentitas: string;
	peran: string;
}

export interface GalatBaris {
	baris: number;
	pesan: string;
	isi: string;
}

export interface HasilImpor {
	peserta: BarisPeserta[];
	galat: GalatBaris[];
	kolomTerbaca: string[];
	totalBaris: number;
}

const ALIAS: Record<string, string[]> = {
	nama: ['nama', 'name', 'nama_lengkap', 'nama lengkap'],
	email: ['email', 'surel', 'e-mail', 'alamat_email'],
	nomorIdentitas: ['nomor_identitas', 'nim', 'nip', 'no_identitas', 'nomor identitas', 'identitas'],
	peran: ['peran', 'role', 'kategori', 'jenis_peserta']
};

function petakanKolom(kolom: string[]): Record<string, string | null> {
	const bersih = kolom.map((k) => k.trim().toLowerCase());
	const peta: Record<string, string | null> = {};
	for (const [ruas, nama] of Object.entries(ALIAS)) {
		const i = bersih.findIndex((k) => nama.includes(k));
		peta[ruas] = i >= 0 ? kolom[i] : null;
	}
	return peta;
}

const EMAIL_SAH = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function imporCsv(teks: string): HasilImpor {
	const hasil = Papa.parse<Record<string, string>>(teks.trim(), {
		header: true,
		skipEmptyLines: 'greedy',
		transformHeader: (h) => h.trim()
	});

	const kolom = hasil.meta.fields ?? [];
	const peta = petakanKolom(kolom);
	const galat: GalatBaris[] = [];
	const peserta: BarisPeserta[] = [];

	if (!peta.nama) {
		galat.push({ baris: 0, pesan: 'Kolom "nama" tidak ditemukan', isi: kolom.join(', ') });
	}
	if (!peta.email) {
		galat.push({ baris: 0, pesan: 'Kolom "email" tidak ditemukan', isi: kolom.join(', ') });
	}
	if (galat.length) {
		return { peserta: [], galat, kolomTerbaca: kolom, totalBaris: hasil.data.length };
	}

	const emailTerpakai = new Map<string, number>();

	hasil.data.forEach((r, i) => {
		const baris = i + 2; // baris 1 adalah kepala kolom
		const nama = (r[peta.nama!] ?? '').trim();
		const email = (r[peta.email!] ?? '').trim().toLowerCase();
		const isiBaris = Object.values(r).join(',').slice(0, 90);

		if (!nama && !email) return; // baris benar-benar kosong

		if (!nama) {
			galat.push({ baris, pesan: 'Nama kosong', isi: isiBaris });
			return;
		}
		if (nama.length > 120) {
			galat.push({ baris, pesan: 'Nama melebihi 120 karakter', isi: isiBaris });
			return;
		}
		if (!email) {
			galat.push({ baris, pesan: 'Email kosong', isi: isiBaris });
			return;
		}
		if (!EMAIL_SAH.test(email)) {
			galat.push({ baris, pesan: `Format email tidak sah: ${email}`, isi: isiBaris });
			return;
		}
		const sebelumnya = emailTerpakai.get(email);
		if (sebelumnya) {
			galat.push({ baris, pesan: `Email ganda, sudah dipakai pada baris ${sebelumnya}`, isi: isiBaris });
			return;
		}
		emailTerpakai.set(email, baris);

		peserta.push({
			baris,
			nama,
			email,
			nomorIdentitas: peta.nomorIdentitas ? (r[peta.nomorIdentitas] ?? '').trim() : '',
			peran: (peta.peran ? (r[peta.peran] ?? '').trim() : '') || 'Peserta'
		});
	});

	return { peserta, galat, kolomTerbaca: kolom, totalBaris: hasil.data.length };
}

/** Contoh CSV untuk diunduh operator. */
export const CONTOH_CSV = `nama,email,nomor_identitas,peran
Budi Santoso,budi@kampus.ac.id,202100001,Peserta
Siti Rahayu,siti@kampus.ac.id,202100002,Peserta
Prof. Hadi Wijaya,hadi@kampus.ac.id,19700101,Pemateri
Dewi Lestari,dewi@kampus.ac.id,202100003,Panitia
`;
