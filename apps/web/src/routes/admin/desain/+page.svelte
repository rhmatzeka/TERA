<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let namaBerkas = $state('');
	let sedang = $state(false);
</script>

<div class="kepala">
	<div>
		<h1>Desain Sertifikat</h1>
		<p class="sub">
			Unggah desain sertifikat Anda sendiri, lalu atur posisi nama dan
			keterangan lainnya di atasnya.
		</p>
	</div>
</div>

{#if form?.pesan}<div class="kabar bahaya">{form.pesan}</div>{/if}

<section class="kartu">
	<h2>Unggah desain baru</h2>
	<p class="kecil">
		Siapkan desain sertifikat dari Canva, Figma, atau Photoshop — <strong>tanpa
		nama peserta</strong>, karena nama akan diisi otomatis. Ekspor sebagai PNG
		atau JPG mendatar, disarankan lebar 1600–2480 piksel agar tajam saat dicetak.
	</p>

	<form method="POST" action="?/unggah" enctype="multipart/form-data"
		use:enhance={() => { sedang = true; return async ({ update }) => { await update(); sedang = false; }; }}>
		<div class="baris">
			<div class="ruas">
				<label for="nm">Nama desain</label>
				<input id="nm" name="nama" required placeholder="mis. Desain Seminar 2026" />
			</div>
		</div>

		<label class="jatuhkan">
			<input type="file" name="latar" accept="image/png,image/jpeg" required
				onchange={(e) => (namaBerkas = e.currentTarget.files?.[0]?.name ?? '')} />
			<span class="ikon">🖼</span>
			<span class="teks">{namaBerkas || 'Pilih gambar desain (PNG atau JPG)'}</span>
			<span class="mini">maksimal 8 MB</span>
		</label>

		<button class="tombol" type="submit" disabled={sedang}>{sedang ? 'Mengunggah…' : 'Unggah & atur posisi'}</button>
	</form>
</section>

<h2 class="judul-daftar">Desain tersimpan</h2>
<div class="galeri">
	{#each data.template as t (t.id)}
		<article class="kartu-desain">
			<div class="pratinjau">
				{#if t.berkasLatar}
					<img src="/admin/desain/{t.id}/latar" alt={t.nama} />
				{:else}
					<div class="bawaan-pratinjau"><span>Desain Bawaan</span></div>
				{/if}
			</div>
			<div class="info">
				<strong>{t.nama}</strong>
				<span class="mini">{t.lebar} × {t.tinggi} px · {t.ruas.length} ruas teks</span>
			</div>
			<div class="aksi">
				{#if t.bawaan}
					<span class="mini redup">Tidak dapat diubah</span>
				{:else}
					<a href="/admin/desain/{t.id}">Atur posisi</a>
					<form method="POST" action="?/hapus" use:enhance>
						<input type="hidden" name="id" value={t.id} />
						<button class="hapus tombol merah mini" type="submit">Hapus</button>
					</form>
				{/if}
			</div>
		</article>
	{/each}
</div>

<style>
	.kepala { margin-bottom: 20px;
	}
	h1 { font-size: 23px; margin: 0 0 4px;
	}
	h2 { font-size: 15px; margin: 0 0 8px;
	}
	.judul-daftar { margin: 26px 0 12px;
	}
	.sub { color: var(--redup); font-size: 13.5px; margin: 0; max-width: 60ch;
	}
	.kecil { font-size: 12.5px; color: var(--redup); line-height: 1.55; margin: 0 0 14px; max-width: 66ch;
	}
	.baris { margin-bottom: 12px;
	}
	input:not([type='file']) {
		width: 100%; padding: 9px 11px; border: 1px solid var(--garis); border-radius: 8px;
		background: var(--bg); color: var(--tx); font-size: 13.5px;
	}
	.jatuhkan {
		display: flex; flex-direction: column; align-items: center; gap: 4px;
		border: 1.5px dashed var(--garis); border-radius: 10px; padding: 24px;
		cursor: pointer; margin-bottom: 14px; text-align: center;
	}
	.jatuhkan input { display: none;
	}
	.jatuhkan .teks { font-size: 13.5px; font-weight: 520;
	}
	button:disabled { opacity: 0.55; cursor: default;
	}
	.galeri { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px;
	}
	.kartu-desain { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; overflow: hidden;
	}
	.pratinjau { aspect-ratio: 842 / 595; background: var(--bg); display: grid; place-items: center; overflow: hidden;
	}
	.pratinjau img { width: 100%; height: 100%; object-fit: cover;
	}
	.bawaan-pratinjau {
		width: 100%; height: 100%; display: grid; place-items: center;

		font-size: 12px; color: var(--redup);
	}
	.info { padding: 11px 13px 6px; display: flex; flex-direction: column; gap: 2px;
	}
	.aksi { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 13px 12px;
	}
	.aksi a { font-size: 12.5px; color: var(--aksen); text-decoration: none;
	}
	.hapus { background: transparent; color: var(--bad-tx); border: 1px solid var(--bad-garis); padding: 4px 10px; font-size: 12px;
	}
</style>

