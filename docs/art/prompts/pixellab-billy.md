# Billy — PixelLab

Personagem jogador de SUNSET SURVIVORS, criado a partir de uma cópia da vista sul de Steve. Os personagens existentes foram preservados.

- Personagem: `1c70e35a-b0b6-4d47-9dab-baabf19244b1`.
- Referência de estilo: Steve (`bd940d23-ebc9-44b3-a2bb-641a5f44c5f3`); Bob e Cormano consultados para confirmar o padrão.
- Canvas de referência: 256 × 256, fundo transparente, câmera `low top-down`.
- Roupa: chapéu marrom, blazer e calça azul vibrante, camisa branca, bandoleira de couro, botas marrons.
- Armas: dois revólveres clássicos, um em cada mão.
- Base criada com `edit_image_pro_flash`; personagem independente criado com `create_character_pro_flash`, reutilizando a base e gerando oito vistas.
- Caminhada solicitada: template `walking-4-frames`, `ai_freedom: 0`, nas oito direções, seguindo o template usado em Steve e Bob. Cormano usa `walking-5`, também com quatro frames.
- Direções: east, north-east, north, north-west, west, south-west, south, south-east.
- Assets: `public/assets/characters/pixellab/billy/`.
- Status e respostas: `pixellab-billy-jobs.json`.

Os jogadores consultados tinham vistas em oito direções, mas animações concluídas somente em cinco ou seis delas. Para Billy, foram solicitadas todas as oito. Nenhuma regra de combate foi alterada.

## Resultado verificado

Concluído: 8 vistas base e 8 caminhadas de 4 frames, total de 32 frames animados. Todos os 40 PNGs e a integridade do ZIP foram verificados. A falha temporária de nordeste por sobrecarga foi resolvida com reenvio apenas dessa direção no mesmo grupo.

Download local: `art/source/characters/pixellab/billy/billy.zip`. Integrado ao catálogo de jogadores em `src/assets/catalog.json`, com oito direções animadas. Os PNGs de execução ficam em `public/assets/characters/pixellab/billy/`; fontes e metadados ficam em `art/source/characters/pixellab/billy/`.

### Correção visual da direção sul

O template original desenhou a caminhada sul de costas. Foi criada a animação `walking-south-corrected-4-frames` (grupo `1f3330f6-8c24-4054-beb8-bfc4b211eea6`) em modo v3, mantendo a frente e os dois revólveres. No PixelLab, selecionar essa animação para sul. No ZIP final `billy.zip`, os frames corrigidos já estão em `Idle/animations/walking-4-frames/south/`. O arquivo `animation-selection.json` registra essa seleção. Os arquivos `template-original.zip` e `pixellab-source.zip` preservam as saídas originais.
