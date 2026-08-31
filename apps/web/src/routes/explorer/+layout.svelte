<script lang="ts">
	let { children } = $props();
	let cari = $state('');

	function telusuri(e: Event) {
		e.preventDefault();
		const q = cari.trim();
		if (!q) return;
		if (/^0x[0-9a-fA-F]{64}$/.test(q)) location.href = `/explorer/tx/${q}`;
		else if (/^0x[0-9a-fA-F]{40}$/.test(q)) location.href = `/explorer/address/${q}`;
		else if (/^\d+$/.test(q)) location.href = `/explorer/block/${q}`;
		else alert('Masukkan hash transaksi (66 karakter), alamat (42 karakter), atau nomor blok.');
	}
</script>

<div class="cangkang">
	<header>
		<a href="/explorer" class="merek">
			<span class="lambang">⛓</span>
			<span>TERA Explorer</span>
			<span class="tanda">bawaan</span>
		</a>
		<form onsubmit={telusuri}>
			<input bind:value={cari} placeholder="Hash transaksi, alamat, atau nomor blok" />
			<button type="submit">Telusuri</button>
		</form>
	</header>
	<main>{@render children()}</main>
	<footer>
		Explorer bawaan aplikasi, membaca langsung dari node RPC.
		<a href="/">← Kembali ke aplikasi</a>
	</footer>
</div>

<style>
	.cangkang { max-width: 940px; margin: 0 auto; padding: 0 20px 60px; }
	header {
		display: flex; align-items: center; justify-content: space-between; gap: 16px;
		padding: 16px 0; border-bottom: 1px solid var(--garis); margin-bottom: 26px; flex-wrap: wrap;
	}
	.merek { display: flex; align-items: center; gap: 9px; font-weight: 650; font-size: 14.5px; color: var(--tx); text-decoration: none; }
	.lambang { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 7px; background: #2f3a4a; color: #fff; font-size: 12px; }
	.tanda { font-size: 10.5px; color: var(--redup); border: 1px solid var(--garis); border-radius: 999px; padding: 1px 8px; font-weight: 400; }
	form { display: flex; gap: 6px; flex: 1; max-width: 420px; }
	input { flex: 1; padding: 7px 11px; border: 1px solid var(--garis); border-radius: 8px; background: var(--kartu); color: var(--tx); font-size: 12.5px; }
	button { background: var(--aksen); color: #fff; border: 0; border-radius: 8px; padding: 7px 14px; font-size: 12.5px; font-weight: 550; cursor: pointer; }
	footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--garis); font-size: 12px; color: var(--redup); display: flex; justify-content: space-between; gap: 12px; }
	footer a { color: var(--aksen); text-decoration: none; }
	@media (max-width: 620px) { form { max-width: none; flex: 1 1 100%; } }
</style>
