# Frontier Feel — pesquisa e adaptação de survivors-like

## Referências e nível de evidência

Pesquisa em fontes oficiais, consultadas nesta implementação:

1. [Megabonk — página do desenvolvedor na Steam](https://store.steampowered.com/app/3405340/Megabonk/): descreve exploração de mapas gerados, upgrades de raridades variadas e combinações de habilidades de personagens e itens. Isso sustenta variedade de decisões e de resultados entre partidas; não prova isoladamente o motivo do sucesso.
2. [Megabonk — comunicados oficiais](https://steamcommunity.com/app/3405340/announcements/): as notas enfatizam informações úteis de build, legibilidade do loot, incentivos à exploração e correções de comandos involuntários ao abrir escolhas. Há uma lição de apresentação e controle além da quantidade de conteúdo.
3. [Undead Slayer Extreme — Arcadianos Juegos, Google Play](https://play.google.com/store/apps/details?id=com.arcadians.undeadhero&hl=en_US): referência confirmada pelo usuário. A descrição oficial destaca ataque automático, movimento simples, habilidades especiais, combos, melhorias de habilidades, equipamentos e chefes. O foco relevante é execução acessível com identidade e crescimento perceptível, não uma suposta estrutura de escolhas roguelite deste jogo.

A pesquisa inicial encontrou um homônimo da Enigma. Após o usuário informar o pacote `com.arcadians.undeadhero`, essa atribuição foi corrigida. Não atribuímos rerolls, esquiva com janela específica, geração de mapas ou economia roguelite ao Extreme: essas são decisões próprias desta adaptação ou aprendizados de Megabonk. A página do Extreme confirma movimentação por toque; mantivemos os controles existentes do nosso jogo, pois mudar cliques de interação para movimentação prejudicaria as construções.

As conclusões abaixo são hipóteses de design a partir de documentação pública, não resultados de uma sessão jogada, análise causal de retenção ou medição de dopamina. Aqui, “dopamina” é interpretada como antecipação de recompensa, feedback e percepção de domínio. É preciso telemetria e avaliação de jogadores para estabelecer o efeito real.

## Leitura específica de cada referência

**Undead Slayer Extreme:** o ataque automático reduz o esforço de mirar; posicionamento, habilidades e combos preservam a sensação de ação. A nossa interpretação é dar intenção ao movimento e diferenciar os quatro protagonistas com efeitos condicionais visíveis. A esquiva com assinatura e a sequência de eliminações são adaptações próprias dessa ideia. Não reproduzimos literalmente suas habilidades, personagens ou controles, nem afirmamos ter observado detalhes de combate não documentados.

**Megabonk:** raridade, sinergias, exploração e personagens distintos criam objetivos durante e entre partidas. A adaptação acrescenta direção à build com receitas reais de evolução, uma oportunidade limitada de renovar escolhas e um contrato opcional com recompensa e risco claros. A carteira persistente e os desbloqueios existentes continuam dando continuidade ao esforço entre partidas.

A hipótese central é combinar domínio do movimento, decisões de build e recompensas legíveis. Quantidade de personagens ou uma economia mais generosa, isoladamente, não garantem diversão. Por isso foram aprofundados os quatro heróis e os sistemas existentes, em vez de adicionar personagens apenas cosméticos ou moedas extras.

## O que traz diversão e o que foi adaptado

| Princípio | Por que tende a funcionar | Implementação faroeste |
|---|---|---|
| Movimento com decisão | O deslocamento vira parte da execução, com momentos de risco e escape | Esquiva de pistoleiro com direção imediata, colisão e recarga |
| Identidades jogáveis | A mesma arma/mapa pede comportamentos distintos conforme o herói | Quatro assinaturas: Quickdraw, Lawman, Steady Aim e Dust Kick |
| Escolhas com intenção | O jogador consegue buscar um plano e lidar com ofertas ruins | Duas renovações por fase e indicação da rota de evolução real |
| Recompensa conquistada | Há um objetivo curto e previsível, coam execução a cumprir | Hot Streak após uma sequência mantida de eliminações |
| Exploração e risco voluntário | O jogador decide desviar da rota e investir em um desafio | Contrato de suprimentos: prazo e guardas adicionais por um upgrade |
| Crescimento visível | O resultado da ação aparece com clareza sem soterrar o combate | Poeira de esquiva, impacto de Cormano, medidores e feedback agrupado de loot |
| Continuidade entre partidas | O esforço acumulado continua tendo utilidade | Carteira existente, serviços, Bob/Cormano e ranking continuam integrados |

A economia mantém os preços, saldo persistente e custos anteriores. As novidades não multiplicam dinheiro nem XP base, e não introduzem moeda adicional. Os cinco blocos de 120 segundos e os chefes existentes permanecem. O contrato acrescenta uma escolha no máximo por fase; os guardas extras ainda obedecem ao teto global de inimigos.

## Regras implementadas
a
Valores em `src/data/gunslingerStyle.ts`:

| Mecânica | Regra |
|---|---|
| Dodge | SPACE ou toque no painel; 110 unidades em 180 ms; recarga de 2,4 s |
| Janela de esquiva | 90 ms de proteção; respeita a janela de invulnerabilidade já ativa |
| Parede e construção | Trajeto subdividido em passos de até 8 unidades, resolvidos pelo WorldMap |
| Steve — Quickdraw | +18% de frequência de disparo por 1,3 s após esquivar |
| Billy — Lawman | +15 pontos percentuais de crítico por 1,8 s após esquivar; chance total limitada a 100% |
| Bob — Steady Aim | +18% de dano após 0,9 s parado; movimento, dano e esquiva reiniciam a preparação |
| Cormano — Dust Kick | Afasta até 20 inimigos comuns em raio de 115 por até 65 unidades; chefes e mini-bosses não são deslocados |
| Hot Streak | 15 eliminações mantendo no máximo 5 s entre elas; tomar dano desfaz a sequência |
| Recompensa da sequência | +10% de frequência por 8 s; novo disparo do bônus só após 30 s; combinação com Quickdraw limitada a 1,3× |
| Contrato High Stakes | Uma aceitação por fase, inclusive se falhar; adiciona até quatro guardas; prazo de 25 s |
| Execução do contrato | Usa a regra já existente de limpar a área e manter o acampamento por 8 s; progresso anterior é zerado ao aceitar |
| Prêmio do contrato | Recompensa normal dos suprimentos mais uma escolha de upgrade; sem multiplicador de dinheiro |
| Second Chancea | Duas renovações por fase; não concede o upgrade automaticamente; oferta idêntica não consome carga |

Todas as durações usam tempo ativo do combate. Pause, interiores e escolha de upgrade congelam os efeitos. O contrato não é ativado por simples passagem: requer clique próximo ou F, com os riscos descritos no marcador. A bússola conserva a aparência sem legendas e inclui o marcador de suprimentos. E continua reservado para construções.

O HUD informa recarga, sequência e assinatura. A seleção de personagens explica o traço; o painel de controles mostra os novos comandos. A rota de evolução usa o inventário e os requisitos existentes, inclusive o bloqueio até 4:00. Em telas lógicas estreitas, a dica auxiliar de rota é ocultada para não disputar espaço com a bússola; os upgrades e as regras continuam ativos.

No celular, o painel tocável fica no canto inferior direito, separado do joystick. O nome, preço e as regras de compra de personagens não foram alterados. R repete as ofertas somente dentro do Level Up; comandos mantidos por repetição não escolhem uma carta involuntariamente. O modal é reiniciado com os mesmos callbacks protegidos e o combate continua pausado.

## Limites e desempenho

- O novo HUD cria nove objetos persistentes por fase; o teste de 1.000 atualizações confirma que não cria objetos adicionais no loop.
- Um Graphics reutilizado desenha a poeira; não há emissor, câmera extra, shader, snapshots de personagem nem novos corpos físicos.
- Textos dos medidores atualizam em intervalos de 100 ms. Ganhos de XP/dinheiro são agrupados em um único texto reutilizado, com os valores efetivamente recebidos.
- Cormano pode mover no máximo 20 inimigos por esquiva. A movimentação não causa dano extra nem gera loot.
- A esquiva percorre no máximo 110 unidades, inclusive em um frame lento; não deixa deslocamento residual depois do término.
- O contrato usa StageEncounters e o pool/teto de spawn atuais; não há segundo gerenciador de ondas ou loot.
- Os sprites e animações direcionais PixelLab existentes foram reaproveitados. Os novos efeitos são camadas nativas. Não houve geração ou cobrança de assets PixelLab nesta tarefa; o MCP não expôs ferramentas PixelLab nesta sessão.

A calibração inicial prevê ganhos condicionais, em vez de multiplicadores permanentes de progressão. Em uso contínuo, Quickdraw representa cerca de +9,75% de disparos em média sobre a base; Hot Streak acrescenta no máximo aproximadamente 2,67% na média temporal isolada. As duas janelas podem coincidir, com teto de 1,3×. Bob precisa aceitar o risco de permanecer parado; Cormano obtém controle de espaço, não dano adicional. Essas contas não simulam eficiência real de combate.

## Validação

Testes automatizados cobrem distância em taxas de quadros diferentes, colisão, direção recém-pressionada, estados bloqueados, expiração de traços, crítico, sequência, cooldown, Cormano contra bosses e teto de alvos, ofertas repetidas, callbacks antigos, aceitação única de contrato, prazo e falha, progresso reiniciado, escolhas, limpeza de eventos e limites do HUD em desktop e touch.

Foram preservadas as verificações existentes de combate, cinco waves, cap de entidades, XP, loot, minigames, carteira, personagens e ranking. Não foi feito teste manual por browser, screenshot de gameplay ou medição de FPS. Diversão e dificuldade efetivas precisam ser acompanhadas com métricas de mortes, escolhas, uso da esquiva e sucesso em contratos em partidas reais.
