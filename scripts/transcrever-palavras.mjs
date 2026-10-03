// Transcreve a narração e gera o tempo de CADA PALAVRA (base da legenda e de todo o timing do vídeo).
// Usa whisper.cpp local via @remotion/install-whisper-cpp (instala na primeira execução).
//
// Uso:  node scripts/transcrever-palavras.mjs public/narracao.mp3 src/data/words.json [pt]
// Saída: [{ "text": "Sócrates", "start": 0.06, "end": 0.56 }, ...]  (segundos)
import {installWhisperCpp, downloadWhisperModel, transcribe, toCaptions} from '@remotion/install-whisper-cpp';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [input, output = 'src/data/words.json', language = 'pt'] = process.argv.slice(2);
if (!input) {
	console.error('Uso: node scripts/transcrever-palavras.mjs <audio> [saida.json] [idioma]');
	process.exit(1);
}
const WHISPER_DIR = process.env.WHISPER_DIR || path.join(os.homedir(), '.whisper-cpp');
const VERSION = '1.5.5';
const MODEL = process.env.WHISPER_MODEL || 'medium';

await installWhisperCpp({to: WHISPER_DIR, version: VERSION});
await downloadWhisperModel({model: MODEL, folder: WHISPER_DIR});

// whisper.cpp exige WAV 16 kHz mono
const wav = path.join(os.tmpdir(), `whisper-in-${Date.now()}.wav`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-ar', '16000', '-ac', '1', wav]);

const out = await transcribe({inputPath: wav, whisperPath: WHISPER_DIR, whisperCppVersion: VERSION, model: MODEL, tokenLevelTimestamps: true, language});
const tokens = toCaptions({whisperCppOutput: out}).captions;

// junta sub-tokens em palavras (um token que começa com espaço inicia uma palavra nova)
const words = [];
for (const c of tokens) {
	const txt = c.text;
	if (!txt.trim()) continue;
	const s = c.startMs / 1000;
	const e = c.endMs / 1000;
	if (/^[.,!?…:;]+$/.test(txt.trim()) && words.length) {
		words[words.length - 1].text += txt.trim();
		continue;
	}
	if (txt.startsWith(' ') || !words.length) words.push({text: txt.trim(), start: s, end: e});
	else {
		words[words.length - 1].text += txt.trim();
		words[words.length - 1].end = e;
	}
}
const clean = words.map((w) => ({text: w.text, start: +w.start.toFixed(2), end: +w.end.toFixed(2)}));
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify(clean, null, 1));
fs.unlinkSync(wav);
console.log(`${clean.length} palavras → ${output}`);
console.log(clean.map((w) => w.text).join(' '));
