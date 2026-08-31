<script lang="ts">
	import { enhance } from '$app/forms';
	import Hash from '$lib/components/Hash.svelte';
	let { data, form } = $props();

	let terpilih = $state<{ id: string; nama: string; daun: string } | null>(null);
	let alasan = $state('');
	let sedangKirim = $state(false);

	// Kewenangan berasal dari +layout.server.ts. Ini hanya menyembunyikan tombol —
	// penjagaan yang sesungguhnya ada di action server (+page.server.ts).
	const bolehCabut = $derived(data.kewenangan.cabut);
	const nomorAwal = $derived(data.ada ? (data.hal - 1) * data.perHal + 1 : 0);
</script>

<h1>Kelola Sertifikat</h1>
<p class="sub">Status pencabutan dibaca langsung dari blockchain, bukan dari basis data.</p>

{#if !data.ada}
	<div class="kabar">Belum ada batch.</div>
{:else}
	{#if form?.berhasil}
		<div class="kabar ok">
			<strong>Sertifikat berhasil dicabut.</strong>
			Transaksi <Hash nilai={form.txHash} jenis="tx" chainId={data.jaringan.chainId}
				basisExplorer={data.basisExplorer} /> · gas {form.gas.toLocaleString('id-ID')}
		</div>
	{:else if form?.pesan}
		<div class="kabar bad">{form.pesan}</div>
	{/if}

	<form class="cari" method="GET">
		<input name="q" value={data.q} placeholder="Cari nama atau ID sertifikat…" />
		<button type="submit">Cari</button>
		{#if data.q}<a class="hapus" href="/admin/sertifikat">Bersihkan</a>{/if}
	</form>

	<p class="info">
		{data.total.toLocaleString('id-ID')} sertifikat
		{#if data.q}cocok dengan "{data.q}"{/if} · halaman {data.hal} dari {data.totalHal}
	</p>

	<div class="bungkus-tabel">
		<table>
			<thead>
				<tr><th>#</th><th>Nama</th><th>ID sertifikat</th><th>Status</th><th></th></tr>
			</thead>
			<tbody>
				{#each data.sertifikat as s, i (s.id)}
					<tr>
						<td class="redup">{nomorAwal + i}</td>
						<td class="nama">{s.nama}</td>
						<td><Hash nilai={s.id} chainId={data.jaringan.chainId} potong /></td>
						<td>
							<span class="pil {s.dicabut ? 'bad' : 'ok'}">{s.dicabut ? 'dicabut' : 'aktif'}</span>
						</td>
						<td class="kanan">
							<a class="tautan" href="/verify/{s.id}">lihat</a>
							{#if !s.dicabut && bolehCabut}
								<button class="mini" onclick={() => { terpilih = s; alasan = ''; }}>cabut</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.totalHal > 1}
		<nav class="halaman">
			{#if data.hal > 1}
				<a href="?q={data.q}&hal={data.hal - 1}">← Sebelumnya</a>
			{/if}
			<span>{data.hal} / {data.totalHal}</span>
			{#if data.hal < data.totalHal}
				<a href="?q={data.q}&hal={data.hal + 1}">Berikutnya →</a>
			{/if}
		</nav>
	{/if}

	{#if terpilih}
		<div class="lapis" role="dialog" aria-modal="true">
			<div class="dialog">
				<h3>Cabut sertifikat</h3>
				<p class="kecil">
					Sertifikat milik <strong>{terpilih.nama}</strong> akan dicabut.
					Tindakan ini mengirim transaksi ke blockchain dan
					<strong>tidak dapat dibatalkan</strong> — jejaknya permanen dan dapat diaudit siapa pun.
				</p>
				<form
					method="POST"
					action="?/cabut"
					use:enhance={() => {
						sedangKirim = true;
						return async ({ update }) => {
							await update();
							sedangKirim = false;
							terpilih = null;
						};
					}}
				>
					<input type="hidden" name="daun" value={terpilih.daun} />
					<label for="alasan">Alasan pencabutan</label>
					<input id="alasan" name="alasan" bind:value={alasan}
						placeholder="mis. terbukti tidak menghadiri kegiatan" required minlength="5" />
					<div class="tombol-baris">
						<button type="submit" class="bahaya" disabled={sedangKirim || alasan.trim().length < 5}>
							{sedangKirim ? 'Mengirim transaksi…' : 'Cabut sekarang'}
						</button>
						<button type="button" class="sekunder" onclick={() => (terpilih = null)}>Batal</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
{/if}

<style>
	h1 { font-size: 23px; margin: 0 0 4px; }
	h3 { font-size: 16px; margin: 0 0 8px; }
	.sub { color: var(--redup); font-size: 13.5px; margin: 0 0 20px; }
	.redup { color: var(--redup); }
	.kecil { font-size: 12.5px; line-height: 1.55; }
	.info { font-size: 12.5px; color: var(--redup); margin: 0 0 10px; }

	.cari { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
	.cari input {
		flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid var(--garis);
		border-radius: 8px; background: var(--kartu); color: var(--tx); font-size: 13px;
	}
	.hapus { font-size: 12.5px; color: var(--redup); text-decoration: none; }

	.bungkus-tabel { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 560px; }
	th { text-align: left; font-weight: 550; color: var(--redup); font-size: 11.5px; padding: 9px 12px; border-bottom: 1px solid var(--garis); }
	td { padding: 8px 12px; border-bottom: 1px solid var(--garis); }
	tbody tr:last-child td { border-bottom: 0; }
	tbody tr:hover { background: color-mix(in srgb, var(--aksen) 5%, transparent); }
	.nama { font-weight: 520; }
	.kanan { text-align: right; white-space: nowrap; }
	.tautan { color: var(--aksen); text-decoration: none; font-size: 12.5px; margin-right: 10px; }

	.pil { font-size: 11px; padding: 2px 9px; border-radius: 999px; white-space: nowrap; }
	.pil.ok { background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-garis); }
	.pil.bad { background: var(--bad-bg); color: var(--bad-tx); border: 1px solid var(--bad-garis); }

	button { border: 0; border-radius: 8px; padding: 8px 15px; font-size: 13px; font-weight: 550; cursor: pointer; background: var(--aksen); color: #fff; }
	button:disabled { opacity: 0.5; cursor: default; }
	.mini { padding: 3px 10px; font-size: 12px; background: transparent; color: var(--bad-tx); border: 1px solid var(--bad-garis); }
	.bahaya { background: #c0392b; }
	.sekunder { background: transparent; color: var(--tx); border: 1px solid var(--garis); }
	.tombol-baris { display: flex; gap: 8px; margin-top: 14px; }

	.halaman { display: flex; gap: 14px; align-items: center; justify-content: center; margin-top: 16px; font-size: 13px; }
	.halaman a { color: var(--aksen); text-decoration: none; }
	.halaman span { color: var(--redup); }

	.lapis { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; padding: 20px; z-index: 20; }
	.dialog { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; padding: 22px; max-width: 440px; width: 100%; }
	label { display: block; font-size: 12.5px; color: var(--redup); margin: 14px 0 5px; }
	.dialog input { width: 100%; padding: 9px 11px; border: 1px solid var(--garis); border-radius: 8px; background: var(--bg); color: var(--tx); font-size: 13px; }

	.kabar { border-radius: 10px; padding: 12px 15px; font-size: 13px; margin-bottom: 14px; border: 1px solid var(--garis); background: var(--kartu); }
	.kabar.ok { background: var(--ok-bg); color: var(--ok-tx); border-color: var(--ok-garis); }
	.kabar.bad { background: var(--bad-bg); color: var(--bad-tx); border-color: var(--bad-garis); }
</style>
