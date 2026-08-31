<script lang="ts">
	let { data } = $props();
	const rupiah = (eth: string) => `Rp ${(Number(eth) * 50_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
</script>

<a class="balik" href="/explorer">← Explorer</a>
<h1>Transaksi</h1>
<p class="hash-besar">{data.hash}</p>

<section class="kartu">
	<dl>
		<dt>Status</dt>
		<dd><span class="pil {data.status === 'success' ? 'ok' : 'bad'}">{data.status}</span></dd>
		<dt>Blok</dt>
		<dd><a href="/explorer/block/{data.nomorBlok}">{data.nomorBlok}</a> · {data.waktu}</dd>
		<dt>Dari</dt>
		<dd><a class="mono" href="/explorer/address/{data.dari}">{data.dari}</a></dd>
		<dt>Ke</dt>
		<dd>{#if data.ke}<a class="mono" href="/explorer/address/{data.ke}">{data.ke}</a>{:else}—{/if}</dd>
		<dt>Nonce</dt><dd>{data.nonce}</dd>
		<dt>Nilai</dt><dd>{data.nilai} wei</dd>
		<dt>Gas terpakai</dt>
		<dd>{Number(data.gasTerpakai).toLocaleString('id-ID')} dari {Number(data.gasLimit).toLocaleString('id-ID')}</dd>
		<dt>Harga gas</dt><dd>{(Number(data.hargaGas) / 1e9).toFixed(4)} gwei</dd>
		<dt>Biaya</dt><dd>{data.biayaEth} ETH ≈ {rupiah(data.biayaEth)}</dd>
		<dt>Jaringan</dt><dd>{data.jaringan} · chainId {data.chainId}</dd>
	</dl>
</section>

{#if data.fungsi}
	<section class="kartu">
		<h2>Fungsi yang dipanggil</h2>
		<p class="nama-fungsi">{data.fungsi.nama}()</p>
		<dl>
			{#each Object.entries(data.fungsi.argumen) as [k, v]}
				<dt>{k}</dt><dd class="mono">{v}</dd>
			{/each}
		</dl>
	</section>
{/if}

{#if data.peristiwa.length}
	<section class="kartu">
		<h2>Event log</h2>
		{#each data.peristiwa as p}
			<div class="peristiwa">
				<span class="nama-event">{p.nama}</span>
				<dl>
					{#each Object.entries(p.argumen) as [k, v]}
						<dt>{k}</dt><dd class="mono">{v}</dd>
					{/each}
				</dl>
			</div>
		{/each}
	</section>
{/if}

<section class="kartu">
	<h2>Calldata mentah <span class="redup">({data.calldataUkuran} byte)</span></h2>
	<pre>{data.calldata}</pre>
</section>

<style>
	.balik { font-size: 12.5px; color: var(--redup); text-decoration: none; }
	h1 { font-size: 21px; margin: 10px 0 4px; }
	h2 { font-size: 14px; margin: 0 0 10px; }
	.hash-besar { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--redup); margin: 0 0 18px; overflow-wrap: anywhere; }
	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 17px; margin-bottom: 14px; }
	dl { display: grid; grid-template-columns: minmax(110px, 150px) 1fr; gap: 6px 18px; margin: 0; font-size: 12.5px; }
	dt { color: var(--redup); }
	dd { margin: 0; overflow-wrap: anywhere; }
	dd a, .mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
	dd a { color: var(--aksen); text-decoration: none; }
	.pil { font-size: 11px; padding: 2px 9px; border-radius: 999px; }
	.pil.ok { background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-garis); }
	.pil.bad { background: var(--bad-bg); color: var(--bad-tx); border: 1px solid var(--bad-garis); }
	.nama-fungsi { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 600; margin: 0 0 12px; color: var(--aksen); }
	.peristiwa + .peristiwa { border-top: 1px solid var(--garis); padding-top: 12px; margin-top: 12px; }
	.nama-event { display: block; font-weight: 600; font-size: 12.5px; margin-bottom: 8px; }
	.redup { color: var(--redup); font-weight: 400; }
	pre { background: var(--bg); border: 1px solid var(--garis); border-radius: 8px; padding: 11px; font-size: 10.5px; overflow-x: auto; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
	@media (max-width: 620px) { dl { grid-template-columns: 1fr; gap: 2px 0; } dt { margin-top: 8px; } }
</style>
