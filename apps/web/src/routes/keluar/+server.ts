import { redirect } from '@sveltejs/kit';
import { hapusSesi, NAMA_COOKIE } from '$lib/server/auth';

export function POST({ cookies }) {
	hapusSesi(cookies.get(NAMA_COOKIE));
	cookies.delete(NAMA_COOKIE, { path: '/' });
	throw redirect(303, '/');
}
