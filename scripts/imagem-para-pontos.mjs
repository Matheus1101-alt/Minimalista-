// Converte uma imagem (retrato, busto, foto histórica) em dados de PONTILHISMO.
// Cada ponto = [x 0..1, y 0..1, intensidade 0..1]. O motor desenha o raio/opacidade pela intensidade.
//
// Uso:  node scripts/imagem-para-pontos.mjs <imagem> <saida.json> [--grade 74x98] [--corte x,y,w,h] [--limiar 0.36] [--faixa 0.5] [--inverter]
//   --grade   resolução da amostragem (colunas x linhas). ~70x100 = ~3–6 mil pontos para um rosto.
//   --corte   recorte em FRAÇÕES da imagem (ex.: 0.12,0.02,0.72,0.84) para ficar só com a cabeça.
//   --limiar  luminância mínima (0..1) — tudo abaixo vira fundo.
//   --faixa   largura da faixa de luminância mapeada para 0..1 acima do limiar.
//   --inverter útil quando o sujeito é escuro sobre fundo claro.
//
// DICA: fundo claro ou texturizado? Remova o fundo antes (PNG transparente); o script compõe sobre preto.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const [input, output] = args;
if (!input || !output) {
	console.error('Uso: node scripts/imagem-para-pontos.mjs <imagem> <saida.json> [--grade 74x98] [--corte x,y,w,h] [--limiar 0.36] [--faixa 0.5] [--inverter]');
	process.exit(1);
}
const opt = (k, d) => {
	const i = args.indexOf(k);
	return i >= 0 ? args[i + 1] : d;
};
const [GW, GH] = opt('--grade', '74x98').split('x').map(Number);
const corte = opt('--corte', '0,0,1,1').split(',').map(Number);
const limiar = +opt('--limiar', '0.36');
const faixa = +opt('--faixa', '0.5');
const inverter = args.includes('--inverter');

const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', input]).toString().trim().split('x').map(Number);
const raw = path.join(os.tmpdir(), `pontos-${Date.now()}.raw`);
const crop = `crop=${Math.round(w * corte[2])}:${Math.round(h * corte[3])}:${Math.round(w * corte[0])}:${Math.round(h * corte[1])}`;
// compõe sobre preto (respeita transparência) → recorta → cinza → reduz para a grade
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=black:s=${w}x${h}`, '-i', input, '-filter_complex', `[0][1]overlay=shortest=1,${crop},format=gray,scale=${GW}:${GH}`, '-frames:v', '1', '-f', 'rawvideo', raw]);
const px = fs.readFileSync(raw);
const pts = [];
for (let y = 0; y < GH; y++)
	for (let x = 0; x < GW; x++) {
		let v = px[y * GW + x] / 255;
		if (inverter) v = 1 - v;
		const n = (v - limiar) / faixa;
		if (n > 0.05) pts.push([+(x / GW).toFixed(3), +(y / GH).toFixed(3), +Math.min(1, n).toFixed(2)]);
	}
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify(pts));
fs.unlinkSync(raw);
console.log(`${pts.length} pontos → ${output}`);
if (pts.length > GW * GH * 0.8) console.warn('muitos pontos: o fundo provavelmente entrou. Aumente --limiar, use --corte ou remova o fundo.');
