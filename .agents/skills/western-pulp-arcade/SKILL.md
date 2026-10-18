---
name: western-pulp-arcade
description: >-
  Diretrizes, padrões técnicos, paletas e fluxo de trabalho para desenvolvimento de cenas, interfaces de usuário (UI), pixel art 32-bit e efeitos sonoros para SUNSET SURVIVORS no estilo WESTERN PULP '98 — Retro Western Pulp Arcade Art (Phaser 3 e TypeScript). Ative esta skill sempre que o usuário solicitar criação, refatoração, estilização ou revisão de telas (Title, Character Select, Level Up, Game Over, HUD), cartazes de procurado, cards de power-up, sprites de personagens ou integração de áudio.
---

# Western Pulp '98 — Guia de Desenvolvimento de Telas e Assets

Este guia estabelece o padrão arquitetural e estético obrigatório para todas as telas, interfaces e recursos de **SUNSET SURVIVORS**.

---

## 1. Princípios Fundamentais

1. **Estilo WESTERN PULP '98:**
   - Visual inspirado em clássicos de fliperama dos anos 90 (Neo Geo / *Sunset Riders*) mesclado com gravuras e tipografia de faroeste de 1880.
   - Texturas táteis de madeira rústica, pergaminho envelhecido, cartazes *WANTED*, rebites dourados e contornos escuros espessos.
   - Iluminação quente de entardecer com lanternas âmbar cintilantes.
2. **Camadas Independentes (Nunca Imagem Estática):**
   - Toda cena deve ser composta por camadas funcionais e independentes (céu, terreno, moldura de madeira, personagens, logotipo/títulos, botões interativos e HUD).
   - Elementos visuais devem reagir a ponteiros (hover, clique, toque) e teclas (<kbd>Enter</kbd>, <kbd>Espaço</kbd>, <kbd>WASD</kbd>).
3. **Resolução Lógica e Responsividade:**
   - Resolução base de referência: **1536 × 1024** contida em um `Phaser.GameObjects.Container` centralizado.
   - O canvas do jogo opera em tela cheia (`100vw` / `100vh`) com `Phaser.Scale.FIT` e `autoCenter: Phaser.Scale.CENTER_BOTH`.

---

## 2. Camadas Típicas de uma Cena Arcade

Ao criar uma nova tela (ex: Seleção de Personagens, Level Up, Game Over, História):

| Camada | Nome | Conteúdo Típico |
|---|---|---|
| **1** | Fundo Distante | Céu crepuscular, nuvens com drift lento, sol poente ou interior escuro de saloon |
| **2** | Cenário Médio | Mesas do deserto, montanhas rochosas, fachadas de madeira, pórticos |
| **3** | Moldura Estrutural | Vigas de madeira escura de saloon, colunas laterais, lanternas a gás com halos aditivos, cordas, barris |
| **4** | Conteúdo Central | Personagens ilustrados com sombras no chão, cartazes WANTED, cartas de recompensas/upgrades |
| **5** | Títulos & Logotipos | Letreiros entalhados em madeira, estrelas douradas, crânio de boi Longhorn |
| **6** | Controles Interativos | Botões em pergaminho/madeira com estados `idle` e `glow`, animação de pulsação e cursores de mão |
| **7** | HUD Superior/Inferior | Pontuação `1UP`, `HIGH`, `CREDIT`, créditos de copyright e botão de som `🔊 SFX` |
| **8** | Efeitos Ambientais | Partículas de poeira do deserto (`dust`), baforadas de fumaça de chaminé e faíscas douradas |

---

## 3. Guia dos Personagens

| Personagem | Arma Principal | Visual Canônico | Personalidade |
|---|---|---|---|
| **Steve** | Dois revólveres Colt .45 | Chapéu e lenço rosa/amarelo, casaco marrom de couro, calça amarela e botas com esporas | Pistoleiro veloz e ágil, sempre pronto para o saque rápido |
| **Billy** | Dois revólveres clássicos | Chapéu marrom, blazer azul vibrante, camisa branca, bandoleira de couro transversal | Confiante, equilibrado, mira apurada e presença heroica |
| **Bob** | Rifle Winchester Repeater | Chapéu e traje verde floresta, bandoleira, botas longas de montaria | Franco-atirador veterano, postura de combate e disparos perfurantes |
| **Cormano** | Sawed-Off Shotgun (cano duplo) | Sombrero mexicano rosa ornamental, poncho colorido tradicional | Imponente, carismático, disparos de grande dispersão e dano massivo |

---

## 4. Integração de Áudio (`SoundManager.ts`)

Sempre utilize os métodos padronizados de [SoundManager.ts](file:///Users/ricardosouza/.gemini/antigravity-ide/scratch/sunset-survivors/src/audio/SoundManager.ts):

```typescript
import { sounds } from '../audio/SoundManager';

// Efeitos de disparo e ação
sounds.playRevolver();        // Disparo de revólver padrão
sounds.playShotgun();         // Disparo pesado da espingarda
sounds.playRifle();           // Disparo longo do Winchester
sounds.playReload();          // Som mecânico de recarga do tambor
sounds.playBell();            // Sino de saloon para seleção / level-up
sounds.playPickup();          // Coleta de moedas e recompensas

// Músicas temáticas
sounds.playIntroMusic();      // "Departing into the Horizon" (menus e abertura)
sounds.playGameplayMusic();   // "Galloping West" (partida principal)
```

---

## 5. Arquivos de Referência

Para detalhes específicos, consulte os documentos em `references/`:
- [Paleta Canônica e Tokens](./references/palette.md): Cores hexadecimais e tokens do sistema.
- [Boilerplate de Cena Phaser 3](./references/scene-boilerplate.ts): Modelo de código com containers responsivos.
