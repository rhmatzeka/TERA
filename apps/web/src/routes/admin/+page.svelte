<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	let { data } = $props();

	const rupiah = (wei: string) =>
		`Rp ${((Number(BigInt(wei)) / 1e18) * 50_000_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
</script>

<h1>Ringkasan</h1>
<p class="sub">Pemantauan batch, biaya, dan kesehatan sistem.</p>

{#if !data.ada}
	<div class="mulai">
		<h2>Belum ada batch penerbitan</h2>
		<p>
			Mulai dengan membuat kegiatan pertama. Siapkan berkas CSV berisi daftar
			peserta — minimal kolom <code>nama</code> dan <code>email</code>.
		</p>
		<a class="tombol" href="/admin/kegiatan/baru">+ Buat Kegiatan Pertama</a>
	</div>
{:else}
	{#if !data.rantaiHidup}
		<div class="kabar bad">
			<strong>Tidak terhubung ke blockchain.</strong>
			Status pencabutan dan saldo tidak dapat dibaca. Pastikan node di
			{data.jaringan.rpcUrl} berjalan.
		</div>
	{/if}
	{#if data.saldoRendah}
		<div class="kabar warn">
			<strong>Saldo wallet penerbitan menipis.</strong>
			Penerbitan berikutnya dapat gagal. Isi ulang sebelum kegiatan berikutnya.
		</div>
	{/if}
	{#if !data.adaKunci}
		<div class="kabar warn">
			<strong>KUNCI_TX belum diatur.</strong> Mode baca-saja — transaksi tidak dapat dikirim.
		</div>
	{/if}

	<div class="statistik">
		<div class="stat">
			<span class="angka">{data.batch.jumlah.toLocaleString('id-ID')}</span>
			<span class="label">sertifikat aktif</span>
		</div>
		<div class="stat">
			<span class="angka">{data.jumlahDicabut}</span>
			<span class="label">dicabut</span>
		</div>
		<div class="stat">
			<span class="angka">1</span>
			<span class="label">transaksi blockchain</span>
		</div>
		<div class="stat">
			<span class="angka">{rupiah(data.batch.biayaWei)}</span>
			<span class="label">biaya batch</span>
		</div>
		<div class="stat {data.saldoRendah ? 'waspada' : ''}">
			<span class="angka">{data.saldo ? Number(data.saldo).toFixed(4) : '—'}</span>
			<span class="label">saldo wallet</span>
		</div>
	</div>

	<section class="kartu">
		<h2>Batch aktif</h2>
		<dl>
			<dt>Kegiatan</dt><dd>{data.batch.namaKegiatan}</dd>
			<dt>Tanggal</dt><dd>{data.batch.tanggalKegiatan}</dd>
			<dt>Penyelenggara</dt><dd>{data.batch.penyelenggara}</dd>
			<dt>Status</dt><dd><span class="pil ok">terbit</span></dd>
			<dt>Merkle root</dt>
			<dd><Hash nilai={data.batch.root} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>ID batch on-chain</dt>
			<dd><Hash nilai={data.batch.idOnchain} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Transaksi</dt>
			<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Blok</dt>
			<dd><Hash nilai={data.batch.nomorBlok} jenis="blok" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Kontrak</dt>
			<dd><Hash nilai={data.jaringan.kontrak} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Penerbit sah</dt>
			<dd><Hash nilai={data.batch.alamatPenerbit} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Gas penerbitan</dt><dd>{data.batch.gasTerpakai.toLocaleString('id-ID')}</dd>
		</dl>
		<p class="catatan">
			Satu transaksi untuk {data.batch.jumlah.toLocaleString('id-ID')} sertifikat —
			menambah peserta tidak menambah biaya.
		</p>
	</section>
{/if}

<style>
	h1 { font-size: 23px; margin: 0 0 4px; }
	h2 { font-size: 15px; margin: 0 0 12px; }
	.sub { color: var(--redup); font-size: 13.5px; margin: 0 0 22px; }
	.statistik { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 12px; margin-bottom: 18px; }
	.stat { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 14px 16px; }
	.stat.waspada { border-color: var(--warn-garis); background: var(--warn-bg); }
	.angka { display: block; font-size: 20px; font-weight: 640; letter-spacing: -0.02em; }
	.label { display: block; font-size: 11.5px; color: var(--redup); margin-top: 2px; }
	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 18px; margin-bottom: 16px; }
	dl { display: grid; grid-template-columns: minmax(120px, 165px) 1fr; gap: 7px 18px; margin: 0; font-size: 13px; }
	dt { color: var(--redup); }
	dd { margin: 0; min-width: 0; }
	.catatan { font-size: 12px; color: var(--redup); margin: 16px 0 0; }
	.pil { font-size: 11px; padding: 2px 9px; border-radius: 999px; }
	.pil.ok { background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-garis); }
	.kabar { border-radius: 10px; padding: 13px 16px; font-size: 13px; margin-bottom: 14px; border: 1px solid var(--garis); background: var(--kartu); }
	.kabar.bad { background: var(--bad-bg); color: var(--bad-tx); border-color: var(--bad-garis); }
	.kabar.warn { background: var(--warn-bg); color: var(--warn-tx); border-color: var(--warn-garis); }
	.mulai { background: var(--kartu); border: 1px dashed var(--garis); border-radius: 12px; padding: 34px; text-align: center; }
	.mulai h2 { font-size: 17px; margin: 0 0 8px; }
	.mulai p { color: var(--redup); font-size: 13.5px; margin: 0 auto 18px; max-width: 48ch; }
	.tombol { background: var(--aksen); color: #fff; border-radius: 8px; padding: 10px 18px; font-size: 13.5px; font-weight: 550; text-decoration: none; display: inline-block; }
	code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
	@media (max-width: 620px) { dl { grid-template-columns: 1fr; gap: 2px 0; } dt { margin-top: 8px; } }
</style>
