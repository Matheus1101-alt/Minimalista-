import React from 'react';
import {useCurrentFrame} from 'remotion';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import {H} from './kit';
import WORDS from './data/words.json';

// ═══════════ LEGENDA PADRÃO ═══════════
// Inter, todas as palavras na mesma espessura (400); a palavra que está sendo falada fica em bold (700) e branca.
// Palavras aparecem uma a uma no tempo exato da fala. Blocos de até 4 palavras / ~20 caracteres.
// Base do bloco a ~380 px da borda inferior.
const INTER = 'Inter';
type Wd = {text: string; start: number; end: number};
const WS = WORDS as Wd[];

const GRUPOS: Wd[][] = (() => {
	const out: Wd[][] = [];
	let cur: Wd[] = [];
	WS.forEach((w, i) => {
		cur.push(w);
		const chars = cur.map((x) => x.text).join(' ').length;
		const gap = WS[i + 1] ? WS[i + 1].start - w.end : 9;
		if (/[.,!?…:]$/.test(w.text) || cur.length >= 4 || chars > 20 || gap > 0.35) {
			out.push(cur);
			cur = [];
		}
	});
	if (cur.length) out.push(cur);
	return out;
})();

export const Legenda: React.FC<{fim: number}> = ({fim}) => {
	const t = useCurrentFrame() / 30;
	const gi = GRUPOS.findIndex((g, i) => t >= g[0].start - 0.05 && t < (GRUPOS[i + 1]?.[0].start ?? fim) - 0.05);
	if (gi < 0) return null;
	const g = GRUPOS[gi];
	if (t > g[g.length - 1].end + 1.2) return null;
	let ativa = 0;
	g.forEach((w, i) => t >= w.start && (ativa = i));
	return (
		<div style={{position: 'absolute', left: 85, right: 85, top: H - 380 - 90, textAlign: 'center', fontFamily: INTER, fontSize: 70, lineHeight: 1.2, letterSpacing: -2.2, color: '#F2F0EB', textShadow: '0 2px 24px #000'}}>
			{g.map((w, i) => (
				<React.Fragment key={w.start}>
					<span style={{display: 'inline-block', visibility: t >= w.start ? 'visible' : 'hidden', color: i === ativa ? '#fff' : '#CBC9C5', fontWeight: i === ativa ? 700 : 400, transform: i === ativa ? 'translateY(-2px)' : 'none'}}>{w.text}</span>
					{i < g.length - 1 ? ' ' : ''}
				</React.Fragment>
			))}
		</div>
	);
};
