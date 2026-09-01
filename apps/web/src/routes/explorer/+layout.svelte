<script lang="ts">
	import '../../app.css';
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

<div class="situs">
	<header>
		<div class="wadah kepala-isi">
			<a href="/explorer" class="merek">
				<span class="lambang">⛓</span>
				<span class="nama">TERA</span>
				<span class="slogan">Explorer</span>
			</a>
			<form onsubmit={telusuri}>
				<input bind:value={cari} placeholder="Hash transaksi, alamat, atau nomor blok" />
				<button class="tombol" type="submit">Telusuri</button>
			</form>
		</div>
		<div class="pita"><i></i><i></i><i></i><i></i><i></i></div>
	</header>

	<main class="wadah isi">{@render children()}</main>

	<footer>
		<div class="wadah kaki-isi">
			<span>Explorer bawaan TERA — membaca langsung dari node RPC.</span>
			<a href="/">← Kembali ke aplikasi</a>
		</div>
	</footer>
</div>

<style>
	.situs { display: flex; flex-direction: column; min-height: 100vh; }
	header { background: var(--hitam); }
	.kepala-isi {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding-top: 16px;
		padding-bottom: 16px;
		flex-wrap: wrap;
	}
	.merek { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--putih); }
	.lambang {
		display: grid; place-items: center;
		width: 32px; height: 32px;
		background: var(--kuning); color: var(--hitam);
		border: 2px solid var(--putih); border-radius: 9px;
		font-size: 15px; font-weight: 800;
	}
	.nama { font-family: var(--judul); font-size: 21px; font-weight: 800; letter-spacing: 0.02em; }
	.slogan { font-size: 12.5px; font-weight: 600; color: #A6A6A6; border-left: 1.5px solid #3A3A3A; padding-left: 10px; }

	form { display: flex; gap: 8px; flex: 1; max-width: 460px; }
	form input { font-size: 13.5px; padding: 9px 13px; }

	main.isi { flex: 1; padding-top: 30px; padding-bottom: 60px; }

	footer { background: var(--hitam); color: #A6A6A6; }
	.kaki-isi {
		display: flex;
		justify-content: space-between;
		gap: 14px;
		padding-top: 20px;
		padding-bottom: 20px;
		font-size: 12.5px;
		flex-wrap: wrap;
	}
	.kaki-isi a { color: var(--kuning); text-decoration: none; font-weight: 600; }

	@media (max-width: 620px) {
		form { max-width: none; flex: 1 1 100%; }
		.slogan { display: none; }
	}
</style>
