# Paleta Canônica de Cores — WESTERN PULP '98

## Tabela de Cores Canônicas

```css
:root {
  /* Cores Quentes de Pôr do Sol */
  --ss-red-burnt:     #A51E16;  /* Vermelho queimado - títulos e vigas */
  --ss-red-vibrant:   #E52B20;  /* Vermelho vibrante - destaque e perigo */
  --ss-orange-sunset: #FF791C;  /* Laranja poente - céu e fogo */
  --ss-gold-yellow:   #FFC52A;  /* Amarelo dourado - estrelas e 1UP */

  /* Texturas Orgânicas */
  --ss-parchment:     #F2D49A;  /* Pergaminho envelhecido - papel WANTED */
  --ss-wood-medium:   #603719;  /* Madeira média - tábuas e caixotes */
  --ss-wood-dark:     #321B10;  /* Madeira escura - vigas de saloon */

  /* Contrastes e Profundidade */
  --ss-charcoal:      #120B08;  /* Preto carvão - contornos e sombras */
  --ss-purple-mesa:   #572449;  /* Roxo das montanhas - cânion e penumbra */
}
```

## Aplicação por Componente

1. **Cartazes e Placas de Pergaminho:**
   - Fundo: `#F2D49A`
   - Borda externa: `#321B10` com rebites `#FFC52A`
   - Texto principal: `#A51E16` com tipografia Western
   - Texto de detalhes: `#120B08` ou `#603719`
2. **Moldura de Madeira:**
   - Vigas mestras: `#321B10`
   - Texturas de rachaduras e veios: `#120B08` e `#603719`
3. **Lanternas e Iluminação:**
   - Luz central: `rgba(255, 235, 120, 0.85)`
   - Halo intermediário: `rgba(255, 170, 30, 0.45)`
   - Penumbra: `rgba(255, 100, 10, 0.15)`
   - Modo de mistura: `Phaser.BlendModes.ADD`
