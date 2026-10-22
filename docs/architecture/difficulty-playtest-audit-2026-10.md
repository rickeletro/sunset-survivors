# Progressão, ameaça e modos — rodada orientada pelo playtest

## O que veio da partida real

O jogador informou fase 1 aos 6:00 no nível 27 e fase 2 aos 6:43 no nível 36, com itens de ranks altos e chefes fáceis. Esses são os dados observados disponíveis. Não temos ainda seus abates, badge, XP bruto, composição da build ou duração de cada chefe. Nível alto isoladamente não prova que a experiência é ruim; completar a build cedo, interromper demais o combate e derreter chefes são critérios melhores.

Conferi por HTTP que a porta 3000 entregava os custos 50/80/160 e a curva `160 + 55n + 6n²`, além do badge até +120%. Logo, a discrepância não foi atribuída sem evidência a código desatualizado.

## Por que o envelope anterior não explica o jogador

O benchmark anterior impunha uma taxa de abates, chegando a 5/s no cenário rápido, e tratava badge máximo apenas em um envelope separado. Ele não simulava o crescimento real da eficácia de armas, perfuração, fogo, explosões, magnetismo e escolhas. O diretor pode repor aproximadamente 15–20 inimigos/s na parte final quando as ondas são limpas, além de especiais. Portanto, aquele benchmark não era um teto de desempenho nem evidência de equilíbrio do combate.

A auditoria não encontrou composição indevida do badge, duplicação de XP no merge ou carryover de níveis entre fases:

- O badge usa totais 1,2 / 1,4 / 1,65 / 1,9 / 2,2, não produto nem soma repetida dos ranks.
- Cada pacote original passa pelo multiplicador uma vez. Um teste coleta 750 pacotes através do limite de 700 sprites e verifica exatamente 7.500 XP base, 16.500 XP com badge máximo e $750.
- Provisões aplicam o bônus uma vez; saloon não dá XP. Boss/elite e especiais têm suas recompensas declaradas.
- Cada fase reinicia nível, XP e build; a passagem para a seguinte transporta personagem, fase e dificuldade, sem inventário/XP.

Com a curva que estava no servidor, chegar ao nível 27 exigia **45.094 XP**, e ao 36, **103.090 XP**.

## Reprodução explicativa, não telemetria inventada

`npm run balance:telemetry -- --write` usa o GameDirector real, roster/recompensas, waves a cada 850 ms, sementes fixas, limite de vivos, elites/especiais e provisões. Ajusta uma taxa crescente de abates para encontrar um cenário compatível com o nível informado. A coleta é 100% após quatro segundos; badge consome escolhas nos níveis 3/5/7/9/11. Ele não começa grátis no rank máximo. As escolhas de badge são uma hipótese plausível, não uma observação da build.

| Campo | Fase 1 | Fase 2 |
|---|---:|---:|
| Dado real: tempo / nível | 360 s / 27 | 403 s / 36 |
| Abates ajustados no cenário, não medidos | 1.792 | 2.507 |
| Capacidade final ajustada | 9,16/s | 11,64/s |
| XP base ajustado | 21.088 | 47.572 |
| XP ganho ajustado com badge | 45.119 | 103.107 |
| Badge máximo obtido no cenário | 101,4 s | 88,3 s |
| Mesmo cenário sem badge, curva anterior | nível 20 | nível 27 |
| Mesmo fluxo com a curva nova | **nível 21** | **nível 25** |
| Mediana entre escolhas nos 2 min finais, antes → agora | 18,4 → 32,7 s | 16,0 → 33,7 s |

A reprodução demonstra que taxas maiores e badge podem explicar os números sem um bug de XP. Não prova que esses foram os abates ou passivos reais. O efeito da nova vida dos inimigos sobre os abates não está simulado: a comparação mantém o fluxo igual para isolar o custo de XP. A nova eficácia de builds e diversão exigem outro playtest.

## Progressão implementada

A abertura e os primeiros sete upgrades mantêm seus custos. A partir do nível atual 9 acrescenta-se uma cauda suave: `3 × max(0, nível − 8)³` ao custo anterior. Não há limite rígido de nível, XP apagado, punição adaptativa, recompensa reduzida por jogar bem ou XP extra por modo.

| Nível atual → próximo | Antes | Agora |
|---|---:|---:|
| 1 → 2 | 50 | 50 |
| 2 → 3 | 80 | 80 |
| 3 → 4 | 160 | 160 |
| 8 → 9 | 585 | 585 |
| 10 → 11 | 839 | 863 |
| 15 → 16 | 1.684 | 2.713 |
| 20 → 21 | 2.829 | 8.013 |

O badge permanece +120% no máximo e segue como investimento de cinco escolhas e requisito da evolução do rifle. Essa decisão evita enfraquecer simultaneamente o passivo e a curva. O saldo de XP é conservado e cada modal concede uma única escolha. A evolução continua disponível a partir de 240 s com seus requisitos atuais. Mesmo o envelope cauteloso preserva espaço para uma evolução focada; isso não equivale a provar viabilidade de toda combinação.

## Ameaça por tempo ativo, sem esponja infinita

Para **novos spawns**, mantém-se a vida base por tipo e o crescimento linear existente, acrescentando `1 + 0,12 × minutos ativos`, limitado a sete minutos. O tempo da fórmula inteira fica limitado a 420 s. Não há salto por minuto nem aumento súbito/recuperação de HP de um inimigo já ferido. Chefes não recebem essa curva de inimigos comuns.

Bandit no Normal: 30 / 67 / 112 / 163 / 222 / 288 / 361 / 442 HP nos minutos 0–7. Antes ele tinha 210 HP no minuto 6; agora 361. O fator adicional aos seis minutos é 1,72. Rifle máximo de Bob, sem crítico, passa de matar esse bandit com um tiro a precisar de dois; não aumentei tamanho, velocidade, quantidade, raio de colisão ou dano comum por minuto. O tipo e a build continuam importando. O cap evita crescimento infinito durante uma luta de chefe longa.

As alternâncias já existentes entre pressão, horda, respiro e chefe foram mantidas. Não foi implementado diretor adaptativo oculto baseado no desempenho do jogador.

## Chefes: o dobro solicitado, em todos os canais

A nova base Normal dobra **uma vez** HP e dano de contato de todos os perfis, inclusive cada irmão Smith. Projéteis, TNT e áreas tinham valores independentes: foram auditados e também recebem 2× em sua origem. O modo modifica o dano recebido uma vez, depois dessa base, antes da armadura. Ataques comuns não passam pelo multiplicador de chefe.

| Fase | HP antes | Novo HP Normal |
|---|---:|---:|
| Simon | 22.000 | 44.000 |
| Hank | 32.000 | 64.000 |
| Dark Horse | 44.000 | 88.000 |
| Smith, cada um | 28.000 | 56.000 |
| El Greco | 65.000 | 130.000 |
| Wigwam | 80.000 | 160.000 |
| Paco Loco | 100.000 | 200.000 |
| Richard Rose | 135.000 | 270.000 |

Exemplos: contato de Simon 28 → 56; bala radial 18 → 36; tiro de 20 → 40; TNT/área de 25 → 50; chicote de 30 → 60. Os Smith somam 112.000 HP, não 56.000 no total. Os avisos, raios, velocidades e intervalos de ataque foram preservados; a primeira preparação passa de 1,2 para 1,8 s para dar margem antes do dano maior. Invulnerabilidade permanece 600 ms. Cura escassa e saloon aprovados não foram enfraquecidos novamente.

## Três modos explícitos

No título, **DIFFICULTY [D]** abre o seletor de madeira/pergaminho. Teclado, mouse e toque usam os controles existentes. Normal recebe foco inicial na primeira escolha; depois o menu lembra a seleção. A preferência é salva localmente, com fallback de sessão se o armazenamento estiver indisponível.

| Multiplicador sobre a nova referência | Easy | Normal | Hardcore |
|---|---:|---:|---:|
| HP de inimigo comum | 85% | 100% | 115% |
| HP de chefe | 75% | 100% | 115% |
| Dano recebido, antes da armadura | 65% | 100% | 115% |

Só esses eixos variam. Payouts de XP/dinheiro, custo de upgrades, cura, velocidades, quantidade, telegráficos e hitboxes são iguais entre modos. Easy não ganha XP gratuito; ele pode matar mais facilmente porque a resistência é menor. Hardcore não implica permadeath, exclusão de save ou perda adicional de progresso.

Exemplo: HP de Simon 33.000 / 44.000 / 50.600. Seu contato contra armadura 3 custa 33 / 53 / 61 HP. Dano alto de chefe é deliberado pela solicitação; Easy oferece margem sem alterar a economia. A referência Normal já contém o dobro de HP e dano pedidos, e os percentuais são exibidos no seletor.

A escolha é capturada no começo da campanha e transportada explicitamente por seleção de personagem, Wanted, GameScene, pausa/restart, clear/próxima fase, morte/retry e conclusão. Mudar a preferência do menu não altera silenciosamente uma tentativa em andamento. Título, HUD, pausa e telas de resultado identificam o modo.

A pausa passou a mostrar abates, XP base/ganho, badge, dano sofrido e tempo de luta de chefe. Isso permite investigar o próximo relato com dados reais em vez de inferir toda a build a partir do nível.

## Fundamentos usados

- [Pascal Luban — Quantitative design: how to define XP thresholds](https://www.gamedeveloper.com/design/quantitative-design---how-to-define-xp-thresholds-): limiares devem ser avaliados junto com a eficácia crescente do jogador. Aplicação própria aqui: ajustar a cauda após reproduzir vazão elevada, mantendo a abertura e verificando intervalo entre escolhas. Nenhum coeficiente foi copiado do artigo.
- [Ian Schreiber — Advancement, Progression and Pacing](https://gamebalanceconcepts.wordpress.com/2010/08/18/level-7-advancement-progression-and-pacing/): comparar poder do jogador e oposição e avaliar ritmo, não só o número do nível. Aplicação: checkpoints de HP/tiros e separação entre fluxo de XP e simulação de combate.
- [Witch Beam, GDC 2016 — Balancing Accessibility Against Depth](https://media.gdcvault.com/gdc2016/Presentations/Dawson_Tim_Balancing_Accessibility_Against.pdf): presets dão controle a perfis diferentes, mas precisam de referência legível; adaptação pode parecer condescendente e estratégias precisam ser viáveis. Aplicação: Normal explícito, três multiplicadores centralizados e ausência de adaptação escondida.
- [Xbox Accessibility Guideline 108](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/108): dificuldades percebidas variam conforme habilidades e barreiras. Aplicação: acesso à mesma campanha nos três modos, com diferenças explicadas e opção menos exigente.

## Metas e próximos dados

Metas provisórias para o perfil forte informado: preservar escolhas de arma/passivo no primeiro minuto; reduzir interrupções na parte final para aproximadamente 25–40 s entre escolhas no cenário ajustado; chegar ao chefe com uma build forte, ainda com decisões, e precisar respeitar avisos. Não há promessa de nível final exato. O dobro do HP, isoladamente e com DPS fixo, dobra o TTK; a curva/build alterada torna o resultado real dependente do jogador.

No próximo playtest, registrar modo, tempo, nível, abates, XP base/ganho, badge, armas/ranks, dano sofrido e tempo para matar cada chefe. Critérios: escolha ainda interessante? adversários comuns resistem sem travar o fluxo? existe espaço de esquiva? chefe permite ler padrões e punir erros sem virar uma espera longa? Esses dados podem justificar outra calibração; testes matemáticos não certificam diversão.

Testes automatizados cobrem base 2×, membros de chefe, ataques por família, aplicação única dos modos, persistência/transporte, custo/ledger de XP, 750 pacotes fundidos, curva/cap de HP e reproduções dos relatos. Menus e bounds são exercitados sem browser. A prévia em `docs/qa/difficulty-menu-preview.png` é uma composição offline com fonte substituta, não uma captura do runtime. Sem gameplay manual para validar regras, sem commit/push/deploy externo.
