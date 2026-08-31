<script lang="ts">
	import { page } from '$app/state';
	import { LABEL_PERAN } from '$lib/peran';
	let { children, data } = $props();

	const menu = [
		{ jalur: '/admin', label: 'Ringkasan', ikon: '▤' },
		{ jalur: '/admin/kegiatan', label: 'Kegiatan', ikon: '⊞' },
		{ jalur: '/admin/sertifikat', label: 'Sertifikat Terbit', ikon: '☰' },
		{ jalur: '/admin/desain', label: 'Desain Sertifikat', ikon: '🖼' },
		{ jalur: '/onchain', label: 'Catatan Blockchain', ikon: '⛓' }
	];
	const aktif = (j: string) => page.url.pathname === j;
</script>

<div class="tata">
	<aside>
		<a href="/" class="merek">
			<span class="lambang">✓</span>
			<span class="nama">TERA</span>
			<span class="sub-merek">Penyelenggara</span>
		</a>

		<nav>
			{#each menu as m}
				<a href={m.jalur} class:aktif={aktif(m.jalur)}>
					<span class="ikon">{m.ikon}</span>{m.label}
				</a>
			{/each}
		</nav>

		<div class="kaki">
			<div class="akun">
				<span class="nama">{data.pengguna.nama}</span>
				<span class="peran">{LABEL_PERAN[data.pengguna.peran]}</span>
			</div>
			{#if !data.kewenangan.cabut}
				<p class="batas">
					Peran Anda tidak berwenang mencabut sertifikat. Hanya Penandatangan yang dapat
					mengirim transaksi.
				</p>
			{/if}
			<form method="POST" action="/keluar"><button type="submit">Keluar</button></form>
		</div>
	</aside>

	<main>{@render children()}</main>
</div>

<style>
	.tata { display: grid; grid-template-columns: 236px 1fr; min-height: 100vh; }
	aside {
		background: var(--kartu); border-right: 1px solid var(--garis);
		padding: 18px 14px; display: flex; flex-direction: column; gap: 22px;
		position: sticky; top: 0; height: 100vh;
	}
	.merek { display: flex; align-items: baseline; gap: 7px; color: var(--tx); text-decoration: none; padding: 0 6px; }
	.merek .lambang { align-self: center; }
	.nama { font-weight: 700; font-size: 15px; letter-spacing: 0.06em; }
	.sub-merek { font-size: 11.5px; color: var(--redup); }
	.lambang { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: var(--aksen); color: #fff; font-size: 13px; flex: 0 0 auto; }
	nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
	nav a {
		display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px;
		font-size: 13px; color: var(--redup); text-decoration: none;
	}
	nav a:hover { background: color-mix(in srgb, var(--tx) 6%, transparent); color: var(--tx); }
	nav a.aktif { background: color-mix(in srgb, var(--aksen) 14%, transparent); color: var(--aksen); font-weight: 550; }
	.ikon { font-size: 12px; width: 14px; text-align: center; }
	.kaki { border-top: 1px solid var(--garis); padding-top: 14px; }
	.akun { display: flex; flex-direction: column; padding: 0 6px 10px; }
	.nama { font-size: 13px; font-weight: 550; }
	.peran { font-size: 11.5px; color: var(--redup); }
	.batas { font-size: 11px; color: var(--redup); background: var(--warn-bg); color: var(--warn-tx); border: 1px solid var(--warn-garis); border-radius: 7px; padding: 7px 9px; margin: 0 0 10px; line-height: 1.45; }
	.kaki button {
		width: 100%; background: transparent; color: var(--redup); border: 1px solid var(--garis);
		border-radius: 8px; padding: 7px; font-size: 12.5px; cursor: pointer;
	}
	.kaki button:hover { color: var(--tx); }
	main { padding: 28px 30px 60px; max-width: 940px; }
	@media (max-width: 800px) {
		.tata { grid-template-columns: 1fr; }
		aside { position: static; height: auto; flex-direction: row; align-items: center; flex-wrap: wrap; border-right: 0; border-bottom: 1px solid var(--garis); }
		nav { flex-direction: row; flex-wrap: wrap; flex: 1 1 100%; }
		.kaki { border-top: 0; padding-top: 0; display: flex; gap: 10px; align-items: center; }
		.batas { display: none; }
		main { padding: 20px; }
	}
</style>
