/**
 * Lapisan pembacaan untuk halaman publik.
 * Sekarang menjadi pembungkus tipis di atas `toko.ts` yang menangani
 * banyak batch. Dipertahankan agar halaman lama tidak perlu diubah total.
 */
import { batchTerakhirTerbit, cariSertifikatGlobal, type BerkasBatch, type SertifikatData } from './toko';

export type { BerkasBatch, SertifikatData };

export async function muatBatch(): Promise<BerkasBatch | null> {
	return batchTerakhirTerbit();
}

export async function cariSertifikat(id: string): Promise<SertifikatData | null> {
	return (await cariSertifikatGlobal(id))?.sert ?? null;
}
