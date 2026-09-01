<script lang="ts">
	import '../../app.css';
	import { page } from '$app/state';
	import { LABEL_PERAN } from '$lib/peran';
	let { children, data } = $props();

	const menu = [
		{ jalur: '/admin', label: 'Ringkasan' },
		{ jalur: '/admin/kegiatan', label: 'Kegiatan' },
		{ jalur: '/admin/sertifikat', label: 'Sertifikat Terbit' },
		{ jalur: '/admin/desain', label: 'Desain Sertifikat' },
		{ jalur: '/onchain', label: 'Catatan Blockchain' }
	];
	const aktif = (j: string) => page.url.pathname === j;
</script>

<div class="tata">
	<aside>
		<a href="/" class="merek">
			<span class="lambang">✓</span>
			<span>
				<span class="nama">TERA</span>
				<span class="mungil redup peran-merek">Penyelenggara</span>
			</span>
		</a>

		<nav>
			{#each menu as m}
				<a href={m.jalur} class:aktif={aktif(m.jalur)}>{m.label}</a>
			{/each}
		</nav>

		<div class="kaki">
			<div class="akun">
				<span class="nama-akun">{data.pengguna.nama}</span>
				<span class="pil kuning">{LABEL_PERAN[data.pengguna.peran]}</span>
			</div>
			{#if !data.kewenangan.cabut}
				<p class="mungil batas">
					Peran Anda tidak berwenang menerbitkan atau menarik sertifikat.
				</p>
			{/if}
			<form method="POST" action="/keluar">
				<button class="tombol putih mini lebar" type="submit">Keluar</button>
			</form>
		</div>

		<div class="pita-tegak sisi-pita"><i></i><i></i><i></i><i></i><i></i></div>
	</aside>

	<main>
		<div class="isi">{@render children()}</div>
	</main>
</div>

<style>
	.tata { display: grid; grid-template-columns: 252px 1fr; min-height: 100vh; }

	aside {
		position: sticky;
		top: 0;
		height: 100vh;
		background: var(--putih);
		border-right: var(--rangka);
		padding: 22px 16px;
		display: flex;
		flex-direction: column;
		gap: 26px;
	}
	.sisi-pita { position: absolute; top: 0; bottom: 0; right: -7px; width: 5px; }

	.merek { display: flex; align-items: center; gap: 10px; text-decoration: none; padding: 0 6px; }
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
		flex: 0 0 auto;
	}
	.nama { display: block; font-family: var(--judul); font-size: 20px; font-weight: 800; letter-spacing: 0.02em; line-height: 1.05; }
	.peran-merek { display: block; }

	nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
	nav a {
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		padding: 9px 12px;
		border: 2px solid transparent;
		border-radius: var(--lengkung-kecil);
	}
	nav a:hover { background: var(--abu-muda); }
	nav a.aktif {
		background: var(--kuning);
		border: var(--rangka);
		box-shadow: 2px 2px 0 var(--hitam);
	}

	.kaki { border-top: var(--rangka-tipis); padding-top: 16px; }
	.akun { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 0 4px 12px; }
	.nama-akun { font-size: 14px; font-weight: 700; }
	.batas {
		background: var(--awas-bg);
		border: var(--rangka-tipis);
		border-radius: var(--lengkung-kecil);
		padding: 8px 10px;
		margin-bottom: 10px;
	}
	.tombol.lebar { width: 100%; }

	main { background: var(--kertas); min-width: 0; }
	.isi { padding: 32px 34px 72px; max-width: 1000px; }

	@media (max-width: 900px) {
		.tata { grid-template-columns: 1fr; }
		aside {
			position: static;
			height: auto;
			border-right: 0;
			border-bottom: var(--rangka);
			flex-direction: row;
			align-items: center;
			flex-wrap: wrap;
			gap: 14px;
		}
		.sisi-pita { display: none; }
		nav { flex-direction: row; flex-wrap: wrap; flex: 1 1 100%; }
		.kaki { border-top: 0; padding-top: 0; display: flex; align-items: center; gap: 12px; }
		.akun { flex-direction: row; align-items: center; padding: 0; }
		.batas { display: none; }
		.isi { padding: 24px 18px 56px; }
	}
</style>
