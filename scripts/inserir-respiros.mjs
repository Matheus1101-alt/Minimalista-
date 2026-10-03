// Deixa a narração mais calma inserindo RESPIROS entre frases — sem acelerar nem distorcer a voz.
// Regra de ouro: só corta onde há silêncio real (nunca no meio/cauda de uma palavra = "voz picotada").
//
// Uso:  node scripts/inserir-respiros.mjs public/narracao-raw.mp3 src/data/words.json public/narracao.mp3
// Gera: public/narracao.mp3 (com pausas), src/data/words.json atualizado (tempos já deslocados)
//       e src/data/pausas.json (registro dos cortes).
//
// Pausas padrão por pontuação (ajuste em PAUSA): ponto 0,45 s · reticências 0,55 s · vírgula 0,2 s.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [input, wordsPath, output] = process.argv.slice(2);
if (!input || !wordsPath || !output) {
	console.error('Uso: node scripts/inserir-respiros.mjs <audio-cru> <words.json> <saida.mp3>');
	process.exit(1);
}
const PAUSA = {'.': 0.45, '!': 0.45, '?': 0.45, '…': 0.55, ':': 0.35, ',': 0.2};
const SR = 44100;

const raw = path.join(os.tmpdir(), `respiros-${Date.now()}.f32`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-ac', '1', '-ar', String(SR), '-f', 'f32le', raw]);
const buf = fs.readFileSync(raw);
const x = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const db = (t) => {
	const s = Math.round(t * SR), w = Math.round(SR * 0.01);
	let a = 0;
	for (let i = s; i < s + w; i++) a += (x[i] || 0) ** 2;
	return 20 * Math.log10(Math.sqrt(a / w) + 1e-9);
};

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const cuts = [];
words.forEach((w, i) => {
	const next = words[i + 1];
	if (!next) return;
	const p = PAUSA[w.text.slice(-1)];
	if (!p) return;
	// procura o trecho silencioso mais longo entre o fim desta palavra e o começo da próxima
	let best = null;
	for (const th of [-44, -40, -37]) {
		let run = 0, rs = 0;
		for (let t = next.start - 0.45; t <= next.start + 0.06; t += 0.005) {
			if (db(t) < th) {
				if (!run) rs = t;
				run += 0.005;
				if (!best || run > best.len) best = {len: run, c: rs + run / 2};
			} else run = 0;
		}
		if (best && best.len >= 0.08) break;
	}
	if (best && best.len >= 0.07) cuts.push([+best.c.toFixed(3), p]);
	else console.warn(`sem silêncio seguro antes de "${next.text}" (${next.start}s) — pausa ignorada`);
});

// monta o áudio: trechos + silêncio, com micro-fades para não estalar
const parts = [];
let prev = 0;
cuts.forEach(([c, s], i) => {
	parts.push(`[0:a]atrim=${prev}:${c},asetpts=N/SR/TB${i ? ',afade=t=in:d=0.01' : ''},afade=t=out:st=${(c - prev - 0.015).toFixed(3)}:d=0.015[a${i}]`);
	parts.push(`anullsrc=r=${SR}:cl=mono,atrim=0:${s}[s${i}]`);
	prev = c;
});
parts.push(`[0:a]atrim=${prev},asetpts=N/SR/TB,afade=t=in:d=0.01[a${cuts.length}]`);
const cat = cuts.map((_, k) => `[a${k}][s${k}]`).join('') + `[a${cuts.length}]`;
parts.push(`${cat}concat=n=${2 * cuts.length + 1}:v=0:a=1[out]`);
const script = path.join(os.tmpdir(), `respiros-${Date.now()}.txt`);
fs.writeFileSync(script, parts.join(';'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-filter_complex_script', script, '-map', '[out]', '-ar', String(SR), '-ac', '1', '-b:a', '192k', output]);

// desloca os tempos das palavras
const shift = (t) => t + cuts.reduce((a, [c, s]) => a + (t > c ? s : 0), 0);
const moved = words.map((w) => ({...w, start: +shift(w.start).toFixed(2), end: +shift(w.end).toFixed(2)}));
fs.writeFileSync(wordsPath, JSON.stringify(moved, null, 1));
fs.writeFileSync(path.join(path.dirname(wordsPath), 'pausas.json'), JSON.stringify(cuts));
fs.unlinkSync(raw);
fs.unlinkSync(script);
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', output]).toString().trim();
console.log(`${cuts.length} respiros · narração final ${(+dur).toFixed(2)} s → ${output}`);
