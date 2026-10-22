# Biblioteca visual Western Pulp

O cenário mostra apenas o ambiente. Interface, textos, retratos, placas e estados interativos pertencem a camadas independentes. Não usar uma imagem de tela inteira contendo fichas antigas, valores de exemplo ou espaços pretos para depois cobrir com a interface nova.

## Peças disponíveis

| Peça | Uso | Fonte editável |
|---|---|---|
| `pulpSurface(..., 'paper')` | Descrições, notas, títulos, fichas | `public/assets/ui/materials/paper.png` |
| `pulpSurface(..., 'wood')` | Placas, agrupamentos, botões | `public/assets/ui/materials/wood.png` |
| `WesternButton` / `pulpButton` | Hover, foco, pressão, ativação | `src/ui/components/WesternButton.ts` |
| `WesternPanel` / `pulpPaper` / `pulpWood` | Composição de painéis | `src/ui/components/PulpSurface.ts` |
| `WesternTitle` / `pulpHeading` | Cabeçalhos proporcionais | `src/ui/components/WesternTitle.ts` |
| `heroPortrait` | Retratos quadrados com moldura comum | `src/ui/components/HeroPortrait.ts` |
| `pulpText` | Títulos e legendas | `src/ui/layout/pulpSceneKit.ts` |
| `menuBackdropScale` | Fundo cobrindo o canvas sem distorção | `src/ui/layout/menuLayout.ts` |

As duas texturas de material são PNGs de 256×256, com cantos de 32 px para nine-slice. O centro é opaco e tem textura discreta; não precisa de um retângulo liso por cima para permitir leitura. Mantenha conteúdo a pelo menos 32–40 px das bordas. Para painéis baixos, reduza o conteúdo ou aumente o painel em vez de sobrepor subtítulos à moldura.

```ts
import { preloadSurfaces, pulpSurface } from '../ui/components/PulpSurface';

preload() { preloadSurfaces(this); }
// Em um rootContainer existente:
root.add(pulpSurface(this, 0, 300, 1200, 240, 'paper'));
// Adicionar texto e personagem em objetos separados.
```

Para uma tela inteira, `preloadPulp` carrega cenário e materiais; `createMenuRoot` mantém a escala proporcional. `pulpBackdrop` usa uma imagem sem UI incorporada. Use Rye para títulos, Roboto Slab para descrições e Press Start 2P para números/instruções curtas. As fontes e licenças estão em `public/assets/fonts`, carregadas localmente antes da criação do canvas.

Mudanças em superfícies afetam todas as telas que as usam. Verifique centro opaco, cantos, textos longos, foco e largura dos botões antes de concluir. Retratos continuam 84×84; a moldura é separada da imagem. Prompts e procedência das novas superfícies estão em `art/source/production-ui/generation.json` e `paper-fix.json`. Foi usado image_gen integrado; não foi usada uma conexão PixelLab nesta sessão.
