# Kit de cenários Western Pulp ’98

16 objetos criados via MCP do PixelLab, baixados e integrados ao catálogo de execução. Os prompts e IDs de geração estão em `pixellab-scenery-jobs.json`.

| Tema | Elementos integrados |
| --- | --- |
| Desfiladeiro | Celeiro, casa, carro de carga, caixa-d’água, poço e amarrador |
| Ferrovia | Locomotiva, vagões de carga e passageiros, estação e caixa-d’água |
| Vila em chamas | Casas, saloon, delegacia, armazém, poço e amarrador, junto às ruínas existentes |
| Saloon | Pequenos quarteirões com saloon, comércio, casas, delegacia e decoração |
| Vagões | Pátios com vagões, locomotiva e caixa-d’água |
| Montanha | Entrada de mina, casas, carro de carga, poço e amarrador |
| Hacienda | Construções de adobe, casas, celeiro e decoração |
| Mansão | Mansão vitoriana, casas, delegacia e carro de carga |

## Integração

- Arquivos PNG: `public/assets/scenery/pixellab/`. Catálogo: `src/assets/catalog.json`.
- Tamanhos nativos de 96×96 a 256×256, além do amarrador de 128×64; nenhuma imagem é esticada.
- `src/data/scenery.ts` define dimensões, footprints, composições e quais assets cada fase carrega.
- `StageLandmarks` instancia os objetos próximos, descarta os distantes e encerra luzes e partículas no shutdown. Luzes aditivas oscilam sem criar timers por objeto; locomotivas estacionadas emitem fumaça com limite de partículas.
- Construções e atores compartilham ordenação vertical. A fachada perde opacidade quando encobre o jogador.
- As bases têm colisão retangular; objetos pequenos existentes continuam com colisão circular. A geração de props reserva espaço para as construções, e o spawn resolve colisões.
- `SceneryNavigation` calcula desvios locais para os inimigos contornarem fachadas, preservando seus parâmetros de combate e o intervalo de atualização da IA.
- Os pátios ficam em desvios dos trilhos ativos. A locomotiva também substitui o desenho provisório do evento de trem, mantendo seu aviso, tempo e área de dano.

## Transparência corrigida

O serviço devolveu celeiro, saloon, armazém, hacienda, mansão e estação com fundo opaco. Foram geradas versões transparentes via edição PixelLab, preservando as dimensões. Os originais estão em `art/source/scenery/pixellab/`; o jogo usa somente os PNGs corrigidos.

As versões corrigidas também são salvas na biblioteca de objetos do PixelLab com nomes `SS98 - <nome> - Transparente`, reutilizando os PNGs finais. Os objetos iniciais são preservados como histórico, por isso ainda podem aparecer opacos no PixelLab. Os IDs das versões corrigidas constam em `transparent_object` no registro de jobs.

## Validação

Os testes leem e descomprimem os PNGs para verificar dimensões e transparência real, além de validar catálogo, área inicial, ruas de fuga, separação das construções, corredores ferroviários, colisões, navegação com IA espaçada, transparência de fachadas e liberação de recursos. Executar `npm run check` e `npm run build`.
