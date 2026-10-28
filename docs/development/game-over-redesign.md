# Game Over — composição Western Pulp

A tela foi refeita a partir da referência fornecida, com fundo existente de pôr do sol, madeira escura, pergaminho, rebites, revólveres em pixel clusters, retrato real e medalhas. Não há imagem única com textos ou controles embutidos. Fundo, ornamento lateral, iluminação, cabeçalho, superfícies, conteúdo e botões são camadas independentes.

## Arquivos e integração

- `src/scenes/GameOverScene.ts`: recebe o resultado real, registra estatísticas, coordena ranking e navegação.
- `src/ui/GameOverView.ts`: regiões LAST STAND e HALL OF FAME, números, medalhas, bordas, ícones e animações.
- `src/ui/components/RankingNameField.ts`: campo HTML alinhado ao canvas, teclado móvel/IME e isolamento de atalhos.
- `src/data/GameStatsManager.ts`: saldo compartilhado e estatísticas; a tela mantém o tratamento existente de resultado já sincronizado à carteira.
- `src/data/RankingManager.ts`: Top 100, fila de sincronização e histórico pessoal; a tela mostra os cinco primeiros.
- `shared/ranking-score.js`: fórmula compartilhada pelo jogo, API local e Worker.
- `server/ranking-validation.mjs`, `server/ranking-store.mjs` e `server/cloudflare/worker.mjs`: validação e recomputação de pontos.

## Layout e controles

A referência desta tela é 1920×1080. O helper de menus recebeu dimensões opcionais; os outros menus preservam seu padrão de 1536×1024. O root é contido e centralizado proporcionalmente; não há distorção de imagens. O campo nativo acompanha canvas e resize, com altura e padding proporcionais.

LAST STAND mostra o herói usado, nome, fase/nível, tempo, kills, dificuldade, dinheiro conquistado na partida e banco total. Dinheiro herdado aparece somente no banco, sem inflar os ganhos da partida. Valores reais podem ser zero.

HALL OF FAME carrega o cache imediatamente e sincroniza automaticamente. Os cinco primeiros recebem posições, nomes, pontuação e fase; os três primeiros têm medalhas. A linha adicional dourada mostra a posição do resultado atual, inclusive antes de registrar nome. Posições acima do conjunto global disponível são exibidas com `+`, como limite inferior, sem prometer uma posição global exata além dos registros retornados pela API.

Mouse, setas e Tab navegam; Enter ativa a ação selecionada, R tenta novamente, Esc retorna ao título e N foca o nome. Ao digitar, o campo bloqueia o KeyboardPlugin e a propagação dos atalhos. Enter no campo salva; Esc apenas desfoca. Salvar mantém a tela aberta, atualiza imediatamente os registros e desabilita o campo e o botão. RETRY mantém personagem, fase e dificuldade; BACK TO TITLE retorna diretamente ao início. Cliques repetidos não disparam navegação múltipla.

## Pontuação e persistência

`floor((kills × 50 + segundos × 2 + waves concluídas × 500) × dificuldade)`

Segundos são inteiros, limitados aos 600 segundos da fase; cada 120 segundos completa uma wave, no máximo cinco. Multiplicadores: Easy 0,8; Normal 1; Hardcore 1,3. Dinheiro não integra a fórmula.

Cliente e servidor recalculam pontos a partir das métricas. A projeção SQLite/D1 reavalia registros antigos sem apagar IDs ou nomes. Não há migração destrutiva de tabela. O histórico pessoal retém 500 registros, independentemente da lista Top 100. IDs registrados permanecem no ledger para impedir nova submissão da mesma partida após sincronização/reabertura. Resultados offline continuam na fila existente, enviada quando a conexão retorna.

A alteração do Worker está pronta no código e coberta por testes. A API pública só passa a ordenar todos os registros pela nova fórmula depois da publicação dessa versão do Worker; esta tarefa não publicou serviços remotos. O cliente já recalcula os registros recebidos, mas a seleção global do Top 100 depende da versão da API. O banco e as compras permanecem independentes do ranking.

## Movimento e QA

Título entra com escala suave; painéis aparecem progressivamente. Kills e moedas contam por 650 ms. O registro salvo pulsa brevemente, com áudio do SoundManager. Não há tremor de câmera nesta tela.

Foram executados testes de composição em 1920×1080, 1536×864, 1280×720 e 800×600, dados zerados, salvamento único, histórico fora do Top 100, persistência após recarregar, foco do nome, atraso de sincronização, RETRY e retorno ao título. A suíte final passou com 596 testes e um teste de exportação de arte optativo; esse teste também foi executado separadamente. TypeScript, build e auditoria de 904 assets passaram. O build mantém o aviso anterior de bundle grande.

`docs/art-direction/game-over-layout-preview.png` é uma composição offline da árvore de cena exportada pelo teste, desenhada com Pillow, assets e fontes locais. Não é screenshot nem prova de gameplay. Os nomes e pontos nessa composição são fixtures ilustrativas, sem fallback fictício no ranking real.

Para reproduzir essa conferência:

```sh
SUNSET_ART_QA=1 npx vitest run src/scenes/PulpMenus.test.ts -t 'exports an offline'
python3 scripts/render-gameover-preview.py
```
