# Arquitetura e design system

O projeto usa composição por responsabilidades, com cenas Phaser coordenando o ciclo de vida. A refatoração preserva combate, progressão, durações das fases e armazenamento existente; não exige uma conversão para ECS.

## Organização

| Diretório | Responsabilidade |
| --- | --- |
| `src/scenes` | Ciclo de vida Phaser e coordenação da partida e dos menus |
| `src/systems` | Comportamentos da partida, encontros, cenário e projéteis |
| `src/game` | Tipos compartilhados das entidades de combate |
| `src/data` | Definições de personagens, fases, armas e progressão existentes |
| `src/ui/theme` | Paleta, tokens semânticos, tipografia e estilos dos componentes |
| `src/ui/layout` | Composição responsiva dos menus |
| `src/ui/hud` | Apresentação do estado do combate |
| `src/assets` | Catálogo de imagens, carregamento e testes do catálogo |
| `public/assets` | Arquivos utilizados em execução |
| `art/source` | ZIPs e metadados originais de produção; não são publicados pelo Vite |

`GameScene` ainda coordena parte do combate. `CombatHUD` concentra sua apresentação e `HostileProjectiles` concentra movimento, colisão e descarte dos tiros inimigos. As interfaces em `game/entities.ts` evitam depender da cena para compartilhar tipos.

## Design system Western Pulp ’98

`palette.ts` contém as nove cores canônicas. `tokens.ts` define papéis semânticos, fontes, camadas, movimento e resolução de referência. `buttons.ts` define os estados visuais dos botões. Componentes devem consumir esses tokens em vez de duplicar valores.

`createMenuRoot` centraliza e escala proporcionalmente menus para 1536 × 1024. O helper reage ao resize e remove o listener no shutdown da cena, inclusive quando a mesma cena é visitada novamente. O HUD permanece no espaço da partida.

## Assets e limpeza

Toda imagem de execução deve constar em `src/assets/catalog.json`. Carregue imagens estáticas com `preloadImages` e sequências com `framePath`; mantenha as chaves existentes utilizadas pelas animações. Billy está integrado ao catálogo dos jogadores, incluindo as oito direções e a caminhada sul corrigida.

Antes de adicionar um asset, registre o caminho ou a sequência no catálogo. Execute `npm run assets:audit` para listar candidatos sem uso e `npm run assets:check` para detectar arquivos ausentes, caminhos fora do catálogo e imagens órfãs. A auditoria considera o catálogo a declaração de uso: ao retirar uma imagem, remova também sua entrada e seu carregamento.

A limpeza desta refatoração removeu 387 imagens sem uso (aproximadamente 47,5 MiB) e transferiu 35 arquivos ZIP/JSON de produção para `art/source`. O [registro de limpeza](./asset-cleanup.json) contém caminhos e hashes dos arquivos removidos. As fontes PixelLab foram preservadas nos arquivos originais. O modo `--write` do script protege esse registro contra sobrescrita.

## Validação

- `npm run check`: TypeScript com verificação de declarações e parâmetros não utilizados, suíte Vitest e auditoria de imagens.
- `npm run build`: compilação de produção.
- Testes cobrem catálogo, direções dos sprites, layout responsivo e descarte de listeners, tokens visuais, campanha e o ciclo de vida real dos tweens de projéteis.

As validações de regras são automatizadas, conforme as instruções do projeto.

Referências: [ciclo de vida das cenas Phaser](https://docs.phaser.io/phaser/concepts/scenes), [eventos das cenas](https://docs.phaser.io/api-documentation/event/scenes-events) e [assets públicos no Vite](https://vite.dev/guide/assets.html).
