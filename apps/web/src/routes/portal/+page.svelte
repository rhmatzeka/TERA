<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	let { data } = $props();
</script>

<h1>Sertifikat Saya</h1>
<p class="sub">
	Sertifikat di bawah ini terdaftar atas nama Anda. Bagikan tautan verifikasinya
	kepada siapa pun — perusahaan atau kampus mana pun dapat memastikan keasliannya
	sendiri, tanpa perlu akun.
</p>

{#if !data.ada}
	<div class="kabar">
		Belum ada sertifikat yang diterbitkan di sistem ini.
	</div>
{:else if data.daftar.length === 0}
	<div class="kabar">
		Belum ada sertifikat atas nama Anda pada batch yang aktif.
	</div>
{:else}
	{#each data.daftar as s (s.id)}
		<article class="kartu">
			<div class="pita" class:dicabut={s.dicabut}></div>
			<div class="isi">
				<span class="jenis">Sertifikat Kegiatan</span>
				<h2>{s.nama}</h2>
				<p class="ket">telah mengikuti</p>
				<p class="kegiatan">{data.batch.namaKegiatan}</p>
				<p class="ket">{data.batch.penyelenggara} · {data.batch.tanggalKegiatan}</p>

				{#if s.dicabut}
					<p class="lencana bad">Sertifikat ini telah dicabut oleh penerbit</p>
				{:else}
					<p class="lencana ok">Aktif dan tercatat permanen</p>
				{/if}

				<dl>
					<dt>Peran</dt><dd>{s.peran}</dd>
					<dt>Nomor identitas</dt><dd>{s.nomorIdentitas}</dd>
					<dt>ID sertifikat</dt><dd><Hash nilai={s.id} chainId={data.jaringan.chainId} /></dd>
					<dt>Nomor pencatatan</dt>
					<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId}
						basisExplorer={data.basisExplorer} potong /></dd>
				</dl>

				<div class="aksi">
					<a class="tombol" href="/verify/{s.id}">Buka halaman verifikasi</a>
					<a class="tombol sekunder" href="/portal/{s.id}/bukti" download="bukti-{s.id}.json">
						Unduh berkas bukti
					</a>
				</div>
				<p class="catatan">
					<strong>Berkas bukti</strong> adalah salinan digital sertifikat Anda beserta
					bukti keasliannya. Simpan bersama arsip pribadi — dengan berkas ini,
					sertifikat tetap dapat dibuktikan asli walaupun situs ini suatu saat hilang.
				</p>
			</div>
		</article>
	{/each}
{/if}

<style>
	h1 { font-size: 23px; margin: 0 0 6px; }
	.sub { color: var(--redup); font-size: 13.5px; margin: 0 0 24px; max-width: 62ch; }
	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; overflow: hidden; margin-bottom: 18px; }
	.pita { height: 4px; background: var(--aksen); }
	.pita.dicabut { background: #c0392b; }
	.isi { padding: 24px; }
	.jenis { font-size: 11px; letter-spacing: 0.11em; text-transform: uppercase; color: var(--redup); }
	h2 { font-size: 24px; margin: 8px 0 4px; letter-spacing: -0.02em; }
	.ket { color: var(--redup); font-size: 13px; margin: 2px 0; }
	.kegiatan { font-size: 16px; font-weight: 600; margin: 8px 0 4px; }
	.lencana { display: inline-block; font-size: 12.5px; padding: 6px 12px; border-radius: 8px; margin: 16px 0 4px; }
	.lencana.ok { background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-garis); }
	.lencana.bad { background: var(--bad-bg); color: var(--bad-tx); border: 1px solid var(--bad-garis); }
	dl { display: grid; grid-template-columns: minmax(120px, 160px) 1fr; gap: 6px 18px; margin: 18px 0 0; font-size: 13px; border-top: 1px solid var(--garis); padding-top: 16px; }
	dt { color: var(--redup); }
	dd { margin: 0; min-width: 0; }
	.aksi { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
	.tombol { background: var(--aksen); color: #fff; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 550; text-decoration: none; }
	.sekunder { background: transparent; color: var(--tx); border: 1px solid var(--garis); }
	.catatan { font-size: 12px; color: var(--redup); margin: 14px 0 0; line-height: 1.55; max-width: 62ch; }
	.kabar { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 16px; font-size: 13.5px; color: var(--redup); }
	@media (max-width: 620px) { dl { grid-template-columns: 1fr; gap: 2px 0; } dt { margin-top: 8px; } }
</style>
