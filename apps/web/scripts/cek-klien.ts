/**
 * Menirukan PERSIS logika tombol "Verifikasi sekarang" di peramban,
 * terhadap rantai yang sedang hidup. Dipakai untuk menguji jalur
 * verifikasi sisi klien tanpa membuka browser.
 */
import { createPublicClient, defineChain, http, keccak256, toBytes, type Hex } from 'viem';
import { verifikasiBuktiDaun, hitungDaun } from '../src/lib/merkle';
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('data/batch.json', 'utf-8'));
const abi = [
	{ type: 'function', name: 'rootBatch', stateMutability: 'view', inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bytes32' }] },
	{ type: 'function', name: 'dicabut', stateMutability: 'view', inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bool' }] }
] as const;

const chain = defineChain({
	id: d.jaringan.chainId, name: d.jaringan.nama,
	nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: [d.jaringan.rpcUrl] } }
});
const client = createPublicClient({ chain, transport: http(d.jaringan.rpcUrl) });

async function cek(dokumen: string, bukti: Hex[], label: string) {
	const hashDok = keccak256(toBytes(dokumen)) as Hex;
	const daun = hitungDaun(hashDok);
	const root = (await client.readContract({ address: d.jaringan.kontrak, abi, functionName: 'rootBatch', args: [d.batch.idOnchain] })) as Hex;
	const cocok = verifikasiBuktiDaun(root, daun, bukti);
	const dicabut = (await client.readContract({ address: d.jaringan.kontrak, abi, functionName: 'dicabut', args: [daun] })) as boolean;
	console.log(`${label.padEnd(36)} → ${!cocok ? 'TIDAK SAH (dokumen diubah)' : dicabut ? 'DICABUT' : 'SAH'}`);
}

const asli = d.sertifikat[0];
const cabut = d.sertifikat.find((s: { dicabutLokal: boolean }) => s.dicabutLokal);

console.log('\n=== Simulasi tombol "Verifikasi sekarang" ===');
await cek(asli.dokumenKanonik, asli.bukti, `1. ${asli.nama} (asli)`);
await cek(asli.dokumenKanonik.replace(/"nama":"[^"]*"/, '"nama":"Penyusup Budiman"'), asli.bukti, '2. dokumen dimanipulasi');
await cek(cabut.dokumenKanonik, cabut.bukti, `3. ${cabut.nama} (dicabut)`);
console.log('');
