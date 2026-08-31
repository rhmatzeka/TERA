/**
 * Pembangunan Merkle tree dan bukti keanggotaan.
 *
 * Memakai @openzeppelin/merkle-tree agar skema hash daun IDENTIK dengan
 * MerkleProof milik OpenZeppelin di sisi Solidity:
 *
 *   daun = keccak256(keccak256(abi.encode(hashDokumen)))
 *
 * Hash ganda mencegah second preimage attack — simpul internal tidak dapat
 * dipalsukan sebagai daun. Jangan pernah mengimplementasikan Merkle sendiri;
 * itu sumber bug paling umum pada sistem seperti ini. Lihat plan.md 15.2.
 */

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { concat, keccak256, toBytes, type Hex } from 'viem';

const TIPE_NILAI = ['bytes32'] as const;

export interface EntriBatch {
	idSertifikat: string;
	hashDokumen: Hex;
}

export interface HasilBatch {
	root: Hex;
	entri: Array<{ idSertifikat: string; hashDokumen: Hex; daun: Hex; bukti: Hex[]; indeks: number }>;
}

/** Membangun tree untuk satu batch dan menghasilkan bukti untuk setiap entri. */
export function bangunBatch(masukan: EntriBatch[]): HasilBatch {
	if (masukan.length === 0) throw new Error('Batch tidak boleh kosong');

	const nilai = masukan.map((m) => [m.hashDokumen]);
	const tree = StandardMerkleTree.of(nilai, [...TIPE_NILAI]);

	// Urutan internal tree tidak sama dengan urutan masukan, jadi telusuri
	// lewat tree.entries() dan cocokkan kembali ke masukan aslinya.
	const perHash = new Map(masukan.map((m) => [m.hashDokumen.toLowerCase(), m]));
	const entri: HasilBatch['entri'] = [];

	for (const [indeks, nilaiEntri] of tree.entries()) {
		const h = (nilaiEntri[0] as string).toLowerCase();
		const asal = perHash.get(h);
		if (!asal) throw new Error(`Entri tak dikenal pada tree: ${h}`);
		entri.push({
			idSertifikat: asal.idSertifikat,
			hashDokumen: asal.hashDokumen,
			daun: tree.leafHash(nilaiEntri) as Hex,
			bukti: tree.getProof(indeks) as Hex[],
			indeks
		});
	}

	return { root: tree.root as Hex, entri };
}

/** Menghitung daun tunggal tanpa membangun tree (dipakai saat verifikasi). */
export function hitungDaun(hashDok: Hex): Hex {
	return StandardMerkleTree.of([[hashDok]], [...TIPE_NILAI]).leafHash([hashDok]) as Hex;
}

/**
 * Verifikasi bukti Merkle sepenuhnya di sisi klien, tanpa menyentuh
 * server penerbit maupun kontrak. Root dibaca terpisah dari blockchain.
 */
export function verifikasiBukti(root: Hex, hashDok: Hex, bukti: Hex[]): boolean {
	return StandardMerkleTree.verify(root, [...TIPE_NILAI], [hashDok], bukti);
}

/**
 * Verifikasi pada tataran DAUN, meniru persis MerkleProof.verify OpenZeppelin
 * di Solidity: pasangan diurutkan sebelum di-hash.
 *
 * Dipakai oleh MockAnchor agar berperilaku identik dengan kontrak asli —
 * kalau mock memakai skema berbeda, uji integrasi menjadi menyesatkan.
 */
export function verifikasiBuktiDaun(root: Hex, daun: Hex, bukti: Hex[]): boolean {
	let hash = daun;
	for (const saudara of bukti) {
		hash =
			BigInt(hash) < BigInt(saudara)
				? keccak256(concat([hash, saudara]))
				: keccak256(concat([saudara, hash]));
	}
	return hash.toLowerCase() === root.toLowerCase();
}

/** UUID batch -> bytes32 untuk kontrak. Lihat plan.md 15.4. */
export function idBatchOnchain(uuidBatch: string): Hex {
	return keccak256(toBytes(uuidBatch));
}
