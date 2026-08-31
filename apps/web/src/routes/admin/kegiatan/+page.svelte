<script lang="ts">
	let { data } = $props();

	const LABEL: Record<string, string> = {
		draf: 'draf',
		menunggu_persetujuan: 'menunggu persetujuan',
		memproses: 'sedang diproses',
		terbit: 'sudah terbit',
		gagal: 'gagal'
	};
	const KELAS: Record<string, string> = {
		terbit: 'ok', gagal: 'bad', memproses: 'warn', menunggu_persetujuan: 'warn', draf: 'netral'
	};
	const rupiah = (wei: string | null) =>
		wei ? `Rp ${((Number(BigInt(wei)) / 1e18) * 50_000_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '—';
</script>

<div class="kepala">
	<div>
		<h1>Kegiatan</h1>
		<p class="sub">Setiap kegiatan diterbitkan sekali jalan untuk seluruh pesertanya.</p>
	</div>
	<a class="tombol" href="/admin/kegiatan/baru">+ Kegiatan Baru</a>
</div>

{#if data.batch.length === 0}
	<div class="kosong">
		<h2>Belum ada kegiatan</h2>
		<p>Mulai dengan membuat kegiatan baru dan mengunggah daftar pesertanya.</p>
		<a class="tombol" href="/admin/kegiatan/baru">+ Kegiatan Baru</a>
	</div>
{:else}
	<div class="bungkus">
		<table>
			<thead>
				<tr><th>Kegiatan</th><th>Tanggal</th><th>Peserta</th><th>Status</th><th>Biaya</th><th></th></tr>
			</thead>
			<tbody>
				{#each data.batch as b (b.uuid)}
					<tr>
						<td class="nama">{b.namaKegiatan}<span class="penyelenggara">{b.penyelenggara}</span></td>
						<td class="redup">{b.tanggalKegiatan}</td>
						<td>{b.jumlah.toLocaleString('id-ID')}</td>
						<td><span class="pil {KELAS[b.status]}">{LABEL[b.status]}</span></td>
						<td class="redup">{rupiah(b.biayaWei)}</td>
						<td class="kanan"><a href="/admin/kegiatan/{b.uuid}">buka →</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.kepala { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
	h1 { font-size: 23px; margin: 0 0 4px; }
	h2 { font-size: 16px; margin: 0 0 6px; }
	.sub { color: var(--redup); font-size: 13.5px; margin: 0; }
	.tombol { background: var(--aksen); color: #fff; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 550; text-decoration: none; white-space: nowrap; }
	.bungkus { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 620px; }
	th { text-align: left; font-size: 11.5px; color: var(--redup); font-weight: 550; padding: 9px 13px; border-bottom: 1px solid var(--garis); }
	td { padding: 10px 13px; border-bottom: 1px solid var(--garis); vertical-align: top; }
	tbody tr:last-child td { border-bottom: 0; }
	tbody tr:hover { background: color-mix(in srgb, var(--aksen) 5%, transparent); }
	.nama { font-weight: 550; display: flex; flex-direction: column; }
	.penyelenggara { font-weight: 400; font-size: 11.5px; color: var(--redup); }
	.redup { color: var(--redup); }
	.kanan { text-align: right; }
	.kanan a { color: var(--aksen); text-decoration: none; font-size: 12.5px; white-space: nowrap; }
	.pil { font-size: 11px; padding: 2px 9px; border-radius: 999px; white-space: nowrap; }
	.pil.ok { background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-garis); }
	.pil.bad { background: var(--bad-bg); color: var(--bad-tx); border: 1px solid var(--bad-garis); }
	.pil.warn { background: var(--warn-bg); color: var(--warn-tx); border: 1px solid var(--warn-garis); }
	.pil.netral { background: var(--bg); color: var(--redup); border: 1px solid var(--garis); }
	.kosong { background: var(--kartu); border: 1px dashed var(--garis); border-radius: 12px; padding: 34px; text-align: center; }
	.kosong p { color: var(--redup); font-size: 13.5px; margin: 0 0 16px; }
</style>
