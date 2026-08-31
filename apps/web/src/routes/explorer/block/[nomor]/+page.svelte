<script lang="ts">
	let { data } = $props();
	const n = Number(data.nomor);
</script>

<a class="balik" href="/explorer">← Explorer</a>
<h1>Blok {data.nomor}</h1>

<nav class="pindah">
	{#if n > 0}<a href="/explorer/block/{n - 1}">← Blok {n - 1}</a>{/if}
	<a href="/explorer/block/{n + 1}">Blok {n + 1} →</a>
</nav>

<section class="kartu">
	<dl>
		<dt>Hash</dt><dd class="mono">{data.hash}</dd>
		<dt>Induk</dt><dd><a class="mono" href="/explorer/block/{n - 1}">{data.indukHash}</a></dd>
		<dt>Waktu</dt><dd>{data.waktu}</dd>
		<dt>Gas terpakai</dt>
		<dd>{Number(data.gasTerpakai).toLocaleString('id-ID')} dari {Number(data.gasLimit).toLocaleString('id-ID')}</dd>
		<dt>Transaksi</dt><dd>{data.transaksi.length}</dd>
	</dl>
</section>

{#if data.transaksi.length}
	<section class="kartu">
		<h2>Transaksi dalam blok ini</h2>
		{#each data.transaksi as t (t.hash)}
			<div class="baris">
				<a class="mono" href="/explorer/tx/{t.hash}">{t.hash}</a>
				<span class="redup">dari <a class="mono" href="/explorer/address/{t.dari}">{t.dari}</a></span>
			</div>
		{/each}
	</section>
{/if}

<style>
	.balik { font-size: 12.5px; color: var(--redup); text-decoration: none; }
	h1 { font-size: 21px; margin: 10px 0 12px; }
	h2 { font-size: 14px; margin: 0 0 10px; }
	.pindah { display: flex; gap: 14px; margin-bottom: 14px; font-size: 12.5px; }
	.pindah a { color: var(--aksen); text-decoration: none; }
	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 17px; margin-bottom: 14px; }
	dl { display: grid; grid-template-columns: minmax(110px, 150px) 1fr; gap: 6px 18px; margin: 0; font-size: 12.5px; }
	dt { color: var(--redup); }
	dd { margin: 0; overflow-wrap: anywhere; }
	.mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
	a.mono { color: var(--aksen); text-decoration: none; }
	.baris { padding: 8px 0; border-top: 1px solid var(--garis); display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
	.redup { color: var(--redup); }
	@media (max-width: 620px) { dl { grid-template-columns: 1fr; gap: 2px 0; } dt { margin-top: 8px; } }
</style>
