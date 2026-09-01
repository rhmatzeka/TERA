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

<div class="wadah sempit halaman">

<a href="/" class="balik">← Beranda</a>

<!-- vonis besar, bahasa sehari-hari -->
<div class="vonis-utama {data.dicabut ? 'ditarik' : 'berlaku'}">
	<span class="cap">{data.dicabut ? '!' : '✓'}</span>
	<div>
		<h1 class="vonis-judul">{data.dicabut ? 'Sertifikat ini sudah ditarik' : 'Sertifikat ini asli'}</h1>
		<p class="vonis-teks">
			{data.dicabut
				? 'Dokumennya memang benar diterbitkan, tetapi penerbit telah menariknya kembali.'
				: `Diterbitkan resmi oleh ${batch.namaPenerbit} dan tercatat permanen. Isinya tidak dapat diubah tanpa ketahuan.`}
		</p>
	</div>
</div>

<!-- pratinjau sertifikat -->
<div class="kartu pratinjau">
	<div class="bingkai" class:ditarik={data.dicabut}>
		<iframe src="/sertifikat/{sert.id}/pdf#toolbar=0&navpanes=0&view=FitH"
			title="Sertifikat {sert.nama}"></iframe>
	</div>
	<div class="bawah">
		<div>
			<h2 class="nama-penerima">{sert.nama}</h2>
			<p class="kecil">{batch.namaKegiatan}</p>
			<p class="mungil redup">{data.peran} · {batch.tanggalKegiatan} · {batch.penyelenggara}</p>
		</div>
		<div class="baris g8">
			<a class="tombol" href="/sertifikat/{sert.id}/pdf?unduh" download>Unduh PDF</a>
			<a class="tombol putih" href="/sertifikat/{sert.id}/pdf" target="_blank" rel="noopener">Buka</a>
		</div>
	</div>
</div>

<!-- periksa sendiri -->
<section class="kartu periksa">
	<div class="kepala-periksa">
		<div>
			<span class="label-atas">Tanpa perlu percaya situs ini</span>
			<h2 class="judul-periksa">Periksa sendiri keasliannya</h2>
			<p class="kecil redup">
				Pemeriksaan dijalankan di perangkat Anda dan membaca langsung ke catatan
				resmi, bukan ke server penerbit.
			</p>
		</div>
		<button class="tombol" onclick={periksa} disabled={sedangJalan}>
			{sedangJalan ? 'Memeriksa…' : 'Periksa sekarang'}
		</button>
	</div>

	{#if langkah.length}
		<ol class="langkah">
			{#each langkah as l}
				<li class={l.status}>
					<span class="tanda">{l.status === 'ok' ? '✓' : l.status === 'gagal' ? '✕' : '·'}</span>
					<div>
						<span class="judul-langkah">{l.judul}</span>
						{#if l.detail}<span class="mungil redup">{l.detail}</span>{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}

	{#if hasil}
		<div class="kabar hasil {hasil === 'sah' ? 'sah' : hasil === 'palsu' ? 'bahaya' : 'awas'}">
			<strong>
				{#if hasil === 'sah'}Terbukti asli
				{:else if hasil === 'dicabut'}Asli, tetapi sudah ditarik
				{:else if hasil === 'palsu'}Tidak cocok dengan catatan resmi
				{:else}Tidak dapat terhubung{/if}
			</strong>
			<span class="kecil">
				{#if hasil === 'sah'}Sertifikat ini cocok dengan catatan resmi dan masih berlaku.
				{:else if hasil === 'dicabut'}Dokumennya benar, namun penerbit telah menariknya kembali.
				{:else if hasil === 'palsu'}Isi dokumen berbeda dari yang diterbitkan — kemungkinan telah diubah.
				{:else}{pesanGalat}{/if}
			</span>
		</div>
	{/if}
</section>

<!-- keterangan -->
<section class="kartu">
	<h2 class="judul-bagian">Keterangan sertifikat</h2>
	<dl class="rincian">
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

<!-- rincian teknis, tertutup -->
<details class="kartu teknis" bind:open={bukaTeknis}>
	<summary>
		<span class="judul-bagian">Rincian teknis</span>
		<span class="mungil redup">hash, bukti kriptografis, dan data blockchain</span>
	</summary>

	<div class="isi-teknis">
		<dl class="rincian">
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

		<h3 class="judul-uji">Uji anti-manipulasi</h3>
		<p class="kecil redup">
			Ubah satu huruf pada dokumen di bawah lalu tekan <strong>Periksa sekarang</strong>
			di atas. Hasilnya akan berubah menjadi tidak cocok — inilah yang membuat
			sertifikat tidak dapat dipalsukan.
		</p>
		<div class="baris g8 tombol-uji">
			<button class="tombol mini" onclick={ubahNama}>Coba ubah nama</button>
			<button class="tombol putih mini" onclick={kembalikan} disabled={!sudahDiubah}>Kembalikan</button>
		</div>
		<textarea bind:value={dokumenEdit} spellcheck="false" rows="6"></textarea>
		{#if sudahDiubah}
			<div class="kabar awas peringatan">
				Dokumen sudah diubah — tekan "Periksa sekarang" di atas untuk melihat hasilnya.
			</div>
		{/if}
	</div>
</details>

</div>

<style>
	.halaman { padding-top: 32px; }
	.balik { display: inline-block; margin-bottom: 18px; font-size: 13.5px; font-weight: 600; text-decoration: none; }
	.balik:hover { text-decoration: underline; }

	/* vonis */
	.vonis-utama {
		display: flex;
		gap: 18px;
		align-items: flex-start;
		border: var(--rangka);
		border-radius: var(--lengkung);
		box-shadow: var(--bayang);
		padding: 24px 26px;
		margin-bottom: 20px;
	}
	.vonis-utama.berlaku { background: var(--sah-bg); }
	.vonis-utama.ditarik { background: var(--awas-bg); }
	.cap {
		flex: 0 0 46px;
		height: 46px;
		display: grid;
		place-items: center;
		border: var(--rangka);
		border-radius: 999px;
		background: var(--putih);
		box-shadow: 2px 2px 0 var(--hitam);
		font-size: 22px;
		font-weight: 800;
	}
	.vonis-judul { font-size: clamp(21px, 3.4vw, 30px); margin-bottom: 6px; }
	.vonis-teks { font-size: 14.5px; line-height: 1.55; }

	/* pratinjau */
	.pratinjau { padding: 0; overflow: hidden; margin-bottom: 20px; }
	.bingkai { background: var(--biru); padding: 18px; border-bottom: var(--rangka); }
	.bingkai.ditarik { background: var(--awas-bg); }
	.bingkai iframe {
		display: block;
		width: 100%;
		aspect-ratio: 842 / 595;
		border: var(--rangka);
		border-radius: 6px;
		background: #fff;
		box-shadow: var(--bayang);
	}
	.bawah {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding: 18px 22px;
		flex-wrap: wrap;
	}
	.nama-penerima { font-size: 21px; margin-bottom: 3px; }

	/* periksa */
	.periksa { margin-bottom: 20px; }
	.kepala-periksa {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
	}
	.judul-periksa { font-size: 22px; margin: 6px 0 6px; }
	.kepala-periksa p { max-width: 48ch; }

	.langkah { list-style: none; margin: 22px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
	.langkah li { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; }
	.tanda {
		flex: 0 0 24px;
		height: 24px;
		display: grid;
		place-items: center;
		border: var(--rangka-tipis);
		border-radius: 999px;
		background: var(--abu-muda);
		font-size: 12px;
		font-weight: 800;
	}
	.langkah li.ok .tanda { background: var(--sah-bg); color: var(--sah); }
	.langkah li.gagal .tanda { background: var(--bahaya-bg); color: var(--bahaya); }
	.judul-langkah { display: block; font-weight: 600; }
	.langkah .mungil { display: block; }
	.hasil { margin-top: 20px; display: flex; flex-direction: column; gap: 3px; }
	.hasil strong { font-size: 16px; }

	/* keterangan + teknis */
	.judul-bagian { font-size: 19px; margin-bottom: 16px; }
	.teknis { padding: 0; }
	summary {
		padding: 20px 22px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 3px;
		list-style-position: inside;
	}
	summary .judul-bagian { display: inline; margin: 0; }
	summary::marker { color: var(--abu); }
	.isi-teknis { padding: 4px 22px 24px; border-top: 1.5px solid var(--abu-garis); padding-top: 20px; }
	.judul-uji { margin: 26px 0 8px; }
	.tombol-uji { margin: 14px 0 10px; }
	.isi-teknis textarea { font-family: var(--mono); font-size: 11px; }
	.peringatan { margin-top: 12px; }

	@media (max-width: 620px) {
		.kepala-periksa { flex-direction: column; }
		.vonis-utama { padding: 20px; gap: 14px; }
	}
</style>
