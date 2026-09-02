<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	import { formatTanggal } from '$lib/waktu';

	let { data } = $props();

	const sapaan = $derived(data.pengguna?.nama?.split(' ')[0] ?? '');
	const aktif = $derived(data.ada ? data.daftar.filter((s) => !s.dicabut).length : 0);
</script>

<header class="sambutan">
	<div class="sambutan-teks">
		<span class="label-atas">Portal peserta</span>
		<h1>Halo{sapaan ? `, ${sapaan}` : ''}</h1>
		<p>
			Sertifikat di bawah ini terdaftar atas nama Anda. Bagikan tautan verifikasinya
			kepada siapa pun — perusahaan atau kampus mana pun dapat memastikan keasliannya
			sendiri, tanpa perlu membuat akun.
		</p>
	</div>
	{#if data.ada && data.daftar.length > 0}
		<div class="hitungan">
			<span class="angka-hitungan">{aktif}</span>
			<span class="mungil">sertifikat aktif</span>
		</div>
	{/if}
</header>

{#if !data.ada}
	<div class="kabar awas">Belum ada sertifikat yang diterbitkan di sistem ini.</div>
{:else if data.daftar.length === 0}
	<div class="kabar awas">
		<strong>Belum ada sertifikat atas nama Anda.</strong>
		Sertifikat akan muncul di sini segera setelah penyelenggara menerbitkannya.
	</div>
{:else}
	{#each data.daftar as s (s.id)}
		<article class="kartu sertifikat" class:ditarik={s.dicabut}>
			<div class="pratinjau" class:ditarik={s.dicabut}>
				<iframe src="/sertifikat/{s.id}/pdf#toolbar=0&navpanes=0&view=FitH"
					title="Sertifikat {s.nama}" loading="lazy"></iframe>
			</div>

			<div class="rinci">
				<div class="atas">
					<span class="label-atas">Sertifikat kegiatan</span>
					<span class="pil {s.dicabut ? 'bahaya' : 'sah'}">
						{s.dicabut ? 'Sudah ditarik' : 'Aktif'}
					</span>
				</div>

				<h2>{data.batch.namaKegiatan}</h2>
				<p class="penyelenggara">
					{data.batch.penyelenggara} · {formatTanggal(data.batch.tanggalKegiatan)}
				</p>

				{#if s.dicabut}
					<p class="kabar bahaya kecil peringatan">
						Penerbit telah menarik sertifikat ini. Riwayatnya tetap tercatat permanen,
						tetapi statusnya kini tidak berlaku.
					</p>
				{/if}

				<dl class="rincian">
					<dt>Atas nama</dt><dd class="tebal">{s.nama}</dd>
					<dt>Peran</dt><dd>{s.peran}</dd>
					{#if s.nomorIdentitas}
						<dt>Nomor identitas</dt><dd class="mono">{s.nomorIdentitas}</dd>
					{/if}
					<dt>ID sertifikat</dt>
					<dd><Hash nilai={s.id} chainId={data.jaringan.chainId} potong /></dd>
					<dt>Nomor pencatatan</dt>
					<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId}
						basisExplorer={data.basisExplorer} potong /></dd>
				</dl>

				<div class="aksi">
					<a class="tombol" href="/sertifikat/{s.id}/pdf?unduh" download>Unduh sertifikat</a>
					<a class="tombol putih" href="/verify/{s.id}">Halaman verifikasi</a>
					<a class="tombol putih" href="/portal/{s.id}/bukti" download="bukti-{s.id}.json">
						Berkas bukti
					</a>
				</div>
			</div>
		</article>
	{/each}

	<section class="kartu penjelasan">
		<div class="kolom-jelas">
			<span class="tanda">↗</span>
			<h3>Halaman verifikasi</h3>
			<p>
				Tautan publik yang bisa dibuka siapa pun tanpa akun. Halaman itu memeriksa
				sendiri keaslian sertifikat langsung ke blockchain. Inilah yang sebaiknya
				Anda cantumkan di lamaran kerja atau profil daring.
			</p>
		</div>
		<div class="kolom-jelas">
			<span class="tanda">⤓</span>
			<h3>Berkas bukti</h3>
			<p>
				Salinan digital sertifikat beserta bukti matematisnya dalam satu berkas.
				Simpan bersama arsip pribadi — dengan berkas ini, keaslian sertifikat tetap
				dapat dibuktikan walaupun situs ini suatu saat hilang.
			</p>
		</div>
	</section>
{/if}

<style>
	/* ── sambutan ──────────────────────────────────────────────────── */
	.sambutan {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 32px;
		flex-wrap: wrap;
		margin-bottom: 30px;
	}
	.sambutan h1 { font-size: clamp(32px, 5vw, 52px); margin: 8px 0 12px; }
	.sambutan p {
		color: var(--abu);
		font-size: 15px;
		line-height: 1.6;
		max-width: 58ch;
	}
	.hitungan {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		background: var(--kuning);
		border: var(--rangka);
		border-radius: var(--lengkung);
		box-shadow: var(--bayang-kecil);
		padding: 14px 22px;
		text-align: center;
	}
	.angka-hitungan {
		font-family: var(--judul);
		font-size: 34px;
		font-weight: 800;
		letter-spacing: -0.04em;
		line-height: 1;
	}

	/* ── kartu sertifikat ──────────────────────────────────────────── */
	.sertifikat {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		gap: 0;
		padding: 0;
		overflow: hidden;
		margin-bottom: 22px;
	}
	.pratinjau {
		background: var(--biru);
		border-right: var(--rangka);
		padding: 22px;
		display: flex;
		align-items: center;
	}
	.pratinjau.ditarik { background: var(--awas-bg); }
	.pratinjau iframe {
		display: block;
		width: 100%;
		aspect-ratio: 842 / 595;
		border: var(--rangka);
		border-radius: 6px;
		background: var(--putih);
		box-shadow: var(--bayang);
	}

	.rinci { padding: 22px 24px; display: flex; flex-direction: column; }
	.atas {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
	}
	.rinci h2 { font-size: clamp(21px, 2.4vw, 28px); }
	.penyelenggara {
		color: var(--abu);
		font-size: 13.5px;
		margin: 7px 0 18px;
	}
	.peringatan { margin-bottom: 18px; }
	.rinci dl.rincian { grid-template-columns: minmax(110px, 150px) 1fr; }

	.aksi {
		display: flex;
		gap: 9px;
		flex-wrap: wrap;
		margin-top: auto;
		padding-top: 22px;
	}

	/* ── penjelasan dua kolom ──────────────────────────────────────── */
	.penjelasan {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30px;
		background: var(--hitam);
		color: var(--putih);
	}
	.tanda {
		display: inline-grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--kuning);
		color: var(--hitam);
		font-size: 15px;
		font-weight: 800;
		margin-bottom: 11px;
	}
	.kolom-jelas h3 { margin-bottom: 8px; }
	.kolom-jelas p { font-size: 13.5px; line-height: 1.6; color: #B9B9B4; }

	@media (max-width: 860px) {
		.sertifikat { grid-template-columns: 1fr; }
		.pratinjau { border-right: 0; border-bottom: var(--rangka); }
		.penjelasan { grid-template-columns: 1fr; gap: 24px; }
	}
</style>
