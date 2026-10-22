# Auditoria visual — preparação para produção

## Resultado aplicado

Trabalho realizado diretamente no projeto local, branch `develop`, sem worktrees, commits ou publicação. Alterações anteriores da skill foram preservadas. O escopo desta rodada foi composição visual, legibilidade, reutilização de componentes e limpeza de recursos comprovadamente substituídos; não é uma certificação completa de lançamento.

| Área | Problema encontrado | Correção |
|---|---|---|
| Seleção | Retângulo preto, ficha fixa de Steve e botão antigos gravados no fundo | Cenário limpo, título ao vivo, cartazes e um único painel independente |
| Seleção | Sombra duplicada, retângulo sobre pergaminho e clarão circular flutuante | Camadas removidas; animação original do personagem fornece seus disparos |
| UI compartilhada | Várias implementações de placas e molduras com estilos diferentes | Materiais de madeira/pergaminho e componentes reutilizáveis |
| Estatísticas | Botões de abas se acumulavam; texto claro sobre papel; sprite grande demais | Descarte das abas, tinta escura/vermelha e showcase contido |
| História | Texto pixel pequeno e cartão com geometria provisória | Pergaminho modular, texto narrativo maior, áreas de leitura e controles separados |
| História | Possibilidade de skip repetido e acúmulo de entradas | Saída idempotente e limpeza de handlers/timer |
| Level Up | Três placas redundantes no cabeçalho; tabela de seis linhas comprimida | Cabeçalho único, resumo legível e nota alinhada |
| Retratos | HUD e Level Up usavam tamanhos/tratamentos diferentes | Componente quadrado comum com madeira/latão e rebites |
| Controles | Ciano fora da paleta e ilustração apertada | Latão/dourado e escala ajustada |
| Procurados/introdução | Parede, moldura branca sem máscara e silhuetas redundantes | Cenários compartilhados e remoção de sobreposições desnecessárias |
| Título/áudio | Botões auxiliares pequenos, emojis inconsistentes, labels dos sliders sobre trilho | Tipografia temática maior, labels separados e modal com material comum |
| Ciclo de UI | Listeners de teclado/drag sobreviviam a visitas | Descarte por cena/modal e bloqueio de atalhos atrás do modal |
| Fundos | Imagens esticadas e barras internas | Cover proporcional do canvas, mantendo layout lógico |
| Fontes | Dependência de Google Fonts externo e canvas criado antes da fonte | Fontes oficiais locais com licenças e espera pelo carregamento |
| Fases | Piso pontilhado formando diagonais repetidas | Textura maior, de baixo contraste e distribuição independente; madeira e pedra preservam material |
| Tutorial | Pergaminho provisório com textura forte atrás do texto | Mesmo material de leitura dos demais painéis |

A biblioteca e exemplos de uso estão em [ui-components.md](../art/ui-components.md). Os fundos limpos existentes foram reutilizados; não foi criada uma nova imagem achatada de interface.

## Limpeza

Seis imagens antigas saíram do runtime e foram preservadas em `art/source/production-ui/`: fundo composto da seleção, nota antiga de lore, pergaminho antigo, subtítulo de madeira, estrela e placa de título antigos. Foram criadas duas texturas modulares; catálogo final: **809 imagens**, sem ausências ou imagens soltas não cadastradas. O arquivo de origem continua disponível para recuperação/edição. As fontes são Rye e Press Start 2P sob OFL e Roboto Slab sob Apache, obtidas do repositório oficial `google/fonts`.

## Verificação e evidência

- **316 testes**, TypeScript, `assets:check`, build de produção e verificação de whitespace aprovados.
- Capturas reais em Chrome headless de 15 cenas: seleção, dificuldade, controles, estatísticas, história, pausa, saloon, galeria, derrota, conclusão de fase, conclusão do jogo, introdução de fase, procurados, Level Up e título.
- Estados extras: Cormano e sua descrição longa, história com texto completo, aba de arsenal e opções de áudio.
- Revisão visual dos cenários/HUD das oito fases, distribuindo os quatro personagens. Não foi usado esse procedimento para provar equilíbrio ou regras de combate.
- Os contextos de navegador são isolados, com valores sintéticos para os menus; não representam recordes reais do jogador.
- Nenhum erro de página ou resposta HTTP 4xx/5xx durante as capturas. Resultados em `docs/qa/production-audit/browser-results.json` e `final-ground-results.json`; imagens da auditoria na mesma pasta.
- A composição foi avaliada em viewport desktop 1536×1024, com canvas 16:9. Testes matemáticos cobrem outras proporções, mas não substituem QA visual em dispositivos reais.

## Limites para lançamento

Esta auditoria não mede desempenho em aparelhos fracos, acessibilidade completa, saves entre versões, campanha inteira de longa duração, distribuição/licenciamento do produto ou UX de telas muito pequenas. O build ainda informa chunk JavaScript maior que 500 kB, principalmente pelo engine e bundle único; não houve falha de build. Esses pontos precisam de validação própria antes de declarar uma versão comercial pronta. Combate, XP, dificuldade, economia, colisões e distribuição dos obstáculos não foram recalibrados nesta rodada.
