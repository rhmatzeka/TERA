<script lang="ts">
	let { children, data } = $props();
</script>

<div class="cangkang">
	<header>
		<a href="/portal" class="merek">
			<span class="lambang">✓</span>
			<span class="nama">TERA</span>
			<span class="sub-merek">Portal Peserta</span>
		</a>
		<div class="kanan">
			<span class="sapa">{data.pengguna.nama}</span>
			<form method="POST" action="/keluar"><button type="submit">Keluar</button></form>
		</div>
	</header>
	<main>{@render children()}</main>
	<footer>
		Sertifikat Anda dapat diperiksa keasliannya oleh siapa pun, langsung ke
		catatan permanen. Data pribadi tidak disimpan di blockchain.
	</footer>
</div>

<style>
	.cangkang { max-width: 780px; margin: 0 auto; padding: 0 20px 64px; }
	header {
		display: flex; align-items: center; justify-content: space-between; gap: 16px;
		padding: 18px 0; border-bottom: 1px solid var(--garis); margin-bottom: 30px;
	}
	.merek { display: flex; align-items: baseline; gap: 8px; color: var(--tx); text-decoration: none; }
	.merek .lambang { align-self: center; }
	.nama { font-weight: 700; font-size: 16px; letter-spacing: 0.06em; }
	.sub-merek { font-size: 12px; color: var(--redup); }
	.lambang { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; background: var(--aksen); color: #fff; font-size: 14px; }
	.kanan { display: flex; align-items: center; gap: 12px; }
	.sapa { font-size: 13px; color: var(--redup); }
	button { background: transparent; color: var(--redup); border: 1px solid var(--garis); border-radius: 8px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; }
	button:hover { color: var(--tx); }
	footer { margin-top: 44px; padding-top: 18px; border-top: 1px solid var(--garis); font-size: 12.5px; color: var(--redup); }
</style>
