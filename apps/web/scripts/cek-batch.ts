/** Memverifikasi seluruh sertifikat satu batch terhadap blockchain. */
import { createPublicClient, defineChain, http, keccak256, toBytes, type Hex } from 'viem';
import { verifikasiBuktiDaun, hitungDaun } from '../src/lib/merkle';

const d = JSON.parse(await Bun.file(`data/batch/${process.argv[2]}.json`).text());
const abi = [
	{ type: 'function', name: 'rootBatch', stateMutability: 'view', inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bytes32' }] }
] as const;
const chain = defineChain({ id: d.jaringan.chainId, name: d.jaringan.nama, nativeCurrency: { name: 'E', symbol: 'E', decimals: 18 }, rpcUrls: { default: { http: [d.jaringan.rpcUrl] } } });
const c = createPublicClient({ chain, transport: http(d.jaringan.rpcUrl) });

const root = (await c.readContract({ address: d.jaringan.kontrak, abi, functionName: 'rootBatch', args: [d.batch.idOnchain] })) as Hex;
console.log(`  root on-chain cocok: ${root.toLowerCase() === d.batch.root.toLowerCase()}\n`);
for (const s of d.sertifikat) {
	const daun = hitungDaun(keccak256(toBytes(s.dokumenKanonik)) as Hex);
	const sub = JSON.parse(s.dokumenKanonik).credentialSubject;
	console.log(`  ${verifikasiBuktiDaun(root, daun, s.bukti) ? '✓' : '✗'} ${s.nama.padEnd(20)} ${String(sub.peran).padEnd(9)} ${sub.nomorIdentitas ?? '-'}`);
}
