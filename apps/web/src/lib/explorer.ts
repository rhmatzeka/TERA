/**
 * Pembentuk tautan block explorer. Isomorfik — dipakai server dan peramban.
 *
 * Jaringan pengembangan lokal (Anvil) tidak punya explorer publik, sehingga
 * fungsi ini mengembalikan null dan komponen Hash beralih ke mode salin.
 * Setelah di-deploy ke testnet/mainnet, tautan muncul otomatis.
 */
export const EXPLORER: Record<number, { nama: string; url: string }> = {
	1: { nama: 'Etherscan', url: 'https://etherscan.io' },
	8453: { nama: 'BaseScan', url: 'https://basescan.org' },
	84532: { nama: 'BaseScan Sepolia', url: 'https://sepolia.basescan.org' },
	137: { nama: 'PolygonScan', url: 'https://polygonscan.com' },
	10143: { nama: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
	11155111: { nama: 'Etherscan Sepolia', url: 'https://sepolia.etherscan.io' }
};

/**
 * `basis` menimpa peta di atas. Dua kegunaan:
 *  - jaringan baru yang belum terdaftar, lewat env EXPLORER_URL
 *  - explorer bawaan aplikasi (nilai relatif seperti "/explorer"), sehingga
 *    hash tetap dapat diklik pada jaringan lokal yang tidak punya explorer publik
 */
export function infoExplorer(chainId: number, basis?: string | null) {
	if (basis) {
		return {
			nama: basis.startsWith('/') ? 'Explorer bawaan' : 'Block Explorer',
			url: basis.replace(/\/$/, '')
		};
	}
	return EXPLORER[chainId] ?? null;
}

export type JenisTautan = 'tx' | 'alamat' | 'blok';

export function tautanExplorer(
	chainId: number,
	jenis: JenisTautan,
	nilai: string | number,
	basis?: string | null
): string | null {
	const info = infoExplorer(chainId, basis);
	if (!info) return null;
	const ruas = jenis === 'tx' ? 'tx' : jenis === 'alamat' ? 'address' : 'block';
	return `${info.url}/${ruas}/${nilai}`;
}
