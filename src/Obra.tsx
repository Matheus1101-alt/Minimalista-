import React from 'react';
import {Img, random, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import {ci, E_IO, E_OUT, INK, W, H} from './kit';

// ═══════════ OBRA / FOTO HISTÓRICA ═══════════
// Nunca em corte seco no meio de uma ilustração. A imagem tem o próprio momento:
// abre do centro (máscara), pontos correm em volta como moldura (conduzem o olhar),
// crédito embaixo (título em itálico + autor · ano · acervo), fecha e os pontos seguem para a próxima forma.
const SERIF = 'Instrument Serif';
const MONO = 'JetBrains Mono';

export const Obra: React.FC<{a: number; b: number; src: string; rect: [number, number, number, number]; titulo: string; credito: string; pos?: string}> = ({a, b, src, rect, titulo, credito, pos = '50% 50%'}) => {
	const t = useCurrentFrame() / 30;
	if (t < a - 0.05 || t > b + 0.05) return null;
	const [x, y, w, h] = rect;
	const open = E_IO(ci(t, [a, a + 0.5], [0, 1]));
	const close = E_OUT(ci(t, [b - 0.4, b], [0, 1]));
	const v = open * (1 - close);
	const zoom = 1.08 - 0.08 * ci(t, [a, b], [0, 1]); // leve recuo contínuo
	const cap = ci(t, [a + 0.45, a + 0.75], [0, 1]) * (1 - close);
	const per = 2 * (w + h);
	return (
		<>
			<div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', clipPath: `inset(${(1 - v) * 50}% 0 ${(1 - v) * 50}% 0)`}}>
				<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${zoom})`, filter: 'grayscale(1) contrast(1.12)'}} />
			</div>
			<svg width={W} height={H} style={{position: 'absolute', opacity: v}}>
				{Array.from({length: 520}, (_, k) => {
					const off = 16 + (k % 5) * 7;
					let d = ((((k / 520 + t * 0.05 * (k % 2 ? 1 : -1)) % 1) + 1) % 1) * per;
					let px = 0, py = 0;
					if (d < w) [px, py] = [x + d, y - off];
					else if ((d -= w) < h) [px, py] = [x + w + off, y + d];
					else if ((d -= h) < w) [px, py] = [x + w - d, y + h + off];
					else [px, py] = [x - off, y + h - (d - w)];
					return <circle key={k} cx={px} cy={py} r={1 + random('m' + k) * 1.4} fill={INK} opacity={0.3 + 0.5 * (1 - (k % 5) / 5)} />;
				})}
			</svg>
			<div style={{position: 'absolute', left: 0, right: 0, top: y + h + 44, textAlign: 'center', opacity: cap, transform: `translateY(${(1 - cap) * 12}px)`}}>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: INK}}>{titulo}</div>
				<div style={{fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: INK, opacity: 0.55, marginTop: 8}}>{credito}</div>
			</div>
		</>
	);
};
