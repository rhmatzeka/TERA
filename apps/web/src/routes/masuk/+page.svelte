<script lang="ts">
	let { data, form } = $props();
	let email = $state(form?.email ?? '');
	let sandi = $state('');

	function isi(e: string, s: string) {
		email = e;
		sandi = s;
	}
</script>

<div class="bungkus">
	<div class="kotak">
		<h1>Masuk</h1>
		<p class="sub">Staf penyelenggara dan peserta menggunakan formulir yang sama.</p>

		{#if form?.pesan}<div class="galat">{form.pesan}</div>{/if}

		<form method="POST">
			<input type="hidden" name="tujuan" value={data.tujuan} />
			<label for="email">Alamat surel</label>
			<input id="email" name="email" type="email" bind:value={email} required autocomplete="username" />

			<label for="sandi">Kata sandi</label>
			<input id="sandi" name="sandi" type="password" bind:value={sandi} required autocomplete="current-password" />

			<button type="submit">Masuk</button>
		</form>
	</div>

	<div class="kotak akun">
		<h2>Akun untuk mencoba</h2>
		<p class="kecil">Klik salah satu untuk mengisi formulir.</p>

		<span class="golongan">Staf penyelenggara → Dashboard Admin</span>
		{#each data.demo as a}
			<button class="baris" onclick={() => isi(a.email, a.sandi)}>
				<span class="peran">{a.peran}</span>
				<span class="mono">{a.email}</span>
				<span class="sandi">{a.sandi}</span>
			</button>
		{/each}

		{#if data.peserta}
			<span class="golongan">Peserta → Portal Peserta</span>
			<button class="baris" onclick={() => isi(data.peserta.email, data.peserta.sandi)}>
				<span class="peran">peserta</span>
				<span class="mono">{data.peserta.email}</span>
				<span class="sandi">{data.peserta.sandi}</span>
			</button>
			<p class="kecil catatan">
				Semua peserta pada batch ini dapat masuk memakai surel masing-masing
				(<code>peserta1</code>…<code>peserta500@kampus.ac.id</code>) dengan kata sandi yang sama.
			</p>
		{/if}
	</div>
</div>

<style>
	.bungkus { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; max-width: 780px; margin: 20px auto 0; }
	.kotak { background: var(--kartu); border: 1px solid var(--garis); border-radius: 12px; padding: 24px; }
	h1 { font-size: 21px; margin: 0 0 4px; }
	h2 { font-size: 14px; margin: 0 0 4px; }
	.sub { color: var(--redup); font-size: 13px; margin: 0 0 18px; }
	.kecil { font-size: 12px; color: var(--redup); margin: 0 0 14px; line-height: 1.5; }
	label { display: block; font-size: 12.5px; color: var(--redup); margin: 12px 0 5px; }
	input {
		width: 100%; padding: 10px 12px; border: 1px solid var(--garis); border-radius: 8px;
		background: var(--bg); color: var(--tx); font-size: 14px;
	}
	form button {
		width: 100%; margin-top: 18px; background: var(--aksen); color: #fff; border: 0;
		border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 550; cursor: pointer;
	}
	.galat { background: var(--bad-bg); color: var(--bad-tx); border: 1px solid var(--bad-garis); border-radius: 8px; padding: 10px 13px; font-size: 13px; margin-bottom: 14px; }
	.golongan { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--redup); margin: 16px 0 8px; }
	.baris {
		display: grid; grid-template-columns: 92px 1fr auto; gap: 10px; align-items: center;
		width: 100%; text-align: left; background: var(--bg); border: 1px solid var(--garis);
		border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; cursor: pointer; color: var(--tx);
	}
	.baris:hover { border-color: var(--aksen); }
	.peran { font-size: 11px; color: var(--redup); }
	.mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; overflow-wrap: anywhere; }
	.sandi { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--redup); }
	.catatan { margin-top: 12px; }
	code { font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
	@media (max-width: 700px) { .bungkus { grid-template-columns: 1fr; } }
</style>
