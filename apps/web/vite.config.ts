import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		strictPort: false,
		watch: {
			// Proyek ini berada di drive Windows yang diakses lewat WSL (/mnt/c).
			// Notifikasi perubahan berkas dari sistem tidak sampai ke Vite di sana,
			// sehingga perubahan kode tidak termuat ulang dan server menyajikan
			// modul lama. Polling menutup celah itu.
			usePolling: true,
			interval: 700,
			// Tanpa pengecualian ini, polling akan memindai puluhan ribu berkas
			// dependensi pada setiap siklus dan membuat mesin berat.
			ignored: ['**/node_modules/**', '**/.svelte-kit/**', '**/data/**', '**/.git/**']
		}
	}
});
