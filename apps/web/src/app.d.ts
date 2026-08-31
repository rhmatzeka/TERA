import type { Pengguna } from '$lib/peran';

declare global {
	namespace App {
		interface Locals {
			pengguna: Pengguna | null;
		}
	}
}

export {};
