<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	import MockupSertifikat from '$lib/components/MockupSertifikat.svelte';
	import PohonMerkle from '$lib/components/PohonMerkle.svelte';
	let { data } = $props();
	let q = $state(data.kueri);
</script>

<!-- ══ HERO ══════════════════════════════════════════════════ -->
<section class="hero">
	<div class="wadah hero-isi">
		<div class="hero-teks">
			<span class="label-atas">Verifikasi sertifikat</span>
			<h1>Pastikan sertifikat itu asli</h1>
			<p class="hero-sub">
				Masukkan nomor sertifikat atau nama penerima. Keasliannya diperiksa
				langsung ke catatan permanen yang tidak dapat diubah siapa pun —
				termasuk oleh penerbitnya.
			</p>

			<form class="pencarian">
				<input name="q" bind:value={q} placeholder="Nomor sertifikat atau nama penerima" />
				<button class="tombol" type="submit">Cari sertifikat</button>
			</form>

			<p class="mungil catatan-hero">Tanpa akun · Tanpa dompet kripto · Tanpa memasang apa pun</p>
		</div>

		<div class="hero-gambar">
			<MockupSertifikat miring={-3.5} />
			<span class="stiker">Terverifikasi<br />di blockchain</span>
		</div>
	</div>

	<!-- kartu bertumpuk di tepi bawah hero -->
	<div class="wadah">
		<div class="jajar-kartu">
			<a class="kartu-berita" href="/onchain">
				<div class="atas">
					<div class="tag-baris"><span class="pil">catatan</span><span class="pil netral">publik</span></div>
					<span class="panah">→</span>
				</div>
				<span class="judul-kartu">Lihat catatan penerbitan langsung di blockchain</span>
				<div class="bawah"><span>Bukti on-chain</span><span>Buka</span></div>
			</a>

			<a class="kartu-berita kuning" href="/explorer">
				<div class="atas">
					<div class="tag-baris"><span class="pil">explorer</span></div>
					<span class="panah">→</span>
				</div>
				<span class="judul-kartu">Telusuri transaksi, blok, dan alamat kontrak</span>
				<div class="bawah"><span>Explorer bawaan</span><span>Buka</span></div>
			</a>

			<a class="kartu-berita" href="/masuk">
				<div class="atas">
					<div class="tag-baris"><span class="pil">penyelenggara</span></div>
					<span class="panah">→</span>
				</div>
				<span class="judul-kartu">Terbitkan sertifikat kegiatan Anda sendiri</span>
				<div class="bawah"><span>Panel admin</span><span>Masuk</span></div>
			</a>

			<a class="kartu-berita gelap" href="/portal">
				<div class="atas">
					<div class="tag-baris"><span class="pil netral">peserta</span></div>
					<span class="panah">→</span>
				</div>
				<span class="judul-kartu">Ambil dan bagikan sertifikat milik Anda</span>
				<div class="bawah"><span>Portal peserta</span><span>Masuk</span></div>
			</a>
		</div>
	</div>
</section>

<!-- ══ HASIL PENCARIAN ═══════════════════════════════════════ -->
{#if data.kueri}
	<section class="wadah blok-hasil">
		{#if data.hasil.length === 0}
			<div class="kabar awas">
				Tidak ditemukan sertifikat untuk <strong>{data.kueri}</strong>.
				Periksa kembali ejaan nama atau nomor sertifikatnya.
			</div>
		{:else}
			<h2>{data.hasil.length} sertifikat ditemukan</h2>
			<div class="kisi-hasil">
				{#each data.hasil as s (s.id)}
					<a class="kartu-berita" href="/verify/{s.id}">
						<div class="atas">
							<div class="tag-baris"><span class="pil kuning">sertifikat</span></div>
							<span class="panah">→</span>
						</div>
						<span class="judul-kartu">{s.nama}</span>
						<div class="bawah"><span class="mono">{s.id.slice(0, 18)}…</span><span>Periksa</span></div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<!-- ══ FITUR 1 — gambar kiri ═════════════════════════════════ -->
<section class="wadah">
	<div class="fitur">
		<div class="fitur-gambar">
			<MockupSertifikat miring={2.5} />
		</div>
		<div class="fitur-teks">
			<span class="label-atas">Tahan manipulasi</span>
			<h2>Ubah satu huruf, langsung ketahuan</h2>
			<p>
				Setiap sertifikat punya sidik jari digital. Mengubah satu huruf saja
				pada nama, tanggal, atau nama kegiatan akan mengubah sidik jarinya
				sehingga tidak lagi cocok dengan catatan di blockchain.
			</p>
			<a class="tombol" href="/onchain">Lihat buktinya</a>
		</div>
	</div>
</section>

<!-- ══ BLOK BIRU + DIAGRAM MERKLE ════════════════════════════ -->
<section class="blok-biru sobek">
	<div class="wadah">
		<div class="biru-kepala">
			<div>
				<h2>Satu transaksi untuk berapa pun peserta</h2>
				<p class="biru-sub">
					Delapan, delapan ribu, atau delapan ratus ribu sertifikat diringkas
					bertingkat menjadi satu sidik jari sepanjang 32 bita. Hanya itu yang
					dicatat ke blockchain.
				</p>
				<a class="tombol putih" href="/onchain">Lihat catatannya</a>
			</div>

			<div class="kisi-angka">
				<div class="kartu angka-kartu">
					<span class="angka-besar">50.932</span>
					<span class="kecil">gas untuk 10 maupun 1.000.000 sertifikat</span>
				</div>
				<div class="kartu angka-kartu">
					<span class="angka-besar">32 bita</span>
					<span class="kecil">data yang tersimpan di blockchain</span>
				</div>
				<div class="kartu angka-kartu">
					<span class="angka-besar">0</span>
					<span class="kecil">data pribadi peserta yang dicatat</span>
				</div>
			</div>
		</div>

		<div class="kartu diagram">
			<PohonMerkle />
		</div>
	</div>
</section>

<!-- ══ FITUR 2 — gambar kanan ════════════════════════════════ -->
<section class="wadah">
	<div class="fitur balik">
		<div class="fitur-teks">
			<span class="label-atas">Cara kerjanya</span>
			<h2>Tiga langkah, tanpa istilah rumit</h2>
			<ol class="langkah-besar">
				<li>
					<span class="urut">1</span>
					<div>
						<h3>Penyelenggara menerbitkan</h3>
						<p class="kecil redup">Unggah daftar peserta, sistem menyiapkan seluruh sertifikat dan mencatatnya sekali jalan.</p>
					</div>
				</li>
				<li>
					<span class="urut">2</span>
					<div>
						<h3>Peserta menerima</h3>
						<p class="kecil redup">Sertifikat siap diunduh sebagai PDF lengkap dengan kode QR verifikasi.</p>
					</div>
				</li>
				<li>
					<span class="urut">3</span>
					<div>
						<h3>Siapa pun memeriksa</h3>
						<p class="kecil redup">Pemeriksaan berjalan di perangkat pemeriksa, membaca langsung ke blockchain.</p>
					</div>
				</li>
			</ol>
		</div>
		<div class="fitur-gambar">
			<div class="kartu papan-periksa">
				<div class="baris-periksa"><span class="tanda ok">✓</span><span>Membaca isi sertifikat</span></div>
				<div class="baris-periksa"><span class="tanda ok">✓</span><span>Menghubungi catatan di blockchain</span></div>
				<div class="baris-periksa"><span class="tanda ok">✓</span><span>Mencocokkan dengan catatan resmi</span></div>
				<div class="baris-periksa"><span class="tanda ok">✓</span><span>Memeriksa status penarikan</span></div>
				<div class="vonis-contoh">
					<strong>Sertifikat ini asli</strong>
					<span class="kecil">Cocok dengan catatan resmi dan masih berlaku.</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ══ PENERBITAN TERBARU ════════════════════════════════════ -->
{#if !data.ada}
	<section class="wadah blok-akhir">
		<div class="kartu kosong">
			<h2>Belum ada sertifikat yang diterbitkan</h2>
			<p class="kecil redup">
				Sistem ini siap dipakai. Penyelenggara dapat masuk lalu membuat kegiatan
				pertama dan mengunggah daftar pesertanya.
			</p>
			<a class="tombol" href="/masuk">Masuk sebagai penyelenggara</a>
		</div>
	</section>
{:else}
	<section class="wadah blok-akhir">
		<div class="kepala-blok">
			<h2>Penerbitan terbaru</h2>
			<a class="tombol putih" href="/onchain">Catatan lengkap</a>
		</div>

		<div class="kisi-terbaru">
			<article class="kartu utama">
				<div class="tag-baris">
					<span class="pil">{data.batch.penyelenggara}</span>
					<span class="pil netral">{data.batch.tanggalKegiatan}</span>
				</div>
				<h3 class="judul-kegiatan">{data.batch.namaKegiatan}</h3>
				<dl class="rincian">
					<dt>Nomor pencatatan</dt>
					<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId} potong /></dd>
					<dt>Kontrak</dt>
					<dd><Hash nilai={data.jaringan.kontrak} jenis="alamat" chainId={data.jaringan.chainId} potong /></dd>
					<dt>Jaringan</dt>
					<dd>{data.jaringan.nama}</dd>
				</dl>
			</article>

			<div class="kisi-kecil">
				<div class="kartu-berita kuning statis">
					<span class="angka-besar">{data.batch.jumlah.toLocaleString('id-ID')}</span>
					<span class="kecil">sertifikat terbit pada kegiatan ini</span>
				</div>
				<div class="kartu-berita statis">
					<span class="angka-besar">1</span>
					<span class="kecil">kali pencatatan ke blockchain</span>
				</div>
				<div class="kartu-berita gelap statis">
					<span class="angka-besar">Tidak ada</span>
					<span class="kecil">data pribadi peserta tercatat</span>
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	/* ── hero ─────────────────────────────────────────────── */
	.hero { background: var(--putih); border-bottom: var(--rangka); padding-bottom: 0; }
	.hero-isi {
		display: grid;
		grid-template-columns: 1.05fr 0.95fr;
		gap: 56px;
		align-items: center;
		padding-top: 60px;
		padding-bottom: 52px;
	}
	.hero-teks h1 { margin: 12px 0 20px; }
	.hero-sub { font-size: 17.5px; line-height: 1.58; color: var(--abu); max-width: 48ch; }
	.pencarian { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
	.pencarian input { flex: 1; min-width: 230px; font-size: 15.5px; padding: 14px 17px; }
	.catatan-hero { margin-top: 13px; color: var(--abu); font-weight: 600; }

	.hero-gambar { position: relative; }
	.stiker {
		position: absolute;
		right: -6px;
		bottom: 8px;
		background: var(--kuning);
		border: var(--rangka);
		border-radius: 999px;
		box-shadow: var(--bayang-kecil);
		padding: 12px 18px;
		font-size: 12.5px;
		font-weight: 800;
		line-height: 1.25;
		text-align: center;
		transform: rotate(7deg);
	}

	.jajar-kartu {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 14px;
		transform: translateY(38px);
	}

	/* ── hasil ────────────────────────────────────────────── */
	.blok-hasil { padding-top: 72px; }
	.blok-hasil h2 { margin-bottom: 20px; }
	.kisi-hasil { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }

	/* ── fitur ────────────────────────────────────────────── */
	.fitur { padding-top: 96px; }
	.langkah-besar { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 20px; }
	.langkah-besar li { display: flex; gap: 14px; align-items: flex-start; }
	.urut {
		display: grid;
		place-items: center;
		flex: 0 0 34px;
		height: 34px;
		background: var(--kuning);
		border: var(--rangka);
		border-radius: 999px;
		font-family: var(--judul);
		font-weight: 800;
		font-size: 15px;
	}
	.langkah-besar h3 { margin-bottom: 4px; }

	.papan-periksa { display: flex; flex-direction: column; gap: 12px; }
	.baris-periksa { display: flex; align-items: center; gap: 11px; font-size: 14px; font-weight: 600; }
	.tanda {
		display: grid; place-items: center;
		flex: 0 0 24px; height: 24px;
		border: var(--rangka-tipis); border-radius: 999px;
		font-size: 12px; font-weight: 800;
	}
	.tanda.ok { background: var(--sah-bg); color: var(--sah); }
	.vonis-contoh {
		display: flex; flex-direction: column; gap: 2px;
		background: var(--sah-bg);
		border: var(--rangka); border-radius: var(--lengkung);
		padding: 14px 16px; margin-top: 6px;
	}
	.vonis-contoh strong { font-size: 16px; }

	/* ── blok biru ────────────────────────────────────────── */
	.biru-kepala { display: grid; grid-template-columns: 1.05fr 1fr; gap: 46px; align-items: center; margin-bottom: 40px; }
	.biru-kepala h2 { margin-bottom: 16px; }
	.biru-sub { font-size: 16.5px; line-height: 1.6; margin-bottom: 26px; max-width: 46ch; }
	.kisi-angka { display: flex; flex-direction: column; gap: 13px; }
	.angka-kartu { display: flex; flex-direction: column; gap: 2px; padding: 16px 20px; }
	.angka-besar {
		font-family: var(--judul);
		font-size: 30px;
		font-weight: 800;
		letter-spacing: -0.04em;
		line-height: 1.05;
	}
	.diagram { padding: 30px 26px; overflow-x: auto; }

	/* ── terbaru ──────────────────────────────────────────── */
	.blok-akhir { padding-top: 24px; }
	.kepala-blok {
		display: flex; align-items: center; justify-content: space-between;
		gap: 16px; margin-bottom: 22px; flex-wrap: wrap;
	}
	.kisi-terbaru { display: grid; grid-template-columns: 1.35fr 1fr; gap: 16px; align-items: start; }
	.tag-baris { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
	.judul-kegiatan { font-size: clamp(21px, 3.2vw, 32px); margin-bottom: 22px; }
	.kisi-kecil { display: flex; flex-direction: column; gap: 14px; }
	.kartu-berita.statis { cursor: default; }
	.kartu-berita.statis:hover { transform: none; box-shadow: var(--bayang); }

	.kosong { text-align: center; padding: 52px 28px; border-style: dashed; }
	.kosong h2 { margin-bottom: 12px; }
	.kosong p { max-width: 46ch; margin: 0 auto 22px; }

	@media (max-width: 980px) {
		.hero-isi { grid-template-columns: 1fr; gap: 36px; }
		.jajar-kartu { grid-template-columns: repeat(2, 1fr); }
		.biru-kepala, .kisi-terbaru { grid-template-columns: 1fr; gap: 30px; }
	}
	@media (max-width: 620px) {
		.hero-isi { padding-top: 40px; padding-bottom: 36px; }
		.jajar-kartu { grid-template-columns: 1fr; transform: translateY(28px); }
		.fitur { padding-top: 66px; }
		.stiker { right: 4px; bottom: -10px; padding: 9px 14px; font-size: 11.5px; }
	}
</style>
