<script lang="ts">
	/** Mockup sertifikat sebagai "foto produk" — dipakai di hero dan bagian fitur. */
	interface Props { miring?: number; }
	let { miring = -3 }: Props = $props();
</script>

<div class="bingkai-sobek" style="--miring: {miring}deg">
	<svg viewBox="0 0 420 297" role="img" aria-label="Contoh sertifikat digital">
		<rect width="420" height="297" fill="#FFFDF7" />
		<rect x="12" y="12" width="396" height="273" fill="none" stroke="#C9A227" stroke-width="3" />
		<rect x="19" y="19" width="382" height="259" fill="none" stroke="#C9A227" stroke-width="1" />
		{#each [[24, 24], [396, 24], [24, 273], [396, 273]] as [cx, cy]}
			<circle {cx} {cy} r="3.5" fill="#C9A227" />
		{/each}

		<text x="210" y="52" text-anchor="middle" font-size="8" font-weight="700"
			letter-spacing="2.4" fill="#7A7A7A">FAKULTAS TEKNIK INFORMATIKA</text>
		<text x="210" y="70" text-anchor="middle" font-size="13" font-weight="700"
			fill="#14171E" font-family="Georgia, serif">Universitas Negeri Contoh</text>
		<line x1="180" y1="80" x2="240" y2="80" stroke="#C9A227" stroke-width="1.6" />

		<text x="210" y="108" text-anchor="middle" font-size="21" font-weight="700"
			letter-spacing="5" fill="#14171E" font-family="Georgia, serif">SERTIFIKAT</text>
		<text x="210" y="124" text-anchor="middle" font-size="8" fill="#7A7A7A"
			font-family="Georgia, serif">diberikan kepada</text>

		<text x="210" y="158" text-anchor="middle" font-size="27" font-weight="700"
			fill="#1E3A8F" font-family="Georgia, serif">Rahmat Zeka</text>
		<line x1="90" y1="170" x2="330" y2="170" stroke="#E2E2DC" stroke-width="1.2" />

		<text x="210" y="188" text-anchor="middle" font-size="8" fill="#7A7A7A"
			font-family="Georgia, serif">atas partisipasinya sebagai Peserta dalam kegiatan</text>
		<text x="210" y="206" text-anchor="middle" font-size="12" font-weight="700"
			fill="#14171E" font-family="Georgia, serif">Seminar Nasional Blockchain 2026</text>

		<line x1="42" y1="248" x2="140" y2="248" stroke="#8A8A8A" stroke-width="1" />
		<text x="42" y="260" font-size="7" font-weight="700" fill="#14171E">Universitas Negeri Contoh</text>
		<text x="42" y="270" font-size="6" fill="#8A8A8A">Penyelenggara</text>

		<!-- kode QR -->
		<g transform="translate(330 226)">
			<rect width="48" height="48" fill="#FFFFFF" />
			{#each [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2],[5,0],[6,0],[5,1],[4,2],[6,2],[0,4],[2,4],[1,5],[3,5],[5,5],[0,6],[2,6],[4,6],[6,6],[4,0],[6,1],[3,1],[3,3],[5,3],[1,3],[6,4],[4,4],[2,3],[5,6],[1,1]] as [x, y]}
				<rect x={x * 7} y={y * 7} width="6" height="6" fill="#14171E" />
			{/each}
		</g>
		<text x="330" y="284" font-size="5.5" fill="#8A8A8A">Pindai untuk verifikasi</text>
	</svg>
</div>

<style>
	.bingkai-sobek {
		background: var(--hitam);
		padding: 9px;
		transform: rotate(var(--miring));
		box-shadow: 10px 10px 0 rgba(0, 0, 0, .18);
		clip-path: polygon(
			1.5% 0.8%, 12% 2.6%, 24% 0%, 36% 2.2%, 49% 0.4%, 61% 2.8%, 74% 0.6%, 86% 2.4%, 99% 1%,
			100% 13%, 98.2% 26%, 100% 39%, 97.8% 52%, 100% 65%, 98% 78%, 100% 90%, 98.6% 99.2%,
			87% 97.4%, 75% 100%, 62% 97.6%, 50% 99.6%, 37% 97.2%, 25% 99.8%, 13% 97.6%, 1% 99%,
			0% 88%, 2% 75%, 0% 62%, 1.8% 49%, 0% 36%, 2.2% 24%, 0.4% 12%
		);
	}
	svg { display: block; width: 100%; height: auto; }
</style>
