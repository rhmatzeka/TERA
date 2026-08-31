<script lang="ts">
	import { page } from '$app/state';
	let { children, data } = $props();

	const diArea = $derived(
		page.url.pathname.startsWith('/admin') || page.url.pathname.startsWith('/portal')
	);
</script>

{#if diArea}
	{@render children()}
{:else}
	<div class="cangkang">
		<header>
			<a href="/" class="merek">
				<span class="lambang">✓</span>
				<span class="nama">TERA</span>
				<span class="sub-merek">Sertifikat Digital</span>
			</a>
			<nav>
				<a href="/onchain" class:aktif={page.url.pathname === '/onchain'}>Catatan Blockchain</a>
				{#if data.pengguna}
					<a class="tombol-nav" href={data.pengguna.peran === 'peserta' ? '/portal' : '/admin'}>
						{data.pengguna.peran === 'peserta' ? 'Portal Saya' : 'Dashboard'}
					</a>
				{:else}
					<a class="tombol-nav" href="/masuk">Masuk</a>
				{/if}
			</nav>
		</header>

		<main>{@render children()}</main>

		<footer>
			<strong>TERA</strong> — Tanda Elektronik Resmi Autentik.
			Keaslian sertifikat tercatat permanen; data pribadi tidak disimpan di blockchain.
		</footer>
	</div>
{/if}

<style>
	:global(*) { box-sizing: border-box; }
	:global(html) { color-scheme: light dark; }
	:global(body) {
		margin: 0;
		font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
		background: var(--bg); color: var(--tx); line-height: 1.55;
		-webkit-font-smoothing: antialiased;
	}
	:global(:root) {
		--bg: #f6f7f9; --kartu: #ffffff; --tx: #16181d; --redup: #676e7d;
		--garis: #e2e5ea; --aksen: #1f6feb;
		--ok-bg: #e8f6ec; --ok-tx: #12643a; --ok-garis: #9fd6b4;
		--bad-bg: #fdeceb; --bad-tx: #97231c; --bad-garis: #f0b3ae;
		--warn-bg: #fdf4e3; --warn-tx: #7a5312; --warn-garis: #e8cea0;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--bg: #0f1115; --kartu: #171a1f; --tx: #e9ecf1; --redup: #99a1b0;
			--garis: #282d35; --aksen: #58a6ff;
			--ok-bg: #10251a; --ok-tx: #79d2a2; --ok-garis: #22503a;
			--bad-bg: #2a1514; --bad-tx: #f3a49d; --bad-garis: #5b2a26;
			--warn-bg: #2a2113; --warn-tx: #e8c37a; --warn-garis: #5a4622;
		}
	}
	.cangkang { max-width: 960px; margin: 0 auto; padding: 0 20px 64px; }
	header {
		display: flex; align-items: center; justify-content: space-between; gap: 16px;
		padding: 18px 0; border-bottom: 1px solid var(--garis); margin-bottom: 28px;
	}
	.merek { display: flex; align-items: baseline; gap: 8px; color: var(--tx); text-decoration: none; }
	.merek .lambang { align-self: center; }
	.nama { font-weight: 700; font-size: 17px; letter-spacing: 0.06em; }
	.sub-merek { font-size: 12.5px; color: var(--redup); font-weight: 400; }
	.lambang { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; background: var(--aksen); color: #fff; font-size: 14px; }
	nav { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
	nav a { font-size: 13px; color: var(--redup); text-decoration: none; padding: 6px 11px; border-radius: 8px; }
	nav a:hover, nav a.aktif { color: var(--tx); background: color-mix(in srgb, var(--tx) 7%, transparent); }
	.tombol-nav { background: var(--aksen) !important; color: #fff !important; font-weight: 550; }
	footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--garis); font-size: 12.5px; color: var(--redup); }
</style>
