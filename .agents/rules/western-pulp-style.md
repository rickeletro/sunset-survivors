# Regras de Estilo e Criação de Assets — WESTERN PULP '98

## 1. Tratamento e Preparação de Assets PNG

Quando novos recursos visuais forem criados, recortados ou gerados para o jogo:

1. **Transparência Limpa:**
   - Nunca deixe fundos pretos residuais, bordas retangulares indesejadas ou padrões quadriculados falsos de transparência (*fake checkerboards*).
   - Use scripts de floodfill e corte baseado em alfa para garantir contornos nítidos e bordas limpas.
2. **Contorno Pixel Art (Outlines):**
   - Os personagens e elementos principais devem possuir contornos escuros marcados (cor carvão `#120B08` ou marrom escuro `#321B10`).
   - Evite antialiasing borrado em sprites; preserve pixels sólidos com `roundPixels: true`.
3. **Organização de Diretórios de Assets:**
   - Imagens públicas do jogo: `public/assets/<categoria>/` (ex: `public/assets/intro/`, `public/assets/select_characters/`, `public/assets/cards/`).
   - Imagens de trabalho/originais: `src/assets/<categoria>/`.

---

## 2. Construção de Telas e Cenas Phaser 3

Cada cena cinematográfica ou de menu deve seguir a estrutura:

```typescript
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { THEME } from '../ui/theme/tokens';

export class CustomMenuScene extends Phaser.Scene {
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('CustomMenuScene');
  }

  create() {
    const { width, height } = this.scale;
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // Montar camadas na ordem correta
    this.createBackground();
    this.createDecorFrame();
    this.createContent();
    this.createArcadeHUD();

    // Redimensionamento reativo
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
```

---

## 3. Padrão de Animação e Iluminação

- **Halos de Lanterna:** Devem ser gerados via textura radial com gradiente de alfa e aplicados com `setBlendMode(Phaser.BlendModes.ADD)`.
- **Efeitos Ambientais:** Partículas de poeira do deserto flutuando e baforadas de fumaça marrom/cinza saindo das chaminés.
- **Entrada de Elementos:** Utilize tweens elásticos (`Back.easeOut` ou `Bounce.easeOut`) para dar impacto e peso aos elementos visuais de arcade.
- **Blinking:** Textos "PRESS START", "READY" ou setas de seleção devem piscar de forma fluida ou alternar brilho para emular telas de atração de fliperama.
