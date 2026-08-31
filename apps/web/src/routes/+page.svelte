<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	let { data } = $props();
	let q = $state(data.kueri);
</script>

<section class="hero">
	<h1>Pastikan sertifikat itu asli</h1>
	<p>
		Masukkan nomor sertifikat atau nama penerima. Keasliannya diperiksa langsung
		ke catatan permanen yang tidak dapat diubah siapa pun — termasuk oleh penerbitnya.
	</p>

	<form class="pencarian">
		<input name="q" bind:value={q} placeholder="Masukkan ID sertifikat atau nama penerima" />
		<button type="submit">Cari</button>
	</form>
</section>

{#if data.kueri && data.hasil.length === 0}
	<div class="kabar">Tidak ditemukan sertifikat untuk <strong>{data.kueri}</strong>.</div>
{/if}

{#if data.hasil.length}
	<ul class="hasil">
		{#each data.hasil as s (s.id)}
			<li>
				<a href="/verify/{s.id}">
					<span class="nama">{s.nama}</span>
					<span class="id">{s.id}</span>
					<span class="panah">→</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

{#if !data.ada}
	<section class="ringkas kosong">
		<h2>Belum ada sertifikat yang diterbitkan</h2>
		<p class="kosong-teks">
			Sistem ini siap dipakai. Penyelenggara dapat masuk lalu membuat kegiatan
			pertama dan mengunggah daftar pesertanya.
		</p>
		<a class="tautan-lanjut" href="/masuk">Masuk sebagai penyelenggara →</a>
	</section>
{:else}
	<section class="ringkas">
		<h2>Penerbitan terbaru</h2>
		<div class="grid">
			<div>
				<span class="label">Kegiatan</span>
				<span class="nilai">{data.batch.namaKegiatan}</span>
			</div>
			<div>
				<span class="label">Sertifikat terbit</span>
				<span class="nilai">{data.batch.jumlah.toLocaleString('id-ID')}</span>
			</div>
			<div>
				<span class="label">Data pribadi tercatat</span>
				<span class="nilai">Tidak ada</span>
			</div>
		</div>
		<dl>
			<dt>Nomor pencatatan</dt>
			<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId} /></dd>
			<dt>Kontrak</dt>
			<dd><Hash nilai={data.jaringan.kontrak} jenis="alamat" chainId={data.jaringan.chainId} /></dd>
		</dl>
		<a class="tautan-lanjut" href="/onchain">Lihat catatan lengkapnya →</a>
	</section>
{/if}

<style>
	.hero { text-align: center; padding: 22px 0 30px; }
	h1 { font-size: 30px; line-height: 1.25; letter-spacing: -0.025em; margin: 0 auto 12px; max-width: 18ch; }
	.hero p { color: var(--redup); font-size: 14.5px; max-width: 56ch; margin: 0 auto 24px; }
	.pencarian { display: flex; gap: 8px; max-width: 520px; margin: 0 auto; }
	.pencarian input {
		flex: 1; padding: 11px 14px; border: 1px solid var(--garis); border-radius: 9px;
		background: var(--kartu); color: var(--tx); font-size: 14px;
	}
	button {
		background: var(--aksen); color: #fff; border: 0; border-radius: 9px;
		padding: 11px 20px; font-size: 14px; font-weight: 550; cursor: pointer;
	}
	.hasil { list-style: none; margin: 22px 0 0; padding: 0; border: 1px solid var(--garis); border-radius: 10px; overflow: hidden; }
	.hasil li + li { border-top: 1px solid var(--garis); }
	.hasil a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--kartu); color: var(--tx); text-decoration: none; font-size: 13.5px; }
	.hasil a:hover { background: color-mix(in srgb, var(--aksen) 7%, var(--kartu)); }
	.nama { font-weight: 550; min-width: 150px; }
	.id { color: var(--redup); flex: 1; font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
	.panah { color: var(--redup); }

	.ringkas { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; padding: 22px; margin-top: 32px; }
	h2 { font-size: 15px; margin: 0 0 16px; }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px; }
	.label { display: block; font-size: 11.5px; color: var(--redup); }
	.nilai { display: block; font-size: 15px; font-weight: 600; margin-top: 2px; }
	dl { display: grid; grid-template-columns: minmax(120px, 160px) 1fr; gap: 7px 18px; margin: 0 0 16px; font-size: 13px; border-top: 1px solid var(--garis); padding-top: 16px; }
	dt { color: var(--redup); }
	dd { margin: 0; min-width: 0; }
	.tautan-lanjut { font-size: 13px; color: var(--aksen); text-decoration: none; }
	.kabar { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 14px 16px; font-size: 13.5px; color: var(--redup); margin-top: 20px; }
	.ringkas.kosong { border-style: dashed; text-align: center; }
	.kosong-teks { color: var(--redup); font-size: 13.5px; margin: 0 0 14px; max-width: 52ch; margin-inline: auto; }
	@media (max-width: 620px) {
		h1 { font-size: 24px; }
		dl { grid-template-columns: 1fr; gap: 2px 0; }
		dt { margin-top: 8px; }
	}
</style>
