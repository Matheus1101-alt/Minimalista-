// Revisão visual: renderiza UM frame por momento (segundos) e monta uma folha de contato.
// Empacota o projeto uma única vez (rápido). Use antes de todo render final.
//
// Uso:  node scripts/contact-sheet.mjs <idComposicao> <segundo1> <segundo2> ...  [--colunas 9] [--escala 0.25]
// Saída: out/contact-sheet.jpg  (+ out/stills/*.jpg)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => {
	const i = args.indexOf(k);
	return i >= 0 ? args.splice(i, 2)[1] : d;
};
const cols = +opt('--colunas', '9');
const scale = +opt('--escala', '0.25');
const browserExecutable = opt('--browser', undefined);
const [id, ...secs] = args;
if (!id || !secs.length) {
	console.error('Uso: node scripts/contact-sheet.mjs <id> <s1> <s2> ... [--colunas 9] [--escala 0.25] [--browser caminho]');
	process.exit(1);
}
const dir = path.resolve('out/stills');
fs.rmSync(dir, {recursive: true, force: true});
fs.mkdirSync(dir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.tsx')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
let k = 0;
for (const s of secs) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(+s * composition.fps));
	await renderStill({serveUrl, composition, frame, output: path.join(dir, `s${String(k++).padStart(3, '0')}.jpg`), imageFormat: 'jpeg', scale, browserExecutable});
	process.stdout.write(`${s}s `);
}
const rows = Math.ceil(secs.length / cols);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(dir, 's%03d.jpg'), '-frames:v', '1', '-filter_complex', `tile=${cols}x${rows}:padding=4`, 'out/contact-sheet.jpg']);
console.log('\n→ out/contact-sheet.jpg');
