<script lang="ts">
	let { data } = $props();
</script>

<h1>Block Explorer</h1>

{#if !data.ada}
	<div class="kabar">Belum ada data batch.</div>
{:else if data.galat}
	<div class="kabar bad">Tidak dapat terhubung ke node: {data.galat}</div>
{:else}
	<div class="ringkas">
		<div><span class="label">Jaringan</span><span class="nilai">{data.jaringan.nama}</span></div>
		<div><span class="label">Chain ID</span><span class="nilai">{data.chainId}</span></div>
		<div><span class="label">Blok terakhir</span><span class="nilai">{data.nomorTerakhir}</span></div>
	</div>

	<div class="pintasan">
		<a href="/explorer/tx/{data.txPenerbitan}">Transaksi penerbitan batch →</a>
		<a href="/explorer/address/{data.kontrak}">Kontrak RegistriSertifikat →</a>
	</div>

	<h2>Blok terbaru</h2>
	<div class="bungkus">
		<table>
			<thead><tr><th>Blok</th><th>Waktu</th><th>Tx</th><th>Gas</th></tr></thead>
			<tbody>
				{#each data.blok as b (b.nomor)}
					<tr>
						<td><a href="/explorer/block/{b.nomor}">{b.nomor}</a></td>
						<td class="redup">{b.waktu}</td>
						<td>{b.jumlahTx}</td>
						<td class="redup">{Number(b.gas).toLocaleString('id-ID')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	h1 { font-size: 22px; margin: 0 0 18px; }
	h2 { font-size: 14px; margin: 24px 0 10px; }
	.ringkas { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
	.ringkas > div { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 13px 15px; }
	.label { display: block; font-size: 11.5px; color: var(--redup); }
	.nilai { display: block; font-size: 16px; font-weight: 620; margin-top: 2px; }
	.pintasan { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
	.pintasan a { font-size: 12.5px; color: var(--aksen); text-decoration: none; border: 1px solid var(--garis); border-radius: 8px; padding: 8px 13px; background: var(--kartu); }
	.bungkus { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
	th { text-align: left; font-size: 11px; color: var(--redup); font-weight: 550; padding: 9px 13px; border-bottom: 1px solid var(--garis); }
	td { padding: 8px 13px; border-bottom: 1px solid var(--garis); }
	tbody tr:last-child td { border-bottom: 0; }
	td a { color: var(--aksen); text-decoration: none; font-family: ui-monospace, Menlo, monospace; }
	.redup { color: var(--redup); }
	.kabar { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 14px; font-size: 13px; }
	.kabar.bad { background: var(--bad-bg); color: var(--bad-tx); border-color: var(--bad-garis); }
</style>
