import { redirect, type Handle } from '@sveltejs/kit';
import { ambilSesi, NAMA_COOKIE } from '$lib/server/auth';
import { adalahStaf } from '$lib/peran';

/**
 * Penjagaan rute yang sesungguhnya — bukan sekadar menyembunyikan tautan.
 * Permintaan ke area terlindungi ditolak di server sebelum halaman dirender,
 * sehingga mengetik URL langsung pun tidak bisa menembus.
 */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pengguna = ambilSesi(event.cookies.get(NAMA_COOKIE));

	const jalur = event.url.pathname;
	const p = event.locals.pengguna;

	if (jalur.startsWith('/admin')) {
		if (!p) throw redirect(303, `/masuk?tujuan=${encodeURIComponent(jalur)}`);
		if (!adalahStaf(p.peran)) throw redirect(303, '/portal?galat=bukan-staf');
	}

	if (jalur.startsWith('/portal')) {
		if (!p) throw redirect(303, `/masuk?tujuan=${encodeURIComponent(jalur)}`);
		if (adalahStaf(p.peran)) throw redirect(303, '/admin');
	}

	return resolve(event);
};
