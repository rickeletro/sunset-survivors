# Progressão de sete minutos

Balanceamento adaptado aos princípios de survivors: escolhas frequentes no início, pressão crescente, montagem de build e evolução. Não replica os números internos do Vampire Survivors. Os valores são uma base verificável; dificuldade percebida e duração real dos bosses ainda precisam de telemetria de partidas.

## Ritmo e combate

- Todas as fases convocam seu boss em 420 segundos. A luta continua depois de 7:00.
- Ondas a cada 850 ms, com alvo inicial de 46 inimigos na fase 1, crescendo com o tempo. O limite global de 240 permanece.
- Primeiro grupo especial em 30 s; primeiro elite em 55 s. Os eventos temáticos e as pausas de pressão foram preservados.
- HP por fase: 22.000; 32.000; 44.000; 28.000 por irmão (56.000 total); 65.000; 80.000; 100.000; 135.000.
- Evoluções exigem arma no nível 5, passiva compatível e pelo menos 4 minutos. O DPS direto sobe aproximadamente 1,2–2 vezes, além dos efeitos especiais.

## XP e ouro

Os dois primeiros avanços custam 25 e 40 XP. A partir do nível 3, o custo é `70 + 25 × (nível - 3) + 3 × (nível - 3)²`: 70, 98, 132, chegando a 392 XP no nível 10 e 1.362 XP no nível 20. A exigência cresce progressivamente para espaçar as escolhas posteriores. Recompensas grandes preservam o XP excedente e apresentam uma escolha por vez. Builds têm até seis armas e seis passivas; a seleção prioriza ao menos uma melhoria já equipada quando disponível. Uma build completa recebe opção de ouro ou cura.

Ouro é creditado ao coletar o loot, uma única vez. Bandidos comuns concedem $1, elite $25 e boss $200 + fase × $50. Vitória concede $100 + fase × $50. O placar mostra o bônus realmente creditado; registros de resultado têm identificador para impedir duplicação ao revisitar telas. Novos perfis começam com estatísticas zeradas; saves existentes são preservados.

A regeneração máxima do whiskey é 2 HP/s. Seu bônus máximo é +60 HP no total; o bandolier reduz o intervalo pelo percentual anunciado. Ouro continua sendo recompensa/estatística: este ajuste não cria uma loja ou economia de compras permanentes.

## Leitura das armas

Cada nível muda cor, tamanho e rastro das balas, mantendo diferenças entre revólver, rifle e espingarda. O chicote desfere golpes animados à frente e atrás, com colisão ao longo da corda e um acerto por inimigo por golpe. Molotov viaja em arco, quebra no destino e deixa chamas animadas no chão; quantidade, área e duração respondem aos upgrades. Dinamite também respeita a quantidade descrita. Efeitos têm limites e limpeza no encerramento da cena.

## Música por fase

`src/audio/musicManifest.json` define arquivos e prompts. Fases 1, 2 e 6 usam respectivamente Galloping West, Frontier Pulse e Dusty Frontier; os dois últimos arquivos já estavam disponíveis na pasta de áudio. As demais usam fallback. Falha ao carregar uma faixa também retorna ao fallback.

A plataforma oficial é https://platform.suno.com/. Não foi encontrado conector Suno instalado nem credencial de API configurada nesta sessão. Nenhuma música foi gerada pela API. Os endpoints autenticados não foram presumidos; a geração automática depende de acesso e documentação da conta. Chaves não devem ir para o frontend, Git ou chat.

- `npm run music:prompts`: mostra os prompts instrumentais pendentes.
- `npm run music:import -- --stage 3 --file /caminho/faixa.mp3`: valida o cabeçalho, copia o áudio e atualiza o manifesto; aceita MP3, Ogg ou WAV e recusa sobrescrita.

## Verificação

Testes automatizados cobrem curva de XP, evoluções, HP dos bosses, cooldown, bônus de vida, escolhas consecutivas, loot, colisão e descarte do chicote, fogo em frames lentos, tiros extras, cache de texturas e seleção/fallback musical. Não foram feitos testes manuais de gameplay ou capturas de tela, conforme as regras do projeto.
