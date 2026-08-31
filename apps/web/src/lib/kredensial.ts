/**
 * Pembentukan, kanonikalisasi, dan hashing dokumen kredensial.
 *
 * Modul ini isomorfik: dipakai server (saat menerbitkan) DAN peramban
 * (saat verifikasi mandiri). Lihat plan.md 15.1 dan 15.6.
 *
 * ATURAN PALING PENTING
 * ---------------------
 * Hash SELALU dihitung dari string kanonik (RFC 8785), tidak pernah dari
 * objek JavaScript atau dari kolom JSONB. `JSON.stringify` tidak
 * deterministik dan Postgres JSONB mengurutkan ulang kunci — keduanya
 * menghasilkan hash berbeda dan membuat sertifikat sah dinyatakan tidak sah.
 */

import canonicalize from 'canonicalize';
import { keccak256, toBytes, type Hex } from 'viem';

/** Subjek kredensial — data peserta. Tidak pernah naik ke blockchain. */
export interface SubjekKredensial {
	nama: string;
	nomorIdentitas?: string;
	email?: string;
	peran?: string;
}

/** Dokumen kredensial, mengacu pada struktur W3C Verifiable Credentials 2.0. */
export interface DokumenKredensial {
	'@context': string[];
	type: string[];
	id: string;
	issuer: { id: string; nama: string };
	validFrom: string;
	credentialSubject: SubjekKredensial & {
		namaKegiatan: string;
		tanggalKegiatan: string;
		penyelenggara: string;
	};
}

export interface MasukanKredensial {
	idSertifikat: string;
	alamatPenerbit: Hex;
	namaPenerbit: string;
	namaKegiatan: string;
	tanggalKegiatan: string;
	penyelenggara: string;
	subjek: SubjekKredensial;
}

export function bangunDokumen(m: MasukanKredensial): DokumenKredensial {
	return {
		'@context': [
			'https://www.w3.org/ns/credentials/v2',
			'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
		],
		type: ['VerifiableCredential', 'OpenBadgeCredential'],
		id: `urn:uuid:${m.idSertifikat}`,
		issuer: { id: `did:pkh:eip155:0:${m.alamatPenerbit}`, nama: m.namaPenerbit },
		validFrom: m.tanggalKegiatan,
		credentialSubject: {
			...m.subjek,
			namaKegiatan: m.namaKegiatan,
			tanggalKegiatan: m.tanggalKegiatan,
			penyelenggara: m.penyelenggara
		}
	};
}

/**
 * Kanonikalisasi RFC 8785 (JCS).
 * Hasilnya inilah yang disimpan di kolom `dokumen_kanonik TEXT` dan di-hash.
 */
export function kanonikalisasi(dok: unknown): string {
	const hasil = canonicalize(dok);
	if (hasil === undefined) {
		throw new Error('Dokumen tidak dapat dikanonikalisasi');
	}
	return hasil;
}

/** hashDokumen = keccak256(utf8(dokumen kanonik)) — lihat plan.md 15.2 */
export function hashDokumen(dokumenKanonik: string): Hex {
	return keccak256(toBytes(dokumenKanonik));
}

/** Jalan pintas: dokumen -> kanonik -> hash. */
export function hashDariDokumen(dok: unknown): { kanonik: string; hash: Hex } {
	const kanonik = kanonikalisasi(dok);
	return { kanonik, hash: hashDokumen(kanonik) };
}
