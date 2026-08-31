import { fail, redirect } from '@sveltejs/kit';
import { buatSesi, NAMA_COOKIE } from '$lib/server/auth';
import { adalahStaf } from '$lib/peran';
import { masuk } from '$lib/server/pengguna';
import { AKUN_DEMO, SANDI_PESERTA } from '$lib/server/pengguna';
import { muatBatch } from '$lib/server/data';

export async function load({ locals, url }) {
	if (locals.pengguna) {
		throw redirect(303, adalahStaf(locals.pengguna.peran) ? '/admin' : '/portal');
	}
	const data = await muatBatch();
	let surelPeserta: string | null = null;
	if (data?.sertifikat.length) {
		try {
			surelPeserta = JSON.parse(data.sertifikat[0].dokumenKanonik).credentialSubject.email ?? null;
		} catch {
			surelPeserta = null;
		}
	}
	return {
		tujuan: url.searchParams.get('tujuan') ?? '',
		demo: AKUN_DEMO.map((a) => ({ email: a.email, sandi: a.sandi, peran: a.peran })),
		peserta: surelPeserta ? { email: surelPeserta, sandi: SANDI_PESERTA } : null
	};
}

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const sandi = String(form.get('sandi') ?? '');
		const tujuan = String(form.get('tujuan') ?? '');

		if (!email || !sandi) return fail(400, { email, pesan: 'Surel dan kata sandi wajib diisi' });

		const pengguna = await masuk(email, sandi);
		if (!pengguna) return fail(401, { email, pesan: 'Surel atau kata sandi salah' });

		cookies.set(NAMA_COOKIE, buatSesi(pengguna), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 8
		});

		const bawaan = adalahStaf(pengguna.peran) ? '/admin' : '/portal';
		throw redirect(303, tujuan && tujuan.startsWith('/') ? tujuan : bawaan);
	}
};
