import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {ci, E_IO, INK, lerp, TAU, W, H} from './kit';

// ═══════════ MUNDO 3D DE PONTOS ═══════════
// Um único conjunto de N pontos atravessa o vídeo inteiro e MORFA de uma forma para outra.
// Cada forma devolve, para o ponto i no tempo t: [x, y, z, raio, opacidade] em coordenadas do mundo
// (origem no centro da tela). Uma câmera única projeta tudo — órbita, aproximação, mergulho.
//
// COMO USAR:
//   1. Crie formas em FORMAS (cada ideia do roteiro = uma forma).
//   2. Liste a sequência em CHAVES (tempo de início de cada forma, duração do morph, espalhamento).
//   3. Movimente a câmera em CAMERAS.
export const N = 5000;
type P5 = [number, number, number, number, number];
const SX = W / 2;
const SY = 880; // centro visual um pouco acima do meio (a legenda fica embaixo)

const R = Array.from({length: N}, (_, i) => ({a: random('a' + i), b: random('b' + i), c: random('c' + i), dl: random('d' + i)}));

// ─── tempos-chave (segundos da narração, de words.json) ───
export const K = {
	pulso: 0.09, // "Se você sente uma dor..."
	alerta: 4.09, // "preste atenção"
	colica: 5.32, // "Isso pode não ser apenas uma cólica"
	obraUtero: 8.12, // "A endometriose é uma doença"
	utero: 10.28, // "um tecido semelhante ao endométrio"
	fora: 12.39, // "cresce fora do útero"
	inflama: 13.96, // "podendo provocar inflamação e dor"
	sinais: 16.3, // "e os sinais podem ir muito além"
	ciclo: 19.4, // "Dor intensa durante a menstruação"
	relacoes: 21.71, // "dor nas relações sexuais"
	obraPelve: 23.51, // "dor para evacuar ou urinar"
	ovulo: 27.11, // "e até dificuldade para engravidar"
	atencao: 31.72, // "Mas atenção"
	duvida: 32.81, // "esses sintomas não significam, sozinhos..."
	lupa: 37.36, // "O diagnóstico precisa ser feito..."
	corpo: 41.12, // "Seu corpo"
	grito: 42.64, // "precisar gritar"
	ouvido: 43.97, // "para ser ouvido"
	fim: 44.9,
};
export const END = 46.5;

// ═══════════ CÂMERA ═══════════
type Cam = {yaw: number; pitch: number; dist: number; x: number; y: number};
const FOCAL = 1400;
const CAMERAS: {t: number; c: Cam; d?: number}[] = [
	{t: 0, c: {yaw: 0, pitch: 0, dist: 1500, x: 0, y: 0}},
	{t: 0.6, c: {yaw: 0.05, pitch: 0, dist: 1300, x: 0, y: 0}, d: 3.0}, // aproximação lenta no pulso
	{t: K.alerta, c: {yaw: 0, pitch: 0, dist: 1500, x: 0, y: 0}, d: 0.6},
	{t: K.colica, c: {yaw: -0.4, pitch: 0.35, dist: 1450, x: 0, y: 0}, d: 0.9},
	{t: K.colica + 0.9, c: {yaw: 0.4, pitch: 0.2, dist: 1350, x: 0, y: 0}, d: 1.8}, // órbita no nó
	{t: K.utero, c: {yaw: 0, pitch: 0, dist: 1500, x: 0, y: 0}, d: 0.8},
	{t: K.utero + 0.8, c: {yaw: 0.25, pitch: 0.1, dist: 1300, x: 0, y: -40}, d: 1.6},
	{t: K.fora, c: {yaw: -0.3, pitch: 0.25, dist: 1650, x: 0, y: 0}, d: 1.0}, // recua: o tecido escapa
	{t: K.inflama, c: {yaw: 0.2, pitch: 0.15, dist: 1350, x: 0, y: 0}, d: 1.6},
	{t: K.sinais, c: {yaw: 0, pitch: 0.9, dist: 1750, x: 0, y: 0}, d: 1.2}, // vista de cima: além da cólica
	{t: K.ciclo, c: {yaw: 0, pitch: 0.12, dist: 1450, x: 0, y: 0}, d: 0.9},
	{t: K.relacoes, c: {yaw: 0.5, pitch: 0.2, dist: 1400, x: 0, y: 0}, d: 1.2},
	{t: K.obraPelve, c: {yaw: 0, pitch: 0, dist: 1600, x: 0, y: 0}, d: 0.8},
	{t: K.ovulo, c: {yaw: -0.2, pitch: 0.1, dist: 1450, x: 0, y: 0}, d: 1.0},
	{t: K.ovulo + 1.2, c: {yaw: 0.2, pitch: 0.05, dist: 1250, x: 0, y: 0}, d: 3.0},
	{t: K.atencao, c: {yaw: 0, pitch: 0, dist: 1400, x: 0, y: 0}, d: 0.6},
	{t: K.duvida, c: {yaw: -0.35, pitch: 0.1, dist: 1450, x: 0, y: 0}, d: 1.2},
	{t: K.duvida + 1.3, c: {yaw: 0.35, pitch: 0.1, dist: 1400, x: 0, y: 0}, d: 3.0},
	{t: K.lupa, c: {yaw: 0.3, pitch: 0.2, dist: 1500, x: 0, y: 0}, d: 1.0},
	{t: K.lupa + 1.0, c: {yaw: -0.15, pitch: 0.05, dist: 1250, x: 0, y: 0}, d: 2.6},
	{t: K.corpo, c: {yaw: 0, pitch: 0, dist: 1400, x: 0, y: 0}, d: 0.8},
	{t: K.grito, c: {yaw: 0, pitch: 0, dist: 1800, x: 0, y: 0}, d: 0.6},
	{t: K.ouvido, c: {yaw: 0, pitch: 0, dist: 1300, x: 0, y: 0}, d: 0.8},
	{t: K.fim, c: {yaw: 0, pitch: 0, dist: 40, x: 0, y: 0}, d: 1.2}, // mergulho no ponto → preto (loop)
];
export const camAt = (t: number): Cam => {
	let k = 0;
	for (let j = 0; j < CAMERAS.length; j++) if (t >= CAMERAS[j].t) k = j;
	const a = CAMERAS[Math.max(0, k - 1)].c;
	const b = CAMERAS[k];
	const m = k === 0 ? 1 : E_IO(ci(t, [b.t, b.t + (b.d ?? 0.8)], [0, 1]));
	const c = {} as Cam;
	(Object.keys(b.c) as (keyof Cam)[]).forEach((key) => (c[key] = lerp(a[key], b.c[key], m)));
	c.yaw += Math.sin(t * 0.35) * 0.02; // a câmera nunca fica 100% parada
	c.pitch += Math.sin(t * 0.27) * 0.012;
	return c;
};
export const project = (x: number, y: number, z: number, c: Cam): [number, number, number] => {
	x -= c.x;
	y -= c.y;
	const x1 = x * Math.cos(c.yaw) + z * Math.sin(c.yaw);
	const z1 = -x * Math.sin(c.yaw) + z * Math.cos(c.yaw);
	const y1 = y * Math.cos(c.pitch) - z1 * Math.sin(c.pitch);
	const z2 = y * Math.sin(c.pitch) + z1 * Math.cos(c.pitch);
	const zz = z2 + c.dist;
	if (zz < 30) return [0, 0, -1];
	const s = FOCAL / zz;
	return [SX + x1 * s, SY + y1 * s, s];
};

// ═══════════ FORMAS ═══════════
const ambiente = (i: number, t: number, o = 0.05): P5 => {
	const d = R[i];
	return [(d.a - 0.5) * 2600, (d.b - 0.5) * 3600, (d.c - 0.5) * 2400 + Math.sin(t * 0.2 + d.a * 9) * 40, 1, o];
};
const sph = (i: number, r: number): [number, number, number] => {
	const d = R[i];
	const u = d.a * 2 - 1;
	const th = d.b * TAU;
	const s = Math.sqrt(1 - u * u);
	return [Math.cos(th) * s * r, u * r, Math.sin(th) * s * r];
};
const rotY = (x: number, z: number, a: number): [number, number] => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];

// ─── ÚTERO (vista frontal, pera invertida) ───
// faixas de pontos: corpo 0–2300 · endométrio 2300–2900 · trompas 2900–3700 · ovários 3700–4100 · "tecido" 4100–4700
const hw = (y: number) => {
	// meia-largura do corpo em função de y (-220 = fundo, +200 = colo)
	const u = (y + 220) / 420;
	if (u < 0.12) return 170 * Math.sqrt(Math.max(0, u / 0.12)) * 0.98;
	return lerp(175, 55, Math.pow(Math.min(1, (u - 0.12) / 0.88), 1.3));
};
const corpoUtero = (d: {a: number; b: number; c: number}, k = 1): [number, number, number] => {
	const y = -220 + d.a * 420;
	const w = hw(y) * k;
	const th = d.b * TAU;
	return [Math.cos(th) * w, y * k - (1 - k) * 10, Math.sin(th) * w * 0.45];
};
const LESOES: [number, number, number][] = [
	[-330, 170, 40], [300, 210, -30], [-120, 300, 60], [420, -40, 20], [-430, -150, -40], [140, -330, 30], [-250, -330, 0],
];
const utero = (i: number, t: number, modo: 0 | 1 | 2 | 3, brilho = 1): P5 => {
	const d = R[i];
	const pulse = modo === 3 ? 1 + 0.08 * Math.sin(t * 7 + d.a * 3) : 1;
	if (i < 2300) {
		const [x, y, z] = corpoUtero(d);
		return [x, y, z, 1.25, (modo === 1 ? 0.35 : 0.75) * brilho];
	}
	if (i < 2900) {
		const [x, y, z] = corpoUtero(d, 0.55);
		const on = modo === 1 ? 1 : 0.35;
		return [x, y - 20, z, modo === 1 ? 2 : 1.2, on * brilho];
	}
	if (i < 3700) {
		const lado = i % 2 ? 1 : -1;
		const u = d.a;
		const x = lado * lerp(165, 470, u);
		const y = -190 - Math.sin(u * Math.PI) * 70 + Math.pow(u, 3) * 220;
		const r = 14 + u * 10;
		return [x + Math.cos(d.b * TAU) * 4, y + Math.sin(d.b * TAU) * r * 0.5, Math.cos(d.c * TAU) * r * 0.6, 1.1, 0.6 * brilho];
	}
	if (i < 4100) {
		const lado = i % 2 ? 1 : -1;
		const [x, y, z] = sph(i, 1);
		return [lado * 330 + x * 70, -40 + y * 45, z * 40, 1.2, 0.7 * brilho];
	}
	if (i < 4700) {
		// "tecido semelhante ao endométrio": dentro (modo 0/1) ou fora do útero (2/3)
		if (modo < 2) {
			const [x, y, z] = corpoUtero(R[i], 0.5 * R[i].dl + 0.05);
			return [x, y - 20, z, 1.6, (modo === 1 ? 1 : 0.4) * brilho];
		}
		const L = LESOES[i % LESOES.length];
		const [x, y, z] = sph(i, Math.cbrt(d.dl) * 38 * pulse);
		return [L[0] + x, L[1] + y, L[2] + z, modo === 3 ? 2.1 : 1.7, (modo === 3 ? 0.75 + 0.25 * Math.sin(t * 7 + i) : 0.95) * brilho];
	}
	return ambiente(i, t);
};

// ─── símbolos desenhados por caminho ───
const amostraCaminho = (pts: [number, number][], u: number): [number, number] => {
	const seg = pts.length - 1;
	const f = u * seg;
	const k = Math.min(seg - 1, Math.floor(f));
	const m = f - k;
	return [lerp(pts[k][0], pts[k + 1][0], m), lerp(pts[k][1], pts[k + 1][1], m)];
};
const INTERROGA: [number, number][] = Array.from({length: 40}, (_, k) => {
	const a = lerp(Math.PI * 1.0, Math.PI * 2.45, k / 39);
	return [Math.cos(a) * 150, -200 + Math.sin(a) * 150] as [number, number];
}).concat([[0, -20], [0, 110]]);

const FORMAS: Record<string, (i: number, t: number) => P5> = {
	nuvem: (i) => {
		const d = R[i];
		return [(d.a - 0.5) * 900, (d.b - 0.5) * 1200, (d.c - 0.5) * 800, 1.4, 0.0];
	},
	/** batimento/dor: uma linha de pulso que cresce em picos e "para tudo" (achata) */
	pulso: (i, t) => {
		if (i > 3000) return ambiente(i, t);
		const d = R[i];
		const x = (d.a - 0.5) * 880;
		const amp = ci(t, [0.5, 2.6], [0.4, 1.4]) * ci(t, [K.pulso + 3.0, K.pulso + 3.6], [1, 0.04]);
		const ph = ((((x / 880 + 0.5) * 3 - t * 0.9) % 1) + 1) % 1;
		let y = 0;
		if (ph > 0.42 && ph < 0.47) y = -260 * Math.sin(((ph - 0.42) / 0.05) * Math.PI);
		else if (ph > 0.47 && ph < 0.52) y = 120 * Math.sin(((ph - 0.47) / 0.05) * Math.PI);
		else y = Math.sin(ph * TAU * 2) * 12;
		return [x, y * amp + (d.b - 0.5) * 10, (d.c - 0.5) * 30, 1.3, 0.85];
	},
	/** atenção: um ponto central e anéis de alerta */
	alerta: (i, t) => {
		const d = R[i];
		if (i < 600) {
			const [x, y, z] = sph(i, 26);
			return [x, y, z, 1.6, 1];
		}
		if (i < 3600) {
			const anel = i % 3;
			const fase = ((t - K.alerta) * 0.9 + anel / 3) % 1;
			const r = 80 + fase * 420;
			const a = d.a * TAU;
			return [Math.cos(a) * r, Math.sin(a) * r, (d.b - 0.5) * 8, 1.3, 0.9 * (1 - fase)];
		}
		return ambiente(i, t);
	},
	/** cólica: um nó torcido (toro 2,3) que gira e aperta */
	colica: (i, t) => {
		if (i > 4200) return ambiente(i, t);
		const d = R[i];
		const s = d.a * TAU;
		const aperto = 1 + 0.06 * Math.sin(t * 5);
		const r = (110 + 60 * Math.cos(3 * s)) * aperto;
		let x = r * Math.cos(2 * s);
		const y = r * Math.sin(2 * s);
		let z = -70 * Math.sin(3 * s);
		const tub = 22 * Math.sqrt(d.c);
		x += Math.cos(d.b * TAU) * tub;
		z += Math.sin(d.b * TAU) * tub;
		[x, z] = rotY(x * 1.6, z * 1.6, t * 0.6);
		return [x, y * 1.6, z, 1.3, 0.85];
	},
	vazio: (i, t) => ambiente(i, t, 0.08),
	utero: (i, t) => utero(i, t, 0),
	endometrio: (i, t) => utero(i, t, 1),
	fora: (i, t) => utero(i, t, 2),
	inflama: (i, t) => utero(i, t, 3),
	/** sinais além da cólica: o centro irradia para pontos distantes */
	sinais: (i, t) => {
		const d = R[i];
		if (i < 800) {
			const [x, y, z] = sph(i, 70);
			return [x, y, z, 1.4, 0.9];
		}
		if (i < 4200) {
			const ramo = i % 7;
			const a = (ramo / 7) * TAU + 0.3;
			const alc = ci(t, [K.sinais, K.sinais + 1.8], [0.2, 1]);
			const u = Math.pow(d.a, 0.7) * alc;
			const r = 90 + u * 470;
			const fim = d.a > 0.88;
			const [nx, ny, nz] = fim ? sph(i, 30) : [0, 0, 0];
			return [Math.cos(a) * (fim ? 560 * alc : r) + nx, (d.b - 0.5) * 8 + ny, Math.sin(a) * (fim ? 560 * alc : r) + nz, fim ? 1.7 : 1.1, fim ? 0.95 : 0.55];
		}
		return ambiente(i, t);
	},
	/** ciclo menstrual: 28 dias num anel; os dias da menstruação pulsam fortes */
	ciclo: (i, t) => {
		if (i > 4200) return ambiente(i, t);
		const d = R[i];
		const dia = i % 28;
		const a = (dia / 28) * TAU - Math.PI / 2 + t * 0.08;
		const men = dia < 5;
		const rr = men ? 34 + 10 * Math.sin(t * 8 + dia) : 14;
		const [x, y, z] = sph(i, rr * Math.cbrt(d.c));
		return [Math.cos(a) * 360 + x, Math.sin(a) * 360 + y, z, men ? 1.8 : 1.2, men ? 1 : 0.4];
	},
	/** relações: dois anéis entrelaçados, um deles com tremor de dor */
	relacoes: (i, t) => {
		if (i > 4200) return ambiente(i, t);
		const d = R[i];
		const lado = i % 2;
		const a = d.a * TAU;
		const tub = 18 * Math.sqrt(d.c);
		const R0 = 220;
		let x = (R0 + Math.cos(d.b * TAU) * tub) * Math.cos(a);
		let y = (R0 + Math.cos(d.b * TAU) * tub) * Math.sin(a);
		let z = Math.sin(d.b * TAU) * tub;
		if (lado) [y, z] = [z, y];
		x += lado ? 120 : -120;
		const tremor = lado ? Math.sin(t * 40 + i) * 3 : 0;
		[x, z] = rotY(x, z, t * 0.5);
		return [x + tremor, y, z, 1.3, lado ? 0.95 : 0.6];
	},
	/** dificuldade para engravidar: um óvulo, e pontos que se aproximam mas não chegam */
	ovulo: (i, t) => {
		const d = R[i];
		if (i < 2600) {
			const [x, y, z] = sph(i, i < 2000 ? 230 : 230 * Math.cbrt(d.c) * 0.5);
			return [x, y, z, 1.2, i < 2000 ? 0.75 : 0.35];
		}
		if (i < 3000) {
			const k = i - 2600;
			const a = (k / 400) * TAU * 3 + d.b;
			const osc = 0.5 + 0.5 * Math.sin(t * 1.6 + d.a * TAU);
			const r = 300 + osc * 420;
			return [Math.cos(a) * r, Math.sin(a) * r * 0.9, (d.c - 0.5) * 200, 1.6, 0.85];
		}
		return ambiente(i, t);
	},
	/** "!" de atenção */
	exclama: (i, t) => {
		if (i > 3600) return ambiente(i, t);
		const d = R[i];
		const ponto = i < 700;
		if (ponto) {
			const [x, y, z] = sph(i, 48);
			return [x, 230 + y, z, 1.5, 1];
		}
		const y = -320 + d.a * 460;
		const w = lerp(55, 28, d.a);
		return [(d.b - 0.5) * 2 * w, y, (d.c - 0.5) * 50, 1.4, 0.95];
	},
	/** "?" — sozinhos, não significam */
	duvida: (i, t) => {
		if (i > 3600) return ambiente(i, t);
		const d = R[i];
		if (i < 600) {
			const [x, y, z] = sph(i, 42);
			return [x, 230 + y, z, 1.5, 1];
		}
		const [x, y] = amostraCaminho(INTERROGA, d.a);
		const [ox, oz] = [(d.b - 0.5) * 50, (d.c - 0.5) * 50];
		const [rx, rz] = rotY(x + ox, oz, Math.sin(t * 0.8) * 0.5);
		return [rx, y, rz, 1.4, 0.95];
	},
	/** lupa: o diagnóstico é feito por quem examina */
	lupa: (i, t) => {
		if (i > 4400) return ambiente(i, t);
		const d = R[i];
		if (i < 2400) {
			const a = d.a * TAU;
			const tub = 22 * Math.sqrt(d.c);
			const r = 230 + Math.cos(d.b * TAU) * tub;
			return [-60 + Math.cos(a) * r, -80 + Math.sin(a) * r, Math.sin(d.b * TAU) * tub, 1.3, 0.9];
		}
		if (i < 3200) {
			const u = d.a;
			const tub = 26 * Math.sqrt(d.c);
			return [-60 + 180 + u * 260 + Math.cos(d.b * TAU) * tub * 0.7, -80 + 180 + u * 260 - Math.cos(d.b * TAU) * tub * 0.7, Math.sin(d.b * TAU) * tub, 1.4, 0.9];
		}
		// dentro da lente: o útero pequeno, examinado
		const [x, y, z] = corpoUtero(d, 0.5);
		return [-60 + x, -80 + y, z, 1.2, 0.6];
	},
	/** grito: ondas que se expandem a partir do corpo */
	grito: (i, t) => {
		const d = R[i];
		if (i < 2300) {
			const [x, y, z] = corpoUtero(d, 0.7);
			return [x, y, z, 1.2, 0.7];
		}
		const onda = i % 4;
		const fase = ((t - K.grito) * 0.8 + onda / 4) % 1;
		const r = 200 + fase * 700;
		const a = d.a * TAU;
		return [Math.cos(a) * r, Math.sin(a) * r * 1.2, (d.b - 0.5) * 10, 1.4, 0.85 * (1 - fase)];
	},
	/** ouvido: tudo converge para um único ponto */
	ouvido: (i, t) => {
		const d = R[i];
		const [x, y, z] = sph(i, 60 * Math.cbrt(d.c));
		return [x, y, z, 1.1, 0.9];
	},
};

// sequência de formas
const CHAVES: {t: number; f: string; dur: number; spread: number}[] = [
	{t: -1, f: 'nuvem', dur: 0.1, spread: 0},
	{t: K.pulso, f: 'pulso', dur: 0.6, spread: 0.25},
	{t: K.alerta, f: 'alerta', dur: 0.4, spread: 0.2},
	{t: K.colica, f: 'colica', dur: 0.7, spread: 0.3},
	{t: K.obraUtero - 0.2, f: 'vazio', dur: 0.5, spread: 0.2},
	{t: K.utero - 0.2, f: 'endometrio', dur: 0.7, spread: 0.3},
	{t: K.fora, f: 'fora', dur: 0.9, spread: 0.4},
	{t: K.inflama, f: 'inflama', dur: 0.4, spread: 0.1},
	{t: K.sinais, f: 'sinais', dur: 0.8, spread: 0.3},
	{t: K.ciclo, f: 'ciclo', dur: 0.5, spread: 0.3},
	{t: K.relacoes, f: 'relacoes', dur: 0.7, spread: 0.3},
	{t: K.obraPelve - 0.2, f: 'vazio', dur: 0.5, spread: 0.2},
	{t: K.ovulo - 0.1, f: 'ovulo', dur: 0.8, spread: 0.3},
	{t: K.atencao, f: 'exclama', dur: 0.4, spread: 0.15},
	{t: K.duvida, f: 'duvida', dur: 0.7, spread: 0.25},
	{t: K.lupa, f: 'lupa', dur: 0.8, spread: 0.3},
	{t: K.corpo, f: 'utero', dur: 0.7, spread: 0.3},
	{t: K.grito, f: 'grito', dur: 0.5, spread: 0.2},
	{t: K.ouvido, f: 'ouvido', dur: 0.8, spread: 0.3},
];

export const World: React.FC = () => {
	const t = useCurrentFrame() / 30;
	const cam = camAt(t);
	let k = 0;
	for (let j = 0; j < CHAVES.length; j++) if (t >= CHAVES[j].t) k = j;
	const cur = CHAVES[k];
	const prev = CHAVES[Math.max(0, k - 1)];
	const fade = ci(t, [END - 0.7, END - 0.2], [1, 0]);
	const out: React.ReactNode[] = [];
	for (let i = 0; i < N; i++) {
		const m = E_IO(ci(t - cur.t - R[i].dl * cur.spread, [0, cur.dur], [0, 1]));
		let p: P5;
		if (m >= 1) p = FORMAS[cur.f](i, t);
		else {
			const a = FORMAS[prev.f](i, t);
			const b = FORMAS[cur.f](i, t);
			p = a.map((v, j) => lerp(v, b[j], m)) as P5;
		}
		if (p[4] * fade < 0.02) continue;
		const [x, y, s] = project(p[0], p[1], p[2], cam);
		if (s <= 0 || x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
		out.push(<circle key={i} cx={x} cy={y} r={Math.min(9, p[3] * s)} fill={INK} opacity={p[4] * fade * ci(s, [0.25, 0.7], [0.35, 1])} />);
	}
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{out}
		</svg>
	);
};
