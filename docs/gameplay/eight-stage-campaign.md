# Campanha Western Pulp '98

Cada fase tem um período de sobrevivência de 10–15 minutos **antes** do boss. Derrotar o boss correspondente encerra a fase; abates não antecipam o confronto. Os resets de inventário entre fases e as regras existentes de armas, upgrades, evolução, XP e cura continuam iguais.

| Fase | Sobrevivência | Cenário / composição | Evento de cenário | Boss / confronto |
| --- | --- | --- | --- | --- |
| 1 | 10:00 | Desfiladeiro, carroças, cactos, facas e coyotes | Estouro de cinco touros com investidas anunciadas | Simon Greedwell: mantém corrida, tiro e morte originais |
| 2 | 11:00 | Pátio ferroviário com trilhos livres, carga e rifleiros | Trem em movimento após aviso de 2,4 segundos | Hank Hatfield: leque rápido de revólver |
| 3 | 12:00 | Vila queimada com ruínas e dinamiteiros | Brasas marcam zonas que permanecem em chamas | Dark Horse montado: investida com direção travada e disparos |
| 4 | 12:30 | Saloon de madeira, mesas e barris | Explosões de pólvora em sequência | Dois irmãos Smith independentes, dinamite em área; ambos devem morrer |
| 5 | 13:00 | Furgões, caixas, passagens e atiradores | Faixas de fogo cruzado alternam orientação | El Greco: escudo reduz dano; chicotada abre janela de vulnerabilidade |
| 6 | 13:30 | Montanha, pinheiros, tendas e batedores renegados | Desmoronamentos anunciados por círculos | Chief Wigwam: machados em leque e golpe próximo |
| 7 | 14:00 | Hacienda com palmeiras, barricadas e tropas pesadas | Artilharia em múltiplas zonas | Paco Loco: Gatling varre uma direção de mira travada |
| 8 | 15:00 | Mansão, pedra, estátuas e guarda do barão | Salvas cruzam linhas anunciadas | Richard Rose: rifle, reforços e salvas radiais abaixo de 40% de vida |

## Ritmo de sobrevivência

- Chegada protegida nos primeiros 45 segundos; cada estágio usa seu próprio elenco e pesos de spawn.
- Ciclos de três minutos: pressão, surto de horda nos segundos 105–144, respiro nos segundos 145–179. O último minuto vira resistência final.
- Elites a partir de 1:30, depois a cada 100 segundos, com recompensas existentes.
- Emboscadas e ondas temáticas recorrentes; o cerco deixa uma abertura para fuga.
- Limite de admissão de 240 inimigos de horda, pooling e separação por spatial hash. O boss é garantido mesmo com a arena cheia.
- Provisões opcionais a partir de 1:30 e depois a cada 2:30: vá ao ponto indicado no HUD, derrote os cinco guardas e fique oito segundos dentro da área. Inimigos próximos contestam a captura. Sair reduz o progresso. Cada oportunidade expira em 80 segundos e não bloqueia o boss.
- Recompensa de provisões: XP, ouro e 20 HP, respeitando HP máximo e bônus de XP. A curva de nível não foi alterada.
- Para partidas longas, após 700 sprites de saque as novas recompensas compartilham o sprite mais próximo do mesmo tipo. Cada pacote original é recolhido separadamente, preservando arredondamento, XP, ouro e cada cura de whiskey. Não há descarte de recompensas.

## Arte e assets

- Seis personagens gerados no PixelLab: `knife_bandit`, `knife_scout`, `coyote`, `dynamite_outlaw`, `longhorn`, `rifle_guard`.
- Todos solicitados com tamanho de personagem de 64 pixels, quatro vistas (sul/leste/norte/oeste) e quatro frames de movimento/ataque por vista: **24 ciclos / 96 frames animados**.
- O modo Standard do PixelLab adiciona margem transparente ao personagem (canvas base 92×92 para personagem de 64px); as animações podem ampliar a margem. O runtime aplica escala proporcional para o canvas de referência ocupar 64px, sem esticar sprites. O touro usa escala maior por ser um inimigo pesado.
- Originais, metadados e ZIPs em `public/assets/enemies/pixellab/`; prompts e IDs em `docs/art/prompts/pixellab-enemies-jobs.json`.
- Bosses 2–8 usam os assets já criados em `public/assets/bosses/pixellab/`, com oito direções. Simon usa exclusivamente os sprites originais em `.../greedwell/`, não a cópia criada anteriormente.
- Pisos, trilhos, carroças, ruínas, caixas, barris, tendas, barricadas, mesas, palmeiras, estátuas e lanternas são pequenas texturas independentes geradas por `StageScenery.ts`, posicionadas por chunks em `WorldMap.ts`. Luzes aditivas e poeira continuam em camadas próprias. Não há imagem única estática para a fase.

## Validação

Vitest cobre todos os cronogramas, diretoria de hordas, limites de admissão, objetivos, colisões/avisos de perigos, associação dos bosses, vitória dos dois Smith, ataques distintos, conservação de milhares de recompensas e todos os arquivos requisitados pelos loaders. TypeScript e build de produção também devem passar. Sem jogadas manuais ou screenshots de teste.

Esta é a primeira configuração de balanceamento da campanha longa; dano, HP e tempos de cada novo encontro ficam centralizados nos arquivos de dados para ajustes posteriores.
