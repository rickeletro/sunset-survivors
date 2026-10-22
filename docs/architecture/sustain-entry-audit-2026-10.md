# Recuperação e entrada animada no saloon — 21/10/2026

> Atualização de progressão, chefes e modos: [difficulty-playtest-audit-2026-10.md](difficulty-playtest-audit-2026-10.md). Este documento registra a rodada anterior.

Esta rodada preserva a curva de XP aprovada (50/80/160 e crescimento posterior), os valores de XP/dinheiro, armas, HP/dano/velocidade dos inimigos, escala visual, hitboxes, Cormano, carroças e música.

## Diagnóstico e ajuste de recuperação

As garrafas caíam de 8% dos inimigos comuns e restauravam 30 HP. Isso disponibilizava 2,4 HP por abate, antes de considerar coleta ou desperdício por vida cheia: uma garrafa a cada 12,5 abates, em média. Para Cormano, uma única garrafa equivalia ao brinde inteiro do saloon. A regeneração máxima ainda somava 2 HP/s, inclusive entre acertos. A recuperação anulava muitos erros sem exigir uma escolha estratégica.

| Regra | Antes | Agora |
|---|---:|---:|
| Chance de garrafa por inimigo comum | 8% | 2% |
| HP por garrafa | 30 | 12 |
| Cura bruta esperada por 100 abates comuns | 240 HP | 24 HP |
| Intervalo médio entre garrafas | 12,5 abates | 50 abates |
| Regeneração Whiskey, ranks 1–5 | 0,25 / 0,5 / 1 / 1,5 / 2 HP/s | 0,15 / 0,3 / 0,5 / 0,75 / 1 HP/s |
| Espera após tomar dano para regenerar | nenhuma | 4 segundos ativos |
| Vida máxima concedida pelo Whiskey | +20 / +40 / +60 | preservada |
| Proteção após acerto | 600 ms | preservada |
| Contato / acerto de projétil do jogador | 20 / 26 px | preservados |

A cura incidental cai 90% sem aumentar dano, HP ou hitboxes artificialmente. Garrafas continuam entregando exatamente o XP/dinheiro do inimigo e respeitando o limite da vida máxima; pacotes fundidos conservam uma cura de 12 HP por garrafa original. A chance visual de badge fica em 20%, sem alterar seu valor. Boss/elite continuam deixando badge.

O atraso de regeneração só reinicia quando há dano efetivo: um golpe ignorado pela invulnerabilidade não reinicia a espera. Menus e transições não contam como tempo de recuperação. Defesa continua viável: os bônus de vida máxima e a associação do Whiskey à evolução do TNT foram mantidos.

Outras recuperações foram auditadas e preservadas por terem custo/risco explícito: provisões curam 20 HP após disputa e oito segundos de permanência; medicina é uma alternativa de 25 HP quando a build está completa; ranks de vida máxima concedem apenas a diferença de bônus. O saloon mantém 20% da vida máxima e $15, uma vez por tentativa: 20/22/24/30 HP para Steve/Billy/Bob/Cormano sem bônus de vida.

## Evidência quantitativa e limites

`npm run sustain:audit` reproduz o modelo; `npm run sustain:audit -- --write` atualiza o JSON ao lado. São 200 sementes fixas, 420 segundos, orçamento de abates do cenário intermediário anterior (0,7 → 3 abates/s), 80% de coleta, quatro segundos até recolher e dano de contato real de bandit contra Cormano: 12 − 3 de armadura = 9 HP. As mesmas sequências aleatórias são comparadas antes/depois. Testa-se um acerto evitável a cada 20, 10 ou 5 segundos; não é um bot que joga, simula movimento ou mede a habilidade do usuário.

| Acertos/minuto | Whiskey desde o início | Sobrevivência antes → agora | Vida média aos 90 s antes → agora | Vida média final antes → agora |
|---|---:|---:|---:|---:|
| 3 | nenhum | 100% → 100% | 145 → 125 | 141 → 95 |
| 6 | nenhum | 100% → 0,5% | 131 → 83 | 139 → 0 |
| 6 | rank 3 | 100% → 86,5% | 162 → 126 | 162 → 57 |
| 6 | rank 5 | 100% → 100% | 203 → 187 | 203 → 188 |
| 12 | rank 5 | 100% → 0% | 203 → 80 | 203 → 0 |

A proposta é conservar quem evita dano e valorizar defesa; continuar tomando dano regularmente sem investir em sobrevivência deixou de ser neutralizado por drops. O cenário com rank desde t=0 é uma análise de sensibilidade otimista, não uma build obtida gratuitamente. O modelo não inclui provisões nem a cura de aumento de vida máxima, que continuam disponíveis. Quando uma simulação morre, vida final e vida posterior à morte são zero. Esses resultados não provam equilíbrio de todas as builds, personagens ou fases, especialmente projéteis/áreas e coleta real sob pressão.

Aos 90 s do cenário de 3 acertos/minuto, o brinde tem espaço para recuperar cerca de 23 HP em vez de apenas cerca de 5. Ainda é correto um jogador que evita praticamente todo dano não precisar de cura: não há dano forçado para obrigá-lo a visitar o saloon.

## Fachada, porta e transição

- A fachada real fica com uma camada aditiva pulsante e luz de porta quando o personagem está a até 160 px do acesso. Há uma indicação ao lado do prédio; não é preciso procurar um botão no HUD.
- Clique ou toque diretamente nos pixels visíveis do prédio para entrar. E permanece como alternativa. Aproximação sozinha nunca ativa a entrada. O input é registrado no objeto em coordenadas de mundo; o Phaser faz a conversão da câmera/zoom, sem misturar pointer de tela com mundo.
- Antes de consumir a visita, calcula-se uma rota local até uma soleira segura. O planejador verifica segmentos completos contra os círculos dos props e as pegadas expandidas dos prédios, inclusive diagonais. Ele contorna obstáculos em vez de simplesmente interpolar através deles. Se não há rota, não consome visita nem congela a partida.
- A partida é congelada imediatamente, inclusive relógio e tweens no quadro anterior à pausa enfileirada. A animação usa uma cena separada com o mesmo scroll/zoom da câmera, sem alterar a câmera de gameplay.
- Um duplo visual usa a arte e as animações reais do protagonista e se orienta pelo trajeto. O ator físico acompanha somente os trechos livres e permanece fora da colisão do prédio. Só o duplo cruza a abertura pintada, encolhendo proporcionalmente para 22% e desaparecendo.
- As folhas animadas da porta são recortes da própria textura do saloon, com pivôs nas dobradiças; não foi criada uma porta provisória de retângulos. Luz quente, poeira e fade de 180 ms completam a passagem. A corrida cinematográfica usa 220 px/s; o trecho de porta dura 320 ms. Trajetos usuais ficam em aproximadamente 1–2 segundos. Nenhum segundo de combate é consumido.
- O interior é pré-carregado na fase para não mostrar a rua entre o fade e o carregamento da imagem. As dançarinas continuam sendo a ilustração estática aprovada; a novidade animada está na experiência de entrada/retorno.
- Na volta, o duplo aparece pela porta e anda até o ponto seguro do acesso. Só ao final o ator real reaparece, o brinde é pago uma vez e a partida retoma, com os 600 ms habituais de proteção. Se o caminho de saída não estiver disponível no planejamento, usa-se a rota de entrada invertida, que já foi validada.
- Flags de fase, identidade da visita e encerramento idempotente impedem reentrada, callbacks duplicados e recompensas antigas. Cancelamento e shutdown restauram visibilidade/estado dos relógios sem deixar o jogo travado ou conceder prêmio de uma tentativa anterior.

Não foram adicionados obstáculos, pôquer, cartas ou fichas, nem trocada a música. A visita continua limitada por tentativa de fase e é bloqueada durante onboarding, upgrades e chefes.

## Reutilização e validação

`BuildingPortal` descreve fachada, soleira, abertura e recortes opcionais das folhas. `BuildingPath` faz o trajeto; `BuildingPortalView` cuida do brilho/input; `BuildingMotion` contém a linha temporal determinística; `BuildingTransitionScene` apresenta os efeitos. Outros prédios podem usar o mesmo mecanismo com outra configuração/callback, sem copiar o saloon inteiro.

Testes cobrem probabilidades, cura/XP/dinheiro por pacote, limite de cura, armadura/dano, invulnerabilidade, espera de regeneração, simulações, rotas contra círculos/prédios, orientação norte do Cormano, proporção do sprite, câmera copiada, glow/input pixel-perfect, teclado/toque, pré-carregamento, pausa de todas as fases, timer real do Phaser, retorno, cancelamento, shutdown e callbacks duplicados/antigos.

`docs/qa/saloon-entry-preview.gif` e `saloon-entry-frames.png` são prévias offline geradas com a linha temporal real e os assets existentes. Foram inspecionadas como composição/apresentação; não são capturas de gameplay. Não houve jogada manual/browser para validar regras. A confirmação final inclui testes, TypeScript, auditoria de assets, build e leitura HTTP do servidor local. A renderização final dentro de uma partida não é afirmada como verificada visualmente.
