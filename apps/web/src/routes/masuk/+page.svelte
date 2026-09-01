<script lang="ts">
	let { data, form } = $props();
	let email = $state(form?.email ?? '');
	let sandi = $state('');

	function isi(e: string, s: string) { email = e; sandi = s; }
</script>

<div class="wadah halaman">
	<div class="kisi">
		<!-- formulir -->
		<div class="kartu kotak-masuk">
			<span class="label-atas">Penyelenggara &amp; peserta</span>
			<h1 class="judul">Masuk</h1>
			<p class="kecil redup">Staf penyelenggara dan peserta memakai formulir yang sama.</p>

			{#if form?.pesan}
				<div class="kabar bahaya galat">{form.pesan}</div>
			{/if}

			<form method="POST">
				<input type="hidden" name="tujuan" value={data.tujuan} />

				<div class="ruas">
					<label for="email">Alamat surel</label>
					<input id="email" name="email" type="email" bind:value={email} required autocomplete="username" />
				</div>

				<div class="ruas">
					<label for="sandi">Kata sandi</label>
					<input id="sandi" name="sandi" type="password" bind:value={sandi} required autocomplete="current-password" />
				</div>

				<button class="tombol lebar" type="submit">Masuk</button>
			</form>
		</div>

		<!-- akun demo -->
		<div class="kartu kotak-akun">
			<h2 class="judul-akun">Akun untuk mencoba</h2>
			<p class="mungil redup">Klik salah satu untuk mengisi formulir.</p>

			<span class="golongan">Staf penyelenggara</span>
			{#each data.demo as a}
				<button class="baris-akun" onclick={() => isi(a.email, a.sandi)}>
					<span class="pil kuning">{a.peran}</span>
					<span class="surel mono">{a.email}</span>
					<span class="sandi mono">{a.sandi}</span>
				</button>
			{/each}

			{#if data.peserta}
				<span class="golongan">Peserta</span>
				<button class="baris-akun" onclick={() => isi(data.peserta.email, data.peserta.sandi)}>
					<span class="pil netral">peserta</span>
					<span class="surel mono">{data.peserta.email}</span>
					<span class="sandi mono">{data.peserta.sandi}</span>
				</button>
				<p class="mungil redup catatan">
					Seluruh peserta pada kegiatan yang sudah terbit dapat masuk memakai
					surel masing-masing dengan kata sandi yang sama.
				</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.halaman { padding-top: 56px; padding-bottom: 40px; }
	.kisi { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; max-width: 880px; margin: 0 auto; }

	.judul { font-size: 34px; margin: 8px 0 6px; }
	.kotak-masuk form { margin-top: 20px; }
	.ruas { margin-bottom: 16px; }
	.tombol.lebar { width: 100%; margin-top: 8px; }
	.galat { margin-top: 18px; }

	.kotak-akun { background: var(--abu-muda); }
	.judul-akun { font-size: 17px; margin-bottom: 4px; }
	.golongan {
		display: block;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--abu);
		margin: 20px 0 9px;
	}
	.baris-akun {
		display: grid;
		grid-template-columns: 92px 1fr auto;
		gap: 10px;
		align-items: center;
		width: 100%;
		text-align: left;
		background: var(--putih);
		border: var(--rangka-tipis);
		border-radius: var(--lengkung-kecil);
		padding: 9px 12px;
		margin-bottom: 8px;
		cursor: pointer;
		font-family: var(--teks);
		transition: transform .12s ease, box-shadow .12s ease;
	}
	.baris-akun:hover { transform: translate(-2px, -2px); box-shadow: var(--bayang-kecil); }
	.baris-akun:focus-visible { outline: 3px solid var(--biru); outline-offset: 2px; }
	.surel { font-size: 11.5px; overflow-wrap: anywhere; }
	.sandi { font-size: 11px; color: var(--abu); }
	.catatan { margin-top: 12px; }

	@media (max-width: 760px) {
		.kisi { grid-template-columns: 1fr; }
	}
	@media (max-width: 420px) {
		.baris-akun { grid-template-columns: 1fr; gap: 5px; }
	}
</style>
