<script lang="ts">
	/**
	 * Diagram Merkle tree — menjelaskan mekanisme inti sistem sekaligus
	 * menjadi ilustrasi utama pada blok berwarna.
	 */
	const daun = ['Budi', 'Siti', 'Andi', 'Nadia', 'Bayu', 'Kirana', 'Eko', 'Gita'];
	const lebarDaun = 96;
	const jarak = 12;
	const totalLebar = daun.length * lebarDaun + (daun.length - 1) * jarak;
</script>

<svg viewBox="0 0 {totalLebar} 330" role="img"
	aria-label="Delapan sertifikat diringkas bertingkat menjadi satu Merkle root">

	<!-- garis penghubung -->
	<g stroke="#101010" stroke-width="2.5" fill="none">
		{#each daun as _, i}
			{@const x = i * (lebarDaun + jarak) + lebarDaun / 2}
			{@const induk = Math.floor(i / 2) * 2 * (lebarDaun + jarak) + lebarDaun + jarak / 2}
			<path d="M {x} 262 V 246 H {induk} V 230" />
		{/each}
		{#each [0, 1, 2, 3] as i}
			{@const x = i * 2 * (lebarDaun + jarak) + lebarDaun + jarak / 2}
			{@const induk = Math.floor(i / 2) * 4 * (lebarDaun + jarak) + 2 * lebarDaun + 1.5 * jarak}
			<path d="M {x} 186 V 172 H {induk} V 156" />
		{/each}
		{#each [0, 1] as i}
			{@const x = i * 4 * (lebarDaun + jarak) + 2 * lebarDaun + 1.5 * jarak}
			<path d="M {x} 112 V 98 H {totalLebar / 2} V 82" />
		{/each}
	</g>

	<!-- daun: sertifikat peserta -->
	{#each daun as nama, i}
		{@const x = i * (lebarDaun + jarak)}
		<g>
			<rect x={x + 3} y="265" width={lebarDaun} height="40" rx="7" fill="#101010" />
			<rect x={x} y="262" width={lebarDaun} height="40" rx="7" fill="#FFFFFF" stroke="#101010" stroke-width="2.5" />
			<text x={x + lebarDaun / 2} y="279" text-anchor="middle" font-size="13" font-weight="700" fill="#101010">{nama}</text>
			<text x={x + lebarDaun / 2} y="294" text-anchor="middle" font-size="10" fill="#6A6A6A">sertifikat</text>
		</g>
	{/each}

	<!-- tingkat 1 -->
	{#each [0, 1, 2, 3] as i}
		{@const x = i * 2 * (lebarDaun + jarak) + lebarDaun / 2 + jarak / 2}
		<g>
			<rect x={x + 3} y="189" width={lebarDaun} height="34" rx="7" fill="#101010" />
			<rect x={x} y="186" width={lebarDaun} height="34" rx="7" fill="#FFFFFF" stroke="#101010" stroke-width="2.5" />
			<text x={x + lebarDaun / 2} y="207" text-anchor="middle" font-size="11" font-weight="600" fill="#6A6A6A">hash gabungan</text>
		</g>
	{/each}

	<!-- tingkat 2 -->
	{#each [0, 1] as i}
		{@const x = i * 4 * (lebarDaun + jarak) + 1.5 * lebarDaun + jarak}
		<g>
			<rect x={x + 3} y="115" width={lebarDaun} height="34" rx="7" fill="#101010" />
			<rect x={x} y="112" width={lebarDaun} height="34" rx="7" fill="#FFFFFF" stroke="#101010" stroke-width="2.5" />
			<text x={x + lebarDaun / 2} y="133" text-anchor="middle" font-size="11" font-weight="600" fill="#6A6A6A">hash gabungan</text>
		</g>
	{/each}

	<!-- root -->
	<g>
		<rect x={totalLebar / 2 - 122} y="11" width="250" height="60" rx="10" fill="#101010" />
		<rect x={totalLebar / 2 - 125} y="8" width="250" height="60" rx="10" fill="#FFD028" stroke="#101010" stroke-width="3" />
		<text x={totalLebar / 2} y="33" text-anchor="middle" font-size="16" font-weight="800" fill="#101010">MERKLE ROOT</text>
		<text x={totalLebar / 2} y="53" text-anchor="middle" font-size="12" font-weight="600" fill="#101010">32 bita ke blockchain</text>
	</g>
</svg>

<style>
	svg { display: block; width: 100%; height: auto; }
</style>
