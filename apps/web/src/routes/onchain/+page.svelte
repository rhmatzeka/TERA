<script lang="ts">
	import Hash from '$lib/components/Hash.svelte';
	let { data } = $props();
</script>

<h1>Bukti di Blockchain</h1>
<p class="sub">
	Seluruh isi halaman ini dibaca langsung dari node blockchain lewat RPC —
	bukan dari basis data aplikasi.
</p>

{#if !data.ada}
	<div class="kabar">
		Belum ada batch yang diterbitkan, sehingga belum ada bukti on-chain untuk ditampilkan.
		Penyelenggara dapat menerbitkan batch pertama melalui panel admin.
	</div>
{:else if data.galat}
	<div class="kabar bahaya">
		Tidak dapat terhubung ke {data.jaringan.rpcUrl} — {data.galat}
	</div>
{:else if data.rantai}
	{#if !data.explorer}
		<div class="kabar awas">
			<strong>Jaringan lokal tidak punya block explorer publik.</strong>
			Anvil hanya berjalan di komputer ini, sehingga tidak ada situs seperti Etherscan
			yang dapat membukanya. Halaman ini menggantikan peran explorer dengan membaca
			data mentah langsung dari node. Setelah di-deploy ke testnet Monad atau Base,
			tautan explorer akan muncul otomatis di sini.
		</div>
	{:else}
		<div class="tautan-explorer">
			<a href="{data.explorer.url}/tx/{data.batch.txHash}" target="_blank" rel="noopener">
				Buka transaksi di block explorer ↗
			</a>
			<a href="{data.explorer.url}/address/{data.jaringan.kontrak}" target="_blank" rel="noopener">
				Buka kontrak di block explorer ↗
			</a>
		</div>
	{/if}

	<section class="kartu">
		<h2>Transaksi penerbitan</h2>
		<dl>
			<dt>Hash transaksi</dt>
			<dd><Hash nilai={data.batch.txHash} jenis="tx" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Status</dt>
			<dd><span class="pil {data.rantai.status === 'success' ? 'ok' : 'bad'}">{data.rantai.status}</span></dd>
			<dt>Blok</dt>
			<dd><Hash nilai={data.rantai.nomorBlok} jenis="blok" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /> · {data.rantai.waktuBlok}</dd>
			<dt>Dari</dt>
			<dd><Hash nilai={data.rantai.dari} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Ke (kontrak)</dt>
			<dd><Hash nilai={data.rantai.ke} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Nonce</dt><dd>{data.rantai.nonce}</dd>
			<dt>Gas terpakai</dt><dd>{Number(data.rantai.gasTerpakai).toLocaleString('id-ID')}</dd>
			<dt>Ukuran calldata</dt><dd>{data.rantai.calldataUkuran} byte</dd>
			<dt>Nilai ETH dikirim</dt><dd>{data.rantai.nilai} wei</dd>
		</dl>
	</section>

	<section class="kartu">
		<h2>Nilai tersimpan di kontrak</h2>
		<p class="redup kecil">
			Dibaca dengan pemanggilan <code>rootBatch(idBatch)</code> ke kontrak.
			Inilah satu-satunya data yang benar-benar disimpan di blockchain untuk
			{data.batch.jumlah.toLocaleString('id-ID')} sertifikat.
		</p>
		<dl>
			<dt>Alamat kontrak</dt>
			<dd><Hash nilai={data.jaringan.kontrak} jenis="alamat" chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Ukuran bytecode</dt><dd>{data.rantai.ukuranKode.toLocaleString('id-ID')} byte</dd>
			<dt>Kunci (idBatch)</dt>
			<dd><Hash nilai={data.batch.idOnchain} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Nilai (Merkle root)</dt>
			<dd><Hash nilai={data.rantai.rootTersimpan} chainId={data.jaringan.chainId} basisExplorer={data.basisExplorer} /></dd>
			<dt>Ukuran nilai</dt><dd>32 byte</dd>
			<dt>Cocok dengan data lokal</dt>
			<dd><span class="pil {data.rantai.cocokDenganLokal ? 'ok' : 'bad'}">
				{data.rantai.cocokDenganLokal ? 'ya' : 'TIDAK'}
			</span></dd>
		</dl>
	</section>

	<section class="kartu">
		<h2>Peristiwa (event log)</h2>
		<p class="redup kecil">
			Data selain root disimpan sebagai event, bukan storage — sekitar sepersepuluh
			harganya, tetap permanen, dan tetap terbaca lewat RPC.
		</p>
		{#each data.peristiwa as p}
			<div class="peristiwa">
				<span class="nama-event">{p.nama}</span>
				<dl>
					{#each Object.entries(p.argumen) as [k, v]}
						<dt>{k}</dt><dd class="mono">{v}</dd>
					{/each}
				</dl>
			</div>
		{:else}
			<p class="redup kecil">Tidak ada event terbaca.</p>
		{/each}
	</section>

	<section class="kartu sorot">
		<h2>Yang TIDAK ada di blockchain</h2>
		<p class="kecil">
			Perhatikan seluruh data di atas: tidak ada satu pun nama, nomor identitas, atau
			alamat surel peserta. Yang tersimpan hanya Merkle root sepanjang 32 byte untuk
			{data.batch.jumlah.toLocaleString('id-ID')} sertifikat. Inilah yang membuat sistem
            ini patuh pada UU PDP No. 27/2022 — data pribadi tetap dapat dihapus karena
			memang tidak pernah menyentuh blockchain.
		</p>
	</section>
{/if}

<style>
	h1 { font-size: 24px; margin: 0 0 6px;
	}
	h2 { font-size: 15px; margin: 0 0 10px;
	}
	.sub { color: var(--redup); font-size: 14px; margin: 0 0 20px; max-width: 62ch;
	}
	.kecil { font-size: 12.5px; margin: 0 0 12px; max-width: 66ch; line-height: 1.55;
	}
	.peristiwa { border-top: 1px solid var(--garis); padding-top: 12px; margin-top: 12px;
	}
	.nama-event { font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px;
	}
	.tautan-explorer { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
	}
	.tautan-explorer a { font-size: 13px; color: var(--aksen); text-decoration: none; border: 1px solid var(--garis); border-radius: 8px; padding: 8px 13px;
	}
	code { font-family: ui-monospace, Menlo, monospace; font-size: 12px;
	}
</style>

