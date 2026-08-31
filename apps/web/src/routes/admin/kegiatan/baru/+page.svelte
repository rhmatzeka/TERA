<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let namaBerkas = $state('');
	let sedangProses = $state(false);
	let desainDipilih = $state(form?.rincian?.templateId ?? 'bawaan');

	const r = $derived(form?.rincian ?? {
		namaKegiatan: '', tanggalKegiatan: '', penyelenggara: '', namaPenerbit: 'Universitas Contoh'
	});
	const adaPratinjau = $derived(Boolean(form && 'pesertaJson' in form));
	const siapTerbit = $derived(adaPratinjau && form!.jumlahSah > 0);

	function unduhContoh() {
		const b = new Blob([data.contohCsv], { type: 'text/csv' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(b);
		a.download = 'contoh-peserta.csv';
		a.click();
		URL.revokeObjectURL(a.href);
	}
</script>

<a class="balik" href="/admin/kegiatan">← Kegiatan</a>
<h1>Kegiatan Baru</h1>
<p class="sub">
	Isi rincian kegiatan lalu unggah daftar peserta. Berapa pun jumlah pesertanya,
	biaya penerbitannya tetap sama.
</p>

<ol class="langkah">
	<li class:aktif={!adaPratinjau} class:selesai={adaPratinjau}>1. Rincian &amp; unggah CSV</li>
	<li class:aktif={adaPratinjau}>2. Periksa &amp; pratinjau</li>
	<li>3. Persetujuan &amp; terbitkan</li>
</ol>

{#if form?.pesan}<div class="kabar bad">{form.pesan}</div>{/if}

<form
	method="POST"
	action="?/periksa"
	enctype="multipart/form-data"
	use:enhance={() => { sedangProses = true; return async ({ update }) => { await update(); sedangProses = false; }; }}
>
	<section class="kartu">
		<h2>Rincian kegiatan</h2>
		<div class="grid">
			<div class="ruas lebar">
				<label for="nk">Nama kegiatan</label>
				<input id="nk" name="namaKegiatan" value={r.namaKegiatan} required
					placeholder="Webinar Nasional Blockchain 2026" />
			</div>
			<div class="ruas">
				<label for="tk">Tanggal kegiatan</label>
				<input id="tk" name="tanggalKegiatan" type="date" value={r.tanggalKegiatan} required />
			</div>
			<div class="ruas">
				<label for="py">Penyelenggara</label>
				<input id="py" name="penyelenggara" value={r.penyelenggara} required placeholder="Fakultas Teknik" />
			</div>
			<div class="ruas lebar">
				<label for="np">Institusi penerbit</label>
				<input id="np" name="namaPenerbit" value={r.namaPenerbit || 'Universitas Contoh'} required />
			</div>
			<div class="ruas lebar">
				<label for="td">Desain sertifikat</label>
				<select id="td" name="templateId" bind:value={desainDipilih}>
					{#each data.template as t}
						<option value={t.id}>{t.nama}{t.adaGambar ? '' : ' — tanpa gambar latar'}</option>
					{/each}
				</select>
				<p class="bantuan">
					Belum ada desain sendiri?
					<a href="/admin/desain">Unggah desain Anda →</a>
				</p>
			</div>
		</div>
	</section>

	<section class="kartu">
		<div class="kepala-kartu">
			<h2>Daftar peserta (CSV)</h2>
			<button type="button" class="tautan-btn" onclick={unduhContoh}>Unduh contoh CSV</button>
		</div>
		<p class="kecil">
			Kolom wajib: <code>nama</code>, <code>email</code>.
			Opsional: <code>nomor_identitas</code>, <code>peran</code>.
			Nama kolom tidak peka huruf besar-kecil dan menerima beberapa variasi
			(<code>nim</code>, <code>surel</code>, <code>role</code>).
		</p>

		<label class="jatuhkan">
			<input type="file" name="csv" accept=".csv,text/csv" required
				onchange={(e) => (namaBerkas = (e.currentTarget.files?.[0]?.name ?? ''))} />
			<span class="ikon">⇪</span>
			<span class="teks">{namaBerkas || 'Pilih berkas CSV'}</span>
			<span class="mini">maksimal 20 MB</span>
		</label>

		<button type="submit" class="utama" disabled={sedangProses}>
			{sedangProses ? 'Memeriksa…' : 'Periksa berkas'}
		</button>
	</section>
</form>

{#if adaPratinjau}
	<section class="kartu">
		<h2>Hasil pemeriksaan</h2>
		<div class="ikhtisar">
			<div class="kotak ok">
				<span class="angka">{form!.jumlahSah.toLocaleString('id-ID')}</span>
				<span class="label">baris sah</span>
			</div>
			<div class="kotak {form!.jumlahGalat ? 'bad' : ''}">
				<span class="angka">{form!.jumlahGalat.toLocaleString('id-ID')}</span>
				<span class="label">baris bermasalah</span>
			</div>
			<div class="kotak">
				<span class="angka">{form!.totalBaris.toLocaleString('id-ID')}</span>
				<span class="label">total baris</span>
			</div>
			<div class="kotak">
				<span class="angka">1×</span>
				<span class="label">biaya penerbitan</span>
			</div>
		</div>
		<p class="kecil">Kolom terbaca: <code>{form!.kolomTerbaca.join(', ')}</code></p>

		{#if form!.jumlahGalat > 0}
			<h3>Baris yang perlu diperbaiki</h3>
			<div class="bungkus">
				<table>
					<thead><tr><th>Baris</th><th>Masalah</th><th>Isi</th></tr></thead>
					<tbody>
						{#each form!.galat as g}
							<tr><td>{g.baris || '—'}</td><td class="masalah">{g.pesan}</td><td class="redup mono">{g.isi}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if form!.jumlahGalat > form!.galat.length}
				<p class="kecil redup">…dan {form!.jumlahGalat - form!.galat.length} baris bermasalah lainnya.</p>
			{/if}
			<p class="kecil peringatan">
				Baris bermasalah <strong>tidak akan diterbitkan</strong>. Perbaiki CSV lalu unggah ulang,
				atau lanjutkan dengan {form!.jumlahSah} baris yang sah saja.
			</p>
		{/if}

		{#if form!.jumlahSah > 0}
			<h3>Pratinjau peserta</h3>
			<div class="bungkus">
				<table>
					<thead><tr><th>Baris</th><th>Nama</th><th>Email</th><th>Identitas</th><th>Peran</th></tr></thead>
					<tbody>
						{#each form!.pratinjau as p}
							<tr>
								<td class="redup">{p.baris}</td><td>{p.nama}</td>
								<td class="redup">{p.email}</td><td class="redup">{p.nomorIdentitas || '—'}</td>
								<td>{p.peran}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if form!.jumlahSah > form!.pratinjau.length}
				<p class="kecil redup">…dan {form!.jumlahSah - form!.pratinjau.length} peserta lainnya.</p>
			{/if}
		{/if}
	</section>

	{#if siapTerbit}
		<form method="POST" action="?/siapkan"
			use:enhance={() => { sedangProses = true; return async ({ update }) => { await update(); sedangProses = false; }; }}>
			<input type="hidden" name="namaKegiatan" value={r.namaKegiatan} />
			<input type="hidden" name="tanggalKegiatan" value={r.tanggalKegiatan} />
			<input type="hidden" name="penyelenggara" value={r.penyelenggara} />
			<input type="hidden" name="namaPenerbit" value={r.namaPenerbit} />
			<input type="hidden" name="templateId" value={desainDipilih} />
			<input type="hidden" name="pesertaJson" value={form!.pesertaJson} />
			<div class="kartu aksi">
				<div>
					<strong>Siapkan {form!.jumlahSah.toLocaleString('id-ID')} sertifikat</strong>
					<p class="kecil">
						Sistem akan menyiapkan seluruh sertifikat. Belum ada yang diterbitkan —
						masih menunggu persetujuan Penandatangan.
					</p>
				</div>
				<button type="submit" class="utama" disabled={sedangProses}>
					{sedangProses ? 'Menyiapkan…' : 'Siapkan sertifikat →'}
				</button>
			</div>
		</form>
	{/if}
{/if}

<style>
	.balik { font-size: 12.5px; color: var(--redup); text-decoration: none; }
	h1 { font-size: 23px; margin: 10px 0 4px; }
	h2 { font-size: 15px; margin: 0 0 10px; }
	h3 { font-size: 13px; margin: 20px 0 8px; }
	.sub { color: var(--redup); font-size: 13.5px; margin: 0 0 20px; max-width: 60ch; }
	.kecil { font-size: 12px; color: var(--redup); margin: 0 0 12px; line-height: 1.55; }
	.redup { color: var(--redup); }
	.mono { font-family: ui-monospace, Menlo, monospace; font-size: 11px; }

	.langkah { list-style: none; display: flex; gap: 8px; padding: 0; margin: 0 0 18px; flex-wrap: wrap; }
	.langkah li { font-size: 12px; color: var(--redup); border: 1px solid var(--garis); border-radius: 999px; padding: 5px 13px; }
	.langkah li.aktif { border-color: var(--aksen); color: var(--aksen); font-weight: 550; }
	.langkah li.selesai { background: var(--ok-bg); color: var(--ok-tx); border-color: var(--ok-garis); }

	.kartu { background: var(--kartu); border: 1px solid var(--garis); border-radius: 10px; padding: 18px; margin-bottom: 14px; }
	.kepala-kartu { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
	.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
	.ruas.lebar { grid-column: 1 / -1; }
	label { display: block; font-size: 12.5px; color: var(--redup); margin-bottom: 5px; }
	select {
		width: 100%; padding: 9px 11px; border: 1px solid var(--garis); border-radius: 8px;
		background: var(--bg); color: var(--tx); font-size: 13.5px;
	}
	.bantuan { font-size: 11.5px; color: var(--redup); margin: 6px 0 0; }
	.bantuan a { color: var(--aksen); text-decoration: none; }
	input[type='text'], input[type='date'], input:not([type]) {
		width: 100%; padding: 9px 11px; border: 1px solid var(--garis); border-radius: 8px;
		background: var(--bg); color: var(--tx); font-size: 13.5px;
	}
	.jatuhkan {
		display: flex; flex-direction: column; align-items: center; gap: 4px;
		border: 1.5px dashed var(--garis); border-radius: 10px; padding: 24px;
		cursor: pointer; margin: 4px 0 14px; text-align: center;
	}
	.jatuhkan:hover { border-color: var(--aksen); }
	.jatuhkan input { display: none; }
	.jatuhkan .ikon { font-size: 20px; color: var(--redup); }
	.jatuhkan .teks { font-size: 13.5px; font-weight: 520; }
	.jatuhkan .mini { font-size: 11.5px; color: var(--redup); }

	button.utama { background: var(--aksen); color: #fff; border: 0; border-radius: 8px; padding: 10px 18px; font-size: 13.5px; font-weight: 550; cursor: pointer; }
	button.utama:disabled { opacity: 0.55; cursor: default; }
	.tautan-btn { background: none; border: 0; color: var(--aksen); font-size: 12.5px; cursor: pointer; padding: 0; }

	.ikhtisar { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom: 12px; }
	.kotak { background: var(--bg); border: 1px solid var(--garis); border-radius: 9px; padding: 12px 14px; }
	.kotak.ok { background: var(--ok-bg); border-color: var(--ok-garis); }
	.kotak.bad { background: var(--bad-bg); border-color: var(--bad-garis); }
	.angka { display: block; font-size: 19px; font-weight: 640; }
	.kotak .label { display: block; font-size: 11.5px; margin: 0; color: inherit; opacity: 0.75; }

	.bungkus { border: 1px solid var(--garis); border-radius: 9px; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 460px; }
	th { text-align: left; font-size: 11px; color: var(--redup); font-weight: 550; padding: 8px 11px; border-bottom: 1px solid var(--garis); }
	td { padding: 7px 11px; border-bottom: 1px solid var(--garis); }
	tbody tr:last-child td { border-bottom: 0; }
	.masalah { color: var(--bad-tx); }
	.peringatan { background: var(--warn-bg); color: var(--warn-tx); border: 1px solid var(--warn-garis); border-radius: 8px; padding: 9px 12px; margin-top: 12px; }

	.aksi { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; }
	.aksi .kecil { margin: 4px 0 0; max-width: 54ch; }
	.kabar { border-radius: 10px; padding: 12px 15px; font-size: 13px; margin-bottom: 14px; border: 1px solid var(--garis); }
	.kabar.bad { background: var(--bad-bg); color: var(--bad-tx); border-color: var(--bad-garis); }
	code { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
	@media (max-width: 620px) { .grid { grid-template-columns: 1fr; } }
</style>
