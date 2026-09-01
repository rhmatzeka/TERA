<script lang="ts">
	import { formatBiaya } from '$lib/biaya';
	let { data } = $props();

	const LABEL: Record<string, string> = {
		draf: 'draf',
		menunggu_persetujuan: 'menunggu persetujuan',
		memproses: 'sedang diproses',
		terbit: 'sudah terbit',
		gagal: 'gagal'
	};
	const KELAS: Record<string, string> = {
		terbit: 'sah', gagal: 'bahaya', memproses: 'awas', menunggu_persetujuan: 'awas', draf: 'netral'
	};

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
	<div class="gulir">
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
						<td>
						<span class="pil {KELAS[b.status]}">{LABEL[b.status]}</span>
						{#if b.jaringanLain}
							<span class="pil bahaya" title="Diterbitkan di {b.jaringan} (chainId {b.chainId}) — tidak dapat diverifikasi dari jaringan yang sedang dipakai">jaringan lain</span>
						{/if}
					</td>
						<td class="redup">{formatBiaya(b.biayaWei, data.kurs)}</td>
						<td class="kanan"><a href="/admin/kegiatan/{b.uuid}">buka →</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.kepala { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
	}
	h1 { font-size: 23px; margin: 0 0 4px;
	}
	h2 { font-size: 16px; margin: 0 0 6px;
	}
	.sub { color: var(--redup); font-size: 13.5px; margin: 0;
	}
	tbody tr:last-child td { border-bottom: 0;
	}
	.nama { font-weight: 550; display: flex; flex-direction: column;
	}
	.penyelenggara { font-weight: 400; font-size: 11.5px; color: var(--redup);
	}
	.kanan { text-align: right;
	}
	.kanan a { color: var(--aksen); text-decoration: none; font-size: 12.5px; white-space: nowrap;
	}
	td .pil + .pil { margin-left: 5px;
	}
	.kosong { background: var(--kartu); border: 1px dashed var(--garis); border-radius: 12px; padding: 34px; text-align: center;
	}
	.kosong p { color: var(--redup); font-size: 13.5px; margin: 0 0 16px;
	}
</style>

