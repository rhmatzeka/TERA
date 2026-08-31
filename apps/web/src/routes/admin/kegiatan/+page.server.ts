import { daftarBatch } from '$lib/server/toko';

export async function load() {
	return { batch: await daftarBatch() };
}
