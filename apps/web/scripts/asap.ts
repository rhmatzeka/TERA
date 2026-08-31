/**
 * Uji asap ala peramban.
 *
 * Berbeda dari curl biasa yang hanya menguji SSR, skrip ini juga MENGAMBIL
 * setiap modul JavaScript yang dirujuk halaman — persis seperti yang
 * dilakukan peramban. Tanpa langkah itu, galat bundel klien (misalnya
 * mengimpor $lib/server/* dari komponen) lolos dari pengujian meski
 * halaman tampak HTTP 200.
 */
const BASIS = process.env.BASIS ?? 'http://localhost:5173';

const HALAMAN = [
	{ jalur: '/', nama: 'Beranda publik' },
	{ jalur: '/masuk', nama: 'Halaman masuk' },
	{ jalur: '/onchain', nama: 'Bukti on-chain' }
];

let gagal = 0;

async function ambilModulKlien(html: string): Promise<string[]> {
	const url = new Set<string>();
	for (const m of html.matchAll(/(?:src|href)="(\/(?:@|\.svelte-kit|src|node_modules)[^"]+\.js)"/g)) {
		url.add(m[1]);
	}
	for (const m of html.matchAll(/import\(["'](\/[^"']+\.js)["']\)/g)) url.add(m[1]);
	return [...url];
}

async function uji(jalur: string, nama: string, cookie?: string) {
	const res = await fetch(BASIS + jalur, {
		headers: cookie ? { cookie } : {},
		redirect: 'manual'
	});
	const html = res.status === 200 ? await res.text() : '';

	if (res.status !== 200) {
		console.log(`  ✕ ${nama.padEnd(24)} HTTP ${res.status}`);
		gagal++;
		return;
	}

	const modul = await ambilModulKlien(html);
	let modulGagal = 0;
	for (const m of modul) {
		const r = await fetch(BASIS + m);
		const isi = await r.text();
		if (!r.ok || isi.includes('impossible situation') || isi.includes('Cannot import')) {
			console.log(`      ↳ modul gagal: ${m} (HTTP ${r.status})`);
			modulGagal++;
		}
	}

	if (modulGagal) {
		console.log(`  ✕ ${nama.padEnd(24)} HTML ok, ${modulGagal} modul klien GAGAL`);
		gagal++;
	} else {
		console.log(`  ✓ ${nama.padEnd(24)} HTML ok, ${modul.length} modul klien ok`);
	}
}

async function masuk(email: string, sandi: string): Promise<string | null> {
	const res = await fetch(`${BASIS}/masuk`, {
		method: 'POST',
		body: new URLSearchParams({ email, sandi }),
		redirect: 'manual'
	});
	const set = res.headers.get('set-cookie');
	return set ? set.split(';')[0] : null;
}

console.log('\n=== Uji asap ala peramban ===\n');
console.log('Publik:');
for (const h of HALAMAN) await uji(h.jalur, h.nama);

const ck1 = await masuk('dekan@kampus.ac.id', 'dekan123');
console.log('\nStaf (penandatangan):');
if (ck1) {
	await uji('/admin', 'Ringkasan admin', ck1);
	await uji('/admin/sertifikat', 'Kelola sertifikat', ck1);
} else { console.log('  ✕ gagal masuk'); gagal++; }

// Ambil satu sertifikat dari batch mana pun di toko — surel peserta
// diambil dari data yang benar-benar ada, bukan ditulis tetap di skrip.
const { readdir } = await import('node:fs/promises');
const berkas = (await readdir('data/batch').catch(() => [])).filter((f) => f.endsWith('.json'));
if (berkas.length === 0) {
	console.log('\n(tidak ada batch — lewati uji peserta dan verifikasi)\n');
	process.exit(gagal === 0 ? 0 : 1);
}
const d = JSON.parse(await Bun.file(`data/batch/${berkas[0]}`).text());
const surelPeserta = JSON.parse(d.sertifikat[0].dokumenKanonik).credentialSubject.email;

const ck2 = await masuk(surelPeserta, 'peserta123');
console.log('\nPeserta:');
if (ck2) {
	await uji('/portal', `Portal peserta (${surelPeserta})`, ck2);
} else { console.log('  ✕ gagal masuk'); gagal++; }

console.log('\nVerifikasi publik:');
await uji(`/verify/${d.sertifikat[0].id}`, 'Halaman verifikasi');
await uji('/explorer', 'Explorer bawaan');
await uji(`/explorer/tx/${d.batch.txHash}`, 'Explorer — transaksi');
await uji(`/explorer/address/${d.jaringan.kontrak}`, 'Explorer — kontrak');

console.log('\nAlur penerbitan (staf):');
if (ck1) {
	await uji('/admin/kegiatan', 'Daftar kegiatan', ck1);
	await uji('/admin/kegiatan/baru', 'Form kegiatan baru', ck1);
	await uji(`/admin/kegiatan/${d.batch.uuid}`, 'Detail kegiatan', ck1);
	await uji('/admin/desain', 'Desain sertifikat', ck1);
}

console.log(gagal === 0 ? '\nSEMUA LOLOS\n' : `\n${gagal} GAGAL\n`);
process.exit(gagal === 0 ? 0 : 1);
