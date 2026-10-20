# PixelLab — bosses de SUNSET SURVIVORS

Entrega ajustada: começar no segundo boss, Hawkeye Hank Hatfield. Usar o Simon já criado pelo usuário. O ZIP de entrega exclui Simon e contém 8 personagens, 64 animações direcionais e 512 frames animados. A cópia de Simon gerada antes desta orientação foi preservada fora do ZIP.

Estado: concluído via MCP oficial do PixelLab. 9 personagens, 72 vistas base e 72 animações direcionais de 8 frames (576 frames animados). Pacotes baixados, extraídos e verificados em `public/assets/bosses/pixellab/`. IDs e respostas em `pixellab-bosses-jobs.json`. Assets ainda não integrados ao combate do jogo.

São 8 encontros, 9 personagens independentes e 72 ciclos direcionais. Os dois irmãos Smith devem ser gerados separadamente. Dark Horse inclui cavalo e cavaleiro no mesmo sprite.

## Especificação proposta

- Primeiro criar a aparência base; depois gerar as oito vistas do mesmo personagem; por fim animar cada vista com o prompt correspondente. Não pedir 72 personagens novos.
- Usar a referência visual de cada boss nas gerações. Partes ocultas pelo cartaz são reconstruções propostas.
- Lote criado em modo Pro com tamanho solicitado de 128 × 128 para todos, dentro do limite de criação desse modo. O PixelLab pode ampliar o canvas nas animações para acomodar o movimento. Preservar densidade de pixels entre personagens. Ajustar espaço para chicote, armas e cavalo sem cortar extremidades.
- Sugestão de ciclo: 8 frames, 10–12 fps, PNG transparente ou spritesheet com metadados. Animações solicitadas em modo v3, 8 frames, sem anexar o frame neutro inicial; taxa de reprodução sugerida para integração futura.
- Movimento no lugar: deslocamento mundial fica a cargo do jogo. Manter pivô dos pés/cascos e escala estáveis. Efeitos curtos de tiro podem fazer parte do ciclo; projéteis e explosões devem ser assets separados para integração futura.
- Ângulos abaixo usam a convenção do pedido: norte = 90°. Priorizar nomes e orientação na tela ao configurar a ferramenta, pois convenções numéricas podem variar.
- Chief Wigwam conserva dois machados. O ciclo solicitado é ataque corpo a corpo; o subtítulo do cartaz não substitui essa instrução.

## Simon Greedwell

Identificador: `simon-greedwell`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. A massive broad-shouldered older frontier landowner, weathered scowling face, thick dark beard with gray streaks, wide brown cowboy hat, burnt-red outer coat, rolled cream sleeves, dark brown leather vest, gun belt, dark trousers and heavy boots. Holds the long double-barreled shotgun shown in the reference in both hands. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied Simon Greedwell directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy powerful stride while aiming and firing his double-barreled shotgun forward. Animate a short muzzle flash at the barrels, strong shoulder recoil and recovery, keeping both hands correctly attached to the gun. Never replace it with a revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## Hawkeye Hank Hatfield

Identificador: `hawkeye-hank-hatfield`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. A lean rugged gunslinger with dark hair, mustache and stubble, black wide-brimmed hat with small gold ornaments, long dark-brown duster, charcoal sleeves, red neckerchief, cream shirt, gun belt, dark trousers and boots. Holds one large blue-black revolver in his right hand, as shown in the reference. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied Hawkeye Hank Hatfield directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run with a quick gunslinger stride, right arm extended toward the movement direction, repeatedly firing his single revolver. Show trigger squeeze, brief muzzle flash, wrist recoil and recovery. The left arm balances the run. Do not add a second handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## Dark Horse — The Iron Rider

Identificador: `dark-horse`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. One armored rider mounted on a powerful black horse: blackened steel plate armor with brass rivets, closed face-concealing helmet, red scarf and trailing red cape. Holds one long-barreled dark handgun in his right hand, as shown in the reference. The black horse has a dark flowing mane, metal face armor, brown leather bridle, brass fittings and an ornate dark saddle. Rider and horse form a single mounted sprite. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied Dark Horse — The Iron Rider directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. The horse gallops in place toward the specified direction with a coherent four-leg gait. The rider stays seated, aims and repeatedly fires his long-barreled handgun along the travel direction. Animate muzzle flash, recoil, horse mane and tail, and trailing red cape. Keep horse and rider together; never turn the rider into a walking character. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## The Smith Brothers — Red-shirt brother

Identificador: `smith-brother-red`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. One stocky demolition outlaw, black mustache and unruly black hair, broad brown cowboy hat, rolled-sleeve vivid red shirt, dark suspenders, large belt buckle, dark brown trousers and boots. Holds a bundle of red dynamite sticks with a lit fuse. Match the foreground brother in the stage 4 reference. This asset contains only this brother. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied The Smith Brothers — Red-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## The Smith Brothers — Gray-shirt brother

Identificador: `smith-brother-gray`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. One burly demolition outlaw with a thick black full beard, dark broad-brimmed hat, rolled-sleeve gray shirt, dark suspenders, dark trousers and heavy boots. Holds a bundle of red dynamite sticks with a lit fuse. Match the rear brother in the stage 4 reference. This asset contains only this brother, visibly distinct from his red-shirt partner. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied The Smith Brothers — Gray-shirt brother directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run while throwing bundled red dynamite forward along the travel direction. Animate wind-up, forward arm swing, release and follow-through, then draw a fresh bundle from the belt for the loop. Use tiny fuse sparks, no explosion inside the character animation. Do not add a firearm. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## El Greco

Identificador: `el-greco`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. A wiry mustached outlaw with long dark hair, a broad dark sombrero with gold and red trim, red jacket, dark shirt, gold neck ornaments, dark trousers and boots. Holds a long brown leather whip in his right hand and a round steel shield with brass studs on his left forearm, exactly as in the reference. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied El Greco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run while rotating the whip overhead, then uncoil and crack the whip forward along the travel direction, recovering into the next overhead rotation. Keep the whip connected to the right hand at all times. The left arm holds the round steel shield defensively. The shield must remain on the same arm in every direction; do not mirror equipment or add guns. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## Chief Wigwam

Identificador: `chief-wigwam`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. A muscular warrior with long black hair, a large feather headdress of cream feathers with black tips and red accents, a red-and-gold headband, red face paint, bare muscular arms, fringed red-brown leather clothing, leather wristbands, belt and boots. Carries two steel-headed tomahawks with wooden handles, one in each hand, as shown in the reference. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied Chief Wigwam directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run while delivering alternating forward slashing and chopping attacks with his two tomahawks. Show shoulder wind-up, clear blade arcs, follow-through and recovery. Keep both weapons held, one in each hand, throughout this requested melee loop. Do not substitute knives or guns; do not throw the axes in this animation. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## Paco Loco

Identificador: `paco-loco`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. A broad stocky mustached outlaw with a huge straw-colored sombrero with red and green decorative trim, yellow-brown clothing, crossed brass ammunition bandoliers, dark trousers and boots. Holds the large heavy black multi-barrel rotary machine gun visible in the reference with both hands. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied Paco Loco directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run with a heavy deliberate stride while holding and continuously firing the multi-barrel rotary gun along the movement direction. Animate rotating barrels, intermittent bright muzzle flashes, small sustained recoil and subtle ammunition movement. Preserve the multi-barrel weapon; never replace it with a rifle or revolver. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

## Sir Richard Rose

Identificador: `sir-richard-rose`

### Prompt de criação

```text
Production game sprite for SUNSET SURVIVORS, WESTERN PULP 98 visual identity. Rich late-1990s Neo Geo arcade pixel art, deliberate crisp pixel clusters, strong charcoal outlines, warm saturated colors, readable silhouettes and detailed clothing. Full-body character, fixed elevated three-quarter top-down camera for an eight-direction survivors-like game, consistent proportions and pixel density. Transparent background. No poster, typography, reward text, scenery, frame, ground plane or watermark. Palette anchors: #A51E16 #E52B20 #FF791C #FFC52A #F2D49A #603719 #321B10 #120B08 #572449; preserve reference-specific clothing and steel colors. Use the attached character reference for identity, not its poster layout. Reconstruct unseen legs and rear details consistently. An aristocratic older commander with swept-back silver hair, pronounced sideburns and mustache, severe face, long red military coat with gold epaulettes and trim, cream waistcoat, white shirt, red cravat, black gloves, dark trousers and polished boots. Holds the long ornate black-and-silver repeating rifle shown in the reference in both hands. Create one neutral combat-ready base pose facing south, weapon fully visible.
```

### east — 0°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving east: screen right; full right profile. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northeast — 45°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northeast: screen upper-right; rear three-quarter view. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### north — 90°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving north: screen up; full rear view showing the back of hat or headdress, jacket or armor. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### northwest — 135°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving northwest: screen upper-left; rear three-quarter view. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### west — 180°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving west: screen left; full left profile. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southwest — 225°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southwest: screen lower-left; front three-quarter view. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### south — 270°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving south: screen down; full front view showing face and frontal clothing details. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```

### southeast — 315°

```text
Animate the supplied Sir Richard Rose directional sprite. Preserve the established identity, colors, proportions, weapon design and anatomical handedness. Facing and moving southeast: screen lower-right; front three-quarter view. The weapon attack must follow that same screen direction. Run with an upright commanding posture while aiming and firing his long repeating rifle forward along the movement direction. Animate brief muzzle flash, controlled shoulder recoil and recovery. Keep the rifle stock against the shoulder and both hands on the weapon. Do not add a sword or replace the rifle with a handgun. Seamless looping locomotion combined with attack, in place with no net travel. Fixed elevated camera, no camera rotation or zoom. Consistent body scale and foot/hoof anchor; allow natural stride and recoil. Keep the entire body, all equipment and the full attack arc within every frame. Transparent background, crisp pixel art, no text, no scenery, no extra limbs, no sliding feet, no equipment swapping and no automatic mirroring that changes handedness. Rear views must genuinely show the back rather than a flipped front view.
```
