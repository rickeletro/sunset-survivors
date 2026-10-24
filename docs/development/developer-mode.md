# Modo desenvolvedor local

Execute `npm run dev` e abra `http://localhost:3000`.

- Tela inicial: botão **DESENVOLVEDOR [F2]**, no canto inferior direito.
- Acesso direto: `http://localhost:3000/?scene=developer`.
- Painel: clique em uma das oito fases ou use 1–8 / setas. C alterna personagem; D alterna dificuldade; Enter inicia a fase; Esc volta ao título.
- Durante a partida: Esc permite reiniciar a mesma fase ou voltar ao painel. Ao morrer ou concluir a fase, o painel reaparece com a seleção preservada.

O painel usa o combate, os inimigos, a economia e as interações normais. Apenas o tutorial é pulado. Essas partidas de teste não passam pelas telas que gravam estatísticas ou desbloqueios e não alteram a dificuldade salva da campanha.

A interface e a cena de desenvolvedor são habilitadas somente no build de desenvolvimento em localhost, 127.0.0.1 ou loopback IPv6. Uma versão compilada por `npm run build`, mesmo servida localmente, não habilita o painel. Acesso por endereço LAN também não habilita.

Validação automatizada: `npx tsc --noEmit`, `npm test`, `npm run build` e `npm run assets:check`. Não é necessário jogar via automação nem capturar screenshots para testar as regras.
