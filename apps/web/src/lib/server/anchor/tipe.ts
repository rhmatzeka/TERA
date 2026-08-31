/**
 * Antarmuka lapisan jangkar (plan.md 5.2).
 *
 * Alasan pola ini: sertifikat harus dapat diverifikasi 10-20 tahun ke depan,
 * sementara umur sebuah blockchain belum tentu sepanjang itu. Dengan adapter,
 * pemilihan jaringan menjadi keputusan yang dapat dianulir, bukan taruhan
 * permanen — dan seluruh aplikasi dapat diuji tanpa blockchain sama sekali.
 */
import type { Hex } from 'viem';

export interface HasilAnchor {
	txHash: Hex;
	nomorBlok?: bigint;
	gasTerpakai?: bigint;
	hargaGas?: bigint;
	biayaWei?: bigint;
}

export interface StatusVerifikasi {
	sah: boolean;
	adaBatch: boolean;
	sudahCabut: boolean;
}

export interface AnchorAdapter {
	readonly nama: string;
	readonly chainId: number;
	readonly alamatKontrak: Hex;

	terbitkanBatch(
		idBatchOnchain: Hex,
		root: Hex,
		namaKegiatan: string,
		jumlah: number
	): Promise<HasilAnchor>;

	cabut(daun: Hex, alasan: string): Promise<HasilAnchor>;

	bacaRoot(idBatchOnchain: Hex): Promise<Hex | null>;
	cekDicabut(daun: Hex): Promise<boolean>;
	verifikasi(idBatchOnchain: Hex, daun: Hex, bukti: Hex[]): Promise<StatusVerifikasi>;

	/** Untuk indikator saldo di dashboard admin (plan.md 4). */
	saldo(): Promise<bigint>;
}
