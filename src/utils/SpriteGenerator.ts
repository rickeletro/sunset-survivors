import Phaser from 'phaser';

/**
 * Procedural 16-bit Pixel Art Texture Generator
 * Generates crisp, authentic pixel art sprites for players, enemies, bullets, and items
 */
export class SpriteGenerator {
  public static createEconomyDrops(scene: Phaser.Scene): void {
    if (scene.textures.exists('drop_moneybag')) return;
    const canvas = scene.textures.createCanvas('drop_moneybag',24,28);
    if (!canvas) return;
    const ctx=canvas.getContext();
    ctx.fillStyle='#120B08'; ctx.fillRect(6,1,12,6); ctx.fillRect(3,9,18,16); ctx.fillRect(6,25,12,2);
    ctx.fillStyle='#603719'; ctx.fillRect(5,10,14,14); ctx.fillRect(8,2,8,7);
    ctx.fillStyle='#F2D49A'; ctx.fillRect(7,11,4,10);
    ctx.fillStyle='#FFC52A'; ctx.fillRect(5,7,14,3); ctx.fillRect(13,14,4,6); ctx.fillRect(11,16,8,2);
    canvas.refresh();
  }
  public static generateAll(scene: Phaser.Scene) {
    if (scene.textures.exists('player_steve')) return;

    this.createPlayerTextures(scene);
    this.createEnemyTextures(scene);
    this.createBossTexture(scene);
    this.createProjectileTextures(scene);
    this.createDropTextures(scene);
    this.createVfxTextures(scene);
  }

  // 1. Players: Steve, Billy, Bob, Cormano
  private static createPlayerTextures(scene: Phaser.Scene) {
    const chars = [
      { id: 'steve', hat: '#ff2a85', shirt: '#ffffff', vest: '#2a4480', pants: '#ffe600', boots: '#ff2a85' },
      { id: 'billy', hat: '#0066ff', shirt: '#f8fafc', vest: '#0052cc', pants: '#f8fafc', boots: '#0066ff' },
      { id: 'bob', hat: '#10b981', shirt: '#6ee7b7', vest: '#065f46', pants: '#10b981', boots: '#f59e0b' },
      { id: 'cormano', hat: '#9333ea', shirt: '#e11d74', vest: '#f59e0b', pants: '#dc2626', boots: '#3b82f6', isPoncho: true },
    ];

    chars.forEach((c) => {
      // 48x48 character sprite
      const canvas = scene.textures.createCanvas(`player_${c.id}`, 48, 48);
      if (!canvas) return;
      const ctx = canvas.getContext();

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(24, 44, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots
      ctx.fillStyle = c.boots;
      ctx.fillRect(16, 38, 6, 6);
      ctx.fillRect(26, 38, 6, 6);
      // Spurs
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(14, 41, 3, 3);
      ctx.fillRect(31, 41, 3, 3);

      // Pants
      ctx.fillStyle = c.pants;
      ctx.fillRect(17, 28, 5, 11);
      ctx.fillRect(26, 28, 5, 11);

      // Gun Holster / Belt
      ctx.fillStyle = '#78350f';
      ctx.fillRect(15, 27, 18, 3);
      ctx.fillStyle = '#f5c518';
      ctx.fillRect(23, 27, 3, 3); // buckle

      if (c.isPoncho) {
        // Cormano's iconic Poncho
        ctx.fillStyle = '#e11d74';
        ctx.beginPath();
        ctx.moveTo(14, 18);
        ctx.lineTo(34, 18);
        ctx.lineTo(37, 28);
        ctx.lineTo(11, 28);
        ctx.closePath();
        ctx.fill();

        // Poncho geometric zig-zag pattern
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(13, 22, 22, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(12, 25, 24, 2);
      } else {
        // Shirt & Vest
        ctx.fillStyle = c.shirt;
        ctx.fillRect(18, 18, 12, 10);
        ctx.fillStyle = c.vest;
        ctx.fillRect(16, 18, 4, 10);
        ctx.fillRect(28, 18, 4, 10);
      }

      // Hands & Guns
      ctx.fillStyle = '#fbcfe8'; // skin
      ctx.fillRect(12, 24, 4, 4);
      ctx.fillRect(32, 24, 4, 4);
      // Gun metals
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, 22, 4, 3);
      ctx.fillRect(34, 22, 4, 3);

      // Head & Face
      ctx.fillStyle = '#fbcfe8'; // skin tone
      ctx.fillRect(20, 11, 8, 8);
      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(22, 14, 2, 2);
      ctx.fillRect(26, 14, 2, 2);

      if (c.id === 'cormano') {
        // Cormano mustache & beard
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(21, 16, 7, 3);
      }

      // Cowboy Hat
      ctx.fillStyle = c.hat;
      if (c.isPoncho) {
        // Wide Sombrero
        ctx.beginPath();
        ctx.ellipse(24, 10, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24'; // sombrero brim band
        ctx.beginPath();
        ctx.ellipse(24, 10, 16, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = c.hat;
        ctx.fillRect(19, 4, 10, 6);
      } else {
        // Classic Stetson hat
        ctx.beginPath();
        ctx.ellipse(24, 11, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(19, 5, 10, 6);
      }

      canvas.refresh();
    });
  }

  // 2. Enemies: Bandido, Snake, Dynamiter, Heavy Desperado
  private static createEnemyTextures(scene: Phaser.Scene) {
    // A) Standard Bandido
    const canvasBandit = scene.textures.createCanvas('enemy_bandit', 40, 40);
    if (canvasBandit) {
      const ctx = canvasBandit.getContext();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(20, 36, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots & Pants
      ctx.fillStyle = '#451a03';
      ctx.fillRect(14, 26, 4, 9);
      ctx.fillRect(22, 26, 4, 9);

      // Torso & Poncho/vest
      ctx.fillStyle = '#78350f';
      ctx.fillRect(13, 16, 14, 11);
      ctx.fillStyle = '#dc2626'; // red bandana
      ctx.fillRect(16, 14, 8, 4);

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(16, 10, 8, 6);
      // Hat
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(20, 9, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(16, 4, 8, 5);

      // Gun
      ctx.fillStyle = '#64748b';
      ctx.fillRect(26, 18, 5, 3);
      canvasBandit.refresh();
    }

    // B) Desert Rattlesnake
    const canvasSnake = scene.textures.createCanvas('enemy_snake', 36, 36);
    if (canvasSnake) {
      const ctx = canvasSnake.getContext();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(18, 30, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Coiled Snake body
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(18, 20, 10, 0, Math.PI * 2);
      ctx.fill();

      // Scale patterns
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(14, 16, 3, 3);
      ctx.fillRect(19, 17, 3, 3);
      ctx.fillRect(16, 21, 3, 3);

      // Snake Head & Fangs
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(22, 12, 7, 6);
      ctx.fillStyle = '#ef4444'; // red eyes
      ctx.fillRect(26, 13, 2, 2);
      // Forked red tongue
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(29, 14, 4, 1);
      canvasSnake.refresh();
    }

    // C) Dynamiter Outlaw
    const canvasDynamiter = scene.textures.createCanvas('enemy_dynamiter', 44, 44);
    if (canvasDynamiter) {
      const ctx = canvasDynamiter.getContext();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(22, 39, 13, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Blue striped inmate/outlaw trousers
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(15, 28, 5, 11);
      ctx.fillRect(24, 28, 5, 11);

      // Torso
      ctx.fillStyle = '#f97316';
      ctx.fillRect(15, 18, 14, 11);

      // Head & eye patch
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(18, 11, 8, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(19, 13, 3, 3); // eye patch
      ctx.fillStyle = '#451a03';
      ctx.fillRect(16, 7, 12, 5); // cap

      // Raised hand holding burning dynamite stick
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(30, 8, 4, 10);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(32, 6, 3, 0, Math.PI * 2);
      ctx.fill();
      canvasDynamiter.refresh();
    }

    // D) Heavy Desperado (Miniboss / Heavy)
    const canvasHeavy = scene.textures.createCanvas('enemy_heavy', 52, 52);
    if (canvasHeavy) {
      const ctx = canvasHeavy.getContext();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(26, 46, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bulky legs
      ctx.fillStyle = '#292524';
      ctx.fillRect(17, 34, 7, 12);
      ctx.fillRect(28, 34, 7, 12);

      // Massive chest & leather coat
      ctx.fillStyle = '#451a03';
      ctx.fillRect(14, 19, 24, 16);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(18, 20, 16, 15);

      // Bandolier across chest
      ctx.fillStyle = '#f5c518';
      ctx.fillRect(16, 22, 3, 3);
      ctx.fillRect(20, 25, 3, 3);
      ctx.fillRect(24, 28, 3, 3);

      // Head, beard, hat
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(21, 11, 10, 8);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(20, 15, 12, 5); // heavy beard
      ctx.fillStyle = '#78350f';
      ctx.fillRect(17, 7, 18, 5);
      ctx.fillRect(20, 2, 12, 6);

      // Heavy Shotgun
      ctx.fillStyle = '#475569';
      ctx.fillRect(34, 24, 12, 5);
      canvasHeavy.refresh();
    }
  }

  // 3. Stage Boss: Simon Greedwell
  private static createBossTexture(scene: Phaser.Scene) {
    const canvas = scene.textures.createCanvas('boss_greedwell', 64, 64);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Red aura shadow
    ctx.fillStyle = 'rgba(200, 29, 29, 0.4)';
    ctx.beginPath();
    ctx.ellipse(32, 58, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold boots
    ctx.fillStyle = '#b45309';
    ctx.fillRect(22, 48, 8, 10);
    ctx.fillRect(34, 48, 8, 10);
    ctx.fillStyle = '#f5c518'; // gold spurs
    ctx.fillRect(19, 52, 4, 4);
    ctx.fillRect(41, 52, 4, 4);

    // Red Suit Pants
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(22, 36, 9, 13);
    ctx.fillRect(33, 36, 9, 13);

    // Gold Chain & Belt
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(20, 34, 24, 4);

    // Chubby flamboyant bright RED SUIT JACKET
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(32, 28, 16, 0, Math.PI * 2);
    ctx.fill();

    // White Shirt with Gold Bolo Tie
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(27, 18);
    ctx.lineTo(37, 18);
    ctx.lineTo(32, 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5c518';
    ctx.beginPath();
    ctx.arc(32, 22, 3, 0, Math.PI * 2); // bolo jewel
    ctx.fill();

    // Fat Cheeks / Face
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.arc(32, 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Smirking Mouth & Mustache
    ctx.fillStyle = '#451a03';
    ctx.fillRect(27, 18, 10, 3);
    // Cigar
    ctx.fillStyle = '#78350f';
    ctx.fillRect(36, 19, 5, 2);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(41, 19, 2, 2); // burning tip

    // Red Outlaw Cowboy Hat with Gold Band
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(32, 11, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(23, 7, 18, 3);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(24, 2, 16, 7);

    // Dual Gold Revolvers in hands
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(10, 26, 8, 4);
    ctx.fillRect(46, 26, 8, 4);

    canvas.refresh();
  }

  // 4. Projectiles: Bullets, buckshot, dynamite, flame patch
  private static createProjectileTextures(scene: Phaser.Scene) {
    // Bullet (Yellow glowing tracer)
    const cBullet = scene.textures.createCanvas('proj_bullet', 12, 6);
    if (cBullet) {
      const ctx = cBullet.getContext();
      ctx.fillStyle = '#f5c518';
      ctx.fillRect(0, 1, 12, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 2, 6, 2);
      cBullet.refresh();
    }

    // Shotgun Buckshot
    const cPellet = scene.textures.createCanvas('proj_pellet', 8, 8);
    if (cPellet) {
      const ctx = cPellet.getContext();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(3, 3, 2, 2);
      cPellet.refresh();
    }

    // Winchester Penetrator Bullet
    const cRifle = scene.textures.createCanvas('proj_rifle', 18, 6);
    if (cRifle) {
      const ctx = cRifle.getContext();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 1, 18, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 2, 12, 2);
      cRifle.refresh();
    }

    // Lobbed TNT Stick
    const cTnt = scene.textures.createCanvas('proj_dynamite', 16, 8);
    if (cTnt) {
      const ctx = cTnt.getContext();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(2, 1, 12, 6);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(4, 1, 2, 6);
      ctx.fillRect(10, 1, 2, 6);
      // Spark
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14, 0, 2, 2);
      cTnt.refresh();
    }

    // Ground Fire Patch (Molotov)
    const cFire = scene.textures.createCanvas('proj_fire', 36, 36);
    if (cFire) {
      const ctx = cFire.getContext();
      const grad = ctx.createRadialGradient(18, 18, 2, 18, 18, 18);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#f97316');
      grad.addColorStop(0.8, '#dc2626');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(18, 18, 18, 0, Math.PI * 2);
      ctx.fill();
      cFire.refresh();
    }

    // Spinning Lasso
    const cLasso = scene.textures.createCanvas('proj_lasso', 28, 28);
    if (cLasso) {
      const ctx = cLasso.getContext();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, 14, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f5c518';
      ctx.fillRect(12, 2, 4, 4);
      cLasso.refresh();
    }
  }

  // 5. Drops: Gold Nugget, Silver Badge, Whiskey Canteen
  private static createDropTextures(scene: Phaser.Scene) {
    // Gold Nugget (Small XP)
    const cGold = scene.textures.createCanvas('drop_gold', 16, 16);
    if (cGold) {
      const ctx = cGold.getContext();
      ctx.fillStyle = '#f5c518';
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(14, 6);
      ctx.lineTo(13, 13);
      ctx.lineTo(5, 14);
      ctx.lineTo(2, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(5, 5, 4, 4);
      cGold.refresh();
    }

    // Silver Sheriff Badge (Large XP)
    const cBadge = scene.textures.createCanvas('drop_badge', 20, 20);
    if (cBadge) {
      const ctx = cBadge.getContext();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(10, 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 5, 2, 10);
      ctx.fillRect(5, 9, 10, 2);
      cBadge.refresh();
    }

    // Whiskey Canteen (Health Drop)
    const cWhiskey = scene.textures.createCanvas('drop_whiskey', 18, 18);
    if (cWhiskey) {
      const ctx = cWhiskey.getContext();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(9, 11, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e'; // green cross
      ctx.fillRect(8, 8, 2, 6);
      ctx.fillRect(6, 10, 6, 2);
      ctx.fillStyle = '#fde047'; // cork
      ctx.fillRect(8, 3, 2, 3);
      cWhiskey.refresh();
    }
  }

  // 6. VFX Textures: Hit Sparks & Explosions
  private static createVfxTextures(scene: Phaser.Scene) {
    const cSpark = scene.textures.createCanvas('vfx_spark', 12, 12);
    if (cSpark) {
      const ctx = cSpark.getContext();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(5, 0, 2, 12);
      ctx.fillRect(0, 5, 12, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 4, 4);
      cSpark.refresh();
    }
  }
}
