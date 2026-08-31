<script lang="ts">
	let { data } = $props();
</script>

<a class="balik" href="/explorer">← Explorer</a>
<h1>{data.kontrak ? 'Kontrak' : 'Alamat'}</h1>
<p class="hash-besar">{data.alamat}</p>

{#if data.iniRegistri}
	<div class="tanda">RegistriSertifikat — kontrak jangkar sistem ini</div>
{/if}

<section class="kartu">
	<dl>
		<dt>Jenis</dt><dd>{data.kontrak ? 'Kontrak pintar' : 'Akun biasa (EOA)'}</dd>
		<dt>Saldo</dt><dd>{Number(data.saldo).toFixed(6)} ETH</dd>
		<dt>Jumlah transaksi</dt><dd>{data.jumlahTx}</dd>
		{#if data.kontrak}
			<dt>Ukuran bytecode</dt><dd>{data.ukuranKode.toLocaleString('id-ID')} byte</dd>
		{/if}
		<dt>Jaringan</dt><dd>{data.jaringan} · chainId {data.chainId}</dd>
	</dl>
</section>

{#if data.iniRegistri}
	<section class="kartu sorot">
		<h2>Isi storage kontrak</h2>
		<p class="kecil">
			Inilah seluruh data yang benar-benar tersimpan di blockchain untuk
			{data.jumlahSertifikat.toLocaleString('id-ID')} sertifikat.
		</p>
		<dl>
			<dt>Kunci (idBatch)</dt><dd class="mono">{data.idBatch}</dd>
			<dt>Nilai (Merkle root)</dt><dd class="mono">{data.rootBatch}</dd>
			<dt>Ukuran nilai</dt><dd>32 byte</dd>
			<dt>Transaksi penerbitan</dt>
			<dd><a class="mono" href="/explorer/tx/{data.txPenerbitan}">{data.txPenerbitan}</a></dd>
		</dl>
		<p class="kecil catatan">
			Tidak ada nama, nomor identitas, maupun surel di sini — silakan periksa sendiri.
		</p>
	</section>
{/if}

<style>
	.balik { font-size: 12.5px; color: var(--redup); text-decoration: none; }
	h1 { font-size: 21px; margin: 10px 0 4px; }
	h2 { font-size: 14px; margin: 0 0 8px; }
	.hash-besar { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--redup); margin: 0 0 14px; overflow-wrap: anywhere; }
	.tanda { display: inline-block; background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-garis); border-radius: 8px; padding: 6px 12px; font-size: 12.5px; margin-bottom: 14px; }
	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 17px; margin-bottom: 14px; }
	.sorot { border-color: var(--aksen); }
	.kecil { font-size: 12px; color: var(--redup); margin: 0 0 12px; }
	.catatan { margin: 12px 0 0; }
	dl { display: grid; grid-template-columns: minmax(120px, 160px) 1fr; gap: 6px 18px; margin: 0; font-size: 12.5px; }
	dt { color: var(--redup); }
	dd { margin: 0; overflow-wrap: anywhere; }
	.mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
	dd a { color: var(--aksen); text-decoration: none; }
	@media (max-width: 620px) { dl { grid-template-columns: 1fr; gap: 2px 0; } dt { margin-top: 8px; } }
</style>
