import {Easing, interpolate} from 'remotion';

// ═══════════ KIT — tokens da estética e utilitários ═══════════
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const INK = '#EDEBE6'; // "branco" quente dos pontos e textos
export const BG = '#010101'; // fundo quase preto
export const TAU = Math.PI * 2;

export const E_IN = Easing.bezier(0.16, 1, 0.3, 1); // entradas
export const E_OUT = Easing.bezier(0.7, 0, 0.84, 0); // saídas
export const E_IO = Easing.bezier(0.65, 0, 0.35, 1); // morphs e câmera

/** interpolate com clamp dos dois lados (sempre) */
export const ci = (x: number, a: [number, number], b: [number, number], ease?: (t: number) => number) =>
	interpolate(x, a, b, {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** janela de visibilidade: entra em [a, a+fi], sai em [b-fo, b] */
export const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) => ci(t, [a, a + fi], [0, 1]) * ci(t, [b - fo, b], [1, 0]);
