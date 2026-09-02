<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	import { formatBiaya } from '$lib/biaya';
	import { formatWaktu, tampakWaktu } from '$lib/waktu';

	let { data } = $props();

	const kurs = $derived(data.kurs ?? { simbol: 'ETH', hargaIdr: null });
	const angka = (n: string | number) => Number(n).toLocaleString('id-ID');

	/**
	 * Daftar data pribadi yang sengaja TIDAK pernah dikirim ke rantai.
	 * Ditulis eksplisit karena inilah dasar kepatuhan pada UU PDP.
	 */
	const tanpaData = [
		'Nama peserta',
		'Nomor induk mahasiswa',
		'Alamat surel',
		'Tanggal lahir',
		'Foto atau tanda tangan',
		'Berkas PDF sertifikat'
	];
</script>

<section class="kop">
	<div class="wadah kop-isi">
		<div class="kop-teks">
			<span class="label-atas terang">Bukti on-chain</span>
			<h1>Bukti di Blockchain</h1>
			<p>
				Seluruh angka di halaman ini dibaca langsung dari node blockchain lewat RPC
				pada saat halaman dibuka — bukan dari basis data aplikasi. Muat ulang halaman,
				dan datanya diambil ulang dari rantai.
			</p>

			{#if data.ada && data.explorer}
				<div class="baris g12">
					<a class="tombol" href="{data.explorer.url}/tx/{data.batch.txHash}"
						target="_blank" rel="noopener">Lihat transaksi di {data.explorer.nama} ↗</a>
					<a class="tombol putih" href="{data.explorer.url}/address/{data.jaringan.kontrak}"
						target="_blank" rel="noopener">Lihat kontrak ↗</a>
				</div>
			{/if}
		</div>

		{#if data.ada}
			<aside class="kartu-jaringan">
				<span class="label-atas">Sumber data</span>
				<p class="nama-jaringan">{data.jaringan.nama}</p>
				<dl class="rincian">
					<dt>Chain ID</dt><dd class="mono">{data.jaringan.chainId}</dd>
					<dt>Node RPC</dt><dd class="mono putus">{data.jaringan.rpcUrl}</dd>
					<dt>Sambungan</dt>
					<dd>
						<span class="pil {data.galat ? 'bahaya' : 'sah'}">
							{data.galat ? 'gagal' : 'terbaca'}
						</span>
					</dd>
				</dl>
			</aside>
		{/if}
	</div>
	<div class="pita"><i></i><i></i><i></i><i></i><i></i></div>
</section>

<div class="wadah halaman">
	{#if !data.ada}
		<div class="kabar awas">
			<strong>Belum ada batch yang diterbitkan.</strong>
			Karena itu belum ada bukti on-chain untuk ditampilkan. Penyelenggara dapat
			menerbitkan batch pertama melalui panel admin.
		</div>
	{:else if data.galat}
		<div class="kabar bahaya">
			<strong>Tidak dapat terhubung ke node.</strong>
			{data.jaringan.rpcUrl} — {data.galat}
		</div>
	{:else if data.rantai}
		<div class="kisi-stat statistik">
			<div class="kartu stat">
				<span class="label-atas">Sertifikat dalam batch</span>
				<span class="angka-besar">{angka(data.batch.jumlah)}</span>
				<span class="mungil redup">diterbitkan sekali kirim</span>
			</div>
			<div class="kartu stat kuning">
				<span class="label-atas">Tersimpan di rantai</span>
				<span class="angka-besar">32 byte</span>
				<span class="mungil">satu Merkle root, berapa pun jumlahnya</span>
			</div>
			<div class="kartu stat">
				<span class="label-atas">Gas terpakai</span>
				<span class="angka-besar">{angka(data.rantai.gasTerpakai)}</span>
				<span class="mungil redup">tidak tumbuh mengikuti jumlah peserta</span>
			</div>
			<div class="kartu stat">
				<span class="label-atas">Biaya transaksi</span>
				<span class="angka-besar kecil-angka">{formatBiaya(data.rantai.biayaWei, kurs)}</span>
				<span class="mungil redup">untuk seluruh batch</span>
			</div>
		</div>

		<section class="kartu blok">
			<header class="kepala-blok">
				<h2>Transaksi penerbitan</h2>
				<span class="pil {data.rantai.status === 'success' ? 'sah' : 'bahaya'}">
					{data.rantai.status === 'success' ? 'berhasil' : data.rantai.status}
				</span>
			</header>
			<p class="kecil redup batas-baca">
				Satu transaksi inilah yang menerbitkan seluruh batch. Isi dan biayanya tetap
				sama meskipun pesertanya sepuluh atau sejuta orang.
			</p>
			<dl class="rincian">
				<dt>Hash transaksi</dt>
				<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
				<dt>Blok</dt>
				<dd class="baris g8">
					<Hash nilai={data.rantai.nomorBlok} jenis="blok" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} />
					<span class="redup kecil">{formatWaktu(data.rantai.waktuBlok)}</span>
				</dd>
				<dt>Pengirim</dt>
				<dd><Hash nilai={data.rantai.dari} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
				<dt>Tujuan</dt>
				<dd>
					<Hash nilai={data.rantai.ke} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} />
					<span class="pil netral">kontrak</span>
				</dd>
				<dt>Urutan transaksi</dt><dd class="angka">{data.rantai.nonce}</dd>
				<dt>Gas terpakai</dt><dd class="angka">{angka(data.rantai.gasTerpakai)}</dd>
				<dt>Biaya</dt><dd class="angka">{formatBiaya(data.rantai.biayaWei, kurs)}</dd>
				<dt>Ukuran data kirim</dt><dd class="angka">{angka(data.rantai.calldataUkuran)} byte</dd>
				<dt>Nilai {kurs.simbol} dikirim</dt>
				<dd class="angka">{data.rantai.nilai === '0' ? 'nol' : `${data.rantai.nilai} wei`}</dd>
			</dl>
		</section>

		<section class="kartu blok">
			<header class="kepala-blok">
				<h2>Nilai tersimpan di kontrak</h2>
				<span class="pil netral">storage</span>
			</header>
			<p class="kecil redup batas-baca">
				Dibaca ulang dari kontrak dengan pemanggilan <code>rootBatch(idBatch)</code>.
				Inilah satu-satunya data yang benar-benar menempati storage blockchain untuk
				{angka(data.batch.jumlah)} sertifikat.
			</p>

			<div class="sorot-root">
				<div class="baris-root">
					<span class="label-atas">Merkle root tersimpan</span>
					<span class="pil {data.rantai.cocokDenganLokal ? 'sah' : 'bahaya'}">
						{data.rantai.cocokDenganLokal ? '✓ cocok dengan data lokal' : '✗ TIDAK cocok'}
					</span>
				</div>
				<p class="root-nilai mono">{data.rantai.rootTersimpan}</p>
				<p class="mungil redup">
					{#if data.rantai.cocokDenganLokal}
						Root yang dihitung ulang dari berkas sertifikat di server identik dengan
						root di blockchain. Artinya tidak ada satu pun sertifikat dalam batch ini
						yang berubah sejak diterbitkan.
					{:else}
						Root di blockchain berbeda dari hasil hitungan lokal. Data di server
						patut dicurigai telah berubah.
					{/if}
				</p>
			</div>

			<dl class="rincian">
				<dt>Alamat kontrak</dt>
				<dd><Hash nilai={data.jaringan.kontrak} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
				<dt>Kunci (idBatch)</dt>
				<dd><Hash nilai={data.batch.idOnchain} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
				<dt>Ukuran nilai</dt><dd class="angka">32 byte</dd>
				<dt>Ukuran bytecode kontrak</dt><dd class="angka">{angka(data.rantai.ukuranKode)} byte</dd>
			</dl>
		</section>

		<section class="kartu blok">
			<header class="kepala-blok">
				<h2>Peristiwa</h2>
				<span class="pil netral">event log</span>
			</header>
			<p class="kecil redup batas-baca">
				Keterangan kegiatan tidak dibaca oleh kontrak, sehingga tidak perlu menempati
				storage. Data seperti ini dicatat sebagai <em>event</em> — sekitar sepersepuluh
				harganya, tetap permanen, dan tetap dapat dibaca lewat RPC.
			</p>
			{#each data.peristiwa as p}
				<article class="peristiwa">
					<span class="nama-event">{p.nama}</span>
					<dl class="rincian">
						{#each Object.entries(p.argumen) as [k, v]}
							<dt class="mono">{k}</dt>
							<dd>
								{#if tampakWaktu(k, v)}
									{formatWaktu(v)}
									<span class="mungil redup">· {v}</span>
								{:else if String(v).startsWith('0x')}
									<Hash nilai={v} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} />
								{:else}
									{v}
								{/if}
							</dd>
						{/each}
					</dl>
				</article>
			{:else}
				<p class="kecil redup">Tidak ada event terbaca pada transaksi ini.</p>
			{/each}
		</section>

		<section class="kartu blok gelap">
			<header class="kepala-blok">
				<h2>Yang tidak ada di blockchain</h2>
				<span class="pil kuning">UU PDP No. 27/2022</span>
			</header>
			<p class="kecil batas-baca pucat">
				Periksa kembali seluruh data di atas — tidak ada satu pun keterangan pribadi
				peserta. Yang tersimpan hanya Merkle root sepanjang 32 byte untuk
				{angka(data.batch.jumlah)} sertifikat.
			</p>
			<ul class="tanpa">
				{#each tanpaData as item}
					<li><span class="silang">✗</span>{item}</li>
				{/each}
			</ul>
			<p class="kecil pucat batas-baca">
				Inilah yang membuat sistem ini patuh pada hak penghapusan data: berkas peserta
				dapat dihapus dari server kapan pun, karena data pribadi memang tidak pernah
				menyentuh blockchain. Yang tertinggal di rantai hanyalah angka acak sepanjang
				32 byte yang tidak dapat dibalik menjadi identitas siapa pun.
			</p>
		</section>
	{/if}
</div>

<style>
	/* ── kop hitam ─────────────────────────────────────────────────── */
	.kop {
		background: var(--hitam);
		color: var(--putih);
		padding-top: 54px;
	}
	.kop-isi {
		display: grid;
		grid-template-columns: 1fr minmax(260px, 340px);
		gap: 54px;
		align-items: start;
		padding-bottom: 84px;
	}
	.kop h1 { margin: 10px 0 16px; font-size: clamp(34px, 5.4vw, 60px); }
	.kop-teks p {
		font-size: 16px;
		line-height: 1.6;
		color: #B9B9B4;
		max-width: 52ch;
		margin-bottom: 26px;
	}
	.label-atas.terang { color: var(--kuning); }

	.kartu-jaringan {
		background: #1C1C1A;
		border: 2.5px solid #3A3A36;
		border-radius: var(--lengkung);
		padding: 18px;
	}
	.nama-jaringan {
		font-family: var(--judul);
		font-size: 21px;
		font-weight: 800;
		letter-spacing: -0.03em;
		margin: 6px 0 14px;
	}
	.kartu-jaringan dl.rincian { font-size: 12.5px; grid-template-columns: 84px 1fr; gap: 8px 12px; }
	.kartu-jaringan dl.rincian dt { color: #8C8C86; }
	.putus { overflow-wrap: anywhere; }

	/* ── isi halaman ───────────────────────────────────────────────── */
	/* kaki halaman sudah menyumbang margin-top 84px, jadi jarak di sini cukup kecil */
	.halaman { padding-bottom: 8px; }

	.statistik { margin-top: -52px; margin-bottom: 40px; }
	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 16px 18px;
	}
	.stat .angka-besar { margin-top: 2px; }
	.stat .angka-besar.kecil-angka { font-size: 19px; line-height: 1.25; }
	.stat.kuning { background: var(--kuning); }

	.blok { margin-bottom: 26px; }
	.kepala-blok {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		flex-wrap: wrap;
		margin-bottom: 10px;
	}
	.kepala-blok h2 { font-size: clamp(22px, 2.6vw, 30px); }
	.batas-baca { max-width: 68ch; margin-bottom: 20px; }

	/* ── sorotan Merkle root ───────────────────────────────────────── */
	.sorot-root {
		background: var(--kuning);
		border: var(--rangka);
		border-radius: var(--lengkung-kecil);
		padding: 15px 17px;
		margin-bottom: 22px;
	}
	.baris-root {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}
	.root-nilai {
		font-size: 13px;
		font-weight: 600;
		overflow-wrap: anywhere;
		margin-bottom: 8px;
	}

	/* ── peristiwa ─────────────────────────────────────────────────── */
	.peristiwa {
		border: var(--rangka-tipis);
		border-radius: var(--lengkung-kecil);
		background: var(--abu-muda);
		padding: 15px 17px;
	}
	.peristiwa + .peristiwa { margin-top: 12px; }
	.nama-event {
		display: inline-block;
		font-family: var(--mono);
		font-size: 12px;
		font-weight: 600;
		background: var(--hitam);
		color: var(--putih);
		border-radius: 999px;
		padding: 3px 11px;
		margin-bottom: 13px;
	}

	/* ── blok gelap penutup ────────────────────────────────────────── */
	.blok.gelap { background: var(--hitam); color: var(--putih); }
	.blok.gelap .pucat { color: #B9B9B4; }
	.tanpa {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 9px 22px;
		margin: 0 0 20px;
		padding: 0;
		font-size: 14px;
	}
	.tanpa li { display: flex; align-items: center; gap: 9px; }
	.silang {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		flex: 0 0 auto;
		border-radius: 50%;
		background: var(--kuning);
		color: var(--hitam);
		font-size: 12px;
		font-weight: 800;
	}

	code { font-family: var(--mono); font-size: 12.5px; }

	@media (max-width: 860px) {
		.kop-isi { grid-template-columns: 1fr; gap: 28px; padding-bottom: 72px; }
	}
	@media (max-width: 640px) {
		.statistik { margin-top: -44px; }
	}
</style>
