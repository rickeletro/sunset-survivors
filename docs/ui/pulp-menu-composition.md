# Menus Western Pulp ’98

As telas Pause, Game Over, Stage Clear, Game Complete, Unlockables e Controls usam composição Phaser em camadas na referência 1536 × 1024. O redimensionamento proporcional continua centralizado em `createMenuRoot`.

## Direção visual

- Interior `public/assets/background/Saloon_bkg.png`: pausa, controles e galeria.
- Vila ao entardecer `public/assets/background/sunsetsurvivors_bkg.png`: derrota, vitória de fase e final.
- Títulos de resultados: texto Rye vermelho com contorno dourado e sombra independente.
- Cabeçalhos internos e cartões: pergaminho com nine-slice, texto e conteúdo separados.
- Placas e botões: madeira, veios, rebites e seleção vermelha. O componente `WesternButton` oferece o modo `presentation: 'pulp'` para essas telas.
- Iluminação aditiva e poeira animadas são objetos separados do fundo.

Três novos PNGs com canal alfa estão em `public/assets/ui/pulp/`: mesa da pausa, abutre com cruz/chapéu e os quatro protagonistas vistos de costas. Foram gerados com a skill imagegen e copiados ao projeto. Os caminhos são registrados no catálogo central; proporções são mantidas.

## Comportamento preservado

Navegação, reinício da fase, continuidade da campanha, estatísticas persistidas, fórmulas de pontuação e condições de desbloqueio permanecem as existentes. O tutorial descreve movimento, disparo automático, coleta de XP e pausa, conforme os controles implementados. A galeria substitui seus botões de categoria ao alternar abas e mantém os bloqueios anteriores.

O helper `pulpSceneKit.ts` concentra composição e bindings. Setas e Enter/Espaço selecionam ações; Escape mantém a função própria de cada tela. Os listeners são removidos no shutdown. As telas carregam seus próprios assets, incluindo acesso direto sem visitar o título antes.

## Verificação

`PulpMenus.test.ts` exercita as seis cenas com objetos de apresentação substituídos por um harness, validando preload, limites dos botões, navegação, dados exibidos, retorno da pausa e descarte de listeners/abas. Os testes de PNG descomprimem as imagens e verificam transparência e dimensões. Não foram feitas jogadas manuais nem screenshots do jogo.

Executar `npm run check`, `npm run build` e `git diff --check`.
