# Polimento visual — Western Pulp '98

## Revisão de escala após playtest

O relato mostrou que preservar os canvases dos protótipos havia reduzido demais os novos desenhos. Os assets grandes foram reexportados das gerações de alta resolução, sem esticar o PNG pequeno: cacto 72 × 132, poste 72 × 192, pinheiro 100 × 156, palmeira 144 × 168, árvore seca 72 × 104, ruína 114 × 105, tenda 114 × 84 e estátua 81 × 120. Barris, caixas e objetos de chão mantêm sua escala. Os raios de colisão dos obstáculos restantes continuam iguais.

Postes saíram do sorteio de obstáculos. Os slots antigos continuam consumindo os mesmos números aleatórios e ficam vazios, preservando os demais objetos. Há agora um poste decorativo ao lado de cada fachada adequada, afastado da porta, com escala proporcional à construção (192–256 px). Não são colocados junto a vagões, poços, carroças ou no deserto. O mapa de vagões sem casas não recebe postes. As luzes são aditivas, acompanham o streaming da construção e são destruídas com ela; o poste fica translúcido quando encobre o personagem. Não acrescenta colisão invisível às entradas.

A composição `docs/qa/arena-scale-comparison.png` mostra os assets na escala do mundo ao lado de Steve. O restante deste documento registra a entrega inicial, anterior a esta revisão de tamanho.


Foram substituídos os protótipos geométricos dos objetos por 13 recortes de pixel art: cacto, pedra, árvore seca, barril, caixa, ruína, mesa, pinheiro, tenda, barricada, palmeira, estátua e poste com lanterna. A carroça e os landmarks aprovados foram preservados. Os rosters das oito fases carregam as novas imagens pelo catálogo; não há fundo de cenário achatado nem sorteio adicional que altere o mapa.

Os PNGs estão em `public/assets/scenery/western-pulp/`. Mantêm os tamanhos nativos e o pivô dos obstáculos anteriores. Posição, quantidade, seed, raio de colisão, caminhos, exclusões de trilhos e entrada no saloon continuam iguais. O halo da lanterna permanece uma camada aditiva independente.

## Seleção e HUD

- Painel inferior recomposto em pergaminho limpo, com uma superfície de leitura contínua. Nome e título separados; descrições de 21 px e frase de 22 px, sem contorno grosso sobre linhas gravadas na arte. Descrições longas têm quebra limitada à coluna esquerda.
- Personagem animado e botão de confirmação são camadas próprias. Animações exclusivas da seleção usam poses de disparo; Billy/Bob não passam por quadros de costas. As animações da partida não mudam.
- Quatro retratos novos quadrados de 84 × 84 px, rosto e chapéu em destaque, sem letras ou fundos dos cartazes. Uma moldura comum de madeira/latão com rebites é desenhada pelo HUD; retrato não é esticado para proporções diferentes.
- XP em dourado/pergaminho, texto de fase com 12 px e objetivo com 11 px. HP, XP, dificuldade, combate e economia não foram recalibrados neste trabalho.
- Limpeza dos handlers de teclado da seleção ao sair para evitar acúmulo em visitas repetidas.

O painel anterior e os avatares anteriores estão arquivados em `art/source/visual-polish/originals/`; o painel com faixas não é mais carregado pelo runtime.

## Origem e preparação

PixelLab não estava disponível entre as ferramentas desta sessão. Foi usado o **image_gen integrado**, uma geração por objeto/retrato. Prompts e caminhos das gerações estão em [`generation.json`](../../art/source/visual-polish/generation.json). Direção: pixel art Neo Geo tardia, contornos carvão, luz quente superior esquerda, madeira/latão, sombras roxas e recortes transparentes vistos de frente levemente de cima. Retratos: cabeça/ombros em três quartos, fundo carvão e sem moldura/letras. Billy mantém o chapéu marrom canônico.

Os recortes foram ajustados proporcionalmente aos canvases nativos com nearest-neighbor; alfa dos objetos foi convertido a máscara binária antes do recorte para eliminar pixels quase transparentes isolados que ampliavam falsamente seus limites. A arte final usada pelo jogo está dentro do projeto. Nenhuma imagem original anexada foi usada como instrução executável.

## Verificação

Testes automatizados verificam os oito rosters, raios originais, tamanhos/transparência dos PNGs, avatares quadrados, textos por personagem, transporte da seleção e limpeza dos controles. A suíte completa, TypeScript, auditoria de assets e build são executados antes da integração local.

Prévias offline em `docs/qa/visual-polish-*.png` mostram os objetos, retratos e composição da seleção. Usam Georgia como substituta de fonte na composição e não são screenshots do runtime nem teste de regras por gameplay. O jogo continua usando Rye, Roboto Slab e Press Start 2P. Sem commit ou push.
