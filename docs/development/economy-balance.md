# Economia — Sunset Survivors

Valores centralizados em `src/data/economy.ts`; recompensas próprias de inimigos permanecem em `src/data/enemies.ts`. Serviços, apostas e personagens usam a mesma carteira persistente (`BANK`). A fase inicia com o saldo salvo. Ganhos e gastos são persistidos durante o gameplay; sair pelo pause, reiniciar ou morrer preserva o dinheiro restante. Todas as telas do jogo usam inglês.

## Preços e benefícios

| Produto | Fase 1 | Fase 8 | Benefício |
|---|---:|---:|---|
| Saloon Tonic | $60 | $95 | Recupera 20% da vida máxima; indisponível com vida cheia |
| Room & Rest | $45 | $80 | Recupera 12% da vida máxima +20 XP |
| Special Rounds | $90 | $160 | +20% de dano por 30 segundos de combate |
| Gun Oil | $75 | $131 | +15% de frequência de disparo por 30 segundos de combate |
| Target Practice | $35 | $70 | Entrada paga; prêmio depende dos acertos |
| Faro | $2 mínimo | $2 mínimo | Apostas $2/$10/$40; limite $100 e 20% da bolsa por aposta |
| Bob | $2.400 do banco | — | Desbloqueio permanente |
| Cormano | $6.000 do banco | — | Desbloqueio permanente |

Serviços: preço-base + incremento × (fase − 1). Incrementos respectivos: $5/$5/$10/$8/$5. Cada produto pode ser comprado uma vez por visita; buffs ativos não podem ser recomprados. As regras anteriores de uso das portas continuam. O relógio dos buffs pausa com o combate. XP comprado é aplicado ao retornar, permitindo a seleção de Level Up normalmente.

Faro conserva as regras da mesa: pagamento 1:1, primeira carta perde, segunda ganha, dupla retira metade, aposta continua quando nenhum valor coincide, copper inverte a aposta. O item exige vitória com aposta de pelo menos $40; limite de perda por visita é 40% do dinheiro de entrada. Não há cortesia gratuita nem prêmio por apenas entrar. O acesso repetido até conquistar o prêmio continua.

## Renda e raridades

| Fonte | Dinheiro ou chance |
|---|---|
| Inimigos | Recompensa configurada por tipo; básicos $1, dinamite $3, pesados $6, elite $25 |
| Mini-boss | $25/$35/$45/$55/$65 conforme wave; coleta da recompensa |
| Chefe | $250 na fase 1 até $600 na fase 8, pagamento imediato ao derrotar |
| Vitória | $150 na fase 1 até $500 na fase 8 |
| Suprimentos | $375 na fase 1 até $900 na fase 8 |
| Galeria | $3 e 5 XP por acerto; rodada perfeita adiciona $20–$55 |
| Bolsa de Level Up | $25; escolha explícita em lugar de outro upgrade |
| Saco de dinheiro | 1,5% dos inimigos comuns; +$15 além da recompensa original |
| Whiskey | 2% dos inimigos comuns; cura existente preservada |
| Badge | 20% dos inimigos comuns; recompensa original preservada |
| Gold | 76,5% dos inimigos comuns; recompensa original preservada |
| Magnet | 2% por mini-boss; rolagem adicional independente, nenhum outro inimigo |

Elites, mini-bosses e chefes mantêm o badge garantido. Os tipos de loot não multiplicam nem substituem o valor original de XP. O saco acrescenta somente dinheiro. Com quatro mini-bosses, a chance de ao menos um Magnet é aproximadamente 7,76%; não é uma fonte garantida de renda.

O Magnet é consumido no chão, sem slot ou efeito permanente. Marca somente loot já espalhado para atração até o jogador, incluindo XP, dinheiro e cura. A movimentação acelera de 700 até 1.800 unidades/s, sem ultrapassar o destino. Limite existente de 700 sprites, fusão de pacotes e orçamento de 64 pacotes coletados por frame preservam valores e arredondamentos. A seleção de upgrade interrompe a coleta normalmente. Áudio de coleta limitado a um disparo por 80 ms; anéis e faíscas usam o sistema existente de efeitos.

## Banco e persistência

Todo dinheiro coletado é preservado integralmente na carteira; gastos são descontados dela. Não há conversão de 30% nem zeragem ao entrar numa fase nova. A cada lote de coleta ocorre uma gravação de saldo no LocalStorage. Personagens e estabelecimentos usam os mesmos fundos.

Ao finalizar uma fase/morrer há somente o bônus adicional de `floor(($10 por minuto completo, máximo 10 + $50 por vitória) × dificuldade)`. Multiplicadores Easy 0,85; Normal 1; Hardcore 1,15. Resultados recebem `walletSynced` para não creditar novamente as moedas já gravadas; pontuação e ouro histórico consideram apenas os ganhos daquela partida, não o saldo herdado. Compatibilidade: resultados antigos sem essa marca mantêm a conversão histórica de 30%; o save existente é preservado.

O identificador da partida impede depósitos duplicados ao reabrir resultados. Prévia sem identificador não deposita. Compra de personagem persiste saldo e desbloqueio na mesma gravação do `GameStatsManager`; falha de gravação desfaz a compra. Desbloqueios pagos sobrevivem ao reinício. Steve/Billy são gratuitos. Migração de saves antigos converte 30% do ouro histórico uma única vez e substitui a antiga liberação automática de Bob/Cormano pelo desbloqueio pago.

Persistência local no navegador, via localStorage existente; não há sincronização de banco entre dispositivos. Ranking remoto é independente.

## Simulação reproduzível

`npm run economy:audit` produz `economy-audit.json`: 27 cenários (três durações, três perfis de coleta e três dificuldades). Reutiliza o modelo existente de spawns/progressão; não simula habilidade de combate nem garante ganhos reais. Cenário Normal da fase 1, perfil intermediário:

| Duração | Dinheiro bruto | Galeria | Gastos | Restante | Depósito | Bob | Cormano total, comprando Bob primeiro |
|---|---:|---:|---:|---:|---:|---:|---:|
| Curta: 2 min, derrota | $128 | $0 | $60 | $68 | $88 | 28 partidas | 96 partidas |
| Média: 5 min, derrota | $856 | $24 | $170 | $710 | $760 | 4 partidas | 12 partidas |
| Longa: 9m30, vitória | $3.110 | $24 | $320 | $2.814 | $2.954 | 1 partida | 3 partidas |

Ganhos brutos excluem galeria; restante = bruto + galeria − gastos. O cenário longo compra dois descansos em portas distintas, rounds, oil e galeria. Nenhum cenário presume lucro no Faro ou rodada perfeita. Bolsas raras entram pelo valor esperado, não como drops garantidos. Suprimentos e coleta são parciais e dependem do perfil.

Nas vitórias longas, perfis cauteloso/intermediário/rápido acrescentam $1.807/$2.954/$5.067 à carteira: Bob em 2/1/1 partidas; Cormano em 5/3/2 partidas totais, após comprar Bob. A persistência integral solicitada acelera os desbloqueios comparada à conversão antiga. Preços não foram alterados nesta correção. Mortes precoces repetidas seguem sendo uma rota significativamente mais lenta. São estimativas, não telemetria real.

## Validação

Testes automatizados cobrem conservação de saldo, limites/preços, depósito único, migração, compra permanente, rollback de armazenamento, serviços sem saldo, callbacks repetidos, expiração em tempo de combate, Magnet exclusivo de mini-boss e 5.000 pacotes de loot sem perda ou duplicação. Testes de composição verificam seleção e cadeados em 800×600, 1280×720, 1536×1024 e 2560×1440. Não foi realizado gameplay manual nem medição real de FPS.

Arte: Magnet reutiliza o ícone nativo de 64×64 com fundo amarelo/vermelho; bolsa é uma textura procedural em camadas de pixels, criada uma vez e reutilizada. A composição offline `docs/art-direction/economy-loot-scale.png` compara o herói (68,5 px), casa (204,4 px), Magnet pulsante (28,8–30,4 px) e bolsa (33,8 px). A referência PNG da bolsa reproduz as mesmas coordenadas do gerador e não é um asset carregado no runtime.

Verificação final: 568 testes passaram, TypeScript sem erros, auditoria de 904 imagens sem arquivos faltantes ou ociosos, build de produção concluído. Vite manteve o aviso de tamanho do bundle; não é uma medição de desempenho de gameplay.
