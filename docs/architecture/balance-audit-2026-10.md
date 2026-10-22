# Auditoria de progressão e bônus de saloon — 21/10/2026

> Atualização de progressão, chefes e modos: [difficulty-playtest-audit-2026-10.md](difficulty-playtest-audit-2026-10.md). Este documento registra a rodada anterior.

> Histórico da rodada inicial. A curva de XP segue válida; recuperação e entrada foram refinadas posteriormente em [sustain-entry-audit-2026-10.md](sustain-entry-audit-2026-10.md).

## Resultado

A curva de XP ficou mais lenta, mantendo recompensas de inimigos, armas, personagens, spawns e chefes. Cada fase continua durando 420 segundos antes do chefe e reiniciando a build, como na arquitetura existente. O saloon é opcional, pausa o combate e oferece um único brinde por tentativa de fase. Escala dos inimigos, colisões aprovadas, Cormano e carroças foram preservados.

## XP não é dinheiro

O mesmo pickup entrega dois valores independentes: `xpVal` para a barra de experiência e `bountyVal` para o dinheiro/pontuação. A aparência ouro/estrela/garrafa não multiplica o valor do inimigo. Bandit rende 10 XP e $1; knife_bandit, 14 XP e $2; elite, 120 XP e $25. Garrafas também curam 30 HP. A combinação visual pode fazer parecer que poucas “moedas” valem muitos níveis. O pooling de loot conserva os pacotes originais, não gera recompensa nova.

## Curva escolhida

Custos por upgrade: nível atual 1 custa 50 XP; nível 2, 80 XP; do nível 3 em diante, `160 + 55n + 6n²`, com `n = nível atual − 3`. A função retorna o custo incremental, nunca o cumulativo. O saldo excedente continua sendo conservado e cada modal oferece exatamente uma escolha.

| Upgrade | Antes | Agora | Pickups de bandit, sem bônus |
|---|---:|---:|---:|
| 1 → 2 | 25 | 50 | 3 → 5 |
| 2 → 3 | 40 | 80 | 4 → 8 |
| 3 → 4 | 70 | 160 | 7 → 16 |
| 4 → 5 | 98 | 221 | 10 → 23 |
| 5 → 6 | 132 | 294 | 14 → 30 |
| 10 → 11 | 392 | 839 | 40 → 84 |
| 20 → 21 | 1.362 | 2.829 | 137 → 283 |

Pickups de 14 XP explicam o caso de dois pickups para o primeiro upgrade antigo; agora são quatro. O custo cumulativo para chegar ao nível 4 passa de 135 para 290 XP; ao nível 10, de 1.353 para 2.951; ao nível 20, de 9.143 para 19.306. Não foi adotado crescimento exponencial.

## Modelo determinístico e metas

Executar `npm run balance:audit`; `npm run balance:audit -- --write` atualiza a evidência JSON ao lado deste relatório. O modelo usa o GameDirector real, ticks de um segundo, spawn a cada 850 ms, pesos/desbloqueios por fase, limite de 240 simultâneos, eventos especiais/elites e recompensas reais. Inclui duas provisões concluídas após oito segundos e eventos de longhorn na fase 1.

Para isolar a curva, o fluxo hipotético de abates é idêntico antes/depois: cauteloso cresce de 0,4 a 1,5 abate/s com 65% de coleta; intermediário, 0,7 a 3 com 80%; rápido, 1 a 5 com 95%. Pickups chegam quatro segundos após o abate. Estes são cenários de vazão, não bots de combate. Provisões são uma hipótese otimista: o modelo não simula contestação, caminho, tiros perdidos, dano recebido, escolhas de build ou retroalimentação de menor poder com menos upgrades. Os tempos são segundos ativos de jogo, sem tutorial/menus, e não promessas de desempenho em uma partida.

Metas: primeiros upgrades ainda na abertura; terceiro upgrade claramente mais espaçado; 10–22 escolhas por fase no envelope testado, suficientes para evoluir uma arma com foco sem maximizar toda a build. Evolução continua bloqueada até 240 s e exige arma nível 5 + passivo associado.

### Fase 1, aos sete minutos

| Cenário | Abates | XP coletado | Nível antes → agora | 1º upgrade antes → agora | 3º upgrade antes → agora |
|---|---:|---:|---:|---:|---:|
| Cauteloso | 399 | 4.050 | 14 → 11 | 16,1 → 22,9 s | 51,6 → 91,5 s |
| Intermediário | 777 | 8.184 | 19 → 14 | 9,6 → 13,7 s | 27,6 → 49,0 s |
| Rápido | 1.260 | 14.756 | 23 → 18 | 8,0 → 9,9 s | 18,1 → 31,5 s |

Nos 24 cenários das oito fases, os níveis finais passam de 14–29 para 11–23. O envelope rápido da fase 8 passa de 29 para 23. O cenário extremo com badge máximo desde o início da fase 1 chega ao nível 24, contra 31 antes. Esse limite é deliberadamente otimista: não desconta as cinco escolhas necessárias para obter o badge máximo.

Mantive o badge em +20/+40/+65/+90/+120% XP: ele continua sendo uma escolha de investimento e requisito da evolução do rifle. Mantive ganhos monetários comuns, regeneração, limites de inventário, evolução, danos/HP e cronograma dos chefes. Reduzir todos esses sistemas ao mesmo tempo impediria atribuir o efeito observado à curva.

## Matemática, economia e explorações corrigidas

- **Dinheiro do chefe final:** o clear começa imediatamente após a morte e impedia recolher o dinheiro deixado no chão. A recompensa agora é paga uma vez na morte, e o pacote de loot fica com dinheiro zero, conservando seu XP. Na fase 1 isso garante $250 já previstos nos dados, além do bônus de clear $150. Chefes duplicados da fase 4 continuam exigindo ambas as mortes.
- **Explosão residual:** balas do Desperado já carregam o multiplicador de personagem. A explosão de metade desse dano o aplicava novamente. Agora aplica uma vez; TNT e fogo do barril continuam escalando uma vez.
- **Cadência:** zerar o temporizador por volley perdia o resto fracionário e tornava o DPS dependente do FPS. O resto é conservado, com no máximo quatro volleys de recuperação por quadro após uma travada extrema. Casos de 16 e 160 ms produzem a mesma contagem/cadência.
- **Prazos absolutos:** `Phaser.Clock.now` acompanha o relógio global mesmo após uma pausa longa. Invulnerabilidade e janela vulnerável do chefe agora usam tempo ativo acumulado da partida. Timers e tweens da cena são congelados imediatamente na entrada do saloon, cobrindo o quadro anterior à aplicação da pausa enfileirada do Phaser, e seu estado anterior é restaurado na saída.
- **Upgrades gratuitos:** removido o atalho de teste L, que abria uma escolha sem pagar XP. Callbacks duplicados ou de tentativas antigas de level up também são ignorados.

## Revisão de builds e dificuldade

Armas base, cinco evoluções, cinco passivos, quatro heróis, oito fases e perfis dos nove integrantes de chefes foram revisados em código. Bônus passivos são totais por rank, não adições repetidas; custos crescem monotonicamente; cooldown tem limite seguro; loot fundido conserva XP/dinheiro; mortes e registro de runs são idempotentes. Os testes existentes e novos cobrem esses contratos.

DPS de catálogo não equivale a DPS realizado: rifle depende de alinhamento/perfuração; shotgun, de quantos pellets acertam; TNT/fogo/chicote, de quantos inimigos ocupam a área. O peacemaker máximo tem orçamento nominal alto, mas a seleção distribui tiros entre alvos e a perfuração depende de posicionamento. Não alterei dano/projéteis com base apenas em uma soma teórica. As escolhas restantes e a cadência corrigida conservam caminhos para builds fortes; a simulação não demonstra vitória automática nem garante equilíbrio de cada combinação. Ajustes adicionais de armas exigem telemetria ou observações específicas, sem mascarar o pedido principal.

## Saloon opcional

Na fase 1, um único barn próximo ao início foi substituído visualmente pelo saloon existente, preservando sua pegada exata (106 × 35 em meias dimensões). A porta fica em `(3580, 3668)`, a noroeste do início. Também há portas em saloons já presentes nas fases 3 e 4. Não foram acrescentados obstáculos físicos.

A até 100 px da porta, aparece a opção **E / toque**. Ela não aparece durante onboarding, escolha de upgrade ou luta de chefe. Entrar consome a visita da tentativa de fase, compartilhada entre todas as portas. O jogador escolhe **BRINDE E VOLTAR** ou sai sem bônus por botão/Escape. O brinde restaura **20% da vida máxima, limitado à vida máxima, e concede $15**; não aumenta vida máxima, não dá XP e não altera armas. Equivale a 10% do bônus de clear da primeira fase e a menos de 1% do dinheiro do cenário intermediário modelado ($1.775 antes de chefe/clear). Não se acumula por reentrada/callback repetido. Reiniciar uma tentativa também reinicia seu dinheiro/build, como antes.

Durante a visita, cena, timers, tweens, projéteis, inimigos, objetivos e regeneração ficam pausados. A volta ocorre no mesmo ponto e com 600 ms de proteção contra um acerto imediato, preservando invulnerabilidade anterior se maior. A música atual continua; a cena não inicia, troca ou interrompe faixas.

A imagem estática de três dançarinas adultas foi criada com imagegen e inspecionada. É uma camada transparente separada do interior existente, do palco, da iluminação animada e dos controles. Originais/prompts em `art/source/western-pulp/`; imagem runtime em `public/assets/scenery/western-pulp/saloon-cancan.png`.

## Validação e limites

A suíte cobre curva, 24 cenários determinísticos, excedente de XP, upgrades únicos, cadência, multiplicadores, pagamento de chefe, portas, limite de visita, proximidade, onboarding, teclado/toque, saída/retorno, stale callbacks, cura limitada e preservação de estado. Um teste usa o Clock real do Phaser para provar que o timer conserva seu tempo restante durante minutos no saloon. Menus são instanciados com harness sem browser para testar bounds e controles.

A composição de arte foi inspecionada em `docs/qa/saloon-layout-preview.png`: é uma prévia estática na geometria de referência, com fonte substituta, não uma captura do jogo. Não houve gameplay manual nem screenshots para validar regras. Testes, TypeScript, auditoria de assets e build devem passar em ambos os checkouts. O aviso usual de bundle Vite acima de 500 kB não impede o build e não foi tratado como parte deste balanceamento.
