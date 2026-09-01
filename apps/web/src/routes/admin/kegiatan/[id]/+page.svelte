<script lang="ts">
	import { formatBiaya, biayaPerSertifikat } from '$lib/biaya';
	import { enhance } from '$app/forms';
	import Hash from '$lib/components/Hash.svelte';
	let { data, form } = $props();

	let sedangKirim = $state(false);
	let konfirmasi = $state(false);

	const b = $derived(data.batch);
	const bolehTerbit = $derived(data.kewenangan.terbitkan);


	const KELAS: Record<string, string> = {
		terbit: 'sah', gagal: 'bahaya', memproses: 'awas', menunggu_persetujuan: 'awas', draf: 'netral'
	};
	const LABEL: Record<string, string> = {
		draf: 'draf', menunggu_persetujuan: 'menunggu persetujuan',
		memproses: 'sedang diproses', terbit: 'sudah terbit', gagal: 'gagal'
	};
</script>

<a class="balik" href="/admin/kegiatan">← Kegiatan</a>

<div class="kepala">
	<div>
		<h1>{b.namaKegiatan}</h1>
		<p class="sub">{b.penyelenggara} · {b.tanggalKegiatan}</p>
	</div>
	<span class="pil {KELAS[b.status]}">{LABEL[b.status]}</span>
</div>

{#if form?.berhasil}
	<div class="kabar sah">
		<strong>Sertifikat berhasil diterbitkan.</strong><br />
		Transaksi <Hash nilai={form.txHash} jenis="tx" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} />
		· gas {form.gas?.toLocaleString('id-ID')} · biaya {formatBiaya(form.biayaWei, data.kurs)}
	</div>
{:else if form?.pesan}
	<div class="kabar bahaya">{form.pesan}</div>
{/if}

{#if b.status === 'menunggu_persetujuan'}
	<section class="kartu sorot">
		<h2>Menunggu persetujuan</h2>
		<p class="kecil">
			Seluruh sertifikat sudah disiapkan, tetapi <strong>belum ada apa pun yang
			dicatat</strong>. Sertifikat baru terbit setelah Penandatangan menyetujui.
		</p>
		<dl class="ringkas">
			<dt>Jumlah sertifikat</dt><dd>{b.jumlah.toLocaleString('id-ID')}</dd>
			<dt>Disiapkan oleh</dt><dd>{b.dibuatOleh ?? '—'}</dd>
			<dt>Biaya pencatatan</dt><dd>sekali saja, berapa pun jumlah pesertanya</dd>
		</dl>

		{#if bolehTerbit}
			{#if !konfirmasi}
				<button class="utama tombol" onclick={() => (konfirmasi = true)}>Setujui &amp; terbitkan</button>
			{:else}
				<div class="konfirmasi">
					<p class="kecil">
						Setelah diterbitkan, sertifikat tercatat permanen dan <strong>tidak dapat
						dibatalkan</strong>. Pastikan daftar peserta sudah benar — sertifikat yang keliru
						hanya dapat ditarik, tidak dapat dihapus.
					</p>
					<form method="POST" action="?/terbitkan"
						use:enhance={() => { sedangKirim = true; return async ({ update }) => { await update(); sedangKirim = false; konfirmasi = false; }; }}>
						<button type="submit" class="utama tombol" disabled={sedangKirim}>
							{sedangKirim ? 'Mengirim transaksi…' : `Ya, terbitkan ${b.jumlah.toLocaleString('id-ID')} sertifikat`}
						</button>
						<button type="button" class="sekunder tombol putih mini" onclick={() => (konfirmasi = false)}>Batal</button>
					</form>
				</div>
			{/if}
		{:else}
			<p class="batas">
				Peran Anda tidak berwenang menerbitkan. Mintakan persetujuan kepada Penandatangan.
			</p>
		{/if}
	</section>
{/if}

{#if b.status === 'gagal'}
	<div class="kabar bahaya">
		<strong>Penerbitan gagal.</strong> {b.galat}<br />
		Data sertifikat tidak berubah, jadi penerbitan aman untuk dicoba ulang.
	</div>
	{#if bolehTerbit}
		<form method="POST" action="?/terbitkan" use:enhance>
			<button type="submit" class="utama tombol">Coba terbitkan lagi</button>
		</form>
	{/if}
{/if}

<section class="kartu">
	<h2>Rincian kegiatan</h2>
	<dl>
		<dt>Institusi penerbit</dt><dd>{b.namaPenerbit}</dd>
		<dt>Jumlah sertifikat</dt><dd>{b.jumlah.toLocaleString('id-ID')}</dd>
		<dt>Disiapkan</dt><dd>{new Date(b.dibuatPada).toLocaleString('id-ID')} oleh {b.dibuatOleh ?? '—'}</dd>
		{#if b.disetujuiOleh}
			<dt>Disetujui</dt><dd>{new Date(b.disetujuiPada!).toLocaleString('id-ID')} oleh {b.disetujuiOleh}</dd>
		{/if}
		<dt>Merkle root</dt><dd><Hash nilai={b.root} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
		<dt>ID batch on-chain</dt><dd><Hash nilai={b.idOnchain} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
		{#if b.txHash}
			<dt>Transaksi</dt><dd><Hash nilai={b.txHash} jenis="tx" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Blok</dt><dd><Hash nilai={b.nomorBlok!} jenis="blok" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Gas terpakai</dt><dd>{b.gasTerpakai?.toLocaleString('id-ID')}</dd>
			<dt>Biaya</dt><dd>{formatBiaya(b.biayaWei, data.kurs)}</dd>
			<dt>Biaya per sertifikat</dt>
			<dd>{biayaPerSertifikat(b.biayaWei, b.jumlah, data.kurs)}</dd>
		{/if}
		<dt>Kedalaman bukti</dt><dd>{b.kedalamanBukti} hash ({b.kedalamanBukti * 32} byte per peserta)</dd>
		<dt>Jaringan</dt><dd>{data.jaringan.nama} · chainId {data.jaringan.chainId}</dd>
	</dl>
</section>

<section class="kartu">
	<h2>Contoh penerima</h2>
	<div class="gulir">
		<table>
			<thead><tr><th>#</th><th>Nama</th><th>ID sertifikat</th><th></th></tr></thead>
			<tbody>
				{#each data.contoh as s (s.id)}
					<tr>
						<td class="redup">{s.indeks}</td>
						<td>{s.nama}</td>
						<td><Hash nilai={s.id} chainId={data.jaringan.chainId} potong /></td>
						<td class="kanan">
							{#if b.status === 'terbit'}<a href="/verify/{s.id}">lihat</a>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if b.jumlah > data.contoh.length}
		<p class="kecil redup">…dan {(b.jumlah - data.contoh.length).toLocaleString('id-ID')} lainnya.
			<a href="/admin/sertifikat">Kelola seluruh sertifikat →</a></p>
	{/if}
</section>

<style>
	.balik { font-size: 12.5px; color: var(--redup); text-decoration: none;
	}
	.kepala { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin: 10px 0 20px; flex-wrap: wrap;
	}
	h1 { font-size: 22px; margin: 0 0 3px;
	}
	h2 { font-size: 15px; margin: 0 0 10px;
	}
	.sub { color: var(--redup); font-size: 13px; margin: 0;
	}
	.kecil { font-size: 12.5px; color: var(--redup); line-height: 1.55; margin: 0 0 14px; max-width: 62ch;
	}
	.sorot { border-color: var(--warn-garis); background: color-mix(in srgb, var(--warn-bg) 45%, var(--kartu));
	}
	dl.ringkas { margin-bottom: 16px;
	}
	.utama { background: var(--aksen); color: #fff;
	}
	.utama:disabled { opacity: 0.55; cursor: default;
	}
	.konfirmasi { border-top: 1px solid var(--garis); padding-top: 14px;
	}
	.batas { font-size: 12.5px; background: var(--bg); border: 1px solid var(--garis); border-radius: 8px; padding: 10px 13px; color: var(--redup); margin: 0;
	}
	tbody tr:last-child td { border-bottom: 0;
	}
	.kanan { text-align: right;
	}
	.kanan a { color: var(--aksen); text-decoration: none;
	}
</style>

