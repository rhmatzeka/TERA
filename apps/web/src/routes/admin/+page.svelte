<script lang="ts">
	import { formatBiaya } from '$lib/biaya';
	import Hash from '$lib/components/Hash.svelte';
	let { data } = $props();


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
		<div class="kabar bahaya">
			<strong>Tidak terhubung ke blockchain.</strong>
			Status pencabutan dan saldo tidak dapat dibaca. Pastikan node di
			{data.jaringan.rpcUrl} berjalan.
		</div>
	{/if}
	{#if data.saldoRendah}
		<div class="kabar awas">
			<strong>Saldo wallet penerbitan menipis.</strong>
			Penerbitan berikutnya dapat gagal. Isi ulang sebelum kegiatan berikutnya.
		</div>
	{/if}
	{#if !data.adaKunci}
		<div class="kabar awas">
			<strong>KUNCI_TX belum diatur.</strong> Mode baca-saja — transaksi tidak dapat dikirim.
		</div>
	{/if}

	<div class="kisi-stat">
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
			<span class="angka">{formatBiaya(data.batch.biayaWei, data.kurs)}</span>
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
			<dt>Status</dt><dd><span class="pil sah">terbit</span></dd>
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
	h1 { font-size: 23px; margin: 0 0 4px;
	}
	h2 { font-size: 15px; margin: 0 0 12px;
	}
	.sub { color: var(--redup); font-size: 13.5px; margin: 0 0 22px;
	}
	.statistik { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 12px; margin-bottom: 18px;
	}
	.stat { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 14px 16px;
	}
	.stat.waspada { border-color: var(--warn-garis); background: var(--warn-bg);
	}
	.angka { display: block; font-size: 20px; font-weight: 640; letter-spacing: -0.02em;
	}
	.label { display: block; font-size: 11.5px; color: var(--redup); margin-top: 2px;
	}
	.catatan { font-size: 12px; color: var(--redup); margin: 16px 0 0;
	}
	.mulai { background: var(--kartu); border: 1px dashed var(--garis); border-radius: 12px; padding: 34px; text-align: center;
	}
	.mulai h2 { font-size: 17px; margin: 0 0 8px;
	}
	.mulai p { color: var(--redup); font-size: 13.5px; margin: 0 auto 18px; max-width: 48ch;
	}
	code { font-family: ui-monospace, Menlo, monospace; font-size: 12px;
	}
</style>

