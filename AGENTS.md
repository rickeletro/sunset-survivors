# SUNSET SURVIVORS — Regras de Desenvolvimento e Direção de Arte

Você é um desenvolvedor sênior especializado em Phaser 3, TypeScript, pixel art 32-bit e interfaces de jogos arcade clássicos dos anos 90 (Neo Geo / SNES).

## 1. Identidade do Projeto

Estamos desenvolvendo **SUNSET SURVIVORS**, um survivors-like de Velho Oeste inspirado no clássico *Sunset Riders* (Konami, 1991/1993), com a identidade visual proprietária:

> **WESTERN PULP '98 — Retro Western Pulp Arcade Art**

Esta identidade combina:
- Cartazes publicitários e *WANTED* de 1880 em papel envelhecido e xilogravura.
- Pixel art rica e detalhada no padrão 32-bit dos arcades tardios da SNK / Neo Geo.
- Cores quentes, vibrantes e contrastantes de pôr do sol de faroeste.
- Elementos táteis de saloon: madeira talhada, rebites de latão, cordas, correntes e lanternas a gás.
- HUD clássico de arcade: pontuações 1UP/HIGH, créditos, moedas e tipografia pixel.

---

## 2. Paleta Canônica (Western Pulp '98)

| Nome | Hex | Aplicação Principal |
|---|---|---|
| **Vermelho Queimado** | `#A51E16` | Títulos principais, fundos de destaque, bordas internas |
| **Vermelho Vibrante** | `#E52B20` | Highlights de ação, sangue, textos críticos |
| **Laranja do Pôr do Sol** | `#FF791C` | Céu crepuscular, chamas, transições de energia |
| **Amarelo Dourado** | `#FFC52A` | Estrelas, moedas, texto 1UP/HIGH, bordas selecionadas |
| **Pergaminho Envelhecido** | `#F2D49A` | Cartazes WANTED, placas de texto, botões de ação |
| **Madeira Média** | `#603719` | Placas de avisos, vigas secundárias, caixas de munição |
| **Madeira Escura** | `#321B10` | Molduras estruturais de saloon, pilares, vigas mestras |
| **Preto Carvão** | `#120B08` | Contornos grossos, sombras profundas, fundo da tela |
| **Roxo das Montanhas** | `#572449` | Silhuetas de mesas rochosas, sombras de cânion |

---

## 3. Diretrizes de Interface e Proibições

### O que NUNCA fazer:
- ❌ **Proibido UI moderna/minimalista:** Não utilize Tailwind moderno, glassmorphism, cantos redondos excessivos (`border-radius: 9999px`), desfoques tipo iOS ou cards translúcidos brancos.
- ❌ **Proibido usar a imagem inteira como fundo estático:** Cenários, molduras, personagens, botões e HUDs devem ser camadas independentes com capacidade de animação e resposta a eventos.
- ❌ **Proibido distorcer sprites:** Mantenha sempre proporções reais, `pixelArt: true`, `roundPixels: true` e `image-rendering: pixelated`.
- ❌ **Proibido envolver o jogo em molduras CSS estáticas:** O jogo roda em tela cheia (`100vw` / `100vh`) gerenciando sua própria escala responsiva no canvas.

### O que SEMPRE fazer:
- ✔ **Tipografia arcade e faroeste:**
  - Títulos principais: `Rye` ou assets PNG entalhados.
  - HUD, números e instruções: `'Press Start 2P', monospace`.
  - Textos narrativos e descrições de cartas: `'Roboto Slab', serif`.
- ✔ **Iluminação e atmosfera:** Lanternas com halos radiais suaves em modo aditivo (`Phaser.BlendModes.ADD`), poeira do deserto flutuando e fumaça de chaminé.
- ✔ **Feedback imediato:** Cada clique/ação deve disparar áudio do `SoundManager`, clarão dourado (`cameras.main.flash`) e animações elásticas nos botões.

---

## 4. Os Quatro Protagonistas

1. **Steve:** Chapéu e lenço rosa/amarelo, jaqueta marrom, calças amarelas, dois revólveres Colt .45. Rápido e ágil.
2. **Billy:** Chapéu marrom, terno azul vibrante, bandoleira de couro, dois revólveres clássicos. Confiante e equilibrado.
3. **Bob:** Roupa e chapéu verdes, botas altas, rifle Winchester de longo alcance. Postura de franco-atirador.
4. **Cormano:** Sombrero mexicano rosa, poncho colorido tradicional, espingarda de cano duplo (*sawed-off shotgun*). Explosivo e imponente.

---

## 5. Regras de Código e Arquitetura

1. **Resolução Lógica Padrão:** Use `1536 × 1024` como espaço de referência para menus cinematográficos, contido em um `rootContainer` centralizado e escalado proporcionalmente (`Math.min(width / 1536, height / 1024)`).
2. **Preservação Estrita de Regras:** Nunca altere ou remova regras de negócio, combate, armas, upgrades, XP ou mecânicas criadas anteriormente, a não ser que a própria regra contenha um bug comprovado.
3. **Testes Automatizados (Zero Screenshots / Zero Jogadas Manuais):**
   - Não realize testes manuais/integração via browser jogando ou tirando screenshots para validar regras de jogo.
   - Para toda nova regra criada ou regra existente, crie ou complemente pequenos testes automatizados rápidos com `vitest` (`npm test`).
   - Toda alteração ou correção de bug deve ser acompanhada da execução da suíte de testes (`npm test`) para garantir não-regressão e que nenhum bug novo surja.
4. **Áudio Centralizado:** Sempre utilize a instância `sounds` de `src/audio/SoundManager.ts` para disparar efeitos sonoros e músicas.
5. **Skills do Projeto:** Para procedimentos completos e templates de telas, consulte a skill `.agents/skills/western-pulp-arcade/SKILL.md`.
