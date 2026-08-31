/**
 * Adapter EVM — bekerja di jaringan EVM mana pun (Monad, Base, Polygon, ...)
 * karena bytecode kontraknya identik. Berganti jaringan cukup mengganti
 * konfigurasi, bukan kode.
 */
import {
	createPublicClient,
	createWalletClient,
	defineChain,
	http,
	type Hex,
	type PublicClient,
	type WalletClient
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { AnchorAdapter, HasilAnchor, StatusVerifikasi } from './tipe';

export const ABI_REGISTRI = [
	{
		type: 'function',
		name: 'terbitkanBatch',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'idBatch', type: 'bytes32' },
			{ name: 'root', type: 'bytes32' },
			{ name: 'namaKegiatan', type: 'string' },
			{ name: 'jumlah', type: 'uint256' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'cabut',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'daun', type: 'bytes32' },
			{ name: 'alasan', type: 'string' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'rootBatch',
		stateMutability: 'view',
		inputs: [{ name: '', type: 'bytes32' }],
		outputs: [{ name: '', type: 'bytes32' }]
	},
	{
		type: 'function',
		name: 'dicabut',
		stateMutability: 'view',
		inputs: [{ name: '', type: 'bytes32' }],
		outputs: [{ name: '', type: 'bool' }]
	},
	{
		type: 'function',
		name: 'verifikasiRinci',
		stateMutability: 'view',
		inputs: [
			{ name: 'idBatch', type: 'bytes32' },
			{ name: 'daun', type: 'bytes32' },
			{ name: 'bukti', type: 'bytes32[]' }
		],
		outputs: [
			{ name: 'sah', type: 'bool' },
			{ name: 'adaBatch', type: 'bool' },
			{ name: 'sudahCabut', type: 'bool' }
		]
	}
] as const;

export interface KonfigurasiEvm {
	nama: string;
	chainId: number;
	rpcUrl: string;
	alamatKontrak: Hex;
	kunciTx: Hex;
	simbolNativ?: string;
}

export class EvmAnchor implements AnchorAdapter {
	readonly nama: string;
	readonly chainId: number;
	readonly alamatKontrak: Hex;

	private publicClient: PublicClient;
	private walletClient: WalletClient;
	private akun: ReturnType<typeof privateKeyToAccount>;

	constructor(cfg: KonfigurasiEvm) {
		this.nama = cfg.nama;
		this.chainId = cfg.chainId;
		this.alamatKontrak = cfg.alamatKontrak;
		this.akun = privateKeyToAccount(cfg.kunciTx);

		const chain = defineChain({
			id: cfg.chainId,
			name: cfg.nama,
			nativeCurrency: { name: cfg.simbolNativ ?? 'ETH', symbol: cfg.simbolNativ ?? 'ETH', decimals: 18 },
			rpcUrls: { default: { http: [cfg.rpcUrl] } }
		});

		this.publicClient = createPublicClient({ chain, transport: http(cfg.rpcUrl) }) as PublicClient;
		this.walletClient = createWalletClient({ account: this.akun, chain, transport: http(cfg.rpcUrl) });
	}

	/**
	 * Mengirim transaksi lalu menunggu konfirmasi.
	 * Idempotensi ditegakkan oleh kontrak: `idBatch` yang sudah ada ditolak,
	 * sehingga percobaan ulang tidak menghasilkan penerbitan ganda
	 * (plan.md 15.5).
	 */
	private async kirim(namaFungsi: 'terbitkanBatch' | 'cabut', args: readonly unknown[]) {
		const { request } = await this.publicClient.simulateContract({
			address: this.alamatKontrak,
			abi: ABI_REGISTRI,
			functionName: namaFungsi,
			args: args as never,
			account: this.akun
		});

		const txHash = await this.walletClient.writeContract(request as never);
		const struk = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

		const hargaGas = struk.effectiveGasPrice ?? 0n;
		return {
			txHash,
			nomorBlok: struk.blockNumber,
			gasTerpakai: struk.gasUsed,
			hargaGas,
			biayaWei: struk.gasUsed * hargaGas
		} satisfies HasilAnchor;
	}

	terbitkanBatch(idBatchOnchain: Hex, root: Hex, namaKegiatan: string, jumlah: number) {
		return this.kirim('terbitkanBatch', [idBatchOnchain, root, namaKegiatan, BigInt(jumlah)]);
	}

	cabut(daun: Hex, alasan: string) {
		return this.kirim('cabut', [daun, alasan]);
	}

	async bacaRoot(idBatchOnchain: Hex): Promise<Hex | null> {
		const root = (await this.publicClient.readContract({
			address: this.alamatKontrak,
			abi: ABI_REGISTRI,
			functionName: 'rootBatch',
			args: [idBatchOnchain]
		})) as Hex;
		return /^0x0+$/.test(root) ? null : root;
	}

	async cekDicabut(daun: Hex): Promise<boolean> {
		return (await this.publicClient.readContract({
			address: this.alamatKontrak,
			abi: ABI_REGISTRI,
			functionName: 'dicabut',
			args: [daun]
		})) as boolean;
	}

	async verifikasi(idBatchOnchain: Hex, daun: Hex, bukti: Hex[]): Promise<StatusVerifikasi> {
		const [sah, adaBatch, sudahCabut] = (await this.publicClient.readContract({
			address: this.alamatKontrak,
			abi: ABI_REGISTRI,
			functionName: 'verifikasiRinci',
			args: [idBatchOnchain, daun, bukti]
		})) as [boolean, boolean, boolean];
		return { sah, adaBatch, sudahCabut };
	}

	async saldo(): Promise<bigint> {
		return this.publicClient.getBalance({ address: this.akun.address });
	}
}
