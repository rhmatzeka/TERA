/** Memeriksa isi PDF sertifikat tanpa membukanya secara visual. */
import { PDFDocument } from 'pdf-lib';

const berkas = await Bun.file(process.argv[2] ?? '/tmp/s.pdf').arrayBuffer();
const pdf = await PDFDocument.load(berkas);
const hal = pdf.getPage(0);
const { width, height } = hal.getSize();

console.log('\n=== Struktur PDF ===');
console.log('judul      :', pdf.getTitle());
console.log('subjek     :', pdf.getSubject());
console.log('produser   :', pdf.getProducer());
console.log('halaman    :', pdf.getPageCount());
console.log('ukuran     :', `${width} x ${height} pt`, width > height ? '(A4 mendatar)' : '(tegak)');
console.log('ukuran brk :', berkas.byteLength, 'byte');

const isi = new TextDecoder('latin1').decode(new Uint8Array(berkas));
console.log('gambar QR  :', isi.includes('/Image') ? 'ada' : 'TIDAK ADA');
const font = [...new Set((isi.match(/\/BaseFont\s*\/([A-Za-z-]+)/g) ?? []).map((f) => f.split('/').pop()))];
console.log('font       :', font.join(', ') || '(terkompresi)');
console.log('');
