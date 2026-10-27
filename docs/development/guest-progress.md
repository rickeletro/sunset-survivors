# Progresso de visitante

Sem cadastro, o jogo mantém dinheiro permanente, personagens comprados, estatísticas e identificadores de partidas já creditadas no LocalStorage existente: `sunset_survivors_stats_v1`. A carteira é compartilhada entre fases, serviços e personagens: começa com o saldo salvo e persiste todo dinheiro coletado e gasto durante o combate. Sair pelo pause, reiniciar, morrer ou reabrir o jogo preserva esse saldo. Somente buffs, loot não coletado e níveis da build continuam temporários. Resultados concedem o bônus de tempo/vitória uma vez, sem recreditar moedas já persistidas.

O início do gameplay resolve o personagem pelo catálogo e confere a propriedade salva. Bob/Cormano bloqueados são substituídos por Billy; o painel local de testes continua podendo experimentar personagens, sem salvar recompensas ou desbloqueios. A tela de seleção continua exigindo compra antes de iniciar uma partida com um personagem pago.

Antes de comprar ou creditar resultados, o gerenciador relê o estado persistido. A compra grava débito e desbloqueio juntos. Uma repetição encontra o personagem já comprado e não cobra novamente. Uma falha de escrita desfaz a operação; depósitos que não puderam ser persistidos também não ficam disponíveis em memória para compras.

`MENU → SAVE PROGRESS` mostra o banco e oferece `EXPORT SAVE` e `IMPORT SAVE`. O JSON inclui identificação do jogo, versão, data e o estado persistente. A importação valida o formato e só substitui o save após `REPLACE LOCAL PROGRESS`; não soma saldos. O histórico de depósitos vai junto, impedindo novo crédito de resultados já registrados. A importação fica indisponível durante uma partida. Falhas e arquivos inválidos preservam o estado anterior.

LocalStorage pertence ao endereço e ao navegador. Localhost e GitHub Pages têm saves distintos. Exportar/importar permite transferir entre eles. Apagar os dados do site remove o save local, portanto o arquivo exportado é o backup portátil. Não há autenticação ou sincronização remota; nenhuma senha é solicitada ou armazenada. Um futuro serviço de contas precisará de autenticação e validação de transações no servidor. Um save local é controlado pelo usuário e não oferece proteção contra edição deliberada, nem deve comprovar saldo num futuro backend.

Validação: 576 testes passaram, incluindo compra com saldo zero, saldo desatualizado entre gerenciadores, falhas de armazenamento, restauração de backup, depósito único, bloqueio na entrada do gameplay e navegação do painel. TypeScript, build e auditoria de assets passaram. Nenhum gameplay manual ou screenshot foi usado.

Atualização da carteira compartilhada: o HUD de combate inicia com o banco salvo. Serviços e loot alteram esse mesmo saldo imediatamente. Coletas em lote gravam uma vez por frame, preservando o limite de processamento do Magnet. Saída pelo pause não exige finalizar resultados. O modo desenvolvedor usa uma cópia inicial do saldo, sem persistir dinheiro de teste.
