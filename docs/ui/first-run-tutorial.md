# Estreia de pistoleiro

A primeira entrada na fase 1 ensina os controles dentro do próprio cenário, com pergaminho, placa de madeira, tipografia do projeto e marcadores dourados animados. O cenário e o personagem continuam visíveis.

1. O jogador anda 56 pixels usando WASD/setas ou arrastando o dedo à esquerda no celular. O relógio, o diretor de hordas e os eventos da fase aguardam.
2. Surge um bandido inofensivo, que demonstra a arma e os projéteis reais do protagonista. A confirmação dos tiros automáticos permanece por 2,2 segundos após o primeiro disparo.
3. A prática termina, suas entidades são removidas e a fase começa. A primeira coleta real de XP apresenta uma dica de melhorias por cinco segundos.

O treino não concede kills, ouro, loot ou progresso ao diretor. Não há dano ao jogador durante a prática. As fórmulas, armas, durações das fases e a ordem de atualização do combate normal são preservadas.

## Preferência e acesso

O botão `PULAR` e a tecla T encerram a prática imediatamente. Concluir ou pular grava apenas `sunset_survivors_controls_v1 = done`, separado das estatísticas existentes. Quando o armazenamento do navegador é bloqueado, a conclusão é lembrada na sessão atual. As próximas partidas recebem um lembrete não bloqueante de 4,5 segundos; fases posteriores à primeira também usam só o lembrete.

Para repetir o teste de primeira visita, remover essa chave no armazenamento do navegador e recarregar a página, preservando as demais chaves.

## Teclado e toque

O teclado usa WASD/setas. Mira e disparos são automáticos; cliques do mouse não controlam movimento nem disparo. O joystick virtual aceita um único dedo e ignora toques sobre botões. Soltar o dedo, pausar ou sair da janela libera o joystick. A instrução se adapta ao dispositivo de entrada usado, inclusive em dispositivos híbridos.

O painel tem apresentação compacta para celulares e para telas baixas em paisagem, preservando leitura e a região central do jogador. O botão de pular mantém área interativa de 164 × 48 pixels. A pausa continua disponível durante o treino.

## Responsabilidades e validação

- `FirstRunTutorial.ts`: estados, progresso de movimento, confirmação do disparo, duração das dicas e persistência isolada.
- `FirstRunTutorialView.ts`: composição visual responsiva, anel direcional e opção de pular; remove listeners no shutdown.
- `GameScene`: integração com entradas reais, relógio/diretor, alvo de prática e coleta real de XP.

Vitest cobre estados, persistência bloqueada, isolamento das estatísticas, alvo de prática, colisões de projéteis durante a demonstração, bloqueio de ondas/dano, descarte de entidades, teclado/toque e apresentação em 320, 390, 640 e 1280 pixels de largura. Não foram feitas jogadas manuais nem screenshots do jogo.
