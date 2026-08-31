<script lang="ts">
	import { enhance } from '$app/forms';
	import { FONT_TERSEDIA, RUAS_TERSEDIA, type KunciRuas, type RuasTemplate } from '$lib/template';

	let { data, form } = $props();

	// Salinan yang dapat diubah di editor
	let nama = $state(data.template.nama);
	let ruas = $state<RuasTemplate[]>(structuredClone(data.template.ruas));
	let qr = $state(structuredClone(data.template.qr));
	let terpilih = $state<string | null>(ruas[0]?.id ?? null);
	let sedangSimpan = $state(false);

	const L = data.template.lebar;
	const T = data.template.tinggi;

	let kanvas = $state<HTMLDivElement | null>(null);
	let skala = $state(1);

	function hitungSkala() {
		if (kanvas) skala = kanvas.clientWidth / L;
	}
	$effect(() => {
		hitungSkala();
		const ro = new ResizeObserver(hitungSkala);
		if (kanvas) ro.observe(kanvas);
		return () => ro.disconnect();
	});

	const aktif = $derived(ruas.find((r) => r.id === terpilih) ?? null);

	const CONTOH: Record<string, string> = {
		nama: 'Rahmat Zeka',
		peran: 'Peserta',
		nomorIdentitas: '202111001',
		namaKegiatan: 'Seminar Nasional Blockchain',
		tanggalKegiatan: '2026-09-15',
		penyelenggara: 'Fakultas Teknik Informatika',
		namaPenerbit: 'Universitas Negeri Contoh',
		idSertifikat: '67862392-ac56-41f8-863d'
	};

	function contohTeks(r: RuasTemplate): string {
		const t =
			r.kunci === 'teks'
				? (r.teks ?? '').replace(/\{(\w+)\}/g, (c, k) => CONTOH[k] ?? c)
				: (CONTOH[r.kunci] ?? r.kunci);
		return r.hurufBesar ? t.toUpperCase() : t;
	}

	const FONT_CSS: Record<string, string> = {
		'sans': '400 {S}px Helvetica, Arial, sans-serif',
		'sans-tebal': '700 {S}px Helvetica, Arial, sans-serif',
		'serif': '400 {S}px "Times New Roman", Times, serif',
		'serif-tebal': '700 {S}px "Times New Roman", Times, serif',
		'serif-miring': 'italic 400 {S}px "Times New Roman", Times, serif',
		'mono': '400 {S}px "Courier New", Courier, monospace'
	};

	// ── geser ────────────────────────────────────────────────────────
	let sedangGeser: { id: string; dx: number; dy: number } | null = null;

	function mulaiGeser(e: PointerEvent, r: RuasTemplate) {
		e.preventDefault();
		terpilih = r.id;
		const kotak = kanvas!.getBoundingClientRect();
		sedangGeser = {
			id: r.id,
			dx: (e.clientX - kotak.left) / skala - r.x,
			dy: (e.clientY - kotak.top) / skala - r.y
		};
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function geser(e: PointerEvent) {
		if (!sedangGeser || !kanvas) return;
		const kotak = kanvas.getBoundingClientRect();
		const i = ruas.findIndex((r) => r.id === sedangGeser!.id);
		if (i < 0) return;
		ruas[i].x = Math.round(Math.max(0, Math.min(L, (e.clientX - kotak.left) / skala - sedangGeser.dx)));
		ruas[i].y = Math.round(Math.max(0, Math.min(T, (e.clientY - kotak.top) / skala - sedangGeser.dy)));
	}

	const selesaiGeser = () => (sedangGeser = null);

	// ── QR geser ─────────────────────────────────────────────────────
	let geserQr: { dx: number; dy: number } | null = null;
	function mulaiGeserQr(e: PointerEvent) {
		e.preventDefault();
		terpilih = null;
		const kotak = kanvas!.getBoundingClientRect();
		geserQr = { dx: (e.clientX - kotak.left) / skala - qr.x, dy: (e.clientY - kotak.top) / skala - qr.y };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}
	function geserQrGerak(e: PointerEvent) {
		if (!geserQr || !kanvas) return;
		const kotak = kanvas.getBoundingClientRect();
		qr.x = Math.round(Math.max(0, Math.min(L - qr.ukuran, (e.clientX - kotak.left) / skala - geserQr.dx)));
		qr.y = Math.round(Math.max(0, Math.min(T - qr.ukuran, (e.clientY - kotak.top) / skala - geserQr.dy)));
	}

	// ── kelola ruas ──────────────────────────────────────────────────
	function tambahRuas(kunci: KunciRuas) {
		const r: RuasTemplate = {
			id: crypto.randomUUID(),
			kunci,
			teks: kunci === 'teks' ? 'Teks baru' : undefined,
			x: Math.round(L / 2),
			y: Math.round(T / 2),
			ukuran: Math.round(T / 30),
			font: 'serif',
			warna: '#16181d',
			align: 'center',
			lebarMaks: Math.round(L * 0.8)
		};
		ruas = [...ruas, r];
		terpilih = r.id;
	}

	function hapusRuas(id: string) {
		ruas = ruas.filter((r) => r.id !== id);
		terpilih = ruas[0]?.id ?? null;
	}
</script>

<a class="balik" href="/admin/desain">← Desain Sertifikat</a>

<div class="kepala">
	<input class="judul" bind:value={nama} />
	<form method="POST" action="?/simpan"
		use:enhance={() => { sedangSimpan = true; return async ({ update }) => { await update({ reset: false }); sedangSimpan = false; }; }}>
		<input type="hidden" name="template" value={JSON.stringify({ nama, ruas, qr })} />
		<button type="submit" disabled={sedangSimpan}>{sedangSimpan ? 'Menyimpan…' : 'Simpan desain'}</button>
	</form>
</div>

{#if form?.pesan}
	<div class="kabar {form.berhasil ? 'ok' : 'bad'}">{form.pesan}</div>
{/if}

<p class="petunjuk">
	Geser tulisan langsung di atas gambar untuk memindahkannya. Klik satu tulisan
	untuk mengubah ukuran, jenis huruf, dan warnanya di panel kanan.
	Yang ditampilkan adalah contoh isi — saat diterbitkan, isinya diganti data peserta sungguhan.
</p>

<div class="tata">
	<div class="area">
		<div class="kanvas" bind:this={kanvas} style="aspect-ratio: {L} / {T}">
			<img src="/admin/desain/{data.template.id}/latar" alt="" draggable="false" />

			{#each ruas as r (r.id)}
				<button
					class="ruas" class:aktif={r.id === terpilih}
					style="
						left: {(r.x / L) * 100}%;
						top: {(r.y / T) * 100}%;
						font: {FONT_CSS[r.font].replace('{S}', String(r.ukuran * skala))};
						color: {r.warna};
						transform: translate({r.align === 'center' ? '-50%' : r.align === 'right' ? '-100%' : '0'}, 0);
					"
					onpointerdown={(e) => mulaiGeser(e, r)}
					onpointermove={geser}
					onpointerup={selesaiGeser}
					onpointercancel={selesaiGeser}
				>{contohTeks(r) || '(kosong)'}</button>
			{/each}

			{#if qr.tampil}
				<button
					class="qr" style="left: {(qr.x / L) * 100}%; top: {(qr.y / T) * 100}%; width: {(qr.ukuran / L) * 100}%;"
					onpointerdown={mulaiGeserQr} onpointermove={geserQrGerak}
					onpointerup={() => (geserQr = null)} onpointercancel={() => (geserQr = null)}
				>QR</button>
			{/if}
		</div>
	</div>

	<aside class="panel">
		<section>
			<h3>Tambah tulisan</h3>
			<div class="pilihan">
				{#each Object.entries(RUAS_TERSEDIA) as [k, label]}
					<button class="tambah" onclick={() => tambahRuas(k as KunciRuas)}>+ {label}</button>
				{/each}
			</div>
		</section>

		{#if aktif}
			<section class="pengaturan">
				<h3>{RUAS_TERSEDIA[aktif.kunci]}</h3>

				{#if aktif.kunci === 'teks'}
					<label for="tk">Isi teks</label>
					<input id="tk" bind:value={aktif.teks} />
					<p class="bantuan">
						Boleh memuat isian otomatis: <code>{'{nama}'}</code>, <code>{'{peran}'}</code>,
						<code>{'{namaKegiatan}'}</code>, <code>{'{tanggalKegiatan}'}</code>.
					</p>
				{/if}

				<div class="dua">
					<div><label for="ux">Posisi X</label><input id="ux" type="number" bind:value={aktif.x} /></div>
					<div><label for="uy">Posisi Y</label><input id="uy" type="number" bind:value={aktif.y} /></div>
				</div>

				<label for="uu">Ukuran huruf: {aktif.ukuran} px</label>
				<input id="uu" type="range" min="6" max={Math.round(T / 4)} bind:value={aktif.ukuran} />

				<label for="uf">Jenis huruf</label>
				<select id="uf" bind:value={aktif.font}>
					{#each Object.entries(FONT_TERSEDIA) as [k, label]}<option value={k}>{label}</option>{/each}
				</select>

				<label for="ua">Perataan</label>
				<select id="ua" bind:value={aktif.align}>
					<option value="left">Kiri</option>
					<option value="center">Tengah</option>
					<option value="right">Kanan</option>
				</select>

				<label for="uw">Warna</label>
				<div class="warna-baris">
					<input id="uw" type="color" bind:value={aktif.warna} />
					<input class="hex" bind:value={aktif.warna} />
				</div>

				<label for="ul">Lebar maksimum: {aktif.lebarMaks} px</label>
				<input id="ul" type="range" min="50" max={L} step="10" bind:value={aktif.lebarMaks} />
				<p class="bantuan">Tulisan otomatis mengecil bila melebihi lebar ini — mencegah nama panjang jebol.</p>

				<label class="centang">
					<input type="checkbox" bind:checked={aktif.hurufBesar} /> HURUF BESAR SEMUA
				</label>

				<button class="hapus" onclick={() => hapusRuas(aktif.id)}>Hapus tulisan ini</button>
			</section>
		{:else}
			<section class="pengaturan">
				<h3>Kode QR</h3>
				<p class="bantuan">
					Kode QR mengarah ke halaman verifikasi sertifikat. Siapa pun yang memindainya
					dapat memastikan keaslian sertifikat.
				</p>
				<label class="centang"><input type="checkbox" bind:checked={qr.tampil} /> Tampilkan kode QR</label>
				{#if qr.tampil}
					<div class="dua">
						<div><label for="qx">Posisi X</label><input id="qx" type="number" bind:value={qr.x} /></div>
						<div><label for="qy">Posisi Y</label><input id="qy" type="number" bind:value={qr.y} /></div>
					</div>
					<label for="qu">Ukuran: {qr.ukuran} px</label>
					<input id="qu" type="range" min="30" max={Math.round(L / 4)} bind:value={qr.ukuran} />
				{/if}
				<p class="bantuan">Klik salah satu tulisan di gambar untuk mengaturnya.</p>
			</section>
		{/if}
	</aside>
</div>

<style>
	.balik { font-size: 12.5px; color: var(--redup); text-decoration: none; }
	.kepala { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: 10px 0 8px; flex-wrap: wrap; }
	.judul {
		font-size: 20px; font-weight: 620; border: 1px solid transparent; border-radius: 8px;
		padding: 5px 9px; background: transparent; color: var(--tx); flex: 1; min-width: 220px;
	}
	.judul:hover, .judul:focus { border-color: var(--garis); background: var(--kartu); outline: none; }
	.petunjuk { font-size: 12.5px; color: var(--redup); margin: 0 0 14px; max-width: 74ch; line-height: 1.55; }

	.tata { display: grid; grid-template-columns: 1fr 290px; gap: 16px; align-items: start; }
	.area { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 12px; }
	.kanvas { position: relative; width: 100%; background: #fff; border-radius: 6px; overflow: hidden; user-select: none; }
	.kanvas img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; }

	.ruas {
		position: absolute; white-space: nowrap; background: transparent; border: 1px dashed transparent;
		padding: 0; margin: 0; cursor: move; line-height: 1.1; border-radius: 3px;
	}
	.ruas:hover { border-color: color-mix(in srgb, var(--aksen) 60%, transparent); }
	.ruas.aktif { border-color: var(--aksen); box-shadow: 0 0 0 2px color-mix(in srgb, var(--aksen) 25%, transparent); }
	.qr {
		position: absolute; aspect-ratio: 1; background: rgba(0, 0, 0, 0.08);
		border: 1.5px dashed #555; border-radius: 4px; cursor: move;
		font-size: 10px; color: #555; display: grid; place-items: center;
	}

	.panel { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; }
	.panel section { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 14px; }
	h3 { font-size: 13px; margin: 0 0 10px; }
	.pilihan { display: flex; flex-wrap: wrap; gap: 5px; }
	.tambah {
		background: var(--bg); color: var(--tx); border: 1px solid var(--garis);
		border-radius: 7px; padding: 5px 9px; font-size: 11.5px; cursor: pointer;
	}
	.tambah:hover { border-color: var(--aksen); color: var(--aksen); }

	label { display: block; font-size: 11.5px; color: var(--redup); margin: 11px 0 4px; }
	label:first-of-type { margin-top: 0; }
	input, select {
		width: 100%; padding: 6px 9px; border: 1px solid var(--garis); border-radius: 7px;
		background: var(--bg); color: var(--tx); font-size: 12.5px;
	}
	input[type='range'] { padding: 0; }
	input[type='color'] { padding: 2px; height: 30px; width: 44px; flex: 0 0 auto; }
	.warna-baris { display: flex; gap: 6px; align-items: center; }
	.hex { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
	.dua { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
	.dua label { margin-top: 11px; }
	.centang { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--tx); margin-top: 12px; }
	.centang input { width: auto; }
	.bantuan { font-size: 11px; color: var(--redup); line-height: 1.5; margin: 7px 0 0; }
	code { font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; }

	button[type='submit'] {
		background: var(--aksen); color: #fff; border: 0; border-radius: 8px;
		padding: 9px 18px; font-size: 13.5px; font-weight: 550; cursor: pointer;
	}
	.hapus {
		width: 100%; margin-top: 14px; background: transparent; color: var(--bad-tx);
		border: 1px solid var(--bad-garis); border-radius: 7px; padding: 6px; font-size: 12px; cursor: pointer;
	}
	.kabar { border-radius: 10px; padding: 11px 14px; font-size: 13px; margin-bottom: 12px; border: 1px solid var(--garis); }
	.kabar.ok { background: var(--ok-bg); color: var(--ok-tx); border-color: var(--ok-garis); }
	.kabar.bad { background: var(--bad-bg); color: var(--bad-tx); border-color: var(--bad-garis); }

	@media (max-width: 900px) {
		.tata { grid-template-columns: 1fr; }
		.panel { position: static; }
	}
</style>
