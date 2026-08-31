<script lang="ts">
	import { tautanExplorer, infoExplorer, type JenisTautan } from '$lib/explorer';

	interface Props {
		nilai: string | number;
		jenis?: JenisTautan | 'data';
		chainId: number;
		basisExplorer?: string | null;
		potong?: boolean;
	}

	let { nilai, jenis = 'data', chainId, basisExplorer = null, potong = false }: Props = $props();

	const teks = $derived(String(nilai));
	const tampil = $derived(
		potong && teks.length > 22 ? `${teks.slice(0, 10)}…${teks.slice(-8)}` : teks
	);
	const tautan = $derived(
		jenis === 'data' ? null : tautanExplorer(chainId, jenis, teks, basisExplorer)
	);
	const explorer = $derived(infoExplorer(chainId, basisExplorer));
	// Explorer bawaan aplikasi dibuka di tab yang sama; explorer publik di tab baru.
	const internal = $derived(Boolean(tautan && tautan.startsWith('/')));

	let disalin = $state(false);
	async function salin() {
		try {
			await navigator.clipboard.writeText(teks);
			disalin = true;
			setTimeout(() => (disalin = false), 1400);
		} catch {
			disalin = false;
		}
	}
</script>

{#if tautan}
	<a class="hash tautan" href={tautan}
		target={internal ? null : '_blank'}
		rel={internal ? null : 'noopener'}
		title="Buka di {explorer?.nama}">
		<span class="teks">{tampil}</span>
		<span class="ikon">{internal ? '→' : '↗'}</span>
	</a>
{:else}
	<button class="hash salin" onclick={salin}
		title={jenis === 'data'
			? 'Klik untuk menyalin'
			: 'Jaringan ini tidak punya block explorer publik — klik untuk menyalin'}>
		<span class="teks">{tampil}</span>
		<span class="ikon">{disalin ? '✓' : '⧉'}</span>
	</button>
{/if}

<style>
	.hash {
		display: inline-flex; align-items: baseline; gap: 6px;
		font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		font-size: 11.5px; line-height: 1.5; text-align: left;
		border: 0; background: none; padding: 1px 4px; margin: -1px -4px;
		border-radius: 5px; cursor: pointer; color: inherit;
		overflow-wrap: anywhere; max-width: 100%;
	}
	.hash:hover { background: color-mix(in srgb, var(--aksen) 12%, transparent); }
	.tautan { color: var(--aksen); text-decoration: none; }
	.ikon { font-size: 10px; opacity: 0.65; flex: 0 0 auto; }
	.salin:hover .ikon { opacity: 1; }
</style>
