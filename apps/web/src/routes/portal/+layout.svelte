<script lang="ts">
	import '../../app.css';
	let { children, data } = $props();
</script>

<div class="situs">
	<header>
		<div class="wadah kepala-isi">
			<a href="/portal" class="merek">
				<span class="lambang">✓</span>
				<span class="nama">TERA</span>
				<span class="slogan">Portal Peserta</span>
			</a>
			<div class="baris g12">
				<span class="kecil sapa">{data.pengguna.nama}</span>
				<form method="POST" action="/keluar">
					<button class="tombol putih mini" type="submit">Keluar</button>
				</form>
			</div>
		</div>
		<div class="pita"><i></i><i></i><i></i><i></i><i></i></div>
	</header>

	<main class="wadah isi">{@render children()}</main>

	<footer>
		<div class="pita"><i></i><i></i><i></i><i></i><i></i></div>
		<div class="wadah kaki-isi">
			Sertifikat Anda dapat diperiksa keasliannya oleh siapa pun, langsung ke
			catatan permanen. Data pribadi tidak disimpan di blockchain.
		</div>
	</footer>
</div>

<style>
	.situs { display: flex; flex-direction: column; min-height: 100vh; }
	header { background: var(--putih); border-bottom: var(--rangka); }
	.kepala-isi {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 16px;
		padding-bottom: 16px;
	}
	.merek { display: flex; align-items: center; gap: 10px; text-decoration: none; }
	.lambang {
		display: grid; place-items: center;
		width: 34px; height: 34px;
		background: var(--kuning); border: var(--rangka); border-radius: 9px;
		box-shadow: 2px 2px 0 var(--hitam); font-size: 17px; font-weight: 800;
	}
	.nama { font-family: var(--judul); font-size: 22px; font-weight: 800; letter-spacing: 0.02em; }
	.slogan { font-size: 12.5px; font-weight: 600; color: var(--abu); border-left: 1.5px solid var(--abu-garis); padding-left: 10px; }
	.sapa { font-weight: 600; }

	main.isi { flex: 1; padding-top: 34px; padding-bottom: 56px; }

	footer { background: var(--hitam); color: #C9C9C9; margin-top: 40px; }
	.kaki-isi { padding-top: 26px; padding-bottom: 26px; font-size: 13px; line-height: 1.6; }

	@media (max-width: 520px) { .slogan, .sapa { display: none; } }
</style>
