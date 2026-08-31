/**
 * Adapter tiruan — memungkinkan seluruh alur aplikasi diuji tanpa blockchain.
 * Dipakai pada uji integrasi dan pengembangan lokal.
 */
import type { Hex } from 'viem';
import type { AnchorAdapter, HasilAnchor, StatusVerifikasi } from './tipe';
import { verifikasiBuktiDaun } from '../../merkle';

export class MockAnchor implements AnchorAdapter {
	readonly nama = 'mock';
	readonly chainId = 31337;
	readonly alamatKontrak: Hex = '0x0000000000000000000000000000000000000001';

	private root = new Map<string, Hex>();
	private cabutSet = new Set<string>();
	private nomorTx = 0n;
	private saldoWei = 10n ** 18n;

	private hasil(): HasilAnchor {
		this.nomorTx += 1n;
		const gasTerpakai = 26_576n;
		const hargaGas = 1_000_000_000n;
		return {
			txHash: `0x${this.nomorTx.toString(16).padStart(64, '0')}` as Hex,
			nomorBlok: this.nomorTx,
			gasTerpakai,
			hargaGas,
			biayaWei: gasTerpakai * hargaGas
		};
	}

	async terbitkanBatch(idBatchOnchain: Hex, root: Hex): Promise<HasilAnchor> {
		if (this.root.has(idBatchOnchain.toLowerCase())) throw new Error('BatchSudahAda');
		if (/^0x0+$/.test(root)) throw new Error('RootKosong');
		this.root.set(idBatchOnchain.toLowerCase(), root);
		return this.hasil();
	}

	async cabut(daun: Hex, alasan: string): Promise<HasilAnchor> {
		if (this.cabutSet.has(daun.toLowerCase())) throw new Error('SudahDicabut');
		if (alasan.length === 0) throw new Error('AlasanKosong');
		this.cabutSet.add(daun.toLowerCase());
		return this.hasil();
	}

	async bacaRoot(idBatchOnchain: Hex): Promise<Hex | null> {
		return this.root.get(idBatchOnchain.toLowerCase()) ?? null;
	}

	async cekDicabut(daun: Hex): Promise<boolean> {
		return this.cabutSet.has(daun.toLowerCase());
	}

	async verifikasi(idBatchOnchain: Hex, daun: Hex, bukti: Hex[]): Promise<StatusVerifikasi> {
		const root = await this.bacaRoot(idBatchOnchain);
		const sudahCabut = await this.cekDicabut(daun);
		const adaBatch = root !== null;
		if (!adaBatch) return { sah: false, adaBatch: false, sudahCabut };
		// Memakai verifikasi tataran daun agar identik dengan kontrak Solidity.
		const anggota = verifikasiBuktiDaun(root, daun, bukti);
		return { sah: anggota && !sudahCabut, adaBatch, sudahCabut };
	}

	async saldo(): Promise<bigint> {
		return this.saldoWei;
	}
}
