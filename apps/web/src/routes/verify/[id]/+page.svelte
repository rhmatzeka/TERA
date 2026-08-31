<script lang="ts">
	import { createPublicClient, defineChain, http, keccak256, toBytes, type Hex } from 'viem';
	import { verifikasiBuktiDaun, hitungDaun } from '$lib/merkle';
	import Hash from '$lib/components/Hash.svelte';

	let { data } = $props();
	const sert = $derived(data.sert);
	const batch = $derived(data.batch);
	const jaringan = $derived(data.jaringan);

	type Hasil = 'sah' | 'dicabut' | 'palsu' | 'galat' | null;
	let hasil = $state<Hasil>(null);
	let sedangJalan = $state(false);
	let pesanGalat = $state('');
	let langkah = $state<{ judul: string; detail: string; status: 'proses' | 'ok' | 'gagal' }[]>([]);
	let bukaTeknis = $state(false);

	// Uji manipulasi — hanya muncul di panel teknis
	let dokumenEdit = $state(data.sert.dokumenKanonik);
	const sudahDiubah = $derived(dokumenEdit !== sert.dokumenKanonik);

	const abi = [
		{ type: 'function', name: 'rootBatch', stateMutability: 'view',
		  inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bytes32' }] },
		{ type: 'function', name: 'dicabut', stateMutability: 'view',
		  inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bool' }] }
	] as const;

	function tambah(judul: string) {
		langkah = [...langkah, { judul, detail: '', status: 'proses' }];
		return langkah.length - 1;
	}
	function tutup(i: number, status: 'ok' | 'gagal', detail: string) {
		langkah[i] = { ...langkah[i], status, detail };
		langkah = [...langkah];
	}
	const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

	async function periksa() {
		sedangJalan = true;
		hasil = null;
		pesanGalat = '';
		langkah = [];

		try {
			const chain = defineChain({
				id: jaringan.chainId, name: jaringan.nama,
				nativeCurrency: { name: 'Token', symbol: 'TOKEN', decimals: 18 },
				rpcUrls: { default: { http: [jaringan.rpcUrl] } }
			});
			const client = createPublicClient({ chain, transport: http(jaringan.rpcUrl) });

			let i = tambah('Membaca isi sertifikat');
			await jeda(220);
			const hashDok = keccak256(toBytes(dokumenEdit)) as Hex;
			const daun = hitungDaun(hashDok);
			tutup(i, 'ok', 'Sidik jari digital sertifikat berhasil dihitung');

			i = tambah('Menghubungi catatan resmi di blockchain');
			const root = (await client.readContract({
				address: jaringan.kontrak, abi, functionName: 'rootBatch', args: [batch.idOnchain]
			})) as Hex;
			if (/^0x0+$/.test(root)) {
				tutup(i, 'gagal', 'Catatan penerbitan tidak ditemukan');
				hasil = 'palsu';
				return;
			}
			tutup(i, 'ok', `Catatan ditemukan di jaringan ${jaringan.nama}`);

			i = tambah('Mencocokkan sertifikat dengan catatan');
			await jeda(220);
			const cocok = verifikasiBuktiDaun(root, daun, sert.bukti as Hex[]);
			tutup(i, cocok ? 'ok' : 'gagal',
				cocok ? 'Isi sertifikat sama persis dengan yang dicatat' : 'Isi sertifikat TIDAK sama dengan yang dicatat');
			if (!cocok) { hasil = 'palsu'; return; }

			i = tambah('Memeriksa apakah sertifikat ditarik penerbit');
			const ditarik = (await client.readContract({
				address: jaringan.kontrak, abi, functionName: 'dicabut', args: [daun]
			})) as boolean;
			tutup(i, ditarik ? 'gagal' : 'ok', ditarik ? 'Sertifikat telah ditarik' : 'Masih berlaku');

			hasil = ditarik ? 'dicabut' : 'sah';
		} catch (e) {
			hasil = 'galat';
			pesanGalat = e instanceof Error ? e.message : String(e);
		} finally {
			sedangJalan = false;
		}
	}

	function ubahNama() {
		dokumenEdit = dokumenEdit.replace(/"nama":"[^"]*"/, '"nama":"Penyusup Budiman"');
	}
	function kembalikan() {
		dokumenEdit = sert.dokumenKanonik;
		langkah = [];
		hasil = null;
	}
</script>

<a href="/" class="balik">← Beranda</a>

<!-- Status ringkas: bahasa sehari-hari, tanpa istilah teknis -->
<div class="status {data.dicabut ? 'ditarik' : 'berlaku'}">
	<span class="ikon">{data.dicabut ? '⚠' : '✓'}</span>
	<div>
		<strong>{data.dicabut ? 'Sertifikat ini sudah ditarik' : 'Sertifikat ini asli'}</strong>
		<span>
			{data.dicabut
				? 'Dokumennya memang benar diterbitkan, tetapi penerbit telah menariknya kembali.'
				: `Diterbitkan resmi oleh ${batch.namaPenerbit} dan tercatat permanen. Isinya tidak dapat diubah tanpa ketahuan.`}
		</span>
	</div>
</div>

<div class="pratinjau">
	<div class="bingkai" class:ditarik={data.dicabut}>
		<iframe src="/sertifikat/{sert.id}/pdf#toolbar=0&navpanes=0&view=FitH"
			title="Sertifikat {sert.nama}"></iframe>
	</div>
	<div class="bawah">
		<div class="ringkas">
			<strong>{sert.nama}</strong>
			<span>{batch.namaKegiatan}</span>
			<span class="mini">{data.peran} · {batch.tanggalKegiatan} · {batch.penyelenggara}</span>
		</div>
		<div class="tombol-baris">
			<a class="tombol" href="/sertifikat/{sert.id}/pdf?unduh" download>Unduh PDF</a>
			<a class="tombol sekunder" href="/sertifikat/{sert.id}/pdf" target="_blank" rel="noopener">Buka</a>
		</div>
	</div>
</div>

<!-- Pemeriksaan mandiri, dijelaskan tanpa jargon -->
<section class="kartu">
	<div class="kepala">
		<div>
			<h2>Periksa sendiri keasliannya</h2>
			<p class="kecil">
				Pemeriksaan dijalankan di perangkat Anda dan membaca langsung ke catatan
				resmi, bukan ke server penerbit. Jadi Anda tidak perlu percaya begitu saja
				pada situs ini.
			</p>
		</div>
		<button onclick={periksa} disabled={sedangJalan}>
			{sedangJalan ? 'Memeriksa…' : 'Periksa sekarang'}
		</button>
	</div>

	{#if langkah.length}
		<ol class="langkah">
			{#each langkah as l}
				<li class={l.status}>
					<span class="tanda">{l.status === 'ok' ? '✓' : l.status === 'gagal' ? '✕' : '·'}</span>
					<div>
						<span class="judul">{l.judul}</span>
						{#if l.detail}<span class="detail">{l.detail}</span>{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}

	{#if hasil}
		<div class="vonis {hasil}">
			{#if hasil === 'sah'}
				<strong>Terbukti asli</strong>
				<span>Sertifikat ini cocok dengan catatan resmi dan masih berlaku.</span>
			{:else if hasil === 'dicabut'}
				<strong>Asli, tetapi sudah ditarik</strong>
				<span>Dokumennya benar, namun penerbit telah menariknya kembali.</span>
			{:else if hasil === 'palsu'}
				<strong>Tidak cocok dengan catatan resmi</strong>
				<span>Isi dokumen berbeda dari yang diterbitkan — kemungkinan telah diubah.</span>
			{:else}
				<strong>Tidak dapat terhubung</strong>
				<span>{pesanGalat}</span>
			{/if}
		</div>
	{/if}
</section>

<section class="kartu ringkas-info">
	<h2>Keterangan sertifikat</h2>
	<dl>
		<dt>Nama penerima</dt><dd>{sert.nama}</dd>
		<dt>Peran</dt><dd>{data.peran}</dd>
		<dt>Nomor identitas</dt><dd>{data.nomorIdentitas}</dd>
		<dt>Kegiatan</dt><dd>{batch.namaKegiatan}</dd>
		<dt>Tanggal</dt><dd>{batch.tanggalKegiatan}</dd>
		<dt>Penyelenggara</dt><dd>{batch.penyelenggara}</dd>
		<dt>Diterbitkan oleh</dt><dd>{batch.namaPenerbit}</dd>
		<dt>Nomor sertifikat</dt><dd class="mono">{sert.id}</dd>
	</dl>
</section>

<!-- Semua istilah teknis disembunyikan di sini -->
<details class="teknis" bind:open={bukaTeknis}>
	<summary>
		<span>Rincian teknis</span>
		<span class="mini">untuk pemeriksa lanjutan — hash, bukti kriptografis, dan data blockchain</span>
	</summary>

	<div class="isi-teknis">
		<dl>
			<dt>Jaringan</dt><dd>{jaringan.nama} · chainId {jaringan.chainId}</dd>
			<dt>Kontrak</dt>
			<dd><Hash nilai={jaringan.kontrak} jenis="alamat" chainId={jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Transaksi penerbitan</dt>
			<dd><Hash nilai={batch.txHash} jenis="tx" chainId={jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Blok</dt>
			<dd><Hash nilai={batch.nomorBlok} jenis="blok" chainId={jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Penerbit</dt>
			<dd><Hash nilai={batch.alamatPenerbit} jenis="alamat" chainId={jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Hash dokumen</dt><dd><Hash nilai={sert.hashDokumen} chainId={jaringan.chainId} /></dd>
			<dt>Daun Merkle</dt><dd><Hash nilai={sert.daun} chainId={jaringan.chainId} /></dd>
			<dt>Merkle root</dt><dd><Hash nilai={batch.root} chainId={jaringan.chainId} /></dd>
			<dt>Bukti Merkle</dt><dd>{sert.bukti.length} hash ({sert.bukti.length * 32} byte)</dd>
		</dl>

		<h3>Uji anti-manipulasi</h3>
		<p class="kecil">
			Ubah satu huruf pada dokumen di bawah lalu tekan <strong>Periksa sekarang</strong>
			di atas. Hasilnya akan berubah menjadi tidak cocok — inilah yang membuat
			sertifikat tidak dapat dipalsukan.
		</p>
		<div class="tombol-baris">
			<button class="mini-btn" onclick={ubahNama}>Coba ubah nama</button>
			<button class="mini-btn sekunder" onclick={kembalikan} disabled={!sudahDiubah}>Kembalikan</button>
		</div>
		<textarea bind:value={dokumenEdit} spellcheck="false" rows="6"></textarea>
		{#if sudahDiubah}
			<p class="peringatan">Dokumen sudah diubah — tekan "Periksa sekarang" di atas untuk melihat hasilnya.</p>
		{/if}
	</div>
</details>

<style>
	.balik { display: inline-block; margin-bottom: 14px; font-size: 13px; color: var(--redup); text-decoration: none; }

	.status {
		display: flex; gap: 14px; align-items: flex-start; border: 1px solid;
		border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
	}
	.status .ikon {
		flex: 0 0 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
		font-size: 17px; background: currentColor;
	}
	.status .ikon::before { content: ''; }
	.status strong { display: block; font-size: 17px; margin-bottom: 2px; }
	.status span:last-child { font-size: 13.5px; line-height: 1.55; }
	.status.berlaku { background: var(--ok-bg); color: var(--ok-tx); border-color: var(--ok-garis); }
	.status.ditarik { background: var(--warn-bg); color: var(--warn-tx); border-color: var(--warn-garis); }
	.status .ikon { background: color-mix(in srgb, currentColor 18%, transparent); }

	.pratinjau { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; overflow: hidden; margin-bottom: 18px; }
	.bingkai { background: #e9ebef; padding: 14px; }
	.bingkai.ditarik { background: #f3e6d4; }
	.bingkai iframe {
		display: block; width: 100%; aspect-ratio: 842 / 595; border: 0; border-radius: 6px;
		background: #fff; box-shadow: 0 3px 14px rgba(0, 0, 0, 0.18);
	}
	.bawah { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 18px; border-top: 1px solid var(--garis); flex-wrap: wrap; }
	.ringkas { display: flex; flex-direction: column; gap: 1px; }
	.ringkas strong { font-size: 16px; }
	.ringkas span { font-size: 13px; color: var(--redup); }
	.mini { font-size: 11.5px; color: var(--redup); }

	.tombol-baris { display: flex; gap: 8px; flex-wrap: wrap; }
	.tombol { background: var(--aksen); color: #fff; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 550; text-decoration: none; white-space: nowrap; }
	.tombol.sekunder { background: transparent; color: var(--tx); border: 1px solid var(--garis); }

	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
	.kepala { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
	h2 { font-size: 16px; margin: 0 0 5px; }
	h3 { font-size: 13.5px; margin: 22px 0 6px; }
	.kecil { font-size: 13px; color: var(--redup); margin: 0; max-width: 56ch; line-height: 1.55; }

	button {
		background: var(--aksen); color: #fff; border: 0; border-radius: 8px;
		padding: 10px 18px; font-size: 13.5px; font-weight: 550; cursor: pointer; white-space: nowrap;
	}
	button:disabled { opacity: 0.5; cursor: default; }
	.mini-btn { padding: 6px 12px; font-size: 12.5px; }
	.mini-btn.sekunder { background: transparent; color: var(--tx); border: 1px solid var(--garis); }

	.langkah { list-style: none; margin: 18px 0 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
	.langkah li { display: flex; gap: 11px; align-items: flex-start; font-size: 13.5px; }
	.tanda {
		flex: 0 0 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
		font-size: 11px; background: var(--garis); color: var(--redup); margin-top: 1px;
	}
	.langkah li.ok .tanda { background: var(--ok-bg); color: var(--ok-tx); }
	.langkah li.gagal .tanda { background: var(--bad-bg); color: var(--bad-tx); }
	.judul { display: block; }
	.detail { display: block; color: var(--redup); font-size: 12px; }

	.vonis { margin-top: 18px; border-radius: 10px; padding: 14px 16px; border: 1px solid; display: flex; flex-direction: column; gap: 2px; }
	.vonis strong { font-size: 14.5px; }
	.vonis span { font-size: 13px; }
	.vonis.sah { background: var(--ok-bg); color: var(--ok-tx); border-color: var(--ok-garis); }
	.vonis.dicabut, .vonis.galat { background: var(--warn-bg); color: var(--warn-tx); border-color: var(--warn-garis); }
	.vonis.palsu { background: var(--bad-bg); color: var(--bad-tx); border-color: var(--bad-garis); }

	.ringkas-info dl { display: grid; grid-template-columns: minmax(130px, 175px) 1fr; gap: 8px 20px; margin: 0; font-size: 13.5px; }
	dt { color: var(--redup); }
	dd { margin: 0; overflow-wrap: anywhere; }
	.mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; }

	.teknis { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; overflow: hidden; }
	summary { padding: 15px 20px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; font-size: 14px; font-weight: 550; }
	summary::marker { color: var(--redup); }
	summary .mini { font-weight: 400; }
	.isi-teknis { padding: 0 20px 20px; border-top: 1px solid var(--garis); padding-top: 16px; }
	.isi-teknis dl { display: grid; grid-template-columns: minmax(120px, 165px) 1fr; gap: 7px 18px; margin: 0; font-size: 12.5px; }
	textarea {
		width: 100%; margin-top: 10px; border: 1px solid var(--garis); border-radius: 8px; padding: 11px;
		background: var(--bg); color: var(--tx); font-size: 11px; resize: vertical;
		font-family: ui-monospace, Menlo, monospace; line-height: 1.5;
	}
	.peringatan { margin: 10px 0 0; font-size: 12.5px; padding: 9px 12px; border-radius: 8px; background: var(--warn-bg); color: var(--warn-tx); border: 1px solid var(--warn-garis); }

	@media (max-width: 620px) {
		.ringkas-info dl, .isi-teknis dl { grid-template-columns: 1fr; gap: 2px 0; }
		dt { margin-top: 8px; }
		.kepala { flex-direction: column; }
	}
</style>
