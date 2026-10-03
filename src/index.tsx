import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {BG, ci, FPS, H, W} from './kit';
import {END, K, World} from './World';
import {Legenda} from './Legenda';
import {Obra} from './Obra';

// Camadas: fundo → mundo de pontos → obras → legenda → fade final.
const Video: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 45% at 50% 46%, rgba(237,235,230,0.05) 0%, transparent 70%)'}} />
		<World />
		<Obra a={K.obraUtero} b={K.obraHisto} src="img/utero.jpg" rect={[90, 470, 900, 647]} titulo="Útero, trompa e ovário" credito="GRAY'S ANATOMY · FIG. 1161 · 1918 · DOMÍNIO PÚBLICO" />
		<Obra a={K.obraHisto} b={K.fora} src="img/histologia.jpg" rect={[90, 420, 900, 600]} titulo="Tecido endometrial fora do lugar" credito="ENDOMETRIOSE NO OVÁRIO · NEPHRON · CC BY-SA 3.0" />
		<Obra a={K.obraLapa} b={K.sinais} src="img/laparoscopia.jpg" rect={[110, 400, 860, 721]} titulo="Lesão vista por laparoscopia" credito="DI MICHELE ET AL. · CC BY 4.0" />
		<Obra a={K.obraPelve} b={K.ovulo} src="img/pelve.jpg" rect={[150, 330, 780, 780]} titulo="Útero, bexiga e reto" credito="GRAY'S ANATOMY · FIG. 1166 · 1918 · DOMÍNIO PÚBLICO" />
		<Obra a={K.obraUS} b={K.atencao} src="img/ultrassom.jpg" rect={[110, 420, 860, 699]} titulo="Endometrioma no ultrassom" credito="MIKAEL HÄGGSTRÖM · CC0" />
		<Obra a={K.obraDiag} b={K.corpo} src="img/diagrama.jpg" rect={[90, 440, 900, 679]} titulo="Onde as lesões podem surgir" credito="VEGA ASENSIO · CC BY-SA 4.0" />
		<Legenda fim={END} />
		<AbsoluteFill style={{background: BG, opacity: ci(useCurrentFrame() / FPS, [END - 0.8, END], [0, 1])}} />
		<Audio src={staticFile('narracao.mp3')} />
	</AbsoluteFill>
);

registerRoot(() => <Composition id="Video" component={Video} durationInFrames={Math.ceil(END * FPS)} fps={FPS} width={W} height={H} />);
