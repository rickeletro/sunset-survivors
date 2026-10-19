import Phaser from 'phaser';

export class WesternTransition {
  public static flashAndFade(
    scene: Phaser.Scene,
    targetScene: string,
    data?: object,
    onBeforeStart?: () => void
  ) {
    scene.cameras.main.flash(200, 255, 235, 170);
    scene.cameras.main.fade(450, 0, 0, 0);

    scene.time.delayedCall(480, () => {
      if (onBeforeStart) onBeforeStart();
      scene.scene.start(targetScene, data);
    });
  }

  public static fade(
    scene: Phaser.Scene,
    targetScene: string,
    data?: object,
    duration: number = 400
  ) {
    scene.cameras.main.fade(duration, 0, 0, 0);
    scene.time.delayedCall(duration + 40, () => {
      scene.scene.start(targetScene, data);
    });
  }
}
