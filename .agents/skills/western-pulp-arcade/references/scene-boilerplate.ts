import Phaser from 'phaser';
import { sounds } from '../../../../src/audio/SoundManager';
import { THEME } from '../../../../src/ui/theme/tokens';

/**
 * Boilerplate canônico para telas cinematográficas e menus em SUNSET SURVIVORS.
 * Padrão: WESTERN PULP '98 (Phaser 3 + TypeScript).
 */
export class WesternSceneBoilerplate extends Phaser.Scene {
  private rootContainer!: Phaser.GameObjects.Container;
  private isTransitioning: boolean = false;

  constructor() {
    super('WesternSceneBoilerplate');
  }

  create() {
    this.isTransitioning = false;
    const { width, height } = this.scale;

    // 1. Fundo escuro base para evitar vazamento de tela
    const bg = this.add.graphics();
    bg.fillStyle(0x070403, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Container de referência lógica (1536 x 1024)
    const REF_W = 1536;
    const REF_H = 1024;
    const scale = Math.min(width / REF_W, height / REF_H);

    this.rootContainer = this.add.container(width / 2, height / 2);
    this.rootContainer.setScale(scale);

    // 3. Montagem das Camadas Canônicas
    this.createBackdrop();
    this.createSaloonFrame();
    this.createMainContent();
    this.createInteractiveElements();
    this.createArcadeHUD();
    this.createAtmosphericEffects();

    // 4. Redimensionamento reativo
    this.scale.on('resize', this.handleResize, this);
  }

  private createBackdrop() {
    // Camada 1 & 2: Céu crepuscular e silhuetas de cânion
  }

  private createSaloonFrame() {
    // Camada 3: Vigas de madeira, colunas, cartaz WANTED e lanternas
  }

  private createMainContent() {
    // Camada 4 & 5: Personagens ilustrados ou cartas de procurado
  }

  private createInteractiveElements() {
    // Camada 6: Botões táteis com feedback sonoro e flash
  }

  private createArcadeHUD() {
    // Camada 7: 1UP, HIGH, CREDIT e Copyright
  }

  private createAtmosphericEffects() {
    // Camada 8: Poeira flutuando e halos de lanternas
  }

  private advanceToNextScene(targetScene: string) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Feedback audiovisual
    sounds.playRevolver();
    this.cameras.main.flash(200, 255, 235, 170);
    this.cameras.main.fade(500, 0, 0, 0);

    this.time.delayedCall(550, () => {
      this.scale.off('resize', this.handleResize, this);
      this.scene.start(targetScene);
    });
  }

  private handleResize() {
    if (!this.rootContainer || !this.scene.isActive()) return;
    const { width, height } = this.scale;
    const scale = Math.min(width / 1536, height / 1024);
    this.rootContainer.setPosition(width / 2, height / 2);
    this.rootContainer.setScale(scale);
  }
}
