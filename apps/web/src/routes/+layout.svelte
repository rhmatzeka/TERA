<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	let { children, data } = $props();

	const diArea = $derived(
		page.url.pathname.startsWith('/admin') ||
		page.url.pathname.startsWith('/portal') ||
		page.url.pathname.startsWith('/explorer')
	);
</script>

{#if diArea}
	{@render children()}
{:else}
	<div class="situs">
		<!-- bilah tipis paling atas -->
		<div class="bilah">
			<div class="wadah bilah-isi">
				<span>Tanda Elektronik Resmi Autentik</span>
				<span class="bilah-kanan">
					<a href="/onchain">Catatan Blockchain</a>
					<a href="/explorer">Explorer</a>
				</span>
			</div>
		</div>

		<header>
			<div class="wadah kepala-isi">
				<a href="/" class="merek">
					<span class="lambang">✓</span>
					<span class="nama">TERA</span>
					<span class="slogan">Sertifikat Digital</span>
				</a>

				<nav>
					<a href="/onchain" class:aktif={page.url.pathname === '/onchain'}>Catatan Blockchain</a>
					{#if data.pengguna}
						<a class="tombol mini" href={data.pengguna.peran === 'peserta' ? '/portal' : '/admin'}>
							{data.pengguna.peran === 'peserta' ? 'Portal Saya' : 'Dashboard'}
						</a>
					{:else}
						<a class="tombol mini" href="/masuk">Masuk</a>
					{/if}
				</nav>
			</div>
			<div class="pita"><i></i><i></i><i></i><i></i><i></i></div>
		</header>

		<main>{@render children()}</main>

		<footer>
			<div class="pita"><i></i><i></i><i></i><i></i><i></i></div>

			<div class="wadah kaki-atas">
				<div class="kaki-merek">
					<span class="lambang besar">✓</span>
					<div>
						<span class="nama">TERA</span>
						<p class="mungil">Tanda Elektronik Resmi Autentik</p>
					</div>
				</div>
				<p class="kaki-teks">
					Sertifikat yang diterbitkan melalui TERA dicatat permanen di blockchain
					sehingga keasliannya dapat diperiksa siapa pun, kapan pun, tanpa
					bergantung pada server penyelenggara. Tidak ada data pribadi peserta
					yang tersimpan di blockchain.
				</p>
			</div>

			<div class="kaki-kolom-bungkus">
				<div class="wadah kaki-kolom">
					<div>
						<h4>Verifikasi</h4>
						<a href="/">Cari sertifikat</a>
						<a href="/onchain">Catatan blockchain</a>
						<a href="/explorer">Explorer</a>
					</div>
					<div>
						<h4>Penyelenggara</h4>
						<a href="/masuk">Masuk</a>
						<a href="/admin/kegiatan">Kegiatan</a>
						<a href="/admin/desain">Desain sertifikat</a>
					</div>
					<div>
						<h4>Peserta</h4>
						<a href="/masuk">Masuk portal</a>
						<a href="/portal">Sertifikat saya</a>
					</div>
					<div>
						<h4>Tentang</h4>
						<span class="baris-kaki">Merkle Tree · Keccak-256</span>
						<span class="baris-kaki">Blockchain Monad</span>
						<span class="baris-kaki">Nol data pribadi on-chain</span>
					</div>
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	.situs { display: flex; flex-direction: column; min-height: 100vh; }

	/* ── bilah atas ─────────────────────────────────────────── */
	.bilah {
		background: var(--hitam);
		color: var(--putih);
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.bilah-isi {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		height: 32px;
	}
	.bilah-kanan { display: flex; gap: 18px; }
	.bilah a { color: var(--putih); text-decoration: none; opacity: .8; }
	.bilah a:hover { opacity: 1; text-decoration: underline; }

	/* ── kepala ─────────────────────────────────────────────── */
	header { background: var(--putih); border-bottom: var(--rangka); }
	.kepala-isi {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding-top: 16px;
		padding-bottom: 16px;
	}
	.merek { display: flex; align-items: center; gap: 10px; text-decoration: none; }
	.lambang {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		background: var(--kuning);
		border: var(--rangka);
		border-radius: 9px;
		box-shadow: 2px 2px 0 var(--hitam);
		font-size: 17px;
		font-weight: 800;
	}
	.lambang.besar { width: 40px; height: 40px; font-size: 20px; }
	.nama {
		font-family: var(--judul);
		font-size: 23px;
		font-weight: 800;
		letter-spacing: 0.02em;
		line-height: 1;
	}
	.slogan {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--abu);
		border-left: 1.5px solid var(--abu-garis);
		padding-left: 10px;
	}

	nav { display: flex; align-items: center; gap: 8px; }
	nav > a:not(.tombol) {
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		padding: 8px 12px;
		border-radius: 999px;
	}
	nav > a:not(.tombol):hover, nav > a.aktif { background: var(--abu-muda); }

	main { flex: 1; }

	/* ── kaki ───────────────────────────────────────────────── */
	footer { background: var(--hitam); color: var(--putih); margin-top: 84px; }
	.kaki-atas {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 48px;
		padding-top: 46px;
		padding-bottom: 40px;
		align-items: start;
	}
	.kaki-merek { display: flex; align-items: center; gap: 13px; }
	.kaki-merek .nama { display: block; }
	.kaki-merek p { color: #A6A6A6; margin-top: 2px; }
	.kaki-teks { font-size: 13.5px; line-height: 1.68; color: #C9C9C9; max-width: 62ch; }

	.kaki-kolom-bungkus { border-top: 1.5px solid #2C2C2C; }
	.kaki-kolom {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 32px;
		padding-top: 34px;
		padding-bottom: 44px;
	}
	.kaki-kolom h4 {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--kuning);
		margin-bottom: 14px;
	}
	.kaki-kolom div { display: flex; flex-direction: column; gap: 9px; }
	.kaki-kolom a { font-size: 13.5px; font-weight: 600; color: var(--putih); text-decoration: none; }
	.kaki-kolom a:hover { color: var(--kuning); }
	.baris-kaki { font-size: 13px; color: #A6A6A6; }

	@media (max-width: 860px) {
		.kaki-atas { grid-template-columns: 1fr; gap: 24px; }
		.kaki-kolom { grid-template-columns: repeat(2, 1fr); gap: 26px; }
	}
	@media (max-width: 560px) {
		.slogan { display: none; }
		.bilah-isi > span:first-child { display: none; }
		.bilah-isi { justify-content: flex-end; }
	}
</style>
