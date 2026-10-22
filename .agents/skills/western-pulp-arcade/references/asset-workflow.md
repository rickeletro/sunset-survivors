# Assets Western Pulp: geração, escala e integração

## Escolher referência e ferramenta

Use o personagem real do catálogo e uma construção aprovada como referências. Para HUD, compare retratos entre si e a leitura no tamanho final; para UI, use o espaço lógico do menu, não a escala física do mapa. Para terrenos, compare densidade de pixels com personagens/props e verifique repetição e transições; a proporção em alturas abaixo não se aplica a tiles planos.

PixelLab MCP é preferencial para personagens animados, direções, objetos e tiles compatíveis com nossa arte. Descubra as ferramentas expostas e consulte [documentação oficial](https://api.pixellab.ai/mcp/docs) quando precisar dos parâmetros atuais. Verifique acesso por uma operação de leitura disponível antes de prometer geração na conta. Não copie tokens de outra IDE nem mude configurações para executar uma tarefa que só pede design. Evite gerar lotes até conferir um exemplar na escala final; respeite escopo e orçamento autorizados. Sem MCP acessível, explique a limitação; use imagegen quando disponível e autorizado, seguindo suas instruções, ou avance com referências/especificações.

Não importar preferências de skills externas como arte sem contorno, diretórios de outro jogo, hospedagem/nginx ou modelos de custo fixos. Aqui, contornos carvão e paleta Western Pulp são parte da identidade.

## Brief de produção

Registre antes de gerar: papel do objeto, vista/perspectiva, referência aprovada, paleta, materiais, direção da luz, resolução fonte, altura visível desejada no mundo, escala de renderização, ponto de apoio, animações/direções necessárias e área de colisão existente. Dimensões são metas de produção, não razão para deformar a silhueta.

Prompt sugerido (adaptar ao objeto):

> Sprite independente de [objeto], Western Pulp ’98, pixel art de arcade tardio, contorno carvão, luz quente superior esquerda, sombras roxas, [materiais], vista [compatível com referências]. Silhueta legível no tamanho final, detalhes em agrupamentos de pixels. Fundo transparente, objeto completo, sem texto/moldura/cenário achatado. Deve medir aproximadamente [altura visível] no mundo ao lado do personagem de referência. Preservar [identidade e elementos aprovados].

No PixelLab, use referências de estilo/identidade e variantes do mesmo asset quando a ferramenta suportar, em vez de recriar cada membro da família sem referência. Para personagens, verificar frente, costas e laterais reais; não tratar um espelhamento vertical como direção nova. Manter tamanho visível e linha dos pés estáveis entre frames.

## Comparação obrigatória no tamanho final

1. Meça o bounding box dos pixels visíveis, descartando alfa quase invisível. Calcule `altura_visivel_mundo = altura_bbox × escala_render`. Faça o mesmo para o herói com a escala usada pelo jogo, consultando o código vigente.
2. Monte personagem, objeto e construção com o mesmo chão e a mesma unidade de pixel do mundo. Produza uma composição em 1:1; ampliação inteira pode complementar, nunca substituir a leitura em 1:1.
3. Avalie proporção, espessura do tronco/poste, silhueta, densidade de pixels, paleta e perspectiva. Rejeite detalhes que só apareçam no zoom, objeto minúsculo dentro de canvas grande ou margens/halo confundidos com altura física. Confira pivô no runtime: uma prévia alinhada pelos pés não valida automaticamente `origin`.
4. Se falhar, prefira reexportar da fonte de maior resolução ou regenerar no tamanho apropriado. Ampliar PNG já reduzido não recupera detalhe. Redimensione proporcionalmente; não estique largura para engrossar um cacto.
5. Só então integre pelo catálogo, com colisões e caminhos preservados conforme o escopo. Adapte o teste e as expectativas de tamanho quando a escala mudar intencionalmente.

### Referências atuais, não tamanhos universais

A revisão aprovada exportou cacto em 72×132 e poste em 72×192; casas usam canvases de 192–256 px. A altura visível é menor e depende do recorte: não tomar essas dimensões como altura física exata. Árvores/estruturas grandes devem se relacionar com o herói e com as casas; barris/caixas continuam objetos menores. Reavaliar as faixas se mudar câmera, escala dos atores ou desenho.

Postes pertencem às fachadas adequadas, afastados das portas, com altura próxima da construção visível. Não espalhar postes do tamanho de inimigos pelo deserto nem colocá-los junto a vagões só para preencher o mapa. Halo aditivo é camada separada. Verificar transparência ao encobrir ator e descarte quando a construção sai da área ativa. Mudanças de posicionamento explicitamente solicitadas podem remover postes do sorteio; preservar os demais sorteios/posições quando possível.

## Ferramenta de comparação

Dependência: Python 3 + Pillow. Se Pillow não estiver disponível, procure um runtime já instalado; não instale dependências nem altere o projeto silenciosamente. Execute a partir da raiz local:

```sh
python3 .agents/skills/western-pulp-arcade/scripts/compare_scale.py --root . --manifest .agents/skills/western-pulp-arcade/references/scale-baseline.json --output /tmp/western-scale
```

Gera `/tmp/western-scale.png` e `.json`, contendo canvas, bounding box, dimensões visíveis no mundo e proporção com o herói. Retorna erro se uma faixa declarada falhar. O manifesto de referência usa assets reais do projeto; caminhos são relativos à raiz passada, escalas devem ser conferidas no código. Faixas são metas visuais provisórias, não novas regras de combate. Para outro asset, copie o manifesto para um arquivo de trabalho e ajuste nome, caminho, escala e limites. Não altere o baseline aprovado só para fazer um erro passar.

## Entrega

Registre ferramenta, prompt, origem/ID quando disponível, arquivo final e decisão de escala. PNG final deve estar no projeto, nunca apenas em cache da ferramenta. Preserve as fontes aprovadas e cadastre caminhos em `src/assets/catalog.json`. Faça QA visual offline para composição e testes automatizados para regras, direções, tamanhos/alpha, posicionamento e descarte relevantes; siga AGENTS.md para executar `npm test`, tipos e auditoria/build aplicáveis. Não use gameplay ou screenshots para provar regras. Não declare uma composição offline como captura do jogo nem declare conexão PixelLab sem verificá-la.
